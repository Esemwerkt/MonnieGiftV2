'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift, CheckCircle, ArrowRight, Home, MessageCircle, Copy, Check, Share2, ArrowLeft, Mail } from 'lucide-react';
import { LoaderFiveDemo } from '@/components/ui/shimmerload';
import { AnimatedLogo } from '@/components/ui/animated-logo';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [giftData, setGiftData] = useState<{
    id: string;
    amount: number;
    currency: string;
    message?: string;
    authenticationCode: string;
    platformFeeAmount?: number;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [claimUrl, setClaimUrl] = useState('');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

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

  const handleCopyCode = async () => {
    if (!giftData?.authenticationCode) return;
    
    try {
      await navigator.clipboard.writeText(giftData.authenticationCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleWhatsAppShare = () => {
    if (!giftData || !claimUrl) return;
    
    const message = `🎁 Ik heb een cadeau van €${(giftData.amount / 100).toFixed(2)} voor je gemaakt!\n\n${giftData.message ? `Bericht: "${giftData.message}"\n\n` : ''}Code: ${giftData.authenticationCode}\n\nKlik op de link om je cadeau op te halen: ${claimUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailShare = async () => {
    if (!giftData || !recipientEmail) return;
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setEmailError('Voer een geldig e-mailadres in');
      return;
    }

    setIsSendingEmail(true);
    setEmailError('');
    
    try {
      const response = await fetch('/api/send-gift-email-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          giftId: giftData.id,
          recipientEmail: recipientEmail,
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        setRecipientEmail('');
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        const errorData = await response.json();
        setEmailError(errorData.error || 'Kon e-mail niet verzenden');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      setEmailError('Er is een fout opgetreden bij het verzenden');
    } finally {
      setIsSendingEmail(false);
    }
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
            message: verifiedMessage,
            animationPreset: verifiedAnimationPreset
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
              platformFeeAmount: gift.platformFeeAmount || 99, // Default to 99 cents if not available
            };
            
            setGiftData(newGiftData);
            
            // Generate claim URL
            const baseUrl = window.location.origin;
            const claimLink = `${baseUrl}/claim/${gift.id}`;
            setClaimUrl(claimLink);
            
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
                  platformFeeAmount: gift.platformFeeAmount || 99, // Default to 99 cents if not available
                };
                
                setGiftData(newGiftData);
                
                const baseUrl = window.location.origin;
                const claimLink = `${baseUrl}/claim/${gift.id}`;
                setClaimUrl(claimLink);
                
                setProcessingComplete(true);
                sessionStorage.setItem(processingKey, 'true');
                console.log('Gift retrieved successfully on retry');
              } else {
                console.error('Still no gift found after retry');
                console.log('Webhook failed to create gift, attempting fallback creation...');
                
                // Fallback: Create gift manually using the gifts/create endpoint
                try {
                  const createResponse = await fetch('/api/gifts/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      amount: amount,
                      currency: currency,
                      message: message,
                      animationPreset: animationPreset,
                      paymentIntentId: paymentIntentId,
                    }),
                  });

                  if (createResponse.ok) {
                    const createResult = await createResponse.json();
                    console.log('Fallback gift creation successful:', createResult);
                    
                    // Fetch the newly created gift
                    const giftResponse = await fetch(`/api/gifts/by-payment-intent/${paymentIntentId}`);
                    if (giftResponse.ok) {
                      const gift = await giftResponse.json();
                      console.log('Found newly created gift:', gift);
                      
                      const newGiftData = {
                        id: gift.id,
                        amount: gift.amount,
                        currency: gift.currency,
                        message: gift.message || undefined,
                        authenticationCode: gift.authenticationCode,
                        platformFeeAmount: gift.platformFeeAmount || 99, // Default to 99 cents if not available
                      };
                      
                      setGiftData(newGiftData);
                      
                      const baseUrl = window.location.origin;
                      const claimLink = `${baseUrl}/claim/${gift.id}`;
                      setClaimUrl(claimLink);
                      
                      setProcessingComplete(true);
                      sessionStorage.setItem(processingKey, 'true');
                      console.log('Fallback gift creation and retrieval successful');
                    } else {
                      throw new Error('Failed to fetch newly created gift');
                    }
                  } else {
                    const errorData = await createResponse.json();
                    throw new Error(errorData.error || 'Failed to create gift');
                  }
                } catch (fallbackError) {
                  console.error('Fallback gift creation failed:', fallbackError);
                  console.log('All gift creation methods failed - please contact support');
                  setProcessingError(true);
                  setProcessingComplete(true);
                  sessionStorage.setItem(processingKey, 'true');
                }
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
          <LoaderFiveDemo text="Betaling wordt geverifieerd..." />
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
    <div className="">
      <div className="w-full mx-auto max-w-4xl flex flex-col">
        {/* Header */}
        <div className="px-4 relative top-0 z-10 border-b py-3 border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Terug naar home</span>
            </button>
            <AnimatedLogo />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 px-0 py-12 space-y-6">

          {/* Success Content */}
          <div className="">
            <div className="gap-y-6 flex flex-col">
              <div className="text-center">
                {/* Success Icon */}
            

                {/* Success Message */}
                <h1 className="text-2xl font-bold text-foreground mb-4">
                  Cadeau succesvol aangemaakt!
                </h1>
                <p className="text-muted-foreground mb-4">
                  Je cadeau is klaar om te delen! Deel de code en link om de ontvanger te informeren.
                </p>
              </div>

              {/* Gift Details */}
              {giftData && (
                <div className="">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Cadeau Details
                  </label>
                  
                  <div className="space-y-3 p-4 bg-background border border-input rounded-xl">
                    {/* Amount */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Cadeau bedrag</span>
                      <span className="text-sm font-medium">{formatAmount(giftData.amount, giftData.currency)}</span>
                    </div>
                    
                    {/* Platform Fee */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Servicekosten</span>
                      <span className="text-sm font-medium">{formatAmount(giftData.platformFeeAmount || 99, giftData.currency)}</span>
                    </div>
                    
                    {/* Total */}
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Totaal betaald</span>
                        <span className="text-primary font-semibold">{formatAmount((giftData.amount + (giftData.platformFeeAmount || 99)), giftData.currency)}</span>
                      </div>
                    </div>
                    
                  </div>

                  {/* Message */}
                  {giftData.message && (
                    <div className="mt-4 p-3 bg-muted rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Persoonlijk bericht:</p>
                      <p className="text-sm">"{giftData.message}"</p>
                    </div>
                  )}
                </div>
              )}

              {giftData && (
                <div className="">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Authenticatie code
                  </label>
                  
                  <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Deel deze code met de ontvanger:</p>
                    <div className="relative bg-background border border-border rounded-lg p-4 mb-3">
                      <p className="text-3xl font-bold text-primary  tracking-wider pr-12">
                        {giftData.authenticationCode}
                      </p>
                      <button
                        onClick={handleCopyCode}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-muted rounded transition-colors"
                        title="Kopieer code"
                      >
                        {codeCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      De ontvanger heeft deze code nodig om het cadeau op te halen
                    </p>
                  </div>
                </div>
              )}

              {/* Share Options */}
              {giftData && claimUrl && (
                <div className="">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Deel je cadeau
                  </label>
                  
                  <div className="space-y-3 p-4 bg-background border border-input rounded-xl">
                    {/* Copy Link Section */}
                    <div className="relative">
                      <input
                        type="text"
                        value={claimUrl}
                        readOnly
                        className="w-full h-[48px] pl-4 pr-12 border border-input bg-background rounded-xl text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-muted rounded transition-colors"
                        title="Kopieer link"
                      >
                        {linkCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    {/* Share Buttons */}
                    <div className="flex gap-2">
                      {/* WhatsApp Share Button */}
                      <button
                        onClick={handleWhatsAppShare}
                        className="flex-1 h-[48px] bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Deel via WhatsApp
                      </button>
                    </div>

                    {/* Email Share Section */}
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Of verstuur per e-mail:</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => {
                              setRecipientEmail(e.target.value);
                              setEmailError('');
                            }}
                            placeholder="ontvanger@email.nl"
                            className="w-full h-[48px] pl-10 pr-4 border border-input bg-background rounded-xl text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={handleEmailShare}
                          disabled={isSendingEmail || !recipientEmail}
                          className="px-4 h-[48px] bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {isSendingEmail ? (
                            <LoaderFiveDemo text="Verzenden..." />
                          ) : emailSent ? (
                            <>
                              <Check className="h-4 w-4" />
                              Verzonden!
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4" />
                              Versturen
                            </>
                          )}
                        </button>
                      </div>
                      {emailError && (
                        <p className="text-xs text-destructive mt-2">{emailError}</p>
                      )}
                      {emailSent && !emailError && (
                        <p className="text-xs text-green-600 mt-2">E-mail succesvol verzonden!</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Wat gebeurt er nu?
                </label>
                
                <div className="space-y-3 p-4 bg-background border border-input rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-sm text-muted-foreground">1. Deel de code en link</span>
                    <span className="text-sm font-medium">Via WhatsApp of andere manier</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-sm text-muted-foreground">2. Ontvanger bezoekt link</span>
                    <span className="text-sm font-medium">En voert de code in</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-sm text-muted-foreground">3. Automatische doorverwijzing</span>
                    <span className="text-sm font-medium">Naar juiste pagina</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-sm text-muted-foreground">4. Geld wordt overgemaakt</span>
                    <span className="text-sm font-medium">Zodra alles is ingesteld</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 h-[48px] rounded-xl border transition-all duration-200 bg-background border-input hover:border-border hover:bg-primary/5 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Terug naar home
                </button>
                <button
                  onClick={() => window.location.href = '/maak-gift'}
                  className="flex-1 h-[48px] bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <Gift className="h-4 w-4" />
                  Nieuw cadeau maken
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}