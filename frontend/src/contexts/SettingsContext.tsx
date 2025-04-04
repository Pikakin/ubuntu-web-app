import React, { createContext, useState, useEffect } from 'react';

interface Settings {
  wallpaper: string;
  accentColor: string;
  darkMode: boolean;
  useTransparency: boolean;
  taskbarStyle: string;
  taskbarPosition: string;
  taskbarSize: number;
  showAppNames: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
}

// デフォルト設定
const defaultSettings: Settings = {
  wallpaper: 'default',
  accentColor: 'blue',
  darkMode: false,
  useTransparency: true,
  taskbarStyle: 'default',
  taskbarPosition: 'bottom',
  taskbarSize: 48,
  showAppNames: true,
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ローカルストレージから設定を読み込む
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('os_settings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // 設定が変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('os_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
