import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Calculator, Crown, Award, Target } from 'lucide-react';
import { T } from '../T';
import { LtlCalcTab } from './LtlCalcTab';
import { RopSeoModuleTab } from './RopSeoModuleTab';
import { EmployeePlansTab } from './EmployeePlansTab';
import { SalesManagerKpiTab } from './SalesManagerKpiTab';

export type KpiTabId = 'ltl-calc' | 'rop-seo' | 'sales-manager' | 'plans';

export function KpiPage() {
  const [activeTab, setActiveTab] = useState<KpiTabId>('ltl-calc');

  const tabs: { id: KpiTabId; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'ltl-calc', labelKey: 'tabLtlCalc', icon: <Calculator className="size-4" /> },
    { id: 'rop-seo', labelKey: 'tabRopKpi', icon: <Crown className="size-4" /> },
    { id: 'sales-manager', labelKey: 'tabSalesManagerKpi', icon: <Award className="size-4" /> },
    { id: 'plans', labelKey: 'tabPlans', icon: <Target className="size-4" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ltl-calc':
        return <LtlCalcTab />;
      case 'rop-seo':
        return <RopSeoModuleTab />;
      case 'sales-manager':
        return <SalesManagerKpiTab />;
      case 'plans':
        return <EmployeePlansTab />;
      default:
        return <LtlCalcTab />;
    }
  };

  return (
    <div className="space-y-6 pb-12 min-w-0 max-w-full">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-brand-navy to-brand-royal text-brand-gold border border-brand-gold/30 shadow-sm shrink-0">
            <BarChart3 className="size-5 sm:size-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              <T k="navKpi" />
            </h1>
          </div>
        </div>
      </div>

      {/* Animated Framer Motion Tab Switcher */}
      <div className="border-b border-border bg-surface/50 dark:bg-surface/50 p-1 sm:p-1.5 rounded-2xl backdrop-blur-md overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 select-none ${
                  isActive
                    ? 'text-brand-navy dark:text-brand-gold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-kpi-tab-bg"
                    className="absolute inset-0 bg-brand-gold/20 dark:bg-brand-gold/15 rounded-xl border border-brand-gold/40 shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? 'text-brand-gold' : ''}`}>
                  {tab.icon}
                </span>
                <span className="relative z-10 whitespace-nowrap">
                  <T k={tab.labelKey} />
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content Display Pane */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-full"
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
