import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Search, Calendar } from 'lucide-react';

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
        <div className="p-4 rounded-full bg-gray-100">
          <Icon className="w-12 h-12 text-gray-400" />
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
            variant="outline"
            className="mt-4"
          >
            {actionLabel}
          </Button>
        )}

        {/* Helpful tips */}
        <div className="mt-6 pt-6 border-t border-gray-200 w-full max-w-md">
          <p className="text-xs font-medium text-gray-700 mb-2">Try the following:</p>
          <ul className="text-xs text-gray-500 space-y-1 text-left">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Use the quick date buttons (Today, Last 7 Days, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Remove shift or bus filters to see all data</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Expand your date range to include more records</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
