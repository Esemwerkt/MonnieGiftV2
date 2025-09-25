'use client';

interface MoneyLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MoneyLoader({ 
  text = "Laden...", 
  size = 'md' 
}: MoneyLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Infinity symbol loader */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          className="w-full h-full animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.178 8.171c1.354 0 2.45 1.095 2.45 2.45s-1.096 2.45-2.45 2.45c-.32 0-.63-.06-.92-.17l-3.13 3.13c.11.29.17.6.17.92 0 1.354-1.096 2.45-2.45 2.45s-2.45-1.096-2.45-2.45c0-.32.06-.63.17-.92l-3.13-3.13c-.29.11-.6.17-.92.17-1.354 0-2.45-1.095-2.45-2.45s1.096-2.45 2.45-2.45c.32 0 .63.06.92.17l3.13-3.13c-.11-.29-.17-.6-.17-.92 0-1.354 1.096-2.45 2.45-2.45s2.45 1.096 2.45 2.45c0 .32-.06.63-.17.92l3.13 3.13c.29-.11.6-.17.92-.17z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Loading Text */}
      <p className={`${textSizeClasses[size]} text-muted-foreground font-medium`}>
        {text}
      </p>
    </div>
  );
}
