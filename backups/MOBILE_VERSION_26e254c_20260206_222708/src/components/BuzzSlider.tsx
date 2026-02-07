import React from 'react';

interface BuzzSliderProps {
  value: number; // 0-100
  className?: string;
}

export const BuzzSlider: React.FC<BuzzSliderProps> = ({ value, className }) => {
  return (
    <div className={className} style={{ maxWidth: '75%' }}>
      <span className="text-xs text-gray-500 mb-0.5 block">Buzz</span>
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-full rounded-full"
          style={{
            width: `${value}%`,
            background: 'linear-gradient(to right, #8B5A2B 0%, #D4AF37 25%, #FBF5E9 50%, #D4AF37 75%, #8B5A2B 100%)'
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{
            left: `calc(${value}% - 6px)`,
            background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #FBF5E9 20%, #D4AF37 60%, #8B5A2B 100%)',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}
        />
      </div>
    </div>
  );
};
