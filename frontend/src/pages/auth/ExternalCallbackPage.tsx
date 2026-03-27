import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ExternalCallbackPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser()
      .then(() => {
        navigate('/catalog', { replace: true });
      })
      .catch(() => {
        setError('External authentication callback could not complete.');
      });
  }, [navigate, refreshUser]);

  if (error) {
    return (
      <div className="container mt-4">
        <h2>External auth failed</h2>
        <p className="text-danger">{error}</p>
        <Link to="/login">Return to login</Link>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <p>Completing external sign in...</p>
    </div>
  );
}

export default ExternalCallbackPage;
