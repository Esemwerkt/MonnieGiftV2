import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { ToastProvider } from '../components/ToastProvider';
import LayoutWrapper from '../components/LayoutWrapper';
import Footer from '@/components/ui/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MonnieGift - Send Money Gifts Securely',
  description: 'Send money gifts with email authentication. Secure, fast, and easy to use.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favi.png" />
        {/* You can add more favicon sizes/types as needed */}
      
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <div className="min-h-screen text-foreground"
            style={{ background: "linear-gradient(to bottom, #0a3530, #104b44)" }}>
              
              <div className="">
                <LayoutWrapper>
                  {children}
                  <Footer />
                </LayoutWrapper>
              </div>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
