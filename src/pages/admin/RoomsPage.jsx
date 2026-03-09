import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EMPTY_ROOM = { roomNumber:'', type:'SINGLE', capacity:1, floor:'', block:'', monthlyFee:'', amenities:'' }
const EMPTY_BOOKING = { studentId:'', roomId:'', checkInDate: new Date().toISOString().split('T')[0] }

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [roomModal, setRoomModal] = useState(false)
  const [bookingModal, setBookingModal] = useState(false)
  const [form, setForm] = useState(EMPTY_ROOM)
  const [booking, setBooking] = useState(EMPTY_BOOKING)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('ALL')

  const load = async () => {
    setLoading(true)
    const [r, s] = await Promise.all([
      api.get('/rooms').catch(() => ({ data: { data: [] } })),
      api.get('/students?status=ACTIVE').catch(() => ({ data: { data: [] } })),
    ])
    setRooms(r.data.data || [])
    setStudents(s.data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveRoom = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/rooms', { ...form, capacity: Number(form.capacity), floor: Number(form.floor) || undefined, monthlyFee: Number(form.monthlyFee) })
      toast.success('Room created!'); setRoomModal(false); setForm(EMPTY_ROOM); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const saveBooking = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/bookings', { ...booking, studentId: Number(booking.studentId), roomId: Number(booking.roomId) })
      toast.success('Room allocated!'); setBookingModal(false); setBooking(EMPTY_BOOKING); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const statusColor = s => s === 'AVAILABLE' ? 'badge-green' : s === 'OCCUPIED' ? 'badge-cyan' : 'badge-amber'
  const typeColor = t => ({ SINGLE:'badge-violet', DOUBLE:'badge-cyan', TRIPLE:'badge-amber', DORMITORY:'badge-rose' }[t] || 'badge-gray')
  const filtered = filter === 'ALL' ? rooms : rooms.filter(r => r.status === filter)

  return (
    <div className="animate-fadeup">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 className="page-title">Rooms</h1>
          <p style={{ color:'var(--text2)', fontSize:'0.875rem' }}>{rooms.length} total rooms</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-ghost" onClick={() => setBookingModal(true)}>🛏️ Allocate Room</button>
          <button className="btn btn-primary" onClick={() => setRoomModal(true)}>+ Add Room</button>
        </div>
      </div>

      {/* Filter */}
      <div className="tabs" style={{ maxWidth:400, marginBottom:'1rem' }}>
        {['ALL','AVAILABLE','OCCUPIED','MAINTENANCE'].map(f => (
          <button key={f} className={`tab-btn ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'All' : f.charAt(0)+f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><div className="spinner"/></div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1rem' }}>
          {filtered.map(room => (
            <div key={room.id} className="card" style={{ borderTop:`2px solid ${room.status==='AVAILABLE'?'var(--green)':room.status==='OCCUPIED'?'var(--cyan)':'var(--amber)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem' }}>{room.roomNumber}</div>
                <span className={`badge ${statusColor(room.status)}`}>{room.status}</span>
              </div>
              <span className={`badge ${typeColor(room.type)}`} style={{ marginBottom:'0.75rem', display:'inline-block' }}>{room.type}</span>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.82rem', color:'var(--text2)' }}>
                <div>🏢 Floor {room.floor || '—'}</div>
                <div>🏷️ Block {room.block || '—'}</div>
                <div>👥 {room.currentOccupants}/{room.capacity} occupied</div>
                <div>💰 ₹{room.monthlyFee?.toLocaleString()}/mo</div>
              </div>
              {/* Capacity bar */}
              <div style={{ marginTop:'0.75rem', background:'var(--bg2)', borderRadius:99, height:4 }}>
                <div style={{ height:'100%', borderRadius:99, width:`${(room.currentOccupants/room.capacity)*100}%`, background:'var(--cyan)', boxShadow:'0 0 8px var(--cyan-glow)' }} />
              </div>
              <div style={{ fontSize:'0.72rem', color:'var(--text3)', marginTop:'0.3rem' }}>{room.availableSlots} slots available</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'2rem', color:'var(--text3)' }}>No rooms found</div>
          )}
        </div>
      )}

      {/* Add Room Modal */}
      {roomModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setRoomModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add New Room</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setRoomModal(false)}>✕</button>
            </div>
            <form onSubmit={saveRoom} style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Room Number *</label>
                  <input className="input" required placeholder="e.g. A-101" value={form.roomNumber} onChange={e => setForm({...form,roomNumber:e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Type *</label>
                  <select className="input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
                    {['SINGLE','DOUBLE','TRIPLE','DORMITORY'].map(t => <option key={t}>{t}</option>)}
                  </select></div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Capacity *</label>
                  <input className="input" type="number" min={1} required value={form.capacity} onChange={e => setForm({...form,capacity:e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Monthly Fee (₹) *</label>
                  <input className="input" type="number" required value={form.monthlyFee} onChange={e => setForm({...form,monthlyFee:e.target.value})} /></div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Floor</label>
                  <input className="input" type="number" value={form.floor} onChange={e => setForm({...form,floor:e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Block</label>
                  <input className="input" placeholder="e.g. A" value={form.block} onChange={e => setForm({...form,block:e.target.value})} /></div>
              </div>
              <div className="input-group"><label className="input-label">Amenities</label>
                <input className="input" placeholder="AC, WiFi, Attached Bath..." value={form.amenities} onChange={e => setForm({...form,amenities:e.target.value})} /></div>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setRoomModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:14,height:14}} /> Saving...</> : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Room Modal */}
      {bookingModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setBookingModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Allocate Room to Student</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setBookingModal(false)}>✕</button>
            </div>
            <form onSubmit={saveBooking} style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
              <div className="input-group"><label className="input-label">Select Student *</label>
                <select className="input" required value={booking.studentId} onChange={e => setBooking({...booking,studentId:e.target.value})}>
                  <option value="">Choose student...</option>
                  {students.filter(s => !s.currentRoom).map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentId})</option>
                  ))}
                </select></div>
              <div className="input-group"><label className="input-label">Select Room *</label>
                <select className="input" required value={booking.roomId} onChange={e => setBooking({...booking,roomId:e.target.value})}>
                  <option value="">Choose room...</option>
                  {rooms.filter(r => r.availableSlots > 0).map(r => (
                    <option key={r.id} value={r.id}>{r.roomNumber} ({r.type}) — {r.availableSlots} slots — ₹{r.monthlyFee}/mo</option>
                  ))}
                </select></div>
              <div className="input-group"><label className="input-label">Check-in Date *</label>
                <input className="input" type="date" required value={booking.checkInDate} onChange={e => setBooking({...booking,checkInDate:e.target.value})} /></div>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setBookingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:14,height:14}} /> Allocating...</> : 'Allocate Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
