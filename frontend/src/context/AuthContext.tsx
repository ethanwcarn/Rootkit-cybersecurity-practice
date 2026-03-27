import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ApiError,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';
import * as authApi from '../lib/authApi';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as ApiError).message;
  }

  return 'Authentication request failed.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getCurrentUser();
      setUser(me);
      setStatus('authenticated');
      setError(null);
    } catch {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    refreshUser().catch(() => {
      setStatus('anonymous');
      setUser(null);
    });
  }, [refreshUser]);

  const login = useCallback(
    async (request: LoginRequest) => {
      try {
        const response = await authApi.login(request);
        if (response.user) {
          setUser(response.user);
          setStatus('authenticated');
        } else {
          await refreshUser();
        }
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setStatus('anonymous');
        throw err;
      }
    },
    [refreshUser]
  );

  const register = useCallback(
    async (request: RegisterRequest) => {
      try {
        const response = await authApi.register(request);
        if (response.user) {
          setUser(response.user);
          setStatus('authenticated');
        } else {
          await refreshUser();
        }
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setStatus('anonymous');
        throw err;
      }
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      login,
      register,
      logout,
      refreshUser,
    }),
    [status, user, error, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
