// app/components/layout/ThemeToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Appliquer le thème au body
    document.body.classList.toggle('theme-clair', !isDark);
    document.body.classList.toggle('theme-sombre', isDark);
  }, [isDark]);

  return (
    <motion.button 
      className="theme-toggle"
      onClick={() => setIsDark(!isDark)}
      whileTap={{ scale: 0.9 }}
      animate={{
        rotate: isDark ? 0 : 180,
      }}
      transition={{ duration: 0.3 }}
    >
      <span className="theme-icon">
        {isDark ? '🌙' : '☀️'}
      </span>
    </motion.button>
  );
}