import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Building,
  Users,
  BarChart3,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  School,
  Lock,
  UserCheck,
  UserX,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';

export const AdminPanelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'keys' | 'institution' | 'users' | 'departments'>('keys');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Authorization Keys state
  const [keys, setKeys] = useState<{
    placementOfficerKey: string;
    hodKey: string;
    classInchargeKey: string;
    facultyKey: string;
    lastUpdatedOfficer: string | null;
    lastUpdatedHod: string | null;
    lastUpdatedIncharge: string | null;
    lastUpdatedFaculty: string | null;
  }>({
    placementOfficerKey: '',
    hodKey: '',
    classInchargeKey: '',
    facultyKey: '',
    lastUpdatedOfficer: null,
    lastUpdatedHod: null,
    lastUpdatedIncharge: null,
    lastUpdatedFaculty: null,
  });

  const [visibleKeys, setVisibleKeys] = useState<{ [role: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Institutional Settings state
  const [institution, setInstitution] = useState({
    collegeName: '',
    collegeCode: '',
    accreditation: '',
    placementHeadName: '',
    placementEmail: '',
    placementPhone: '',
    minAttendanceBenchmark: 75,
    placementReadinessBenchmark: 70,
    activeAcademicYear: '2025-2026',
  });

  // User Governance state
  const [users, setUsers] = useState<any[]>([]);
  const [userCounts, setUserCounts] = useState<any>({});
  const [userFilter, setUserFilter] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');

  // Department Stats
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [settingsRes, statsRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/stats'),
      ]);

      if (settingsRes.data.success) {
        setKeys(settingsRes.data.data.keys);
        setInstitution(settingsRes.data.data.institution);
      }
      if (statsRes.data.success) {
        setDeptStats(statsRes.data.data.departmentBreakdown);
        setTotals(statsRes.data.data.totals);
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load administrative settings');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users', {
        params: { role: userFilter || undefined, search: userSearch || undefined },
      });
      if (res.data.success) {
        setUsers(res.data.data.users);
        setUserCounts(res.data.data.counts);
      }
    } catch (err: any) {
      showFeedback('error', 'Failed to load user directory');
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, userFilter, userSearch]);

  const handleCopyKey = (keyVal: string, keyName: string) => {
    navigator.clipboard.writeText(keyVal);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleVisibility = (roleKey: string) => {
    setVisibleKeys((prev) => ({ ...prev, [roleKey]: !prev[roleKey] }));
  };

  const handleRotateKey = async (role: string) => {
    if (!confirm(`Are you sure you want to rotate the authorization key for ${role.replace('_', ' ')}? Previous keys will become invalid for new registrations.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/admin/keys/rotate', { role });
      if (res.data.success) {
        showFeedback('success', `Rotated key for ${role}: ${res.data.data.newKey}`);
        await loadAllData();
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to rotate key');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.put('/admin/keys', {
        placementOfficerKey: keys.placementOfficerKey,
        hodKey: keys.hodKey,
        classInchargeKey: keys.classInchargeKey,
        facultyKey: keys.facultyKey,
      });
      if (res.data.success) {
        showFeedback('success', 'Role authorization keys saved and activated dynamically.');
        await loadAllData();
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to update keys');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.put('/admin/settings', institution);
      if (res.data.success) {
        showFeedback('success', 'Institutional configuration and placement benchmarks updated.');
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to update institutional configuration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      if (res.data.success) {
        showFeedback('success', `User status changed to ${!currentStatus ? 'Active' : 'Suspended'}`);
        await loadUsers();
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading institutional administration hub...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Institutional Administration Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized management of authorization keys, higher institutional parameters, and staff governance
              </p>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={loadAllData}
          disabled={actionLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin text-brand-500' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center space-x-2.5 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        {[
          { id: 'keys', label: 'Role Authorization Keys', icon: KeyRound },
          { id: 'institution', label: 'Higher Institutional Details', icon: School },
          { id: 'users', label: 'Staff & User Governance', icon: Users },
          { id: 'departments', label: 'Department & Program Matrix', icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ROLE AUTHORIZATION KEYS */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          {/* Key Management Notice */}
          <div className="p-4 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/30 dark:to-indigo-950/30 rounded-2xl border border-brand-200/80 dark:border-brand-900/60 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Live Dynamic Key Authorization Engine
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Authorization keys guard registration for elevated roles. Any key edited or rotated below is stored securely in MongoDB and validated immediately during registration without requiring server reboot.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveKeys} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Placement Officer Key */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Placement Officer
                      </h4>
                      <p className="text-[10px] text-slate-400">Campus-Wide Cell Authority</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Highest Tier
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={visibleKeys.officer ? 'text' : 'password'}
                    value={keys.placementOfficerKey}
                    onChange={(e) => setKeys({ ...keys, placementOfficerKey: e.target.value })}
                    className="w-full pl-3 pr-16 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => toggleVisibility('officer')}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {visibleKeys.officer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(keys.placementOfficerKey, 'officer')}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedKey === 'officer' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>Updated: {keys.lastUpdatedOfficer ? new Date(keys.lastUpdatedOfficer).toLocaleDateString() : 'Default'}</span>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRotateKey('placement_officer')}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold inline-flex items-center space-x-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>

              {/* Head of Department (HOD) Key */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Head of Department (HOD)
                      </h4>
                      <p className="text-[10px] text-slate-400">Department Oversight</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    Dept Head
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={visibleKeys.hod ? 'text' : 'password'}
                    value={keys.hodKey}
                    onChange={(e) => setKeys({ ...keys, hodKey: e.target.value })}
                    className="w-full pl-3 pr-16 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => toggleVisibility('hod')}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {visibleKeys.hod ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(keys.hodKey, 'hod')}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedKey === 'hod' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>Updated: {keys.lastUpdatedHod ? new Date(keys.lastUpdatedHod).toLocaleDateString() : 'Default'}</span>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRotateKey('hod')}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold inline-flex items-center space-x-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>

              {/* Class Incharge Key */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <School className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Class Incharge Key
                      </h4>
                      <p className="text-[10px] text-slate-400">Section Matrix Oversight</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Section Tier
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={visibleKeys.incharge ? 'text' : 'password'}
                    value={keys.classInchargeKey}
                    onChange={(e) => setKeys({ ...keys, classInchargeKey: e.target.value })}
                    className="w-full pl-3 pr-16 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => toggleVisibility('incharge')}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {visibleKeys.incharge ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(keys.classInchargeKey, 'incharge')}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedKey === 'incharge' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>Updated: {keys.lastUpdatedIncharge ? new Date(keys.lastUpdatedIncharge).toLocaleDateString() : 'Default'}</span>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRotateKey('class_incharge')}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold inline-flex items-center space-x-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>

              {/* Faculty Trainer Key */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Faculty Trainer Key
                      </h4>
                      <p className="text-[10px] text-slate-400">Instruction & Attendance</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Trainer Tier
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={visibleKeys.faculty ? 'text' : 'password'}
                    value={keys.facultyKey}
                    onChange={(e) => setKeys({ ...keys, facultyKey: e.target.value })}
                    className="w-full pl-3 pr-16 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => toggleVisibility('faculty')}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {visibleKeys.faculty ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(keys.facultyKey, 'faculty')}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedKey === 'faculty' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>Updated: {keys.lastUpdatedFaculty ? new Date(keys.lastUpdatedFaculty).toLocaleDateString() : 'Default'}</span>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRotateKey('faculty')}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold inline-flex items-center space-x-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save All Authorization Keys</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: HIGHER INSTITUTIONAL DETAILS */}
      {activeTab === 'institution' && (
        <form onSubmit={handleSaveInstitution} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              College & Placement Cell Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={institution.collegeName}
                  onChange={(e) => setInstitution({ ...institution, collegeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Institutional Code / Autonomous ID
                </label>
                <input
                  type="text"
                  required
                  value={institution.collegeCode}
                  onChange={(e) => setInstitution({ ...institution, collegeCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Accreditation & Approvals
                </label>
                <input
                  type="text"
                  value={institution.accreditation}
                  onChange={(e) => setInstitution({ ...institution, accreditation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Active Academic Year in Focus
                </label>
                <input
                  type="text"
                  value={institution.activeAcademicYear}
                  onChange={(e) => setInstitution({ ...institution, activeAcademicYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Placement Cell Lead / Head
                </label>
                <input
                  type="text"
                  value={institution.placementHeadName}
                  onChange={(e) => setInstitution({ ...institution, placementHeadName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Placement Email
                </label>
                <input
                  type="email"
                  value={institution.placementEmail}
                  onChange={(e) => setInstitution({ ...institution, placementEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 pt-4">
              Institutional Placement Benchmarks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Minimum Training Attendance Requirement (%)
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={institution.minAttendanceBenchmark}
                  onChange={(e) => setInstitution({ ...institution, minAttendanceBenchmark: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Default is 75% as per college placement cell guidelines.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Placement Readiness Passing Score (%)
                </label>
                <input
                  type="number"
                  min={40}
                  max={100}
                  value={institution.placementReadinessBenchmark}
                  onChange={(e) => setInstitution({ ...institution, placementReadinessBenchmark: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Calculated across 4-year cumulative assessments and certifications.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Institutional Details</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: STAFF & USER GOVERNANCE */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Officers</div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {userCounts.officer || 0}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Incharges / HODs</div>
              <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                {userCounts.classIncharge || 0}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Faculty Trainers</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {userCounts.faculty || 0}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Students</div>
              <div className="text-xl font-black text-brand-600 dark:text-brand-400 mt-1">
                {userCounts.student || 0}
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
              >
                <option value="">All Roles</option>
                <option value="placement_officer">Placement Officer</option>
                <option value="class_incharge">Class Incharge / HOD</option>
                <option value="faculty">Faculty Trainer</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'placement_officer'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : u.role === 'class_incharge'
                            ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
                            : u.role === 'faculty'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {u.role === 'placement_officer' ? (
                        <span className="text-brand-600 dark:text-brand-400 font-semibold">Campus-Wide</span>
                      ) : (
                        u.departmentId?.code || 'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center space-x-1 text-[10px] font-bold ${
                          u.isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span>{u.isActive ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'placement_officer' && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            u.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-400'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENT & MATRIX OVERVIEW */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Departments</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {totals.totalDepartments || 5}
              </div>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Programs</div>
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
                {totals.totalPrograms || 0}
              </div>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Enrolled Slots</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {totals.totalEnrollments || 0}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Department Name</th>
                  <th className="px-5 py-3 text-center">Class Sections</th>
                  <th className="px-5 py-3 text-center">Active Students</th>
                  <th className="px-5 py-3 text-center">Assigned Programs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {deptStats.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {d.code}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {d.name}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-300">
                      {d.sectionCount}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900 dark:text-white">
                      {d.studentCount}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                        {d.programsCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
