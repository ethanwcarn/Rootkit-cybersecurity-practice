const CONSENT_KEY = 'rootkit_cookie_consent';

export type ConsentPreference = 'accepted' | 'rejected';

export function getConsentPreference(): ConsentPreference | null {
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === 'accepted' || value === 'rejected') {
    return value;
  }

  return null;
}

export function setConsentPreference(preference: ConsentPreference) {
  localStorage.setItem(CONSENT_KEY, preference);
}
