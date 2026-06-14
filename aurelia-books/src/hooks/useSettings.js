// src/hooks/useSettings.js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'aurelia_settings';

export const DEFAULT_SETTINGS = {
  theme: 'warm-cream',
  font: 'Merriweather',
  fontSize: 18,
  lineHeight: 1.7,
  marginWidth: 24,
  letterSpacing: 0,
  readingMode: 'scroll',
  pageTurnEffect: 'none',
  chapterFlow: 'continuous',
  readingStatusLine: 'off',
  reducedMotion: true,
  readerMode: 'lite',
  settingsVersion: 5,
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(stored);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      if (!parsed.settingsVersion && merged.readingMode === 'classic') {
        merged.readingMode = 'scroll';
      }
      if ((parsed.settingsVersion || 0) < DEFAULT_SETTINGS.settingsVersion) {
        merged.readingMode = 'scroll';
        merged.pageTurnEffect = 'none';
        merged.reducedMotion = true;
        merged.readerMode = 'lite';
      }
      merged.chapterFlow = parsed.chapterFlow || DEFAULT_SETTINGS.chapterFlow;
      merged.readingStatusLine = parsed.readingStatusLine || DEFAULT_SETTINGS.readingStatusLine;
      merged.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
      return merged;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("localStorage quota exceeded or blocked:", e);
    }
    // Apply theme to phone frame
    const frame = document.getElementById('phone-frame');
    if (frame) {
      frame.setAttribute('data-theme', settings.theme);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
}
