'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StripeRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after a short delay
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4 md:p-8">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-base md:text-lg text-muted-foreground">Bezig met doorsturen...</p>
      </div>
    </div>
  );
}
