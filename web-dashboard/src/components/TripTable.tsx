import { HeadcountRow } from '../types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SHIFT_COLORS, TYPOGRAPHY } from '@/lib/design-system/tokens';

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
              rows.map((row, index) => (
                <TableRow key={`${row.date}-${row.bus_id}-${row.shift}-${index}`}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell>{row.bus_id}</TableCell>
                  <TableCell>{row.route || '-'}</TableCell>
                  <TableCell>
                    <ShiftBadge shift={row.shift} />
                  </TableCell>
                  <TableCell className="font-medium">{row.present}</TableCell>
                  <TableCell>{row.unknown_batch}</TableCell>
                  <TableCell>{row.unknown_shift}</TableCell>
                  <TableCell className="font-medium">{row.total}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
