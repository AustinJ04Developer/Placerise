import React, { useState } from 'react';
import { FileText, Download, Printer, Table, Users, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../app/context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { role, user } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);

  const userDeptId =
    user?.departmentId && typeof user.departmentId === 'object'
      ? (user.departmentId as any)._id
      : (user?.departmentId as string) || '';

  const userDeptCode =
    user?.departmentId && typeof user.departmentId === 'object'
      ? (user.departmentId as any).code
      : 'Department';

  const handleDownloadClassMatrix = async () => {
    setDownloading('matrix');
    try {
      const params: any = { yearOfStudy: 4 };
      if (role === 'hod' && userDeptId) params.departmentId = userDeptId;
      const res = await api.get('/academics/sections', { params });
      const sec = res.data.data[0];
      if (sec) {
        window.location.href = `/api/reports/class/${sec._id}/export`;
      }
    } catch (err) {
      alert('Export failed');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const handleDownloadAbsentees = async () => {
    setDownloading('absentees');
    try {
      const params: any = {};
      if (role === 'hod' && userDeptId) params.departmentId = userDeptId;
      const res = await api.get('/training/programs', { params });
      const prog = res.data.data[0];
      if (prog) {
        window.location.href = `/api/reports/training/${prog._id}/absentees/export`;
      }
    } catch (err) {
      alert('Export failed');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const handlePrintStudentReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {role === 'hod' ? `${userDeptCode} Department Reports & Data Export` : 'Placement Cell Reports & Data Export'}
          </h1>
          {role === 'hod' && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              Department Scoped
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {role === 'hod'
            ? `Export ${userDeptCode} cohort training completion matrices, attendance rosters, and gap analysis spreadsheets.`
            : 'Export full cohort training completion matrices, attendance rosters, and gap analysis spreadsheets.'}
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Table className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {role === 'hod' ? `${userDeptCode} Class Training Matrix CSV` : 'Class Training Matrix CSV'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {role === 'hod'
                ? `Complete training matrix for ${userDeptCode} department students against training programs across all academic years.`
                : 'Complete training matrix of enrolled students against all training programs across academic years.'}
            </p>
          </div>
          <button
            onClick={handleDownloadClassMatrix}
            disabled={downloading === 'matrix'}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'matrix' ? 'Downloading...' : 'Download Matrix CSV'}</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Training Absentees &amp; Gaps Roster
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Extract non-attendees and students who failed to achieve the 75% attendance threshold for remedial scheduling.
            </p>
          </div>
          <button
            onClick={handleDownloadAbsentees}
            disabled={downloading === 'absentees'}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'absentees' ? 'Downloading...' : 'Download Gaps CSV'}</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Placement Dossier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Print-friendly placement readiness summary including 4-year attendance rates, assessment grades, and certifications.
            </p>
          </div>
          <button
            onClick={handlePrintStudentReport}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
