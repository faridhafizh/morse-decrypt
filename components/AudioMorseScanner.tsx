'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Activity } from 'lucide-react';
import { MorseDecoder } from '../lib/morse-decoder';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioMorseScannerProps {
  onMessageDecoded: (message: string) => void;
}

export const AudioMorseScanner: React.FC<AudioMorseScannerProps> = ({ onMessageDecoded }) => {
  const [scanning, setScanning] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [liveText, setLiveText] = useState('');
  const [signal, setSignal] = useState({ value: 0, threshold: 150 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decoderRef = useRef<MorseDecoder | null>(null);
  const animationFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = useCallback(async () => {
    setAudioError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const decoder = new MorseDecoder((char) => {
        // Handled via live loop
      });
      decoderRef.current = decoder;
      setScanning(true);
      setLiveText('');

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const smoothedPeakRef = { current: 0 };

      const processFrame = () => {
        if (!analyserRef.current || !decoderRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Morse code beeps are usually between 600Hz and 800Hz.
        // Narrowing the range to bins 7 to 12 (~600Hz to ~1030Hz).
        let peakLevel = 0;
        for (let i = 7; i < 13; i++) {
          if (dataArray[i] > peakLevel) peakLevel = dataArray[i];
        }

        smoothedPeakRef.current = (smoothedPeakRef.current * 0.7) + (peakLevel * 0.3);
        const finalSignal = Math.round(smoothedPeakRef.current);

        // Draw Visualizer
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / bufferLength) * 2;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            const opacity = (dataArray[i] / 255) * 0.5 + 0.1;
            ctx.fillStyle = `rgba(0, 122, 255, ${opacity})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
          }
        }

        decoderRef.current.feed(finalSignal, performance.now());
        setLiveText(decoderRef.current.getText());
        setSignal({ value: finalSignal, threshold: decoderRef.current.getThreshold() });

        animationFrameRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
    } catch (err: any) {
      setAudioError('Microphone access denied: ' + err.message);
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setScanning(false);
    if (liveText.trim()) {
      onMessageDecoded(liveText);
    }
  }, [liveText, onMessageDecoded]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="scanner-card premium-card">
      <div className="scanner-header">
        <div className="title-group">
          <Mic size={20} />
          <h2>Audio Scanner</h2>
        </div>
        {scanning && (
          <div className="status-badge">
            <Activity size={14} className="pulse-icon" />
            <span>Listening</span>
          </div>
        )}
      </div>

      <div className="audio-viewport camera-container" style={{ background: 'linear-gradient(180deg, #1c1c1e 0%, #000 100%)' }}>
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={200} 
          className="visualizer-canvas"
          style={{ display: scanning ? 'block' : 'none' }} 
        />
        
        <AnimatePresence>
          {scanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="scanner-overlay"
            >
              <div className="signal-meter-container">
                <div className="signal-labels">
                  <span>Audio Level</span>
                  <span>{Math.round(signal.value)}</span>
                </div>
                <div className="meter-track">
                  <div 
                    className="meter-fill"
                    style={{ 
                      width: `${(signal.value / 255) * 100}%`, 
                      background: signal.value > signal.threshold ? 'var(--primary)' : 'rgba(255,255,255,0.2)'
                    }}
                  />
                  <div 
                    className="threshold-marker"
                    style={{ left: `${(signal.threshold / 255) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!scanning && (
          <div className="placeholder-content">
            <MicOff size={48} />
            <p>Place device near a Morse audio source</p>
          </div>
        )}
      </div>

      <div className="scanner-controls">
        {scanning ? (
          <div className="active-controls">
            <div className="morse-display-minimal">
              {liveText || <span className="placeholder">Awaiting frequency...</span>}
            </div>
            <button className="glass-button danger" onClick={stopScanning}>
              <Square size={16} fill="currentColor" />
              Stop & Capture
            </button>
          </div>
        ) : (
          <button className="glass-button" onClick={startScanning}>
            <Play size={16} fill="currentColor" />
            Start Listening
          </button>
        )}
        {audioError && <p className="error-message">{audioError}</p>}
      </div>

      <style jsx>{`
        .scanner-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .scanner-header {
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
        .title-group h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--primary);
          background: rgba(0, 122, 255, 0.1);
          padding: 4px 12px;
          border-radius: 100px;
        }
        .audio-viewport {
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .visualizer-canvas {
          width: 100%;
          height: 100%;
        }
        .signal-meter-container {
          position: absolute;
          bottom: 24px;
          left: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .signal-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          opacity: 0.6;
        }
        .meter-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          position: relative;
        }
        .meter-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.05s linear;
        }
        .threshold-marker {
          position: absolute;
          top: -4px;
          width: 2px;
          height: 12px;
          background: #fff;
          border-radius: 1px;
        }
        .placeholder-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          opacity: 0.2;
        }
        .active-controls {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .morse-display-minimal {
          background: var(--glass);
          border-radius: 12px;
          padding: 0.8rem;
          font-family: 'SF Mono', monospace;
          font-size: 1.1rem;
          min-height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--card-border);
          text-align: center;
        }
        .placeholder {
          opacity: 0.3;
          font-size: 1rem;
        }
        .pulse-icon {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .error-message {
          color: var(--error);
          font-size: 0.85rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
