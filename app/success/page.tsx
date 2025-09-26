'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift, CheckCircle, Mail, ArrowRight, Home, Send } from 'lucide-react';
// import BeautifulConfetti, { useBeautifulConfetti } from '@/components/BeautifulConfetti';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [giftData, setGiftData] = useState<{
    id: string;
    amount: number;
    currency: string;
    recipientEmail: string;
    message?: string;
  } | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // const { triggerFullScreenExplosion } = useBeautifulConfetti();

  const handleSendEmail = async () => {
    if (!giftData) return;
    
    setSendingEmail(true);
    try {
      const response = await fetch('/api/send-gift-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ giftId: giftData.id }),
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
      }
    } catch (error) {
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    // Get gift data from URL params
    const giftId = searchParams.get('gift_id');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const recipientEmail = searchParams.get('recipient');
    const message = searchParams.get('message');

    if (giftId && amount && currency && recipientEmail) {
      const newGiftData = {
        id: giftId,
        amount: parseInt(amount),
        currency,
        recipientEmail,
        message: message || undefined,
      };
      
      setGiftData(newGiftData);
      
      // Trigger confetti celebration
      setShowConfetti(true);
      // Also trigger full-screen explosion for maximum impact
      // setTimeout(() => {
      //   triggerFullScreenExplosion('mixed');
      // }, 500);

      // Automatically send email when page loads
      setTimeout(async () => {
        setSendingEmail(true);
        try {
          const response = await fetch('/api/send-gift-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ giftId: newGiftData.id }),
          });

          if (response.ok) {
            setEmailSent(true);
          } else {
          }
        } catch (error) {
        } finally {
          setSendingEmail(false);
        }
      }, 1000);
    }
  }, [searchParams]);

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'eur' ? '€' : currency === 'usd' ? '$' : '£';
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      {/* Success Confetti */}
      {/* <BeautifulConfetti 
        trigger={showConfetti} 
        variant="mixed"
        onComplete={() => setShowConfetti(false)}
      /> */}
      
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            Terug naar Home
          </button>
        </div>

        {/* Success Content */}
        <div className="text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-chart-1/20 to-chart-1/10 rounded-full mb-8">
            <CheckCircle className="h-12 w-12 text-chart-1" />
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Cadeau Succesvol Verzonden!
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Je cadeau is veilig verzonden en de ontvanger heeft een e-mail ontvangen.
          </p>

          {/* Gift Details */}
          {giftData && (
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold text-foreground">
                    {formatAmount(giftData.amount, giftData.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verzonden naar {giftData.recipientEmail}
                  </p>
                </div>
              </div>

              {giftData.message && (
                <div className="bg-background/50 rounded-xl p-4 border-l-4 border-primary mb-6">
                  <p className="text-foreground italic">
                    "{giftData.message}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>
                  {emailSent 
                    ? 'E-mail succesvol verzonden!' 
                    : 'E-mail verzonden met instructies om het cadeau op te halen'
                  }
                </span>
              </div>
              
              {/* Development mode: Manual email sending button */}
              {process.env.NODE_ENV === 'development' && !emailSent && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="px-4 py-2 bg-chart-1 text-white rounded-lg text-sm font-medium hover:bg-chart-1/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
                  >
                    {sendingEmail ? (
                      <>
                        <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                        E-mail Verzenden...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        E-mail Handmatig Verzenden
                      </>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    (Development mode - webhooks werken niet op localhost)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Wat gebeurt er nu?
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold text-sm">1</span>
                </div>
                <h4 className="font-semibold text-foreground mb-1">E-mail Verzonden</h4>
                <p className="text-muted-foreground">Ontvanger krijgt e-mail met authenticatiecode</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-br from-chart-1/20 to-chart-1/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-chart-1 font-bold text-sm">2</span>
                </div>
                <h4 className="font-semibold text-foreground mb-1">Code Invoeren</h4>
                <p className="text-muted-foreground">Ontvanger voert code in om cadeau op te halen</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-br from-chart-2/20 to-chart-2/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-chart-2 font-bold text-sm">3</span>
                </div>
                <h4 className="font-semibold text-foreground mb-1">Uitbetaling</h4>
                <p className="text-muted-foreground">Geld wordt overgemaakt naar bankrekening</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <Gift className="h-4 w-4" />
              Nog een Cadeau Maken
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
           
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Veilig verzonden via Stripe • E-mail bevestiging verzonden
          </p>
        </div>
      </div>
    </div>
  );
}