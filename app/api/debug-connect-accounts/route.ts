import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUGGING STRIPE CONNECT ACCOUNTS ===');

    // Get all users with Stripe accounts
    const users = await (prisma as any).user.findMany({
      where: {
        stripeConnectAccountId: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        stripeConnectAccountId: true,
        isVerified: true,
        createdAt: true
      }
    });

    console.log(`Found ${users.length} users with Stripe accounts`);

    const accountDetails = [];

    for (const user of users) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
        
        // Check for problematic configurations
        const hasCardPayments = account.capabilities?.card_payments === 'active' || 
                               account.capabilities?.card_payments === 'pending';
        const hasTransfers = account.capabilities?.transfers === 'active' || 
                            account.capabilities?.transfers === 'pending';
        const serviceAgreement = (account as any).tos_acceptance?.service_agreement;
        const isFullServiceAgreement = serviceAgreement === 'full';
        
        // Check requirements
        const hasRequirements = (account.requirements?.currently_due?.length || 0) > 0;
        const hasPastDue = (account.requirements?.past_due?.length || 0) > 0;
        
        const accountInfo = {
          userId: user.id,
          email: user.email,
          accountId: user.stripeConnectAccountId,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          accountDetails: {
            type: account.type,
            country: account.country,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            capabilities: account.capabilities,
            serviceAgreement: serviceAgreement,
            hasRequirements: hasRequirements,
            currentlyDue: account.requirements?.currently_due || [],
            pastDue: account.requirements?.past_due || [],
            hasCardPayments: hasCardPayments,
            hasTransfers: hasTransfers,
            isFullServiceAgreement: isFullServiceAgreement,
            // Flags for troubleshooting
            needsNewAccount: hasCardPayments || isFullServiceAgreement || hasPastDue,
            kycIssues: {
              hasCardPayments,
              isFullServiceAgreement,
              hasPastDue,
              hasRequirements
            }
          }
        };

        accountDetails.push(accountInfo);
        
        console.log(`Account ${user.stripeConnectAccountId}:`, {
          email: user.email,
          hasCardPayments,
          serviceAgreement,
          hasRequirements,
          needsNewAccount: accountInfo.accountDetails.needsNewAccount
        });

      } catch (error) {
        console.error(`Error retrieving account ${user.stripeConnectAccountId}:`, error);
        accountDetails.push({
          userId: user.id,
          email: user.email,
          accountId: user.stripeConnectAccountId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Summary
    const problematicAccounts = accountDetails.filter(acc => 'accountDetails' in acc && acc.accountDetails?.needsNewAccount);
    const workingAccounts = accountDetails.filter(acc => 'accountDetails' in acc && acc.accountDetails && !acc.accountDetails.needsNewAccount);

    console.log(`Summary: ${workingAccounts.length} working accounts, ${problematicAccounts.length} problematic accounts`);

    return NextResponse.json({
      success: true,
      summary: {
        totalAccounts: accountDetails.length,
        workingAccounts: workingAccounts.length,
        problematicAccounts: problematicAccounts.length
      },
      accounts: accountDetails,
      problematicAccounts: problematicAccounts,
      recommendations: {
        message: "Accounts with card_payments capability or 'full' service agreement need to be recreated",
        action: "Create new Express accounts with only transfers capability and 'recipient' service agreement"
      }
    });

  } catch (error) {
    console.error('Error debugging Connect accounts:', error);
    return NextResponse.json(
      {
        error: 'Failed to debug Connect accounts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
