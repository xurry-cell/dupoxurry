import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Video, Image as ImageIcon, Music, Volume2, VolumeX, Play, Pause, Mars, Venus, Disc } from 'lucide-react';
import { DateMemory } from '../types';
import { format } from 'date-fns';

interface MemoryDetailProps {
  memory: DateMemory | null;
  onClose: () => void;
}

export default function MemoryDetail({ memory, onClose }: MemoryDetailProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Reset state when a new memory opens
  React.useEffect(() => {
    setIsMuted(false);
    setVolume(1);
    setIsPlaying(false);
  }, [memory?.id]);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (memory.id === 'test-memory-id') {
      setIsPlaying(!isPlaying);
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  if (!memory) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="fixed top-4 right-4 md:top-8 md:right-8 z-[110] p-3 md:p-4 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-bento-card w-full max-w-5xl rounded-[40px] overflow-hidden shadow-2xl border border-white/10 my-auto"
        >
          <div className="p-8 md:p-12 border-b border-bento-border">
             <div className="flex flex-col gap-4">
               <div>
                  <h2 className="text-4xl md:text-5xl font-serif italic text-bento-text mb-6">
                    {memory.title}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-bento-bg px-4 py-2 rounded-full text-xs font-bold text-bento-text uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(memory.date), 'MMMM dd, yyyy')}
                    </span>
                    <span className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider flex items-center gap-2 ${memory.author === 'duPO' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-pink-500/10 text-pink-500 border border-pink-500/20'}`}>
                      {memory.author === 'duPO' ? <Mars className="w-4 h-4" /> : <Venus className="w-4 h-4" />}
                      {memory.author || 'xurry'}
                    </span>
                    {memory.musicUrl && (
                      <div className="flex items-center gap-3 bg-bento-bg px-5 py-2.5 rounded-full border border-bento-border/50 shadow-sm overflow-hidden group">
                        <div className={`${isPlaying ? 'animate-spin-slow text-bento-accent' : 'text-bento-text'} transition-colors duration-500`}>
                          <Disc className="w-5 h-5" />
                        </div>
                        
                        <div className="min-w-0 flex items-center pr-2">
                          <span className={`${isPlaying ? 'text-bento-accent' : 'text-bento-text'} text-sm sm:text-base font-serif italic truncate max-w-[180px] md:max-w-[350px] leading-tight transition-colors duration-300`}>
                            {memory.songTitle || 'Bản nhạc kỷ niệm'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 ml-2 border-l border-bento-border pl-2">
                          <button
                            onClick={togglePlay}
                            className={`p-1.5 rounded-full transition-all hover:bg-white/5 ${isPlaying ? 'text-bento-accent' : 'text-bento-text'}`}
                            title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
                          >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                          </button>
                        </div>

                        <audio
                          ref={audioRef}
                          src={memory.musicUrl}
                          autoPlay
                          playsInline
                          loop
                          muted={isMuted}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
               </div>
             </div>
          </div>

          <div className="p-8 md:p-12 bg-bento-bg">
            <h3 className="text-xs uppercase tracking-widest text-bento-muted font-bold mb-8">Khoảnh khắc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {memory.mediaType === 'video' ? (
                 <video
                   src={memory.mediaUrls?.[0] || (memory as any).mediaUrl}
                   controls
                   className="w-full rounded-3xl md:col-span-2 object-contain bg-black max-h-[70vh]"
                 />
               ) : (
                 memory.mediaUrls?.map((url, i) => (
                   <img
                     key={i}
                     src={url}
                     alt={`${memory.title} - ${i}`}
                     onClick={() => setSelectedImage(url)}
                     className={`max-w-full h-auto rounded-3xl object-contain object-center max-h-[85vh] mx-auto cursor-pointer transition-transform hover:scale-[1.02] ${memory.mediaUrls.length === 1 && !memory.note ? 'md:col-span-2' : ''}`}
                   />
                 ))
               )}

               {memory.note && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className={`p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-sm border-t-[6px] flex flex-col bg-bento-accent border-black/10 ${((!memory.mediaUrls || memory.mediaUrls.length === 0) || (memory.mediaUrls?.length === 1 && memory.mediaType === 'image')) ? '' : 'md:col-span-2'}`}
                 >
                   <div className="relative z-10 flex flex-col h-full">
                     <div className="flex items-center justify-between mb-6">
                       <h4 className="text-[10px] uppercase tracking-[0.25em] text-black/40 font-bold flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full ${memory.author === 'duPO' ? 'bg-blue-500' : 'bg-pink-500'}`} />
                         NOTE
                       </h4>
                       <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
                         {memory.author === 'duPO' ? <Mars className="w-4 h-4 text-blue-500" /> : <Venus className="w-4 h-4 text-pink-500" />}
                       </div>
                     </div>
                     
                     <p className="text-black font-mono text-base md:text-lg leading-relaxed whitespace-pre-wrap flex-1">
                       {memory.note}
                     </p>

                     <div className="mt-8 pt-6 border-t border-black/10 flex justify-end">
                       <span className="font-mono text-black/60">
                         — {memory.author || 'xurry'}
                       </span>
                     </div>
                   </div>
                   
                   {/* Mock Tape */}
                   <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/30 backdrop-blur-sm -rotate-1 border border-white/10" />
                 </motion.div>
               )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Fullscreen Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 md:top-8 md:right-8 z-[130] p-3 md:p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              src={selectedImage}
              alt="Full size view"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
