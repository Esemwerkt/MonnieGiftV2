'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, ArrowRight, Home, CheckCircle } from 'lucide-react';

export default function CustomOnboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    iban: '',
    dateOfBirth: '',
  });

  const accountId = searchParams.get('account_id');
  const giftId = searchParams.get('gift_id');
  const email = searchParams.get('email');

  useEffect(() => {
    if (email) {
      setFormData(prev => ({
        ...prev,
        email: email,
        firstName: email.split('@')[0],
      }));
    }
  }, [email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Submit minimal onboarding data directly
      const response = await fetch('/api/connect/custom-onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          giftId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      setSuccess(true);
      
      setTimeout(() => {
        if (giftId && formData.email) {
          router.push(`/claim/${giftId}?email=${encodeURIComponent(formData.email)}&onboarding_complete=true&auto_claim=true`);
        } else {
          router.push('/');
        }
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-3 shadow-xl text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
      
          <h1 className="text-3xl font-bold text-foreground mb-2">
           Je bent er bijna!
          </h1>
  
        </div>

        {/* Form */}
        <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-8 shadow-xl max-w-md mx-auto">
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
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="je@email.com"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Voornaam
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Jan"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Achternaam
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Jansen"
              />
            </div>

            {/* IBAN */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                IBAN
              </label>
              <input
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="NL91ABNA0417164300"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Geboortedatum
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
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
        </div>
      </div>
    </div>
  );
}
