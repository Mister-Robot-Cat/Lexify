/**
 * Telegram Web App SDK helper utilities.
 * Handles viewport expansion, theme synchronization, and initData parsing.
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  return null;
}

export function initTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (!tg) return null;

  try {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#0a0a0f');
    }
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#0a0a0f');
    }
  } catch (err) {
    console.warn('Telegram WebApp initialization error:', err);
  }

  return tg;
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

export function showMainButton(text: string, onClick: () => void) {
  const tg = getTelegramWebApp();
  if (!tg?.MainButton) return;

  tg.MainButton.setText(text);
  tg.MainButton.onClick(onClick);
  tg.MainButton.show();
}

export function hideMainButton() {
  const tg = getTelegramWebApp();
  if (!tg?.MainButton) return;

  tg.MainButton.hide();
}

export function triggerHapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light') {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.impactOccurred(style);
    } catch {
      // Ignore if unsupported
    }
  }
}
