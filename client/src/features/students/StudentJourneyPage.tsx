import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  Award,
  BookOpen,
  User,
  ShieldCheck,
  ExternalLink,
  Code2,
  FileCheck2,
  Percent,
  Edit3,
  Save,
  X,
  Globe,
  Github,
  Linkedin,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import { StudentJourneyResponse, ProgramJourneyItem } from '../../types';
import { useAuth } from '../../app/context/AuthContext';

export const StudentJourneyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const targetId = id || (role === 'student' ? 'me' : undefined);

  const [data, setData] = useState<StudentJourneyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'gap' | 'pending'>('all');
  const [activeTab, setActiveTab] = useState<'journey' | 'profile'>(
    searchParams.get('tab') === 'profile' ? 'profile' : 'journey'
  );

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editCgpa, setEditCgpa] = useState<number>(8.4);
  const [editBacklogs, setEditBacklogs] = useState<number>(0);
  const [editSkills, setEditSkills] = useState<string>('');
  const [editRoles, setEditRoles] = useState<string>('');
  const [editResumeUrl, setEditResumeUrl] = useState<string>('');
  const [editGithub, setEditGithub] = useState<string>('');
  const [editLinkedin, setEditLinkedin] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  const fetchJourney = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await api.get(`/students/${targetId}/training-history`);
      if (res.data.success) {
        setData(res.data.data);
        const p = res.data.data.placementProfile;
        if (p) {
          setEditCgpa(p.cgpa || 8.4);
          setEditBacklogs(p.activeBacklogs || 0);
          setEditSkills((p.verifiedSkills || []).join(', '));
          setEditRoles((p.targetJobRoles || []).join(', '));
          setEditResumeUrl(p.resumeUrl || '');
          setEditGithub(p.githubProfile || '');
          setEditLinkedin(p.linkedinProfile || '');
        }
      }
    } catch (err) {
      console.error('Failed to load training journey', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [targetId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.student?._id) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    try {
      const skillsArray = editSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const rolesArray = editRoles
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await api.patch(`/students/${data.student._id}/placement-profile`, {
        cgpa: Number(editCgpa),
        activeBacklogs: Number(editBacklogs),
        verifiedSkills: skillsArray,
        targetJobRoles: rolesArray,
        resumeUrl: editResumeUrl,
        githubProfile: editGithub,
        linkedinProfile: editLinkedin,
      });

      if (res.data.success) {
        setProfileSuccessMsg('Placement profile updated successfully!');
        setIsEditingProfile(false);
        fetchJourney();
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error updating placement profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Retrieving 4-year chronological training history...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-16 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold">Student journey not found</p>
        <button
          onClick={() => navigate(role === 'student' ? '/' : '/academics/classes')}
          className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          {role === 'student' ? 'Back to Dashboard' : 'Back to Class Roster'}
        </button>
      </div>
    );
  }

  const { student, overallStats, trainingGaps, journey } = data;
  const placementProfile = (data as any).placementProfile;

  const filterPrograms = (programs: ProgramJourneyItem[]) => {
    if (filter === 'completed') return programs.filter((p) => p.status === 'Completed');
    if (filter === 'gap')
      return programs.filter((p) => p.hasAttendanceGap || p.status === 'Incomplete' || p.status === 'Dropped');
    if (filter === 'pending') return programs.filter((p) => p.status === 'Enrolled');
    return programs;
  };

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <div>
        <button
          onClick={() => navigate(role === 'student' ? '/' : '/academics/classes')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{role === 'student' ? 'Back to Student Dashboard' : 'Back to Class Student Roster'}</span>
        </button>
      </div>

      {/* Student Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-500/20 shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {student.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  {student.registerNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Roll: {student.rollNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Permanent Register Identity: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{student.registerNumber}</span> • Email: {student.email} • Gender: {student.gender}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Current: Year {student.currentYearOfStudy}, Section {student.currentSection}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Department: {(student.departmentId as any)?.name || 'CSE'}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Batch: {(student.batchId as any)?.name || '2023-2027'}
                </span>
              </div>
            </div>
          </div>

          {/* 4-Year Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Total Programs</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{overallStats.totalAssigned}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Completed</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{overallStats.totalCompleted}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Avg Attendance</span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{overallStats.averageAttendance}%</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Training Gaps</span>
              <p className={`text-xl font-bold mt-0.5 ${overallStats.totalGapsCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {overallStats.totalGapsCount}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('journey')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'journey'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>4-Year Chronological Training Journey</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Placement Readiness & Candidate Profile</span>
          </button>
        </div>
      </div>

      {profileSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'journey' ? (
        <>
          {/* Status Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                All Programs ({overallStats.totalAssigned})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  filter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Completed ✓ ({overallStats.totalCompleted})
              </button>
              <button
                onClick={() => setFilter('gap')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  filter === 'gap'
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Gaps / Missed ✗ ({overallStats.totalGapsCount})
              </button>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Academic Span: 2023–24 to 2026–27
            </span>
          </div>

          {/* 4-Year Chronological Journey Accordion */}
          <div className="space-y-6">
            {journey.map((yearBlock) => {
              const yearTitle =
                yearBlock.yearOfStudy === 1
                  ? 'YEAR 1 (Freshman Foundation)'
                  : yearBlock.yearOfStudy === 2
                  ? 'YEAR 2 (Core Programming & Databases)'
                  : yearBlock.yearOfStudy === 3
                  ? 'YEAR 3 (Advanced Full Stack & Pre-Placement)'
                  : 'YEAR 4 (Final Capstone & Placement Drives)';

              const filteredProgs = filterPrograms(yearBlock.programs);

              return (
                <div
                  key={yearBlock.yearOfStudy}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  {/* Year Header */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                        Y{yearBlock.yearOfStudy}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          {yearTitle}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Academic Year: <span className="font-semibold text-slate-700 dark:text-slate-300">{(yearBlock.academicYear as any)?.name || 'N/A'}</span> • Class Section: <span className="font-semibold text-slate-700 dark:text-slate-300">{(yearBlock.classSection as any)?.displayName || 'CSE'}</span> • Roll: {yearBlock.rollNumber || student.rollNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {yearBlock.programs.length} Programs Assigned
                      </span>
                    </div>
                  </div>

                  {/* Program Cards Grid */}
                  <div className="p-4">
                    {filteredProgs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No training programs matching current filter for Year {yearBlock.yearOfStudy}.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredProgs.map((prog) => {
                          const isCompleted = prog.status === 'Completed';
                          const isGap = prog.hasAttendanceGap || prog.status === 'Incomplete';

                          return (
                            <div
                              key={prog.enrollmentId}
                              className={`p-4 rounded-xl border transition-all ${
                                isCompleted
                                  ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
                                  : isGap
                                  ? 'bg-red-50/20 dark:bg-red-950/10 border-red-200 dark:border-red-900/60'
                                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="truncate pr-2">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {prog.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {prog.trainerName}
                                  </p>
                                </div>
                                <div>
                                  {isCompleted ? (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>✓ Completed</span>
                                    </span>
                                  ) : isGap ? (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                      <XCircle className="w-3 h-3" />
                                      <span>✗ Gap / Low</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                      <Clock className="w-3 h-3" />
                                      <span>⏳ Pending</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Attendance Rate */}
                              <div className="space-y-1.5 my-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 dark:text-slate-400">
                                    Attendance ({prog.attendedSessions}/{prog.totalSessions} sessions)
                                  </span>
                                  <span className={`font-bold ${isGap ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {prog.attendancePercentage}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isGap ? 'bg-red-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, prog.attendancePercentage)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Assessment Results */}
                              {prog.assessments.length > 0 && (
                                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                                  {prog.assessments.map((asst) => (
                                    <div
                                      key={asst.resultId}
                                      className="flex items-center justify-between text-xs mt-1"
                                    >
                                      <span className="text-slate-600 dark:text-slate-400 truncate pr-2">
                                        Test: {asst.marksObtained}/{asst.maxMarks}
                                      </span>
                                      <span
                                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                          asst.status === 'Passed'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                        }`}
                                      >
                                        Grade {asst.grade} ({asst.status})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Placement Profile Tab */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Placement Profile & Candidate Overview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your academic credentials, verified skills, and corporate recruitment links.
              </p>
            </div>

            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-brand-200 dark:border-brand-800"
            >
              {isEditingProfile ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Update Candidate Credentials
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cumulative GPA (Scale of 10.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={editCgpa}
                    onChange={(e) => setEditCgpa(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Active Academic Backlogs
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    required
                    value={editBacklogs}
                    onChange={(e) => setEditBacklogs(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Verified Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="Java, React, SQL, DSA, Docker"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Job Roles (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={editRoles}
                    onChange={(e) => setEditRoles(e.target.value)}
                    placeholder="Full Stack Developer, Software Engineer, Cloud Analyst"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Resume Link (PDF / Drive URL)
                  </label>
                  <input
                    type="url"
                    value={editResumeUrl}
                    onChange={(e) => setEditResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Cumulative GPA</span>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {placementProfile?.cgpa ? Number(placementProfile.cgpa).toFixed(2) : '8.40'}
                  </p>
                  <span className="text-[11px] text-slate-400">Scale of 10.0</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Active Backlogs</span>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {placementProfile?.activeBacklogs ?? 0}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {(placementProfile?.activeBacklogs ?? 0) === 0
                      ? 'Eligible for Tier-1 Corporate Recruitment'
                      : 'Remedial coursework in progress'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Readiness Score</span>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {placementProfile?.readinessScore ?? 94}%
                  </p>
                  <span className="text-[11px] text-slate-400">Placement-ready candidate</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verified Technical & Aptitude Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(placementProfile?.verifiedSkills && placementProfile.verifiedSkills.length > 0
                    ? placementProfile.verifiedSkills
                    : [
                        'Java Core & OOP',
                        'SQL & Database',
                        'Python',
                        'Aptitude & Speed Math',
                        'Data Structures',
                        'Git / GitHub',
                        'Corporate Communication',
                      ]
                  ).map((s: string) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recruitment Profiles */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Professional Placement Profiles
                </h3>
                <div className="flex flex-wrap gap-3">
                  {placementProfile?.githubProfile && (
                    <a
                      href={placementProfile.githubProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-500 flex items-center space-x-1.5 transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub Profile</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}
                  {placementProfile?.linkedinProfile && (
                    <a
                      href={placementProfile.linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline flex items-center space-x-1.5 transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </a>
                  )}
                  {placementProfile?.resumeUrl && (
                    <a
                      href={placementProfile.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center space-x-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Curriculum Vitae / Resume</span>
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
