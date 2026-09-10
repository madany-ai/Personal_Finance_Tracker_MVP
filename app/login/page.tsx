'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ غير متوقع أثناء تسجيل الدخول');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111116] rounded-3xl shadow-2xl border border-[#23232e] p-8">
        {/* Brand Icon & Title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={72}
            height={72}
            priority
            className="rounded-2xl shadow-xl border border-[#272736] mb-4 shadow-[#FFB50F]/10"
          />
          <h1 className="text-2xl font-extrabold text-white">إدارة ومراقبة الأموال</h1>
          <p className="text-sm text-slate-400 mt-1">سجل الدخول للمتابعة والتحكم المالي الشخصي</p>
        </div>

        {error && (
          <div
            className="mb-6 p-3 text-white text-sm rounded-xl font-medium"
            style={{ backgroundColor: '#FF0628' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full pl-3 pr-10 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] transition-all text-left dir-ltr placeholder-slate-500"
              />
              <Mail className="w-5 h-5 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-10 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] transition-all text-left dir-ltr placeholder-slate-500"
              />
              <Lock className="w-5 h-5 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 font-extrabold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            style={{
              backgroundColor: '#FFB50F',
              color: '#000000',
              boxShadow: '0 4px 14px 0 rgba(255, 181, 15, 0.45)',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ArrowRight className="w-4 h-4 rotate-180 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
