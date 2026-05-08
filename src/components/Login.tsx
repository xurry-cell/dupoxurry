import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  error?: string;
}

export default function Login({ onLogin, error }: LoginProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="max-w-md w-full text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full" />
          <Heart className="w-24 h-24 text-white relative z-10 mx-auto" strokeWidth={1} />
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-6xl font-serif italic text-white tracking-tight"
          >
            duPO xurry
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/40 text-sm tracking-[0.3em] uppercase font-light"
          >
            Lưu giữ từng khoảnh khắc đẹp
          </motion.p>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          onClick={onLogin}
          className="group relative inline-flex items-center gap-3 bg-white text-black px-12 py-5 rounded-full font-semibold overflow-hidden transition-all hover:pr-14 active:scale-[0.98]"
          id="login-button"
        >
          <span className="relative z-10">Bắt đầu ngay</span>
          <LogIn className="w-5 h-5 relative z-10 transition-all group-hover:translate-x-1" />
          <div className="absolute inset-0 bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </motion.button>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm"
            >
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
