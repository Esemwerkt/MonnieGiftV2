'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Home, ArrowRight } from 'lucide-react';
import BeautifulConfetti from '@/components/BeautifulConfetti';

export default function OnboardSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [loading, setIsLoading] = useState(true);
  const [completingClaims, setCompletingClaims] = useState(false);
  const [claimsCompleted, setClaimsCompleted] = useState(false);
  const [giftData, setGiftData] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const accountId = searchParams.get('account_id');
  const giftId = searchParams.get('gift_id');

  useEffect(() => {
    if (accountId) {
      checkAccountStatus(accountId);
    }
    if (giftId) {
      fetchGiftData(giftId);
    }
  }, [accountId, giftId]);

  const fetchGiftData = async (giftId: string) => {
    try {
      const response = await fetch(`/api/gifts/${giftId}`);
      const data = await response.json();
      
      if (response.ok) {
        setGiftData(data);
        setShowConfetti(true);
      }
    } catch (error) {
    }
  };

  const checkAccountStatus = async (accountId: string) => {
    try {
      const response = await fetch(`/api/connect/check?account_id=${accountId}`);
      const data = await response.json();

      if (response.ok) {
        setAccountStatus(data);
        
        if (data.chargesEnabled && data.payoutsEnabled) {
          await completePendingClaims(accountId);
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const completePendingClaims = async (accountId: string) => {
    setCompletingClaims(true);
    try {
      const email = searchParams.get('email');
      if (!email) return;

      const response = await fetch('/api/gifts/complete-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          email,
        }),
      });

      const data = await response.json();
      if (response.ok && data.completedGifts > 0) {
        setClaimsCompleted(true);
        setShowConfetti(true);
      }
    } catch (error) {
    } finally {
      setCompletingClaims(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Account status controleren...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-chart-1/10 to-chart-2/10 flex items-center justify-center p-4">
      {/* Confetti */}
      <BeautifulConfetti 
        trigger={showConfetti} 
        variant="money"
        onComplete={() => setShowConfetti(false)}
      />
      
      <div className="w-full max-w-md">
        {/* Success Content */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-chart-1/20 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-chart-1" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Account Klaar! 🎉
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Je account is succesvol ingesteld. Je kunt nu geld cadeaus ontvangen!
          </p>

          {/* Gift Amount Display */}
          {giftData && (
            <div className="bg-gradient-to-r from-chart-1/20 to-chart-2/20 border border-chart-1/30 rounded-2xl p-6 mb-6 shadow-lg">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-chart-1 mb-2">
                  🎁 Je hebt een gift ontvangen!
                </h2>
                <div className="text-4xl font-bold text-foreground mb-2">
                  €{(giftData.amount / 100).toFixed(2)}
                </div>
                {giftData.message && (
                  <p className="text-muted-foreground italic">
                    "{giftData.message}"
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  van {giftData.senderEmail}
                </p>
              </div>
            </div>
          )}

          {completingClaims && (
            <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border border-chart-1/30 border-t-chart-1 rounded-full animate-spin" />
                <p className="text-chart-1 font-medium">
                  Geld cadeaus worden overgemaakt...
                </p>
              </div>
            </div>
          )}

          {claimsCompleted && (
            <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-chart-1" />
                <p className="text-chart-1 font-medium">
                  Geld cadeaus succesvol overgemaakt! 🎉
                </p>
              </div>
            </div>
          )}

          {accountStatus && (
            <div className="bg-card/50 backdrop-blur-sm border  rounded-2xl p-6 mb-6 shadow-xl">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Uitbetalingen:</span>
                  <span className={`text-sm font-medium ${
                    accountStatus.payoutsEnabled ? 'text-chart-1' : 'text-destructive'
                  }`}>
                    {accountStatus.payoutsEnabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Betalingen:</span>
                  <span className={`text-sm font-medium ${
                    accountStatus.chargesEnabled ? 'text-chart-1' : 'text-destructive'
                  }`}>
                    {accountStatus.chargesEnabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Terug naar Home
            </button>
    
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-chart-1/10 border border-chart-1/20 rounded-lg">
            <p className="text-xs text-chart-1">
              💡 Geld cadeaus worden automatisch overgemaakt naar je bankrekening binnen 1-2 werkdagen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
