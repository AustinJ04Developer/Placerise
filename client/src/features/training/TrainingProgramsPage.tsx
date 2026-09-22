import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  UserX,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  Building,
  GraduationCap,
  UserPlus,
  Sparkles,
  CalendarPlus,
  X,
  Users,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { TrainingProgram, TrainingCategory, Batch } from '../../types';
import { useAuth } from '../../app/context/AuthContext';
import { CohortAssignmentModal } from './CohortAssignmentModal';

interface DepartmentItem {
  _id: string;
  code: string;
  name: string;
}

export const TrainingProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Helper for date inputs
  const toDateInputString = (date: any) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // Form state - Create
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTrainer, setNewTrainer] = useState('');
  const [newThreshold, setNewThreshold] = useState(75);
  const [newTargetYears, setNewTargetYears] = useState<number[]>([4]);
  const [newTargetDeptIds, setNewTargetDeptIds] = useState<string[]>([]);
  const [newTargetBatchIds, setNewTargetBatchIds] = useState<string[]>([]);
  const [newStartDate, setNewStartDate] = useState(toDateInputString(new Date()));
  const [newEndDate, setNewEndDate] = useState(toDateInputString(new Date(Date.now() + 14 * 86400000)));
  const [newDailyHours, setNewDailyHours] = useState<number>(2);
  const [newAutoGenerate, setNewAutoGenerate] = useState<boolean>(true);

  // Schedule & Off-Days / Gaps State (Create)
  const [newClassDays, setNewClassDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [newExcludedDates, setNewExcludedDates] = useState<string[]>([]);
  const [newSpecialActiveDates, setNewSpecialActiveDates] = useState<string[]>([]);
  const [newGapPeriods, setNewGapPeriods] = useState<{ startDate: string; endDate: string; reason?: string }[]>([]);
  const [tempOffDate, setTempOffDate] = useState<string>('');
  const [tempSpecialActiveDate, setTempSpecialActiveDate] = useState<string>('');
  const [tempGapStart, setTempGapStart] = useState<string>('');
  const [tempGapEnd, setTempGapEnd] = useState<string>('');
  const [tempGapReason, setTempGapReason] = useState<string>('');

  // Form state - Edit
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTrainer, setEditTrainer] = useState('');
  const [editThreshold, setEditThreshold] = useState(75);
  const [editStatus, setEditStatus] = useState('Scheduled');
  const [editTargetYears, setEditTargetYears] = useState<number[]>([4]);
  const [editTargetDeptIds, setEditTargetDeptIds] = useState<string[]>([]);
  const [editTargetBatchIds, setEditTargetBatchIds] = useState<string[]>([]);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editDailyHours, setEditDailyHours] = useState<number>(2);
  const [editExtendDays, setEditExtendDays] = useState<number>(0);

  // Schedule & Off-Days / Gaps State (Edit)
  const [editClassDays, setEditClassDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [editExcludedDates, setEditExcludedDates] = useState<string[]>([]);
  const [editSpecialActiveDates, setEditSpecialActiveDates] = useState<string[]>([]);
  const [editGapPeriods, setEditGapPeriods] = useState<{ startDate: string; endDate: string; reason?: string }[]>([]);
  const [editRegenerateSessions, setEditRegenerateSessions] = useState<boolean>(false);
  const [editTempOffDate, setEditTempOffDate] = useState<string>('');
  const [editTempSpecialActiveDate, setEditTempSpecialActiveDate] = useState<string>('');
  const [editTempGapStart, setEditTempGapStart] = useState<string>('');
  const [editTempGapEnd, setEditTempGapEnd] = useState<string>('');
  const [editTempGapReason, setEditTempGapReason] = useState<string>('');

  // Helper for computing active class days and excluded gap dates
  const calculateScheduleMetrics = (
    start: string,
    end: string,
    classDays: number[],
    excludedDates: string[],
    gapPeriods: { startDate: string; endDate: string }[],
    specialActiveDates: string[] = []
  ) => {
    if (!start || !end) return { totalDays: 0, classDaysCount: 0, offDaysCount: 0 };
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) {
      return { totalDays: 0, classDaysCount: 0, offDaysCount: 0 };
    }

    const exSet = new Set(excludedDates);
    const specialSet = new Set(specialActiveDates);
    const parsedGaps = (gapPeriods || [])
      .map((g) => ({
        start: new Date(g.startDate),
        end: new Date(g.endDate),
      }))
      .filter((g) => !isNaN(g.start.getTime()) && !isNaN(g.end.getTime()));

    let total = 0;
    let classes = 0;
    let off = 0;

    const curr = new Date(s);
    while (curr <= e) {
      total++;
      const dayOfWeek = curr.getDay();
      const dateStr = curr.toISOString().split('T')[0];

      let isOff = false;
      // Special active dates (e.g. Sunday or makeup session) override weekday & gap off-days
      if (specialSet.has(dateStr)) {
        isOff = false;
      } else if (!classDays.includes(dayOfWeek)) {
        isOff = true;
      } else if (exSet.has(dateStr)) {
        isOff = true;
      } else {
        for (const g of parsedGaps) {
          if (curr >= g.start && curr <= g.end) {
            isOff = true;
            break;
          }
        }
      }

      if (isOff) {
        off++;
      } else {
        classes++;
      }
      curr.setDate(curr.getDate() + 1);
    }

    return { totalDays: total, classDaysCount: classes, offDaysCount: off };
  };

  // Form state - Duration Extension Modal
  const [extendingProgram, setExtendingProgram] = useState<TrainingProgram | null>(null);
  const [extendDays, setExtendDays] = useState<number>(2);
  const [extendDailyHours, setExtendDailyHours] = useState<number>(2);
  const [extendRemarks, setExtendRemarks] = useState<string>('Topics Drill & Doubt Clearing');
  const [isExtending, setIsExtending] = useState<boolean>(false);

  // Form state - Delete
  const [deletingProgram, setDeletingProgram] = useState<TrainingProgram | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form state - Cohort Assignment
  const [assigningProgram, setAssigningProgram] = useState<TrainingProgram | null>(null);

  // Bulk CSV Import State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importDeptId, setImportDeptId] = useState<string>('');
  const [importBatchId, setImportBatchId] = useState<string>('');
  const [importTargetYears, setImportTargetYears] = useState<number[]>([4]);
  const [importCategoryId, setImportCategoryId] = useState<string>('');
  const [importDailyHours, setImportDailyHours] = useState<number>(2);
  const [importThreshold, setImportThreshold] = useState<number>(75);
  const [importIncludeSundays, setImportIncludeSundays] = useState<boolean>(false);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [parsedPrograms, setParsedPrograms] = useState<any[]>([]);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [importError, setImportError] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    skippedList: any[];
  } | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string>('');

  const { role, user } = useAuth();
  const navigate = useNavigate();

  const userDeptId =
    user?.departmentId && typeof user.departmentId === 'object'
      ? (user.departmentId as any)._id
      : (user?.departmentId as string) || '';

  const isHOD = role === 'hod';

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const [progRes, catRes, deptRes, batchRes] = await Promise.all([
        api.get('/training/programs'),
        api.get('/training/categories'),
        api.get('/academics/departments'),
        api.get('/academics/batches'),
      ]);
      if (progRes.data.success) setPrograms(progRes.data.data);
      if (catRes.data.success) {
        setCategories(catRes.data.data);
        if (catRes.data.data.length > 0 && !newCategory) setNewCategory(catRes.data.data[0]._id);
      }
      if (deptRes.data.success && deptRes.data.data.length > 0) {
        setDepartments(deptRes.data.data);
        if (role === 'hod' && userDeptId) {
          setNewTargetDeptIds([userDeptId]);
          setSelectedDepartment(userDeptId);
        } else if (newTargetDeptIds.length === 0) {
          setNewTargetDeptIds([deptRes.data.data[0]._id]);
        }
      }
      if (batchRes.data.success && batchRes.data.data.length > 0) {
        setBatches(batchRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load training programs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const toggleCreateYear = (yr: number) => {
    setNewTargetYears((prev) =>
      prev.includes(yr) ? (prev.length > 1 ? prev.filter((y) => y !== yr) : prev) : [...prev, yr].sort()
    );
  };

  const toggleCreateDept = (deptId: string) => {
    setNewTargetDeptIds((prev) =>
      prev.includes(deptId)
        ? (prev.length > 1 ? prev.filter((d) => d !== deptId) : prev)
        : [...prev, deptId]
    );
  };

  const toggleCreateBatch = (batchId: string) => {
    setNewTargetBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((b) => b !== batchId) : [...prev, batchId]
    );
  };

  const toggleEditYear = (yr: number) => {
    setEditTargetYears((prev) =>
      prev.includes(yr) ? (prev.length > 1 ? prev.filter((y) => y !== yr) : prev) : [...prev, yr].sort()
    );
  };

  const toggleEditDept = (deptId: string) => {
    setEditTargetDeptIds((prev) =>
      prev.includes(deptId)
        ? (prev.length > 1 ? prev.filter((d) => d !== deptId) : prev)
        : [...prev, deptId]
    );
  };

  const toggleEditBatch = (batchId: string) => {
    setEditTargetBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((b) => b !== batchId) : [...prev, batchId]
    );
  };

  // Helper to calculate next Sunday
  const getNextSunday = (fromDateStr?: string): string => {
    const base = fromDateStr ? new Date(fromDateStr) : new Date();
    if (isNaN(base.getTime())) return '';
    const d = new Date(base);
    const day = d.getDay();
    const daysUntilSunday = day === 0 ? 7 : (7 - day);
    d.setDate(d.getDate() + daysUntilSunday);
    return d.toISOString().split('T')[0];
  };

  // Schedule & Off-Days Handlers - Create
  const toggleNewClassDay = (day: number) => {
    setNewClassDays((prev) =>
      prev.includes(day)
        ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev)
        : [...prev, day].sort()
    );
  };

  const addNewOffDate = () => {
    if (!tempOffDate) return;
    if (!newExcludedDates.includes(tempOffDate)) {
      setNewExcludedDates((prev) => [...prev, tempOffDate].sort());
    }
    setTempOffDate('');
  };

  const removeNewOffDate = (dateStr: string) => {
    setNewExcludedDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const addNewSpecialActiveDate = (customDate?: string) => {
    const target = customDate || tempSpecialActiveDate;
    if (!target) return;
    if (!newSpecialActiveDates.includes(target)) {
      setNewSpecialActiveDates((prev) => [...prev, target].sort());
    }
    setTempSpecialActiveDate('');
  };

  const removeNewSpecialActiveDate = (dateStr: string) => {
    setNewSpecialActiveDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const addNewGapPeriod = () => {
    if (!tempGapStart || !tempGapEnd) return;
    setNewGapPeriods((prev) => [
      ...prev,
      { startDate: tempGapStart, endDate: tempGapEnd, reason: tempGapReason.trim() },
    ]);
    setTempGapStart('');
    setTempGapEnd('');
    setTempGapReason('');
  };

  const removeNewGapPeriod = (idx: number) => {
    setNewGapPeriods((prev) => prev.filter((_, i) => i !== idx));
  };

  // Schedule & Off-Days Handlers - Edit
  const toggleEditClassDay = (day: number) => {
    setEditClassDays((prev) =>
      prev.includes(day)
        ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev)
        : [...prev, day].sort()
    );
  };

  const addEditOffDate = () => {
    if (!editTempOffDate) return;
    if (!editExcludedDates.includes(editTempOffDate)) {
      setEditExcludedDates((prev) => [...prev, editTempOffDate].sort());
    }
    setEditTempOffDate('');
  };

  const removeEditOffDate = (dateStr: string) => {
    setEditExcludedDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const addEditSpecialActiveDate = (customDate?: string) => {
    const target = customDate || editTempSpecialActiveDate;
    if (!target) return;
    if (!editSpecialActiveDates.includes(target)) {
      setEditSpecialActiveDates((prev) => [...prev, target].sort());
    }
    setEditTempSpecialActiveDate('');
  };

  const removeEditSpecialActiveDate = (dateStr: string) => {
    setEditSpecialActiveDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const addEditGapPeriod = () => {
    if (!editTempGapStart || !editTempGapEnd) return;
    setEditGapPeriods((prev) => [
      ...prev,
      { startDate: editTempGapStart, endDate: editTempGapEnd, reason: editTempGapReason.trim() },
    ]);
    setEditTempGapStart('');
    setEditTempGapEnd('');
    setEditTempGapReason('');
  };

  const removeEditGapPeriod = (idx: number) => {
    setEditGapPeriods((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const academicYearsRes = await api.get('/academics/academic-years');
      const currentYear = academicYearsRes.data.data.find((y: any) => y.isCurrent) || academicYearsRes.data.data[0];

      const res = await api.post('/training/programs', {
        title: newTitle,
        code: newCode,
        categoryId: newCategory,
        academicYearId: currentYear._id,
        targetYears: newTargetYears.length > 0 ? newTargetYears : [4],
        targetBatchIds: newTargetBatchIds,
        targetDepartmentIds: newTargetDeptIds.length > 0 ? newTargetDeptIds : [departments[0]._id],
        targetSections: ['A'],
        trainerName: newTrainer,
        startDate: new Date(newStartDate),
        endDate: new Date(newEndDate),
        classDays: newClassDays,
        excludedDates: newExcludedDates,
        specialActiveDates: newSpecialActiveDates,
        gapPeriods: newGapPeriods,
        dailyHours: Number(newDailyHours) || 2,
        autoGenerateSessions: newAutoGenerate,
        status: 'Scheduled',
        minAttendanceThreshold: Number(newThreshold),
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewCode('');
        setNewTrainer('');
        setNewTargetBatchIds([]);
        setNewExcludedDates([]);
        setNewSpecialActiveDates([]);
        setNewGapPeriods([]);
        fetchPrograms();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const openImportModal = () => {
    const deptId =
      role === 'hod' && userDeptId
        ? userDeptId
        : selectedDepartment !== 'all' && selectedDepartment !== 'interdepartment'
        ? selectedDepartment
        : departments[0]?._id ?? '';
    setImportDeptId(deptId);
    setImportBatchId(batches[0]?._id ?? '');
    setImportTargetYears([4]);
    setImportCategoryId(categories[0]?._id ?? '');
    setImportDailyHours(2);
    setImportThreshold(75);
    setImportIncludeSundays(false);
    setCsvFileName('');
    setParsedPrograms([]);
    setCsvWarnings([]);
    setImportError('');
    setImportResult(null);
    setShowImportModal(true);
  };

  const toggleImportYear = (yr: number) => {
    setImportTargetYears((prev) =>
      prev.includes(yr) ? (prev.length > 1 ? prev.filter((y) => y !== yr) : prev) : [...prev, yr].sort()
    );
  };

  const downloadSampleCsv = () => {
    const deptCode = departments.find((d) => d._id === importDeptId)?.code || 'CSE';
    const sampleHeaders = [
      'Title',
      'Code',
      'Category',
      'TrainerName',
      'TrainerEmail',
      'TrainerOrganization',
      'StartDate',
      'EndDate',
      'TargetYears',
      'DailyHours',
      'MinAttendanceThreshold',
      'IncludeSundays',
      'Description',
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + sampleHeaders.join(',') + '\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `training_programs_${deptCode}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileUpload = (file: File) => {
    if (!file) return;
    setCsvFileName(file.name);
    setImportError('');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      parseCsvData(text);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (csvText: string) => {
    const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (rawLines.length < 2) {
      setImportError('CSV file must have a header row and at least one program data row.');
      return;
    }

    const splitCsvRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitCsvRow(rawLines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const titleIdx = headers.findIndex((h) => h.includes('title') || h === 'name' || h.includes('programname'));
    const codeIdx = headers.findIndex((h) => h.includes('code'));
    const catIdx = headers.findIndex((h) => h.includes('category') || h.includes('track'));
    const trainerIdx = headers.findIndex((h) => h.includes('trainer') || h.includes('instructor') || h.includes('faculty'));
    const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
    const orgIdx = headers.findIndex((h) => h.includes('org') || h.includes('vendor') || h.includes('company'));
    const startIdx = headers.findIndex((h) => h.includes('start'));
    const endIdx = headers.findIndex((h) => h.includes('end'));
    const yearsIdx = headers.findIndex((h) => h.includes('year') || h.includes('targetyear') || h.includes('targetyears'));
    const hoursIdx = headers.findIndex((h) => h.includes('hour') || h.includes('dailyhour'));
    const threshIdx = headers.findIndex((h) => h.includes('thresh') || h.includes('attendance') || h.includes('minattendance'));
    const sundayIdx = headers.findIndex((h) => h.includes('sun') || h.includes('includesunday'));
    const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('syllabus'));

    if (titleIdx === -1 || codeIdx === -1 || trainerIdx === -1 || startIdx === -1 || endIdx === -1) {
      setImportError(
        'CSV must contain required headers: Title, Code, TrainerName, StartDate, and EndDate.'
      );
      return;
    }

    const rows: any[] = [];
    const warnings: string[] = [];
    const seenCodes = new Set<string>();

    for (let i = 1; i < rawLines.length; i++) {
      const cols = splitCsvRow(rawLines[i]);
      if (cols.length <= 1 && !cols[0]) continue;

      const title = cols[titleIdx]?.trim() || '';
      const code = cols[codeIdx]?.trim().toUpperCase() || '';
      const trainerName = cols[trainerIdx]?.trim() || '';
      const rawStart = cols[startIdx]?.trim() || '';
      const rawEnd = cols[endIdx]?.trim() || '';

      if (!title || !code || !trainerName) {
        warnings.push(`Row ${i}: Missing title, code, or trainer name.`);
        continue;
      }

      if (seenCodes.has(code)) {
        warnings.push(`Row ${i}: Duplicate code "${code}" in this file.`);
        continue;
      }
      seenCodes.add(code);

      const startDate = new Date(rawStart);
      const endDate = new Date(rawEnd);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        warnings.push(`Row ${i} (${code}): Invalid Start or End Date.`);
        continue;
      }

      if (startDate > endDate) {
        warnings.push(`Row ${i} (${code}): Start Date is after End Date.`);
        continue;
      }

      const category = catIdx !== -1 && cols[catIdx] ? cols[catIdx].trim() : '';
      const trainerEmail = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx].trim() : '';
      const trainerOrganization = orgIdx !== -1 && cols[orgIdx] ? cols[orgIdx].trim() : '';
      const targetYearsStr = yearsIdx !== -1 && cols[yearsIdx] ? cols[yearsIdx].trim() : '';
      const dailyHours = hoursIdx !== -1 && cols[hoursIdx] ? Number(cols[hoursIdx]) : importDailyHours;
      const minAttendanceThreshold = threshIdx !== -1 && cols[threshIdx] ? Number(cols[threshIdx]) : importThreshold;
      const includeSundays =
        sundayIdx !== -1 && cols[sundayIdx]
          ? ['true', 'yes', '1'].includes(cols[sundayIdx].toLowerCase().trim())
          : importIncludeSundays;
      const description = descIdx !== -1 && cols[descIdx] ? cols[descIdx].trim() : '';

      rows.push({
        title,
        code,
        category: category || undefined,
        trainerName,
        trainerEmail: trainerEmail || undefined,
        trainerOrganization: trainerOrganization || undefined,
        startDate: rawStart,
        endDate: rawEnd,
        targetYears: targetYearsStr || undefined,
        dailyHours: !isNaN(dailyHours) && dailyHours > 0 ? dailyHours : 2,
        minAttendanceThreshold: !isNaN(minAttendanceThreshold) ? minAttendanceThreshold : 75,
        includeSundays,
        description: description || undefined,
      });
    }

    setParsedPrograms(rows);
    setCsvWarnings(warnings);
  };

  const handleConfirmBulkImport = async () => {
    if (parsedPrograms.length === 0) return;
    if (!importDeptId) {
      setImportError('Please select a Target Department.');
      return;
    }

    setIsImporting(true);
    setImportError('');
    try {
      const res = await api.post('/training/programs/bulk-import', {
        programs: parsedPrograms,
        defaultParams: {
          departmentId: importDeptId,
          batchId: importBatchId || undefined,
          targetYears: importTargetYears,
          categoryId: importCategoryId || undefined,
          dailyHours: importDailyHours,
          minAttendanceThreshold: importThreshold,
          includeSundays: importIncludeSundays,
        },
      });

      if (res.data.success) {
        setImportResult(res.data.data);
        fetchPrograms();
        setBulkSuccessMsg(
          `Successfully imported ${res.data.data.importedCount} training programs with auto-generated sessions!`
        );
        setTimeout(() => setBulkSuccessMsg(''), 6000);
      }
    } catch (err: any) {
      setImportError(err.response?.data?.message || err.message || 'Failed to bulk import programs');
    } finally {
      setIsImporting(false);
    }
  };

  const openEditModal = (prog: TrainingProgram) => {
    setEditingProgram(prog);
    setEditTitle(prog.title);
    setEditCode(prog.code);
    setEditCategory(typeof prog.categoryId === 'string' ? prog.categoryId : (prog.categoryId as any)._id);
    setEditTrainer(prog.trainerName);
    setEditThreshold(prog.minAttendanceThreshold || 75);
    setEditStatus(prog.status || 'Scheduled');
    setEditTargetYears(prog.targetYears && prog.targetYears.length > 0 ? prog.targetYears : [4]);
    setEditStartDate(toDateInputString(prog.startDate));
    setEditEndDate(toDateInputString(prog.endDate));
    setEditDailyHours(2);
    setEditExtendDays(0);
    setEditClassDays(prog.classDays && prog.classDays.length > 0 ? prog.classDays : [1, 2, 3, 4, 5, 6]);
    setEditExcludedDates((prog.excludedDates || []).map((d: any) => toDateInputString(d)));
    setEditSpecialActiveDates((prog.specialActiveDates || []).map((d: any) => toDateInputString(d)));
    setEditGapPeriods(
      (prog.gapPeriods || []).map((g: any) => ({
        startDate: toDateInputString(g.startDate),
        endDate: toDateInputString(g.endDate),
        reason: g.reason || '',
      }))
    );
    setEditRegenerateSessions(false);

    const deptIds = (prog.targetDepartmentIds || []).map((d: any) =>
      typeof d === 'string' ? d : d._id
    );
    setEditTargetDeptIds(deptIds.length > 0 ? deptIds : departments.slice(0, 1).map((d) => d._id));

    const batchIds = (prog.targetBatchIds || []).map((b: any) =>
      typeof b === 'string' ? b : b._id
    );
    setEditTargetBatchIds(batchIds);
  };

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;

    try {
      const res = await api.patch(`/training/programs/${editingProgram._id}`, {
        title: editTitle,
        code: editCode,
        categoryId: editCategory,
        trainerName: editTrainer,
        minAttendanceThreshold: Number(editThreshold),
        status: editStatus,
        targetYears: editTargetYears.length > 0 ? editTargetYears : [4],
        targetBatchIds: editTargetBatchIds,
        targetDepartmentIds: editTargetDeptIds.length > 0 ? editTargetDeptIds : undefined,
        startDate: editStartDate ? new Date(editStartDate) : undefined,
        endDate: editEndDate ? new Date(editEndDate) : undefined,
        classDays: editClassDays,
        excludedDates: editExcludedDates,
        specialActiveDates: editSpecialActiveDates,
        gapPeriods: editGapPeriods,
        dailyHours: Number(editDailyHours) || 2,
        extendDays: Number(editExtendDays) > 0 ? Number(editExtendDays) : undefined,
        regenerateSessions: editRegenerateSessions,
      });

      if (res.data.success) {
        setEditingProgram(null);
        fetchPrograms();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleExtendDuration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingProgram) return;
    setIsExtending(true);
    try {
      const res = await api.post(`/training/programs/${extendingProgram._id}/extend`, {
        extendDays: Number(extendDays),
        dailyHours: Number(extendDailyHours),
        remarks: extendRemarks.trim(),
      });
      if (res.data.success) {
        alert(`Duration extended! ${res.data.data.addedSessions.length} new attendance day(s) automatically added.`);
        setExtendingProgram(null);
        fetchPrograms();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setIsExtending(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!deletingProgram) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/training/programs/${deletingProgram._id}`);
      if (res.data.success) {
        setDeletingProgram(null);
        fetchPrograms();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.trainerName.toLowerCase().includes(search.toLowerCase());

    const catId = typeof p.categoryId === 'string' ? p.categoryId : (p.categoryId as any)._id;
    const matchesCategory = selectedCategory === 'all' || catId === selectedCategory;

    // Filter by year
    const matchesYear =
      selectedYear === 'all' || (p.targetYears && p.targetYears.includes(Number(selectedYear)));

    // Filter by department
    const progDeptIds = (p.targetDepartmentIds || []).map((d: any) =>
      typeof d === 'string' ? d : d._id
    );
    const matchesDept =
      selectedDepartment === 'all' ||
      (selectedDepartment === 'interdepartment'
        ? progDeptIds.length > 1
        : progDeptIds.length === 0 || progDeptIds.includes(selectedDepartment));

    // Filter by batch
    const progBatchIds = (p.targetBatchIds || []).map((b: any) =>
      typeof b === 'string' ? b : b._id
    );
    const matchesBatch =
      selectedBatch === 'all' ||
      progBatchIds.includes(selectedBatch);

    return matchesSearch && matchesCategory && matchesYear && matchesDept && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <span>Placement Training Programs</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Configure target year, department, batch, and attendance thresholds across the 4-year curriculum.
          </p>
        </div>

        {(role === 'placement_officer' || role === 'faculty' || role === 'hod' || role === 'class_incharge') && (
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={openImportModal}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Program</span>
            </button>
          </div>
        )}
      </div>

      {/* Bulk Import Success Alert Banner */}
      {bulkSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{bulkSuccessMsg}</span>
          </div>
          <button onClick={() => setBulkSuccessMsg('')} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg">
            <X className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programs, code, trainer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Department Filter */}
            <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={role === 'hod'}
                className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none disabled:opacity-85"
              >
                {role !== 'hod' && <option value="all">All Departments</option>}
                {role !== 'hod' && <option value="interdepartment">⚡ Interdepartment Programs</option>}
                {departments
                  .filter((d) => (role === 'hod' && userDeptId ? d._id === userDeptId : true))
                  .map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.code} - {d.name} {role === 'hod' ? '(HOD Department)' : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Target Year Filter */}
            <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
              >
                <option value="all">All Years</option>
                <option value="1">Year 1 (Freshman)</option>
                <option value="2">Year 2 (Sophomore)</option>
                <option value="3">Year 3 (Pre-Final)</option>
                <option value="4">Year 4 (Final Year)</option>
              </select>
            </div>

            {/* Batch Filter */}
            <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    Batch {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Tracks ({programs.length})
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategory(c._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                selectedCategory === c._id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: c.color || '#3b82f6' }}
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Program Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No training programs found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting another category track, or clearing department filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPrograms.map((prog) => {
            const cat =
              typeof prog.categoryId === 'string'
                ? categories.find((c) => c._id === prog.categoryId)
                : (prog.categoryId as any);

            const deptNames =
              prog.targetDepartmentIds && prog.targetDepartmentIds.length > 0
                ? prog.targetDepartmentIds
                    .map((d: any) => (typeof d === 'string' ? departments.find((dept) => dept._id === d)?.code || d : d.code))
                    .join(', ')
                : 'All Depts';

            return (
              <div
                key={prog._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: cat?.color || '#0284c7' }}
                      >
                        {cat?.name || 'General'}
                      </span>
                      {prog.targetDepartmentIds && prog.targetDepartmentIds.length > 1 && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Interdepartment</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {prog.code}
                      </span>
                      {(role === 'placement_officer' || role === 'faculty' || role === 'hod' || role === 'class_incharge') && (
                        <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(prog);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Program"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {role === 'placement_officer' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingProgram(prog);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Delete Program"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Trainer: <strong className="text-slate-700 dark:text-slate-300">{prog.trainerName}</strong>
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <div className="flex justify-between">
                      <span className="flex items-center space-x-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>Target Year:</span>
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Year {prog.targetYears?.join(', ') || 'All'}
                      </span>
                    </div>

                    {prog.targetBatchIds && prog.targetBatchIds.length > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-indigo-950 dark:text-indigo-300 font-medium">Target Batch:</span>
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[160px]">
                          {prog.targetBatchIds
                            .map((b: any) => (typeof b === 'string' ? 'Batch' : b.name))
                            .join(', ')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Department:</span>
                      </span>
                      <span className="font-semibold text-brand-600 dark:text-brand-400 truncate max-w-[160px]">
                        {deptNames}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Schedule:</span>
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(prog.startDate).toLocaleDateString()} – {new Date(prog.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {((prog.excludedDates && prog.excludedDates.length > 0) ||
                      (prog.gapPeriods && prog.gapPeriods.length > 0) ||
                      (prog.classDays && prog.classDays.length < 6)) && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-medium">
                          <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                          <span>Intervals & Gaps:</span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60">
                          {prog.gapPeriods && prog.gapPeriods.length > 0
                            ? `${prog.gapPeriods.length} Gap Period${prog.gapPeriods.length > 1 ? 's' : ''}`
                            : ''}
                          {prog.gapPeriods && prog.gapPeriods.length > 0 && prog.excludedDates && prog.excludedDates.length > 0
                            ? ' • '
                            : ''}
                          {prog.excludedDates && prog.excludedDates.length > 0
                            ? `${prog.excludedDates.length} Off-Day${prog.excludedDates.length > 1 ? 's' : ''}`
                            : ''}
                          {(!prog.gapPeriods || prog.gapPeriods.length === 0) &&
                          (!prog.excludedDates || prog.excludedDates.length === 0)
                            ? `${prog.classDays?.length || 6} Days/Wk`
                            : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Planned Duration:</span>
                      </span>
                      <span className="font-semibold text-brand-600 dark:text-brand-400">
                        {prog.totalPlannedHours || 40} hrs
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Threshold:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        &ge; {prog.minAttendanceThreshold || 75}%
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span
                        className={`font-semibold ${
                          prog.status === 'Completed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : prog.status === 'Cancelled'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {prog.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Links: Role Scoped */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  {role === 'student' ? (
                    <div className="w-full flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                        <span>Curriculum Module</span>
                      </span>
                      <button
                        onClick={() => navigate('/students/me/journey')}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        <span>Check My Journey</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setAssigningProgram(prog)}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700"
                          title="Assign selective students or class cohort"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <button
                          onClick={() => navigate('/training/reverse-query')}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Reverse Query</span>
                        </button>
                        {(role === 'placement_officer' || role === 'faculty' || role === 'hod' || role === 'class_incharge') && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                              onClick={() => setExtendingProgram(prog)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                              title="Extend duration & auto-add attendance days"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>Extend</span>
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => navigate('/academics/classes')}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      >
                        <span>Class Roster</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Program Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Create New Training Program
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure curriculum, target cohorts, calendar schedule, and attendance benchmarks.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProgram} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5">
                {/* 1. Basic Info Card */}
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      1. Curriculum & Basic Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Program Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Next.js Full Stack Sprint"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Program Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="TR-Y4-NEXT"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Training Category Track *
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Trainer / Lead Organization *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Industry Architect"
                        value={newTrainer}
                        onChange={(e) => setNewTrainer(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300">
                          Min Attendance Benchmark
                        </label>
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                          {newThreshold}%
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newThreshold}
                        onChange={(e) => setNewThreshold(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Target Cohorts Card */}
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      2. Target Cohort & Audience Scope
                    </h3>
                  </div>

                  {/* Target Year of Study */}
                  <div>
                    <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                      Target Year(s) of Study *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => toggleCreateYear(yr)}
                          className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                            newTargetYears.includes(yr)
                              ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          Year {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Academic Department(s) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Target Academic Department(s) *
                      </label>
                      {role === 'hod' && (
                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                          Locked to HOD Department
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {departments
                        .filter((d) => (role === 'hod' && userDeptId ? d._id === userDeptId : true))
                        .map((d) => (
                          <button
                            key={d._id}
                            type="button"
                            disabled={role === 'hod'}
                            onClick={() => toggleCreateDept(d._id)}
                            className={`py-1.5 px-3 rounded-xl font-semibold border transition-all ${
                              newTargetDeptIds.includes(d._id)
                                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {d.code} - {d.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Target Batch(es) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Target Batch(es)
                      </label>
                      <span className="text-[10px] text-slate-400">Cohort progression targeting</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {batches.map((b) => (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => toggleCreateBatch(b._id)}
                          className={`py-1.5 px-3 rounded-xl font-semibold border transition-all ${
                            newTargetBatchIds.includes(b._id)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          Batch {b.name}
                        </button>
                      ))}
                      {batches.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">No batches created yet</span>
                      )}
                    </div>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1.5">
                      💡 By allocating target batch(es), students currently in earlier years will automatically have this program assigned in their final year curriculum.
                    </p>
                  </div>
                </div>

                {/* 3. Schedule & Duration Configuration Card */}
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        3. Schedule, Off-Days & Gaps Allocation
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      Auto-Calculated Calendar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Daily Session Hours
                      </label>
                      <input
                        type="number"
                        min={0.5}
                        max={12}
                        step={0.5}
                        value={newDailyHours}
                        onChange={(e) => setNewDailyHours(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAutoGenerate}
                        onChange={(e) => setNewAutoGenerate(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Auto-generate individual session attendance dates on program creation
                      </span>
                    </label>
                  </div>

                  {/* Active Class Weekdays */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Active Class Weekdays (Click to toggle)
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-400">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setNewClassDays([1, 2, 3, 4, 5])}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                        >
                          Mon–Fri
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewClassDays([1, 2, 3, 4, 5, 6])}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                        >
                          Mon–Sat
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewClassDays([0, 1, 2, 3, 4, 5, 6])}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          title="Every Sunday is a regular class day"
                        >
                          All 7 Days (Sun Incl)
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {[
                        { day: 1, label: 'Mon' },
                        { day: 2, label: 'Tue' },
                        { day: 3, label: 'Wed' },
                        { day: 4, label: 'Thu' },
                        { day: 5, label: 'Fri' },
                        { day: 6, label: 'Sat' },
                        { day: 0, label: 'Sun', isSun: true },
                      ].map((d) => (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => toggleNewClassDay(d.day)}
                          className={`py-2 rounded-xl font-bold border transition-all text-center text-xs ${
                            newClassDays.includes(d.day)
                              ? d.isSun
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-1 ring-amber-400'
                                : 'bg-brand-600 text-white border-brand-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {d.label} {d.isSun && newClassDays.includes(0) ? '★' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Class Days */}
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <label className="block font-semibold text-indigo-950 dark:text-indigo-200 text-xs">
                          Special Class Sessions (Occasional Sunday / Makeup Classes)
                        </label>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                          Schedule classes on specific Sundays without enabling weekly Sundays.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextSun = getNextSunday(newStartDate || new Date().toISOString().split('T')[0]);
                          if (nextSun) addNewSpecialActiveDate(nextSun);
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg shadow-xs whitespace-nowrap self-start sm:self-auto"
                      >
                        + Next Sunday
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={tempSpecialActiveDate}
                        onChange={(e) => setTempSpecialActiveDate(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => addNewSpecialActiveDate()}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold whitespace-nowrap"
                      >
                        + Add Class Day
                      </button>
                    </div>
                    {newSpecialActiveDates.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newSpecialActiveDates.map((dateStr) => {
                          const dt = new Date(dateStr);
                          const isSun = dt.getDay() === 0;
                          return (
                            <span
                              key={dateStr}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800"
                            >
                              <span>{dateStr} {isSun ? '(Sunday Class)' : '(Special Class)'}</span>
                              <button
                                type="button"
                                onClick={() => removeNewSpecialActiveDate(dateStr)}
                                className="hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Specific Off-Days & Extended Gaps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Specific Single Off-Days */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Single Day Off-Days (Holidays / College Events)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={tempOffDate}
                          onChange={(e) => setTempOffDate(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={addNewOffDate}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold whitespace-nowrap"
                        >
                          + Add
                        </button>
                      </div>
                      {newExcludedDates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {newExcludedDates.map((dateStr) => (
                            <span
                              key={dateStr}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60"
                            >
                              <span>{dateStr} (Off)</span>
                              <button
                                type="button"
                                onClick={() => removeNewOffDate(dateStr)}
                                className="hover:text-red-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Extended Gaps */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Multi-Day / Week Breaks (Exam Gaps, Vacation)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          placeholder="Gap Start"
                          value={tempGapStart}
                          onChange={(e) => setTempGapStart(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white"
                        />
                        <input
                          type="date"
                          placeholder="Gap End"
                          value={tempGapEnd}
                          onChange={(e) => setTempGapEnd(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Reason (e.g. Semester Exams)"
                          value={tempGapReason}
                          onChange={(e) => setTempGapReason(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={addNewGapPeriod}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold whitespace-nowrap"
                        >
                          + Add Gap
                        </button>
                      </div>
                      {newGapPeriods.length > 0 && (
                        <div className="space-y-1 pt-1 max-h-24 overflow-y-auto">
                          {newGapPeriods.map((gap, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-2 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-md text-[11px] text-amber-900 dark:text-amber-200"
                            >
                              <span>
                                {gap.startDate} to {gap.endDate} {gap.reason ? `(${gap.reason})` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeNewGapPeriod(idx)}
                                className="hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculated Schedule Preview */}
                  {(() => {
                    const metrics = calculateScheduleMetrics(
                      newStartDate,
                      newEndDate,
                      newClassDays,
                      newExcludedDates,
                      newGapPeriods,
                      newSpecialActiveDates
                    );
                    const totalHours = metrics.classDaysCount * (Number(newDailyHours) || 2);
                    return (
                      <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          <span className="font-bold text-brand-900 dark:text-brand-200">
                            Live Schedule Calculation
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 font-bold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                            {metrics.classDaysCount} Active Class Sessions
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {totalHours} Total Hours ({newDailyHours} hrs/day)
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 font-medium text-slate-500 border border-slate-200 dark:border-slate-800">
                            {metrics.offDaysCount} Non-Class Days Excluded
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Modal Sticky Footer (Always visible, never cut off!) */}
              <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Target: Year {newTargetYears.join(', ')} • {newThreshold}% Attendance Requirement</span>
                </div>
                <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Program</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Edit Modal */}
      {editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Edit Training Program
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modify curriculum details, cohort targeting, calendar dates, and session alignment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProgram(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateProgram} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5">
                {/* 1. Basic Info Card */}
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      1. Curriculum & Basic Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Program Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Program Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Training Category *
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Assigned Trainer *
                      </label>
                      <input
                        type="text"
                        required
                        value={editTrainer}
                        onChange={(e) => setEditTrainer(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Program Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Target Cohorts Card */}
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      2. Target Cohorts & Student Eligibility
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Target Year */}
                    <div>
                      <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                        Target Year(s) of Study *
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => toggleEditYear(yr)}
                            className={`py-2 px-2 rounded-xl font-bold border transition-all text-center text-xs ${
                              editTargetYears.includes(yr)
                                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            Year {yr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Attendance Threshold */}
                    <div>
                      <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                        Attendance Requirement (%) *
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(Number(e.target.value))}
                          className="w-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                        />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Minimum attendance percentage required to be eligible for placement drives.
                        </span>
                      </div>
                    </div>

                    {/* Target Departments */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300">
                          Target Department(s) *
                        </label>
                        {isHOD && (
                          <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md">
                            Locked to HOD Department
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {departments.map((d) => {
                          const isSelected = editTargetDeptIds.includes(d._id);
                          const isDisabled = isHOD && Boolean(userDeptId) && d._id !== userDeptId;
                          return (
                            <button
                              key={d._id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => toggleEditDept(d._id)}
                              className={`py-1.5 px-3 rounded-xl font-semibold border transition-all text-xs flex items-center space-x-1 ${
                                isSelected
                                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                                  : isDisabled
                                  ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <span>{d.name} ({d.code})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Target Batches */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300">
                          Target Batch(es)
                        </label>
                        <span className="text-[10px] text-slate-400">Cohort progression targeting</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {batches.map((b) => {
                          const isSelected = editTargetBatchIds.includes(b._id);
                          return (
                            <button
                              key={b._id}
                              type="button"
                              onClick={() => toggleEditBatch(b._id)}
                              className={`py-1.5 px-3 rounded-xl font-semibold border transition-all text-xs flex items-center space-x-1.5 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <span>Batch {b.name}</span>
                              {b.startYear && b.endYear && (
                                <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                  ({b.startYear}-{b.endYear})
                                </span>
                              )}
                            </button>
                          );
                        })}
                        {batches.length === 0 && (
                          <span className="text-xs text-slate-400 italic">No batches created yet</span>
                        )}
                      </div>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1.5">
                        💡 Assigning target batches allows pre-allocating courses so students currently in 3rd year are smoothly enrolled for their final year training.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Schedule, Off-Days & Gaps Allocation Card */}
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        3. Calendar Schedule, Off-Days & Gaps Allocation
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Configure intermittent schedules & breaks
                    </span>
                  </div>

                  {/* Dates & Daily Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Daily Session Hours
                      </label>
                      <input
                        type="number"
                        min={0.5}
                        max={12}
                        step={0.5}
                        value={editDailyHours}
                        onChange={(e) => setEditDailyHours(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Quick Extend (+ Extra Days)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={editExtendDays}
                        onChange={(e) => setEditExtendDays(Number(e.target.value))}
                        placeholder="0 (no extra days)"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  {/* Active Days of Week */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Regular Weekly Class Days
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-400">Quick Presets:</span>
                        <button
                          type="button"
                          onClick={() => setEditClassDays([1, 2, 3, 4, 5])}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Mon–Fri
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditClassDays([1, 2, 3, 4, 5, 6])}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Mon–Sat
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditClassDays([0, 1, 2, 3, 4, 5, 6])}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          title="Every Sunday is a regular class day"
                        >
                          All 7 Days (Sun Incl)
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {[
                        { day: 1, label: 'Mon' },
                        { day: 2, label: 'Tue' },
                        { day: 3, label: 'Wed' },
                        { day: 4, label: 'Thu' },
                        { day: 5, label: 'Fri' },
                        { day: 6, label: 'Sat' },
                        { day: 0, label: 'Sun', isSun: true },
                      ].map((d) => (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => toggleEditClassDay(d.day)}
                          className={`py-2 rounded-xl font-bold border transition-all text-center text-xs ${
                            editClassDays.includes(d.day)
                              ? d.isSun
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-1 ring-amber-400'
                                : 'bg-brand-600 text-white border-brand-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {d.label} {d.isSun && editClassDays.includes(0) ? '★' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Class Days (e.g. Occasional Sunday) */}
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block font-semibold text-indigo-950 dark:text-indigo-200">
                          Special Class Days (Occasional Sunday / Makeup Sessions)
                        </label>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                          Schedule classes on specific Sundays without enabling every weekly Sunday.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextSun = getNextSunday(editStartDate || new Date().toISOString().split('T')[0]);
                          if (nextSun) addEditSpecialActiveDate(nextSun);
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-xs whitespace-nowrap"
                        title="Quickly add the upcoming Sunday as a class day"
                      >
                        + Next Sunday
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editTempSpecialActiveDate}
                        onChange={(e) => setEditTempSpecialActiveDate(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => addEditSpecialActiveDate()}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold whitespace-nowrap"
                      >
                        + Add Special Day
                      </button>
                    </div>
                    {editSpecialActiveDates.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {editSpecialActiveDates.map((dateStr) => {
                          const dt = new Date(dateStr);
                          const isSun = dt.getDay() === 0;
                          return (
                            <span
                              key={dateStr}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800"
                            >
                              <span>{dateStr} {isSun ? '(Sunday Class)' : '(Special Session)'}</span>
                              <button
                                type="button"
                                onClick={() => removeEditSpecialActiveDate(dateStr)}
                                className="hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Single Off-Days & Multi-Day Gaps in a 2-column layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Specific Off-Days */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Specific Off-Days (Single Day Gaps / Holidays)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editTempOffDate}
                          onChange={(e) => setEditTempOffDate(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={addEditOffDate}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold whitespace-nowrap"
                        >
                          + Add
                        </button>
                      </div>
                      {editExcludedDates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editExcludedDates.map((dateStr) => (
                            <span
                              key={dateStr}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60"
                            >
                              <span>{dateStr} (Off)</span>
                              <button
                                type="button"
                                onClick={() => removeEditOffDate(dateStr)}
                                className="hover:text-red-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Extended Gaps */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Multi-Day / Week Breaks (Exam Gaps, Vacation)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          placeholder="Gap Start"
                          value={editTempGapStart}
                          onChange={(e) => setEditTempGapStart(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white"
                        />
                        <input
                          type="date"
                          placeholder="Gap End"
                          value={editTempGapEnd}
                          onChange={(e) => setEditTempGapEnd(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Reason (e.g. Semester Exams)"
                          value={editTempGapReason}
                          onChange={(e) => setEditTempGapReason(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={addEditGapPeriod}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold whitespace-nowrap"
                        >
                          + Add Gap
                        </button>
                      </div>
                      {editGapPeriods.length > 0 && (
                        <div className="space-y-1 pt-1 max-h-24 overflow-y-auto">
                          {editGapPeriods.map((gap, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-2 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-md text-[11px] text-amber-900 dark:text-amber-200"
                            >
                              <span>
                                {gap.startDate} to {gap.endDate} {gap.reason ? `(${gap.reason})` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeEditGapPeriod(idx)}
                                className="hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculated Schedule Preview */}
                  {(() => {
                    const metrics = calculateScheduleMetrics(
                      editStartDate,
                      editEndDate,
                      editClassDays,
                      editExcludedDates,
                      editGapPeriods,
                      editSpecialActiveDates
                    );
                    const totalHours = metrics.classDaysCount * (Number(editDailyHours) || 2);
                    return (
                      <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          <span className="font-bold text-brand-900 dark:text-brand-200">
                            Live Schedule Calculation
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 font-bold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                            {metrics.classDaysCount} Active Class Sessions
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {totalHours} Total Hours ({editDailyHours} hrs/day)
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 font-medium text-slate-500 border border-slate-200 dark:border-slate-800">
                            {metrics.offDaysCount} Non-Class Days Excluded
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Re-align future sessions checkbox */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editRegenerateSessions}
                        onChange={(e) => setEditRegenerateSessions(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        Re-align future attendance sessions to match updated off-days & gaps
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 ml-6.5">
                      Already marked / completed sessions will remain untouched.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer (Always visible, never cut off!) */}
              <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                  <span>Target: Year {editTargetYears.join(', ')} • {editThreshold}% Attendance Requirement</span>
                </div>
                <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setEditingProgram(null)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Duration Extension Modal */}
      {extendingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Extend Training Duration
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {extendingProgram.title} ({extendingProgram.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExtendingProgram(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExtendDuration} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Current Schedule:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {new Date(extendingProgram.startDate).toLocaleDateString()} – {new Date(extendingProgram.endDate).toLocaleDateString()}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Planned Hours:</span>
                  <strong className="text-brand-600 dark:text-brand-400">
                    {extendingProgram.totalPlannedHours || 40} hrs
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Trainer:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {extendingProgram.trainerName}
                  </strong>
                </div>
              </div>

              {/* Quick Day Extension Presets */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  Select Days to Extend *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 5, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                        extendDays === d
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      +{d} Day{d > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Custom Days Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Daily Session Hours
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    max={12}
                    step={0.5}
                    value={extendDailyHours}
                    onChange={(e) => setExtendDailyHours(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Extension Reason / Topics (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mock coding drills, Special doubt clearing..."
                  value={extendRemarks}
                  onChange={(e) => setExtendRemarks(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
                <strong>Automatic Attendance Days:</strong> Confirming will automatically schedule{' '}
                <strong>{extendDays}</strong> new attendance day session(s) ({extendDays * extendDailyHours} hours) starting from the day after current sessions.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isExtending}
                  onClick={() => setExtendingProgram(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>{isExtending ? 'Extending...' : 'Confirm Duration Extension'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-slate-900 dark:text-white mb-1">
              Delete Training Program?
            </h3>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-800 dark:text-slate-200">{deletingProgram.title}</strong>{' '}
              (<span className="font-mono">{deletingProgram.code}</span>)?
            </p>

            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-[11px] text-red-700 dark:text-red-300 mb-5 leading-relaxed">
              <strong>Caution:</strong> This will cascade delete all associated training sessions and student enrollments for this program.
            </div>

            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProgram(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProgram}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Program'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cohort Assignment & Selective Student Modal */}
      {assigningProgram && (
        <CohortAssignmentModal
          isOpen={!!assigningProgram}
          onClose={() => setAssigningProgram(null)}
          program={assigningProgram as any}
          onSuccess={fetchPrograms}
        />
      )}

      {/* Bulk CSV Import Programs Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bulk Import Training Programs (CSV)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a CSV file to register multiple programs, curriculums, and auto-generate sessions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
              {/* Section 1: Destination & Default Cohort Settings */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-brand-600" />
                    <span>Target Department & Cohort Defaults</span>
                  </h4>
                  {isHOD && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      HOD Department Locked
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Department */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Academic Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={importDeptId}
                      onChange={(e) => setImportDeptId(e.target.value)}
                      disabled={isHOD}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-brand-500 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Target Batch
                    </label>
                    <select
                      value={importBatchId}
                      onChange={(e) => setImportBatchId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">All Batches (Optional)</option>
                      {batches.map((b) => (
                        <option key={b._id} value={b._id}>
                          Batch {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Default Category */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Default Category
                    </label>
                    <select
                      value={importCategoryId}
                      onChange={(e) => setImportCategoryId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-brand-500"
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  {/* Target Academic Year */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Default Study Year(s)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      {[1, 2, 3, 4].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => toggleImportYear(yr)}
                          className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all ${
                            importTargetYears.includes(yr)
                              ? 'bg-brand-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          Yr {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Hours & Threshold */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Daily Hours
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        step="0.5"
                        value={importDailyHours}
                        onChange={(e) => setImportDailyHours(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Threshold %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={importThreshold}
                        onChange={(e) => setImportThreshold(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  {/* Sunday Class Option */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Default Class Days
                    </label>
                    <button
                      type="button"
                      onClick={() => setImportIncludeSundays(!importIncludeSundays)}
                      className={`w-full py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                        importIncludeSundays
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{importIncludeSundays ? 'All 7 Days (Sun Included)' : 'Mon–Sat (Standard)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: CSV Template & File Upload */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Template Info Card */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>CSV File Format</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Required columns: <strong>Title</strong>, <strong>Code</strong>, <strong>TrainerName</strong>, <strong>StartDate</strong>, <strong>EndDate</strong>.
                      Optional: <em>Category</em>, <em>TargetYears</em>, <em>DailyHours</em>, <em>MinAttendanceThreshold</em>, <em>IncludeSundays</em>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template (.csv)</span>
                  </button>
                </div>

                {/* Drag & Drop Upload Card */}
                <div className="md:col-span-2 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/30 transition-all">
                  <input
                    type="file"
                    id="program-csv-upload"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleCsvFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {csvFileName ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                        <FileText className="w-4 h-4" />
                        <span>{csvFileName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCsvFileName('');
                            setParsedPrograms([]);
                            setCsvWarnings([]);
                            setImportResult(null);
                          }}
                          className="hover:text-red-500 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {parsedPrograms.length} valid programs detected.
                      </p>
                    </div>
                  ) : (
                    <label
                      htmlFor="program-csv-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-xs border border-slate-200 dark:border-slate-700">
                        <Upload className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-brand-600 dark:text-brand-400">Click to upload</span> or drag and drop CSV
                      </div>
                      <p className="text-[10px] text-slate-400">Comma-separated values (.csv) with headers</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Section 3: Validation Errors & Warnings */}
              {importError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Import Error: </span>
                    <span>{importError}</span>
                  </div>
                </div>
              )}

              {csvWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Warnings ({csvWarnings.length} skipped rows)</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-700 dark:text-amber-300 max-h-20 overflow-y-auto space-y-0.5">
                    {csvWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section 4: Parsed Programs Preview Table */}
              {parsedPrograms.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Programs Preview ({parsedPrograms.length} Ready)
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Training sessions will be automatically created
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Title</th>
                          <th className="px-3 py-2">Trainer</th>
                          <th className="px-3 py-2">Dates</th>
                          <th className="px-3 py-2">Target</th>
                          <th className="px-3 py-2">Daily Hrs</th>
                          <th className="px-3 py-2">Sundays</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedPrograms.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-mono font-bold text-brand-600 dark:text-brand-400">
                              {p.code}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                              {p.title}
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                              {p.trainerName}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">
                              {p.startDate} ~ {p.endDate}
                            </td>
                            <td className="px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {p.targetYears ? `Yr ${p.targetYears}` : `Yr ${importTargetYears.join(',')}`}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400">
                              {p.dailyHours}h
                            </td>
                            <td className="px-3 py-2 text-[11px]">
                              {p.includeSundays ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                                  Sun
                                </span>
                              ) : (
                                <span className="text-slate-400">Mon–Sat</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section 5: Bulk Import Result Summary */}
              {importResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-200 font-bold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Successfully imported {importResult.importedCount} programs with full sessions!
                    </span>
                  </div>
                  {importResult.skippedCount > 0 && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-amber-600">{importResult.skippedCount} programs were skipped:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {importResult.skippedList.map((s, idx) => (
                          <li key={idx}>
                            <span className="font-mono font-semibold">{s.code}</span>: {s.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {parsedPrograms.length > 0 ? (
                  <span>Ready to import <strong>{parsedPrograms.length}</strong> programs</span>
                ) : (
                  <span>Select or drag a .csv file above</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={parsedPrograms.length === 0 || isImporting || !importDeptId}
                  onClick={handleConfirmBulkImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Importing & Generating Sessions...' : `Confirm & Import (${parsedPrograms.length})`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
