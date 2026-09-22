import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, ChevronLeft, CheckCircle2, XCircle, ArrowRight, Award } from 'lucide-react';
import { api } from '../../services/api';
import { Student } from '../../types';

export const StudentComparePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/students', { params: { limit: 50 } });
        if (res.data.success) {
          setAllStudents(res.data.data);
          const initialIds = (location.state as any)?.studentIds || [
            res.data.data[0]?._id,
            res.data.data[1]?._id,
          ];
          setSelectedIds(initialIds.filter(Boolean));
        }
      } catch (err) {
        console.error('Failed to load students for compare', err);
      }
    };
    fetchStudents();
  }, [location.state]);

  useEffect(() => {
    if (selectedIds.length < 2) {
      setComparisons([]);
      return;
    }

    const runCompare = async () => {
      setLoading(true);
      try {
        const res = await api.post('/students/compare', { studentIds: selectedIds });
        if (res.data.success) {
          setComparisons(res.data.data);
        }
      } catch (err) {
        console.error('Comparison error', err);
      } finally {
        setLoading(false);
      }
    };

    runCompare();
  }, [selectedIds]);

  const addStudentToCompare = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeStudent = (id: string) => {
    setSelectedIds(selectedIds.filter((item) => item !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/academics/classes')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Class Roster</span>
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Factual Student Comparison
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Side-by-side factual metrics comparison for placement evaluation without arbitrary ratings.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Selected Students:</span>
          <div className="flex flex-wrap gap-2">
            {comparisons.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 text-xs font-semibold border border-brand-200 dark:border-brand-800"
              >
                <span>{c.name} ({c.registerNumber})</span>
                {selectedIds.length > 2 && (
                  <button
                    onClick={() => removeStudent(c.id)}
                    className="hover:text-red-500 ml-1 text-xs"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {selectedIds.length < 4 && (
          <div className="flex items-center space-x-2">
            <select
              onChange={(e) => {
                if (e.target.value) addStudentToCompare(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="" disabled>
                + Add student to compare...
              </option>
              {allStudents
                .filter((s) => !selectedIds.includes(s._id))
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.rollNumber}. {s.name} ({s.registerNumber})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <p className="text-xs text-slate-500 mt-2">Loading student metrics...</p>
        </div>
      ) : comparisons.length < 2 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-semibold">Select at least 2 students to compare</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparisons.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
            >
              {/* Student Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                  {item.registerNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Roll: {item.rollNumber} • IV CSE A
                </p>
              </div>

              {/* Factual Metrics */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Attendance Rate</span>
                  <span className={`font-bold text-sm ${item.stats.averageAttendance < 75 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {item.stats.averageAttendance}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Training Completion</span>
                  <span className="font-bold text-sm text-brand-600 dark:text-brand-400">
                    {item.stats.totalCompleted}/{item.stats.totalAssigned} ({item.stats.completionRate}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">CGPA</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.cgpa}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Active Backlogs</span>
                  <span className={`font-bold text-sm ${item.activeBacklogs > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {item.activeBacklogs}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Training Gaps Count</span>
                  <span className={`font-bold text-sm ${item.gaps.length > 0 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {item.gaps.length} Gaps
                  </span>
                </div>
              </div>

              {/* Gaps List */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Training Gaps
                </span>
                {item.gaps.length === 0 ? (
                  <span className="text-xs text-emerald-600 font-semibold">✓ None (All completed)</span>
                ) : (
                  <div className="space-y-1">
                    {item.gaps.map((g: string, i: number) => (
                      <span
                        key={i}
                        className="block text-[11px] text-amber-700 dark:text-amber-300 truncate"
                      >
                        ✗ {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => navigate(`/students/${item.id}/journey`)}
                className="w-full py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1"
              >
                <span>View Full 4-Yr History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
