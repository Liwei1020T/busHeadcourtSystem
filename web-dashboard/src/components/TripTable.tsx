import { HeadcountRow } from '../types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, Sun, Moon, HelpCircle, Users, ChevronDown, ChevronUp, ChevronRight, MapPin, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

type TripTableProps = {
  rows: HeadcountRow[];
  loading: boolean;
};

function ShiftBadge({ shift }: { shift: string }) {
  const isMorning = shift === 'morning';
  const isNight = shift === 'night';

  const config = {
    morning: { icon: <Sun className="w-3 h-3" />, label: 'AM', bg: 'bg-emerald-100 text-emerald-700' },
    night: { icon: <Moon className="w-3 h-3" />, label: 'PM', bg: 'bg-teal-100 text-teal-700' },
    unknown: { icon: <HelpCircle className="w-3 h-3" />, label: '?', bg: 'bg-red-100 text-red-700' }
  };

  const { icon, label, bg } = config[isMorning ? 'morning' : isNight ? 'night' : 'unknown'];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg}`}>
      {icon}
      {label}
    </span>
  );
}

// Expandable row card with detail view
function RowCard({ row, index }: { row: HeadcountRow; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasIssue = row.unknown_batch > 0 || row.unknown_shift > 0;

  return (
    <div className={`
      ${hasIssue ? 'bg-amber-50 border-l-2 border-amber-500' : ''}
      ${index % 2 === 0 && !hasIssue ? 'bg-emerald-50/30' : 'bg-white'}
    `}>
      {/* Main Row - Clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-4 hover:bg-emerald-50 transition-colors text-left"
      >
        {/* Expand Indicator */}
        <div className="flex-shrink-0 text-gray-400">
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>

        {/* Date + Bus */}
        <div className="w-16 flex-shrink-0">
          <div className="text-sm font-semibold text-gray-900">
            {format(parseISO(row.date), 'MM/dd')}
          </div>
          <div className="text-xs text-emerald-600 font-medium">{row.bus_id}</div>
        </div>

        {/* Shift Badge */}
        <div className="w-12 flex-shrink-0">
          <ShiftBadge shift={row.shift} />
        </div>

        {/* Present Count - Main Focus */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-emerald-600">{row.present}</div>
          </div>
        </div>

        {/* Anomaly Indicators */}
        <div className="w-16 flex-shrink-0 flex items-center justify-end gap-2">
          {row.unknown_batch > 0 && (
            <div className="flex items-center gap-1 text-amber-600" title="Unknown Batch">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{row.unknown_batch}</span>
            </div>
          )}
          {row.unknown_shift > 0 && (
            <div className="flex items-center gap-1 text-red-600" title="Unknown Shift">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{row.unknown_shift}</span>
            </div>
          )}
          {!row.unknown_batch && !row.unknown_shift && (
            <span className="text-emerald-500 text-sm font-medium">OK</span>
          )}
        </div>
      </button>

      {/* Expanded Detail View */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 ml-8 border-l-2 border-emerald-200">
          <div className="bg-emerald-50/50 rounded-lg p-4 space-y-3">
            {/* Full Date */}
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Date:</span>
              <span className="text-gray-900 font-medium">
                {format(parseISO(row.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Route:</span>
              <span className="text-gray-900 font-medium">
                {row.route || 'Not specified'}
              </span>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              <div className="bg-white rounded-lg p-3 text-center border border-emerald-200">
                <div className="text-lg font-bold text-emerald-600">{row.present}</div>
                <div className="text-[10px] text-gray-500 uppercase">Present</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <div className={`text-lg font-bold ${row.unknown_batch > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {row.unknown_batch}
                </div>
                <div className="text-[10px] text-gray-500 uppercase">Unknown Batch</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <div className={`text-lg font-bold ${row.unknown_shift > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {row.unknown_shift}
                </div>
                <div className="text-[10px] text-gray-500 uppercase">Unknown Shift</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <div className="text-lg font-bold text-gray-900">{row.total}</div>
                <div className="text-[10px] text-gray-500 uppercase">Total</div>
              </div>
            </div>

            {/* Issues Alert */}
            {hasIssue && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="text-amber-700 font-medium">Attention Required: </span>
                  <span className="text-gray-700">
                    {row.unknown_batch > 0 && `${row.unknown_batch} passenger(s) with unknown batch ID. `}
                    {row.unknown_shift > 0 && `${row.unknown_shift} passenger(s) scanned outside shift window.`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TripTable({ rows, loading }: TripTableProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? rows : rows.slice(0, 5);
  const hasMore = rows.length > 5;

  // Stats summary
  const totalPresent = rows.reduce((sum, r) => sum + r.present, 0);
  const totalUnknownBatch = rows.reduce((sum, r) => sum + r.unknown_batch, 0);
  const totalUnknownShift = rows.reduce((sum, r) => sum + r.unknown_shift, 0);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {/* Header with Summary */}
      <div className="px-4 py-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-900">Headcount Summary</h3>
          </div>
          <span className="text-xs text-gray-500">{rows.length} rows</span>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">{totalPresent}</span>
            <span className="text-xs text-gray-500">total</span>
          </div>
          {totalUnknownBatch > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-600 font-medium text-sm">{totalUnknownBatch}</span>
            </div>
          )}
          {totalUnknownShift > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-red-600" />
              <span className="text-red-600 font-medium text-sm">{totalUnknownShift}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="px-4 py-2 bg-emerald-50/30 border-b border-emerald-100/50">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          Click on a row to see details
        </p>
      </div>

      {/* Scrollable Content */}
      <div className={`flex-1 overflow-y-auto ${showAll ? 'max-h-[500px]' : ''}`}>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No data found</p>
          </div>
        ) : (
          <div className="divide-y divide-emerald-100/50">
            {visibleRows.map((row, index) => (
              <RowCard key={`${row.date}-${row.bus_id}-${row.shift}-${index}`} row={row} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-4 py-2.5 flex items-center justify-center gap-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors border-t border-emerald-100"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show All ({rows.length - 5} more)
            </>
          )}
        </button>
      )}
    </Card>
  );
}
