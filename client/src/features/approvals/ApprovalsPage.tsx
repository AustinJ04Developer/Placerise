import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { ApprovalRequestItem } from '../../types';
import { useAuth } from '../../app/context/AuthContext';

export const ApprovalsPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewComment, setReviewComment] = useState<{ [id: string]: string }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const { role } = useAuth();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReview = async (id: string, action: 'Approved' | 'Rejected') => {
    setSubmittingId(id);
    try {
      const defaultComment = role === 'hod' ? 'Verified & Approved by HOD' : 'Verified by Placement Officer';
      const comment = reviewComment[id] || (action === 'Approved' ? defaultComment : 'Rejected');
      const res = await api.patch(`/approvals/${id}/review`, { action, comment });
      if (res.data.success) {
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const isApprover = role === 'placement_officer' || role === 'hod';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Change Approvals & Governance Queue
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Audit-Protected Workflow
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Attendance corrections and assessment modifications require Placement Officer or Department Head (HOD) approval. Original and proposed states are permanently preserved.
        </p>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <p className="text-xs text-slate-500 mt-2">Loading approval requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-900 dark:text-white">Approval Queue is Clean!</p>
          <p className="text-xs text-slate-500 mt-1">
            No pending attendance corrections or profile changes waiting for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isPending = req.status === 'Pending';
            const isApproved = req.status === 'Approved';

            return (
              <div
                key={req._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {req.requestType}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Submitted by: <strong className="text-slate-900 dark:text-white">{req.requesterId?.name || 'Faculty'}</strong> ({req.requesterId?.email})
                    </span>
                  </div>

                  <div>
                    {isPending ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3" />
                        <span>Pending Review</span>
                      </span>
                    ) : isApproved ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Approved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* State Diff Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
                    <span className="text-[10px] uppercase font-bold text-red-600 block mb-1">
                      Original Stored Value
                    </span>
                    <pre className="font-mono text-slate-800 dark:text-slate-200 overflow-x-auto">
                      {JSON.stringify(req.previousValue || { status: 'Absent' }, null, 2)}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1">
                      Proposed New Value
                    </span>
                    <pre className="font-mono text-slate-800 dark:text-slate-200 overflow-x-auto">
                      {JSON.stringify(req.proposedValue, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <strong>Reason:</strong> {req.reason}
                </div>

                {/* Approver Actions */}
                {isApprover && isPending && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Reviewer remarks / rationale..."
                      value={reviewComment[req._id] || ''}
                      onChange={(e) => setReviewComment({ ...reviewComment, [req._id]: e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReview(req._id, 'Approved')}
                        disabled={submittingId === req._id}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                      >
                        ✓ Approve &amp; Apply
                      </button>
                      <button
                        onClick={() => handleReview(req._id, 'Rejected')}
                        disabled={submittingId === req._id}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
