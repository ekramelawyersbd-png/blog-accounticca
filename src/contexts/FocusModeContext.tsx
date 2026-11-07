import React, { createContext, useContext, useState, useEffect } from 'react';

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl';

interface FocusModeContextType {
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleFocusMode: () => void;
  readerTheme: ReaderTheme;
  setReaderTheme: (theme: ReaderTheme) => void;
  readerFontSize: ReaderFontSize;
  setReaderFontSize: (size: ReaderFontSize) => void;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('article_focus_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(() => {
    try {
      const stored = localStorage.getItem('article_reader_theme') as ReaderTheme;
      return stored && ['light', 'sepia', 'dark'].includes(stored) ? stored : 'light';
    } catch {
      return 'light';
    }
  });

  const [readerFontSize, setReaderFontSize] = useState<ReaderFontSize>(() => {
    try {
      const stored = localStorage.getItem('article_reader_font_size') as ReaderFontSize;
      return stored && ['sm', 'base', 'lg', 'xl'].includes(stored) ? stored : 'base';
    } catch {
      return 'base';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('article_focus_mode', String(isFocusMode));
    } catch {}

    if (isFocusMode) {
      document.body.classList.add('article-focus-mode');
    } else {
      document.body.classList.remove('article-focus-mode');
    }
  }, [isFocusMode]);

  useEffect(() => {
    try {
      localStorage.setItem('article_reader_theme', readerTheme);
    } catch {}
  }, [readerTheme]);

  useEffect(() => {
    try {
      localStorage.setItem('article_reader_font_size', readerFontSize);
    } catch {}
  }, [readerFontSize]);

  const toggleFocusMode = () => setIsFocusMode((prev) => !prev);

  return (
    <FocusModeContext.Provider
      value={{
        isFocusMode,
        setIsFocusMode,
        toggleFocusMode,
        readerTheme,
        setReaderTheme,
        readerFontSize,
        setReaderFontSize,
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
}
