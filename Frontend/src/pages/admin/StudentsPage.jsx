import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EMPTY = {
  firstName:'', lastName:'', email:'', phone:'',
  course:'', yearOfStudy:'', parentName:'',
  parentPhone:'', parentEmail:'', address:'',
  dateOfBirth:'', gender:'', bloodGroup:'',
  emergencyContact:''
}

export default function StudentsPage() {

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const url = q ? `/students?q=${q}` : '/students'
      const res = await api.get(url)
      setStudents(res.data.data || [])
    } catch {
      toast.error('Failed to load students')
    }
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
      await api.post('/students', {
        ...form,
        dateOfBirth: form.dateOfBirth || undefined
      })

      toast.success('Student registered! Default password = Student ID')
      setModal(false)
      setForm(EMPTY)
      load()

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register')
    }

    setSaving(false)
  }

  const handleCheckout = async (id) => {
    if (!window.confirm("Checkout this student?")) return

    try {
      await api.put(`/students/${id}/checkout`)
      toast.success("Student checked out successfully")
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student permanently?")) return

    try {
      await api.delete(`/students/${id}`)
      toast.success("Student deleted")
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete")
    }
  }

  const statusColor = s =>
    s === 'ACTIVE' ? 'badge-green'
    : s === 'SUSPENDED' ? 'badge-rose'
    : s === 'CHECKED_OUT' ? 'badge-gray'
    : 'badge-gray'

  return (
    <div className="animate-fadeup">

      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <h1 className="page-title">Students</h1>
          <p style={{ color:'var(--text2)', fontSize:'0.875rem' }}>
            {students.length} registered students
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + Register Student
        </button>
      </div>

      <div className="card" style={{ marginBottom:'1rem', padding:'0.75rem 1rem' }}>
        <input
          className="input"
          placeholder="🔍 Search by name, ID, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth:400 }}
        />
      </div>

      <div className="card" style={{ padding:0 }}>

        {loading ? (
          <div style={{ padding:'2rem', textAlign:'center' }}>
            <div className="spinner" />
          </div>
        ) : (

          <div className="table-wrap">

            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign:'center', padding:'2rem' }}>
                      No students found
                    </td>
                  </tr>
                ) : students.map(s => (

                  <tr key={s.id}>

                    <td>
                      <div style={{ display:'flex', gap:'0.6rem' }}>
                        <div className="avatar">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight:600 }}>{s.fullName}</div>
                          <div style={{ fontSize:'0.78rem', color:'var(--text3)' }}>
                            {s.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <code style={{
                        background:'var(--bg2)',
                        padding:'0.2rem 0.5rem',
                        borderRadius:6,
                        fontSize:'0.8rem'
                      }}>
                        {s.studentId}
                      </code>
                    </td>

                    <td>{s.course || '—'}</td>
                    <td>{s.yearOfStudy || '—'}</td>

                    <td>
                      {s.currentRoom
                        ? <span className="badge badge-cyan">{s.currentRoom}</span>
                        : <span>Not assigned</span>}
                    </td>

                    <td>
                      <span className={`badge ${statusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </td>

                    <td>{s.parentPhone || '—'}</td>

                    <td style={{ display:'flex', gap:'0.5rem' }}>

                      {s.status === 'ACTIVE' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color:'var(--amber)' }}
                          onClick={() => handleCheckout(s.id)}
                        >
                          Checkout
                        </button>
                      )}

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color:'var(--rose)' }}
                        onClick={() => handleDelete(s.id)}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

      </div>

      {modal && createPortal(

        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <span className="modal-title">Register New Student</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>

            <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>

              <div className="grid-2">
                <input className="input" placeholder="First Name"
                  value={form.firstName}
                  onChange={e => setForm({...form, firstName:e.target.value})}
                  required
                />

                <input className="input" placeholder="Last Name"
                  value={form.lastName}
                  onChange={e => setForm({...form, lastName:e.target.value})}
                  required
                />
              </div>

              <input className="input" placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                required
              />

              <input className="input" placeholder="Phone"
                value={form.phone}
                onChange={e => setForm({...form, phone:e.target.value})}
              />

              <div className="grid-2">
                <input className="input" placeholder="Course"
                  value={form.course}
                  onChange={e => setForm({...form, course:e.target.value})}
                />

                <input className="input" placeholder="Year Of Study"
                  value={form.yearOfStudy}
                  onChange={e => setForm({...form, yearOfStudy:e.target.value})}
                />
              </div>

              <div className="grid-2">
                <input className="input" placeholder="Parent Name"
                  value={form.parentName}
                  onChange={e => setForm({...form, parentName:e.target.value})}
                />

                <input className="input" placeholder="Parent Phone"
                  value={form.parentPhone}
                  onChange={e => setForm({...form, parentPhone:e.target.value})}
                />
              </div>

              <input className="input" placeholder="Parent Email"
                value={form.parentEmail}
                onChange={e => setForm({...form, parentEmail:e.target.value})}
              />

              <input className="input" placeholder="Address"
                value={form.address}
                onChange={e => setForm({...form, address:e.target.value})}
              />

              <div className="grid-2">
                <input type="date" className="input"
                  value={form.dateOfBirth}
                  onChange={e => setForm({...form, dateOfBirth:e.target.value})}
                />

                <input className="input" placeholder="Gender"
                  value={form.gender}
                  onChange={e => setForm({...form, gender:e.target.value})}
                />
              </div>

              <div className="grid-2">
                <input className="input" placeholder="Blood Group"
                  value={form.bloodGroup}
                  onChange={e => setForm({...form, bloodGroup:e.target.value})}
                />

                <input className="input" placeholder="Emergency Contact"
                  value={form.emergencyContact}
                  onChange={e => setForm({...form, emergencyContact:e.target.value})}
                />
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Register Student'}
                </button>
              </div>

            </form>

          </div>
        </div>,

        document.body
      )}

    </div>
  )
}