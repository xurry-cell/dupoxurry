import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { DateMemory } from '../types';

interface CalendarViewProps {
  memories: DateMemory[];
  onViewMemory: (memory: DateMemory) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ memories, onViewMemory }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Ensure 6 weeks are always shown for consistency (optional but often looks better)
  const rows: Date[][] = [];
  let currentWeek: Date[] = [];
  calendarDays.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      rows.push(currentWeek);
      currentWeek = [];
    }
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bento-card border border-bento-border rounded-[32px] overflow-hidden shadow-sm p-4 sm:p-8"
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-12 sm:mb-16">
        <div className="flex flex-col">
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-bento-text leading-none">
            {format(currentMonth, 'MMMM')}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-bento-bg rounded-full transition-colors text-bento-muted hover:text-bento-accent"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-bento-bg rounded-full transition-colors text-bento-muted hover:text-bento-accent"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="text-4xl sm:text-7xl font-black text-bento-text opacity-10">
          {format(currentMonth, 'yyyy')}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-4">
        {/* Day Headers */}
        {days.map((day) => (
          <div key={day} className={`text-[10px] sm:text-xs font-black uppercase tracking-widest text-bento-muted text-center py-2 sm:py-4`}>
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 3)}</span>
          </div>
        ))}

        {/* Day Tiles */}
        {calendarDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMemories = memories.filter(m => m.date === dateStr);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <motion.div
              key={day.toString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`min-h-[100px] sm:min-h-[140px] lg:min-h-[180px] rounded-2xl p-3 sm:p-4 relative flex flex-col group transition-all overflow-hidden border
                ${isCurrentMonth && dayMemories.length === 0 ? 'bg-bento-bg/50 border-bento-border/50' : 'bg-transparent border-transparent'}
                ${!isCurrentMonth ? 'opacity-20 pointer-events-none' : ''}
                ${dayMemories.length > 0 ? (dayMemories[0].author === 'duPO' ? 'bg-blue-600 border-blue-500 cursor-pointer hover:border-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-pink-600 border-pink-500 cursor-pointer hover:border-white shadow-[0_0_15px_rgba(236,72,153,0.3)]') : ''}
              `}
              onClick={() => dayMemories.length > 0 && onViewMemory(dayMemories[0])}
            >
              {dayMemories.length > 0 && (dayMemories[0].mediaUrls?.[0] || (dayMemories[0] as any).mediaUrl) && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                  {dayMemories[0].mediaType === 'video' ? (
                    <video src={dayMemories[0].mediaUrls?.[0] || (dayMemories[0] as any).mediaUrl} className="w-full h-full object-cover mix-blend-overlay opacity-60" muted loop playsInline />
                  ) : (
                    <img src={dayMemories[0].mediaUrls?.[0] || (dayMemories[0] as any).mediaUrl} alt={dayMemories[0].title} className="w-full h-full object-cover mix-blend-overlay opacity-60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                </div>
              )}

              <span className={`text-sm sm:text-base font-black relative z-10 ${isCurrentMonth ? (dayMemories.length > 0 ? 'text-white drop-shadow-md' : 'text-bento-muted/50') : 'text-bento-muted/20'}`}>
                {format(day, 'd')}
              </span>

              {dayMemories.length > 0 && (
                <div className="mt-auto relative z-10 flex flex-col pt-4">
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    {dayMemories[0].title}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
