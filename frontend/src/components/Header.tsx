import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/catalog');
  }

  return (
    <div className="row bg-secondary text-white p-3 mb-3">
      <div className="col-md-8">
        <h1>Rootkit Rootbeer Catalog</h1>
      </div>
      <div className="col-md-4 d-flex justify-content-end align-items-center gap-2">
        {status === 'authenticated' ? (
          <>
            <span className="small">
              Hi, {user?.displayName || user?.email}
            </span>
            <Link className="btn btn-sm btn-outline-light" to="/mfa">
              MFA
            </Link>
            <button className="btn btn-sm btn-light" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-sm btn-outline-light" to="/login">
              Login
            </Link>
            <Link className="btn btn-sm btn-light" to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Header;
