'use client';

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, MessageSquare, X, Zap } from 'lucide-react';
import { encodeMorse } from '../lib/morse-encoder';
import { motion, AnimatePresence } from 'framer-motion';

interface DecodedDisplayProps {
  message: string;
  onClear: () => void;
}

export const DecodedDisplay: React.FC<DecodedDisplayProps> = ({ message, onClear }) => {
  const [answerText, setAnswerText] = useState('');
  const [transmitting, setTransmitting] = useState(false);
  const [flashColor, setFlashColor] = useState('transparent');

  const startTransmission = async () => {
    if (!answerText.trim()) return;
    setTransmitting(true);
    
    const sequence = encodeMorse(answerText, 250); // 250ms units
    
    // Initial delay
    await new Promise(r => setTimeout(r, 1000));

    for (const step of sequence) {
      if (!transmitting) break; // Allow cancel
      setFlashColor(step.type === 'on' ? '#ffffff' : 'transparent');
      await new Promise(r => setTimeout(r, step.duration));
    }

    setFlashColor('transparent');
    setTransmitting(false);
    setAnswerText('');
    onClear();
  };

  return (
    <div className="premium-card" style={{ marginTop: '2rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <MessageSquare size={20} color="#7928ca" />
        Captured Message
      </h3>
      
      <div className="morse-display" style={{ marginBottom: '1.5rem', minHeight: 'auto' }}>
        {message}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontWeight: 600, fontSize: '0.9rem', opacity: 0.8 }}>Send a Response</p>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          rows={3}
          placeholder="Type your reply here..."
          style={{ resize: 'none' }}
        />
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="glass-button" 
            style={{ flex: 1, background: 'var(--secondary)', boxShadow: '0 4px 14px 0 rgba(121, 40, 202, 0.4)' }}
            onClick={startTransmission}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Zap size={18} fill="currentColor" />
              Flash Reply
            </div>
          </button>
          <button 
            className="glass-button secondary" 
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>

      <AnimatePresence>
        {transmitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', 
              top: 0, left: 0, right: 0, bottom: 0, 
              background: flashColor, 
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.05s linear'
            }}
          >
            <div style={{ background: 'rgba(0,0,0,0.8)', padding: '2rem', borderRadius: '24px', textAlign: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Zap size={48} color="#00dfd8" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Transmitting...</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>Hold your phone up to the scanner.</p>
                <button 
                    className="glass-button" 
                    style={{ background: '#ff4b4b' }}
                    onClick={() => setTransmitting(false)}
                >
                    <X size={18} /> Cancel
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
