import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Image as ImageIcon, Video, Calendar as CalendarIcon, Loader2, Upload } from 'lucide-react';
import { MediaType, DateMemory } from '../types';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageCompressor';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface MemoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    title: string; 
    date: string; 
    mediaUrls: string[]; 
    mediaType: MediaType;
    musicUrl?: string;
  }) => Promise<void>;
  editingMemory?: DateMemory | null;
}

export default function MemoryForm({ isOpen, onClose, onSubmit, editingMemory }: MemoryFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  React.useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title);
      setDate(editingMemory.date);
      setMediaUrls(editingMemory.mediaUrls || [(editingMemory as any).mediaUrl].filter(Boolean) || []);
      setMediaType(editingMemory.mediaType);
      setMusicUrl(editingMemory.musicUrl || '');
      setMusicFile(null);
      setFileError('');
      setUploadProgress(0);
    } else {
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setMediaUrls([]);
      setMediaType('image');
      setMusicUrl('');
      setMusicFile(null);
      setFileError('');
      setUploadProgress(0);
    }
  }, [editingMemory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = mediaUrls.filter(url => url.trim() !== '');
    if (!title || validUrls.length === 0) return;
    if (fileError) return;

    setLoading(true);
    try {
      let finalMusicUrl = musicUrl;
      
      if (musicFile) {
        if (musicFile.size > 500 * 1024) {
          setFileError('File nhạc quá lớn! Do sử dụng Database miễn phí nên chỉ hỗ trợ file dưới 500KB. Vui lòng cắt nhạc ngắn hơn (tầm 15-30s) hoặc sử dụng link nhạc gốc nhé!');
          setLoading(false);
          return;
        }

        finalMusicUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(musicFile);
        });
      }

      await onSubmit({ title, date, mediaUrls: validUrls, mediaType, musicUrl: finalMusicUrl });
      onClose();
    } catch (error) {
      console.error('Error uploading file or saving memory:', error);
      alert('Có lỗi xảy ra khi lưu kỉ niệm hoặc xử lý file. Bạn có thể cần kiểm tra Storage Firebase Rules.');
    } finally {
      setLoading(false);
    }
  };

  const addMediaUrl = () => setMediaUrls([...mediaUrls, '']);
  const updateMediaUrl = (index: number, value: string) => {
    const newUrls = [...mediaUrls];
    newUrls[index] = value;
    setMediaUrls(newUrls);
  };
  const removeMediaUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setLoading(true);
    setFileError('');
    try {
      const compressedImages = await Promise.all(
        files.map(file => compressImage(file, 800))
      );
      setMediaUrls(prev => {
        const filtered = prev.filter(url => url.trim() !== '');
        return [...filtered, ...compressedImages];
      });
    } catch (error) {
      console.error(error);
      setFileError('Lỗi tải ảnh, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setFileError('Video quá lớn, tối đa 50MB.');
      return;
    }

    setLoading(true);
    setFileError('');
    setUploadProgress(0);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `videos/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading video:', error);
          setFileError('Lỗi tải lên video. Bạn có thể cần chờ Quota hoặc thiết lập Firebase Storage Rules.');
          setLoading(false);
          setUploadProgress(0);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setMediaUrls(urls => {
             const withoutEmpty = urls.filter(u => u.trim() !== '');
             return [...withoutEmpty, downloadURL];
          });
          setLoading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error(error);
      setFileError('Lỗi tải video, vui lòng thử lại.');
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-bento-bg border-l border-bento-border z-[101] p-8 overflow-y-auto"
            id="memory-form-container"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-serif italic text-bento-text mb-2">
                  {editingMemory ? 'Chỉnh sửa' : 'Kỉ niệm mới'}
                </h2>
                <p className="text-xs text-bento-muted tracking-widest uppercase font-bold">Lưu giữ khoảnh khắc</p>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-bento-card border border-bento-border rounded-2xl text-bento-muted hover:text-bento-text transition-all shadow-sm"
                id="close-form"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Tiêu đề buổi hẹn
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dinner at the harbor..."
                  className="w-full bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all placeholder:text-bento-muted shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Ngày tháng
                </label>
                <div className="relative">
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all shadow-sm"
                  />
                  <CalendarIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-muted pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Loại phương tiện chính
                </label>
                <div className="flex gap-2">
                  {(['image', 'video'] as MediaType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        if (mediaType !== type) {
                          setMediaType(type);
                          if (type === 'video') {
                            setMediaUrls(urls => {
                              const withoutBase64 = urls.filter(u => !u.startsWith('data:image'));
                              return withoutBase64.length ? withoutBase64 : [''];
                            });
                          }
                        }
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all uppercase text-[10px] tracking-widest font-bold shadow-sm",
                        mediaType === type
                          ? "bg-bento-accent text-bento-text border-bento-accent"
                          : "bg-bento-card text-bento-muted border-bento-border hover:border-bento-accent"
                      )}
                    >
                      {type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1 block">
                  {mediaType === 'image' ? 'Tải ảnh lên (Khuyến nghị)' : 'Tải video lên'}
                </label>
                
                {mediaType === 'image' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {mediaUrls.map((url, index) => url.trim() !== '' ? (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-bento-border">
                          <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeMediaUrl(index)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null)}
                    </div>
                    <label className="w-full py-4 border-2 border-dashed border-bento-border rounded-2xl text-bento-muted hover:border-bento-accent hover:text-bento-text transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer bg-bento-card">
                      <Upload className="w-4 h-4" />
                      Tải ảnh từ máy
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {mediaUrls.map((url, index) => url.trim() !== '' ? (
                        <div key={index} className="relative aspect-video rounded-xl overflow-hidden group border border-bento-border">
                          <video src={url} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeMediaUrl(index)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null)}
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-bento-card border border-bento-border rounded-full h-2 mb-4 overflow-hidden">
                        <div className="bg-bento-accent h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                    <label className="w-full py-4 border-2 border-dashed border-bento-border rounded-2xl text-bento-muted hover:border-bento-accent hover:text-bento-text transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer bg-bento-card">
                      <Upload className="w-4 h-4" />
                      Tải video từ máy
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={handleVideoUpload} 
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Nhạc buổi hẹn (File âm thanh)
                </label>
                {fileError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm font-medium">
                    {fileError}
                  </div>
                )}
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setMusicFile(file);
                    if (file && file.size > 500 * 1024) {
                      setFileError('File quá lớn (tối đa 500KB). Vui lòng chọn file nhẹ hơn hoặc dùng link nhạc (như Drive, Soundcloud, Zingmp3...).');
                    } else {
                      setFileError('');
                    }
                  }}
                  className="w-full bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-bento-accent file:text-bento-bg hover:file:brightness-110 file:cursor-pointer"
                />
                {!musicFile && (
                  <input
                    type="url"
                    value={musicUrl}
                    onChange={(e) => setMusicUrl(e.target.value)}
                    placeholder="Hoặc gắn link nhạc (Optional)..."
                    className="w-full mt-2 bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all placeholder:text-bento-muted shadow-sm"
                  />
                )}
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-bento-accent text-bento-bg font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
                id="submit-memory"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {editingMemory ? 'Cập nhật kỉ niệm' : 'Lưu kỉ niệm'}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
