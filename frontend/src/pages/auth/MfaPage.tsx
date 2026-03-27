import { FormEvent, useEffect, useState } from 'react';
import { disableMfa, setupMfa, verifyMfa } from '../../lib/authApi';
import { useAuth } from '../../context/AuthContext';

function MfaPage() {
  const { status } = useAuth();
  const [sharedKey, setSharedKey] = useState('');
  const [authenticatorUri, setAuthenticatorUri] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    setupMfa()
      .then((response) => {
        setSharedKey(response.sharedKey);
        setAuthenticatorUri(response.authenticatorUri);
      })
      .catch(() => {
        setError('Unable to initialize MFA setup.');
      });
  }, [status]);

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const response = await verifyMfa({ code });
      setMessage(response.message);
    } catch {
      setError('Invalid MFA code.');
    }
  }

  async function handleDisable() {
    setError(null);
    setMessage(null);
    try {
      const response = await disableMfa();
      setMessage(response.message);
    } catch {
      setError('Unable to disable MFA.');
    }
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 640 }}>
      <h2>MFA (TOTP)</h2>
      <p>
        Add an authenticator app account with the shared key below, then verify
        with a one-time code.
      </p>

      <div className="mb-3">
        <strong>Shared key:</strong> {sharedKey || 'Loading...'}
      </div>
      <div className="mb-3">
        <strong>URI:</strong> <code>{authenticatorUri || 'Loading...'}</code>
      </div>

      <form onSubmit={handleVerify}>
        <label className="form-label w-100">
          Verification code
          <input
            className="form-control"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            minLength={6}
            maxLength={8}
            required
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Verify and enable MFA
        </button>
      </form>

      <button className="btn btn-outline-danger mt-3" onClick={handleDisable}>
        Disable MFA
      </button>

      {message ? <p className="text-success mt-3">{message}</p> : null}
      {error ? <p className="text-danger mt-3">{error}</p> : null}
    </div>
  );
}

export default MfaPage;
