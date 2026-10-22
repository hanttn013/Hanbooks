// src/hooks/useSettings.js
import { useState, useEffect } from 'react';
import { getFontStack, normalizeFont, normalizeTheme } from '../styles/designTokens';
import { migrateLegacyLocalStorage, STORAGE_KEYS } from '../utils/storageKeys';

export const DEFAULT_SETTINGS = {
  theme: 'warm-cream',
  font: 'Georgia',
  fontSize: 18,
  lineHeight: 1.7,
  marginWidth: 24,
  letterSpacing: 0,
  readingMode: 'scroll',
  readingStatusLine: 'off',
  reducedMotion: true,
  readerMode: 'lite',
  settingsVersion: 7,
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      migrateLegacyLocalStorage();
      const stored = localStorage.getItem(STORAGE_KEYS.settings);
      if (!stored) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(stored);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      delete merged.pageTurnEffect;
      delete merged.chapterFlow;
      merged.theme = normalizeTheme(merged.theme);
      merged.font = normalizeFont(merged.font);
      if (!parsed.settingsVersion && merged.readingMode === 'classic') {
        merged.readingMode = 'scroll';
      }
      if ((parsed.settingsVersion || 0) < DEFAULT_SETTINGS.settingsVersion) {
        merged.readingMode = 'scroll';
        merged.reducedMotion = true;
        merged.readerMode = 'lite';
      }
      merged.readingStatusLine = parsed.readingStatusLine || DEFAULT_SETTINGS.readingStatusLine;
      merged.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
      return merged;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });

  useEffect(() => {
    const normalized = {
      ...settings,
      theme: normalizeTheme(settings.theme),
      font: normalizeFont(settings.font),
    };
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(normalized));
    } catch (e) {
      console.warn("localStorage quota exceeded or blocked:", e);
    }
    document.documentElement.setAttribute('data-theme', normalized.theme);
    document.documentElement.style.setProperty('--reader-font-family', getFontStack(normalized.font));
    const frame = document.getElementById('phone-frame');
    if (frame) {
      frame.setAttribute('data-theme', normalized.theme);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'theme' ? normalizeTheme(value) : key === 'font' ? normalizeFont(value) : value,
    }));
  };

  return { settings, updateSetting };
}
