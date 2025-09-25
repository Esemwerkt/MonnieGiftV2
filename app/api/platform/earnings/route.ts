import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Platform earnings API called');
    
    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user is admin
    if (decoded.email !== 'enes@semwerkt.nl') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }
    
    // Check if platformFee table exists by trying to count records
    try {
      const count = await (prisma as any).platformFee.count();
      console.log('Platform fees count:', count);
    } catch (countError) {
      console.error('Error counting platform fees:', countError);
      return NextResponse.json({
        totalEarnings: 0,
        totalProcessed: 0,
        totalPending: 0,
        recentEarnings: 0,
        earningsByCurrency: {},
        platformFees: [],
        summary: {
          totalFees: 0,
          processedFees: 0,
          pendingFees: 0,
        }
      });
    }
    
    // Get all platform fees
    let platformFees;
    try {
      platformFees = await (prisma as any).platformFee.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          gift: {
            select: {
              id: true,
              amount: true,
              currency: true,
              senderEmail: true,
              recipientEmail: true,
              createdAt: true,
            }
          }
        }
      });
    } catch (error) {
      console.error('Error with include, trying without gift relation:', error);
      // If include fails, try without the gift relation
      platformFees = await (prisma as any).platformFee.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    // Calculate totals
    const totalEarnings = platformFees.reduce((sum: number, fee: any) => sum + fee.amount, 0);
    const totalProcessed = platformFees.filter((fee: any) => fee.isProcessed).reduce((sum: number, fee: any) => sum + fee.amount, 0);
    const totalPending = totalEarnings - totalProcessed;

    // Group by currency
    const earningsByCurrency = platformFees.reduce((acc: any, fee: any) => {
      const currency = fee.currency;
      if (!acc[currency]) {
        acc[currency] = {
          total: 0,
          processed: 0,
          pending: 0,
          count: 0
        };
      }
      acc[currency].total += fee.amount;
      acc[currency].processed += fee.isProcessed ? fee.amount : 0;
      acc[currency].pending += fee.isProcessed ? 0 : fee.amount;
      acc[currency].count += 1;
      return acc;
    }, {} as Record<string, { total: number; processed: number; pending: number; count: number }>);

    // Recent earnings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEarnings = platformFees
      .filter((fee: any) => fee.createdAt >= thirtyDaysAgo)
      .reduce((sum: number, fee: any) => sum + fee.amount, 0);

    return NextResponse.json({
      totalEarnings,
      totalProcessed,
      totalPending,
      recentEarnings,
      earningsByCurrency,
      platformFees: platformFees.slice(0, 50).map((fee: any) => ({
        id: fee.id,
        amount: fee.amount,
        currency: fee.currency,
        isProcessed: fee.isProcessed,
        createdAt: fee.createdAt,
        gift: fee.gift ? {
          id: fee.gift.id,
          amount: fee.gift.amount,
          currency: fee.gift.currency,
          senderEmail: fee.gift.senderEmail,
          recipientEmail: fee.gift.recipientEmail,
          createdAt: fee.gift.createdAt,
        } : null
      })), // Last 50 fees
      summary: {
        totalFees: platformFees.length,
        processedFees: platformFees.filter((fee: any) => fee.isProcessed).length,
        pendingFees: platformFees.filter((fee: any) => !fee.isProcessed).length,
      }
    });
  } catch (error) {
    console.error('Error fetching platform earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform earnings' },
      { status: 500 }
    );
  }
}
