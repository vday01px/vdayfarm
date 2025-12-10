declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date: number;
          hash: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

export function getTelegramUser(): TelegramUser | null {
  const webApp = getTelegramWebApp();
  const user = webApp?.initDataUnsafe?.user;
  
  if (!user) {
    // Development fallback - create a test user
    if (import.meta.env.DEV) {
      return {
        id: 123456789,
        firstName: "Test",
        lastName: "User",
        username: "testuser",
        languageCode: "vi",
      };
    }
    return null;
  }
  
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    languageCode: user.language_code,
  };
}

export function initTelegramApp() {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
  }
}

export function openTelegramChat(username: string) {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.openTelegramLink(`https://t.me/${username}`);
  } else {
    window.open(`https://t.me/${username}`, "_blank");
  }
}

export function isAdmin(username?: string): boolean {
  return username === "vdaychim99";
}

export function getDisplayUsername(user: TelegramUser | null): string {
  if (!user) return "Guest";
  return user.username || user.firstName || `User${user.id}`;
}
