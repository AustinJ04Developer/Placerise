import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserX,
  Users,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { TrainingProgram, ParticipationStatusResponse } from '../../types';

export const ReverseQueryPage: React.FC = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [statusData, setStatusData] = useState<ParticipationStatusResponse | null>(null);
  const [activeCohort, setActiveCohort] = useState<'absent' | 'attended' | 'pending' | 'assigned'>('absent');
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const navigate = useNavigate();

  // Load programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get('/training/programs');
        if (res.data.success) {
          setPrograms(res.data.data);
          // Default to Mock Interview or first program
          const defaultProg =
            res.data.data.find((p: any) => p.code === 'TR-Y3-MOCK') ||
            res.data.data.find((p: any) => p.code === 'TR-Y2-SQL') ||
            res.data.data[0];
          if (defaultProg) setSelectedProgramId(defaultProg._id);
        }
      } catch (err) {
        console.error('Failed to load programs', err);
      }
    };
    fetchPrograms();
  }, []);

  // Fetch participation status
  useEffect(() => {
    if (!selectedProgramId) return;

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/training/programs/${selectedProgramId}/participation-status`);
        if (res.data.success) {
          setStatusData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to execute reverse query', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [selectedProgramId]);

  const currentList = statusData?.cohorts[activeCohort] || [];
  const filteredStudents = currentList.filter(
    (st: any) =>
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
      st.rollNumber.includes(search)
  );

  const exportCSV = () => {
    if (!selectedProgramId) return;
    window.location.href = `/api/reports/training/${selectedProgramId}/absentees/export`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reverse Training Query
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Absentees &amp; Gaps Identification
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Answers the critical question: <strong className="text-slate-700 dark:text-slate-200">"Who has NOT attended this training?"</strong> Select any training program to immediately see non-attendees.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Absentees CSV</span>
          </button>
        </div>
      </div>

      {/* Program Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
            Select Training Program:
          </label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="w-full sm:w-80 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} ({p.code})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Attendance Threshold: <strong className="text-brand-600 dark:text-brand-400">&ge; {statusData?.program.threshold ?? 75}%</strong>
        </div>
      </div>

      {/* Metric Breakdown Cards (Clicking switches cohorts) */}
      {statusData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Assigned */}
          <button
            onClick={() => setActiveCohort('assigned')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeCohort === 'assigned'
                ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assigned
              </span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              {statusData.metrics.assignedCount}
            </p>
            <span className="text-[11px] text-slate-400">Total Enrolled</span>
          </button>

          {/* Attended */}
          <button
            onClick={() => setActiveCohort('attended')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeCohort === 'attended'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Attended (Met &ge;{statusData.program.threshold}%)
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {statusData.metrics.attendedCount}
            </p>
            <span className="text-[11px] text-slate-400">Satisfied Requirement</span>
          </button>

          {/* Absent / Gaps */}
          <button
            onClick={() => setActiveCohort('absent')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeCohort === 'absent'
                ? 'bg-red-50/50 dark:bg-red-950/30 border-red-500 shadow-md ring-2 ring-red-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                Absent / Gaps (&lt;{statusData.program.threshold}%)
              </span>
              <UserX className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2">
              {statusData.metrics.absentCount}
            </p>
            <span className="text-[11px] text-red-500 font-semibold">Click to inspect students</span>
          </button>

          {/* Pending */}
          <button
            onClick={() => setActiveCohort('pending')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeCohort === 'pending'
                ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                Pending / Upcoming
              </span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
              {statusData.metrics.pendingCount}
            </p>
            <span className="text-[11px] text-slate-400">Sessions Scheduled</span>
          </button>
        </div>
      )}

      {/* Cohort Student Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {activeCohort} Students ({filteredStudents.length})
            </h2>
            <span className="text-xs text-slate-400">for {statusData?.program.title}</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name / register..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No students in the {activeCohort} cohort!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Roll No</th>
                  <th className="p-3.5">Register Number</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Section</th>
                  <th className="p-3.5">Attendance %</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredStudents.map((st: any) => (
                  <tr
                    key={st.studentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {st.rollNumber}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {st.registerNumber}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">
                      {st.email}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {st.department}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {st.section}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-bold ${
                          st.attendancePercentage < (statusData?.program.threshold || 75)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {st.attendancePercentage}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.attendancePercentage >= (statusData?.program.threshold || 75)
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                        }`}
                      >
                        {st.attendancePercentage >= (statusData?.program.threshold || 75)
                          ? '✓ Attended'
                          : '✗ Absent / Gap'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => navigate(`/students/${st.studentId}/journey`)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-semibold rounded-lg text-xs transition-all"
                      >
                        <span>History</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
