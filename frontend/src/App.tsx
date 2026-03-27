import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import { CartProvider } from './context/CartContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MfaPage from './pages/auth/MfaPage';
import ExternalCallbackPage from './pages/auth/ExternalCallbackPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CookieConsentBanner from './components/consent/CookieConsentBanner';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<ExternalCallbackPage />} />
          <Route
            path="/mfa"
            element={
              <ProtectedRoute>
                <MfaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product/:rootbeerName/:rootbeerId/:currentRetailPrice"
            element={<ProductPage />}
          />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
        <CookieConsentBanner />
      </Router>
    </CartProvider>
  );
}

export default App;
