import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Grid3X3,
  BookOpen,
  UserX,
  CheckSquare,
  FileCheck2,
  Users,
  ShieldAlert,
  ShieldCheck,
  FileText,
  History,
  LogOut,
  X,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../app/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      to: '/',
      icon: LayoutDashboard,
      roles: ['placement_officer', 'hod', 'faculty', 'class_incharge'],
    },
    {
      label: role === 'hod' ? 'Department Student Roster' : 'Class Student Roster',
      to: '/academics/classes',
      icon: Users,
      roles: ['placement_officer', 'hod', 'faculty', 'class_incharge'],
    },
    {
      label: 'Class Training Matrix',
      to: '/matrix',
      icon: Grid3X3,
      roles: ['placement_officer', 'hod', 'class_incharge'],
    },
    {
      label: 'Training Programs',
      to: '/training',
      icon: BookOpen,
      roles: ['placement_officer', 'hod', 'faculty', 'class_incharge'],
    },
    {
      label: 'Reverse Query (Absentees)',
      to: '/training/reverse-query',
      icon: UserX,
      roles: ['placement_officer', 'hod', 'faculty', 'class_incharge'],
    },
    {
      label: 'Attendance Marker',
      to: '/attendance',
      icon: CheckSquare,
      roles: ['placement_officer', 'hod', 'faculty', 'class_incharge'],
    },
    {
      label: 'Assessments & Grading',
      to: '/assessments',
      icon: FileCheck2,
      roles: ['placement_officer', 'hod', 'faculty'],
    },
    {
      label: 'Student Comparison',
      to: '/compare',
      icon: Users,
      roles: ['placement_officer', 'hod', 'class_incharge'],
    },
    {
      label: 'Approvals & Requests',
      to: '/approvals',
      icon: ShieldAlert,
      roles: ['placement_officer', 'hod', 'faculty', 'class_incharge'],
    },
    {
      label: 'Reports & Export',
      to: '/reports',
      icon: FileText,
      roles: ['placement_officer', 'hod', 'class_incharge'],
    },
    {
      label: 'Audit Trail',
      to: '/audit',
      icon: History,
      roles: ['placement_officer', 'hod'],
    },
    {
      label: 'Admin Hub & Keys',
      to: '/admin',
      icon: ShieldCheck,
      roles: ['placement_officer'],
    },
    {
      label: 'My Profile & Settings',
      to: '/profile',
      icon: UserCog,
      roles: ['placement_officer', 'hod', 'faculty', 'class_incharge'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => role && item.roles.includes(role));

  const deptCode =
    user?.departmentId && typeof user.departmentId === 'object'
      ? (user.departmentId as any).code
      : null;

  const roleLabels: Record<string, { label: string; color: string }> = {
    placement_officer: { label: 'Placement Officer / Director', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    hod: {
      label: deptCode ? `Head of Department (${deptCode})` : 'Head of Department (HOD)',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    faculty: { label: 'Faculty / Trainer', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    class_incharge: {
      label: user?.assignedSectionId && typeof user.assignedSectionId === 'object' && (user.assignedSectionId as any).displayName
        ? `Class Incharge (${(user.assignedSectionId as any).displayName})`
        : 'Class Incharge',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    student: { label: 'Student Tracked Record', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  };

  const currentBadge = role ? roleLabels[role] : null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen lg:h-screen lg:sticky lg:top-0 shrink-0 select-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Placerise
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Placement Training Cell
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Pill */}
        {currentBadge && (
          <div className="px-4 pt-3 pb-1">
            <div className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${currentBadge.color} flex items-center justify-center text-center`}>
              {currentBadge.label}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => {
                  // Close mobile drawer on item click
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-sm border border-brand-200/50 dark:border-brand-800/50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between">
            <NavLink
              to="/profile"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              title="Maintain Profile & Account Settings"
              className="flex items-center space-x-2.5 truncate pr-2 group hover:opacity-85 transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </NavLink>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
