/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Heart, Search, Music } from 'lucide-react';
import { db } from './lib/firebase';
import { DateMemory, MediaType, OperationType } from './types';
import { handleFirestoreError } from './lib/error-handler';
import AtmosphericBackground from './components/Background';
import { MemoryCard } from './components/MemoryCard';
import MemoryForm from './components/MemoryForm';
import MemoryDetail from './components/MemoryDetail';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<DateMemory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<DateMemory | null>(null);
  const [viewingMemory, setViewingMemory] = useState<DateMemory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'system', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
    setLoading(false);
  }, []);

  // 2. Data Synchronization
  useEffect(() => {
    const path = 'memories';
    const q = query(
      collection(db, path),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DateMemory[];
      setMemories(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, []);

  const handleSubmitMemory = async (data: { 
    title: string; 
    date: string; 
    mediaUrls: string[]; 
    mediaType: MediaType;
    musicUrl?: string;
  }) => {
    const path = 'memories';
    try {
      if (editingMemory && editingMemory.id) {
        await updateDoc(doc(db, 'memories', editingMemory.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, path), {
          ...data,
          userId: 'guest-user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setEditingMemory(null);
    } catch (error) {
      handleFirestoreError(error, editingMemory ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    const path = `memories/${id}`;
    
    try {
      await deleteDoc(doc(db, 'memories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleEditMemory = (memory: DateMemory) => {
    setEditingMemory(memory);
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingMemory(null);
    setIsFormOpen(true);
  };

  const filteredMemories = memories.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const latestMemoryWithMusic = memories.find(m => m.musicUrl);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart className="w-12 h-12 text-white/20" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-bento-text selection:bg-bento-accent selection:text-bento-text">
      <AtmosphericBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-bento-card rounded-2xl flex items-center justify-center shadow-sm border border-bento-border text-bento-accent">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-serif italic tracking-tight text-bento-text">Dupo Xurry</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-bento-card border border-bento-border rounded-full px-4 py-2 group focus-within:border-bento-muted/30 transition-all shadow-sm">
              <Search className="w-4 h-4 text-bento-muted" />
              <input 
                type="text" 
                placeholder="Tìm kiếm kỉ niệm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm px-3 w-48 text-bento-text placeholder:text-bento-muted"
              />
            </div>

            <button 
              onClick={openNewForm}
              className="group flex items-center gap-2 text-xs uppercase tracking-widest font-bold bg-bento-accent text-bento-bg px-6 py-3 rounded-full hover:brightness-110 transition-all shadow-sm"
              id="add-memory-nav"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm buổi hẹn</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs tracking-[0.4em] uppercase text-bento-muted font-bold mb-3"
            >
              Our Story
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="text-6xl md:text-7xl font-serif italic text-bento-text leading-tight"
            >
              Nhật Ký <br />
              <span className="text-bento-muted">Hẹn Hò</span>
            </motion.h2>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-right"
          >
            <div className="text-5xl font-light text-bento-accent">{memories.length} Kỉ Niệm</div>
            <div className="text-[10px] uppercase tracking-widest text-bento-muted font-bold mt-1">
              Lưu giữ từng khoảnh khắc ngọt ngào
            </div>
          </motion.div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Welcome Card (Static Content for Bento Style) */}
          <motion.div 
            layout
            className="md:col-span-2 row-span-1 bg-bento-accent rounded-[32px] p-8 flex flex-col justify-between border border-bento-accent relative overflow-hidden"
          >
             <div className="relative z-10">
               <div className="text-[10px] uppercase tracking-widest font-bold text-bento-bg/50 mb-2">Welcome</div>
               <h3 className="text-3xl font-serif text-bento-bg italic">Giai điệu của chúng mình</h3>
               <p className="text-sm text-bento-bg/80 mt-2 max-w-sm">Mỗi buổi hẹn hò là một nốt nhạc trong bản tình ca mà chúng mình đang cùng nhau viết nên.</p>
             </div>
             <div className="flex items-center gap-4 mt-8 relative z-10">
                <div className="w-12 h-12 bg-bento-bg rounded-2xl flex items-center justify-center text-bento-accent text-xl">♫</div>
                <div>
                  <div className="text-sm font-bold text-bento-bg">
                    {latestMemoryWithMusic ? latestMemoryWithMusic.title : 'Perfect - Ed Sheeran'}
                  </div>
                  <div className="text-[10px] text-bento-bg/70 uppercase tracking-widest font-bold">
                    {latestMemoryWithMusic ? `Từ kỉ niệm: ${latestMemoryWithMusic.date}` : 'Đang phát từ buổi hẹn đầu tiên'}
                  </div>
                </div>
             </div>
             {/* Decorative hearts */}
             <Heart className="absolute -bottom-10 -right-10 w-48 h-48 text-bento-bg/10 rotate-12" />
          </motion.div>

          {/* New Memory Quick Add (Visible only when no memories or as a curated spot) */}
          <motion.div 
            layout
            onClick={openNewForm}
            className="col-span-1 row-span-1 bg-bento-border text-bento-text rounded-[32px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-bento-card transition-all shadow-lg active:scale-95 border border-bento-border"
          >
            <div className="w-16 h-16 rounded-full border border-bento-accent text-bento-accent flex items-center justify-center text-3xl mb-4 group-hover:bg-bento-accent group-hover:text-bento-bg transition-all">+</div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-bento-accent">Thêm buổi hẹn</span>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {filteredMemories.map((memory) => (
              <MemoryCard 
                key={memory.id || 'new'} 
                memory={memory} 
                onDelete={handleDeleteMemory} 
                onEdit={handleEditMemory}
                onView={setViewingMemory}
              />
            ))}
          </AnimatePresence>
          
          {/* Empty State */}
          {filteredMemories.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 text-center bg-bento-card border border-bento-border rounded-[32px] shadow-sm"
            >
              <Heart className="w-12 h-12 text-bento-accent mx-auto mb-6 opacity-30" />
              <p className="font-serif italic text-3xl text-bento-text opacity-40">Chưa có kỉ niệm nào được lưu lại...</p>
              <button 
                onClick={openNewForm}
                className="mt-8 text-bento-text/40 hover:text-bento-text text-xs uppercase tracking-[0.3em] font-bold border-b border-bento-text/20 pb-1 pb-1 transition-all"
              >
                Tạo kỉ niệm đầu tiên
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openNewForm}
        className="fixed bottom-8 right-8 sm:hidden z-50 w-16 h-16 bg-bento-accent text-bento-bg rounded-full shadow-2xl flex items-center justify-center"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      <MemoryForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingMemory(null);
        }} 
        onSubmit={handleSubmitMemory} 
        editingMemory={editingMemory}
      />

      <MemoryDetail
        memory={viewingMemory}
        onClose={() => setViewingMemory(null)}
      />

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] uppercase tracking-widest text-white/20 font-bold">
        <p>© 2026 DUPO XURRY. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">About</a>
        </div>
      </footer>
    </div>
  );
}
