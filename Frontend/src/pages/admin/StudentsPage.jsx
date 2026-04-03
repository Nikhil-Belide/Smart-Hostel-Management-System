import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EMPTY = { firstName:'', lastName:'', email:'', phone:'', course:'', yearOfStudy:'', parentName:'', parentPhone:'', parentEmail:'', address:'', dateOfBirth:'', gender:'', bloodGroup:'', emergencyContact:'' }

// ─── Student Profile Modal ───────────────────────────────────────────────────
function StudentProfile({ student, onClose, onCheckout, onDelete }) {
  const [tab, setTab] = useState('profile')
  const [fees, setFees] = useState([])
  const [gatepasses, setGatepasses] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
  if (!student) return
  setLoading(true)
  Promise.all([
    api.get('/fees').catch(() => ({ data: { data: [] } })),
    api.get('/gatepasses').catch(() => ({ data: { data: [] } })),
    api.get('/complaints').catch(() => ({ data: { data: [] } })),
  ]).then(([f, g, c]) => {
    setFees((f.data.data || []).filter(x => x.studentId == student.id))
    setGatepasses((g.data.data || []).filter(x => x.studentId == student.id))
    setComplaints((c.data.data || []).filter(x => x.studentId == student.id))
  }).finally(() => setLoading(false))
}, [student])

  if (!student) return null

  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`
  const totalFees = fees.reduce((s, f) => s + (f.amount || 0), 0)
  const totalPaid = fees.reduce((s, f) => s + (f.totalPaid || 0), 0)
  const totalDue = totalFees - totalPaid

  const feeStatusColor = s => ({ PENDING:'badge-amber', PARTIAL:'badge-violet', PAID:'badge-green', OVERDUE:'badge-rose' }[s] || 'badge-gray')
  const gpStatusColor = s => ({ PENDING:'badge-amber', APPROVED:'badge-green', USED:'badge-gray', REJECTED:'badge-rose' }[s] || 'badge-gray')
  const cStatusColor = s => ({ OPEN:'badge-rose', ASSIGNED:'badge-amber', RESOLVED:'badge-green' }[s] || 'badge-gray')

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'fees', label: `💰 Fees (${fees.length})` },
    { id: 'gatepasses', label: `🎫 Gatepasses (${gatepasses.length})` },
    { id: 'complaints', label: `📋 Complaints (${complaints.length})` },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: '#fff', flexShrink: 0
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>{student.fullName}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{student.email}</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <code style={{ background: 'var(--bg2)', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.78rem', color: 'var(--cyan)' }}>{student.studentId}</code>
              <span className={`badge ${student.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{student.status}</span>
              {student.currentRoom && <span className="badge badge-cyan">Room {student.currentRoom}</span>}
            </div>
          </div>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--rose)', fontSize: '1rem' }}>₹{totalDue.toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Due</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--amber)', fontSize: '1rem' }}>{gatepasses.filter(g => g.status === 'PENDING').length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Pending GP</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg2)', borderRadius: 10, padding: '0.25rem' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-display)',
              background: tab === t.id ? 'var(--surface2)' : 'transparent',
              color: tab === t.id ? 'var(--cyan)' : 'var(--text2)',
              transition: 'all 0.15s'
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
            {/* ── Profile Tab ── */}
            {tab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    ['Full Name', student.fullName],
                    ['Email', student.email],
                    ['Phone', student.phone || '—'],
                    ['Gender', student.gender || '—'],
                    ['Blood Group', student.bloodGroup || '—'],
                    ['Course', student.course || '—'],
                    ['Year of Study', student.yearOfStudy || '—'],
                    ['Current Room', student.currentRoom || 'Not assigned'],
                    ['Parent Name', student.parentName || '—'],
                    ['Parent Phone', student.parentPhone || '—'],
                    ['Emergency Contact', student.emergencyContact || '—'],
                    ['Joined', student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN') : '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '0.6rem 0.85rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: '0.2rem' }}>{label}</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  {student.status === 'ACTIVE' && (
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--amber)' }}
                      onClick={() => { onCheckout(student.id); onClose() }}>
                      Checkout Student
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }}
                    onClick={() => { onDelete(student.id); onClose() }}>
                    Delete Student
                  </button>
                </div>
              </div>
            )}

            {/* ── Fees Tab ── */}
            {tab === 'fees' && (
              <div>
                {/* Summary bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                  {[
                    ['Total Fees', `₹${totalFees.toLocaleString()}`, 'var(--cyan)'],
                    ['Total Paid', `₹${totalPaid.toLocaleString()}`, 'var(--green)'],
                    ['Total Due', `₹${totalDue.toLocaleString()}`, totalDue > 0 ? 'var(--rose)' : 'var(--green)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color }}>{val}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {fees.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>No fee records found</div>
                ) : fees.map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface2)', borderRadius: 10, marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{f.month}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Room {f.roomNumber} · Due {new Date(f.dueDate).toLocaleDateString('en-IN')}</div>
                      {f.totalPaid > 0 && f.status !== 'PAID' && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--amber)', marginTop: '0.2rem' }}>
                          Paid ₹{f.totalPaid?.toLocaleString()} · Remaining ₹{f.remainingAmount?.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--cyan)' }}>₹{f.amount?.toLocaleString()}</div>
                      <span className={`badge ${feeStatusColor(f.status)}`}>{f.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Gatepasses Tab ── */}
            {tab === 'gatepasses' && (
              <div>
                {gatepasses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>No gatepasses found</div>
                ) : gatepasses.map(g => (
                  <div key={g.id} style={{ padding: '0.75rem 1rem', background: 'var(--surface2)', borderRadius: 10, marginBottom: '0.5rem', borderLeft: `3px solid ${g.status === 'USED' ? 'var(--green)' : g.status === 'APPROVED' ? 'var(--cyan)' : g.status === 'REJECTED' ? 'var(--rose)' : 'var(--amber)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{g.reason || 'No reason provided'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '0.2rem' }}>📍 {g.destination || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '0.2rem' }}>
                          Requested: {g.requestedAt ? new Date(g.requestedAt).toLocaleDateString('en-IN') : '—'}
                          {g.exitTime && ` · Exit: ${new Date(g.exitTime).toLocaleTimeString()}`}
                          {g.entryTime && ` · Entry: ${new Date(g.entryTime).toLocaleTimeString()}`}
                        </div>
                      </div>
                      <span className={`badge ${gpStatusColor(g.status)}`}>{g.status}</span>
                    </div>
                    {g.expectedReturn && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '0.3rem' }}>
                        Expected Return: {new Date(g.expectedReturn).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Complaints Tab ── */}
            {tab === 'complaints' && (
              <div>
                {complaints.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>No complaints found</div>
                ) : complaints.map(c => (
                  <div key={c.id} style={{ padding: '0.75rem 1rem', background: 'var(--surface2)', borderRadius: 10, marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.title}</div>
                      <span className={`badge ${cStatusColor(c.status)}`}>{c.status}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '0.3rem' }}>{c.description}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                      {c.category} · Priority {c.priorityLevel}
                      {c.assignedTo && ` · Assigned to ${c.assignedTo}`}
                    </div>
                    {c.resolutionNote && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '0.3rem' }}>✅ {c.resolutionNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Students Page ──────────────────────────────────────────────────────
export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const url = q ? `/students?q=${q}` : '/students'
      const res = await api.get(url)
      setStudents(res.data.data || [])
    } catch { toast.error('Failed to load students') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setTimeout(() => load(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/students', { ...form, dateOfBirth: form.dateOfBirth || undefined })
      toast.success('Student registered! Default password = Student ID')
      setModal(false); setForm(EMPTY); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register')
    }
    setSaving(false)
  }

  const checkout = async (id) => {
    if (!window.confirm('Checkout this student?')) return
    try { await api.put(`/students/${id}/checkout`); toast.success('Checked out!'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const deleteStudent = async (id) => {
    if (!window.confirm('Delete this student? This cannot be undone.')) return
    try { await api.delete(`/students/${id}`); toast.success('Deleted!'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const statusColor = s => s === 'ACTIVE' ? 'badge-green' : s === 'SUSPENDED' ? 'badge-rose' : 'badge-gray'

  return (
    <div className="animate-fadeup">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 className="page-title">Students</h1>
          <p style={{ color:'var(--text2)', fontSize:'0.875rem' }}>{students.length} registered students</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Register Student</button>
      </div>

      <div className="card" style={{ marginBottom:'1rem', padding:'0.75rem 1rem' }}>
        <input className="input" placeholder="🔍  Search by name, ID, email..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth:400 }} />
      </div>

      <div className="card" style={{ padding:0 }}>
        {loading ? (
          <div style={{ padding:'2rem', textAlign:'center' }}><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Student</th><th>ID</th><th>Course</th><th>Year</th><th>Room</th><th>Status</th><th>Parent</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:'var(--text3)' }}>No students found</td></tr>
                ) : students.map(s => (
                  <tr key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                        <div className="avatar">{s.firstName?.[0]}{s.lastName?.[0]}</div>
                        <div>
                          <div style={{ fontWeight:600 }}>{s.fullName}</div>
                          <div style={{ fontSize:'0.78rem', color:'var(--text3)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ background:'var(--bg2)', padding:'0.2rem 0.5rem', borderRadius:6, fontSize:'0.8rem', color:'var(--cyan)' }}>{s.studentId}</code></td>
                    <td>{s.course || '—'}</td>
                    <td>{s.yearOfStudy || '—'}</td>
                    <td>{s.currentRoom ? <span className="badge badge-cyan">{s.currentRoom}</span> : <span style={{ color:'var(--text3)' }}>Not assigned</span>}</td>
                    <td><span className={`badge ${statusColor(s.status)}`}>{s.status}</span></td>
                    <td style={{ fontSize:'0.8rem' }}>{s.parentPhone || '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display:'flex', gap:'0.4rem' }}>
                        {s.status === 'ACTIVE' && (
                          <button className="btn btn-ghost btn-sm" style={{ color:'var(--amber)', fontSize:'0.75rem' }}
                            onClick={() => checkout(s.id)}>Checkout</button>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ color:'var(--rose)', fontSize:'0.75rem' }}
                          onClick={() => deleteStudent(s.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onCheckout={checkout}
          onDelete={deleteStudent}
        />
      )}

      {/* Register Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Register New Student</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={save} style={{ display:'flex',flexDirection:'column',gap:'0.85rem',flex:1,overflowY:'auto',paddingRight:'0.25rem'}}>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">First Name *</label>
                  <input className="input" required value={form.firstName} onChange={e => setForm({...form,firstName:e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Last Name *</label>
                  <input className="input" required value={form.lastName} onChange={e => setForm({...form,lastName:e.target.value})} /></div>
              </div>
              <div className="input-group"><label className="input-label">Email *</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm({...form,email:e.target.value})} /></div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Date of Birth</label>
                  <input className="input" type="date" value={form.dateOfBirth} onChange={e => setForm({...form,dateOfBirth:e.target.value})} /></div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Course</label>
                  <input className="input" value={form.course} onChange={e => setForm({...form,course:e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Year of Study</label>
                  <input className="input" placeholder="e.g. 2nd Year" value={form.yearOfStudy} onChange={e => setForm({...form,yearOfStudy:e.target.value})} /></div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Gender</label>
                  <select className="input" value={form.gender} onChange={e => setForm({...form,gender:e.target.value})}>
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                  </select></div>
                <div className="input-group"><label className="input-label">Blood Group</label>
                  <input className="input" placeholder="e.g. B+" value={form.bloodGroup} onChange={e => setForm({...form,bloodGroup:e.target.value})} /></div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Parent Name</label>
                  <input className="input" value={form.parentName} onChange={e => setForm({...form,parentName:e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Parent Phone</label>
                  <input className="input" value={form.parentPhone} onChange={e => setForm({...form,parentPhone:e.target.value})} /></div>
              </div>
              <div className="input-group">
  <label className="input-label">Hostel Fee (₹)</label>
  <input
    className="input"
    type="number"
    placeholder="e.g. 5000"
    value={form.hostelFee || ''}
    onChange={e => setForm({...form, hostelFee:e.target.value})}
  />
</div>
              <div className="input-group"><label className="input-label">Emergency Contact</label>
                <input className="input" value={form.emergencyContact} onChange={e => setForm({...form,emergencyContact:e.target.value})} /></div>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:14,height:14}} /> Saving...</> : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
