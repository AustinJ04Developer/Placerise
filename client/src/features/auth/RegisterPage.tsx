import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Building,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../app/context/AuthContext';
import { UserRole } from '../../types';
import { api } from '../../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('placement_officer');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<{ _id: string; code: string; name: string }[]>([]);

  // Staff specific security passcode
  const [staffAccessKey, setStaffAccessKey] = useState('');

  // Class Incharge mandatory Year of Study and Section
  const [inchargeYear, setInchargeYear] = useState<number>(4);
  const [inchargeSection, setInchargeSection] = useState<string>('A');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDept = departments.find((d) => d._id === departmentId);
  const isMba = selectedDept?.code === 'MBA';

  useEffect(() => {
    if (isMba && inchargeYear > 2) {
      setInchargeYear(1);
    }
  }, [isMba, inchargeYear]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/academics/departments');
        if (res.data.success && res.data.data.length > 0) {
          setDepartments(res.data.data);
          setDepartmentId(res.data.data[0]._id);
        }
      } catch (err) {
        // fallback
      }
    };
    fetchDepts();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side quick password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    // Role authorization check - all staff roles require key
    if (!staffAccessKey.trim()) {
      setError('Institutional Staff Passcode is strictly required for registration.');
      return;
    }

    if (role === 'class_incharge') {
      if (!departmentId) {
        setError('Academic Department is required for Class Incharge.');
        return;
      }
      if (!inchargeYear) {
        setError('Year of Study is a mandatory field for Class Incharge.');
        return;
      }
      if (!inchargeSection.trim()) {
        setError('Section is a mandatory field for Class Incharge.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        staffAccessKey: staffAccessKey.trim(),
        departmentId: role === 'placement_officer' ? undefined : (departmentId || undefined),
        yearOfStudy: role === 'class_incharge' ? inchargeYear : undefined,
        section: role === 'class_incharge' ? inchargeSection.trim().toUpperCase() : undefined,
      });
      navigate('/');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.map((e: any) => e.message).join(', ') ||
        err.message ||
        'Registration failed. Please check your inputs.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 py-8 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-lg">
        {/* Logo and title */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 items-center justify-center text-white shadow-lg shadow-brand-500/25 mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Placement Training Cell Registration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Internal Portal for Department Heads (HOD), Placement Officers, Incharges & Faculty
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 text-xs font-medium rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Staff / Faculty Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@placerise.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Role Selection (Staff Roles Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Your Institutional Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { r: 'placement_officer', label: 'Placement Officer', desc: 'Cell Head & Director' },
                  { r: 'hod', label: 'Head of Department (HOD)', desc: 'Department Head Oversight' },
                  { r: 'class_incharge', label: 'Class Incharge', desc: 'Batch & Section Supervisor' },
                  { r: 'faculty', label: 'Faculty Trainer', desc: 'Training Instructor / Evaluator' },
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => {
                      setRole(item.r as UserRole);
                      setError('');
                    }}
                    className={`p-2.5 text-left rounded-xl border transition-all ${
                      role === item.r
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Department Selection - Only for HOD, Incharge, Faculty. Placement Officer is Campus-Wide */}
            {role === 'placement_officer' ? (
              <div className="p-3.5 bg-brand-50/80 dark:bg-brand-950/30 rounded-xl border border-brand-200 dark:border-brand-900/60 flex items-start space-x-2.5">
                <Building className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-brand-900 dark:text-brand-200">
                    Campus-Wide Institutional Authority
                  </div>
                  <p className="text-[11px] text-brand-700 dark:text-brand-300 mt-0.5 leading-relaxed">
                    Placement Officers manage all academic departments institution-wide. No single department restriction applies.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Academic Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                    >
                      {departments.length > 0 ? (
                        departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} ({d.code})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="CSE">Computer Science & Engineering (CSE)</option>
                          <option value="AIDS">Artificial Intelligence & Data Science (AIDS)</option>
                          <option value="ECE">Electronics & Communication Engineering (ECE)</option>
                          <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
                          <option value="MECH">Mechanical Engineering (MECH)</option>
                          <option value="CIVIL">Civil Engineering (CIVIL)</option>
                          <option value="MBA">Master of Business Administration (MBA)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {role === 'class_incharge' && (
                  <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                    {/* Mandatory Year of Study */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Year of Study <span className="text-red-500">* (Mandatory)</span>
                        </label>
                        {isMba && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                            2-Year Postgraduate Program
                          </span>
                        )}
                      </div>
                      <div className={`grid ${isMba ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
                        {(isMba
                          ? [
                              { y: 1, label: 'I MBA (Year 1)' },
                              { y: 2, label: 'II MBA (Year 2)' },
                            ]
                          : [
                              { y: 1, label: 'I Year' },
                              { y: 2, label: 'II Year' },
                              { y: 3, label: 'III Year' },
                              { y: 4, label: 'IV Year' },
                            ]
                        ).map((item) => (
                          <button
                            key={item.y}
                            type="button"
                            onClick={() => setInchargeYear(item.y)}
                            className={`py-2 text-xs font-bold rounded-xl border transition-all text-center ${
                              inchargeYear === item.y
                                ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mandatory Section */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Section Identifier <span className="text-red-500">* (Mandatory)</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {['A', 'B', 'C', 'D'].map((secChar) => (
                          <button
                            key={secChar}
                            type="button"
                            onClick={() => setInchargeSection(secChar)}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all text-center ${
                              inchargeSection === secChar
                                ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            Sec {secChar}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        required
                        value={inchargeSection}
                        onChange={(e) => setInchargeSection(e.target.value.toUpperCase())}
                        placeholder="e.g. A"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    {/* Display Name Preview */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 text-xs">
                      <span className="font-semibold text-amber-800 dark:text-amber-300 text-[11px]">
                        Assigned Class Cohort:
                      </span>
                      <span className="font-mono font-bold text-amber-900 dark:text-amber-100">
                        {(() => {
                          const roman = ['I', 'II', 'III', 'IV'][inchargeYear - 1] || `${inchargeYear}`;
                          const code = selectedDept?.code || 'DEPT';
                          const sec = inchargeSection.trim().toUpperCase() || 'A';
                          return `${roman} ${code} ${sec}`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Guard: Role-Specific Authorization Key */}
            {(() => {
              const roleConfigs: Record<string, { label: string; placeholder: string; demoKey: string; desc: string }> = {
                placement_officer: {
                  label: 'Placement Officer Authorization Key *',
                  placeholder: 'Enter Placement Officer authorization key',
                  demoKey: 'OFFICER@PLACERISE2026',
                  desc: 'Restricted administrative key issued by College Principal/Board. Grants institution-wide placement authority.',
                },
                hod: {
                  label: 'Head of Department (HOD) Authorization Key *',
                  placeholder: 'Enter HOD authorization key',
                  demoKey: 'HOD@PLACERISE2026',
                  desc: 'Security key issued to Department Heads for departmental placement training oversight.',
                },
                class_incharge: {
                  label: 'Class Incharge Authorization Key *',
                  placeholder: 'Enter Incharge authorization key',
                  demoKey: 'INCHARGE@PLACERISE2026',
                  desc: 'Security key issued to Class Incharges for class section & matrix supervision.',
                },
                faculty: {
                  label: 'Faculty Trainer Authorization Key *',
                  placeholder: 'Enter Faculty authorization key',
                  demoKey: 'FACULTY@PLACERISE2026',
                  desc: 'Institutional key issued to Placement Trainers and Faculty for training management.',
                },
              };

              const roleConfig = roleConfigs[role] || roleConfigs.faculty;

              return (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        {roleConfig.label.replace(' *', '')} Required
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                        {roleConfig.desc}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                      {roleConfig.label}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={staffAccessKey}
                        onChange={(e) => setStaffAccessKey(e.target.value)}
                        placeholder={roleConfig.placeholder}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      (Configured Key: <span className="font-mono font-bold">{roleConfig.demoKey}</span>)
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Verifying & Registering...' : 'Complete Staff Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an authorized staff account?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
