import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Users,
  Search,
  CheckSquare,
  Square,
  Building,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';

interface CohortAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: {
    _id: string;
    title: string;
    code: string;
    targetYears: number[];
    targetBatchIds?: any[];
    targetDepartmentIds: any[];
  };
  onSuccess?: () => void;
}

export const CohortAssignmentModal: React.FC<CohortAssignmentModalProps> = ({
  isOpen,
  onClose,
  program,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'assign' | 'enrolled'>('assign');
  const [mode, setMode] = useState<'selective' | 'batch' | 'section' | 'department'>('selective');

  // Filter criteria for student selection
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Student candidates & selection
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Enrolled students list
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Detect if this program is interdepartment (targets 2+ departments)
  const isInterdepartment = (program.targetDepartmentIds?.length || 0) > 1;

  useEffect(() => {
    if (!isOpen) return;

    // Load departments & batches
    const loadMetadata = async () => {
      try {
        const [deptRes, batchRes] = await Promise.all([
          api.get('/academics/departments'),
          api.get('/academics/batches'),
        ]);

        if (deptRes.data.success) {
          setDepartments(deptRes.data.data);
          const firstTarget = program.targetDepartmentIds?.[0];
          const targetId = typeof firstTarget === 'string' ? firstTarget : firstTarget?._id;
          if (targetId) {
            setSelectedDeptId(targetId);
          } else if (deptRes.data.data.length > 0) {
            setSelectedDeptId(deptRes.data.data[0]._id);
          }
        }

        if (batchRes.data.success) {
          setBatches(batchRes.data.data);
          const firstTargetBatch = program.targetBatchIds?.[0];
          const targetBatchId = typeof firstTargetBatch === 'string' ? firstTargetBatch : firstTargetBatch?._id;
          if (targetBatchId) {
            setSelectedBatchId(targetBatchId);
          } else if (batchRes.data.data.length > 0) {
            setSelectedBatchId(batchRes.data.data[0]._id);
          }
        }
      } catch (err) {
        // fallback
      }
    };

    loadMetadata();
    loadEnrolledStudents();
  }, [isOpen, program._id]);

  // Load sections when department, batch, or year changes
  useEffect(() => {
    if (!isOpen) return;
    const loadSections = async () => {
      try {
        const res = await api.get('/academics/sections', {
          params: {
            departmentId: selectedDeptId || undefined,
            batchId: selectedBatchId || undefined,
            yearOfStudy: selectedYear !== 'all' ? selectedYear : undefined,
          },
        });
        if (res.data.success) {
          setSections(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedSectionId(res.data.data[0]._id);
          } else {
            setSelectedSectionId('');
          }
        }
      } catch (err) {
        setSections([]);
      }
    };
    loadSections();
  }, [isOpen, selectedDeptId, selectedBatchId, selectedYear]);

  // Fetch student candidates when filters change
  useEffect(() => {
    if (!isOpen || activeTab !== 'assign') return;
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const params: any = {
          limit: 100,
          status: 'Active',
        };
        if (selectedDeptId) params.departmentId = selectedDeptId;
        if (selectedBatchId) params.batchId = selectedBatchId;
        if (selectedYear !== 'all') params.yearOfStudy = selectedYear;
        if (selectedSectionId && mode === 'section') {
          params.currentClassSectionId = selectedSectionId;
        }

        const res = await api.get('/students', { params });
        if (res.data.success) {
          setAvailableStudents(res.data.data);
        }
      } catch (err) {
        setAvailableStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [isOpen, selectedDeptId, selectedBatchId, selectedYear, selectedSectionId, mode, activeTab]);

  // Fetch enrolled students
  const loadEnrolledStudents = async () => {
    setLoadingEnrolled(true);
    try {
      const res = await api.get(`/training/programs/${program._id}/enrollments`);
      if (res.data.success) {
        setEnrolledStudents(res.data.data);
      }
    } catch (err) {
      setEnrolledStudents([]);
    } finally {
      setLoadingEnrolled(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s._id);
    const allSelected = filteredIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const filteredStudents = availableStudents.filter((student) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(q) ||
      student.registerNumber?.toLowerCase().includes(q) ||
      student.rollNumber?.toLowerCase().includes(q)
    );
  });

  const handleAssign = async () => {
    setFeedback(null);
    setSubmitting(true);

    try {
      let payload: any = {};
      const targetProgressionYear =
        program.targetYears?.[0] || (selectedYear !== 'all' ? selectedYear : 4);

      if (mode === 'selective') {
        if (selectedStudentIds.length === 0) {
          setFeedback({ type: 'error', message: 'Please select at least one student.' });
          setSubmitting(false);
          return;
        }
        payload = {
          targetType: 'STUDENTS',
          studentIds: selectedStudentIds,
          yearOfStudy: targetProgressionYear,
        };
      } else if (mode === 'batch') {
        if (!selectedBatchId) {
          setFeedback({ type: 'error', message: 'Please select a student batch to enroll.' });
          setSubmitting(false);
          return;
        }
        payload = {
          targetType: 'BATCH',
          batchId: selectedBatchId,
          departmentId: selectedDeptId || undefined,
          yearOfStudy: targetProgressionYear,
        };
      } else if (mode === 'section') {
        if (!selectedSectionId) {
          setFeedback({ type: 'error', message: 'Please select a class section.' });
          setSubmitting(false);
          return;
        }
        payload = {
          targetType: 'SECTION',
          sectionId: selectedSectionId,
          yearOfStudy: targetProgressionYear,
        };
      } else if (mode === 'department') {
        payload = {
          targetType: isInterdepartment ? 'INTERDEPARTMENT' : 'DEPARTMENT',
          departmentId: selectedDeptId,
          batchId: selectedBatchId || undefined,
          yearOfStudy: selectedYear !== 'all' ? selectedYear : targetProgressionYear,
        };
      }

      const res = await api.post(`/training/programs/${program._id}/assign`, payload);
      if (res.data.success) {
        const { newlyEnrolled, alreadyEnrolled, totalTargeted } = res.data.data;
        setFeedback({
          type: 'success',
          message: `Successfully enrolled ${newlyEnrolled} students (${alreadyEnrolled} already enrolled, ${totalTargeted} targeted) into Year ${targetProgressionYear} training curriculum.`,
        });
        setSelectedStudentIds([]);
        await loadEnrolledStudents();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to assign students to program',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenroll = async (studentId: string) => {
    if (!confirm('Remove this student from training program enrollment?')) return;
    try {
      const res = await api.delete(`/training/programs/${program._id}/enrollments/${studentId}`);
      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Student removed from program' });
        await loadEnrolledStudents();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to unenroll student' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {program.title}
                </h3>
                {isInterdepartment && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center space-x-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Interdepartment</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Code: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{program.code}</span> • Target Years: {program.targetYears?.join(', ')}
                {program.targetBatchIds && program.targetBatchIds.length > 0 && (
                  <span> • Target Batches: {program.targetBatchIds.map((b: any) => typeof b === 'string' ? 'Batch' : b.name).join(', ')}</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`m-4 p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300'
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 space-x-4 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('assign')}
            className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'assign'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign New Students / Cohort</span>
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'enrolled'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Currently Enrolled ({enrolledStudents.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'assign' && (
            <>
              {/* Assignment Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Enrollment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('selective')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'selective'
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs">Selective Students</div>
                    <div className="text-[10px] text-slate-400 font-normal">Pick specific students by batch & class</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('batch')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'batch'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs">Entire Batch (Cohort)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Assign all batch students for final year</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('section')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'section'
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs">Entire Class Section</div>
                    <div className="text-[10px] text-slate-400 font-normal">Enroll whole section (e.g. IV CSE A)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('department')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'department'
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs">
                      {isInterdepartment ? 'Interdepartment Cohort' : 'Department Cohort'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">All students in target department(s)</div>
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Student Batch
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="">All Batches</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        Batch {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Department
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Current Year of Study
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="all">All / Any Years (Batch-Wide)</option>
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>

                {mode === 'section' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Class Section
                    </label>
                    <select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      {sections.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.displayName || `Section ${s.section}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Informative Banner for Batch Mode or Batch Progression */}
              {mode === 'batch' && (
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-950 dark:text-indigo-200">
                      Batch-Based Progression Assignment:
                    </span>
                    <p className="text-[11px] text-indigo-800/90 dark:text-indigo-300/90 mt-0.5 leading-relaxed">
                      Enrolls all active students belonging to <strong>{batches.find((b) => b._id === selectedBatchId)?.name ? `Batch ${batches.find((b) => b._id === selectedBatchId)?.name}` : 'the selected batch'}</strong> across target departments. Students (including those currently in 3rd year) will be registered for this program under their <strong>Final Year (Year {program.targetYears?.[0] || 4})</strong> curriculum.
                    </p>
                  </div>
                </div>
              )}

              {/* Selective Student Checklist */}
              {mode === 'selective' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student name, reg, roll..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Selected: <span className="text-brand-600 dark:text-brand-400">{selectedStudentIds.length}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Select / Clear All
                      </button>
                    </div>
                  </div>

                  {/* Student list */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingStudents ? (
                      <div className="p-6 text-center text-xs text-slate-400">Loading candidate students...</div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No students found matching filters.</div>
                    ) : (
                      filteredStudents.map((s) => {
                        const isSelected = selectedStudentIds.includes(s._id);
                        return (
                          <div
                            key={s._id}
                            onClick={() => toggleStudent(s._id)}
                            className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-brand-50/50 dark:bg-brand-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-brand-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {s.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Reg: {s.registerNumber || 'N/A'} • Roll: {s.rollNumber || 'N/A'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {s.batchId?.name && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                                  Batch {s.batchId.name}
                                </span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {s.departmentId?.code || 'CSE'}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                Curr: Yr {s.currentYearOfStudy}
                              </span>
                              {s.currentYearOfStudy < (program.targetYears?.[0] || 4) && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  ➔ Final Yr {program.targetYears?.[0] || 4}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ENROLLED STUDENTS */}
          {activeTab === 'enrolled' && (
            <div className="space-y-3">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {loadingEnrolled ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading enrolled students...</div>
                ) : enrolledStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No students enrolled in this program yet.</div>
                ) : (
                  enrolledStudents.map((item) => (
                    <div
                      key={item.enrollmentId}
                      className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.registerNumber} • Batch: {item.batch || '2023-2027'} • Enrolled for: Year {item.yearOfStudy} {item.currentYearOfStudy && item.currentYearOfStudy !== item.yearOfStudy ? `(Current: Year ${item.currentYearOfStudy})` : ''} • Sec {item.section}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {item.department}
                        </span>

                        <span className="text-[10px] font-semibold text-slate-500">
                          Att: {item.attendancePercentage}%
                        </span>

                        <button
                          type="button"
                          onClick={() => handleUnenroll(item.studentId)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                          title="Remove student from program"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="text-xs text-slate-500">
            {activeTab === 'assign' && mode === 'selective' && (
              <span>{selectedStudentIds.length} candidate(s) selected</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>

            {activeTab === 'assign' && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleAssign}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25 transition-all inline-flex items-center space-x-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Confirm & Enroll</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
