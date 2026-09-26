import React from 'react';
import {
  FilePlus,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EVENT_ICONS = {
  COMPLAINT_CREATED: {
    icon: FilePlus,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  STATUS_CHANGED: {
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  STAFF_ASSIGNED: {
    icon: UserCheck,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  COMPLAINT_RESOLVED: {
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  PRIORITY_ESCALATED: {
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  USER_SUSPENDED: {
    icon: ShieldAlert,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
};

const ActivityTimeline = ({
  activities = [],
  title = "Recent System Audit Trail",
  maxItems = 8,
}) => {
  const navigate = useNavigate();
  const displayItems = activities.slice(0, maxItems);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit log of institutional ticket interactions
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/complaints')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View all tickets <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {displayItems.map((act, actIdx) => {
            const isLast = actIdx === displayItems.length - 1;
            const config = EVENT_ICONS[act.type] || {
              icon: Clock,
              color: 'text-slate-600 bg-slate-100 border-slate-200',
            };
            const Icon = config.icon;

            return (
              <li key={act.id || actIdx}>
                <div className="relative pb-6">
                  {!isLast && (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    {/* Event Icon */}
                    <div>
                      <div
                        className={`h-8 w-8 rounded-full border flex items-center justify-center ${config.color}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="text-xs text-slate-800 font-medium leading-relaxed">
                        <span>{act.description}</span>
                        {act.ticket_id && (
                          <span
                            onClick={() =>
                              navigate(
                                `/admin/complaints?search=${encodeURIComponent(
                                  act.ticket_id
                                )}`
                              )
                            }
                            className="font-mono font-semibold text-indigo-600 hover:underline ml-1.5 cursor-pointer"
                          >
                            {act.ticket_id}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{act.actor || 'System'}</span>
                        <span>•</span>
                        <span>{act.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ActivityTimeline;
