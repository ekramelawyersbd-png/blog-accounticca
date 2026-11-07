import { useState, useEffect } from 'react';

export function ReadProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        if (docHeight > 0) {
          const currentPct = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
          setProgress(currentPct);
        } else {
          setProgress(0);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-1.5 bg-transparent z-[100] pointer-events-none print:hidden"
      aria-hidden="true"
    >
      <div 
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(16,185,129,0.7)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

