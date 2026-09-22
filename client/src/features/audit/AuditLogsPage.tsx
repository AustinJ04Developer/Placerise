import React, { useEffect, useState } from 'react';
import { History, Search, ShieldCheck, Filter, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';
import { useAuth } from '../../app/context/AuthContext';

export const AuditLogsPage: React.FC = () => {
  const { role, user } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchEmail, setSearchEmail] = useState<string>('');

  const deptCode =
    user?.departmentId && typeof user.departmentId === 'object'
      ? (user.departmentId as any).code
      : 'Department';

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/audit', {
          params: { userEmail: searchEmail || undefined, limit: 50 },
        });
        if (res.data.success) {
          setLogs(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [searchEmail]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Immutable Audit Trail
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {role === 'hod' ? `Department Oversight (${deptCode})` : 'Executive Oversight (Officer & HOD)'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {role === 'hod'
            ? `Cryptographically auditable event log capturing attendance updates, assessments, and authentication for ${deptCode} department.`
            : 'Cryptographically auditable and append-only event log capturing every attendance update, assessment grade submission, and login.'}
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user email / actor..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {logs.length} most recent events
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="text-xs text-slate-500 mt-2">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User / Actor</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white font-sans">
                      {log.userName}
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {log.userEmail}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-brand-600 dark:text-brand-400">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {log.entity}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-sans max-w-md truncate">
                      {log.details || '-'}
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
