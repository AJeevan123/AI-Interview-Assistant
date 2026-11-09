import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('interview_assistant_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      defaultRole: 'AI / ML Engineer',
      defaultDifficulty: 'Medium',
      defaultQuestionCount: 5,
      voiceEnabled: true,
      aiSpeechEnabled: true,
      autoReadQuestion: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('interview_assistant_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newValues) => {
    setSettings((prev) => ({ ...prev, ...newValues }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
