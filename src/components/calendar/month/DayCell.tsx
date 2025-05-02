
import React, { useCallback } from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import { cn } from "@/lib/utils";

interface DayCellProps {
  day: Date | null;
  isCurrentMonth: boolean;
  appointmentsCount: number;
  blocksCount: number;
  occupancyPercentage: number;
  isFullDayBlocked: boolean;
  onClick: () => void;
}

export const DayCell: React.FC<DayCellProps> = React.memo(({
  day,
  isCurrentMonth,
  appointmentsCount,
  blocksCount,
  occupancyPercentage,
  isFullDayBlocked,
  onClick
}) => {
  if (!day) return <div className="aspect-square" />;
  
  const isCurrentDay = isToday(day);
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <div 
      className={cn(
        "aspect-square border rounded-full p-1 relative cursor-pointer transition-colors", 
        isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground", 
        isCurrentDay && "border-rose-500", 
        isFullDayBlocked && "bg-gray-50", 
        "hover:border-rose-300"
      )} 
      onClick={handleClick}
    >
      {/* Circular border showing occupancy */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden" 
        style={{
          background: isCurrentMonth && occupancyPercentage > 0 
            ? `conic-gradient(#3B82F6 ${occupancyPercentage}%, transparent 0)` 
            : 'transparent',
          transform: 'rotate(-90deg)'
        }} 
      />
      
      {/* Day number at center */}
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium z-10">
        {format(day, 'd')}
      </div>
      
      {/* Appointments count indicator */}
      {isCurrentMonth && appointmentsCount > 0 && (
        <div className="absolute top-1 right-1 z-10 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
          {appointmentsCount}
        </div>
      )}
      
      {/* Blocks count indicator */}
      {isCurrentMonth && blocksCount > 0 && (
        <div className="absolute top-1 left-1 z-10 bg-gray-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
          {blocksCount}
        </div>
      )}
    </div>
  );
});

DayCell.displayName = 'DayCell';
