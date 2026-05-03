import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Heart, Image as ImageIcon, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { PersonalPhoto, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { compressImage } from '../lib/imageCompressor';

interface PhotoGridProps {
  category: 'dupo' | 'xurry';
}

export default function PhotoGrid({ category }: PhotoGridProps) {
  const [photos, setPhotos] = useState<PersonalPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const path = 'personal_photos';
    const q = query(
      collection(db, path),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as PersonalPhoto[];
      setPhotos(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return unsubscribe;
  }, [category]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      // Loop over files sequentially or in parallel
      for (const file of files) {
        // Simple prompt for title per file
        const title = prompt(`Thêm tiêu đề cho ảnh "${file.name}" (có thể bỏ qua):`) || '';
        const base64Image = await compressImage(file, 1000); // 1000px max, a bit larger for personal photos
        
        await addDoc(collection(db, 'personal_photos'), {
          category,
          imageUrl: base64Image,
          title: title.trim(),
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi tải ảnh lên. Có thể file quá lớn.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá ảnh này?')) return;
    try {
      await deleteDoc(doc(db, 'personal_photos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `personal_photos/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-2xl font-serif italic text-bento-text">
          {category === 'dupo' ? 'Ảnh của Dupo' : 'Ảnh của Xurry'}
        </h3>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="group flex items-center gap-2 text-xs uppercase tracking-widest font-bold bg-bento-card border border-bento-border text-bento-text px-6 py-3 rounded-full hover:bg-bento-accent hover:text-bento-bg transition-all shadow-sm disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tải ảnh lên
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bento-muted" />
        </div>
      ) : photos.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full py-32 text-center bg-bento-card border border-bento-border rounded-[32px] shadow-sm"
        >
          <Heart className="w-12 h-12 text-bento-accent mx-auto mb-6 opacity-30 fill-current" />
          <p className="font-serif italic text-3xl text-bento-text opacity-40">Chưa có bức ảnh nào...</p>
        </motion.div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
          <AnimatePresence>
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="break-inside-avoid mb-6 bg-bento-card rounded-2xl overflow-hidden border border-bento-border shadow-sm group relative cursor-pointer"
                onClick={() => setSelectedPhoto(photo.imageUrl)}
              >
                <img 
                  src={photo.imageUrl} 
                  alt={photo.title || 'Personal photo'} 
                  className="w-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (photo.id) handleDelete(photo.id);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {photo.title && (
                  <div className="absolute top-4 left-4 right-14 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg">
                    <p className="text-white text-sm font-medium truncate drop-shadow-sm">{photo.title}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 z-[110] p-3 md:p-4 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all"
            >
              <Trash2 className="w-5 h-5 md:w-6 md:h-6 hidden" /> {/* Placeholder just to align with other styles or we can use X, I'll use X */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-6 md:h-6"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              src={selectedPhoto}
              alt="Full size view"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
