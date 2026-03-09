import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { createPortal } from 'react-dom'

// ===== DASHBOARD =====
export function StudentDashboard() {
  const [summary, setSummary] = useState(null)
  const [gatepasses, setGatepasses] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([
      api.get('/fees/my-fees').catch(() => ({ data: { data: null } })),
      api.get('/gatepasses/my-gatepasses').catch(() => ({ data: { data: [] } })),
    ]).then(([fees, gp]) => {
      setSummary(fees.data.data)
      setGatepasses(gp.data.data?.slice(0, 3) || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>

  return (
    <div className="animate-fadeup">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
          Welcome back 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Here's your hostel overview</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Pending', value: `₹${summary?.totalPending?.toLocaleString() || 0}`, color: 'amber', icon: '⏳' },
          { label: 'Total Paid', value: `₹${summary?.totalPaid?.toLocaleString() || 0}`, color: 'green', icon: '✅' },
          { label: 'Overdue Fees', value: summary?.overdueCount || 0, color: 'rose', icon: '⚠️' },
          { label: 'My Gatepasses', value: gatepasses.length, color: 'violet', icon: '📋' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: `var(--${s.color})`, fontSize: '1.6rem' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ fontSize: '1.4rem', background: `var(--${s.color}-dim)`, padding: '0.4rem', borderRadius: 8 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>Recent Gatepasses</div>
        {gatepasses.length === 0 ? (
          <div className="empty-state"><p>No gatepass requests yet</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {gatepasses.map(gp => (
              <div key={gp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--surface2)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{gp.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>📍 {gp.destination || 'Not specified'}</div>
                </div>
                <span className={`badge ${gp.status === 'APPROVED' ? 'badge-green' : gp.status === 'PENDING' ? 'badge-amber' : gp.status === 'REJECTED' ? 'badge-rose' : 'badge-cyan'}`}>
                  {gp.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== FEES =====
export function StudentFees() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/fees/my-fees').then(res => { setSummary(res.data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>

  const statusBadge = s => ({ PENDING: 'badge-amber', PAID: 'badge-green', OVERDUE: 'badge-rose', WAIVED: 'badge-gray' }[s] || 'badge-gray')

  return (
    <div className="animate-fadeup">
      <h1 className="page-title">My Fees</h1>
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card amber"><div className="stat-value" style={{ color: 'var(--amber)', fontSize: '1.5rem' }}>₹{summary?.totalPending?.toLocaleString() || 0}</div><div className="stat-label">Total Pending</div></div>
        <div className="stat-card green"><div className="stat-value" style={{ color: 'var(--green)', fontSize: '1.5rem' }}>₹{summary?.totalPaid?.toLocaleString() || 0}</div><div className="stat-label">Total Paid</div></div>
        <div className="stat-card rose"><div className="stat-value" style={{ color: 'var(--rose)', fontSize: '1.5rem' }}>{summary?.overdueCount || 0}</div><div className="stat-label">Overdue</div></div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Payment History</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Month</th><th>Room</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              {!summary?.history?.length ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>No fee records found</td></tr>
              ) : summary.history.map(f => (
                <tr key={f.id}>
                  <td style={{ fontFamily: 'var(--font-display)' }}>{f.month}</td>
                  <td>{f.roomNumber}</td>
                  <td style={{ color: 'var(--cyan)', fontWeight: 600 }}>₹{f.amount?.toLocaleString()}</td>
                  <td style={{ color: f.overdue ? 'var(--rose)' : 'var(--text2)' }}>{new Date(f.dueDate).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge ${statusBadge(f.status)}`}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ===== GATEPASS =====
export function StudentGatepass() {
  const [gatepasses, setGatepasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ reason: '', destination: '', expectedReturn: '' })
  const [saving, setSaving] = useState(false)
  const [qrModal, setQrModal] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const res = await api.get('/gatepasses/my-gatepasses'); setGatepasses(res.data.data || []) }
    catch { toast.error('Failed to load') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/gatepasses', { ...form, expectedReturn: new Date(form.expectedReturn).toISOString() })
      toast.success('Gatepass request submitted!'); setModal(false); setForm({ reason: '', destination: '', expectedReturn: '' }); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const downloadQR = async (id) => {
    try {
      const res = await api.get(`/gatepasses/${id}/qr`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      setQrModal(url)
    } catch (err) { toast.error(err.response?.data?.message || 'QR not available') }
  }

  const statusBadge = s => ({ PENDING: 'badge-amber', APPROVED: 'badge-green', REJECTED: 'badge-rose', USED: 'badge-cyan', EXPIRED: 'badge-gray' }[s] || 'badge-gray')

  return (
    <div className="animate-fadeup">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">My Gatepasses</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Request permission to exit the hostel</p>
        </div>
        <button className="btn btn-primary" style={{ background: 'var(--violet)', boxShadow: '0 0 20px rgba(179,136,255,0.3)' }} onClick={() => setModal(true)}>+ Request Gatepass</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {gatepasses.length === 0 ? <div className="card empty-state"><p>No gatepass requests yet</p></div>
          : gatepasses.map(gp => (
            <div key={gp.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{gp.reason}</span>
                    <span className={`badge ${statusBadge(gp.status)}`}>{gp.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.3rem' }}>
                    📍 {gp.destination || 'Not specified'} · Return: {gp.expectedReturn ? new Date(gp.expectedReturn).toLocaleString('en-IN') : '—'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Requested: {new Date(gp.requestedAt).toLocaleDateString('en-IN')}</div>
                  {gp.wardenRemark && <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: gp.status === 'REJECTED' ? 'var(--rose)' : 'var(--text2)' }}>Warden: {gp.wardenRemark}</div>}
                  {gp.exitTime && <div style={{ fontSize: '0.78rem', color: 'var(--green)', marginTop: '0.2rem' }}>✅ Exited: {new Date(gp.exitTime).toLocaleString()}</div>}
                  {gp.entryTime && <div style={{ fontSize: '0.78rem', color: 'var(--violet)', marginTop: '0.1rem' }}>🏠 Returned: {new Date(gp.entryTime).toLocaleString()}</div>}
                </div>
                {gp.status === 'APPROVED' && gp.hasQR && (
                  <button className="btn btn-ghost btn-sm" onClick={() => downloadQR(gp.id)}
                    style={{ border: '1px solid rgba(179,136,255,0.4)', color: 'var(--violet)', flexShrink: 0 }}>
                    📷 View QR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && createPortal(
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
    <div className="modal">
      <div className="modal-header">
        <span className="modal-title">Request Gatepass</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div className="input-group">
          <label className="input-label">Reason *</label>
          <input
            className="input"
            required
            placeholder="e.g. Medical appointment"
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Destination</label>
          <input
            className="input"
            placeholder="e.g. Apollo Hospital, Jubilee Hills"
            value={form.destination}
            onChange={e => setForm({ ...form, destination: e.target.value })}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Expected Return *</label>
          <input
            className="input"
            type="datetime-local"
            required
            value={form.expectedReturn}
            onChange={e => setForm({ ...form, expectedReturn: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ background: 'var(--violet)', boxShadow: '0 0 20px rgba(179,136,255,0.3)' }}
          >
            {saving
              ? <>
                  <span className="spinner" style={{ width: 14, height: 14 }} /> Submitting...
                </>
              : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  </div>,
  document.body
)}

      {qrModal && createPortal(
  <div className="modal-overlay" onClick={() => setQrModal(null)}>
    <div className="modal" style={{ textAlign: 'center', maxWidth: 340 }}>
      <div className="modal-header">
        <span className="modal-title">Your Gatepass QR</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setQrModal(null)}>✕</button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: '1rem', display: 'inline-block', margin: '0.5rem auto' }}>
        <img src={qrModal} alt="Gatepass QR" style={{ width: 220, height: 220, display: 'block' }} />
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: '0.75rem' }}>
        Show this QR to the security guard at the gate
      </p>

      <a
        href={qrModal}
        download="gatepass-qr.png"
        className="btn btn-primary"
        style={{ marginTop: '1rem', display: 'inline-flex' }}
      >
        ⬇ Download QR
      </a>
    </div>
  </div>,
  document.body
)}
    </div>
  )
}
  
  

// ===== COMPLAINTS =====
export function StudentComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ category: 'MAINTENANCE', title: '', description: '', priorityLevel: 2 })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const res = await api.get('/complaints/my-complaints'); setComplaints(res.data.data || []) }
    catch { toast.error('Failed to load') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/complaints', { ...form, priorityLevel: Number(form.priorityLevel) })
      toast.success('Complaint raised!'); setModal(false); setForm({ category: 'MAINTENANCE', title: '', description: '', priorityLevel: 2 }); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const statusBadge = s => ({ OPEN: 'badge-rose', ASSIGNED: 'badge-amber', IN_PROGRESS: 'badge-violet', RESOLVED: 'badge-green', CLOSED: 'badge-gray' }[s] || 'badge-gray')

  return (
    <div className="animate-fadeup">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div><h1 className="page-title">My Complaints</h1></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Raise Complaint</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {complaints.length === 0 ? <div className="card empty-state"><p>No complaints raised yet</p></div>
          : complaints.map(c => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-gray">{c.category}</span>
                    <span className="badge badge-amber">P{c.priorityLevel} {c.priorityLabel}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{c.description}</div>
                  {c.assignedTo && <div style={{ fontSize: '0.8rem', color: 'var(--cyan)', marginTop: '0.3rem' }}>Assigned to: {c.assignedTo}</div>}
                  {c.resolutionNote && <div style={{ fontSize: '0.8rem', color: 'var(--green)', marginTop: '0.2rem' }}>✅ {c.resolutionNote}</div>}
                </div>
                <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Raise Complaint</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Category *</label>
                  <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {['MAINTENANCE','FOOD','NOISE','ELECTRICAL','PLUMBING','INTERNET','CLEANLINESS','OTHER'].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div className="input-group"><label className="input-label">Priority</label>
                  <select className="input" value={form.priorityLevel} onChange={e => setForm({ ...form, priorityLevel: e.target.value })}>
                    <option value={1}>1 - Low</option><option value={2}>2 - Medium</option>
                    <option value={3}>3 - High</option><option value={4}>4 - Critical</option><option value={5}>5 - Emergency</option>
                  </select></div>
              </div>
              <div className="input-group"><label className="input-label">Title *</label>
                <input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Submitting...</> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
