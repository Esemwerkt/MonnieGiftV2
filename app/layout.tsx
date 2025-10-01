import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { ToastProvider } from '../components/ToastProvider';
import LayoutWrapper from '../components/LayoutWrapper';

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.className = 'theme ' + (isDark ? 'dark' : 'light');
                  document.body.className = document.body.className + ' ' + (isDark ? 'dark' : 'light');
                } catch (e) {
                  document.documentElement.className = 'theme dark';
                  document.body.className = document.body.className + ' dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background text-foreground">
              
              <div className="">
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </div>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
