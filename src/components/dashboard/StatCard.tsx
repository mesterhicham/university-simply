import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'purple' | 'emerald' | 'sky' | 'amber';
}

const variantStyles: Record<string, { card: string; iconBg: string }> = {
  default: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800',
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300',
  },
  purple: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800',
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300',
  },
  primary: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800',
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300',
  },
  emerald: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-300',
  },
  success: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-300',
  },
  sky: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-300',
  },
  accent: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-300',
  },
  amber: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-300',
  },
  warning: {
    card: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-300',
  },
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border shadow-xs rounded-3xl p-5 md:p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5", 
      currentVariant.card
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "mt-2 text-xs font-semibold flex items-center gap-1",
              trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              <span>{trend.isPositive ? '↑ +' : '↓ -'}{Math.abs(trend.value)}%</span>
              <span className="text-slate-400 font-normal">من الشهر الماضي</span>
            </p>
          )}
        </div>
        <div className={cn("p-3.5 rounded-2xl shrink-0 shadow-xs", currentVariant.iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
