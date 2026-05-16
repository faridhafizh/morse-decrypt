'use client';

import React, { useState, useEffect } from 'react';
import { Fingerprint, Key, Plus } from 'lucide-react';
import { base64urlToBuffer, bufferToBase64url, loadCredentials, saveCredential } from '../lib/webauthn-utils';
import { motion } from 'framer-motion';

interface PasskeyAuthProps {
  onSuccess: (username: string) => void;
}

export const PasskeyAuth: React.FC<PasskeyAuthProps> = ({ onSuccess }) => {
  const [credCount, setCredCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const getUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return ([1e7] as any + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };

  useEffect(() => {
    setCredCount(loadCredentials().length);
  }, []);

  const registerPasskey = async () => {
    setLoading(true);
    try {
      const challenge = getUUID();
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: base64urlToBuffer(btoa(challenge)),
        rp: { name: 'Morse Pro', id: window.location.hostname },
        user: {
          id: new Uint8Array(16),
          name: 'user@morse.pro',
          displayName: 'Morse User',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };

      const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
      if (!cred) throw new Error('No credential returned');

      const response = cred.response as AuthenticatorAttestationResponse;
      saveCredential({
        id: cred.id,
        publicKey: bufferToBase64url(response.getPublicKey()!),
        transports: (cred as any).response?.getTransports?.() ?? [],
      });

      onSuccess('User');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loginPasskey = async () => {
    if (credCount === 0) return;
    setLoading(true);
    try {
      const storedCreds = loadCredentials();
      const challenge = getUUID();
      const allowCredentials: PublicKeyCredentialDescriptor[] = storedCreds.map(c => ({
        id: base64urlToBuffer(c.id),
        type: 'public-key',
        transports: c.transports as AuthenticatorTransport[],
      }));

      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToBuffer(btoa(challenge)),
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;
      if (!assertion) throw new Error('No assertion returned');

      onSuccess('User');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card premium-card">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="auth-icon-wrapper"
      >
        <Fingerprint size={48} strokeWidth={1.5} />
      </motion.div>
      
      <div className="auth-header">
        <h1>Welcome to Morse Pro</h1>
        <p>Access your professional Morse decryptor securely with Biometrics or Passkey.</p>
      </div>
      
      <div className="auth-actions">
        <button 
          className="glass-button" 
          onClick={loginPasskey}
          disabled={loading || credCount === 0}
          style={{ opacity: credCount === 0 ? 0.5 : 1 }}
        >
          <Key size={18} />
          {loading ? 'Authenticating...' : `Sign in with Passkey ${credCount > 0 ? `(${credCount})` : ''}`}
        </button>
        
        <button 
          className="glass-button secondary" 
          onClick={registerPasskey}
          disabled={loading}
        >
          <Plus size={18} />
          {credCount === 0 ? 'Set up Passkey' : 'Register New Device'}
        </button>
      </div>

      <footer className="auth-footer">
        <p>Your biometric data never leaves your device.</p>
      </footer>

      <style jsx>{`
        .auth-card {
          max-width: 420px;
          margin: 6rem auto;
          text-align: center;
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        .auth-icon-wrapper {
          width: 80px;
          height: 80px;
          background: var(--glass);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          border: 1px solid var(--card-border);
        }
        .auth-header h1 {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
          letter-spacing: -0.03em;
        }
        .auth-header p {
          color: var(--secondary);
          font-size: 0.95rem;
          line-height: 1.5;
          max-width: 300px;
          margin: 0 auto;
        }
        .auth-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .auth-footer {
          margin-top: 1rem;
          opacity: 0.4;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};
