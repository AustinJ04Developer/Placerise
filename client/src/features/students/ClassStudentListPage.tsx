import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowRight,
  Filter,
  Download,
  GraduationCap,
  Sparkles,
  ChevronRight,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Building,
  UserPlus,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  X,
  AlertCircle,
  ExternalLink,
  Code2,
  Terminal,
  FileText,
  HelpCircle,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { Student, ClassSection, Department, AcademicYear, Batch } from '../../types';
import { useAuth } from '../../app/context/AuthContext';

export const ClassStudentListPage: React.FC = () => {
  const { role, user } = useAuth();
  const userDeptId =
    user?.departmentId && typeof user.departmentId === 'object'
      ? (user.departmentId as any)._id
      : (user?.departmentId as string) || '';

  const canManageStudents =
    role === 'placement_officer' || role === 'hod' || role === 'class_incharge';

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);

  // Filter selections
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedStudyYear, setSelectedStudyYear] = useState<number>(4);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [addSuccessMsg, setAddSuccessMsg] = useState<string>('');

  // Single Add Student Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addRegNo, setAddRegNo] = useState('');
  const [addRollNo, setAddRollNo] = useState('');
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addGender, setAddGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [addPhone, setAddPhone] = useState('');
  const [addDeptId, setAddDeptId] = useState('');
  const [addBatchId, setAddBatchId] = useState('');
  const [addYear, setAddYear] = useState<number>(4);
  const [addSectionId, setAddSectionId] = useState('');
  const [addGithub, setAddGithub] = useState('');
  const [addLinkedin, setAddLinkedin] = useState('');
  const [addLeetcode, setAddLeetcode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Bulk CSV Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importDeptId, setImportDeptId] = useState('');
  const [importBatchId, setImportBatchId] = useState('');
  const [importYear, setImportYear] = useState<number>(4);
  const [importSectionId, setImportSectionId] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    skippedList: Array<{ registerNumber: string; name: string; reason: string }>;
  } | null>(null);

  const navigate = useNavigate();

  // Load catalogs
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [yearsRes, deptsRes, batchesRes] = await Promise.all([
          api.get('/academics/academic-years'),
          api.get('/academics/departments'),
          api.get('/academics/batches'),
        ]);

        if (yearsRes.data.success) {
          setAcademicYears(yearsRes.data.data);
          const current =
            yearsRes.data.data.find((y: any) => y.isCurrent) ||
            yearsRes.data.data[yearsRes.data.data.length - 1];
          if (current) setSelectedYearId(current._id);
        }

        if (deptsRes.data.success) {
          setDepartments(deptsRes.data.data);
          if (role === 'hod' && userDeptId) {
            setSelectedDeptId(userDeptId);
          } else {
            const cse = deptsRes.data.data.find((d: any) => d.code === 'CSE') || deptsRes.data.data[0];
            if (cse) setSelectedDeptId(cse._id);
          }
        }

        if (batchesRes.data.success && batchesRes.data.data.length > 0) {
          setBatches(batchesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load academic catalog', err);
      }
    };
    fetchCatalogs();
  }, [role, userDeptId]);

  // Fetch matching sections
  useEffect(() => {
    if (!selectedYearId || !selectedDeptId) return;

    const fetchSections = async () => {
      try {
        const res = await api.get('/academics/sections', {
          params: {
            academicYearId: selectedYearId,
            departmentId: selectedDeptId,
            yearOfStudy: selectedStudyYear,
          },
        });
        if (res.data.success) {
          setSections(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedSectionId(res.data.data[0]._id);
          } else {
            setSelectedSectionId('');
            setStudents([]);
          }
        }
      } catch (err) {
        console.error('Failed to load sections', err);
      }
    };
    fetchSections();
  }, [selectedYearId, selectedDeptId, selectedStudyYear]);

  // Fetch students in selected section
  const fetchStudents = async () => {
    if (!selectedSectionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/academics/sections/${selectedSectionId}/students`, {
        params: { search: search || undefined },
      });
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSectionId, search]);

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s._id));
    }
  };

  const handleCompare = () => {
    if (selectedStudentIds.length >= 2) {
      navigate('/compare', { state: { studentIds: selectedStudentIds } });
    }
  };

  const exportCSV = () => {
    if (students.length === 0) return;
    const headers = ['Roll No', 'Register No', 'Student Name', 'Email', 'Gender', 'Section'];
    const rows = students.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.registerNumber}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.gender}"`,
      `"${s.currentSection}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `class-students-50.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAddStudentModal = () => {
    setAddRegNo('');
    setAddRollNo('');
    setAddName('');
    setAddEmail('');
    setAddGender('Male');
    setAddPhone('');
    setAddDeptId(role === 'hod' && userDeptId ? userDeptId : (selectedDeptId || (departments[0]?._id ?? '')));
    setAddBatchId(batches[0]?._id ?? '');
    setAddYear(selectedStudyYear);
    setAddSectionId(selectedSectionId || (sections[0]?._id ?? ''));
    setAddGithub('');
    setAddLinkedin('');
    setAddLeetcode('');
    setAddError('');
    setShowAddModal(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!addRegNo.trim() || !addName.trim() || !addEmail.trim()) {
      setAddError('Register Number, Name, and Email are required.');
      return;
    }
    if (!addDeptId || !addBatchId || !addSectionId) {
      setAddError('Please select Department, Batch, and Class Section.');
      return;
    }

    const secObj = sections.find((s) => s._id === addSectionId);
    const secLetter = secObj?.section || 'A';

    setIsAdding(true);
    try {
      const res = await api.post('/students', {
        registerNumber: addRegNo.trim().toUpperCase(),
        rollNumber: addRollNo.trim() || addRegNo.trim().slice(-3),
        name: addName.trim(),
        email: addEmail.trim().toLowerCase(),
        gender: addGender,
        phone: addPhone.trim() || undefined,
        departmentId: addDeptId,
        batchId: addBatchId,
        currentClassSectionId: addSectionId,
        currentYearOfStudy: addYear,
        currentSection: secLetter,
        githubUrl: addGithub.trim() || undefined,
        linkedinUrl: addLinkedin.trim() || undefined,
        leetcodeUrl: addLeetcode.trim() || undefined,
      });

      if (res.data.success) {
        setShowAddModal(false);
        fetchStudents();
        setAddSuccessMsg(`Student ${addRegNo} (${addName}) enrolled successfully!`);
        setTimeout(() => setAddSuccessMsg(''), 5000);
      }
    } catch (err: any) {
      setAddError(err.response?.data?.message || err.message || 'Failed to add student');
    } finally {
      setIsAdding(false);
    }
  };

  const openImportModal = () => {
    setImportDeptId(role === 'hod' && userDeptId ? userDeptId : (selectedDeptId || (departments[0]?._id ?? '')));
    setImportBatchId(batches[0]?._id ?? '');
    setImportYear(selectedStudyYear);
    setImportSectionId(selectedSectionId || (sections[0]?._id ?? ''));
    setCsvFileName('');
    setParsedRows([]);
    setCsvWarnings([]);
    setImportError('');
    setImportResult(null);
    setShowImportModal(true);
  };

  const downloadSampleCsv = () => {
    const deptCode = departments.find((d) => d._id === (role === 'hod' && userDeptId ? userDeptId : selectedDeptId))?.code || 'CSE';
    const sampleHeaders = ['RegisterNumber', 'RollNumber', 'Name', 'Email', 'Gender', 'GitHub', 'LinkedIn', 'LeetCode'];
    const csvContent = 'data:text/csv;charset=utf-8,' + sampleHeaders.join(',') + '\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_${deptCode}_template.csv`);
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
      setImportError('CSV file must have a header row and at least one student data row.');
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
    
    // Map column indices
    const regIdx = headers.findIndex((h) => h.includes('reg') || h.includes('register'));
    const rollIdx = headers.findIndex((h) => h.includes('roll'));
    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const emailIdx = headers.findIndex((h) => h.includes('mail') || h.includes('email'));
    const genderIdx = headers.findIndex((h) => h.includes('gender') || h.includes('sex'));
    const githubIdx = headers.findIndex((h) => h.includes('github') || h.includes('git'));
    const linkedinIdx = headers.findIndex((h) => h.includes('linkedin'));
    const leetcodeIdx = headers.findIndex((h) => h.includes('leetcode') || h.includes('leet'));

    if (regIdx === -1 || nameIdx === -1 || emailIdx === -1) {
      setImportError(
        'CSV must contain headers for Register Number, Name, and Email (e.g. RegisterNumber, RollNumber, Name, Email).'
      );
      return;
    }

    const rows: any[] = [];
    const warnings: string[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const cols = splitCsvRow(rawLines[i]);
      if (cols.length <= 1 && !cols[0]) continue;

      const regNo = cols[regIdx]?.trim().toUpperCase() || '';
      const name = cols[nameIdx]?.trim() || '';
      const email = cols[emailIdx]?.trim().toLowerCase() || '';
      const rollNo = rollIdx !== -1 && cols[rollIdx] ? cols[rollIdx].trim() : regNo.slice(-3) || `0${i}`;
      let gender: 'Male' | 'Female' | 'Other' = 'Male';
      if (genderIdx !== -1 && cols[genderIdx]) {
        const g = cols[genderIdx].trim().toLowerCase();
        if (g.startsWith('f')) gender = 'Female';
        else if (g.startsWith('o')) gender = 'Other';
        else gender = 'Male';
      }
      const githubUrl = githubIdx !== -1 && cols[githubIdx] ? cols[githubIdx].trim() : '';
      const linkedinUrl = linkedinIdx !== -1 && cols[linkedinIdx] ? cols[linkedinIdx].trim() : '';
      const leetcodeUrl = leetcodeIdx !== -1 && cols[leetcodeIdx] ? cols[leetcodeIdx].trim() : '';

      if (!regNo || !name || !email) {
        warnings.push(`Row ${i}: Missing register number, name, or email.`);
        continue;
      }

      rows.push({
        registerNumber: regNo,
        rollNumber: rollNo,
        name,
        email,
        gender,
        githubUrl: githubUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        leetcodeUrl: leetcodeUrl || undefined,
      });
    }

    setParsedRows(rows);
    setCsvWarnings(warnings);
  };

  const handleConfirmBulkImport = async () => {
    if (parsedRows.length === 0) return;
    if (!importDeptId || !importBatchId || !importSectionId) {
      setImportError('Please select Department, Batch, and Class Section.');
      return;
    }

    const secObj = sections.find((s) => s._id === importSectionId);
    const secLetter = secObj?.section || 'A';

    setIsImporting(true);
    setImportError('');
    try {
      const res = await api.post('/students/bulk-import', {
        students: parsedRows,
        targetInfo: {
          departmentId: importDeptId,
          batchId: importBatchId,
          currentClassSectionId: importSectionId,
          currentYearOfStudy: importYear,
          currentSection: secLetter,
        },
      });

      if (res.data.success) {
        setImportResult(res.data.data);
        fetchStudents();
        setAddSuccessMsg(`Successfully imported ${res.data.data.importedCount} students!`);
        setTimeout(() => setAddSuccessMsg(''), 6000);
      }
    } catch (err: any) {
      setImportError(err.response?.data?.message || err.message || 'Failed to bulk import students');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          <span>Academics</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Class Sections</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-600 dark:text-brand-400">Class Roster</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Class Students Roster</span>
              <span className="text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {students.length} Students
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select any student to view their complete 4-year placement training history from Year 1 to Year 4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManageStudents && (
              <>
                <button
                  type="button"
                  onClick={openAddStudentModal}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Student</span>
                </button>
                <button
                  type="button"
                  onClick={openImportModal}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import CSV</span>
                </button>
              </>
            )}
            {selectedStudentIds.length >= 2 && (
              <button
                onClick={handleCompare}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Compare ({selectedStudentIds.length})</span>
              </button>
            )}
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      {addSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{addSuccessMsg}</span>
        </div>
      )}

      {/* Cascading Filter Bar */}
      <div
        className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 transition-all ${
          showMobileFilters ? 'block' : 'hidden lg:grid'
        }`}
      >
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
            Academic Year
          </label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {academicYears.map((ay) => (
              <option key={ay._id} value={ay._id}>
                {ay.name} {ay.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Department
            </label>
            {role === 'hod' && (
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                (HOD Scope)
              </span>
            )}
          </div>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            disabled={role === 'hod'}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-85 disabled:cursor-not-allowed"
          >
            {departments
              .filter((dept) => (role === 'hod' && userDeptId ? dept._id === userDeptId : true))
              .map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.code} - {dept.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
            Year of Study
          </label>
          <select
            value={selectedStudyYear}
            onChange={(e) => setSelectedStudyYear(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value={1}>1st Year (I)</option>
            <option value={2}>2nd Year (II)</option>
            <option value={3}>3rd Year (III)</option>
            <option value={4}>4th Year (IV - Final Year)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
            Class Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {sections.map((sec) => (
              <option key={sec._id} value={sec._id}>
                {sec.displayName} (Section {sec.section})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
            Quick Search
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name / 23CS001..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* 50-Student Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table/Card Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <button
              onClick={selectAll}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors"
            >
              {selectedStudentIds.length === students.length && students.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-brand-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All</span>
            </button>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {students.length} students in IV CSE A
            </span>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
            Stable Register Number Identity: <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">23CS001 – 23CS050</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No students found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Please select IV CSE A</p>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (Hidden on small mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 w-12 text-center">#</th>
                    <th className="p-3.5">Roll No</th>
                    <th className="p-3.5">Register Number</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Class / Section</th>
                    <th className="p-3.5 text-center">Profiles</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Placement Journey</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {students.map((student) => {
                    const isSelected = selectedStudentIds.includes(student._id);
                    const secName =
                      sections.find(
                        (s) =>
                          s._id ===
                          (typeof student.currentClassSectionId === 'object'
                            ? (student.currentClassSectionId as any)?._id
                            : student.currentClassSectionId)
                      )?.displayName || `Year ${student.currentYearOfStudy} ${student.currentSection}`;

                    return (
                      <tr
                        key={student._id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectStudent(student._id)}
                            className="text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-brand-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {student.rollNumber}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {student.registerNumber}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          {student.name}
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400">
                          {student.email}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">
                          {student.gender}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {secName}
                          </span>
                        </td>
                        {/* Profiles Column */}
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center space-x-1">
                            {student.githubUrl ? (
                              <a
                                href={student.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`GitHub: ${student.githubUrl}`}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                              >
                                <Code2 className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span
                                className="p-1 rounded-lg text-slate-300 dark:text-slate-700"
                                title="No GitHub profile"
                              >
                                <Code2 className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {student.linkedinUrl ? (
                              <a
                                href={student.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`LinkedIn: ${student.linkedinUrl}`}
                                className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span
                                className="p-1 rounded-lg text-slate-300 dark:text-slate-700"
                                title="No LinkedIn profile"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {student.leetcodeUrl ? (
                              <a
                                href={student.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`LeetCode: ${student.leetcodeUrl}`}
                                className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 transition-colors"
                              >
                                <Terminal className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span
                                className="p-1 rounded-lg text-slate-300 dark:text-slate-700"
                                title="No LeetCode profile"
                              >
                                <Terminal className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            Active
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => navigate(`/students/${student._id}/journey`)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-semibold rounded-xl text-xs transition-all border border-brand-200/60 dark:border-brand-800/60 shadow-xs"
                          >
                            <span>View 4-Yr History</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (Visible on mobile < md) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {students.map((student) => {
                const isSelected = selectedStudentIds.includes(student._id);
                const secName =
                  sections.find(
                    (s) =>
                      s._id ===
                      (typeof student.currentClassSectionId === 'object'
                        ? (student.currentClassSectionId as any)?._id
                        : student.currentClassSectionId)
                  )?.displayName || `Year ${student.currentYearOfStudy} ${student.currentSection}`;

                return (
                  <div
                    key={student._id}
                    className={`p-3.5 space-y-2.5 transition-colors ${
                      isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectStudent(student._id)}
                          className="text-slate-400 hover:text-brand-600 mt-0.5"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {student.name}
                            </span>
                            <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                              {student.registerNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            Roll {student.rollNumber} • {student.email}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {secName}
                        </span>
                        {/* Mobile profile link badges */}
                        <div className="flex items-center space-x-1">
                          {student.githubUrl && (
                            <a
                              href={student.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-600 dark:text-slate-400 p-0.5"
                              title="GitHub"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {student.linkedinUrl && (
                            <a
                              href={student.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 p-0.5"
                              title="LinkedIn"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {student.leetcodeUrl && (
                            <a
                              href={student.leetcodeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 dark:text-amber-400 p-0.5"
                              title="LeetCode"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/students/${student._id}/journey`)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs shadow-xs"
                      >
                        <span>View 4-Yr History</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD STUDENT MODAL (Single Student Record, No User Account)                */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Add Student Record
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Directly enroll student into academic department & section.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddStudent} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {addError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{addError}</span>
                  </div>
                )}

                {/* Target Academic Placement */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <Building className="w-3.5 h-3.5 text-brand-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      1. Academic Allocation
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Academic Department *
                      </label>
                      <select
                        value={addDeptId}
                        disabled={role === 'hod'}
                        onChange={(e) => setAddDeptId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white disabled:opacity-60"
                      >
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Graduating Batch *
                      </label>
                      <select
                        value={addBatchId}
                        onChange={(e) => setAddBatchId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                      >
                        {batches.map((b) => (
                          <option key={b._id} value={b._id}>
                            Batch {b.name} ({b.startYear}–{b.endYear})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Year of Study *
                      </label>
                      <select
                        value={addYear}
                        onChange={(e) => setAddYear(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                      >
                        <option value={1}>Year 1 (Freshman)</option>
                        <option value={2}>Year 2 (Sophomore)</option>
                        <option value={3}>Year 3 (Pre-Final)</option>
                        <option value={4}>Year 4 (Final Year)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Class Section *
                      </label>
                      <select
                        value={addSectionId}
                        onChange={(e) => setAddSectionId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                      >
                        {sections.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.displayName} (Section {s.section})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Personal & Identity Details */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      2. Student Identity & Contact
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Register Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 21CS099"
                        value={addRegNo}
                        onChange={(e) => setAddRegNo(e.target.value.toUpperCase())}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Class Roll Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 99"
                        value={addRollNo}
                        onChange={(e) => setAddRollNo(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav Patel"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Gender *
                      </label>
                      <select
                        value={addGender}
                        onChange={(e) => setAddGender(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Institutional Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="aarav.patel@placerise.edu"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={addPhone}
                        onChange={(e) => setAddPhone(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Candidate Developer & Professional Links */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      3. Professional & Coding Profiles (Optional)
                    </h3>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      GitHub Profile URL
                    </label>
                    <div className="relative">
                      <Code2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={addGithub}
                        onChange={(e) => setAddGithub(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      LinkedIn Profile URL
                    </label>
                    <div className="relative">
                      <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={addLinkedin}
                        onChange={(e) => setAddLinkedin(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      LeetCode Profile URL
                    </label>
                    <div className="relative">
                      <Terminal className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://leetcode.com/username"
                        value={addLeetcode}
                        onChange={(e) => setAddLeetcode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-400">
                  Direct trainee enrollment into active roster
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isAdding ? 'Enrolling...' : 'Enroll Student'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK IMPORT STUDENTS MODAL (CSV Upload with GitHub, LinkedIn, LeetCode)  */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Bulk Import Students from CSV
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload class roster with GitHub, LinkedIn, and LeetCode profile links.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              {importError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Results Success Box */}
              {importResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Successfully imported {importResult.importedCount} student records!</span>
                  </div>
                  {importResult.skippedCount > 0 && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300">
                      <p className="font-semibold">{importResult.skippedCount} rows were skipped:</p>
                      <ul className="list-disc list-inside space-y-0.5 mt-1 max-h-24 overflow-y-auto">
                        {importResult.skippedList.map((item, idx) => (
                          <li key={idx}>
                            <span className="font-mono font-bold">{item.registerNumber}</span> ({item.name}): {item.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Target Allocation */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  1. Target Classroom & Department Destination
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">
                      Department
                    </label>
                    <select
                      value={importDeptId}
                      disabled={role === 'hod'}
                      onChange={(e) => setImportDeptId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white disabled:opacity-60"
                    >
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">
                      Batch
                    </label>
                    <select
                      value={importBatchId}
                      onChange={(e) => setImportBatchId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                    >
                      {batches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">
                      Year
                    </label>
                    <select
                      value={importYear}
                      onChange={(e) => setImportYear(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">
                      Section
                    </label>
                    <select
                      value={importSectionId}
                      onChange={(e) => setImportSectionId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                    >
                      {sections.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sample Template & Format Info */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-900 dark:text-emerald-300 font-bold">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Standard CSV Header Format:</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    RegisterNumber, RollNumber, Name, Email, Gender, GitHub, LinkedIn, LeetCode
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center space-x-1.5 shrink-0 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV Template</span>
                </button>
              </div>

              {/* Dropzone File Upload */}
              {!importResult && (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-brand-500 transition-colors bg-slate-50/40 dark:bg-slate-800/20">
                  <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Choose a .CSV file from your computer
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click below or drag and drop your completed student roster spreadsheet
                  </p>
                  <label className="mt-3 inline-block px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold cursor-pointer shadow-xs">
                    <span>Browse CSV File</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCsvFileUpload(file);
                      }}
                    />
                  </label>
                  {csvFileName && (
                    <p className="mt-2 font-mono text-[11px] text-brand-600 dark:text-brand-400 font-bold">
                      Selected: {csvFileName}
                    </p>
                  )}
                </div>
              )}

              {/* Warnings */}
              {csvWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-[11px]">
                  <p className="font-bold mb-1">CSV Parse Warnings ({csvWarnings.length}):</p>
                  <ul className="list-disc list-inside space-y-0.5 max-h-20 overflow-y-auto">
                    {csvWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Rows Preview Table */}
              {parsedRows.length > 0 && !importResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Roster Preview ({parsedRows.length} Valid Students Detected)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Verify URLs before importing
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="p-2">Reg No</th>
                          <th className="p-2">Roll</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Gender</th>
                          <th className="p-2 text-center">GitHub</th>
                          <th className="p-2 text-center">LinkedIn</th>
                          <th className="p-2 text-center">LeetCode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-mono font-bold text-brand-600">{row.registerNumber}</td>
                            <td className="p-2 font-mono">{row.rollNumber}</td>
                            <td className="p-2 font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                              {row.name}
                            </td>
                            <td className="p-2 text-slate-500 truncate max-w-[140px]">{row.email}</td>
                            <td className="p-2">{row.gender}</td>
                            <td className="p-2 text-center">
                              {row.githubUrl ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title={row.githubUrl}></span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {row.linkedinUrl ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" title={row.linkedinUrl}></span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {row.leetcodeUrl ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title={row.leetcodeUrl}></span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Sticky Footer */}
            <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                {parsedRows.length > 0 ? `${parsedRows.length} ready to enroll` : 'Select or drop CSV file'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {importResult ? 'Close' : 'Cancel'}
                </button>
                {!importResult && (
                  <button
                    type="button"
                    disabled={parsedRows.length === 0 || isImporting}
                    onClick={handleConfirmBulkImport}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>
                      {isImporting
                        ? 'Importing Roster...'
                        : `Import ${parsedRows.length > 0 ? `${parsedRows.length} Students` : 'Roster'}`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
