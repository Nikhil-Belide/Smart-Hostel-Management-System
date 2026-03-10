import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/auth/LoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentsPage from './pages/admin/StudentsPage'
import RoomsPage from './pages/admin/RoomsPage'
import GatepassAdminPage from './pages/admin/GatepassAdminPage'
import ComplaintsAdminPage from './pages/admin/ComplaintsAdminPage'
import FeesAdminPage from './pages/admin/FeesAdminPage'
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentFees from './pages/student/StudentFees'
import StudentGatepass from './pages/student/StudentGatepass'
import StudentComplaints from './pages/student/StudentComplaints'
import SecurityPage from './pages/security/SecurityPage'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN' || user.role === 'WARDEN') return <Navigate to="/admin" replace />
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />
  if (user.role === 'SECURITY') return <Navigate to="/security" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin / Warden */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'WARDEN']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="gatepasses" element={<GatepassAdminPage />} />
          <Route path="complaints" element={<ComplaintsAdminPage />} />
          <Route path="fees" element={<FeesAdminPage />} />
        </Route>

        {/* Student */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="gatepass" element={<StudentGatepass />} />
          <Route path="complaints" element={<StudentComplaints />} />
        </Route>

        {/* Security */}
        <Route path="/security" element={
          <ProtectedRoute allowedRoles={['SECURITY', 'ADMIN', 'WARDEN']}>
            <SecurityPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
