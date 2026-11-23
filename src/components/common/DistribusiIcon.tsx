import React from 'react';

export const DistribusiIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ 
  className = 'w-5 h-5', 
  style 
}) => {
  return (
    <img 
      src="/images/icon-distribusi.png" 
      alt="Ikon Distribusi" 
      className={`inline-block object-contain shrink-0 ${className}`}
      style={style}
      loading="lazy"
    />
  );
};

export default DistribusiIcon;
