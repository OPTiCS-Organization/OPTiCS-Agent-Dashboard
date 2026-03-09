import { useEffect, useState } from "react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function Button({ onClick, children, className = '', duration }: ButtonProps) {
  const [isDisabled, setIsDisabled] = useState(!!duration);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!duration) return;

    setProgress(0);
    setIsDisabled(true);

    // 애니메이션 시작
    const startTime = Date.now();
    const animationFrame = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(animationFrame);
      } else {
        setIsDisabled(false);
      }
    };

    requestAnimationFrame(animationFrame);
  }, [duration]);

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`bg-service-color text-xs py-2 px-3 rounded-md text-primary-text-color font-semibold relative overflow-hidden transition-all duration-200 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'hover:cursor-pointer active:opacity-80'} ${className}`}
    >
      {duration && (
        <div
          className="absolute inset-0 bg-button-progress-color transition-all duration-100"
          style={{
            width: `${progress}%`,
            transformOrigin: 'left'
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
