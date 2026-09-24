import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  Clock,
  Building,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Save,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  CheckSquare,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../app/context/AuthContext';
import { api } from '../../services/api';

export const ProfilePage: React.FC = () => {
  const { user, role, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'credentials' | 'security' | 'activity'>('profile');

  // Form State - Personal Info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [officeCabin, setOfficeCabin] = useState(user?.officeCabin || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentId, setDepartmentId] = useState<string>(
    user?.departmentId && typeof user.departmentId === 'object'
      ? (user.departmentId as any)._id
      : user?.departmentId || ''
  );
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Form State - Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepts(true);
      try {
        const res = await api.get('/academics/departments');
        if (res.data.success) {
          setDepartments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      } finally {
        setIsLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDesignation(user.designation || '');
      setOfficeCabin(user.officeCabin || '');
      setBio(user.bio || '');
      const currentDeptId =
        user.departmentId && typeof user.departmentId === 'object'
          ? (user.departmentId as any)._id
          : user.departmentId || '';
      setDepartmentId(currentDeptId);
    }
  }, [user]);

  const selectedDept = departments.find((d) => d._id === departmentId);

  const currentDeptObj =
    user?.departmentId && typeof user.departmentId === 'object'
      ? (user.departmentId as any)
      : departments.find((d) => d._id === user?.departmentId);

  const deptCode = currentDeptObj?.code || selectedDept?.code || null;
  const deptName = currentDeptObj?.name || selectedDept?.name || null;

  const assignedSectionName =
    user?.assignedSectionId && typeof user.assignedSectionId === 'object'
      ? (user.assignedSectionId as any).displayName || (user.assignedSectionId as any).section
      : 'IV CSE A';

  const roleMeta: Record<string, { label: string; badgeColor: string; roleDesc: string; icon: any }> = {
    placement_officer: {
      label: 'Placement Officer / Director',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      roleDesc: 'Institution-wide placement lifecycle governance, training cell operations, and corporate relations.',
      icon: Shield,
    },
    hod: {
      label: deptCode ? `Head of Department (${deptCode})` : 'Head of Department (HOD)',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      roleDesc: `Academic Department Head for ${deptName || 'Computer Science & Engineering'}. Oversees departmental cohort training, curriculum approvals, and attendance compliance.`,
      icon: Building,
    },
    faculty: {
      label: 'Faculty / Technical Trainer',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      roleDesc: 'Curriculum delivery, coding assessment design, daily attendance marking, and skill mentoring.',
      icon: BookOpen,
    },
    class_incharge: {
      label: `Class Incharge (${assignedSectionName})`,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      roleDesc: `Direct classroom mentor for Section ${assignedSectionName}. Responsible for student participation, daily attendance rosters, and student comparison.`,
      icon: Users,
    },
    student: {
      label: 'Student Trainee',
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      roleDesc: 'Placement candidate participating in skill tracks, corporate assessments, and progress milestones.',
      icon: GraduationCap,
    },
  };

  const currentRoleMeta = role ? roleMeta[role] : null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!name.trim()) {
      setProfileErrorMsg('Full Name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await api.patch('/auth/profile', {
        name,
        phone,
        designation,
        officeCabin,
        bio,
        departmentId: departmentId || null,
      });

      if (res.data.success) {
        updateUser(res.data.data);
        setProfileSuccessMsg('Profile details updated successfully!');
        setTimeout(() => setProfileSuccessMsg(''), 5000);
      }
    } catch (err: any) {
      setProfileErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setPasswordSuccessMsg('Password changed successfully! Please keep your new credentials secure.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(''), 5000);
      }
    } catch (err: any) {
      setPasswordErrorMsg(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <User className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>My Profile & Account Settings</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Maintain your personal identity, academic responsibilities, and security authentication credentials.
          </p>
        </div>

        {currentRoleMeta && (
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${currentRoleMeta.badgeColor} flex items-center space-x-1.5 self-start sm:self-auto`}>
            <currentRoleMeta.icon className="w-4 h-4" />
            <span>{currentRoleMeta.label}</span>
          </div>
        )}
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          {/* Avatar with gradient */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 text-white flex items-center justify-center text-3xl sm:text-4xl font-black shadow-lg shadow-brand-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 p-1 bg-white dark:bg-slate-900 rounded-full shadow-xs">
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Active Account" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {user?.name}
                </h2>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                  {user?.designation || currentRoleMeta?.label || 'Staff Member'}
                </p>
              </div>

              <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 self-center sm:self-start">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Staff</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {user?.bio || currentRoleMeta?.roleDesc}
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
              </span>

              {user?.phone && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.phone}</span>
                </span>
              )}

              {user?.officeCabin && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.officeCabin}</span>
                </span>
              )}

              {deptName && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{deptName}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Information</span>
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'credentials'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Role Credentials & Scope</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'activity'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Session & Activity</span>
        </button>
      </div>

      {/* Tab 1: Personal Information */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Personal Profile Details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your contact and institutional workplace details visible across academic rosters and session logs.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address <span className="text-slate-400">(Managed by Institution)</span>
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Official Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Designation / Title
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Professor & Head / Placement Director"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Academic Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Academic Department</span>
                  {selectedDept && (
                    <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded">
                      {selectedDept.code}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    disabled={isLoadingDepts}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium disabled:opacity-60"
                  >
                    <option value="">-- No Department Assigned --</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Office / Cabin Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Office / Cabin Location
                </label>
                <input
                  type="text"
                  value={officeCabin}
                  onChange={(e) => setOfficeCabin(e.target.value)}
                  placeholder="e.g. Block A, Room 304 / Admin Placement Cell"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Bio / Institutional Responsibilities */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Bio & Institutional Responsibilities
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief note about your academic training specializations and student mentoring tracks..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving Details...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Role Credentials & Scope */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Assigned Institutional Scope & Responsibilities</span>
            </h3>

            {/* Role Specific Overview */}
            {role === 'placement_officer' && (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                  <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>Placement Officer / Cell Director</span>
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    You hold <strong>Institutional Placement Director</strong> authority. Your account has system-wide permissions across all academic departments (CSE, AIDS, ECE, EEE, MECH, CIVIL, MBA), all academic years, recruitment training tracks, and administrative security keys.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Domain Authority</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Institution-Wide</p>
                    <p className="text-[11px] text-slate-500 mt-1">All Academic & Management Departments</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Curriculum Governance</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Full Authority</p>
                    <p className="text-[11px] text-slate-500 mt-1">Multi-Year Training Matrix & Keys</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Audit Trail Access</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Global Audit Log</p>
                    <p className="text-[11px] text-slate-500 mt-1">Real-Time Cryptographic Logs</p>
                  </div>
                </div>
              </div>
            )}

            {role === 'hod' && (
              <div className="space-y-3">
                <div className="p-4 bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 rounded-xl">
                  <div className="flex items-center space-x-2 text-cyan-800 dark:text-cyan-300 font-bold text-xs mb-1">
                    <Building className="w-4 h-4" />
                    <span>Head of Academic Department</span>
                  </div>
                  <p className="text-xs text-cyan-900 dark:text-cyan-200 leading-relaxed">
                    You hold <strong>Department Head</strong> authority for <strong>{deptName || 'Your Department'} ({deptCode || 'N/A'})</strong>. All dashboard metrics, class rosters, training programs, attendance absentees, change approvals, and audit records are strictly scoped to your department cohort.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Department Scope</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{deptCode || 'Assigned'}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{deptName || 'Department'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Faculty Oversight</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Department Faculty</p>
                    <p className="text-[11px] text-slate-500 mt-1">Review & Approve Change Requests</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Cohort Progression</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Years 1–4</p>
                    <p className="text-[11px] text-slate-500 mt-1">Batch Roster & Matrix Tracking</p>
                  </div>
                </div>
              </div>
            )}

            {role === 'faculty' && (
              <div className="space-y-3">
                <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl">
                  <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Faculty / Technical Trainer</span>
                  </div>
                  <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    You are authorized to create technical curricula, deliver training sessions, mark session attendance, configure skill assessments, and enter student test scores.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Instructional Role</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Course Trainer</p>
                    <p className="text-[11px] text-slate-500 mt-1">Curriculum & Coding Tracks</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Grading Authority</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Assessments</p>
                    <p className="text-[11px] text-slate-500 mt-1">Score Entry & Performance</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Attendance Marker</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Session Rosters</p>
                    <p className="text-[11px] text-slate-500 mt-1">Daily & Sunday Makeup Classes</p>
                  </div>
                </div>
              </div>
            )}

            {role === 'class_incharge' && (
              <div className="space-y-3">
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                  <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold text-xs mb-1">
                    <Users className="w-4 h-4" />
                    <span>Class Incharge Mentor</span>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    You are assigned as the dedicated Class Incharge for <strong>Section {assignedSectionName}</strong>. You hold direct stewardship over enrolled student trainees, monitoring their daily attendance, readiness scores, and remedial requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Assigned Section</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{assignedSectionName}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Class Cohort</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Attendance Threshold</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">75% Benchmark</p>
                    <p className="text-[11px] text-slate-500 mt-1">Absentees & Remedial Alert</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Student Comparison</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Multi-Trainee</p>
                    <p className="text-[11px] text-slate-500 mt-1">Side-by-side metric audits</p>
                  </div>
                </div>
              </div>
            )}

            {role === 'student' && (
              <div className="space-y-3">
                <div className="p-4 bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60 rounded-xl">
                  <div className="flex items-center space-x-2 text-violet-800 dark:text-violet-300 font-bold text-xs mb-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>Student Trainee</span>
                  </div>
                  <p className="text-xs text-violet-900 dark:text-violet-200 leading-relaxed">
                    You are enrolled as a student trainee in <strong>{deptName || 'Assigned Department'} ({deptCode || 'N/A'})</strong>. You have direct access to your personal placement readiness scorecard, skill assessments, attendance verifications, and career milestones.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Academic Department</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{deptCode || 'N/A'}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{deptName || 'Department Cohort'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Placement Profile</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Self-Managed</p>
                    <p className="text-[11px] text-slate-500 mt-1">Skills, CGPA & Certifications</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-medium">Training Progress</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Individual Journey</p>
                    <p className="text-[11px] text-slate-500 mt-1">Test Scores & Session Attendance</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-brand-600" />
              <span>Change Account Password</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ensure your account is using a strong, unique password to prevent unauthorized staff actions.
            </p>
          </div>

          {passwordSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter existing password"
                  className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-type new password"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isSavingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Session & Activity */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Authentication Session & Account Metadata</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System access record and security token details for your active session.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400">User Identification ID</span>
              <p className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.id || user?._id || 'N/A'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400">Account Role Classification</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400">Last Successful Login</span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : 'Active Session'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400">Account Registration Date</span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'Active System Account'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Granted Role Permissions
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(user?.permissions && user.permissions.length > 0 ? user.permissions : [
                'ACCESS_DASHBOARD',
                'VIEW_CLASS_ROSTER',
                'VIEW_TRAINING_MATRIX',
                'MANAGE_ATTENDANCE',
                'ACCESS_SELF_PROFILE',
              ]).map((perm, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-300 font-semibold"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
