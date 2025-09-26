'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift, CheckCircle, Mail, ArrowRight, Home, Send, MessageCircle, Copy, Check } from 'lucide-react';

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
  const [linkCopied, setLinkCopied] = useState(false);
  const [claimUrl, setClaimUrl] = useState('');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState(false);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(claimUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleWhatsAppShare = () => {
    const message = `🎁 Ik heb een cadeau van ${formatAmount(giftData?.amount || 0, giftData?.currency || 'eur')} voor je gemaakt!\n\n${giftData?.message ? `Bericht: "${giftData.message}"\n\n` : ''}Klik op de link om je cadeau op te halen: ${claimUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent_id');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const recipientEmail = searchParams.get('recipient');
    const message = searchParams.get('message');
    const senderEmail = searchParams.get('sender');
    const animationPreset = searchParams.get('animation_preset');

    if (paymentIntentId) {
      // First verify the payment with Stripe server-side
      const verifyPayment = async () => {
        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentIntentId }),
          });

          const verificationResult = await response.json();
          
          if (!response.ok) {
            console.error('Payment verification failed:', verificationResult);
            setProcessingError(true);
            setProcessingComplete(true);
            return;
          }

          // Use verified payment data instead of URL parameters
          const verifiedAmount = verificationResult.paymentIntent.amount;
          const verifiedCurrency = verificationResult.paymentIntent.currency;
          const verifiedMetadata = verificationResult.paymentIntent.metadata;
          
          // Extract data from verified metadata (set by our API)
          const verifiedRecipientEmail = verifiedMetadata?.recipientEmail;
          const verifiedSenderEmail = verifiedMetadata?.senderEmail;
          const verifiedMessage = verifiedMetadata?.message || '';
          const verifiedAnimationPreset = verifiedMetadata?.animationPreset || 'confettiRealistic';

          console.log('Payment verified successfully:', {
            amount: verifiedAmount,
            currency: verifiedCurrency,
            recipient: verifiedRecipientEmail,
            sender: verifiedSenderEmail
          });

          // Now process the gift with verified data
          processGiftWithVerifiedData({
            paymentIntentId,
            amount: verifiedAmount,
            currency: verifiedCurrency,
            recipientEmail: verifiedRecipientEmail,
            senderEmail: verifiedSenderEmail,
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
  }, [searchParams, processingComplete]);

  const processGiftWithVerifiedData = async (verifiedData: {
    paymentIntentId: string;
    amount: number;
    currency: string;
    recipientEmail: string;
    senderEmail: string;
    message: string;
    animationPreset: string;
  }) => {
    const { paymentIntentId, amount, currency, recipientEmail, senderEmail, message, animationPreset } = verifiedData;
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
              amount: amount,
              currency,
              recipientEmail,
              message: message || undefined,
            };
            
            setGiftData(newGiftData);
            
            // Generate claim URL
            const baseUrl = window.location.origin;
            const claimLink = `${baseUrl}/claim/${gift.id}`;
            setClaimUrl(claimLink);
            
            setShowConfetti(true);
            setEmailSent(true); // Assume email was already sent
            setProcessingComplete(true);
            console.log('Existing gift data loaded successfully');
          } else {
            console.error('Failed to fetch existing gift:', response.status);
            // Clear sessionStorage if gift doesn't exist (previous processing failed)
            sessionStorage.removeItem(processingKey);
            console.log('Cleared sessionStorage, will retry processing');
            setProcessingComplete(false);
          }
        } catch (error) {
          console.error('Error fetching existing gift:', error);
          // Clear sessionStorage if there was an error
          sessionStorage.removeItem(processingKey);
          console.log('Cleared sessionStorage due to error, will retry processing');
          setProcessingComplete(false);
        }
      };
      
      fetchExistingGift();
      return;
    }

    // Prevent multiple executions within the same session
    if (processingComplete) {
      console.log('Processing already complete, skipping...');
      return;
    }

    // If we reach here, we need to process the gift
    console.log('Starting gift processing for payment intent:', paymentIntentId);
    // Simply retrieve the existing gift (created by webhook)
    const retrieveGift = async () => {
      try {
        console.log('Retrieving gift for payment intent:', paymentIntentId);
        const response = await fetch(`/api/gifts/by-payment-intent/${paymentIntentId}`);
        console.log('Retrieve response status:', response.status);
        
        if (response.ok) {
          const gift = await response.json();
          console.log('Found gift:', gift);
          
          const newGiftData = {
            id: gift.id,
            amount: amount,
            currency,
            recipientEmail,
            message: message || undefined,
          };
          
          setGiftData(newGiftData);
          
          // Generate claim URL
          const baseUrl = window.location.origin;
          const claimLink = `${baseUrl}/claim/${gift.id}`;
          setClaimUrl(claimLink);
          
          setShowConfetti(true);
          setEmailSent(true); // Webhook handles email sending
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
                  amount: amount,
                  currency,
                  recipientEmail,
                  message: message || undefined,
                };
                
                setGiftData(newGiftData);
                
                const baseUrl = window.location.origin;
                const claimLink = `${baseUrl}/claim/${gift.id}`;
                setClaimUrl(claimLink);
                
                setShowConfetti(true);
                setEmailSent(true);
                setProcessingComplete(true);
                sessionStorage.setItem(processingKey, 'true');
                console.log('Gift retrieved successfully on retry');
              } else {
                console.error('Still no gift found after retry');
                // Webhook failed, create gift as fallback
                console.log('Webhook failed to create gift, creating fallback gift');
                try {
                  const fallbackResponse = await fetch('/api/gifts/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      amount: amount,
                      currency,
                      senderEmail,
                      recipientEmail,
                      message: message || '',
                      animationPreset: animationPreset || 'confettiRealistic',
                      paymentIntentId, // Pass the payment intent ID for idempotency
                    }),
                  });

                  const fallbackData = await fallbackResponse.json();
                  console.log('Fallback gift creation response:', fallbackData);

                  if (fallbackData.success) {
                    const newGiftData = {
                      id: fallbackData.giftId,
                      amount: amount,
                      currency,
                      recipientEmail,
                      message: message || undefined,
                    };
                    
                    setGiftData(newGiftData);
                    
                    const baseUrl = window.location.origin;
                    const claimLink = `${baseUrl}/claim/${fallbackData.giftId}`;
                    setClaimUrl(claimLink);
                    
                    setShowConfetti(true);
                    setEmailSent(true); // Assume email was sent by the API
                    setProcessingComplete(true);
                    sessionStorage.setItem(processingKey, 'true');
                    console.log('Gift created successfully as fallback');
                  } else {
                    console.error('Fallback gift creation failed:', fallbackData.error);
                    setProcessingError(true);
                    setProcessingComplete(true);
                    sessionStorage.setItem(processingKey, 'true');
                  }
                } catch (fallbackError) {
                  console.error('Fallback gift creation error:', fallbackError);
                  setProcessingError(true);
                  setProcessingComplete(true);
                  sessionStorage.setItem(processingKey, 'true');
                }
              }
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              setProcessingComplete(true);
              sessionStorage.setItem(processingKey, 'true');
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Error retrieving gift:', error);
        setProcessingError(true);
        setProcessingComplete(true);
        sessionStorage.setItem(processingKey, 'true');
      }
    };

    retrieveGift();
  };

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
          {processingError ? (
            <>
              <h1 className="text-4xl font-bold text-destructive mb-4">
                Verwerking Fout
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Er is een fout opgetreden bij het verwerken van je cadeau. Neem contact op met de ondersteuning.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Cadeau Succesvol Verzonden!
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Je cadeau is veilig verzonden en de ontvanger heeft een e-mail ontvangen.
              </p>
            </>
          )}

          {/* Gift Details */}
          {giftData && (
            <div className="bg-card/50 backdrop-blur-sm border  rounded-2xl p-8 mb-8">
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
                <div className="bg-background rounded-xl p-4 border-l-4 border-primary mb-6">
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

              {/* WhatsApp Share Button */}
              <div className="text-center">
                <button
                  onClick={handleWhatsAppShare}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2 mx-auto group"
                >
                  <MessageCircle className="h-5 w-5" />
                  Deel via WhatsApp
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  Deel je cadeau direct via WhatsApp
                </p>
              </div>
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