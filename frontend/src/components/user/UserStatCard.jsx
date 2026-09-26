import React from 'react';

const VARIANT_STYLES = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    contextText: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    ring: 'hover:border-indigo-300',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    contextText: 'text-amber-700 bg-amber-50 border-amber-200',
    ring: 'hover:border-amber-300',
  },
  blue: {
    iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
    contextText: 'text-sky-700 bg-sky-50 border-sky-200',
    ring: 'hover:border-sky-300',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    contextText: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    ring: 'hover:border-emerald-300',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    contextText: 'text-rose-700 bg-rose-50 border-rose-200',
    ring: 'hover:border-rose-300',
  },
};

const UserStatCard = ({
  label,
  value,
  context,
  icon: Icon,
  variant = 'indigo',
  onClick,
  active = false,
}) => {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.indigo;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 transition-all duration-150 relative ${
        onClick ? 'cursor-pointer' : ''
      } ${
        active
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
          : `border-slate-200 ${styles.ring} shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-sm`
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
            {context && (
              <span
                className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${styles.contextText}`}
              >
                {context}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`p-2.5 rounded-lg border flex items-center justify-center ${styles.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStatCard;
