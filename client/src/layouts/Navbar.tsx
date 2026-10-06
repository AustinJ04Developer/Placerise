import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Menu, LogOut } from 'lucide-react';
import { useTheme } from '../app/context/ThemeContext';
import { useAuth } from '../app/context/AuthContext';
import { NotificationDropdown } from '../components/NotificationDropdown';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, role, logout } = useAuth();

  const currentSectionName =
    user?.assignedSectionId && typeof user.assignedSectionId === 'object'
      ? (user.assignedSectionId as any).displayName
      : null;

  const roleLabels: Record<string, string> = {
    placement_officer: 'Placement Officer',
    hod: 'Head of Department (HOD)',
    faculty: 'Faculty Trainer',
    class_incharge: currentSectionName ? `Class Incharge (${currentSectionName})` : 'Class Incharge (Unassigned)',
    student: 'Student Trainee',
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors shrink-0">
      {/* Left: Mobile hamburger + Context Breadcrumb / Batch Info */}
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger button */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
            2026–27 (Active)
          </span>

          {role === 'class_incharge' ? (
            currentSectionName ? (
              <Link
                to="/academics/classes"
                className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-lg hover:bg-amber-100 transition-colors hidden sm:inline-flex items-center space-x-1"
                title="View your assigned class roster"
              >
                <span>Class:</span>
                <span className="font-bold">{currentSectionName}</span>
              </Link>
            ) : (
              <Link
                to="/profile"
                className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors inline-flex items-center space-x-1 animate-pulse"
                title="Click to assign your incharge class in profile"
              >
                <span>⚠️ Select Class in Profile</span>
              </Link>
            )
          ) : currentSectionName ? (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline truncate max-w-[200px] md:max-w-none">
              Class: {currentSectionName}
            </span>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline truncate max-w-[200px] md:max-w-none">
              Placement Cell & Training
            </span>
          )}
        </div>
      </div>

      {/* Right: Theme toggle + Notification dropdown + User info */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* User Role Tag */}
        {role && (
          <span className="hidden md:inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {roleLabels[role] || role}
          </span>
        )}

        {/* Real-Time Notifications */}
        <NotificationDropdown />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors shrink-0"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Avatar / Initials */}
        <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
          <Link
            to="/profile"
            title="My Profile & Settings"
            className="flex items-center space-x-2 group hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden xl:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-tight truncate max-w-[120px] group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {user?.email}
              </p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
