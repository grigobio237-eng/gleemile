import React from 'react';

interface NotificationBadgeProps {
  count?: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (!count || count <= 0) return null;
  
  const displayCount = count > 99 ? '99+' : count;

  return (
    <div className="absolute -top-1.5 -right-1.5 bg-[#E05A47] ring-2 ring-[#FAF9F6] text-[11px] font-bold px-1.5 min-w-[18px] h-4 flex items-center justify-center rounded-full text-white z-10 shadow-sm animate-bounce">
      {displayCount}
    </div>
  );
}
