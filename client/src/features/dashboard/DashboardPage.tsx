import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  ShieldAlert,
  UserX,
  FileCheck,
  Grid3X3,
  GraduationCap,
  CheckSquare,
  FileCheck2,
  FileText,
  History,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../services/api';
import { useAuth } from '../../app/context/AuthContext';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, role } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const chartColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

  const attendanceData: { name: string; attendance: number; benchmark: number }[] =
    stats?.charts?.attendanceData || [];

  const categoryData: { name: string; value: number }[] =
    stats?.charts?.categoryData || [];

  const totalProgramsInCategories = categoryData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 md:p-8 border border-brand-800/30 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
            <span>
              {role === 'student'
                ? 'Student Portal Active'
                : role === 'hod'
                ? `Head of Department Portal • ${stats?.departmentName || 'Computer Science & Engineering'}`
                : role === 'placement_officer'
                ? 'Placement Officer Director Portal'
                : role === 'class_incharge'
                ? 'Class Incharge Portal'
                : 'Faculty Portal'}
            </span>
            <span>•</span>
            <span>Batch 2023–2027</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            {role === 'student'
              ? 'Personalized Student Placement Training Dashboard. Monitor your 4-year multi-track progress, attendance compliance, and placement readiness score.'
              : role === 'hod'
              ? `Department Head Oversight & Governance Dashboard for ${stats?.departmentName || 'your department'}. Monitor departmental cohorts, approve training adjustments, and ensure placement benchmarks.`
              : 'Placement Training Cell Management & Progress Tracking Dashboard. Monitor multi-year training journeys, attendance thresholds, and student gap metrics.'}
          </p>

          {/* Quick Action Links by Role */}
          <div className="flex flex-wrap gap-3 mt-5">
            {role === 'student' ? (
              <>
                <Link
                  to="/students/me/journey"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>My 4-Year Journey</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/training"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Browse Training Tracks</span>
                </Link>
                <Link
                  to="/students/me/journey?tab=profile"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>My Placement Readiness</span>
                </Link>
              </>
            ) : role === 'hod' ? (
              <>
                <Link
                  to="/academics/classes"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Department Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/matrix"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Class Training Matrix</span>
                </Link>
                <Link
                  to="/training"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Training Programs</span>
                </Link>
                <Link
                  to="/approvals"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>
                    Change Approvals
                    {Number(stats?.cards?.pendingApprovals) > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
                        {stats.cards.pendingApprovals}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  to="/reports"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Department Reports</span>
                </Link>
                <Link
                  to="/audit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </Link>
              </>
            ) : role === 'faculty' ? (
              <>
                <Link
                  to="/attendance"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Session Attendance Marker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/assessments"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Assessments & Grading</span>
                </Link>
                <Link
                  to="/training"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Manage Training Programs</span>
                </Link>
              </>
            ) : role === 'class_incharge' ? (
              <>
                <Link
                  to="/academics/classes"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Class Student Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/training"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Training Programs</span>
                </Link>
                <Link
                  to="/matrix"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Class Training Matrix</span>
                </Link>
                <Link
                  to="/training/reverse-query"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Reverse Query (Absentees)</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/academics/classes"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Class Student Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/matrix"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Class Training Matrix</span>
                </Link>
                <Link
                  to="/training/reverse-query"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 border border-slate-700"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Reverse Query (Absentees)</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {role === 'student' ? 'Enrolled Programs' : 'Total Students'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {role === 'student'
              ? (stats?.cards?.enrolledProgramsCount ?? 0)
              : (stats?.cards?.totalStudents ?? 0)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {role === 'student'
              ? 'Across Academic Years'
              : role === 'hod'
              ? `${stats?.departmentName || 'Department'} Students`
              : 'Active Institutional Cohort'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {role === 'student' ? 'My Attendance' : 'Average Attendance'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {role === 'student'
              ? `${stats?.cards?.attendancePercentage ?? 0}%`
              : `${stats?.cards?.averageAttendance ?? 0}%`}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
            <span>Threshold: &ge; 75%</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {role === 'student' ? 'Readiness Score' : 'Training Completion'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {role === 'student' ? `${stats?.cards?.readinessScore ?? 0}%` : `${stats?.cards?.completionRate ?? 0}%`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {role === 'hod' ? 'Department Programs Tracked' : 'Institutional Completion Rate'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {role === 'student' ? 'Academic CGPA' : 'Students with Gaps'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {role === 'student'
              ? (stats?.cards?.cgpa ? `${stats.cards.cgpa} CGPA` : '0.00 CGPA')
              : (stats?.cards?.studentsWithGaps ?? 0)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {role === 'student'
              ? `Active Backlogs: ${stats?.cards?.activeBacklogs ?? 0}`
              : role === 'hod'
              ? 'Department Students Requiring Makeup'
              : 'Students Below 75% Attendance'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trends Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Historical Program Attendance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {role === 'hod'
                  ? `Department Training Attendance Trends (${stats?.departmentName || 'Department'})`
                  : 'Participation rates across training programs'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Benchmark: 75%
            </span>
          </div>

          {attendanceData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="attendance" fill="#0284c7" radius={[4, 4, 0, 0]} name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No Attendance Data Recorded
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Attendance percentages and benchmark comparisons will dynamically chart here as training programs and session attendances are logged.
              </p>
            </div>
          )}
        </div>

        {/* Categories Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Training Domain Mix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {role === 'hod'
                ? `${stats?.cards?.activePrograms ?? 0} programs active for ${stats?.departmentName || 'Department'}`
                : `${stats?.cards?.activePrograms ?? totalProgramsInCategories} programs across ${categoryData.length} skill categories`}
            </p>
          </div>

          {totalProgramsInCategories > 0 ? (
            <>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.filter((c) => c.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.filter((c) => c.value > 0).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {categoryData.filter((c) => c.value > 0).map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                      />
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {cat.value} programs
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="h-40 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-center p-4 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {categoryData.length} Training Tracks Configured
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
                  Awaiting program schedules. Programs will reflect in this domain distribution upon creation.
                </p>
              </div>
              <div className="space-y-1.5">
                {categoryData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                      />
                      <span className="truncate max-w-[180px]">{cat.name}</span>
                    </span>
                    <span className="font-semibold text-slate-400 dark:text-slate-500">
                      {cat.value} programs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
