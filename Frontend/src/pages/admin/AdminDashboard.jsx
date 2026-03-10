import { useState, useEffect } from 'react'
import api from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [occupancy, setOccupancy] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/rooms/occupancy').catch(() => ({ data: { data: {} } })),
      api.get('/gatepasses/pending').catch(() => ({ data: { data: [] } })),
      api.get('/fees/overdue').catch(() => ({ data: { data: [] } })),
      api.get('/students').catch(() => ({ data: { data: [] } })),
    ]).then(([occ, gp, fees, students]) => {
      setOccupancy(occ.data.data)
      setPending(gp.data.data?.slice(0, 5) || [])
      setStats({
        students: students.data.data?.length || 0,
        pendingGatepasses: gp.data.data?.length || 0,
        overdueFees: fees.data.data?.length || 0,
        occupancyRate: occ.data.data?.occupancyRate?.toFixed(1) || 0,
      })
      setLoading(false)
    })
  }, [])

  const chartData = occupancy ? [
    { name: 'Available', value: occupancy.availableRooms || 0, color: '#00e676' },
    { name: 'Occupied', value: occupancy.occupiedRooms || 0, color: '#00e5ff' },
    { name: 'Maintenance', value: occupancy.maintenanceRooms || 0, color: '#ffb300' },
  ] : []

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>

  return (
    <div className="animate-fadeup">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Welcome back! Here's what's happening today.</p>

      <div className="stats-grid">
        {[
          { label: 'Total Students', value: stats?.students || 0, color: 'cyan', icon: '👤' },
          { label: 'Occupancy Rate', value: `${stats?.occupancyRate || 0}%`, color: 'violet', icon: '🏠' },
          { label: 'Pending Gatepasses', value: stats?.pendingGatepasses || 0, color: 'amber', icon: '📋' },
          { label: 'Overdue Fees', value: stats?.overdueFees || 0, color: 'rose', icon: '💳' },
          { label: 'Total Rooms', value: occupancy?.totalRooms || 0, color: 'green', icon: '🛏️' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: `var(--${s.color})` }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div className={`stat-icon`} style={{ background: `var(--${s.color}-dim)`, fontSize: '1.3rem' }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Room chart */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.25rem' }}>Room Status</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Current occupancy breakdown</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: 12, fontFamily: 'var(--font-display)' }} />
              <YAxis stroke="var(--text3)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending gatepasses */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.25rem' }}>Pending Gatepasses</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Awaiting warden approval</div>
            </div>
            <span className="badge badge-amber">{stats?.pendingGatepasses} pending</span>
          </div>
          {pending.length === 0 ? (
            <div className="empty-state"><p>No pending requests 🎉</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pending.map(gp => (
                <div key={gp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: 'var(--surface2)', borderRadius: 10 }}>
                  <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.72rem' }}>
                    {gp.studentName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }} className="truncate">{gp.studentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }} className="truncate">{gp.reason}</div>
                  </div>
                  <span className="badge badge-amber">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>Capacity Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
          {[
            { label: 'Total Capacity', value: occupancy?.totalCapacity || 0, color: 'var(--text)' },
            { label: 'Occupants', value: occupancy?.totalOccupants || 0, color: 'var(--cyan)' },
            { label: 'Available Slots', value: (occupancy?.totalCapacity - occupancy?.totalOccupants) || 0, color: 'var(--green)' },
            { label: 'Occupancy %', value: `${stats?.occupancyRate || 0}%`, color: 'var(--violet)' },
          ].map(i => (
            <div key={i.label}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: i.color }}>{i.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: '0.2rem' }}>{i.label}</div>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: '1rem', background: 'var(--bg2)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99, width: `${stats?.occupancyRate || 0}%`,
            background: 'linear-gradient(90deg, var(--cyan), var(--violet))',
            boxShadow: '0 0 12px var(--cyan-glow)', transition: 'width 0.8s ease',
          }} />
        </div>
      </div>
    </div>
  )
}
