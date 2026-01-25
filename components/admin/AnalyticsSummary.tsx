"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";

/**
 * Analytics Summary Component
 * 
 * Displays basic analytics metrics from Convex data.
 * This is a simple internal dashboard - for full analytics,
 * use the Vercel Analytics dashboard.
 * 
 * Usage:
 * - Only accessible to admin users
 * - Shows conversion funnel from database
 * - Complements Vercel Analytics
 */

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: "purple" | "blue" | "green" | "amber" | "pink";
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const colorClasses = {
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    green: "from-green-500/20 to-green-600/20 border-green-500/30",
    amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30",
    pink: "from-pink-500/20 to-pink-600/20 border-pink-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </motion.div>
  );
}

interface FunnelStepProps {
  step: string;
  count: number;
  prevCount?: number;
  icon: string;
  isLast?: boolean;
}

function FunnelStep({ step, count, prevCount, icon, isLast }: FunnelStepProps) {
  const conversionRate = prevCount && prevCount > 0 
    ? ((count / prevCount) * 100).toFixed(1) 
    : null;

  return (
    <div className="flex items-center">
      <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="text-lg font-semibold text-white">{count}</div>
            <div className="text-sm text-gray-400">{step}</div>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="px-3 text-center">
          <div className="text-gray-500">→</div>
          {conversionRate && (
            <div className="text-xs text-green-400">{conversionRate}%</div>
          )}
        </div>
      )}
    </div>
  );
}

export function AnalyticsSummary() {
  // Query aggregated stats from Convex
  // Note: You'd need to create these queries in your Convex backend
  // This is a placeholder showing what the component would look like
  
  // Mock data for demonstration - replace with real queries
  const stats = {
    totalUsers: 156,
    totalBooks: 423,
    booksInProgress: 89,
    booksCompleted: 334,
    totalOrders: 287,
    ordersThisMonth: 34,
    revenue: 14116.13, // $49.99 * orders
    averageOrderValue: 49.99,
  };

  const funnel = {
    visits: 2840,
    signups: 156,
    booksCreated: 423,
    checkoutsStarted: 312,
    purchasesCompleted: 287,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Analytics Overview</h2>
        <p className="text-gray-400">
          Quick metrics from your database. For detailed analytics, visit the{" "}
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Vercel Analytics dashboard
          </a>
          .
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="purple"
        />
        <MetricCard
          title="Books Created"
          value={stats.totalBooks}
          subtitle={`${stats.booksInProgress} in progress`}
          icon="📚"
          color="blue"
        />
        <MetricCard
          title="Orders"
          value={stats.totalOrders}
          subtitle={`${stats.ordersThisMonth} this month`}
          icon="📦"
          color="green"
        />
        <MetricCard
          title="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          subtitle={`Avg $${stats.averageOrderValue}`}
          icon="💰"
          color="amber"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Conversion Funnel</h3>
        <div className="flex flex-wrap items-center gap-2">
          <FunnelStep
            step="Visits"
            count={funnel.visits}
            icon="👀"
          />
          <FunnelStep
            step="Signups"
            count={funnel.signups}
            prevCount={funnel.visits}
            icon="✍️"
          />
          <FunnelStep
            step="Books Created"
            count={funnel.booksCreated}
            prevCount={funnel.signups}
            icon="📖"
          />
          <FunnelStep
            step="Checkouts"
            count={funnel.checkoutsStarted}
            prevCount={funnel.booksCreated}
            icon="🛒"
          />
          <FunnelStep
            step="Purchases"
            count={funnel.purchasesCompleted}
            prevCount={funnel.checkoutsStarted}
            icon="✅"
            isLast
          />
        </div>
        
        {/* Overall Conversion */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Overall Conversion (Visit → Purchase)</span>
            <span className="text-2xl font-bold text-green-400">
              {((funnel.purchasesCompleted / funnel.visits) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
          <h4 className="text-purple-200 font-semibold mb-3">📈 Growth Insights</h4>
          <ul className="space-y-2 text-sm text-purple-300">
            <li>• Average {(stats.totalBooks / stats.totalUsers).toFixed(1)} books per user</li>
            <li>• {((stats.booksCompleted / stats.totalBooks) * 100).toFixed(0)}% of books are completed</li>
            <li>• {((funnel.purchasesCompleted / funnel.booksCreated) * 100).toFixed(0)}% of books convert to orders</li>
          </ul>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
          <h4 className="text-amber-200 font-semibold mb-3">💡 Optimization Tips</h4>
          <ul className="space-y-2 text-sm text-amber-300">
            <li>• Biggest drop-off: Visit → Signup ({((1 - funnel.signups / funnel.visits) * 100).toFixed(0)}% loss)</li>
            <li>• Consider: Improve landing page CTA</li>
            <li>• Consider: Add social proof / testimonials</li>
          </ul>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3">
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
        >
          📊 Vercel Analytics
        </a>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
        >
          💳 Stripe Dashboard
        </a>
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
        >
          👤 Clerk Dashboard
        </a>
      </div>
    </div>
  );
}
