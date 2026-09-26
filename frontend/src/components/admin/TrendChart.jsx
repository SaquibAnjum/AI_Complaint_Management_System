import React, { useState } from 'react';

const TrendChart = ({ data = [], height = 240, title = "Volume Trend (Received vs Resolved)" }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center h-64 text-sm text-slate-400">
        No trend data available
      </div>
    );
  }

  // Calculate SVG points
  const paddingX = 40;
  const paddingY = 30;
  const svgWidth = 600;
  const svgHeight = height;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.received || 0, d.resolved || 0)),
    10
  );
  // Round up maxVal to a nice number
  const yMax = Math.ceil(maxVal / 10) * 10;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const getX = (index) => paddingX + (index / (data.length - 1)) * chartWidth;
  const getY = (val) => svgHeight - paddingY - (val / yMax) * chartHeight;

  // Build SVG path strings
  const receivedPoints = data.map((d, i) => `${getX(i)},${getY(d.received || 0)}`);
  const resolvedPoints = data.map((d, i) => `${getX(i)},${getY(d.resolved || 0)}`);

  const receivedLinePath = `M ${receivedPoints.join(' L ')}`;
  const resolvedLinePath = `M ${resolvedPoints.join(' L ')}`;

  // Area paths for soft underfill
  const receivedAreaPath = `${receivedLinePath} L ${getX(data.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;
  const resolvedAreaPath = `${resolvedLinePath} L ${getX(data.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;

  // Horizontal guide lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly comparison of incoming submissions against closed resolutions
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
            <span className="text-slate-600">Received</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-600">Resolved</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="gradientReceived" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradientResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {gridLines.map((ratio, idx) => {
            const y = svgHeight - paddingY - ratio * chartHeight;
            const value = Math.round(ratio * yMax);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray={idx === 0 ? 'none' : '4 4'}
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Area fills */}
          <path d={receivedAreaPath} fill="url(#gradientReceived)" />
          <path d={resolvedAreaPath} fill="url(#gradientResolved)" />

          {/* Lines */}
          <path
            d={receivedLinePath}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={resolvedLinePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points and hover interaction overlay */}
          {data.map((d, i) => {
            const x = getX(i);
            const yReceived = getY(d.received || 0);
            const yResolved = getY(d.resolved || 0);
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={svgHeight - paddingY}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Circles for Received */}
                <circle
                  cx={x}
                  cy={yReceived}
                  r={isHovered ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />

                {/* Circles for Resolved */}
                <circle
                  cx={x}
                  cy={yResolved}
                  r={isHovered ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />

                {/* X-axis labels */}
                <text
                  x={x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className={`text-[11px] font-medium ${
                    isHovered ? 'fill-slate-900 font-semibold' : 'fill-slate-400'
                  }`}
                >
                  {d.label}
                </text>

                {/* Invisible hover area for cursor */}
                <rect
                  x={x - chartWidth / (data.length * 2)}
                  y={0}
                  width={chartWidth / data.length}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute pointer-events-none bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg transform -translate-x-1/2 -translate-y-full transition-all duration-75 z-10"
            style={{
              left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
              top: '40px',
            }}
          >
            <div className="font-semibold border-b border-slate-700 pb-1 mb-1 text-slate-200">
              {data[hoveredIndex].label}
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                Received:
              </span>
              <span className="font-bold text-white">
                {data[hoveredIndex].received}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300 mt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Resolved:
              </span>
              <span className="font-bold text-white">
                {data[hoveredIndex].resolved}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendChart;
