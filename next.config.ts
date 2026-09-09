import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  async headers() {
    return [
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/%D9%84%D9%88%D8%AD%D8%A9-%D8%A7%D9%84%D8%AA%D8%AD%D9%83%D9%85', destination: '/' },
      { source: '/لوحة-التحكم', destination: '/' },
      { source: '/%D8%A7%D9%84%D8%B9%D9%85%D9%84%D9%8A%D8%A7%D8%AA', destination: '/transactions' },
      { source: '/العمليات', destination: '/transactions' },
      { source: '/%D8%A7%D9%84%D8%AD%D8%B3%D8%A7%D8%A8%D8%A7%D8%AA', destination: '/accounts' },
      { source: '/الحسابات', destination: '/accounts' },
      { source: '/%D9%84%D9%8A-%D8%B9%D9%86%D8%AF-%D8%A7%D9%84%D8%A2%D8%AE%D8%B1%D9%8A%D9%86', destination: '/receivables' },
      { source: '/لي-عند-الآخرين', destination: '/receivables' },
      { source: '/%D8%B9%D9%84%D9%8A-%D9%84%D9%84%D8%A2%D8%AE%D8%B1%D9%8A%D9%86', destination: '/payables' },
      { source: '/علي-للآخرين', destination: '/payables' },
      { source: '/%D8%A7%D9%84%D8%A3%D9%82%D8%B3%D8%A7%D8%B7', destination: '/installments' },
      { source: '/الأقساط', destination: '/installments' },
      { source: '/%D8%A7%D9%84%D8%AA%D9%82%D8%A7%D8%B1%D9%8A%D8%B1', destination: '/reports' },
      { source: '/التقارير', destination: '/reports' },
      { source: '/%D8%A7%D9%84%D8%A5%D8%B9%D8%AF%D8%A7%D8%AF%D8%A7%D8%AA', destination: '/settings' },
      { source: '/الإعدادات', destination: '/settings' },
      { source: '/%D8%AA%D8%B3%D8%AC%D9%8A%D9%84-%D8%A7%D9%84%D8%AF%D8%AE%D9%88%D9%84', destination: '/login' },
      { source: '/تسجيل-الدخول', destination: '/login' },
    ];
  },
};

export default nextConfig;
