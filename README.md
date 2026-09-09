# 💰 Personal Finance Tracker (PWA)

A high-performance, mobile-first **Progressive Web App (PWA)** built with **Next.js 16**, **Neon Serverless PostgreSQL**, and **Tailwind CSS**. Designed to help individuals manage income, track multi-account expenses, handle debts and receivables, schedule recurring commitments, and log transactions effortlessly via an automated **Telegram Bot**.

Optimized with custom GPU acceleration and dynamic lazy loading to run seamlessly on low-end mobile devices (2GB RAM).

---

## 🌟 Key Features

### 📱 Progressive Web App (PWA)
- **Installable Native Experience**: Add directly to the home screen on iOS, Android, and Desktop with a single click (`display: standalone`).
- **Offline & Low-Network Resilience**: Integrated Service Worker (`public/sw.js`) caches app shell, fonts, and assets for instantaneous load times.
- **Tailored Mobile UI**: Bottom navigation, swipe-friendly interactions, dark mode aesthetics, and zero tap latency (`touch-action: manipulation`).

### ⚡ Optimized for Low-End Devices (2GB RAM)
- **Dynamic Lazy Loading**: Charting libraries (`recharts`) are dynamically imported on-demand, reducing initial bundle size by over **450KB**.
- **GPU Acceleration**: Hardware-accelerated transitions and isolated layout repaints (`contain: content`) eliminate stuttering and frame drops.
- **Client-Side Smart Cache**: Zero-dependency in-memory caching system drastically reduces redundant backend queries and prevents Neon egress spikes.

### 📊 Comprehensive Financial Dashboard
- **Real-Time Wealth Overview**: Live indicators for Total Balance, Net Worth, Monthly Cashflow, Liquid vs. Saved assets.
- **Smart Daily Budgeting**: Automatically calculates safe daily spending limits until the end of the month.
- **Interactive Visual Analytics**: Category-based expense breakdown and income/savings ratio analysis.

### 💳 Multi-Account & Cash Flow Management
- Supports multiple account types: **Cash, Bank Accounts, Credit Cards, and E-Wallets** (Vodafone Cash, InstaPay, etc.).
- Instant inter-account transfers with automatic audit logging.

### 🤝 Debt & Credit Tracking (Receivables & Payables)
- **Receivables (Money owed to you)**: Track debtors, partial collections, remaining amounts, and due dates.
- **Payables (Debts you owe)**: Prioritize liabilities, log settlements, and track payment history.

### 📅 Installments & Recurring Commitments
- **Installment Tracker**: Monitor active loans and EMIs with automated remaining balance calculations.
- **Recurring Expenses**: Keep track of fixed periodic obligations (Rent, Subscriptions, Utilities) with upcoming due date alerts.

### 🤖 Smart Telegram Bot Integration
- Log transactions in natural language or quick commands straight from Telegram:
  - `/صرف 150 طعام غداء اليوم` (Expense: 150 for Food)
  - `/دخل 5000 راتب إيداع بنكي` (Income: 5000 Salary)
  - `/الرصيد` (Check balance)
  - `/الشهر` (Monthly summary)
  - `/الأقساط` (Check installments)
- **One-Click Webhook Sync**: Automatically connect your bot from the in-app Settings panel.
- **Automated Alerts (Cron Jobs)**: Daily financial summaries and timely reminders for upcoming due dates.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: Auth.js / NextAuth
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/madany-ai/Personal_Finance_Tracker_MVP.git
cd Personal_Finance_Tracker_MVP
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:
```env
# Database (Neon PostgreSQL connection string with pooled connection)
DATABASE_URL="postgresql://neondb_owner:password@ep-your-pooler-url.neon.tech/neondb?sslmode=require"

# NextAuth / Session Secret
AUTH_SECRET="your-secure-random-32-char-secret"
AUTH_URL="http://localhost:3000"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Telegram Bot (Optional for local testing)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
TELEGRAM_WEBHOOK_SECRET="your-custom-webhook-secret"

# Cron Security Key
CRON_SECRET="your-cron-secret-key"
```

### 4. Push database schema
```bash
npx drizzle-kit push
```

### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment on Vercel

1. Push your code to your GitHub repository.
2. Import the project into [Vercel](https://vercel.com/new).
3. Set the following **Environment Variables** in the Vercel dashboard:
   - `DATABASE_URL`: Your production Neon PostgreSQL pooled connection string.
   - `AUTH_SECRET`: A strong random string (e.g. generated via `openssl rand -base64 32`).
   - `AUTH_URL`: Your production URL (e.g., `https://your-domain.vercel.app`) or leave it unset so NextAuth automatically detects Vercel system headers.
   - `NEXT_PUBLIC_APP_URL`: Your production URL (`https://your-domain.vercel.app`).
   - `TELEGRAM_WEBHOOK_SECRET`: A secret phrase to secure the webhook endpoint.
   - `CRON_SECRET`: Secret token protecting automated cron endpoints.
4. Click **Deploy**.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
