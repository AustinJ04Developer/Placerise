import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid3X3,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { ClassMatrixData } from '../../types';
import { useAuth } from '../../app/context/AuthContext';

export const ClassMatrixPage: React.FC = () => {
  const { role, user } = useAuth();
  const [matrixData, setMatrixData] = useState<ClassMatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'risk' | 'complete'>('all');
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const navigate = useNavigate();

  // Find department sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const userDeptId =
          user?.departmentId && typeof user.departmentId === 'object'
            ? (user.departmentId as any)._id
            : (user?.departmentId as string) || undefined;

        const res = await api.get('/academics/sections', {
          params: userDeptId ? { departmentId: userDeptId } : { yearOfStudy: 4 },
        });
        if (res.data.success && res.data.data.length > 0) {
          setAvailableSections(res.data.data);
          const defaultSec = res.data.data[0];
          setActiveSectionId(defaultSec._id);
        }
      } catch (err) {
        console.error('Failed to load sections', err);
      }
    };
    fetchSections();
  }, [user]);

  // Fetch matrix for IV CSE A
  useEffect(() => {
    if (!activeSectionId) return;

    const fetchMatrix = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/students/matrix/${activeSectionId}`);
        if (res.data.success) {
          setMatrixData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load matrix', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, [activeSectionId]);

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Generating 50-student class historical training matrix...
        </p>
      </div>
    );
  }

  if (!matrixData) {
    return (
      <div className="p-16 text-center">
        <p className="text-sm font-semibold">Matrix data not available.</p>
      </div>
    );
  }

  const { programs, matrix, totalStudents } = matrixData;

  const filteredMatrix = matrix.filter((row) => {
    const matchesSearch =
      row.student.name.toLowerCase().includes(search.toLowerCase()) ||
      row.student.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
      row.student.rollNumber.includes(search);

    if (!matchesSearch) return false;
    if (filterMode === 'risk') return row.summary.hasHighRisk;
    if (filterMode === 'complete') return row.summary.completionPercentage === 100;
    return true;
  });

  const exportCSV = () => {
    window.location.href = `/api/reports/class/${activeSectionId}/export`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Class-Level Training Matrix
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {availableSections.find((s) => s._id === activeSectionId)?.displayName || 'Class Section'} • {totalStudents} Student{totalStudents === 1 ? '' : 's'}
            </span>
            {role === 'hod' && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Department Scoped
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical training performance matrix across all academic years. Quickly identify students who attended (✓), missed (✗), or have training gaps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {availableSections.length > 1 && (
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Section:</span>
              <select
                value={activeSectionId}
                onChange={(e) => setActiveSectionId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                {availableSections.map((sec) => (
                  <option key={sec._id} value={sec._id}>
                    {sec.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Matrix CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Filter:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Students ({totalStudents})
          </button>
          <button
            onClick={() => setFilterMode('risk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'risk'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Has Training Gaps (&lt;75%)
          </button>
          <button
            onClick={() => setFilterMode('complete')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'complete'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            100% Completed Only
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student / register no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* 50 x N Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800 z-30 min-w-[60px] text-center border-r border-slate-200 dark:border-slate-700">
                  Roll
                </th>
                <th className="p-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider sticky left-[60px] bg-slate-50 dark:bg-slate-800 z-30 min-w-[170px] border-r border-slate-200 dark:border-slate-700">
                  Student Name
                </th>
                {programs.map((prog) => (
                  <th
                    key={prog.id}
                    className="p-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[130px] text-center border-r border-slate-200/60 dark:border-slate-800/60"
                  >
                    <div className="truncate max-w-[120px] mx-auto font-bold" title={prog.title}>
                      {prog.title}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {prog.category}
                    </span>
                  </th>
                ))}
                <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-center min-w-[110px]">
                  Avg Attendance
                </th>
                <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-center min-w-[100px]">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredMatrix.map((row) => (
                <tr
                  key={row.student.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Sticky Roll No */}
                  <td className="p-3 font-mono font-bold text-center text-slate-600 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                    {row.student.rollNumber}
                  </td>
                  {/* Sticky Name + Register No */}
                  <td className="p-3 sticky left-[60px] bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => navigate(`/students/${row.student.id}/journey`)}
                      className="text-left font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 truncate block max-w-[160px]"
                    >
                      {row.student.name}
                    </button>
                    <span className="font-mono text-[10px] text-brand-600 dark:text-brand-400">
                      {row.student.registerNumber}
                    </span>
                  </td>

                  {/* Program Columns */}
                  {programs.map((prog) => {
                    const statusObj = row.programs[prog.id];
                    if (!statusObj || !statusObj.enrolled) {
                      return (
                        <td
                          key={prog.id}
                          className="p-3 text-center text-slate-300 dark:text-slate-700 border-r border-slate-200/40 dark:border-slate-800/40"
                        >
                          -
                        </td>
                      );
                    }

                    const isCompleted = statusObj.status === 'Completed';
                    const isGap = statusObj.hasGap;

                    return (
                      <td
                        key={prog.id}
                        className="p-2.5 text-center border-r border-slate-200/40 dark:border-slate-800/40"
                        title={`${prog.title}: ${statusObj.status} (${statusObj.attendancePercentage}% attendance)`}
                      >
                        {isCompleted ? (
                          <div className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200/60 dark:border-emerald-900/60">
                            <span>✓ {statusObj.attendancePercentage}%</span>
                          </div>
                        ) : isGap ? (
                          <div className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold text-[11px] border border-red-200/60 dark:border-red-900/60">
                            <span>✗ {statusObj.attendancePercentage}%</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200/60 dark:border-blue-900/60">
                            <span>⏳ Sched</span>
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Summary Average Attendance */}
                  <td className="p-3 text-center">
                    <span
                      className={`font-bold ${
                        row.summary.hasHighRisk ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {row.summary.averageAttendance}%
                    </span>
                  </td>

                  {/* Summary Completion */}
                  <td className="p-3 text-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {row.summary.completed}/{row.summary.totalAssigned}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
