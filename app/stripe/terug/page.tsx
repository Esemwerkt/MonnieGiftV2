'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Gift, ArrowRight, Home } from 'lucide-react';

export default function StripeReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [message, setMessage] = useState('');

  const accountId = searchParams.get('account_id');
  
  // Extract gift_id and email from state parameter (format: gift_{giftId}_{email})
  const state = searchParams.get('state');
  let giftId = searchParams.get('gift_id');
  let email = searchParams.get('email');
  
  if (state && state.startsWith('gift_')) {
    const stateParts = state.split('_');
    if (stateParts.length >= 3) {
      giftId = stateParts[1];
      email = stateParts.slice(2).join('_'); // In case email contains underscores
    }
  }

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const code = searchParams.get('code');
        
        if (code && state) {
          // OAuth callback - process the authorization code
          const response = await fetch('/api/connect/oauth-callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              state,
              giftId,
              email,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setStatus('success');
            setMessage('Account setup voltooid! Je cadeau wordt nu verwerkt...');
            
            // Redirect to claim page after a short delay
            setTimeout(() => {
              if (giftId && email) {
                router.push(`/claim/${giftId}?email=${encodeURIComponent(email)}&onboarding_complete=true&auto_claim=true`);
              } else {
                router.push('/');
              }
            }, 3000);
          } else {
            setStatus('error');
            setMessage(data.error || 'Account setup niet voltooid. Probeer het opnieuw.');
          }
        } else if (accountId) {
          // Express onboarding completion - process the gift transfer
          const response = await fetch('/api/connect/express-complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountId,
              giftId,
              email,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setStatus('success');
            setMessage('Account setup voltooid! Je cadeau wordt nu verwerkt...');
            
            setTimeout(() => {
              if (giftId && email) {
                router.push(`/claim/${giftId}?email=${encodeURIComponent(email)}&onboarding_complete=true&auto_claim=true`);
              } else {
                router.push('/');
              }
            }, 3000);
          } else {
            setStatus('error');
            if (data.code && data.message) {
              setMessage(data.message);
            } else {
              setMessage(data.error || 'Er is een fout opgetreden bij het verwerken van je cadeau.');
            }
          }
        } else {
          setStatus('error');
          setMessage('Geen account ID of OAuth code gevonden.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Er is een fout opgetreden bij het controleren van je account.');
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [searchParams, accountId, giftId, email, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Account status controleren...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Account Setup Voltooid! 🎉
            </h1>
            <p className="text-muted-foreground mb-6">
              {message}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Bezig met doorsturen naar je cadeau...</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Home className="h-4 w-4" />
              Terug naar Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
            <Gift className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Account Setup Mislukt
          </h1>
          <p className="text-muted-foreground mb-6">
            {message}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Opnieuw Proberen
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Terug naar Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
