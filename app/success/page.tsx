'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift, CheckCircle, ArrowRight, Home, MessageCircle, Copy, Check, Share2 } from 'lucide-react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [giftData, setGiftData] = useState<{
    id: string;
    amount: number;
    currency: string;
    message?: string;
    authenticationCode: string;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [claimUrl, setClaimUrl] = useState('');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState(false);

  const handleCopyLink = async () => {
    if (!claimUrl) return;
    
    try {
      await navigator.clipboard.writeText(claimUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleWhatsAppShare = () => {
    if (!giftData || !claimUrl) return;
    
    const message = `🎁 Ik heb een cadeau van €${(giftData.amount / 100).toFixed(2)} voor je gemaakt!\n\n${giftData.message ? `Bericht: "${giftData.message}"\n\n` : ''}Code: ${giftData.authenticationCode}\n\nKlik op de link om je cadeau op te halen: ${claimUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'eur' ? '€' : currency === 'usd' ? '$' : '£';
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent') || searchParams.get('payment_intent_id');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const message = searchParams.get('message');
    const animationPreset = searchParams.get('animation_preset');

    if (paymentIntentId) {
      console.log('Using payment intent ID:', paymentIntentId);
      // First verify the payment with Stripe server-side
      const verifyPayment = async (retryCount = 0) => {
        try {
          console.log('Verifying payment:', paymentIntentId, 'attempt:', retryCount + 1);
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentIntentId }),
          });

          const verificationResult = await response.json();
          
          if (!response.ok) {
            if (response.status === 429) {
              const retryAfter = verificationResult.retryAfter || 30;
              console.log(`Rate limited, retrying in ${retryAfter} seconds...`);
              setTimeout(() => {
                verifyPayment(retryCount);
              }, retryAfter * 1000);
              return;
            }
            
            // If payment not completed and we haven't retried too many times, wait and retry
            if (verificationResult.status === 'requires_payment_method' && retryCount < 5) {
              console.log(`Payment not completed yet (${verificationResult.status}), retrying in 3 seconds... (attempt ${retryCount + 1}/5)`);
              setTimeout(() => {
                verifyPayment(retryCount + 1);
              }, 3000);
              return;
            }
            
            console.error('Payment verification failed:', verificationResult);
            setProcessingError(true);
            setProcessingComplete(true);
            return;
          }

          const verifiedAmount = verificationResult.paymentIntent.amount;
          const verifiedCurrency = verificationResult.paymentIntent.currency;
          const verifiedMetadata = verificationResult.paymentIntent.metadata;
          
          const verifiedMessage = verifiedMetadata?.message || '';
          const verifiedAnimationPreset = verifiedMetadata?.animationPreset || 'confettiRealistic';

          console.log('Payment verified successfully:', {
            amount: verifiedAmount,
            currency: verifiedCurrency,
            message: verifiedMessage
          });

          // Now process the gift with verified data
          processGiftWithVerifiedData({
            paymentIntentId,
            amount: verifiedAmount,
            currency: verifiedCurrency,
            message: verifiedMessage,
            animationPreset: verifiedAnimationPreset
          });

        } catch (error) {
          console.error('Payment verification error:', error);
          setProcessingError(true);
          setProcessingComplete(true);
        }
      };
      verifyPayment();
    }
  }, [searchParams]);

  const processGiftWithVerifiedData = async (verifiedData: {
    paymentIntentId: string;
    amount: number;
    currency: string;
    message: string;
    animationPreset: string;
  }) => {
    const { paymentIntentId, amount, currency, message, animationPreset } = verifiedData;
    
    // Check if processing was already completed for this payment intent
    const processingKey = `gift_processed_${paymentIntentId}`;
    const wasProcessed = sessionStorage.getItem(processingKey);
    
    if (wasProcessed) {
      console.log('Processing already complete for this payment intent, fetching existing data...');
      // Fetch the existing gift data and display it
      const fetchExistingGift = async () => {
        try {
          const response = await fetch(`/api/gifts/by-payment-intent/${paymentIntentId}`);
          if (response.ok) {
            const gift = await response.json();
            console.log('Found existing gift:', gift);
            
            const newGiftData = {
              id: gift.id,
              amount: gift.amount, // Use gift amount from database (without platform fee)
              currency: gift.currency,
              message: gift.message || undefined,
              authenticationCode: gift.authenticationCode,
            };
            
            setGiftData(newGiftData);
            
            // Generate claim URL
            const baseUrl = window.location.origin;
            const claimLink = `${baseUrl}/claim/${gift.id}`;
            setClaimUrl(claimLink);
            
            setShowConfetti(true);
            setProcessingComplete(true);
            console.log('Existing gift data loaded successfully');
          } else {
            console.error('Failed to fetch existing gift:', response.status);
            // Clear sessionStorage if gift doesn't exist (previous processing failed)
            sessionStorage.removeItem(processingKey);
            console.log('Cleared sessionStorage, will retry processing');
          }
        } catch (error) {
          console.error('Error fetching existing gift:', error);
          setProcessingError(true);
          setProcessingComplete(true);
        }
      };
      fetchExistingGift();
    } else {
      // First time processing - try to get gift from webhook
      console.log('First time processing, checking for gift...');
      try {
        const response = await fetch(`/api/gifts/by-payment-intent/${paymentIntentId}`);
        
        if (response.ok) {
          const gift = await response.json();
          console.log('Found gift:', gift);
          
          const newGiftData = {
            id: gift.id,
            amount: gift.amount, // Use gift amount from database (without platform fee)
            currency: gift.currency,
            message: gift.message || undefined,
            authenticationCode: gift.authenticationCode,
          };
          
          setGiftData(newGiftData);
          
          // Generate claim URL
          const baseUrl = window.location.origin;
          const claimLink = `${baseUrl}/claim/${gift.id}`;
          setClaimUrl(claimLink);
          
          setShowConfetti(true);
          setProcessingComplete(true);
          sessionStorage.setItem(processingKey, 'true');
          console.log('Gift retrieved successfully');
        } else {
          console.error('Failed to retrieve gift:', response.status);
          // Webhook might not have fired yet, wait and try again
          console.log('Webhook might not have fired yet, waiting 3 seconds...');
          setTimeout(async () => {
            try {
              const retryResponse = await fetch(`/api/gifts/by-payment-intent/${paymentIntentId}`);
              if (retryResponse.ok) {
                const gift = await retryResponse.json();
                console.log('Found gift on retry:', gift);
                
                const newGiftData = {
                  id: gift.id,
                  amount: gift.amount, // Use gift amount from database (without platform fee)
                  currency: gift.currency,
                  message: gift.message || undefined,
                  authenticationCode: gift.authenticationCode,
                };
                
                setGiftData(newGiftData);
                
                const baseUrl = window.location.origin;
                const claimLink = `${baseUrl}/claim/${gift.id}`;
                setClaimUrl(claimLink);
                
                setShowConfetti(true);
                setProcessingComplete(true);
                sessionStorage.setItem(processingKey, 'true');
                console.log('Gift retrieved successfully on retry');
              } else {
                console.error('Still no gift found after retry');
                console.log('Webhook failed to create gift - please contact support');
                setProcessingError(true);
                setProcessingComplete(true);
                sessionStorage.setItem(processingKey, 'true');
              }
            } catch (retryError) {
              console.error('Retry error:', retryError);
              setProcessingError(true);
              setProcessingComplete(true);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Error processing gift:', error);
        setProcessingError(true);
        setProcessingComplete(true);
      }
    }
  };

  if (!processingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Betaling wordt geverifieerd...</p>
          <p className="text-xs text-muted-foreground">Dit kan even duren</p>
        </div>
      </div>
    );
  }

  if (processingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Verwerking Fout</h1>
          <p className="text-muted-foreground">
            Er is een fout opgetreden bij het verwerken van je cadeau. Neem contact op met de ondersteuning.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Terug naar home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="w-full h-full bg-transparent" />
        </div>
      )}

      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">MonnieGift</span>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
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
            Je cadeau is veilig verzonden! Deel de code en link om de ontvanger te informeren.
          </p>
        </div>

        {/* Gift Details */}
        {giftData && (
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
              Cadeau Details
            </h2>
            
            <div className="space-y-4">
              {/* Amount */}
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {formatAmount(giftData.amount, giftData.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cadeau bedrag
                </p>
              </div>

              {/* Message */}
              {giftData.message && (
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Bericht:</p>
                  <p className="text-sm">"{giftData.message}"</p>
                </div>
              )}

              {/* Authentication Code - PROMINENT */}
              <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Deel deze code met de ontvanger:</p>
                <div className="bg-background border border-primary/30 rounded-lg p-4 mb-3">
                  <p className="text-3xl font-bold text-primary font-mono tracking-wider">
                    {giftData.authenticationCode}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  De ontvanger heeft deze code nodig om het cadeau op te halen
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Share Options */}
        {giftData && claimUrl && (
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-chart-1 rounded-full" />
              Deel je cadeau
            </h3>
            
            {/* Copy Link Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Cadeau link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={claimUrl}
                  readOnly
                  className="flex-1 h-[48px] pl-4 pr-4 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-chart-1 text-white rounded-lg text-sm font-medium hover:bg-chart-1/90 transition-all duration-200 flex items-center gap-2"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Gekopieerd!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Kopiëren
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {/* WhatsApp Share Button */}
              <button
                onClick={handleWhatsAppShare}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <MessageCircle className="h-5 w-5" />
                Deel via WhatsApp
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground">
                De ontvanger kan het cadeau ophalen door de link te bezoeken en de code in te voeren
              </p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-chart-1 rounded-full" />
            Wat gebeurt er nu?
          </h3>
          
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <p>Deel de code en link met de ontvanger via WhatsApp of een andere manier</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <p>De ontvanger bezoekt de link en voert de code in</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <p>De ontvanger wordt automatisch doorgestuurd naar de juiste pagina (onboarding of claimen)</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <p>Het geld wordt overgemaakt naar de ontvanger zodra alles is ingesteld</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-6 py-3 border border-input bg-background text-foreground rounded-xl font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Terug naar home
          </button>
          <button
            onClick={() => window.location.href = '/maak-gift'}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Gift className="h-4 w-4" />
            Nieuw cadeau maken
          </button>
        </div>
      </div>
    </div>
  );
}