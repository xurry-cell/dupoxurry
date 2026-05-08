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
import { Plus, Heart, Search, Music, ArrowUpDown, Image as ImageIcon, Edit2, X, LayoutGrid, List, Mars, Venus } from 'lucide-react';
import { db } from './lib/firebase';
import { DateMemory, MediaType, OperationType } from './types';
import { handleFirestoreError } from './lib/error-handler';
import AtmosphericBackground from './components/Background';
import { MemoryCard } from './components/MemoryCard';
import MemoryForm from './components/MemoryForm';
import MemoryDetail from './components/MemoryDetail';
import PhotoGrid from './components/PhotoGrid';
import ProfileCover from './components/ProfileCover';
import { compressImage } from './lib/imageCompressor';

type TabType = 'memories' | 'dupo' | 'xurry';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<DateMemory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<DateMemory | null>(null);
  const [viewingMemory, setViewingMemory] = useState<DateMemory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');
  const [activeTab, setActiveTab] = useState<TabType>('memories');
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{isOpen: boolean, action: () => void, title: string} | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const TEST_MEMORY: DateMemory = {
    id: 'test-memory-id',
    title: 'Kỉ niệm Test (Chỉ xem được ở Edit Mode)',
    date: new Date().toISOString().split('T')[0],
    mediaUrls: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=2070&auto=format&fit=crop'],
    mediaType: 'image' as MediaType,
    author: 'duPO',
    userId: 'guest-user',
    createdAt: { seconds: 0, nanoseconds: 0 } as any,
    songTitle: 'Perfect - Ed Sheeran',
    note: 'Đây là kỉ niệm mô phỏng để bạn kiểm tra giao diện.',
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // Dummy actual audio for UI testing
  };

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmitMemory = async (data: { 
    title: string; 
    date: string; 
    mediaUrls: string[]; 
    mediaType: MediaType;
    musicUrl?: string;
    author: 'duPO' | 'xurry';
    songTitle?: string;
    note?: string;
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

  const allMemories = isAdmin ? [TEST_MEMORY, ...memories] : memories;

  const filteredMemories = allMemories
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const latestMemoryWithMusic = memories.find(m => m.musicUrl);

  const submitPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === 'MakiYuta69') {
      setIsAdmin(true);
      if (passwordModal?.action) passwordModal.action();
      setPasswordModal(null);
    } else {
      setPasswordError(true);
    }
  };

  const handleAuth = (action: () => void, title: string) => {
    if (isAdmin) {
      action();
    } else {
      setPasswordModal({ isOpen: true, action, title });
      setPasswordInput('');
      setPasswordError(false);
    }
  };

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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        scrolled 
          ? 'py-3 sm:py-4 bg-black/40 backdrop-blur-xl border-b border-white/5 shadow-2xl' 
          : 'py-4 sm:py-8 bg-bento-bg/80 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none border-b border-bento-border/50 sm:border-none'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-bento-card rounded-2xl flex items-center justify-center shadow-sm border border-bento-border text-bento-accent">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-serif italic tracking-tight text-bento-text">duPO xurry</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center bg-bento-card border border-bento-border rounded-full px-2 sm:px-4 py-1 sm:py-2 group focus-within:border-bento-muted/30 transition-all shadow-sm">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 text-bento-muted" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs sm:text-sm px-2 w-24 sm:w-48 text-bento-text placeholder:text-bento-muted"
              />
            </div>

            <button 
              onClick={() => handleAuth(openNewForm, 'Thêm kỉ niệm mới')}
              className="group flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-bento-accent text-bento-bg px-3 sm:px-6 py-2 sm:py-3 rounded-full hover:brightness-110 transition-all shadow-sm"
              id="add-memory-nav"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Thêm hẹn</span>
            </button>
            <button 
              onClick={() => {
                if (isAdmin) {
                  setIsAdmin(false);
                } else {
                  handleAuth(() => setIsAdmin(true), 'Kích hoạt Edit Mode');
                }
              }}
              className={`group flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold px-3 py-2 sm:py-3 rounded-full transition-all shadow-sm border ${isAdmin ? 'bg-rose-500 text-white border-rose-500' : 'bg-transparent text-bento-muted border-bento-border hover:text-bento-text'}`}
            >
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isAdmin ? 'Tắt Edit' : 'Edit'}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-24">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-12 gap-6 md:gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] sm:text-xs tracking-[0.4em] uppercase text-bento-muted font-bold mb-3"
            >
              bro to lover
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="text-5xl sm:text-6xl md:text-7xl font-serif italic text-bento-text leading-tight"
            >
              Dating <br className="hidden md:block" />
              <span className="text-bento-muted">Saved</span>
            </motion.h2>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center md:items-end mt-4 md:mt-0"
          >
            <div className="text-4xl sm:text-5xl font-light text-bento-accent">{memories.length} Kỉ Niệm</div>
            <div className="text-[10px] uppercase tracking-widest text-bento-muted font-bold mt-2">
              lộn số rầu
            </div>
            {memories.length > 0 && activeTab === 'memories' && (
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-bento-card text-bento-accent border border-bento-border px-4 py-2 rounded-full hover:bg-bento-border transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  Sắp xếp: {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
                </button>
                <button
                  onClick={() => setViewMode(prev => prev === 'full' ? 'compact' : 'full')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-bento-card text-bento-accent border border-bento-border px-4 py-2 rounded-full hover:bg-bento-border transition-colors cursor-pointer"
                >
                  {viewMode === 'full' ? <List className="w-3 h-3" /> : <LayoutGrid className="w-3 h-3" />}
                  {viewMode === 'full' ? 'Gọn gàng' : 'Đầy đủ'}
                </button>
              </div>
            )}
          </motion.div>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-row w-full justify-between sm:justify-start gap-2 sm:gap-4 mb-8 sm:mb-12" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {(['memories', 'dupo', 'xurry'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if ((tab === 'dupo' || tab === 'xurry') && !isAdmin) {
                  handleAuth(() => setActiveTab(tab), `Truy cập kho ảnh ${tab === 'dupo' ? 'duPO' : 'xurry'}`);
                } else {
                  setActiveTab(tab);
                }
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 rounded-2xl sm:rounded-full text-[9px] sm:text-xs font-bold tracking-widest transition-all whitespace-nowrap border
                ${tab === 'memories' ? 'uppercase' : ''}
                ${activeTab === tab 
                  ? 'bg-bento-accent text-bento-bg border-bento-accent' 
                  : 'bg-bento-card text-bento-muted border-bento-border hover:border-bento-accent/50 hover:text-bento-text'
                }
              `}
            >
              {tab === 'memories' && <Heart className="w-3 h-3 sm:w-4 sm:h-4" />}
              {tab === 'dupo' && <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
              {tab === 'xurry' && <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="truncate">{tab === 'memories' ? 'Kỉ niệm chung' : tab === 'dupo' ? 'duPO' : 'xurry'}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {activeTab === 'memories' ? (
          <div className={viewMode === 'full' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
          {/* Welcome Card (Static Content for Bento Style) */}
          <motion.div 
            layout
            className={`${viewMode === 'full' ? 'sm:col-span-2' : 'md:col-span-2'} row-span-1 bg-bento-accent rounded-[32px] p-6 sm:p-8 flex flex-col justify-between border border-bento-accent relative overflow-hidden`}
          >
             <div className="relative z-10">
               <div className="text-[10px] uppercase tracking-widest font-bold text-bento-bg/50 mb-2">có lẽ anh không muốn đợi... anh muốn bên em</div>
               <h3 className="text-2xl sm:text-3xl font-serif text-bento-bg italic">Duy Anh và Xuân Nhi</h3>
               <p className="text-xs sm:text-sm text-bento-bg/80 mt-2 max-w-sm">từ giờ có anh rồi, những điều em thích làm nhớ để anh có mặt ở đấy cùng nhá</p>
             </div>
             <div className="flex items-center gap-4 mt-8 lg:mt-12 relative z-10">
                <div className="w-12 h-12 bg-bento-bg rounded-2xl flex-shrink-0 flex items-center justify-center text-bento-accent">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-bento-bg truncate">
                    {latestMemoryWithMusic ? latestMemoryWithMusic.title : 'Perfect - Ed Sheeran'}
                  </div>
                  <div className="text-[10px] text-bento-bg/70 uppercase tracking-widest font-bold truncate">
                    {latestMemoryWithMusic ? `Từ kỉ niệm: ${latestMemoryWithMusic.date}` : 'Đang phát từ buổi hẹn đầu tiên'}
                  </div>
                </div>
             </div>
             {/* Decorative hearts */}
             <Heart className="absolute -bottom-10 -right-10 w-48 h-48 text-bento-bg/10 rotate-12" />
          </motion.div>

          <AnimatePresence mode="popLayout">
            {filteredMemories.map((memory) => (
              viewMode === 'full' ? (
                <MemoryCard 
                  key={memory.id || 'new'} 
                  memory={memory} 
                  onDelete={handleDeleteMemory} 
                  onEdit={handleEditMemory}
                  onView={setViewingMemory}
                  isAdmin={isAdmin}
                />
              ) : (
                <motion.div
                  key={memory.id || 'new'}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setViewingMemory(memory)}
                  className="bg-bento-card border border-bento-border rounded-2xl p-3 flex items-center gap-4 cursor-pointer hover:border-bento-accent/50 group transition-all"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/20 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {memory.mediaType === 'video' ? (
                      <video src={memory.mediaUrls?.[0] || (memory as any).mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img 
                        src={memory.mediaUrls?.[0] || (memory as any).mediaUrl} 
                        alt={memory.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[10px] sm:text-xs text-bento-muted font-bold uppercase tracking-widest">{memory.date}</div>
                      {memory.author === 'duPO' ? (
                        <Mars className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Venus className="w-3 h-3 text-pink-500" />
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-serif italic text-bento-text truncate">{memory.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && memory.id !== 'test-memory-id' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMemory(memory);
                          }}
                          className="p-2 text-bento-muted hover:text-bento-text transition-colors"
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Bạn có chắc chắn muốn xóa kỷ niệm này?')) {
                              handleDeleteMemory(memory.id);
                            }
                          }}
                          className="p-2 text-bento-muted hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )
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
                onClick={() => handleAuth(openNewForm, 'Thêm kỉ niệm mới')}
                className="mt-8 text-bento-text/40 hover:text-bento-text text-xs uppercase tracking-[0.3em] font-bold border-b border-bento-text/20 pb-1 pb-1 transition-all"
              >
                Tạo kỉ niệm đầu tiên
              </button>
            </motion.div>
          )}
        </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={activeTab}
          >
            <ProfileCover category={activeTab as 'dupo' | 'xurry'} />
            <PhotoGrid category={activeTab as 'dupo' | 'xurry'} />
          </motion.div>
        )}
      </main>

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
        <p>© 2026 duPO xurry. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">About</a>
        </div>
      </footer>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bento-card border border-bento-border p-6 sm:p-8 rounded-[32px] w-full max-w-sm relative shadow-xl"
            >
              <button 
                onClick={() => setPasswordModal(null)}
                className="absolute top-6 right-6 text-bento-muted hover:text-bento-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-serif mb-2 text-bento-text">{passwordModal.title}</h3>
              <p className="text-xs text-bento-muted mb-6">Vui lòng nhập mật khẩu để tiếp tục.</p>
              
              <form onSubmit={submitPassword}>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  autoFocus
                  placeholder="Mật khẩu..."
                  className="w-full bg-bento-bg border border-bento-border px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-bento-accent transition-colors text-bento-text placeholder:text-bento-muted/50 mb-2"
                />
                
                {passwordError && (
                  <p className="text-rose-500 text-[10px] uppercase tracking-widest font-bold mb-4">Mật khẩu không đúng</p>
                )}
                
                <button
                  type="submit"
                  className="w-full mt-4 bg-bento-accent text-bento-bg py-3 rounded-xl text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all"
                >
                  Xác nhận
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
