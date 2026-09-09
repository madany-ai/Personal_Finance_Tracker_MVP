import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import PWARegister from '@/components/pwa/PWARegister';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'نظام إدارة ومراقبة الأموال الشخصية',
  description: 'نظام شخصي ذكي وسريع لإدارة ومراقبة الحسابات، الدخل، المصروفات، الأقساط، والالتزامات',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'إدارة أموالي',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#000000] text-slate-100 min-h-screen" suppressHydrationWarning>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
