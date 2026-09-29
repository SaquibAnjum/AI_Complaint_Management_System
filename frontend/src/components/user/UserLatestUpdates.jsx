import React from 'react';
import { Bell, Clock, ArrowRight, CheckCircle2, PlayCircle, MessageSquare } from 'lucide-react';

const STATUS_ICONS = {
  IN_PROGRESS: {
    icon: PlayCircle,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  REMARK: {
    icon: MessageSquare,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  ASSIGNED: {
    icon: Clock,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  RESOLVED: {
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
};

const UserLatestUpdates = ({ updates = [], onSelectTicket, maxItems = 4 }) => {
  const displayItems = updates.slice(0, maxItems);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-slate-400" />
            <span>Latest Updates</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status changes and updates on your tickets
          </p>
        </div>
      </div>

      <div className="flow-root">
        <ul className="-mb-6">
          {displayItems.map((item, idx) => {
            const isLast = idx === displayItems.length - 1;
            const config = STATUS_ICONS[item.type] || {
              icon: Clock,
              color: 'text-slate-600 bg-slate-100 border-slate-200',
            };
            const Icon = config.icon;

            return (
              <li key={item.id || idx}>
                <div className="relative pb-5">
                  {!isLast && (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div
                      className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 pt-1">
                      <div className="text-xs text-slate-800 font-medium leading-relaxed">
                        <span>{item.activity}</span>
                        {item.ticket_id && (
                          <button
                            type="button"
                            onClick={() => onSelectTicket && onSelectTicket(item.ticket_id)}
                            className="font-mono font-semibold text-indigo-600 hover:underline ml-1.5 cursor-pointer"
                          >
                            {item.ticket_id}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.time}
                      </p>
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

export default UserLatestUpdates;
