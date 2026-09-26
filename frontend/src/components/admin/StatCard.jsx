import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';

const StatCard = ({
  label,
  value,
  change,
  trend = 'neutral', // 'up' | 'down' | 'neutral' | 'alert'
  icon: Icon,
  subtitle,
  onClick,
  active = false,
}) => {
  const getTrendStyle = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'down':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'alert':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-3.5 h-3.5" />;
      case 'down':
        return <ArrowDownRight className="w-3.5 h-3.5" />;
      case 'alert':
        return <AlertCircle className="w-3.5 h-3.5" />;
      default:
        return <Minus className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border p-5 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-slate-400 hover:shadow-sm' : ''
      } ${
        active
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
          : 'border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
            {change && (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full border ${getTrendStyle()}`}
              >
                {getTrendIcon()}
                {change}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-3 text-xs text-slate-500 font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
