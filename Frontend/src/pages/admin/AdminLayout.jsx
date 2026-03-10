import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '⬡', exact: true },
  { path: '/admin/students', label: 'Students', icon: '👤' },
  { path: '/admin/rooms', label: 'Rooms', icon: '🛏️' },
  { path: '/admin/gatepasses', label: 'Gatepasses', icon: '📋' },
  { path: '/admin/fees', label: 'Fees', icon: '💳' },
  { path: '/admin/complaints', label: 'Complaints', icon: '🔧' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login') }

  const isActive = item => item.exact
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path)

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏨</div>
          <span>SmartHostel</span>
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <div className="nav-section">Menu</div>
          {navItems.map(item => (
            <button key={item.path} className={`nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="nav-section">Tools</div>
          <button className="nav-item" onClick={() => navigate('/security')}>
            <span style={{ fontSize: '1rem' }}>📷</span> Gate Scanner
          </button>
        </div>

        <div className="sidebar-footer">
          <div style={{ padding: '0.75rem', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user?.username?.split('@')[0]}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>{user?.role}</div>
              </div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--rose)' }}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
            {navItems.find(i => isActive(i))?.label || 'Dashboard'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
