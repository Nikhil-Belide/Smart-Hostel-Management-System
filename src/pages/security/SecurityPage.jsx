import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

function loadQrScript() {
  return new Promise((resolve, reject) => {
    if (window.Html5Qrcode) return resolve()
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function SecurityPage() {
  const [qrContent, setQrContent] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [cameraMode, setCameraMode] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const scannerInstanceRef = useRef(null)

  // Load QR script
  useEffect(() => {
    loadQrScript()
      .then(() => setScriptLoaded(true))
      .catch(() => toast.error('Failed to load QR scanner library'))
  }, [])

  // Load shared scan history from backend on mount
  useEffect(() => {
    api.get('/gatepasses')
      .then(res => {
        const used = (res.data.data || [])
          .filter(g => g.exitTime || g.entryTime)
          .slice(0, 10)
          .map(g => ({
            valid: true,
            action: g.entryTime ? 'ENTRY' : 'EXIT',
            studentName: g.studentName,
            studentId: g.studentIdCode,
            time: new Date(g.entryTime || g.exitTime).toLocaleTimeString(),
            message: g.entryTime ? 'Entry recorded. Gatepass complete.' : 'Exit recorded successfully.',
          }))
        setHistory(used)
      })
      .catch(() => {})
  }, [])

  // Start/stop camera
  useEffect(() => {
    if (cameraMode && scriptLoaded) startCamera()
    else stopCamera()
    return () => stopCamera()
  }, [cameraMode, scriptLoaded])

  const startCamera = async () => {
    if (!window.Html5Qrcode) return toast.error('QR library not loaded yet')
    setCameraReady(false)
    try {
      scannerInstanceRef.current = new window.Html5Qrcode('qr-reader')
      await scannerInstanceRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopCamera()
          setCameraMode(false)
          await submitScan(decodedText)
        },
        () => {}
      )
      setCameraReady(true)
    } catch {
      toast.error('Camera access denied. Please allow camera permission.')
      setCameraMode(false)
    }
  }

  const stopCamera = async () => {
    if (scannerInstanceRef.current) {
      try {
        const state = scannerInstanceRef.current.getState()
        if (state === 2) await scannerInstanceRef.current.stop()
        scannerInstanceRef.current.clear()
      } catch {}
      scannerInstanceRef.current = null
    }
    setCameraReady(false)
  }

  const submitScan = async (content) => {
    if (!content?.trim()) return toast.error('Empty QR content')
    setLoading(true)
    setQrContent(content)
    try {
      const res = await api.post(`/gatepasses/scan?qrContent=${encodeURIComponent(content.trim())}`)
      const data = res.data.data
      setResult(data)
      // Add to shared history at the top
      setHistory(prev => [{
        ...data,
        time: new Date().toLocaleTimeString(),
      }, ...prev.slice(0, 9)])
      if (data.valid) toast.success(`✅ ${data.action}: ${data.studentName}`)
      else toast.error(data.message)
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed'
      toast.error(msg)
      setResult({ valid: false, message: msg })
      setHistory(prev => [{ valid: false, message: msg, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)])
    }
    setLoading(false)
  }

  const handleManualScan = async e => {
    e.preventDefault()
    await submitScan(qrContent)
  }

  const clear = () => { setQrContent(''); setResult(null) }
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={styles.page}>
      <div style={styles.bg}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.grid} />
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={styles.logo}>🔒</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>Gate Scanner</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--amber)' }}>Security Terminal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {(user?.role === 'ADMIN' || user?.role === 'WARDEN') && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin')}>← Admin</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ color: 'var(--rose)' }}>Sign Out</button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Scanner panel */}
        <div style={styles.scanPanel}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg2)', borderRadius: 12, padding: '0.25rem', width: '100%', maxWidth: 400 }}>
            <button onClick={() => setCameraMode(false)} style={{
              ...styles.modeBtn,
              background: !cameraMode ? 'var(--surface2)' : 'transparent',
              color: !cameraMode ? 'var(--text)' : 'var(--text2)',
            }}>⌨️ Manual Input</button>
            <button onClick={() => setCameraMode(true)} style={{
              ...styles.modeBtn,
              background: cameraMode ? 'var(--amber-dim)' : 'transparent',
              color: cameraMode ? 'var(--amber)' : 'var(--text2)',
              border: cameraMode ? '1px solid rgba(255,179,0,0.3)' : '1px solid transparent',
            }}>📷 Camera Scan</button>
          </div>

          {/* Camera mode */}
          {cameraMode ? (
            <div style={{ width: '100%', maxWidth: 400 }}>
              <div style={styles.cameraContainer}>
                <div id="qr-reader" style={{ width: '100%' }} />
                {!cameraReady && (
                  <div style={styles.cameraLoading}>
                    <div className="spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--amber)' }} />
                    <div style={{ marginTop: '0.75rem', color: 'var(--amber)', fontSize: '0.85rem' }}>
                      Starting camera...
                    </div>
                  </div>
                )}
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text2)', marginTop: '1rem' }}>
                Point camera at the student's QR code — scans automatically 🎯
              </p>
              <button className="btn btn-ghost" onClick={() => setCameraMode(false)}
                style={{ width: '100%', marginTop: '0.75rem' }}>
                ✕ Cancel Camera
              </button>
            </div>
          ) : (
            /* Manual mode */
            <div style={{ width: '100%', maxWidth: 400 }}>
              <div style={styles.scannerIcon}>
                <div style={styles.scannerRing} />
                <div style={{ fontSize: '3rem', position: 'relative', zIndex: 1 }}>📋</div>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
                Paste QR Content
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                Paste the text from QR code. First scan = EXIT, second = ENTRY.
              </p>
              <form onSubmit={handleManualScan}>
                <textarea className="input" rows={3}
                  placeholder="Paste QR content here... (e.g. HOSTEL-GP|1|uuid-token)"
                  value={qrContent} onChange={e => setQrContent(e.target.value)}
                  style={{ resize: 'none', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '0.75rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem' }}>
                    {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Scanning...</> : '🔍 Scan QR'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={clear}>Clear</button>
                </div>
              </form>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{
              marginTop: '1.5rem', width: '100%', maxWidth: 400, borderRadius: 16, padding: '1.25rem',
              background: result.valid ? 'rgba(0,230,118,0.1)' : 'rgba(255,77,109,0.1)',
              border: `1px solid ${result.valid ? 'rgba(0,230,118,0.3)' : 'rgba(255,77,109,0.3)'}`,
              animation: 'fadeUp 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: result.valid ? '0.75rem' : 0 }}>
                <div style={{ fontSize: '2.5rem' }}>{result.valid ? (result.action === 'EXIT' ? '🚪' : '🏠') : '❌'}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: result.valid ? 'var(--green)' : 'var(--rose)' }}>
                    {result.valid ? result.action : 'INVALID'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{result.message}</div>
                </div>
              </div>
              {result.valid && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <div><span style={{ color: 'var(--text3)' }}>Student</span><br /><strong>{result.studentName}</strong></div>
                  <div><span style={{ color: 'var(--text3)' }}>ID</span><br /><code style={{ color: 'var(--cyan)' }}>{result.studentId}</code></div>
                  {result.exitTime && <div><span style={{ color: 'var(--text3)' }}>Exit</span><br /><span style={{ color: 'var(--amber)' }}>{new Date(result.exitTime).toLocaleTimeString()}</span></div>}
                  {result.entryTime && <div><span style={{ color: 'var(--text3)' }}>Entry</span><br /><span style={{ color: 'var(--violet)' }}>{new Date(result.entryTime).toLocaleTimeString()}</span></div>}
                  {result.expectedReturn && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text3)' }}>Expected Return</span><br />{new Date(result.expectedReturn).toLocaleString('en-IN')}</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* History panel */}
        <div style={styles.historyPanel}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Scan History
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 400 }}>{history.length} scans</span>
          </div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: '0.85rem' }}>No scans yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {history.map((h, i) => (
                <div key={i} style={{
                  padding: '0.75rem', borderRadius: 10, background: 'var(--surface2)',
                  borderLeft: `3px solid ${h.valid ? (h.action === 'EXIT' ? 'var(--amber)' : 'var(--green)') : 'var(--rose)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.valid ? h.studentName : 'Invalid Scan'}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{h.time}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: h.valid ? (h.action === 'EXIT' ? 'var(--amber)' : 'var(--green)') : 'var(--rose)' }}>
                    {h.valid ? `${h.action} recorded` : h.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' },
  bg: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  orb1: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,179,0,0.06) 0%, transparent 70%)', top: -100, right: '20%' },
  orb2: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)', bottom: 0, left: '10%' },
  grid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '50px 50px' },
  header: { position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(17,17,24,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' },
  logo: { width: 40, height: 40, background: 'var(--amber-dim)', border: '1px solid rgba(255,179,0,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' },
  content: { position: 'relative', zIndex: 1, display: 'flex', gap: '2rem', padding: '2rem', maxWidth: 900, margin: '0 auto', flexWrap: 'wrap' },
  scanPanel: { flex: '1 1 400px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20, padding: '2rem' },
  modeBtn: { flex: 1, padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid transparent', fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  cameraContainer: { position: 'relative', background: '#000', borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,179,0,0.3)', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cameraLoading: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' },
  scannerIcon: { width: 90, height: 90, borderRadius: '50%', background: 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative', border: '1px solid rgba(255,179,0,0.3)' },
  scannerRing: { position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(255,179,0,0.2)', animation: 'pulse-ring 2s infinite' },
  historyPanel: { flex: '0 0 280px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', maxHeight: 500, overflowY: 'auto' },
}
