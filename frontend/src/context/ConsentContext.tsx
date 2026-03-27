import { createContext, useContext, useMemo, useState } from 'react';
import {
  ConsentPreference,
  getConsentPreference,
  setConsentPreference,
} from '../lib/consent';

interface ConsentContextValue {
  preference: ConsentPreference | null;
  setPreference: (preference: ConsentPreference) => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(
  undefined
);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ConsentPreference | null>(
    () => getConsentPreference()
  );

  const setPreference = (value: ConsentPreference) => {
    setConsentPreference(value);
    setPreferenceState(value);
  };

  const contextValue = useMemo(
    () => ({
      preference,
      setPreference,
    }),
    [preference]
  );

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within ConsentProvider');
  }

  return context;
}
