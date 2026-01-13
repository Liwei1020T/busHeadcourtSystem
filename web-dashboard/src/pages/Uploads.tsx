import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { uploadAttendance, uploadMasterList } from '../api';
import type { AttendanceUploadResponse, MasterListUploadResponse, UploadRowError } from '../types';
import { FileSpreadsheet, UploadCloud, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function formatError(err: UploadRowError) {
  const idPart = err.personid ? `PersonId ${err.personid}` : 'Unknown PersonId';
  return `Row ${err.row_number}: ${idPart} — ${err.message}`;
}

export default function Uploads() {
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);

  const [uploadingMaster, setUploadingMaster] = useState(false);
  const [uploadingAttendance, setUploadingAttendance] = useState(false);

  const [masterResult, setMasterResult] = useState<MasterListUploadResponse | null>(null);
  const [attendanceResult, setAttendanceResult] = useState<AttendanceUploadResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  const masterErrorPreview = useMemo(() => (masterResult?.row_errors || []).slice(0, 20), [masterResult]);
  const attendanceErrorPreview = useMemo(() => (attendanceResult?.row_errors || []).slice(0, 20), [attendanceResult]);

  const onUploadMaster = async () => {
    setError(null);
    setMasterResult(null);

    if (!masterFile) {
      setError('Please select a master list .xlsx file first.');
      return;
    }

    setUploadingMaster(true);
    const toastId = toast.loading('Uploading master list...');

    try {
      const result = await uploadMasterList(masterFile);
      setMasterResult(result);
      toast.success('Master list uploaded', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload master list';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setUploadingMaster(false);
    }
  };

  const onUploadAttendance = async () => {
    setError(null);
    setAttendanceResult(null);

    if (!attendanceFile) {
      setError('Please select an attendance .xlsx file first.');
      return;
    }

    setUploadingAttendance(true);
    const toastId = toast.loading('Uploading attendance...');

    try {
      const result = await uploadAttendance(attendanceFile);
      setAttendanceResult(result);
      toast.success('Attendance uploaded', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload attendance';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setUploadingAttendance(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uploads"
        subtitle="Upload the employee master list and manual attendance Excel files."
        badge="Admin"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Employee Master List</h2>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Expected columns include <span className="font-medium">PersonId</span>, <span className="font-medium">Name</span>, <span className="font-medium">Route</span>, and optionally <span className="font-medium">Transport</span>.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setMasterFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <Button onClick={onUploadMaster} disabled={uploadingMaster} className="w-full">
              <UploadCloud className="w-4 h-4 mr-2" />
              {uploadingMaster ? 'Uploading...' : 'Upload Master List'}
            </Button>
          </div>

          {masterResult && (
            <div className="mt-5 space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold">Upload complete</div>
                  <div className="text-emerald-700">
                    Rows: {masterResult.processed_rows} · Employees: {masterResult.employees_upserted} · Buses: {masterResult.buses_upserted} · Vans: {masterResult.vans_upserted}
                  </div>
                  {typeof masterResult.unassigned_rows === 'number' && masterResult.unassigned_rows > 0 && (
                    <div className="text-emerald-700">
                      Unassigned (no bus code): {masterResult.unassigned_rows}
                    </div>
                  )}
                  {(masterResult.skipped_missing_personid || masterResult.skipped_missing_name) ? (
                    <div className="text-emerald-700">
                      No PersonId: {masterResult.skipped_missing_personid || 0} · No Name (not linked to employees): {masterResult.skipped_missing_name || 0}
                    </div>
                  ) : null}
                  {masterResult.selected_sheet && (
                    <div className="text-emerald-700">
                      Sheet: {masterResult.selected_sheet}
                      {masterResult.header_row_number ? ` (header row ${masterResult.header_row_number})` : ''}
                    </div>
                  )}
                </div>
              </div>

              {masterResult.row_errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {masterResult.row_errors.length} row errors (showing first {masterErrorPreview.length})
                  </div>
                  <ul className="mt-2 space-y-1 list-disc pl-5">
                    {masterErrorPreview.map((e, idx) => (
                      <li key={`${e.row_number}-${idx}`}>{formatError(e)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50">
                  <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Manual Attendance</h2>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Attendance file must include <span className="font-medium">PersonId</span> and a date column (for example <span className="font-medium">Date</span>).
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setAttendanceFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />

            <Button onClick={onUploadAttendance} disabled={uploadingAttendance} className="w-full">
              <UploadCloud className="w-4 h-4 mr-2" />
              {uploadingAttendance ? 'Uploading...' : 'Upload Attendance'}
            </Button>
          </div>

          {attendanceResult && (
            <div className="mt-5 space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold">Upload complete</div>
                  <div className="text-emerald-700">
                    Rows: {attendanceResult.processed_rows} · Inserted: {attendanceResult.attendance_inserted} · Duplicates: {attendanceResult.duplicates_ignored} · Unknown: {attendanceResult.unknown_personids}
                  </div>
                  {(attendanceResult.skipped_no_timein || attendanceResult.skipped_missing_date) ? (
                    <div className="text-emerald-700">
                      Skipped: {attendanceResult.skipped_no_timein || 0} no TimeIn · {attendanceResult.skipped_missing_date || 0} no date
                    </div>
                  ) : null}
                  {attendanceResult.selected_sheet && (
                    <div className="text-emerald-700">
                      Sheet: {attendanceResult.selected_sheet}
                      {attendanceResult.header_row_number ? ` (header row ${attendanceResult.header_row_number})` : ''}
                    </div>
                  )}
                </div>
              </div>

              {attendanceResult.row_errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {attendanceResult.row_errors.length} row errors (showing first {attendanceErrorPreview.length})
                  </div>
                  <ul className="mt-2 space-y-1 list-disc pl-5">
                    {attendanceErrorPreview.map((e, idx) => (
                      <li key={`${e.row_number}-${idx}`}>{formatError(e)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5 border border-amber-200 bg-gradient-to-br from-amber-50/80 to-white">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-900">
            <div className="font-semibold">Notes</div>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Bus IDs must be short codes (max 4 alphanumeric characters) to satisfy current backend constraints.</li>
              <li>Current default mapping is Route → bus_id and Transport → van_code. If your files use a different mapping, tell me and I will adjust.</li>
              <li>Unknown PersonId rows are kept as <span className="font-medium">unknown_batch</span> records for audit.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
