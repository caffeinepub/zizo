import { useState, useEffect } from 'react';

interface SecurityQuestion {
  question: string;
  answer: string;
}

interface SecuritySetup {
  pin: string;
  securityQuestions: SecurityQuestion[];
}

const STORAGE_KEY = 'zizo_security_setup';

export function useSecuritySetup() {
  const [setup, setSetup] = useState<SecuritySetup | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSetup(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse security setup:', error);
      }
    }
  }, []);

  const saveSetup = (newSetup: SecuritySetup) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSetup));
    setSetup(newSetup);
  };

  const verifyPin = (inputPin: string): boolean => {
    return setup?.pin === inputPin;
  };

  const isSetupComplete = !!setup;

  return {
    setup,
    saveSetup,
    verifyPin,
    isSetupComplete,
  };
}
