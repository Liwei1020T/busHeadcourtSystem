import { HeadcountRow } from '../types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SHIFT_COLORS, TYPOGRAPHY } from '@/lib/design-system/tokens';
import { AlertTriangle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type TripTableProps = {
  rows: HeadcountRow[];
  loading: boolean;
};

function ShiftBadge({ shift }: { shift: string }) {
  const isMorning = shift === 'morning';
  const isNight = shift === 'night';
  const label = shift === 'unknown' ? 'Unknown' : isMorning ? 'Morning' : 'Night';
  
  return (
    <Badge 
      variant={isMorning ? 'default' : isNight ? 'secondary' : 'outline'}
      className={shift === 'unknown' ? SHIFT_COLORS.unknown.badge : ''}
    >
      {label}
    </Badge>
  );
}

export default function TripTable({ rows, loading }: TripTableProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className={TYPOGRAPHY.sectionTitle}>Headcount by Bus/Shift</h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bus ID</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Unknown Batch</TableHead>
              <TableHead>Unknown Shift</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No data found. Adjust filters and search again.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const hasUnknownBatch = row.unknown_batch > 0;
                const hasUnknownShift = row.unknown_shift > 0;
                const hasAnyAnomaly = hasUnknownBatch || hasUnknownShift;
                
                return (
                  <TableRow 
                    key={`${row.date}-${row.bus_id}-${row.shift}-${index}`}
                    className={`
                      transition-colors
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      hover:bg-blue-50
                      ${hasUnknownBatch && hasUnknownShift ? 'border-l-4 border-orange-500 bg-orange-50' : ''}
                      ${hasUnknownBatch && !hasUnknownShift ? 'border-l-4 border-yellow-500 bg-yellow-50' : ''}
                      ${hasUnknownShift && !hasUnknownBatch ? 'border-l-4 border-red-500 bg-red-50' : ''}
                    `}
                  >
                    <TableCell className="font-medium py-3">
                      {format(parseISO(row.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="py-3">{row.bus_id}</TableCell>
                    <TableCell className="py-3">{row.route || '-'}</TableCell>
                    <TableCell className="py-3">
                      <ShiftBadge shift={row.shift} />
                    </TableCell>
                    <TableCell className="font-medium py-3 text-right">{row.present}</TableCell>
                    <TableCell className="py-3 text-right">
                      {hasUnknownBatch ? (
                        <span className="inline-flex items-center gap-1 text-yellow-700">
                          <AlertTriangle className="w-4 h-4" />
                          {row.unknown_batch}
                        </span>
                      ) : (
                        <span className="text-gray-500">{row.unknown_batch}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {hasUnknownShift ? (
                        <span className="inline-flex items-center gap-1 text-red-700">
                          <Clock className="w-4 h-4" />
                          {row.unknown_shift}
                        </span>
                      ) : (
                        <span className="text-gray-500">{row.unknown_shift}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium py-3 text-right">{row.total}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
