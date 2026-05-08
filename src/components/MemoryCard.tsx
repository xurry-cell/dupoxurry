import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Trash2, Edit2, Music, Video, Image as ImageIcon, Heart, Mars, Venus } from 'lucide-react';
import { DateMemory } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface MemoryCardProps {
  memory: DateMemory;
  onDelete: (id: string) => void | Promise<void>;
  onEdit: (memory: DateMemory) => void;
  onView: (memory: DateMemory) => void;
  isAdmin: boolean;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onDelete, onEdit, onView, isAdmin }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const isVideo = memory.mediaType === 'video';
  const displayUrl = memory.mediaUrls?.[0] || (memory as any).mediaUrl;
  const mediaCount = memory.mediaUrls?.length || 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col bg-bento-card rounded-[32px] p-6 shadow-sm border border-bento-border overflow-hidden h-[380px] md:h-[420px] cursor-pointer"
      onClick={() => onView(memory)}
      id={`memory-${memory.id}`}
    >
      {/* Date Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex flex-col gap-2">
          <span className="bg-bento-bg/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-bento-text uppercase tracking-wider w-fit">
            {format(new Date(memory.date), 'MMMM dd, yyyy')}
          </span>
        </div>
        <div className="flex gap-2">
          {memory.musicUrl && (
            <div className="w-8 h-8 bg-bento-bg rounded-full flex items-center justify-center shadow-sm text-bento-accent">
              <Music className="w-4 h-4" />
            </div>
          )}
          <div className={`w-8 h-8 bg-bento-bg rounded-full flex items-center justify-center shadow-sm ${
            !isVideo ? (memory.author === 'duPO' ? 'text-blue-500' : 'text-pink-500') : 'text-bento-accent'
          }`}>
            {isVideo ? (
              <Video className="w-4 h-4" />
            ) : (
              memory.author === 'duPO' ? <Mars className="w-4 h-4" /> : <Venus className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Media Placeholder/Preview */}
      <div className="relative flex-grow rounded-2xl overflow-hidden bg-bento-bg border border-bento-border mb-4">
        {isVideo ? (
          <video
            src={displayUrl}
            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 min-h-[160px]"
            muted
            loop
            autoPlay
          />
        ) : mediaCount === 1 ? (
          <img
            src={displayUrl}
            alt={memory.title}
            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 min-h-[160px]"
          />
        ) : (
          <div className={cn(
            "h-full w-full grid gap-1 relative min-h-[160px]",
            mediaCount === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2"
          )}>
            {memory.mediaUrls.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${memory.title} - ${i}`}
                className={cn(
                  "h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500",
                  mediaCount === 3 && i === 0 ? "row-span-2" : ""
                )}
              />
            ))}
          </div>
        )}
        
        {mediaCount > 4 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold border border-white/10 z-10">
            +{mediaCount - 4}
          </div>
        )}

        {/* Subtle Overlay for Video/Grid */}
        {(isVideo || mediaCount > 1) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-serif text-bento-text mb-2 leading-tight">
          {memory.title}
        </h3>
        
        <div className="flex items-center justify-end mt-auto">
          {isAdmin && memory.id !== 'test-memory-id' && (
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(memory);
                }}
                className="p-2 text-bento-muted hover:text-bento-text transition-all duration-300"
                aria-label="Edit memory"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(true);
                }}
                className="p-2 text-bento-muted hover:text-rose-500 transition-all duration-300"
                aria-label="Delete memory"
                id={`delete-${memory.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isConfirmingDelete && (
        <div className="absolute inset-0 bg-bento-bg/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
          <Trash2 className="w-10 h-10 text-rose-500 mb-4" />
          <p className="text-sm font-bold text-bento-text mb-6">Bạn có chắc chắn muốn xóa kỷ niệm này?</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmingDelete(false);
              }}
              className="flex-1 py-3 items-center justify-center rounded-2xl text-xs font-bold uppercase tracking-wider bg-bento-card border border-bento-border text-bento-text hover:bg-bento-border transition-all"
            >
              Hủy
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmingDelete(false);
                memory.id && onDelete(memory.id);
              }}
              className="flex-1 py-3 items-center justify-center rounded-2xl text-xs font-bold uppercase tracking-wider bg-rose-500 text-white hover:bg-rose-600 transition-all"
            >
              Xóa
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
