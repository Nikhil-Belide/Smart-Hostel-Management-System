import { useState, useEffect } from "react"
import api from "../../services/api"
import toast from "react-hot-toast"


export default function FeesAdminPage() {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [payModal, setPayModal] = useState(null)
  const [payForm, setPayForm] = useState({ amount:'', mode:'CASH', transactionId:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const res = await api.get('/fees'); setFees(res.data.data || []) }
    catch { toast.error('Failed to load fees') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const recordPayment = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/fees/payment', {
        feeRecordId: payModal.id,
        amount: Number(payForm.amount),
        mode: payForm.mode,
        transactionId: payForm.transactionId || undefined
      })
      toast.success('Payment recorded!');
      setPayModal(null);
      setPayForm({ amount:'', mode:'CASH', transactionId:'' });
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  // ✅ Added PARTIAL to badge colors
  const statusBadge = s => ({
    PENDING: 'badge-amber',
    PARTIAL: 'badge-violet',
    PAID: 'badge-green',
    OVERDUE: 'badge-rose',
    WAIVED: 'badge-gray'
  }[s] || 'badge-gray')

  // ✅ Added PARTIAL to filter tabs
  const filtered = filter === 'ALL' ? fees : fees.filter(f => f.status === filter)
  const total = filtered.reduce((sum, f) => sum + (f.amount||0), 0)

  return (
    <div className="animate-fadeup">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p style={{ color:'var(--text2)', fontSize:'0.875rem' }}>{filtered.length} records · ₹{total.toLocaleString()} total</p>
        </div>
        <button className="btn btn-ghost" onClick={async () => { await api.post('/fees/generate-monthly'); toast.success('Monthly fees generated!'); load() }}>
          ⚡ Generate Monthly
        </button>
      </div>

      {/* ✅ Added PARTIAL tab */}
      <div className="tabs" style={{ maxWidth:520, marginBottom:'1rem' }}>
        {['PENDING','PARTIAL','PAID','OVERDUE','ALL'].map(f => (
          <button key={f} className={`tab-btn ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f==='ALL'?'All':f.charAt(0)+f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        {loading ? <div style={{ padding:'2rem', textAlign:'center' }}><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Month</th>
                  <th>Total Amount</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:'2rem', color:'var(--text3)' }}>No records</td></tr>
                ) : filtered.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight:600 }}>{f.studentName}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text3)' }}>{f.studentIdCode}</div>
                    </td>
                    <td>{f.roomNumber}</td>
                    <td>{f.month}</td>
                    <td style={{ fontFamily:'var(--font-display)', color:'var(--cyan)' }}>
                      ₹{f.amount?.toLocaleString()}
                    </td>
                    {/* ✅ Paid so far */}
                    <td style={{ color:'var(--green)' }}>
                      {f.totalPaid > 0 ? `₹${f.totalPaid?.toLocaleString()}` : '—'}
                    </td>
                    {/* ✅ Remaining balance */}
                    <td style={{ color: f.remainingAmount > 0 ? 'var(--rose)' : 'var(--text3)' }}>
                      {f.remainingAmount > 0 ? `₹${f.remainingAmount?.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ color: f.overdue ? 'var(--rose)' : 'var(--text2)' }}>
                      {new Date(f.dueDate).toLocaleDateString('en-IN')}
                      {f.overdue && <div style={{ fontSize:'0.72rem' }}>OVERDUE</div>}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(f.status)}`}>{f.status}</span>
                    </td>
                    <td>
                      {/* ✅ Show button for both PENDING and PARTIAL */}
                      {(f.status === 'PENDING' || f.status === 'PARTIAL') && (
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem', alignItems:'flex-end' }}>
                          {f.status === 'PARTIAL' && (
                            <div style={{ fontSize:'0.72rem', color:'var(--amber)', whiteSpace:'nowrap' }}>
                              Remaining: ₹{f.remainingAmount?.toLocaleString()}
                            </div>
                          )}
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setPayModal(f)
                              setPayForm({
                                amount: f.remainingAmount || f.amount, // ✅ pre-fill remaining
                                mode: 'CASH',
                                transactionId: ''
                              })
                            }}>
                            {f.status === 'PARTIAL' ? '💳 Pay Remaining' : 'Record Payment'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setPayModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Record Payment</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPayModal(null)}>✕</button>
            </div>

            {/* ✅ Show payment summary in modal */}
            <div style={{ background:'var(--surface2)', borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.85rem' }}>
              <div><strong>{payModal.studentName}</strong> — {payModal.month}</div>
              <div style={{ color:'var(--text2)' }}>Room {payModal.roomNumber} · Total: ₹{payModal.amount?.toLocaleString()}</div>
              {payModal.status === 'PARTIAL' && (
                <div style={{ marginTop:'0.4rem', display:'flex', gap:'1rem' }}>
                  <span style={{ color:'var(--green)' }}>✅ Paid: ₹{payModal.totalPaid?.toLocaleString()}</span>
                  <span style={{ color:'var(--rose)' }}>⏳ Remaining: ₹{payModal.remainingAmount?.toLocaleString()}</span>
                </div>
              )}
            </div>

            <form onSubmit={recordPayment} style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
              <div className="input-group">
                <label className="input-label">Amount (₹) *</label>
                <input className="input" type="number" required
                  max={payModal.remainingAmount || payModal.amount}
                  value={payForm.amount}
                  onChange={e => setPayForm({...payForm, amount: e.target.value})} />
                {payModal.status === 'PARTIAL' && (
                  <div style={{ fontSize:'0.75rem', color:'var(--text3)', marginTop:'0.25rem' }}>
                    Max payable: ₹{payModal.remainingAmount?.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="input-group">
                <label className="input-label">Payment Mode *</label>
                <select className="input" value={payForm.mode} onChange={e => setPayForm({...payForm, mode: e.target.value})}>
                  {['CASH','UPI','CARD','NEFT','RTGS','CHEQUE'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Transaction ID</label>
                <input className="input" placeholder="Optional" value={payForm.transactionId}
                  onChange={e => setPayForm({...payForm, transactionId: e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setPayModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:14,height:14}} /> Saving...</> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}