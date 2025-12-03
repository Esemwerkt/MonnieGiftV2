'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, ArrowRight, Home, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function CustomOnboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    tosAccepted: false,
  });

  const accountId = searchParams.get('account_id');
  const giftId = searchParams.get('gift_id');
  const email = searchParams.get('email');

  useEffect(() => {
    if (email) {
      setFormData(prev => ({
        ...prev,
        email: email,
      }));
    }
  }, [email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create onboarding link for Express account
      const response = await fetch('/api/connect/onboard-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          giftId,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link');
      }

      if (data.onboardingUrl) {
        // Redirect to Stripe's Express onboarding
        window.location.href = data.onboardingUrl;
        return;
      }

      setError('No onboarding URL received');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="bg-card/50  p-3 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Account Setup Voltooid!
            </h1>
            <p className="text-muted-foreground mb-6">
              Je account is succesvol ingesteld. Je wordt doorgestuurd naar je cadeau...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Bezig met doorsturen...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
      
          <h1 className="text-4xl md:text-7xl font-bold text-foreground mb-2 md:mb-4">
           Je bent er bijna!
          </h1>
  
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm border rounded-2xl p-4 md:p-6 max-w-md mx-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                E-mailadres
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-base md:text-lg placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="je@email.com"
              />
            </div>

            {/* ToS Acceptance */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="tosAccepted"
                checked={formData.tosAccepted}
                onChange={handleInputChange}
                required
                className="mt-1 h-4 w-4 text-primary border-input rounded focus:ring-2 focus:ring-ring"
              />
              <label className="text-sm md:text-base text-foreground">
                Ik accepteer de{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Algemene Voorwaarden
                </a>{' '}
                en{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacybeleid
                </a>
                . Dit is vereist om geld te kunnen ontvangen.
              </label>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.tosAccepted}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Account Instellen...
                </>
              ) : (
                <>
                  Account Instellen
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        

          {/* Back Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Home className="h-4 w-4" />
              Terug naar Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
