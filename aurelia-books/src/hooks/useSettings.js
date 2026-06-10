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
  readingMode: 'classic',
  pageTurnEffect: 'slide',
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
        : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
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
