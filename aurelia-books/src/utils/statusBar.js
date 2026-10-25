// src/utils/statusBar.js
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { getThemeById } from '../styles/designTokens';

/**
 * Synchronizes native mobile and web status bar colors to match the reader theme.
 * Returns a cleanup function that restores the app theme color upon unmount.
 */
export function syncReaderStatusBar(readerThemeId, appColorScheme = 'light') {
  const theme = getThemeById(readerThemeId);
  const isReaderDark = ['night', 'forest', 'indigo'].includes(theme.id);
  const appBg = appColorScheme === 'dark' ? '#141312' : '#FAF7F2';

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const previousColor = metaThemeColor?.getAttribute('content') || appBg;

  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme.bg);
  }

  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: isReaderDark ? Style.Dark : Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: theme.bg }).catch(() => {});
  }

  return () => {
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', previousColor);
    }
    if (Capacitor.isNativePlatform()) {
      const isAppDark = appColorScheme === 'dark';
      StatusBar.setStyle({ style: isAppDark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: appBg }).catch(() => {});
    }
  };
}
