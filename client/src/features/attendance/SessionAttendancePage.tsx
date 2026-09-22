import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckSquare,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  AlertCircle,
  Calendar,
  Filter,
  RotateCcw,
  Check,
  X,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Plus,
  CalendarPlus,
  CalendarDays,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { TrainingProgram, TrainingSession } from '../../types';

export const SessionAttendancePage: React.FC = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Session extension & auto-gen state
  const [addingSession, setAddingSession] = useState<boolean>(false);
  const [generatingSessions, setGeneratingSessions] = useState<boolean>(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState<boolean>(false);
  const [customSessionDate, setCustomSessionDate] = useState<string>('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');

  // Bulk remarks state
  const [bulkRemarkText, setBulkRemarkText] = useState<string>('');
  const [showRemarkInput, setShowRemarkInput] = useState<boolean>(false);

  // Load programs
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

  // Load sessions for program
  useEffect(() => {
    if (!selectedProgramId) return;

    const fetchSessions = async () => {
      try {
        const res = await api.get(`/training/programs/${selectedProgramId}/sessions`);
        if (res.data.success) {
          setSessions(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedSessionId(res.data.data[0]._id);
          } else {
            setSelectedSessionId('');
            setRoster([]);
            setSelectedIds(new Set());
          }
        }
      } catch (err) {
        console.error('Failed to load sessions', err);
      }
    };
    fetchSessions();
  }, [selectedProgramId]);

  // Load session roster
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchRoster = async () => {
      setLoading(true);
      setMessage('');
      setSelectedIds(new Set());
      setHasUnsavedChanges(false);
      try {
        const res = await api.get(`/attendance/session/${selectedSessionId}/roster`);
        if (res.data.success) {
          setRoster(res.data.data.roster);
        }
      } catch (err) {
        console.error('Failed to load roster', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, [selectedSessionId]);

  // Extract unique sections for filtering
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    roster.forEach((r) => {
      if (r.section) set.add(r.section);
    });
    return Array.from(set);
  }, [roster]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter((student) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.rollNumber?.toLowerCase().includes(query) ||
        student.registerNumber?.toLowerCase().includes(query);

      // Status match
      const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter;

      // Section match
      const matchesSection = sectionFilter === 'ALL' || student.section === sectionFilter;

      return matchesSearch && matchesStatus && matchesSection;
    });
  }, [roster, searchQuery, statusFilter, sectionFilter]);

  // Selection handlers
  const toggleSelectStudent = (studentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredRoster.length && filteredRoster.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRoster.map((s) => s.studentId)));
    }
  };

  const selectAll = () => {
    setSelectedIds(new Set(roster.map((s) => s.studentId)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const selectByStatus = (status: string) => {
    const matching = roster.filter((r) => r.status === status).map((r) => r.studentId);
    setSelectedIds(new Set(matching));
  };

  const invertSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      roster.forEach((r) => {
        if (!prev.has(r.studentId)) {
          next.add(r.studentId);
        }
      });
      return next;
    });
  };

  // Marking handlers
  const setSingleStudentStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
    setHasUnsavedChanges(true);
  };

  const markSelected = (status: 'Present' | 'Absent' | 'Late') => {
    if (selectedIds.size === 0) return;
    setRoster((prev) =>
      prev.map((item) =>
        selectedIds.has(item.studentId) ? { ...item, status } : item
      )
    );
    setHasUnsavedChanges(true);
    setMessage(`Marked ${selectedIds.size} student(s) as ${status}`);
  };

  const markAll = (status: string) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
    setHasUnsavedChanges(true);
    setMessage(`Marked all ${roster.length} students as ${status}`);
  };

  const applyBulkRemark = (remark: string) => {
    if (selectedIds.size === 0 || !remark.trim()) return;
    setRoster((prev) =>
      prev.map((item) =>
        selectedIds.has(item.studentId)
          ? { ...item, remarks: remark.trim() }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setBulkRemarkText('');
    setShowRemarkInput(false);
    setMessage(`Applied remark "${remark.trim()}" to ${selectedIds.size} selected student(s)`);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId || roster.length === 0) return;
    setSaving(true);
    setMessage('');

    try {
      const records = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks,
      }));

      const res = await api.post(`/attendance/session/${selectedSessionId}/bulk`, { records });
      if (res.data.success) {
        setHasUnsavedChanges(false);
        setMessage('Attendance successfully recorded and student metrics recomputed!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAddSession = async () => {
    if (!selectedProgramId) return;
    setAddingSession(true);
    try {
      const res = await api.post(`/training/programs/${selectedProgramId}/sessions/quick-add`);
      if (res.data.success) {
        setMessage('Extended training duration: added next attendance day session!');
        const sRes = await api.get(`/training/programs/${selectedProgramId}/sessions`);
        if (sRes.data.success) {
          setSessions(sRes.data.data);
          const added = sRes.data.data[sRes.data.data.length - 1];
          if (added) setSelectedSessionId(added._id);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setAddingSession(false);
    }
  };

  const handleAddCustomDateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId || !customSessionDate) return;
    setAddingSession(true);
    try {
      const res = await api.post(`/training/programs/${selectedProgramId}/sessions/quick-add`, {
        customDate: customSessionDate,
      });
      if (res.data.success) {
        setMessage(`Added session on ${new Date(customSessionDate).toLocaleDateString()}!`);
        setShowCustomDateModal(false);
        setCustomSessionDate('');
        const sRes = await api.get(`/training/programs/${selectedProgramId}/sessions`);
        if (sRes.data.success) {
          setSessions(sRes.data.data);
          const added =
            sRes.data.data.find(
              (s: any) => new Date(s.sessionDate).toISOString().split('T')[0] === customSessionDate
            ) || sRes.data.data[sRes.data.data.length - 1];
          if (added) setSelectedSessionId(added._id);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setAddingSession(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedProgramId || !selectedSessionId) return;
    if (!confirm('Are you sure you want to remove this session day?')) return;
    try {
      const res = await api.delete(
        `/training/programs/${selectedProgramId}/sessions/${selectedSessionId}`
      );
      if (res.data.success) {
        setMessage('Session day removed successfully.');
        const sRes = await api.get(`/training/programs/${selectedProgramId}/sessions`);
        if (sRes.data.success) {
          setSessions(sRes.data.data);
          if (sRes.data.data.length > 0) {
            setSelectedSessionId(sRes.data.data[0]._id);
          } else {
            setSelectedSessionId('');
            setRoster([]);
          }
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleAutoGenerateSessions = async () => {
    if (!selectedProgramId) return;
    setGeneratingSessions(true);
    try {
      const res = await api.post(`/training/programs/${selectedProgramId}/generate-sessions`, { dailyHours: 2 });
      if (res.data.success) {
        setMessage(`Auto-generated ${res.data.data.generatedCount || 0} attendance day sessions for this program!`);
        const sRes = await api.get(`/training/programs/${selectedProgramId}/sessions`);
        if (sRes.data.success) {
          setSessions(sRes.data.data);
          if (sRes.data.data.length > 0) setSelectedSessionId(sRes.data.data[0]._id);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setGeneratingSessions(false);
    }
  };

  // Stats
  const totalCount = roster.length;
  const presentCount = roster.filter((r) => r.status === 'Present').length;
  const lateCount = roster.filter((r) => r.status === 'Late').length;
  const absentCount = roster.filter((r) => r.status === 'Absent').length;
  const attendedPercentage = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  const isAllFilteredSelected =
    filteredRoster.length > 0 && filteredRoster.every((s) => selectedIds.has(s.studentId));
  const isSomeFilteredSelected =
    filteredRoster.some((s) => selectedIds.has(s.studentId)) && !isAllFilteredSelected;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20 shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Attendance Marker
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  Select & Bulk Marking
                </span>
                {hasUnsavedChanges && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Unsaved Changes</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-student selection facility, quick bulk marking, search filters, and automatic placement attendance recalculation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveAttendance}
            disabled={saving || roster.length === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/50 shadow-emerald-500/20'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            } disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Records...' : hasUnsavedChanges ? 'Save Changes Now' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            1. Select Training Program
          </label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          >
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} ({p.code}) — {typeof p.categoryId === 'object' && p.categoryId ? (p.categoryId as any).name : 'Program'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              2. Select Session / Attendance Day
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setCustomSessionDate(new Date().toISOString().split('T')[0]);
                  setShowCustomDateModal(true);
                }}
                disabled={!selectedProgramId || addingSession}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
                title="Add class session on a specific custom date"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>+ Custom Date</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleQuickAddSession}
                disabled={!selectedProgramId || addingSession}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-50 transition-colors"
                title="Add next scheduled class day according to calendar rules"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addingSession ? 'Adding Day...' : '+ Add Next Day'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            >
              {sessions.length === 0 ? (
                <option value="">No sessions configured yet</option>
              ) : (
                sessions.map((s) => {
                  const dt = new Date(s.sessionDate);
                  const isSun = dt.getDay() === 0;
                  const dateFormatted = dt.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  return (
                    <option key={s._id} value={s._id}>
                      {s.title} ({dateFormatted}{isSun ? ' • Sunday' : ''}) — {s.durationHours} hrs {s.isCompleted ? '✓ Marked' : '● Pending'}
                    </option>
                  );
                })
              )}
            </select>
            {selectedSessionId && (
              <button
                type="button"
                onClick={handleDeleteSession}
                className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-xs shrink-0"
                title="Delete or cancel this scheduled session day"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {sessions.length === 0 && (
            <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
              <span className="text-amber-800 dark:text-amber-300 font-medium">
                No attendance sessions configured yet.
              </span>
              <button
                type="button"
                onClick={handleAutoGenerateSessions}
                disabled={generatingSessions}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-xs disabled:opacity-50"
              >
                {generatingSessions ? 'Generating...' : 'Auto-Generate Days'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Enrolled</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalCount}</span>
            <span className="text-[10px] text-slate-400">Students</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{presentCount}</span>
            <span className="text-[10px] text-slate-400">({totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Late</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{lateCount}</span>
            <span className="text-[10px] text-slate-400">({totalCount > 0 ? Math.round((lateCount / totalCount) * 100) : 0}%)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Absent</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{absentCount}</span>
            <span className="text-[10px] text-slate-400">({totalCount > 0 ? Math.round((absentCount / totalCount) * 100) : 0}%)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Attended Ratio</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">{attendedPercentage}%</span>
            <span className="text-[10px] text-slate-400">Present + Late</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Roster Controls & Selection Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filter / Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll, reg no..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Statuses ({roster.length})</option>
              <option value="Present">Present Only ({presentCount})</option>
              <option value="Late">Late Only ({lateCount})</option>
              <option value="Absent">Absent Only ({absentCount})</option>
            </select>

            {/* Section Filter */}
            {availableSections.length > 1 && (
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || statusFilter !== 'ALL' || sectionFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSectionFilter('ALL');
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-brand-600 flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Whole-Roster Marking Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => markAll('Present')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Present</span>
            </button>
            <button
              onClick={() => markAll('Absent')}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors flex items-center space-x-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Mark All Absent</span>
            </button>
          </div>
        </div>

        {/* Selection Preset Facilities Bar */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              Select:
            </span>
            <button
              onClick={selectAll}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold hover:border-brand-500 text-slate-700 dark:text-slate-300 text-[11px]"
            >
              All ({roster.length})
            </button>
            <button
              onClick={() => selectByStatus('Present')}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-[11px]"
            >
              All Present ({presentCount})
            </button>
            <button
              onClick={() => selectByStatus('Absent')}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold hover:border-rose-500 text-rose-700 dark:text-rose-400 text-[11px]"
            >
              All Absent ({absentCount})
            </button>
            <button
              onClick={() => selectByStatus('Late')}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold hover:border-amber-500 text-amber-700 dark:text-amber-400 text-[11px]"
            >
              All Late ({lateCount})
            </button>
            <button
              onClick={invertSelection}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold hover:border-brand-500 text-slate-700 dark:text-slate-300 text-[11px]"
            >
              Invert
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={deselectAll}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold hover:border-slate-400 text-slate-500 text-[11px]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              Showing {filteredRoster.length} of {roster.length} students
            </span>
            {selectedIds.size > 0 && (
              <span className="font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px]">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        </div>

        {/* Floating/Sticky Selected Marking Action Bar */}
        {selectedIds.size > 0 && (
          <div className="p-3 bg-brand-50/90 dark:bg-brand-950/70 border-b border-brand-200 dark:border-brand-800/80 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-xs font-extrabold text-brand-900 dark:text-brand-200">
                <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>{selectedIds.size} student{selectedIds.size > 1 ? 's' : ''} selected:</span>
              </span>

              {/* Mark Selected Action Buttons */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => markSelected('Present')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Selected Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => markSelected('Absent')}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Mark Selected Absent</span>
                </button>
                <button
                  type="button"
                  onClick={() => markSelected('Late')}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mark Selected Late</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Batch Remarks Trigger / Input */}
              {!showRemarkInput ? (
                <button
                  type="button"
                  onClick={() => setShowRemarkInput(true)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                  <span>Add Remark to Selected</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 p-1 rounded-lg border border-brand-300 dark:border-brand-700 shadow-xs">
                  <input
                    type="text"
                    value={bulkRemarkText}
                    onChange={(e) => setBulkRemarkText(e.target.value)}
                    placeholder="e.g. OD: Placement Drive, Medical Leave..."
                    className="px-2 py-0.5 text-xs bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-56 font-medium"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applyBulkRemark(bulkRemarkText);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => applyBulkRemark(bulkRemarkText)}
                    className="px-2 py-0.5 bg-brand-600 hover:bg-brand-700 text-white rounded text-[11px] font-bold"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRemarkInput(false);
                      setBulkRemarkText('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={deselectAll}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">Loading session roster...</p>
          </div>
        ) : roster.length === 0 ? (
          <div className="p-16 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No students enrolled in this session</p>
            <p className="text-xs text-slate-400 mt-1">Please select another training program or session.</p>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No students match current search/filter</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSectionFilter('ALL');
              }}
              className="mt-2 text-xs font-bold text-brand-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[62vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="p-3 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomeFilteredSelected;
                      }}
                      onChange={handleSelectAllFiltered}
                      title="Select all filtered students"
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-16 text-center">Roll</th>
                  <th className="p-3">Register Number</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Section</th>
                  <th className="p-3 text-center w-52">Attendance Status (Direct Marking)</th>
                  <th className="p-3">Remarks / OD Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredRoster.map((student) => {
                  const isSelected = selectedIds.has(student.studentId);
                  const isPresent = student.status === 'Present';
                  const isLate = student.status === 'Late';
                  const isAbsent = student.status === 'Absent';

                  return (
                    <tr
                      key={student.studentId}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-brand-50/70 dark:bg-brand-950/30 border-l-4 border-l-brand-600 dark:border-l-brand-500'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(student.studentId)}
                          className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                        {student.rollNumber}
                      </td>

                      <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {student.registerNumber}
                      </td>

                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <span>{student.name}</span>
                          {student.isMarked && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Recorded
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-slate-500 font-medium">
                        {student.section}
                      </td>

                      {/* Direct 3-Option Marking Buttons */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => setSingleStudentStatus(student.studentId, 'Present')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Present</span>
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => setSingleStudentStatus(student.studentId, 'Late')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 ${
                              isLate
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>Late</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => setSingleStudentStatus(student.studentId, 'Absent')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>

                      {/* Remarks Field */}
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Optional remarks (e.g. OD, Medical)..."
                          value={student.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRoster((prev) =>
                              prev.map((item) =>
                                item.studentId === student.studentId
                                  ? { ...item, remarks: val }
                                  : item
                              )
                            );
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Date Session Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add Specific Class Day
                </h3>
              </div>
              <button
                onClick={() => setShowCustomDateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick a specific date to conduct a class session (e.g., makeup class or date outside standard schedule).
            </p>

            <form onSubmit={handleAddCustomDateSession} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Session Date
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const base = new Date();
                      const day = base.getDay();
                      const daysUntilSun = day === 0 ? 7 : 7 - day;
                      base.setDate(base.getDate() + daysUntilSun);
                      setCustomSessionDate(base.toISOString().split('T')[0]);
                    }}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    + Next Sunday
                  </button>
                </div>
                <input
                  type="date"
                  required
                  value={customSessionDate}
                  onChange={(e) => setCustomSessionDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomDateModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSession || !customSessionDate}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {addingSession ? 'Adding...' : 'Add Class Day'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
