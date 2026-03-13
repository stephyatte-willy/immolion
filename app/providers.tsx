// app/providers.tsx
'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './components/ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}