'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  MessageSquare,
  Globe,
  Tag,
  Plus,
  Trash2,
  Lock,
  PiggyBank,
  Target,
  Percent,
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  // Savings goals
  const [targetSavingsRate, setTargetSavingsRate] = useState(20);
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState<number | string>(0);
  const [savingSavings, setSavingSavings] = useState(false);
  const [savingsMsg, setSavingsMsg] = useState<string | null>(null);
  const [savingsErr, setSavingsErr] = useState<string | null>(null);

  // Telegram settings
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [registeringWebhook, setRegisteringWebhook] = useState(false);
  const [isTelegramLocked, setIsTelegramLocked] = useState(false);

  // Profile & Password
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('ج.م');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  // Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [savingCat, setSavingCat] = useState(false);

  async function loadSettings() {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/categories'),
      ]);

      if (sRes.ok) {
        const s = await sRes.json();
        setBotToken(s.telegramBotToken || '');
        setChatId(s.telegramChatId || '');
        if (s.telegramBotToken) setIsTelegramLocked(true);
        setName(s.name || '');
        setEmail(s.email || '');
        setCurrency(s.currency || 'ج.م');
        setTargetSavingsRate(s.targetSavingsRate ?? 20);
        setMonthlySavingsGoal(s.monthlySavingsGoal ?? 0);
      }

      if (cRes.ok) {
        setCategories(await cRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  // Save Telegram Credentials
  async function handleSaveTelegram(e: React.FormEvent) {
    e.preventDefault();
    setSavingTelegram(true);
    setTelegramStatus(null);
    setTelegramError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_telegram',
          botToken,
          chatId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTelegramError(data.error || 'فشل حفظ الإعدادات');
      } else {
        setTelegramStatus('تم حفظ بيانات تليجرام بنجاح! يمكنك الآن تجربة اختبار الاتصال.');
        setIsTelegramLocked(true);
      }
    } catch (err) {
      console.error(err);
      setTelegramError('فشل الاتصال بالخادم');
    } finally {
      setSavingTelegram(false);
    }
  }

  // Test Telegram Connection
  async function handleTestConnection() {
    setTestingTelegram(true);
    setTelegramStatus(null);
    setTelegramError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_telegram',
          botToken,
          chatId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTelegramError(data.error || 'فشل الاتصال');
      } else {
        setTelegramStatus('✅ وصلتك الآن رسالة تجريبية على تليجرام! الاتصال سليم 100%');
      }
    } catch (err) {
      console.error(err);
      setTelegramError('فشل الاتصال بالخادم');
    } finally {
      setTestingTelegram(false);
    }
  }

  // Register Webhook
  async function handleRegisterWebhook() {
    setRegisteringWebhook(true);
    setTelegramStatus(null);
    setTelegramError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_webhook',
          botToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTelegramError(data.error || 'فشل تسجيل Webhook');
      } else {
        setTelegramStatus('🚀 تم تسجيل الـ Webhook بنجاح! البوت الآن جاهز لاستقبال الأوامر مثل /صرف و /الرصيد');
      }
    } catch (err) {
      console.error(err);
      setTelegramError('فشل الاتصال بالخادم');
    } finally {
      setRegisteringWebhook(false);
    }
  }

  // Update Profile
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    setProfileErr(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          name,
          currency,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileErr(data.error || 'فشل تحديث البيانات');
      } else {
        setProfileMsg('تم تحديث البيانات بنجاح!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      console.error(err);
      setProfileErr('فشل الاتصال بالخادم');
    } finally {
      setSavingProfile(false);
    }
  }

  // Save Savings Goals
  async function handleSaveSavingsGoals(e: React.FormEvent) {
    e.preventDefault();
    setSavingSavings(true);
    setSavingsMsg(null);
    setSavingsErr(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_savings_goals',
          targetSavingsRate,
          monthlySavingsGoal: parseFloat(String(monthlySavingsGoal)) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSavingsErr(data.error || 'فشل حفظ أهداف الادخار');
      } else {
        setSavingsMsg(data.message || 'تم حفظ أهداف ونسبة الادخار بنجاح!');
      }
    } catch (err) {
      console.error(err);
      setSavingsErr('فشل الاتصال بالخادم');
    } finally {
      setSavingSavings(false);
    }
  }

  // Add Category
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingCat(true);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          type: newCatType,
        }),
      });

      if (res.ok) {
        setNewCatName('');
        const cRes = await fetch('/api/categories');
        if (cRes.ok) setCategories(await cRes.json());
      } else {
        const d = await res.json();
        alert(d.error || 'حدث خطأ');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  }

  // Delete Category
  async function handleDeleteCategory(id: number) {
    if (!confirm('هل تريد حذف هذا التصنيف المخصص؟')) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        const d = await res.json();
        alert(d.error || 'لا يمكن حذف هذا التصنيف');
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="p-16 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span className="text-sm">جاري تحميل الإعدادات...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-xl">
        <h1 className="text-xl font-bold text-white">إعدادات النظام والربط</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          إدارة بيانات ربط Telegram Bot، التصنيفات المالية، والحساب الشخصي
        </p>
      </div>

      {/* SECTION 1: Telegram Bot Credentials & Setup */}
      <div className="bg-[#111116] rounded-2xl border border-[#23232e] shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#23232e] bg-[#161622] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F5FFF] text-white flex items-center justify-center shadow-md">
              <Send className="w-5 h-5 -rotate-45 ml-0.5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">إعدادات Telegram Bot</h2>
              <p className="text-xs text-slate-400">
                أدخل Bot Token و Chat ID هنا لتفعيل التسجيل السريع والتنبيهات اليومية
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#0F5FFF]/20 text-[#0F5FFF] border border-[#0F5FFF]/40 rounded-full">
            تكامل مباشر
          </span>
        </div>

        <div className="p-6 space-y-6">
          {telegramStatus && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{telegramStatus}</span>
            </div>
          )}

          {telegramError && (
            <div className="p-4 bg-red-950/60 border border-red-800/60 rounded-xl text-xs font-semibold text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{telegramError}</span>
            </div>
          )}

          <form onSubmit={handleSaveTelegram} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                رمز البوت (Bot Token)
              </label>
              {isTelegramLocked && (
                <button
                  type="button"
                  onClick={() => setIsTelegramLocked(false)}
                  className="text-xs text-[#0F5FFF] hover:underline"
                >
                  فتح للتعديل
                </button>
              )}
            </div>
            <div>
              <input
                type="password"
                disabled={isTelegramLocked}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full text-sm font-mono px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl text-left dir-ltr focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!isTelegramLocked && (
                <span className="text-xs text-slate-400 mt-1 block">
                  احصل عليه مجانًا من Telegram عبر البحث عن{' '}
                  <b className="text-white">@BotFather</b> وإرسال الأمر{' '}
                  <code className="text-[#FFB50F]">/newbot</code>.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                معرف المحادثة (Chat ID)
              </label>
              <input
                type="text"
                disabled={isTelegramLocked}
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="مثال: 123456789"
                className="w-full text-sm font-mono px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl text-left dir-ltr focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!isTelegramLocked && (
                <span className="text-xs text-slate-400 mt-1 block">
                  💡 <b className="text-slate-200">طريقة سهلة جدًا:</b> إذا تركت هذا الحقل فارغًا وحفظت الـ Token، ما عليك سوى فتح البوت في تليجرام وإرسال <code className="text-[#FFB50F] font-bold">/start</code> وسيتم ربط معرفك تلقائيًا!
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isTelegramLocked && (
                <button
                  type="submit"
                  disabled={savingTelegram}
                  className="font-bold py-2.5 px-5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                  style={{
                    backgroundColor: '#FFB50F',
                    color: '#000000',
                    boxShadow: '0 2px 8px rgba(255, 181, 15, 0.4)',
                  }}
                >
                  {savingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>حفظ بيانات تليجرام</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingTelegram}
                className="bg-[#0F5FFF] hover:bg-[#0c4fd6] text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                {testingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                <span>اختبار الاتصال 🔔</span>
              </button>

              <button
                type="button"
                onClick={handleRegisterWebhook}
                disabled={registeringWebhook}
                className="bg-[#181822] hover:bg-[#20202e] text-slate-200 border border-[#2e2e3e] font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {registeringWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-[#FFB50F]" />}
                <span>تفعيل الـ Webhook تلقائي 🚀</span>
              </button>
            </div>
          </form>

          {/* Cheat Sheet for Telegram Commands */}
          <div className="p-4 bg-[#161622] rounded-xl border border-[#23232e] space-y-2 text-xs">
            <h4 className="font-bold text-white text-sm">الأوامر المدعومة في البوت:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <div>• <code className="text-[#FFB50F]">/صرف 250 طعام غداء</code> (تسجيل مصروف فوري)</div>
              <div>• <code className="text-[#0F5FFF]">/دخل 5000 عمل حر مشروع</code> (تسجيل دخل فوري)</div>
              <div>• <code>/لي 3000 أحمد سلفة</code> (تسجيل دين لك)</div>
              <div>• <code>/علي 5000 محمد التزام</code> (تسجيل التزام عليك)</div>
              <div>• <code>/الرصيد</code> (عرض الأرصدة الفعلية بحساباتك)</div>
              <div>• <code>/اليوم</code> (تقرير المصروفات والدخل اليوم)</div>
              <div>• <code>/الشهر</code> (تقرير الشهر والمدخرات)</div>
              <div>• <code>/الأقساط</code> (حالة الأقساط القادمة)</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Savings Goals & Strategy */}
      <div className="bg-[#111116] rounded-2xl border border-[#23232e] shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#23232e] bg-[#161622] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB50F] text-black font-bold flex items-center justify-center shadow-md">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">أهداف وخطة الادخار والتوفير</h2>
              <p className="text-xs text-slate-400">
                حدد نسبة الادخار ومبلغ التوفير المستهدف شهريًا لمراقبتها في لوحة التحكم والتقارير
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#FFB50F]/20 text-[#FFB50F] border border-[#FFB50F]/40 rounded-full">
            أهداف مالية
          </span>
        </div>

        <div className="p-6 space-y-6">
          {savingsMsg && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{savingsMsg}</span>
            </div>
          )}

          {savingsErr && (
            <div className="p-4 bg-red-950/60 border border-red-800/60 rounded-xl text-xs font-semibold text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{savingsErr}</span>
            </div>
          )}

          <form onSubmit={handleSaveSavingsGoals} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نسبة الادخار الشهرية المستهدفة (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={targetSavingsRate}
                    onChange={(e) => setTargetSavingsRate(parseInt(e.target.value) || 0)}
                    className="w-full text-sm font-bold px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFB50F]"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">%</span>
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  النسبة المئوية من دخلك الإجمالي التي تخطط لادخارها (المعيار المالي الشائع: 20% إلى 30%).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  مبلغ الادخار الشهري المستهدف ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={monthlySavingsGoal}
                    onChange={(e) => setMonthlySavingsGoal(e.target.value)}
                    className="w-full text-sm font-bold px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFB50F]"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">{currency}</span>
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  (اختياري) حدد رقمًا ماليًا ثابتًا ترغب في الوصول إليه كل شهر كمدخرات إضافية.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSavings}
              className="font-bold py-2.5 px-5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              style={{
                backgroundColor: '#FFB50F',
                color: '#000000',
                boxShadow: '0 2px 8px rgba(255, 181, 15, 0.4)',
              }}
            >
              {savingSavings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              <span>حفظ أهداف الادخار 🎯</span>
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 3: Categories Management */}
      <div className="bg-[#111116] rounded-2xl border border-[#23232e] shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#23232e] bg-[#161622] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB50F] text-black font-bold flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">إدارة التصنيفات المالية</h2>
              <p className="text-xs text-slate-400">
                إضافة تصنيفات مخصصة للدخل أو المصروفات
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="اسم التصنيف الجديد..."
              className="flex-1 min-w-[200px] text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-500"
            />
            <select
              value={newCatType}
              onChange={(e: any) => setNewCatType(e.target.value)}
              className="text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
            >
              <option value="expense" className="bg-[#181822]">تصنيف مصروف</option>
              <option value="income" className="bg-[#181822]">تصنيف دخل</option>
            </select>
            <button
              type="submit"
              disabled={savingCat}
              className="font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              style={{
                backgroundColor: '#FFB50F',
                color: '#000000',
                boxShadow: '0 2px 8px rgba(255, 181, 15, 0.3)',
              }}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة التصنيف</span>
            </button>
          </form>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#181822] border border-[#23232e] text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      c.type === 'income' ? 'bg-[#0F5FFF]' : 'bg-[#FF0628]'
                    }`}
                  ></span>
                  <span className="font-semibold text-slate-200 truncate">{c.name}</span>
                </div>
                {!c.isDefault && (
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-slate-500 hover:text-[#FF0628] p-1 rounded transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: Profile & Security */}
      <div className="bg-[#111116] rounded-2xl border border-[#23232e] shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#23232e] bg-[#161622] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#23232e] text-slate-300 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">الحساب والعملة والأمان</h2>
              <p className="text-xs text-slate-400">
                تعديل اسم الحساب، العملة الافتراضية، وتغيير كلمة المرور
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {profileMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs font-semibold text-emerald-300">
              {profileMsg}
            </div>
          )}
          {profileErr && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs font-semibold text-red-300">
              {profileErr}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم صاحب الحساب
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رمز العملة الافتراضي
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#23232e]">
              <h4 className="text-xs font-bold text-slate-300 mb-2">تغيير كلمة المرور (اختياري):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="كلمة المرور الحالية..."
                    className="w-full text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] text-left dir-ltr placeholder-slate-500"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة..."
                    className="w-full text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] text-left dir-ltr placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="bg-[#181822] hover:bg-[#20202e] border border-[#2e2e3e] text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin text-[#FFB50F]" />}
              <span>حفظ التعديلات</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
