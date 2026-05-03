import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Video, Image as ImageIcon, Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';
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
    <AnimatePresence>
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
                    {memory.musicUrl && (
                      <div className="flex items-center gap-2">
                        {!memory.musicUrl.startsWith('data:') && !memory.musicUrl.startsWith('blob:') && !memory.musicUrl.includes('firebasestorage.googleapis.com') && (
                          <a href={memory.musicUrl} target="_blank" rel="noopener noreferrer" className="bg-bento-accent/10 text-bento-accent px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-bento-accent/20 transition-all">
                            <Music className="w-4 h-4" />
                            Link bài hát
                          </a>
                        )}
                      <div className="flex items-center gap-2 bg-bento-bg px-4 py-2 rounded-full">
                        <button
                          onClick={togglePlay}
                          className="text-xs font-bold text-bento-text uppercase tracking-wider flex items-center gap-2 hover:opacity-80 transition-all"
                        >
                          {isPlaying ? <Pause className="w-4 h-4 text-bento-accent" /> : <Play className="w-4 h-4 text-stone-400" />}
                          {isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            setVolume(parseFloat(e.target.value));
                            if (parseFloat(e.target.value) > 0 && isMuted) {
                              setIsMuted(false);
                            }
                          }}
                          className="w-20 md:w-24 h-1.5 appearance-none rounded-lg outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-bento-text [&::-webkit-slider-thumb]:rounded-full hidden md:block"
                          style={{
                            background: `linear-gradient(to right, var(--color-bento-accent) ${(isMuted ? 0 : volume) * 100}%, var(--color-bento-border) ${(isMuted ? 0 : volume) * 100}%)`
                          }}
                        />
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="text-bento-text hover:opacity-80 transition-all hidden md:block"
                        >
                            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
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
                      </div>
                    )}
                  </div>
               </div>
             </div>
          </div>

          <div className="p-8 md:p-12 bg-bento-bg">
            <h3 className="text-xs uppercase tracking-widest text-bento-muted font-bold mb-8">Khoảnh khắc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                     className={`max-w-full h-auto rounded-3xl object-contain object-center max-h-[85vh] mx-auto cursor-pointer transition-transform hover:scale-[1.02] ${memory.mediaUrls.length === 1 ? 'md:col-span-2' : ''}`}
                   />
                 ))
               )}
            </div>
          </div>
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
      </motion.div>
    </AnimatePresence>
  );
}
