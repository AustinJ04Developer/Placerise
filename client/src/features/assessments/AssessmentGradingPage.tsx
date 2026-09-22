import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { api } from '../../services/api';
import { TrainingProgram } from '../../types';

export const AssessmentGradingPage: React.FC = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');

  const [assessmentMeta, setAssessmentMeta] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get('/training/programs');
        if (res.data.success && res.data.data.length > 0) {
          setPrograms(res.data.data);
          const defaultProg = res.data.data.find((p: any) => p.code === 'TR-Y4-ADJAVA') || res.data.data[0];
          setSelectedProgramId(defaultProg._id);
        }
      } catch (err) {
        console.error('Failed to load programs', err);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!selectedProgramId) return;

    const fetchAssessments = async () => {
      try {
        const res = await api.get(`/assessments/program/${selectedProgramId}`);
        if (res.data.success) {
          setAssessments(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedAssessmentId(res.data.data[0]._id);
          } else {
            setSelectedAssessmentId('');
            setRoster([]);
          }
        }
      } catch (err) {
        console.error('Failed to load assessments', err);
      }
    };
    fetchAssessments();
  }, [selectedProgramId]);

  useEffect(() => {
    if (!selectedAssessmentId) return;

    const fetchRoster = async () => {
      setLoading(true);
      setMessage('');
      try {
        const res = await api.get(`/assessments/${selectedAssessmentId}/roster`);
        if (res.data.success) {
          setAssessmentMeta(res.data.data.assessment);
          setRoster(res.data.data.roster);
        }
      } catch (err) {
        console.error('Failed to load assessment roster', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, [selectedAssessmentId]);

  const updateScore = (studentId: string, marks: number) => {
    const maxMarks = assessmentMeta?.maxMarks || 100;
    const passingMarks = assessmentMeta?.passingMarks || 50;
    const clampedMarks = Math.max(0, Math.min(maxMarks, marks));
    const percentage = Math.round((clampedMarks / maxMarks) * 100);

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';

    const status = clampedMarks >= passingMarks ? 'Passed' : 'Failed';

    setRoster((prev) =>
      prev.map((item) =>
        item.studentId === studentId
          ? {
              ...item,
              marksObtained: clampedMarks,
              percentage,
              grade,
              status,
              isGraded: true,
            }
          : item
      )
    );
  };

  const handleSaveGrades = async () => {
    if (!selectedAssessmentId || roster.length === 0) return;
    setSaving(true);
    setMessage('');

    try {
      const results = roster.map((r) => ({
        studentId: r.studentId,
        marksObtained: Number(r.marksObtained) || 0,
        remarks: r.remarks,
      }));

      const res = await api.post(`/assessments/${selectedAssessmentId}/bulk-results`, { results });
      if (res.data.success) {
        setMessage('Assessment scores and grades saved successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assessment Score Entry
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Automated Grade Calculator
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bulk marks input sheet with real-time pass/fail evaluation, percentage and grade calculation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveGrades}
            disabled={saving || roster.length === 0}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Submit Grades'}</span>
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
            1. Select Training Program
          </label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} ({p.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
            2. Select Assessment
          </label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {assessments.length === 0 ? (
              <option value="">No assessments found for this program</option>
            ) : (
              assessments.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title} (Max: {a.maxMarks}, Passing: {a.passingMarks})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {message && (
        <div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading assessment roster...</p>
          </div>
        ) : roster.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold">No students to grade for this assessment</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-16 text-center">Roll</th>
                  <th className="p-3">Register Number</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 w-32">Marks Obtained (/{assessmentMeta?.maxMarks || 100})</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {roster.map((st) => (
                  <tr
                    key={st.studentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                      {st.rollNumber}
                    </td>
                    <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {st.registerNumber}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        max={assessmentMeta?.maxMarks || 100}
                        value={st.marksObtained ?? 0}
                        onChange={(e) => updateScore(st.studentId, Number(e.target.value))}
                        className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {st.grade}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.status === 'Passed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={st.remarks || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRoster((prev) =>
                            prev.map((item) =>
                              item.studentId === st.studentId ? { ...item, remarks: val } : item
                            )
                          );
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
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
