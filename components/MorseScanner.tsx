'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera as CameraIcon, CameraOff, Square, Play, Scan } from 'lucide-react';
import { MorseDecoder } from '../lib/morse-decoder';
import { motion, AnimatePresence } from 'framer-motion';

interface MorseScannerProps {
  onMessageDecoded: (message: string) => void;
}

export const MorseScanner: React.FC<MorseScannerProps> = ({ onMessageDecoded }) => {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [liveText, setLiveText] = useState('');
  const [signal, setSignal] = useState({ value: 0, threshold: 150 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const decoderRef = useRef<MorseDecoder | null>(null);
  const animationFrameRef = useRef<number>(0);

  const startScanning = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const decoder = new MorseDecoder((char) => {
        // Handled via getText()
      });
      decoderRef.current = decoder;
      setScanning(true);
      setLiveText('');

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;

      const processFrame = () => {
        if (!videoRef.current || !decoderRef.current) return;
        if (videoRef.current.readyState < 2) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }

        // Sample a small square in the center
        const size = 30;
        const x = (videoRef.current.videoWidth - size) / 2;
        const y = (videoRef.current.videoHeight - size) / 2;
        
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(videoRef.current, x, y, size, size, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        
        let sum = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
          sum += imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
        }
        const avgLuminance = sum / (size * size);

        decoderRef.current.feed(avgLuminance, performance.now());
        setLiveText(decoderRef.current.getText());
        setSignal({ value: avgLuminance, threshold: decoderRef.current.getThreshold() });

        animationFrameRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
    } catch (err: any) {
      setCameraError('Camera access denied: ' + err.message);
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
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
          <CameraIcon size={20} />
          <h2>Camera Scanner</h2>
        </div>
        {scanning && (
          <div className="status-badge">
            <span className="pulse-dot"></span>
            <span>Live Detection</span>
          </div>
        )}
      </div>

      <div className="camera-viewport camera-container">
        <video
          ref={videoRef}
          className="video-feed"
          muted
          playsInline
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <AnimatePresence>
          {scanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="scanner-overlay"
            >
              <div className="scanning-line"></div>
              <div className="center-target">
                <Scan size={40} strokeWidth={1} />
              </div>
              
              <div className="signal-meter-container">
                <div className="signal-labels">
                  <span>Signal</span>
                  <span>{Math.round(signal.value)}</span>
                </div>
                <div className="meter-track">
                  <div 
                    className="meter-fill"
                    style={{ 
                      width: `${(signal.value / 255) * 100}%`,
                      background: signal.value > signal.threshold ? 'var(--primary)' : 'var(--secondary)'
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
          <div className="camera-placeholder">
            <CameraOff size={48} />
            <p>Point your camera at a flashing light source</p>
          </div>
        )}
      </div>

      <div className="scanner-controls">
        {scanning ? (
          <div className="active-controls">
            <div className="morse-display-minimal">
              {liveText || <span className="placeholder">Awaiting signal...</span>}
            </div>
            <button className="glass-button danger" onClick={stopScanning}>
              <Square size={16} fill="currentColor" />
              Stop & Decode
            </button>
          </div>
        ) : (
          <button className="glass-button" onClick={startScanning}>
            <Play size={16} fill="currentColor" />
            Start Scanner
          </button>
        )}
        {cameraError && <p className="error-message">{cameraError}</p>}
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
          color: var(--error);
          background: rgba(255, 69, 58, 0.1);
          padding: 4px 10px;
          border-radius: 100px;
        }
        .camera-viewport {
          height: 280px;
          background: #000;
        }
        .video-feed {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .center-target {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(255, 255, 255, 0.4);
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
        .camera-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          opacity: 0.2;
        }
        .camera-placeholder p {
          max-width: 200px;
          text-align: center;
          font-size: 0.9rem;
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
        .error-message {
          color: var(--error);
          font-size: 0.85rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
