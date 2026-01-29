import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Search, Calendar, RefreshCw, Filter, CalendarDays } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'database' | 'search' | 'calendar';
  actionLabel?: string;
  onAction?: () => void;
}

const ICONS = {
  database: Database,
  search: Search,
  calendar: Calendar,
};

export default function EmptyState({
  title = 'No data found',
  description = 'Try adjusting your filters or selecting a different date range',
  icon = 'database',
  actionLabel = 'Reset Filters',
  onAction,
}: EmptyStateProps) {
  const Icon = ICONS[icon];

  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {/* Icon */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
          <Icon className="w-12 h-12 text-emerald-500" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 max-w-md">
          {description}
        </p>

        {/* Action Button */}
        {onAction && (
          <Button
            onClick={onAction}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        )}

        {/* Helpful tips */}
        <div className="mt-6 pt-6 border-t border-gray-200 w-full max-w-md">
          <p className="text-xs font-medium text-gray-700 mb-3">💡 Suggestions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
              <CalendarDays className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs text-gray-600">Try quick date buttons</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50/50 border border-teal-100/50">
              <Filter className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="text-xs text-gray-600">Remove some filters</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
              <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs text-gray-600">Expand date range</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
