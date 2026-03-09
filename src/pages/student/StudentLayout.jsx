import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/student', label: 'My Dashboard', icon: '⬡', exact: true },
  { path: '/student/fees', label: 'My Fees', icon: '💳' },
  { path: '/student/gatepass', label: 'Gatepass', icon: '📋' },
  { path: '/student/complaints', label: 'Complaints', icon: '🔧' },
]

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = item => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login') }

  return (
    <div className="layout">
      <aside className="sidebar" style={{ background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a0f 100%)' }}>
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'var(--violet)', boxShadow: '0 0 20px rgba(179,136,255,0.4)' }}>🎓</div>
          <span>Student Portal</span>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <div className="nav-section">Navigation</div>
          {navItems.map(item => (
            <button key={item.path} className={`nav-item ${isActive(item) ? 'active' : ''}`}
              style={isActive(item) ? { background: 'var(--violet-dim)', color: 'var(--violet)', borderColor: 'rgba(179,136,255,0.2)' } : {}}
              onClick={() => navigate(item.path)}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div style={{ padding: '0.75rem', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="avatar" style={{ borderColor: 'rgba(179,136,255,0.4)', background: 'var(--violet-dim)', color: 'var(--violet)' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user?.username?.split('@')[0]}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--violet)' }}>Student</div>
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
            {navItems.find(i => isActive(i))?.label || 'Student Portal'}
          </div>
          <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.75rem', borderColor: 'rgba(179,136,255,0.4)', background: 'var(--violet-dim)', color: 'var(--violet)' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
        </div>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}
