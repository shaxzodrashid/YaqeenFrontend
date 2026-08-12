import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  TrendingUp,
  Crown,
  Users,
  CheckCircle2,
  FileCheck2,
  PhoneCall,
  DollarSign,
  Plus,
  Equal,
  Sparkles,
  Info,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  HeartHandshake,
  Lightbulb,
} from 'lucide-react';
import { T } from '../T';

export function SalesCareerSystemVisual() {
  const [activeTab, setActiveTab] = useState<'all' | 'levels' | 'rules' | 'formula'>('all');

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* PLEASANT HERO BANNER                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-navy to-indigo-950 p-6 sm:p-8 text-white border border-brand-gold/30 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-bold tracking-wide">
              <Sparkles className="size-3.5 text-brand-gold" />
              <span>Career & Performance Framework</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              <T k="smkTitle" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              A transparent, supportive, and result-oriented growth roadmap designed to reward
              success, encourage mentorship, and boost your monthly earnings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-brand-navy font-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              All Overview
            </button>
            <button
              onClick={() => setActiveTab('levels')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'levels'
                  ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-brand-navy font-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Career Levels
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-brand-navy font-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Rules & Support
            </button>
            <button
              onClick={() => setActiveTab('formula')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'formula'
                  ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-brand-navy font-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Formula
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 1: BONUS (%) & CAREER LEVELS                              */}
      {/* ----------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'levels') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* BLOCK 1: SALES BONUS (%) SCALE */}
          <div className="lg:col-span-4 rounded-3xl bg-surface dark:bg-surface border border-border/60 shadow-sm hover:shadow-md transition-all p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">
                      1. Sales Bonus Matrix (%)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Volume-based monthly commission scale
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-3">Oylik Savdo (USD)</th>
                      <th className="px-4 py-3 text-right">Bonus Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground">$0 – $1,999</td>
                      <td className="px-4 py-2.5 text-right font-bold text-muted-foreground">0%</td>
                    </tr>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">$2,000 – $3,999</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        10%
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">$4,000 – $5,999</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        15%
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">$6,000 – $7,999</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">
                        20%
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">$8,000 – $9,999</td>
                      <td className="px-4 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        22%
                      </td>
                    </tr>
                    <tr className="bg-brand-gold/10 hover:bg-brand-gold/15 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-brand-gold">≥ $10,000</td>
                      <td className="px-4 py-2.5 text-right font-black text-brand-gold text-sm">
                        25%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
              <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                Bonus is calculated based on monthly sales results according to this tier schedule.
              </p>
            </div>
          </div>

          {/* BLOCK 2: CAREER LEVELS CARDS */}
          <div className="lg:col-span-8 rounded-3xl bg-surface dark:bg-surface border border-border/60 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/30">
                  <Crown className="size-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    2. Career Levels & Growth Tiers
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Salary tiers, targets, and mentorship pathways
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pt-1">
              {/* JUNIOR */}
              <motion.div
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs">
                      <Users className="size-3.5" />
                      JUNIOR
                    </span>
                  </div>
                  <div className="py-2 border-y border-emerald-500/20">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase block">
                      FIXED SALARY
                    </span>
                    <strong className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      $300 USD
                    </strong>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-foreground font-medium">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>
                        Plan: <strong>0 – $3,000</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>
                        SR Check: <strong>$150 / $300</strong>
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-emerald-500/20 space-y-1 text-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
                    <ArrowUpRight className="size-3" />
                    PROMOTION:
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Achieve KPI <strong>2 consecutive months</strong> to advance to{' '}
                    <strong>MID</strong> level.
                  </p>
                </div>
              </motion.div>

              {/* MID */}
              <motion.div
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-transparent p-4 space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-500 text-white flex items-center gap-1.5 shadow-xs">
                      <TrendingUp className="size-3.5" />
                      MID
                    </span>
                  </div>
                  <div className="py-2 border-y border-blue-500/20">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase block">
                      FIXED SALARY
                    </span>
                    <strong className="text-xl font-black text-blue-600 dark:text-blue-400">
                      $500 USD
                    </strong>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-foreground font-medium">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-blue-500 shrink-0" />
                      <span>
                        Plan: <strong>$5,000 – $6,000</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-blue-500 shrink-0" />
                      <span>
                        SR Check: <strong>$200 / $400</strong>
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-blue-500/20 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block flex items-center gap-1">
                      <ArrowUpRight className="size-3" />
                      PROMOTION:
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Achieve KPI <strong>3 consecutive months</strong> to reach{' '}
                      <strong>SENIOR</strong> rank.
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Level Realignment:
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      2 missed plan months resets to <strong>JUNIOR</strong>.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* SENIOR */}
              <motion.div
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-transparent p-4 space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-500 text-white flex items-center gap-1.5 shadow-xs">
                      <Award className="size-3.5" />
                      SENIOR
                    </span>
                  </div>
                  <div className="py-2 border-y border-purple-500/20">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase block">
                      FIXED SALARY
                    </span>
                    <strong className="text-xl font-black text-purple-600 dark:text-purple-400">
                      $700 USD
                    </strong>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-foreground font-medium">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-purple-500 shrink-0" />
                      <span>
                        Plan: <strong>$6,001 – $8,000</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-purple-500 shrink-0" />
                      <span>
                        SR Check: <strong>$250 / $500</strong>
                      </span>
                    </li>
                  </ul>
                  <div className="mt-2.5 p-2 rounded-xl bg-purple-500/10 text-[11px] font-semibold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                    <HeartHandshake className="size-3.5 shrink-0" />
                    <span>
                      Train at least <strong>1 mentee</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-purple-500/20 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block flex items-center gap-1">
                      <ArrowUpRight className="size-3" />
                      PROMOTION:
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Achieve KPI <strong>4 consecutive months</strong> to reach{' '}
                      <strong>EXPERT</strong> rank.
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Level Realignment:
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      2 missed plan months resets to <strong>MID</strong>.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* EXPERT */}
              <motion.div
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-4 space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-white flex items-center gap-1.5 shadow-xs">
                      <Crown className="size-3.5" />
                      EXPERT
                    </span>
                  </div>
                  <div className="py-2 border-y border-amber-500/20">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase block">
                      FIXED SALARY
                    </span>
                    <strong className="text-xl font-black text-amber-600 dark:text-amber-400">
                      $1,000 USD
                    </strong>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-foreground font-medium">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-amber-500 shrink-0" />
                      <span>
                        Plan: <strong>$8,001 – $10,000</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-amber-500 shrink-0" />
                      <span>
                        SR Check: <strong>$300 / $600</strong>
                      </span>
                    </li>
                  </ul>
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <HeartHandshake className="size-3.5 shrink-0" />
                    <span>
                      Train at least <strong>3 mentees</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-500/20 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Level Realignment:
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      3 missed plan months resets to <strong>SENIOR</strong>.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 2: SR CHECK & PERFORMANCE REVIEW EXCEPTION RULES          */}
      {/* ----------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'rules') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* BLOCK 3: AVERAGE CHECK (SR CHECK) EXCEPTION RULES */}
          <div className="lg:col-span-6 rounded-3xl bg-surface dark:bg-surface border border-border/60 shadow-sm p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30">
                    <FileCheck2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">
                      3. Average Check (SR Check) Policy
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Fair review procedures for sales target achievers
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Compass className="size-4 text-blue-500" />
                    <span>Fair Consideration:</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If an employee meets their monthly sales volume plan but misses the Average
                    Check target, their KPI is <strong>not automatically rejected</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    REVIEW WORKFLOW:
                  </span>
                  <ol className="text-xs text-foreground font-semibold space-y-1 list-decimal list-inside">
                    <li>ROP / CEO Sync Meeting</li>
                    <li>Deal Structure Analysis</li>
                    <li>Written Approval</li>
                    <li>KPI Bonus Approved</li>
                  </ol>
                </div>
              </div>

              {/* Real World Example */}
              <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-brand-navy text-white border border-brand-gold/30 space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Practical Scenario:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-bold text-[10px]">
                    Senior Level
                  </span>
                </div>
                <p className="text-xs text-slate-200">
                  Senior Average Check requirement = <strong>$500 USD</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10 text-slate-300">
                  <div>
                    Actual Sales: <strong className="text-emerald-400">$7,200</strong>
                  </div>
                  <div>
                    Average Check: <strong className="text-amber-400">$450</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 italic pt-1">
                  💡 Upon ROP or CEO written confirmation, full KPI bonus is approved.
                </p>
              </div>
            </div>
          </div>

          {/* BLOCK 4: PERFORMANCE REVIEW & DISCIPLINE STANDARDS */}
          <div className="lg:col-span-6 rounded-3xl bg-surface dark:bg-surface border border-border/60 shadow-sm p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/30">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">
                      4. Performance Review & Exceptions
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Holistic evaluation for high-discipline team members
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    High Discipline Standards:
                  </span>
                  <ul className="text-xs text-muted-foreground space-y-1.5 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Daily Bitrix CRM maintenance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PhoneCall className="size-3.5 text-emerald-500 shrink-0" />
                      <span>30+ daily client calls</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Controlled debtor debt</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>Positive client feedback</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    Minor Target Gaps:
                  </span>
                  <p className="text-xs text-foreground font-semibold leading-relaxed">
                    E.g. Sales reached <strong>$5,600</strong> instead of $6,001 target.
                  </p>
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    Decision evaluated by ROP or CEO via Performance Review.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Evaluation Factors Reviewed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'CRM Activity',
                    'Daily Calls',
                    'Proposals Sent',
                    'Follow-up Quality',
                    'Debtor Standing',
                    'Client Reviews',
                    'Market Conditions',
                    'Employee Initiative',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface border border-border/80 text-foreground shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 3: SERVICE STANDARDS & TOTAL FORMULA                       */}
      {/* ----------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'rules' || activeTab === 'formula') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* BLOCK 5: SERVICE & DISCIPLINE STANDARDS */}
          <div className="lg:col-span-5 rounded-3xl bg-surface dark:bg-surface border border-border/60 shadow-sm p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30">
                    <Compass className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">
                      5. Service & Quality Benchmarks
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Core operational standards for all managers
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Consistent adherence to operational standards ensures quality customer service
                across all teams:
              </p>

              <div className="grid grid-cols-1 gap-2 text-xs font-medium text-foreground">
                {[
                  {
                    title: 'Bitrix CRM Management',
                    desc: 'Timely record keeping and pipeline updates',
                  },
                  {
                    title: 'Call Volume Standard',
                    desc: 'Target of 30+ daily phone consultations',
                  },
                  { title: 'Follow-up Quality', desc: 'Structured customer check-ins' },
                  { title: 'Debtor Control', desc: 'Maintaining healthy account balances' },
                  { title: 'Customer Satisfaction', desc: 'Prompt resolution of client inquiries' },
                  { title: 'Work Discipline', desc: 'Punctuality and team collaboration' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block text-xs">{item.title}</strong>
                      <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BLOCK 6: TOTAL EARNINGS FORMULA */}
          <div className="lg:col-span-7 rounded-3xl bg-surface dark:bg-surface border border-border/60 shadow-sm p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">
                      6. Total Earnings Calculation Formula
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Complete monthly compensation composition
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Formula Grid */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-brand-navy to-indigo-950 text-white border border-brand-gold/30 shadow-lg space-y-4">
                <span className="text-xs uppercase tracking-widest text-brand-gold font-extrabold block text-center">
                  MONTHLY EARNINGS FORMULA
                </span>

                <div className="flex flex-wrap items-center justify-center gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
                    <DollarSign className="size-5 text-emerald-400 mx-auto mb-1" />
                    <span className="text-xs font-bold block text-white">FIXED SALARY</span>
                    <span className="text-[10px] text-slate-300">$300 – $1,000</span>
                  </div>

                  <Plus className="size-5 text-brand-gold font-bold" />

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
                    <TrendingUp className="size-5 text-blue-400 mx-auto mb-1" />
                    <span className="text-xs font-bold block text-white">SALES BONUS</span>
                    <span className="text-[10px] text-slate-300">0% – 25%</span>
                  </div>

                  <Plus className="size-5 text-brand-gold font-bold" />

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
                    <Award className="size-5 text-purple-400 mx-auto mb-1" />
                    <span className="text-xs font-bold block text-white">KPI BONUS</span>
                    <span className="text-[10px] text-slate-300">Target Achieved</span>
                  </div>

                  <Plus className="size-5 text-brand-gold font-bold" />

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
                    <Sparkles className="size-5 text-amber-400 mx-auto mb-1" />
                    <span className="text-xs font-bold block text-white">ADDITIONAL</span>
                    <span className="text-[10px] text-slate-300">Mentorship & CEO</span>
                  </div>

                  <Equal className="size-6 text-emerald-400 font-black" />

                  <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40">
                    <span className="text-xs font-black text-emerald-400 block uppercase tracking-wide">
                      TOTAL INCOME
                    </span>
                    <span className="text-lg font-black text-white">$ MONTHLY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspiring Statement */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs flex items-start gap-3">
              <Info className="size-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground uppercase tracking-wider text-[11px] block mb-0.5">
                  COMMITTED TO EXCELLENCE:
                </strong>
                <p className="text-muted-foreground leading-relaxed">
                  This system is designed to be fair, transparent, and rewarding. Beyond sales
                  volume, team spirit, CRM quality, and dedication are recognized to foster
                  long-term professional growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
