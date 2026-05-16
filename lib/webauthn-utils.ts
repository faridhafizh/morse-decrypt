/**
 * WebAuthn / Passkey Utilities
 */

export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach(b => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const raw = atob(padded);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export interface StoredCredential {
  id: string;
  publicKey: string;   // base64url of the public key
  transports?: string[];
}

export function loadCredentials(): StoredCredential[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('morse-passkey-creds');
    console.log('Loading credentials:', raw);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load credentials:', err);
    return [];
  }
}

export function saveCredential(cred: StoredCredential) {
  const creds = loadCredentials().filter(c => c.id !== cred.id);
  creds.push(cred);
  console.log('Saving credential:', cred);
  localStorage.setItem('morse-passkey-creds', JSON.stringify(creds));
}
