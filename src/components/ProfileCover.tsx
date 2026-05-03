import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/error-handler';
import { OperationType, Settings } from '../types';
import { compressImage } from '../lib/imageCompressor';
import { Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileCoverProps {
  category: 'dupo' | 'xurry';
}

export default function ProfileCover({ category }: ProfileCoverProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings;
        if (category === 'dupo' && data.dupoCover) {
          setCoverUrl(data.dupoCover);
        } else if (category === 'xurry' && data.xurryCover) {
          setCoverUrl(data.xurryCover);
        } else {
          setCoverUrl(null);
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
      setLoading(false);
    });

    return unsubscribe;
  }, [category]);

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const base64Image = await compressImage(file, 1200); // larger for cover
      const fieldToUpdate = category === 'dupo' ? 'dupoCover' : 'xurryCover';
      
      await updateDoc(doc(db, 'settings', 'global'), {
        [fieldToUpdate]: base64Image
      }).catch(async (error) => {
        if (error.code === 'not-found') {
          await setDoc(doc(db, 'settings', 'global'), {
            [fieldToUpdate]: base64Image
          }, { merge: true });
        } else {
          throw error;
        }
      });
    } catch (e) {
      console.error(e);
      alert('Lỗi cập nhật ảnh bìa');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-48 sm:h-64 rounded-3xl bg-bento-card border border-bento-border flex items-center justify-center mb-8">
        <Loader2 className="w-6 h-6 animate-spin text-bento-muted" />
      </div>
    );
  }

  return (
    <div className="relative group w-full h-48 sm:h-64 rounded-3xl bg-bento-card border border-bento-border overflow-hidden mb-8 shadow-sm">
      {coverUrl ? (
        <img src={coverUrl} alt={`${category} cover`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-bento-muted">
          <ImageIcon className="w-8 h-8 opacity-50 mb-2" />
          <span className="text-sm font-serif italic opacity-70">Chưa có ảnh bìa</span>
        </div>
      )}
      
      {/* Upload Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <button 
          onClick={() => document.getElementById(`cover-upload-${category}`)?.click()}
          disabled={uploading}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-2 font-bold tracking-wider text-sm transition-all"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {uploading ? 'Đang tải...' : 'Đổi ảnh bìa'}
        </button>
      </div>

      <input 
        type="file" 
        id={`cover-upload-${category}`} 
        className="hidden" 
        accept="image/*" 
        onChange={handleCoverChange} 
      />
    </div>
  );
}
