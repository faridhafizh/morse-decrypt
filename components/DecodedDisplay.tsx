'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Zap, ArrowRight, CornerDownRight } from 'lucide-react';
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
      if (!transmitting) break; 
      setFlashColor(step.type === 'on' ? '#ffffff' : '#000000');
      await new Promise(r => setTimeout(r, step.duration));
    }

    setFlashColor('transparent');
    setTransmitting(false);
    setAnswerText('');
    onClear();
  };

  return (
    <div className="display-card premium-card">
      <div className="card-header">
        <div className="title-group">
          <MessageSquare size={18} />
          <h3>Captured Result</h3>
        </div>
        <button onClick={onClear} className="icon-btn-clear" title="Discard">
          <X size={16} />
        </button>
      </div>
      
      <div className="message-well">
        <div className="well-label">Decoded Text</div>
        <div className="morse-display-minimal">
          {message}
        </div>
      </div>

      <div className="response-section">
        <div className="response-header">
          <CornerDownRight size={14} />
          <span>Quick Reply</span>
        </div>
        <div className="input-group">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={2}
            placeholder="Enter reply for light transmission..."
            className="minimal-textarea"
          />
          <button 
            className={`glass-button ${!answerText.trim() ? 'disabled' : ''}`}
            onClick={startTransmission}
            disabled={!answerText.trim()}
          >
            <Zap size={16} fill="currentColor" />
            <span>Flash Reply</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {transmitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="transmission-overlay"
            style={{ backgroundColor: flashColor }}
          >
            <div className="transmission-modal">
                <Zap size={40} className="modal-icon" />
                <h2>Transmitting</h2>
                <p>Ensure your screen is visible to the receiver.</p>
                <button 
                    className="glass-button secondary cancel-btn"
                    onClick={() => setTransmitting(false)}
                >
                    <X size={16} /> Stop
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .display-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
          border-color: rgba(255, 255, 255, 0.15);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--secondary);
        }
        .title-group h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .icon-btn-clear {
          background: var(--glass);
          border: 1px solid var(--card-border);
          color: var(--secondary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .icon-btn-clear:hover {
          background: var(--error);
          color: white;
          border-color: var(--error);
        }
        .message-well {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .well-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.4;
        }
        .morse-display-minimal {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 1.25rem;
          font-family: 'SF Mono', monospace;
          font-size: 1.5rem;
          border: 1px solid var(--card-border);
          word-break: break-all;
          line-height: 1.2;
        }
        .response-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .response-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 500;
          opacity: 0.6;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .minimal-textarea {
          resize: none;
          background: var(--glass);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 1rem;
          font-size: 0.95rem;
          transition: border-color 0.2s ease;
        }
        .minimal-textarea:focus {
          border-color: var(--primary);
        }
        .disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
        .transmission-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.05s linear;
        }
        .transmission-modal {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          padding: 2.5rem;
          border-radius: 32px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 320px;
          width: 90%;
        }
        .modal-icon {
          color: var(--primary);
          margin-bottom: 1.5rem;
        }
        .transmission-modal h2 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: white;
        }
        .transmission-modal p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 2rem;
        }
        .cancel-btn {
          width: 100%;
        }
      `}</style>
    </div>
  );
};
