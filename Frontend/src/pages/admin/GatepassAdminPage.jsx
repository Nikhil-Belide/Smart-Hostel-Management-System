import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function GatepassAdminPage() {
  const [gatepasses, setGatepasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [remark, setRemark] = useState('')
  const [remarkId, setRemarkId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/gatepasses')
      setGatepasses(res.data.data || [])
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const approve = async (id) => {
    try {
      await api.put(`/gatepasses/${id}/approve`, { remark: remark || 'Approved' })
      toast.success('✅ Gatepass approved & QR generated!')
      setRemarkId(null); setRemark(''); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const reject = async (id) => {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    try {
      await api.put(`/gatepasses/${id}/reject`, { reason })
      toast.success('Gatepass rejected'); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const statusBadge = s => ({
    PENDING: 'badge-amber', APPROVED: 'badge-green', REJECTED: 'badge-rose',
    USED: 'badge-cyan', EXPIRED: 'badge-gray'
  }[s] || 'badge-gray')

  const filtered = filter === 'ALL' ? gatepasses : gatepasses.filter(g => g.status === filter)
  const counts = ['PENDING','APPROVED','USED','REJECTED'].reduce((acc,s) => ({ ...acc, [s]: gatepasses.filter(g=>g.status===s).length }), {})

  return (
    <div className="animate-fadeup">
      <h1 className="page-title">Gatepass Management</h1>
      <p className="page-sub">Review and approve student exit requests</p>

      {/* Count chips */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {[
          { label:'Pending', key:'PENDING', color:'amber' },
          { label:'Approved', key:'APPROVED', color:'green' },
          { label:'Used', key:'USED', color:'cyan' },
          { label:'Rejected', key:'REJECTED', color:'rose' },
        ].map(c => (
          <div key={c.key} className={`stat-card ${c.color}`} style={{ padding:'0.75rem 1.25rem', cursor:'pointer', flex:'0 0 auto' }} onClick={() => setFilter(c.key)}>
            <div style={{ fontSize:'1.4rem', fontWeight:800, fontFamily:'var(--font-display)', color:`var(--${c.color})` }}>{counts[c.key] || 0}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text2)' }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ maxWidth:500, marginBottom:'1rem' }}>
        {['PENDING','APPROVED','USED','REJECTED','ALL'].map(f => (
          <button key={f} className={`tab-btn ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f==='ALL'?'All':f.charAt(0)+f.slice(1).toLowerCase()}
            {f!=='ALL' && counts[f] ? ` (${counts[f]})` : ''}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><div className="spinner"/></div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {filtered.length === 0 ? (
            <div className="card empty-state"><p>No {filter.toLowerCase()} gatepasses</p></div>
          ) : filtered.map(gp => (
            <div key={gp.id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
                <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
                  <div className="avatar" style={{ width:40, height:40 }}>{gp.studentName?.[0]}</div>
                  <div>
                    <div style={{ fontWeight:700, fontFamily:'var(--font-display)' }}>{gp.studentName}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--cyan)', marginBottom:'0.4rem' }}>{gp.studentIdCode}</div>
                    <div style={{ fontSize:'0.85rem', color:'var(--text2)' }}>
                      <span style={{ marginRight:'1rem' }}>📍 {gp.destination || 'Not specified'}</span>
                      <span>🕐 Return: {gp.expectedReturn ? new Date(gp.expectedReturn).toLocaleString('en-IN') : '—'}</span>
                    </div>
                    <div style={{ fontSize:'0.85rem', marginTop:'0.3rem', color:'var(--text)' }}>
                      <strong>Reason:</strong> {gp.reason}
                    </div>
                    {gp.wardenRemark && <div style={{ fontSize:'0.8rem', color:'var(--text3)', marginTop:'0.2rem' }}>Remark: {gp.wardenRemark}</div>}
                    {gp.exitTime && <div style={{ fontSize:'0.78rem', color:'var(--green)', marginTop:'0.3rem' }}>✅ Exit: {new Date(gp.exitTime).toLocaleString()}</div>}
                    {gp.entryTime && <div style={{ fontSize:'0.78rem', color:'var(--violet)', marginTop:'0.1rem' }}>🏠 Entry: {new Date(gp.entryTime).toLocaleString()}</div>}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.5rem' }}>
                  <span className={`badge ${statusBadge(gp.status)}`}>{gp.status}</span>
                  <div style={{ fontSize:'0.75rem', color:'var(--text3)' }}>{new Date(gp.requestedAt).toLocaleDateString('en-IN')}</div>
                  {gp.status === 'PENDING' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', alignItems:'flex-end' }}>
                      {remarkId === gp.id ? (
                        <>
                          <input className="input" placeholder="Add remark (optional)" value={remark}
                            onChange={e => setRemark(e.target.value)} style={{ fontSize:'0.8rem', padding:'0.4rem 0.7rem', width:200 }} />
                          <div style={{ display:'flex', gap:'0.4rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setRemarkId(null)}>Cancel</button>
                            <button className="btn btn-success btn-sm" onClick={() => approve(gp.id)}>✓ Confirm Approve</button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display:'flex', gap:'0.5rem' }}>
                          <button className="btn btn-danger btn-sm" onClick={() => reject(gp.id)}>✕ Reject</button>
                          <button className="btn btn-success btn-sm" onClick={() => { setRemarkId(gp.id); setRemark('') }}>✓ Approve</button>
                        </div>
                      )}
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
