import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

const FilterToolbar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions = [],
  priorityFilter,
  onPriorityChange,
  priorityOptions = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  categoryFilter,
  onCategoryChange,
  categoryOptions = [],
  onReset,
  totalResults,
  filteredCount,
  placeholder = "Search complaints by ID, title, submitter...",
  extraActions = null,
}) => {
  const hasActiveFilters =
    (searchQuery && searchQuery.trim() !== '') ||
    (statusFilter && statusFilter !== 'ALL') ||
    (priorityFilter && priorityFilter !== 'ALL') ||
    (categoryFilter && categoryFilter !== 'ALL');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9.5 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          {statusOptions.length > 0 && (
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value || opt} value={opt.value || opt}>
                  {opt.label || opt.replace('_', ' ')}
                </option>
              ))}
            </select>
          )}

          {/* Priority Dropdown */}
          {priorityOptions.length > 0 && (
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p === 'ALL' ? 'All Priorities' : p}
                </option>
              ))}
            </select>
          )}

          {/* Category Dropdown */}
          {categoryOptions.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters */}
          {hasActiveFilters && onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-all"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {extraActions}
        </div>
      </div>

      {/* Result stats strip */}
      {(totalResults !== undefined || filteredCount !== undefined) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="font-semibold text-slate-800">{filteredCount ?? 0}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalResults ?? 0}</strong> records
          </span>

          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              <Filter className="w-3 h-3" />
              Filtered view active
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;
