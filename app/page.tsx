'use client';

import { useState } from 'react';
import { LogOut, User, Zap, Camera, Mic } from 'lucide-react';
import { PasskeyAuth } from '../components/PasskeyAuth';
import { MorseScanner } from '../components/MorseScanner';
import { AudioMorseScanner } from '../components/AudioMorseScanner';
import { DecodedDisplay } from '../components/DecodedDisplay';
import { motion, AnimatePresence, Variants } from 'framer-motion';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [capturedMessage, setCapturedMessage] = useState('');
  const [scannerMode, setScannerMode] = useState<'camera' | 'audio'>('camera');

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.4 }
    }
  };

  return (
    <main className="main-container">
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div
            key="auth"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PasskeyAuth onSuccess={(name) => {
              setIsLoggedIn(true);
              setUsername(name);
            }} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <header className="app-header">
              <div className="brand">
                <div className="brand-icon">
                  <Zap size={20} fill="currentColor" />
                </div>
                <h1 className="brand-name">Morse Pro</h1>
              </div>

              <div className="user-profile">
                <div className="user-info">
                  <div className="avatar">
                    <User size={14} />
                  </div>
                  <span className="username">{username}</span>
                </div>
                <button 
                  onClick={() => setIsLoggedIn(false)} 
                  className="logout-button"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </header>

            <div className="app-content">
              <div className="mode-switcher">
                <button 
                  onClick={() => setScannerMode('camera')}
                  className={`mode-button ${scannerMode === 'camera' ? 'active' : ''}`}
                >
                  <div className="mode-btn-content">
                    <Camera size={16} />
                    <span>Camera</span>
                  </div>
                </button>
                <button 
                  onClick={() => setScannerMode('audio')}
                  className={`mode-button ${scannerMode === 'audio' ? 'active' : ''}`}
                >
                  <div className="mode-btn-content">
                    <Mic size={16} />
                    <span>Audio</span>
                  </div>
                </button>
              </div>

              <div className="scanner-section">
                {scannerMode === 'camera' ? (
                  <motion.div
                    key="camera-scanner"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <MorseScanner onMessageDecoded={(msg) => setCapturedMessage(msg)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="audio-scanner"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <AudioMorseScanner onMessageDecoded={(msg) => setCapturedMessage(msg)} />
                  </motion.div>
                )}
              </div>
              
              <AnimatePresence>
                {capturedMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="display-section"
                  >
                    <DecodedDisplay 
                      message={capturedMessage} 
                      onClear={() => setCapturedMessage('')} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="app-footer">
              <p>&copy; 2026 Morse Pro &bull; Minimalist Intelligence</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .brand-icon {
          padding: 0.4rem;
          background: var(--foreground);
          color: var(--background);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-name {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--card-bg);
          padding: 3px;
          border-radius: 100px;
          border: 1px solid var(--card-border);
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 0.6rem 0 0.4rem;
        }
        .avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--glass);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--card-border);
        }
        .username {
          font-weight: 500;
          font-size: 0.8rem;
          opacity: 0.8;
        }
        .logout-button {
          background: var(--glass);
          border: 1px solid var(--card-border);
          color: var(--error);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .logout-button:hover {
          background: var(--error);
          color: white;
          border-color: var(--error);
        }
        .app-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .mode-btn-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .scanner-section {
          min-height: auto;
        }
        .display-section {
          margin-top: 0.5rem;
        }
        .app-footer {
          margin-top: 2.5rem;
          text-align: center;
          opacity: 0.3;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>
    </main>
  );
}
