import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all platform fees
    const platformFees = await (prisma as any).platformFee.findMany({
      include: {
        gift: {
          select: {
            id: true,
            amount: true,
            currency: true,
            senderEmail: true,
            recipientEmail: true,
            claimedAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate totals
    const totalFees = platformFees.reduce((sum: number, fee: any) => sum + fee.amount, 0);
    const totalProcessed = platformFees
      .filter((fee: any) => fee.isProcessed)
      .reduce((sum: number, fee: any) => sum + fee.amount, 0);
    const totalPending = totalFees - totalProcessed;

    // Group by currency
    const feesByCurrency = platformFees.reduce((acc: any, fee: any) => {
      const currency = fee.currency.toUpperCase();
      if (!acc[currency]) {
        acc[currency] = {
          total: 0,
          processed: 0,
          pending: 0,
          count: 0
        };
      }
      acc[currency].total += fee.amount;
      acc[currency].count += 1;
      if (fee.isProcessed) {
        acc[currency].processed += fee.amount;
      } else {
        acc[currency].pending += fee.amount;
      }
      return acc;
    }, {} as Record<string, { total: number; processed: number; pending: number; count: number }>);

    return NextResponse.json({
      summary: {
        totalFees,
        totalProcessed,
        totalPending,
        totalGifts: platformFees.length,
        processedGifts: platformFees.filter((fee: any) => fee.isProcessed).length,
      },
      byCurrency: feesByCurrency,
      fees: platformFees.map((fee: any) => ({
        id: fee.id,
        amount: fee.amount,
        currency: fee.currency,
        isProcessed: fee.isProcessed,
        processedAt: fee.processedAt,
        createdAt: fee.createdAt,
        gift: fee.gift
      }))
    });
  } catch (error) {
    console.error('Error fetching platform fees:', error);
    return NextResponse.json(
      { error: 'Platform fees ophalen mislukt' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feeIds, action } = body;

    if (!feeIds || !Array.isArray(feeIds) || !action) {
      return NextResponse.json(
        { error: 'Fee IDs en actie zijn vereist' },
        { status: 400 }
      );
    }

    if (action === 'mark_processed') {
      // Mark fees as processed
      await (prisma as any).platformFee.updateMany({
        where: {
          id: {
            in: feeIds
          }
        },
        data: {
          isProcessed: true,
          processedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `${feeIds.length} platform fees gemarkeerd als verwerkt`
      });
    }

    return NextResponse.json(
      { error: 'Ongeldige actie' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating platform fees:', error);
    return NextResponse.json(
      { error: 'Platform fees bijwerken mislukt' },
      { status: 500 }
    );
  }
}
