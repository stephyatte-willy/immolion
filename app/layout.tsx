import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './providers/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ImmoLion - Gestion Immobilière',
  description: 'Application de gestion immobilière nouvelle génération',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Script pour appliquer le thème immédiatement avant le rendu */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const savedTheme = localStorage.getItem('app-theme');
                if (savedTheme === 'light' || savedTheme === 'dark') {
                  document.documentElement.setAttribute('data-theme', savedTheme);
                  document.documentElement.classList.add(savedTheme + '-theme');
                } else {
                  // Par défaut sombre
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.classList.add('dark-theme');
                }
              } catch (e) {
                console.error('Erreur initialisation thème:', e);
              }
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: 'var(--bg-primary)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--danger)',
                  secondary: 'var(--bg-primary)',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}