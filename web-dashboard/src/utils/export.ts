// web-dashboard/src/utils/export.ts

import { PlantGroup } from './plants';

type ExportData = {
  plants: PlantGroup[];
  totalBusPresent: number;
  totalBusCapacity: number;
  totalPresent: number;
  totalRoster: number;
  dateFrom: string;
  dateTo: string;
};

/**
 * Export analytics data to CSV
 */
export function exportToCSV(data: ExportData): void {
  const rows: string[][] = [];

  // Header
  rows.push([
    'Plant',
    'Bus ID',
    'Route',
    'Bus Present',
    'Bus Capacity',
    'Utilization %',
    'Total Present',
    'Total Roster',
    'Attendance Rate %',
    'Status',
  ]);

  // Data rows
  data.plants.forEach((plant) => {
    plant.buses.forEach((bus) => {
      const utilization = bus.bus_capacity > 0
        ? ((bus.bus_present / bus.bus_capacity) * 100).toFixed(1)
        : '0';
      const attendanceRate = bus.total_roster > 0
        ? ((bus.total_present / bus.total_roster) * 100).toFixed(1)
        : '0';

      let status = 'Good';
      const util = parseFloat(utilization);
      if (util < 30) status = 'Critical';
      else if (util < 70) status = 'Warning';

      rows.push([
        plant.plant,
        bus.bus_id,
        bus.route || '',
        bus.bus_present.toString(),
        bus.bus_capacity.toString(),
        utilization,
        bus.total_present.toString(),
        bus.total_roster.toString(),
        attendanceRate,
        status,
      ]);
    });
  });

  // Summary row
  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['Date Range', `${data.dateFrom} to ${data.dateTo}`]);
  rows.push(['Total Bus Present', data.totalBusPresent.toString()]);
  rows.push(['Total Bus Capacity', data.totalBusCapacity.toString()]);
  rows.push([
    'Overall Utilization %',
    data.totalBusCapacity > 0
      ? ((data.totalBusPresent / data.totalBusCapacity) * 100).toFixed(1)
      : '0.0'
  ]);
  rows.push(['Total Present', data.totalPresent.toString()]);
  rows.push(['Total Roster', data.totalRoster.toString()]);
  rows.push([
    'Overall Attendance Rate %',
    data.totalRoster > 0
      ? ((data.totalPresent / data.totalRoster) * 100).toFixed(1)
      : '0.0'
  ]);

  // Convert to CSV string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bus-analytics-${data.dateFrom}-to-${data.dateTo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export optimization suggestions to CSV
 */
export function exportOptimizationToCSV(
  consolidations: { route: string; plant: string; buses: string[]; removable: number }[],
  fleetReduction: { plant: string; current: number; optimal: number; removable: number }[],
  dateRange: string
): void {
  const rows: string[][] = [];

  // Consolidation suggestions
  rows.push(['CONSOLIDATION OPPORTUNITIES']);
  rows.push(['Route', 'Plant', 'Buses to Combine', 'Buses Removable']);
  consolidations.forEach((c) => {
    rows.push([c.route, c.plant, c.buses.join(' + '), c.removable.toString()]);
  });

  rows.push([]);

  // Fleet reduction
  rows.push(['FLEET REDUCTION SUMMARY']);
  rows.push(['Plant', 'Current Buses', 'Optimal Buses', 'Can Remove']);
  fleetReduction.forEach((f) => {
    rows.push([f.plant, f.current.toString(), f.optimal.toString(), f.removable.toString()]);
  });

  // Total
  const totalRemovable = fleetReduction.reduce((acc, f) => acc + f.removable, 0);
  rows.push(['TOTAL', '', '', totalRemovable.toString()]);

  // Convert to CSV string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `optimization-report-${dateRange}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export dashboard to PDF using browser print
 */
export function exportToPDF(): void {
  // Add print-specific styles
  const style = document.createElement('style');
  style.id = 'print-styles';
  style.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      main, main * {
        visibility: visible;
      }
      main {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
      }
      header, aside, .no-print, button {
        display: none !important;
      }
      .bg-white {
        box-shadow: none !important;
        border: 1px solid #e2e8f0 !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        margin-bottom: 1cm !important;
      }
      @page {
        size: A4 landscape;
        margin: 1cm;
      }
    }
  `;
  document.head.appendChild(style);

  // Trigger print dialog
  window.print();

  // Remove print styles after a short delay
  setTimeout(() => {
    const printStyle = document.getElementById('print-styles');
    if (printStyle) {
      printStyle.remove();
    }
  }, 1000);
}
