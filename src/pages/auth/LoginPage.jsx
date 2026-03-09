import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async e => {
    e.preventDefault()
    if (!username || !password) return toast.error('Fill in all fields')
    setLoading(true)
    try {
      const role = await login(username, password)
      toast.success('Welcome back!')
      if (role === 'ADMIN' || role === 'WARDEN') navigate('/admin')
      else if (role === 'STUDENT') navigate('/student')
      else if (role === 'SECURITY') navigate('/security')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const fill = (u, p) => { setUsername(u); setPassword(p) }

  return (
    <div style={styles.page}>
      {/* Animated BG */}
      <div style={styles.bg}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.orb3} />
        <div style={styles.grid} />
      </div>

      <div style={styles.container}>
        {/* Left panel */}
        <div style={styles.left}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>🏨</div>
            <span style={styles.logoText}>SmartHostel</span>
          </div>
          <h1 style={styles.heroTitle}>Manage your hostel<br /><span style={styles.accent}>intelligently.</span></h1>
          <p style={styles.heroSub}>One platform for wardens, students, and security staff. Real-time gatepass QR, fee tracking, complaints — all in one place.</p>

          <div style={styles.features}>
            {[
              { icon: '🛏️', label: 'Room Management' },
              { icon: '📋', label: 'Digital Gatepass QR' },
              { icon: '💳', label: 'Fee Tracking' },
              { icon: '🔧', label: 'Complaint System' },
            ].map(f => (
              <div key={f.label} style={styles.feature}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureLabel}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - Login form */}
        <div style={styles.right}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Sign in</h2>
            <p style={styles.cardSub}>Access your dashboard</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Email / Username</label>
                <input className="input" type="text" placeholder="warden@hostel.com"
                  value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPass ? 'text' : 'password'}
                    placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    style={{ paddingRight: '2.8rem' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={styles.eyeBtn}>{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>

              <button className="btn btn-primary w-full" type="submit" disabled={loading}
                style={{ marginTop: '0.5rem', padding: '0.8rem', fontSize: '0.95rem' }}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign in →'}
              </button>
            </form>

            {/* Quick login chips */}
            <div style={styles.quickSection}>
              <div style={styles.quickLabel}>Quick demo login</div>
              <div style={styles.chips}>
                {[
                  { role: 'Admin', u: 'admin@hostel.com', p: 'Admin@123', color: '#ff4d6d' },
                  { role: 'Warden', u: 'warden@hostel.com', p: 'Warden@123', color: '#00e5ff' },
                  { role: 'Security', u: 'security@hostel.com', p: 'Security@123', color: '#ffb300' },
                ].map(q => (
                  <button key={q.role} type="button" onClick={() => fill(q.u, q.p)}
                    style={{ ...styles.chip, borderColor: q.color + '40', color: q.color }}>
                    {q.role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', position: 'relative', overflow: 'hidden', padding: '1rem',
  },
  bg: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  orb1: {
    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)',
    top: '-200px', left: '-200px',
  },
  orb2: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(179,136,255,0.08) 0%, transparent 70%)',
    bottom: '-100px', right: '10%',
  },
  orb3: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,179,0,0.06) 0%, transparent 70%)',
    top: '30%', right: '-100px',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
  },
  container: {
    display: 'flex', gap: '4rem', alignItems: 'center', maxWidth: 960, width: '100%',
    position: 'relative', zIndex: 1,
  },
  left: { flex: 1 },
  logoRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' },
  logoIcon: {
    width: 44, height: 44, background: 'var(--cyan)', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
    boxShadow: '0 0 30px var(--cyan-glow)',
  },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' },
  heroTitle: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.8rem)',
    fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem',
  },
  accent: { color: 'var(--cyan)' },
  heroSub: { color: 'var(--text2)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 380 },
  features: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  feature: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.6rem 0.75rem', background: 'var(--surface)',
    borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content',
  },
  featureIcon: { fontSize: '1rem' },
  featureLabel: { fontSize: '0.85rem', color: 'var(--text2)', fontWeight: 500 },
  right: { width: 380, flexShrink: 0 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border2)',
    borderRadius: 20, padding: '2rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.05)',
  },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' },
  cardSub: { color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '1.75rem' },
  eyeBtn: {
    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
  },
  quickSection: { marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' },
  quickLabel: { fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '0.6rem', fontWeight: 500 },
  chips: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  chip: {
    padding: '0.3rem 0.8rem', borderRadius: 99, background: 'transparent',
    border: '1px solid', fontSize: '0.78rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-display)',
    transition: 'all 0.15s',
  },
}
