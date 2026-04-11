import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../config';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

function SocialAuthButtons({ userType = 'buyer', onAuthSuccess, onError }) {
  const googleButtonRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(process.env.REACT_APP_GOOGLE_CLIENT_ID || '');
  const [googleConfigLoaded, setGoogleConfigLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleConfig = async () => {
      if (googleClientId) {
        setGoogleConfigLoaded(true);
        return;
      }
      try {
        const response = await axios.get(apiUrl('/api/auth/oauth/config'));
        const runtimeClientId = response.data?.google_client_id || '';
        if (runtimeClientId) {
          setGoogleClientId(runtimeClientId);
        }
      } catch (error) {
        // Keep fallback UX if config endpoint is unavailable.
      } finally {
        setGoogleConfigLoaded(true);
      }
    };

    loadGoogleConfig();
  }, [googleClientId]);

  useEffect(() => {
    const clientId = googleClientId;
    if (!clientId) {
      setGoogleReady(false);
      return;
    }

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        shape: 'pill',
        size: 'large',
        text: 'continue_with',
        theme: 'outline',
        width: 360
      });
      setGoogleReady(true);
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      if (window.google?.accounts?.id) {
        initGoogle();
      } else {
        existingScript.addEventListener('load', initGoogle, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId, userType]);

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      onError?.('Google sign-in failed');
      return;
    }

    setAuthLoading(true);
    try {
      const result = await axios.post(apiUrl('/api/auth/oauth/google'), {
        id_token: response.credential,
        user_type: userType
      });
      onAuthSuccess?.(result.data);
    } catch (error) {
      onError?.(error.response?.data?.error || 'Google sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Apple sign-in is intentionally disabled until configured.

  return (
    <div className="space-y-3">
      {googleClientId ? (
        <div>
          <div
            ref={googleButtonRef}
            className={`flex justify-center ${googleReady ? '' : 'hidden'}`}
          />
          {!googleReady && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              disabled={authLoading || !googleConfigLoaded}
            >
              Continue with Google
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!googleConfigLoaded) return;
            onError?.('Google Sign-In is temporarily unavailable. Please disable content blockers and refresh.');
          }}
          className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          disabled={authLoading || !googleConfigLoaded}
        >
          Continue with Google
        </button>
      )}

      {/* Apple sign-in disabled until configured */}
    </div>
  );
}

export default SocialAuthButtons;
