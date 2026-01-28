import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI card skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-24 bg-gray-200" />
                <Skeleton className="h-8 w-16 bg-gray-300" />
                <Skeleton className="h-3 w-32 bg-gray-200" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full bg-gray-200" />
            </div>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4 bg-gray-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 flex-1 bg-gray-200" />
              <Skeleton className="h-4 flex-1 bg-gray-200" />
              <Skeleton className="h-4 flex-1 bg-gray-200" />
              <Skeleton className="h-4 flex-1 bg-gray-200" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
