'use client';

import React from 'react';
import { Fingerprint, Key } from 'lucide-react';
import { base64urlToBuffer, bufferToBase64url, loadCredentials, saveCredential } from '../lib/webauthn-utils';

interface PasskeyAuthProps {
  onSuccess: (username: string) => void;
}

export const PasskeyAuth: React.FC<PasskeyAuthProps> = ({ onSuccess }) => {
  const [credCount, setCredCount] = React.useState(0);

  // Fallback for randomUUID if not in a secure context
  const getUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return ([1e7] as any + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };

  React.useEffect(() => {
    setCredCount(loadCredentials().length);
  }, []);
  const registerPasskey = async () => {
    try {
      const challenge = getUUID();
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: base64urlToBuffer(btoa(challenge)),
        rp: { name: 'Morse WebApp', id: window.location.hostname },
        user: {
          id: new Uint8Array(16),
          name: 'user@morse.app',
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

      onSuccess('User (passkey)');
    } catch (err: any) {
      alert('Registration failed: ' + err.message);
    }
  };

  const loginPasskey = async () => {
    try {
      const storedCreds = loadCredentials();
      if (storedCreds.length === 0) {
        alert('No credentials found. Please register first.');
        return;
      }

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

      onSuccess('User (passkey)');
    } catch (err: any) {
      alert('Login failed: ' + err.message);
    }
  };

  return (
    <div className="premium-card" style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(0,112,243,0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
        <Fingerprint size={48} color="#0070f3" />
      </div>
      <h1 style={{ marginBottom: '0.5rem' }}>Morse WebApp</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
        Securely access your Morse decryptor using passkeys.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button className="glass-button" onClick={loginPasskey}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Key size={18} />
            Log in with Passkey {credCount > 0 && `(${credCount} found)`}
          </div>
        </button>
        <button className="glass-button secondary" onClick={async () => {
          await registerPasskey();
          setCredCount(loadCredentials().length);
        }}>
          Register New Device
        </button>
      </div>

      <p style={{ fontSize: '0.75rem', marginTop: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>
        Demo: credentials are stored in your browser&apos;s localStorage.
      </p>
    </div>
  );
};
