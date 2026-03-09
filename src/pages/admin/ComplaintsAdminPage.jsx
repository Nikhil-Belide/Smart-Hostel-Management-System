import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ComplaintsAdminPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('OPEN')

  const load = async () => {
    setLoading(true)
    try { const res = await api.get('/complaints'); setComplaints(res.data.data || []) }
    catch { toast.error('Failed to load complaints') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const resolve = async (id) => {
    const note = prompt('Resolution note:')
    if (!note) return
    try { await api.patch(`/complaints/${id}/resolve`, { resolutionNote: note }); toast.success('Resolved!'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const assign = async (id) => {
    const name = prompt('Assign to (staff name):')
    if (!name) return
    try { await api.put(`/complaints/${id}/assign`, { assignedTo: name }); toast.success('Assigned!'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const priorityColor = p => p >= 4 ? 'rose' : p >= 3 ? 'amber' : 'green'
  const statusBadge = s => ({ OPEN:'badge-rose', ASSIGNED:'badge-amber', IN_PROGRESS:'badge-violet', RESOLVED:'badge-green', CLOSED:'badge-gray' }[s]||'badge-gray')
  const filtered = filter === 'ALL' ? complaints : complaints.filter(c => c.status === filter)

  return (
    <div className="animate-fadeup">
      <h1 className="page-title">Complaints</h1>
      <p className="page-sub">Manage and resolve student complaints</p>
      <div className="tabs" style={{ maxWidth:600, marginBottom:'1rem' }}>
        {['OPEN','ASSIGNED','IN_PROGRESS','RESOLVED','ALL'].map(f => (
          <button key={f} className={`tab-btn ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f==='ALL'?'All':f==='IN_PROGRESS'?'In Progress':f.charAt(0)+f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><div className="spinner"/></div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {filtered.length === 0 ? <div className="card empty-state"><p>No complaints in this category</p></div>
          : filtered.map(c => (
            <div key={c.id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'0.4rem', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, fontFamily:'var(--font-display)' }}>{c.title}</span>
                    <span className={`badge badge-${priorityColor(c.priorityLevel)}`}>P{c.priorityLevel} {c.priorityLabel}</span>
                    <span className="badge badge-gray">{c.category}</span>
                  </div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text2)', marginBottom:'0.4rem' }}>{c.description}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text3)' }}>
                    By <span style={{ color:'var(--text2)' }}>{c.studentName}</span> · {new Date(c.raisedAt).toLocaleDateString('en-IN')}
                    {c.assignedTo && <span> · Assigned to: <span style={{ color:'var(--cyan)' }}>{c.assignedTo}</span></span>}
                  </div>
                  {c.resolutionNote && <div style={{ fontSize:'0.8rem', color:'var(--green)', marginTop:'0.3rem' }}>✅ {c.resolutionNote}</div>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.5rem' }}>
                  <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
                  {(c.status === 'OPEN' || c.status === 'ASSIGNED') && (
                    <div style={{ display:'flex', gap:'0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => assign(c.id)}>Assign</button>
                      <button className="btn btn-success btn-sm" onClick={() => resolve(c.id)}>Resolve</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

