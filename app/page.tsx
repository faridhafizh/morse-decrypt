'use client';

import { useState } from 'react';
import { LogOut, User, Zap } from 'lucide-react';
import { PasskeyAuth } from '../components/PasskeyAuth';
import { MorseScanner } from '../components/MorseScanner';
import { DecodedDisplay } from '../components/DecodedDisplay';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [capturedMessage, setCapturedMessage] = useState('');

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <PasskeyAuth onSuccess={(name) => {
              setIsLoggedIn(true);
              setUsername(name);
            }} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--accent)', borderRadius: '12px', boxShadow: '0 0 20px var(--accent)' }}>
                  <Zap size={24} color="#000" fill="currentColor" />
                </div>
                <h1 style={{ fontSize: '1.5rem', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.1em' }}>
                  MORSE PRO
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px var(--primary-glow)' }}>
                    <User size={16} />
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{username}</span>
                </div>
                <button 
                  onClick={() => setIsLoggedIn(false)} 
                  style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                  title="Log out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              <MorseScanner onMessageDecoded={(msg) => setCapturedMessage(msg)} />
              
              <AnimatePresence>
                {capturedMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <DecodedDisplay 
                      message={capturedMessage} 
                      onClear={() => setCapturedMessage('')} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
              <p>&copy; 2026 Morse Decrypt App &bull; Vercel Production Build</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
