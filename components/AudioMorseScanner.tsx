'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Activity } from 'lucide-react';
import { MorseDecoder } from '../lib/morse-decoder';

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
        // Updated in loop
      });
      decoderRef.current = decoder;
      setScanning(true);
      setLiveText('');

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      const processFrame = () => {
        if (!analyserRef.current || !decoderRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Morse code beeps are usually between 400Hz and 1200Hz.
        // With fftSize 512, bin size is ~audioContext.sampleRate / 512.
        // For 44.1kHz, bin size is ~86Hz.
        // We look for the peak in the expected Morse frequency range (bins 5 to 20 approx).
        let peakLevel = 0;
        for (let i = 4; i < 30; i++) {
          if (dataArray[i] > peakLevel) peakLevel = dataArray[i];
        }

        // Draw Visualizer
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(0, 223, 216, 0.2)';
          const barWidth = (canvas.width / bufferLength) * 2.5;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        }

        decoderRef.current.feed(peakLevel, performance.now());
        setLiveText(decoderRef.current.getText());
        setSignal({ value: peakLevel, threshold: decoderRef.current.getThreshold() });

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="premium-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mic size={24} color="#00dfd8" />
          Audio Scanner
        </h2>
        {scanning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00dfd8' }}>
            <Activity size={18} className="pulse-icon" />
            LISTENING
          </div>
        )}
      </div>

      <div className="camera-container" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,223,216,0.05) 100%)' }}>
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={150} 
          style={{ width: '100%', height: '100%', display: scanning ? 'block' : 'none' }} 
        />
        
        {scanning && (
          <>
            <div className="scanner-overlay" style={{ pointerEvents: 'none' }}>
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.1 }}>
                  <Mic size={80} color="#00dfd8" />
               </div>
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
            <MicOff size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ opacity: 0.6, maxWidth: '280px' }}>Place your device near a Morse code audio source to begin decoding.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {scanning ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="morse-display">
              {liveText || <span style={{ opacity: 0.3 }}>Listening for signal...</span>}
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
                Start Audio Scanner
              </div>
          </button>
        )}
        {audioError && <p style={{ color: '#ff4b4b', marginTop: '1rem', fontSize: '0.9rem' }}>{audioError}</p>}
      </div>

      <style jsx>{`
        .pulse-icon {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
