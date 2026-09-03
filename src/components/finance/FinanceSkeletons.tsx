import React from 'react';
import type { ExpenseSection } from '../../services/api';

/**
 * Base skeleton pulse block helper
 */
export function SkeletonBlock({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`bg-border/30 dark:bg-night-field/70 rounded-xl animate-pulse ${className}`}
    />
  );
}

/**
 * Skeleton for Finance Summary & Analytics Tab
 */
export function FinanceSummarySkeleton({ section = 'ftl' }: { section?: ExpenseSection }) {
  const isFtl = section === 'ftl';
  const categoryCount = isFtl ? 8 : 6;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Hero Financial Health Banner Skeleton */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border/60 dark:border-night-border bg-surface/60 dark:bg-night-surface/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3 max-w-2xl w-full">
          {/* Top Pill Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <SkeletonBlock className="w-24 h-4 rounded-md" />
            <span className="text-muted/40">•</span>
            <SkeletonBlock className="w-28 h-6 rounded-full" />
            <span className="text-muted/40">•</span>
            <SkeletonBlock className="w-20 h-6 rounded-full" />
          </div>

          {/* Big Profit Title */}
          <SkeletonBlock className="w-64 sm:w-80 h-9 rounded-2xl mt-1" />

          {/* Subtitle description */}
          <SkeletonBlock className="w-full max-w-md h-4 rounded-md" />
        </div>

        {/* Right Highlights */}
        <div className="flex items-center gap-4 shrink-0 flex-wrap">
          <div className="p-4 rounded-2xl bg-surface/80 dark:bg-night-field/80 border border-border/60 dark:border-night-border flex flex-col gap-2 w-32">
            <SkeletonBlock className="w-16 h-3 rounded-md" />
            <SkeletonBlock className="w-20 h-6 rounded-lg" />
          </div>
          <div className="p-4 rounded-2xl bg-surface/80 dark:bg-night-field/80 border border-border/60 dark:border-night-border flex flex-col gap-2 w-32">
            <SkeletonBlock className="w-16 h-3 rounded-md" />
            <SkeletonBlock className="w-20 h-6 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 2. Top 6 KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border shadow-sm flex flex-col justify-between h-44"
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="w-28 h-3.5 rounded-md" />
              <SkeletonBlock className="size-9 rounded-2xl" />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <SkeletonBlock className="w-36 sm:w-44 h-8 rounded-xl" />
              <SkeletonBlock className="w-48 h-3 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Financial Equation Flow & MoM Comparison Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Equation */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <SkeletonBlock className="size-9 rounded-xl" />
              <SkeletonBlock className="w-48 h-5 rounded-md" />
            </div>
            <SkeletonBlock className="w-40 h-6 rounded-xl" />
          </div>

          {/* 3 Equation Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 my-4 items-center">
            <div className="p-4 rounded-2xl bg-border/10 dark:bg-night-field/50 border border-border/40 flex flex-col items-center gap-2">
              <SkeletonBlock className="w-20 h-3 rounded-md" />
              <SkeletonBlock className="w-24 h-5 rounded-lg" />
            </div>
            <div className="hidden sm:flex justify-center text-muted/30 font-bold text-xl">-</div>
            <div className="p-4 rounded-2xl bg-border/10 dark:bg-night-field/50 border border-border/40 flex flex-col items-center gap-2">
              <SkeletonBlock className="w-20 h-3 rounded-md" />
              <SkeletonBlock className="w-24 h-5 rounded-lg" />
            </div>
            <div className="hidden sm:flex justify-center text-muted/30 font-bold text-xl">=</div>
            <div className="p-4 rounded-2xl bg-border/10 dark:bg-night-field/50 border border-border/40 flex flex-col items-center gap-2">
              <SkeletonBlock className="w-20 h-3 rounded-md" />
              <SkeletonBlock className="w-24 h-5 rounded-lg" />
            </div>
          </div>

          {/* Progress Bar & Legends */}
          <div className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="w-36 h-3.5 rounded-md" />
              <SkeletonBlock className="w-24 h-3.5 rounded-md" />
            </div>
            <SkeletonBlock className="w-full h-3.5 rounded-full" />
            <div className="flex items-center justify-between gap-2 flex-wrap mt-1">
              <SkeletonBlock className="w-28 h-3 rounded-md" />
              <SkeletonBlock className="w-28 h-3 rounded-md" />
              <SkeletonBlock className="w-28 h-3 rounded-md" />
            </div>
          </div>
        </div>

        {/* Right 1 Col: MoM Comparison */}
        <div className="p-6 sm:p-7 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border shadow-sm flex flex-col justify-between">
          <div>
            <SkeletonBlock className="w-40 h-5 rounded-md mb-2" />
            <SkeletonBlock className="w-48 h-3 rounded-md mb-5" />

            <div className="flex flex-col gap-3.5">
              <div className="p-3.5 rounded-2xl bg-background/50 dark:bg-night-field border border-border/40 flex items-center justify-between">
                <SkeletonBlock className="w-28 h-3.5 rounded-md" />
                <SkeletonBlock className="w-20 h-4 rounded-md" />
              </div>
              <div className="p-3.5 rounded-2xl bg-background/50 dark:bg-night-field border border-border/40 flex items-center justify-between">
                <SkeletonBlock className="w-28 h-3.5 rounded-md" />
                <SkeletonBlock className="w-16 h-4 rounded-md" />
              </div>
              <div className="p-3.5 rounded-2xl bg-background/50 dark:bg-night-field border border-border/40 flex items-center justify-between">
                <SkeletonBlock className="w-28 h-3.5 rounded-md" />
                <SkeletonBlock className="w-24 h-4 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Category Cards Grid Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="size-5 rounded-md" />
            <SkeletonBlock className="w-36 h-4.5 rounded-md" />
          </div>
          <SkeletonBlock className="w-24 h-3.5 rounded-md" />
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${
            isFtl ? 'xl:grid-cols-8' : 'xl:grid-cols-6'
          } gap-4`}
        >
          {Array.from({ length: categoryCount }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border flex flex-col justify-between gap-3 h-40"
            >
              <div className="flex items-center justify-between">
                <SkeletonBlock className="size-8 rounded-2xl" />
                <SkeletonBlock className="w-9 h-4 rounded-lg" />
              </div>
              <div className="flex flex-col gap-1.5">
                <SkeletonBlock className="w-20 h-3 rounded-md" />
                <SkeletonBlock className="w-24 h-4.5 rounded-lg" />
                <SkeletonBlock className="w-14 h-2.5 rounded-md" />
              </div>
              <SkeletonBlock className="w-full h-3 rounded-md mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Table Row for Expense Ledger
 */
export function ExpenseTableRowSkeleton() {
  return (
    <tr className="border-b border-border/30 dark:border-night-border/40">
      <td className="px-6 py-4">
        <SkeletonBlock className="w-20 h-3.5 rounded-md" />
      </td>
      <td className="px-6 py-4">
        <SkeletonBlock className="w-14 h-5 rounded-xl" />
      </td>
      <td className="px-6 py-4">
        <SkeletonBlock className="w-24 h-6 rounded-xl" />
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1.5 max-w-sm">
          <SkeletonBlock className="w-48 h-3.5 rounded-md" />
          <SkeletonBlock className="w-24 h-3 rounded-md" />
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end">
          <SkeletonBlock className="w-20 h-4 rounded-md" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <SkeletonBlock className="size-7 rounded-xl" />
          <SkeletonBlock className="size-7 rounded-xl" />
        </div>
      </td>
    </tr>
  );
}

/**
 * Skeleton for Expense Ledger Tab
 */
export function ExpenseLedgerSkeleton({ section = 'ftl' }: { section?: ExpenseSection }) {
  const isFtl = section === 'ftl';
  const categoryCount = isFtl ? 8 : 6;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Section Switcher Bar Skeleton */}
      <div className="flex items-center justify-between gap-4 p-2 rounded-2xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="w-20 h-8 rounded-xl" />
          <SkeletonBlock className="w-20 h-8 rounded-xl" />
        </div>
        <SkeletonBlock className="w-28 h-4 rounded-md mr-2" />
      </div>

      {/* 2. Category Ribbon Skeleton */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-4 ${
          isFtl ? 'lg:grid-cols-8' : 'lg:grid-cols-6'
        } gap-3`}
      >
        {Array.from({ length: categoryCount }).map((_, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl border border-border/60 dark:border-night-border bg-surface/70 dark:bg-night-surface/70 flex flex-col justify-between gap-2.5 h-24"
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="size-7 rounded-xl" />
              <SkeletonBlock className="w-6 h-3 rounded-md" />
            </div>
            <div className="flex flex-col gap-1">
              <SkeletonBlock className="w-16 h-2.5 rounded-md" />
              <SkeletonBlock className="w-20 h-3.5 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Executive Stats Strip Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-2 flex items-center gap-3">
            <SkeletonBlock className="size-10 rounded-2xl shrink-0" />
            <div className="flex flex-col gap-1.5">
              <SkeletonBlock className="w-16 h-2.5 rounded-md" />
              <SkeletonBlock className="w-24 h-4 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Filter Toolbar Skeleton */}
      <div className="p-5 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <SkeletonBlock className="w-full sm:w-80 h-9 rounded-2xl" />
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <SkeletonBlock className="w-24 h-9 rounded-2xl" />
            <SkeletonBlock className="w-24 h-9 rounded-2xl" />
            <SkeletonBlock className="w-28 h-9 rounded-2xl" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-border/40">
          <SkeletonBlock className="w-28 h-7 rounded-xl" />
          <SkeletonBlock className="w-36 h-7 rounded-xl" />
          <SkeletonBlock className="w-36 h-7 rounded-xl" />
          <SkeletonBlock className="w-36 h-7 rounded-xl" />
        </div>
      </div>

      {/* 5. Table Skeleton */}
      <div className="rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 dark:border-night-border bg-background/50 dark:bg-night-field/50 text-[11px] uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Section</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 dark:divide-night-border">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ExpenseTableRowSkeleton key={idx} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Salary Management Tab
 */
export function SalaryManagementSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Quick Actions Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="w-48 h-6 rounded-xl" />
          <SkeletonBlock className="w-64 h-3.5 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-32 h-9 rounded-2xl" />
          <SkeletonBlock className="w-36 h-9 rounded-2xl" />
        </div>
      </div>

      {/* 2. Top Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border flex items-center justify-between h-28"
          >
            <div className="flex flex-col gap-2">
              <SkeletonBlock className="w-24 h-3 rounded-md" />
              <SkeletonBlock className="w-32 h-6 rounded-xl" />
            </div>
            <SkeletonBlock className="size-11 rounded-2xl" />
          </div>
        ))}
      </div>

      {/* 3. Department Accordion List Skeleton */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-surface/70 dark:bg-night-surface/70 border border-border/60 dark:border-night-border flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="size-9 rounded-2xl" />
                <div className="flex flex-col gap-1.5">
                  <SkeletonBlock className="w-36 h-4.5 rounded-md" />
                  <SkeletonBlock className="w-24 h-3 rounded-md" />
                </div>
              </div>
              <SkeletonBlock className="w-28 h-6 rounded-xl" />
            </div>

            {/* Employee Rows inside department */}
            <div className="divide-y divide-border/40 dark:divide-night-border pt-2">
              {[1, 2].map((j) => (
                <div key={j} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="size-8 rounded-full" />
                    <div className="flex flex-col gap-1">
                      <SkeletonBlock className="w-32 h-3.5 rounded-md" />
                      <SkeletonBlock className="w-20 h-2.5 rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className="w-24 h-8 rounded-xl" />
                    <SkeletonBlock className="size-8 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
