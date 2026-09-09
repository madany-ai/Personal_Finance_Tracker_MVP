'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('Amwali PWA registered:', reg.scope))
          .catch((err) => console.warn('PWA registration failed:', err));
      });
    }

    // 2. Listen for BeforeInstallPrompt event (mobile Chrome/Android/Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Only show banner if not already dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setInstallPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    sessionStorage.setItem('pwa_dismissed', 'true');
  }

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm bg-[#14141d] border border-[#FFB50F]/40 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FFB50F] text-black flex items-center justify-center font-bold shrink-0 shadow-md">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white text-xs">تثبيت تطبيق أموالي على الهاتف</div>
          <div className="text-[10px] text-slate-400">تشغيل فوري بشاشة كاملة وخفة فائقة</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#FFB50F] text-black hover:bg-[#ffc63a] transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          تثبيت
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
