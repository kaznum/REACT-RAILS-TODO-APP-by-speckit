import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import { MESSAGES } from '../../constants/messages';
import './OAuthCallback.css';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract access token from URL (hash fragment or query params)
        // Use location.hash from React Router as it properly handles hash fragments
        const hash = location.hash || window.location.hash;
        const accessToken = authService.handleOAuthCallback(searchParams, hash);

        if (!accessToken) {
          const errorMessage = searchParams.get('error') || MESSAGES.auth.authenticationFailed;
          setError(errorMessage);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Login with the access token
        await login();

        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(MESSAGES.auth.authenticationFailed);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, location.hash, login, navigate]);

  if (error) {
    return (
      <div className="oauth-callback">
        <div className="oauth-callback-container">
          <div className="error-icon">⚠️</div>
          <h2>認証エラー</h2>
          <p>{error}</p>
          <p className="redirect-message">ログインページに戻ります...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="oauth-callback">
      <div className="oauth-callback-container">
        <div className="spinner"></div>
        <h2>{MESSAGES.auth.loggingIn}</h2>
        <p>アカウントを認証しています。お待ちください。</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
