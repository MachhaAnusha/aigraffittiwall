import { useState, useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ children, title = 'Settings' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = startY.current - e.changedTouches[0].clientY;
    if (delta > 40) setExpanded(true);
    if (delta < -40) setExpanded(false);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-border rounded-t-2xl transition-all duration-300 md:hidden ${
        expanded ? 'h-[70vh]' : 'h-14'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="w-12 h-1 bg-border rounded-full mx-auto mt-2 mb-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      />
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="font-bangers text-lg text-accent-primary">{title}</span>
        <button
          type="button"
          className="text-text-secondary text-sm min-h-[44px] min-w-[44px]"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▲'}
        </button>
      </div>
      <div className={`overflow-y-auto px-4 pb-8 ${expanded ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
}
