import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit, isIPBlocked, blockIP, getBlockRemainingTime, clearFailedAttempts } from '@/app/api/rate-limit';
import { verifyAuthenticationCode } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { giftId, email, authCode } = body;

    if (!giftId || !email || !authCode) {
      return NextResponse.json(
        { error: 'Gift ID, email, and auth code are required' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting and blocking
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Check if IP is blocked
    if (isIPBlocked(clientIp)) {
      const blockTimeRemaining = Math.ceil(getBlockRemainingTime(clientIp) / 1000);
      const minutesRemaining = Math.ceil(blockTimeRemaining / 60);
      return NextResponse.json(
        { 
          error: `Je IP-adres is tijdelijk geblokkeerd vanwege te veel mislukte pogingen. Probeer het over ${minutesRemaining} minuut${minutesRemaining !== 1 ? 'en' : ''} opnieuw.`,
          retryAfter: blockTimeRemaining
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(blockTimeRemaining)
          }
        }
      );
    }

    // Rate limiting: 5 attempts per IP per minute
    const rateLimitKey = `verify-auth-${clientIp}`;
    const rateLimitResult = rateLimit(rateLimitKey, 5, 60000); // 5 attempts per minute

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Te veel pogingen. Probeer het over een minuut opnieuw.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000))
          }
        }
      );
    }

    // Additional rate limiting per gift ID to prevent targeted brute force
    const giftRateLimitKey = `verify-auth-gift-${giftId}`;
    const giftRateLimitResult = rateLimit(giftRateLimitKey, 10, 60000); // 10 attempts per gift per minute

    if (!giftRateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Te veel pogingen voor dit cadeau. Probeer het over een minuut opnieuw.',
          retryAfter: Math.ceil((giftRateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((giftRateLimitResult.resetTime - Date.now()) / 1000))
          }
        }
      );
    }

    console.log('Verifying auth code:', { giftId, email });

    // Get the gift and verify the auth code
    const { data: gift, error: giftError } = await supabaseAdmin
      .from('gifts')
      .select('id, authenticationCode, recipientEmail, isClaimed')
      .eq('id', giftId)
      .single();

    if (giftError || !gift) {
      console.error('Gift not found:', giftError);
      return NextResponse.json(
        { error: 'Cadeau niet gevonden' },
        { status: 404 }
      );
    }

    // Check if gift is already claimed
    if (gift.isClaimed) {
      return NextResponse.json(
        { error: 'Dit cadeau is al opgehaald' },
        { status: 400 }
      );
    }

    // Verify the auth code (supports both hashed and plain text for backward compatibility)
    const codeMatches = await verifyAuthenticationCode(authCode, gift.authenticationCode);
    
    // Also check plain text for backward compatibility with existing gifts
    const plainTextMatch = gift.authenticationCode === authCode.toUpperCase();
    
    if (!codeMatches && !plainTextMatch) {
      console.log('Auth code mismatch');
      
      // Track failed attempts for IP blocking
      const failedAttemptsKey = `failed-attempts-${clientIp}`;
      const failedAttempts = rateLimit(failedAttemptsKey, 10, 3600000); // Track over 1 hour
      
      // If 10+ failed attempts in an hour, block IP for 1 hour
      if (failedAttempts.remaining === 0) {
        blockIP(clientIp, 3600000); // Block for 1 hour
        console.log(`IP ${clientIp} blocked for 1 hour due to excessive failed attempts`);
      }
      
      return NextResponse.json(
        { error: 'Ongeldige authenticatiecode' },
        { status: 400 }
      );
    }
    
    // Successful verification - clear failed attempts counter
    clearFailedAttempts(clientIp);

    // Email verification removed per user request

    console.log('Auth verification successful for gift:', giftId);

    return NextResponse.json({
      valid: true,
      message: 'Authenticatie succesvol',
      gift: {
        id: gift.id,
        recipientEmail: gift.recipientEmail,
        isClaimed: gift.isClaimed
      }
    });

  } catch (error) {
    console.error('Error verifying auth code:', error);
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het verifiëren',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
