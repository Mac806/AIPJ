'use client';

import { useEffect, useState } from 'react';

const USER_MODE_STORAGE_KEY = 'aipj-user-mode';

export default function useUserMode() {
  const [userMode, setUserMode] = useState('general');

  useEffect(() => {
    try {
      const storedMode = window.localStorage.getItem(USER_MODE_STORAGE_KEY);
      if (storedMode === 'general' || storedMode === 'developer') {
        setUserMode(storedMode);
      }
    } catch {
      // localStorage 접근 불가 환경 무시
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(USER_MODE_STORAGE_KEY, userMode);
    } catch {
      // localStorage 접근 불가 환경 무시
    }
  }, [userMode]);

  return {
    userMode,
    setUserMode,
  };
}
