'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, CameraOff, Square, Play } from 'lucide-react';
import { MorseDecoder } from '../lib/morse-decoder';

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
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const decoder = new MorseDecoder((char) => {
        // Handled in the text update
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
        const size = 20;
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
    <div className="premium-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Camera size={24} color="#00dfd8" />
          Morse Scanner
        </h2>
        {scanning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00dfd8' }}>
            <span className="pulse-dot"></span>
            LIVE
          </div>
        )}
      </div>

      <div className="camera-container">
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: scanning ? 'block' : 'none' }}
          muted
          playsInline
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {scanning && (
          <>
            <div className="scanner-overlay">
              <div className="scanning-line"></div>
              {/* Center Target */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: 40, height: 40, border: '2px solid var(--accent)', transform: 'translate(-50%, -50%)', borderRadius: 4 }}></div>
            </div>
            {/* Signal Meter */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <div style={{ 
                    width: `${(signal.value / 255) * 100}%`, 
                    height: '100%', 
                    background: signal.value > signal.threshold ? 'var(--accent)' : '#ff4b4b',
                    boxShadow: signal.value > signal.threshold ? '0 0 10px var(--accent)' : 'none',
                    transition: 'width 0.05s linear'
                }}></div>
                <div style={{ position: 'absolute', left: `${(signal.threshold / 255) * 100}%`, top: -5, width: 2, height: 14, background: '#fff' }}></div>
            </div>
          </>
        )}

        {!scanning && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <CameraOff size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ opacity: 0.6, maxWidth: '280px' }}>Point your camera at a flashing light source to begin decoding.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {scanning ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="morse-display">
              {liveText || <span style={{ opacity: 0.3 }}>Waiting for signal...</span>}
            </div>
            <button className="glass-button" style={{ background: '#ff4b4b', boxShadow: '0 4px 14px 0 rgba(255, 75, 75, 0.4)' }} onClick={stopScanning}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Square size={18} fill="currentColor" />
                Stop & Capture
              </div>
            </button>
          </div>
        ) : (
          <button className="glass-button" style={{ width: '100%' }} onClick={startScanning}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Play size={18} fill="currentColor" />
                Start Scanner
              </div>
          </button>
        )}
        {cameraError && <p style={{ color: '#ff4b4b', marginTop: '1rem', fontSize: '0.9rem' }}>{cameraError}</p>}
      </div>

      <style jsx>{`
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #00dfd8;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
