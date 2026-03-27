import { useConsent } from '../../context/ConsentContext';

function CookieConsentBanner() {
  const { preference, setPreference } = useConsent();

  if (preference !== null) {
    return null;
  }

  return (
    <div
      className="position-fixed bottom-0 start-0 end-0 bg-dark text-white p-3"
      style={{ zIndex: 1000 }}
    >
      <div className="container d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <span>
          We use essential cookies for authentication. Non-essential cookies are
          disabled unless you accept them.
        </span>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => setPreference('rejected')}
          >
            Reject non-essential
          </button>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setPreference('accepted')}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
