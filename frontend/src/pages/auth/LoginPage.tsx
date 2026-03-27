import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getExternalChallengeUrl,
  getExternalProviders,
} from '../../lib/authApi';
import { useEffect } from 'react';

function LoginPage() {
  const { login, error, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('returnUrl') ?? '/catalog';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    getExternalProviders()
      .then((providers) => {
        setGoogleEnabled(providers.includes('Google'));
      })
      .catch(() => {
        setGoogleEnabled(false);
      });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login({ email, password, rememberMe });
      navigate(returnUrl);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'authenticated') {
    return <Navigate to={returnUrl} replace />;
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 500 }}>
      <h2>Log in</h2>
      <form onSubmit={handleSubmit}>
        <label className="form-label w-100">
          Email
          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="form-label w-100">
          Password
          <input
            className="form-control"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span className="form-check-label">Remember me</span>
        </label>

        {error ? <p className="text-danger">{error}</p> : null}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-3">
        Need an account? <Link to="/register">Register</Link>
      </p>

      {googleEnabled ? (
        <a
          className="btn btn-outline-secondary"
          href={getExternalChallengeUrl('Google', '/auth/callback')}
        >
          Continue with Google
        </a>
      ) : (
        <p className="text-muted">
          Google sign-in is unavailable until provider credentials are
          configured.
        </p>
      )}
    </div>
  );
}

export default LoginPage;
