import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import { ThemeProvider } from './app/context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ClassStudentListPage } from './features/students/ClassStudentListPage';
import { StudentJourneyPage } from './features/students/StudentJourneyPage';
import { ClassMatrixPage } from './features/matrix/ClassMatrixPage';
import { TrainingProgramsPage } from './features/training/TrainingProgramsPage';
import { ReverseQueryPage } from './features/training/ReverseQueryPage';
import { SessionAttendancePage } from './features/attendance/SessionAttendancePage';
import { AssessmentGradingPage } from './features/assessments/AssessmentGradingPage';
import { StudentComparePage } from './features/students/StudentComparePage';
import { ApprovalsPage } from './features/approvals/ApprovalsPage';
import { AuditLogsPage } from './features/audit/AuditLogsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { AdminPanelPage } from './features/admin/AdminPanelPage';
import { ProfilePage } from './features/profile/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleRoute: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { role } = useAuth();
  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route
                  path="/academics/classes"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod', 'faculty', 'class_incharge']}>
                      <ClassStudentListPage />
                    </RoleRoute>
                  }
                />
                <Route path="/students/:id/journey" element={<StudentJourneyPage />} />
                <Route
                  path="/matrix"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod', 'faculty', 'class_incharge']}>
                      <ClassMatrixPage />
                    </RoleRoute>
                  }
                />
                <Route path="/training" element={<TrainingProgramsPage />} />
                <Route
                  path="/training/reverse-query"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod', 'faculty', 'class_incharge']}>
                      <ReverseQueryPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/attendance"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod', 'faculty', 'class_incharge']}>
                      <SessionAttendancePage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/assessments"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod', 'faculty']}>
                      <AssessmentGradingPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/compare"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod', 'faculty', 'class_incharge']}>
                      <StudentComparePage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/approvals"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod', 'faculty', 'class_incharge']}>
                      <ApprovalsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/audit"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod']}>
                      <AuditLogsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <RoleRoute allowedRoles={['placement_officer', 'hod', 'class_incharge']}>
                      <ReportsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RoleRoute allowedRoles={['placement_officer']}>
                      <AdminPanelPage />
                    </RoleRoute>
                  }
                />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

