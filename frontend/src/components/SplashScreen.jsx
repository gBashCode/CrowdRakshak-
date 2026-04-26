import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading → ready → exit

  useEffect(() => {
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate towards end
        const increment = prev < 60 ? 2 : prev < 85 ? 3 : 4;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && phase === 'loading') {
      setTimeout(() => setPhase('ready'), 400);
    }
    if (phase === 'ready') {
      setTimeout(() => setPhase('exit'), 800);
    }
    if (phase === 'exit') {
      setTimeout(() => onComplete(), 700);
    }
  }, [progress, phase, onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#020617',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      opacity: phase === 'exit' ? 0 : 1,
      transform: phase === 'exit' ? 'scale(1.08)' : 'scale(1)',
      transition: 'opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1)',
      overflow: 'hidden',
    }}>
      {/* Background grid effect */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        animation: 'splash-grid-move 8s linear infinite',
      }} />

      {/* Radial glow behind logo */}
      <div style={{
        position: 'absolute',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(219,39,119,0.06) 40%, transparent 70%)',
        animation: 'splash-breathe 3s ease-in-out infinite',
      }} />

      {/* Rotating ring 1 */}
      <div style={{
        position: 'absolute',
        width: 280, height: 280,
        borderRadius: '50%',
        border: '1px solid rgba(124,58,237,0.15)',
        borderTopColor: 'rgba(124,58,237,0.5)',
        animation: 'splash-spin 4s linear infinite',
      }} />

      {/* Rotating ring 2 (counter) */}
      <div style={{
        position: 'absolute',
        width: 320, height: 320,
        borderRadius: '50%',
        border: '1px solid rgba(219,39,119,0.08)',
        borderBottomColor: 'rgba(219,39,119,0.35)',
        animation: 'splash-spin-reverse 6s linear infinite',
      }} />

      {/* Rotating ring 3 (outer) */}
      <div style={{
        position: 'absolute',
        width: 380, height: 380,
        borderRadius: '50%',
        border: '1px dashed rgba(59,130,246,0.08)',
        borderLeftColor: 'rgba(59,130,246,0.2)',
        animation: 'splash-spin 10s linear infinite',
      }} />

      {/* Logo container */}
      <div style={{
        position: 'relative', zIndex: 2,
        animation: 'splash-logo-enter 0.8s cubic-bezier(.16,1,.3,1) forwards',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 24,
      }}>
        {/* Logo image */}
        <div style={{
          width: 100, height: 100,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 0 80px rgba(124,58,237,0.1), 0 8px 32px rgba(0,0,0,0.5)',
          border: '2px solid rgba(124,58,237,0.3)',
          background: '#f1f5f9',
          animation: 'splash-logo-pulse 2s ease-in-out infinite',
        }}>
          <img
            src="/logo.png"
            alt="CrowdRakshak"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 32, fontWeight: 900,
            background: 'linear-gradient(135deg, #f1f5f9 0%, #c4b5fd 50%, #f9a8d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
            marginBottom: 8,
          }}>
            CrowdRakshak
          </h1>
          <p style={{
            fontSize: 13, fontWeight: 500,
            color: '#64748b',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            animation: 'splash-text-fade 1s 0.4s cubic-bezier(.16,1,.3,1) both',
          }}>
            AI Crowd Intelligence
          </p>
        </div>
      </div>

      {/* Progress bar section */}
      <div style={{
        position: 'relative', zIndex: 2,
        marginTop: 48,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
        animation: 'splash-text-fade 0.6s 0.3s cubic-bezier(.16,1,.3,1) both',
      }}>
        {/* Progress bar */}
        <div style={{
          width: 220, height: 3,
          background: 'rgba(148,163,184,0.1)',
          borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7c3aed, #db2777, #3b82f6)',
            borderRadius: 99,
            transition: 'width 0.15s ease-out',
            boxShadow: '0 0 12px rgba(124,58,237,0.5)',
          }} />
        </div>

        {/* Status text */}
        <p style={{
          fontSize: 10, fontWeight: 600,
          color: phase === 'ready' ? '#4ade80' : '#475569',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          transition: 'color 0.3s ease',
        }}>
          {phase === 'ready' || phase === 'exit'
            ? '● Systems Online'
            : progress < 30
              ? 'Initializing sensors...'
              : progress < 60
                ? 'Loading temple data...'
                : progress < 85
                  ? 'Connecting to grid...'
                  : 'Calibrating heatmaps...'
          }
        </p>
      </div>

      {/* Scanning line effect */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), rgba(219,39,119,0.3), transparent)',
        animation: 'splash-scan 2.5s ease-in-out infinite',
      }} />

      {/* Bottom tagline */}
      <div style={{
        position: 'absolute', bottom: 32,
        display: 'flex', alignItems: 'center', gap: 8,
        animation: 'splash-text-fade 1s 0.6s cubic-bezier(.16,1,.3,1) both',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 8px rgba(34,197,94,0.5)',
          animation: 'splash-dot-blink 1.5s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 10, color: '#334155', fontWeight: 500, letterSpacing: '0.05em' }}>
          Protecting crowds with artificial intelligence
        </span>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes splash-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes splash-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes splash-breathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes splash-logo-enter {
          from { opacity: 0; transform: scale(0.7) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splash-logo-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(124,58,237,0.3), 0 0 80px rgba(124,58,237,0.1), 0 8px 32px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 50px rgba(124,58,237,0.45), 0 0 100px rgba(124,58,237,0.15), 0 8px 32px rgba(0,0,0,0.5); }
        }
        @keyframes splash-text-fade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-scan {
          0% { top: -2px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes splash-dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes splash-grid-move {
          from { transform: translate(0, 0); }
          to { transform: translate(60px, 60px); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
