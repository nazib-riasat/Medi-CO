import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const FILTER_LABELS = {
  'All': 'All',
  'lab_report': 'Lab Reports',
  'scan': 'Scans',
  'prescription': 'Prescriptions',
}

const TYPE_ICONS = {
  'lab_report': '📄',
  'scan': '🩻',
  'prescription': '💊',
  'other': '📁'
}

export default function DoctorView() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')
  const [patient, setPatient] = useState(null)
  const [records, setRecords] = useState([])
  const [medications, setMedications] = useState([])
  const [timeLeft, setTimeLeft] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState([])
  const [viewingFile, setViewingFile] = useState(null)
  const [viewingUrl, setViewingUrl] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)

  useEffect(() => { validateToken() }, [token])

  useEffect(() => {
    if (!expiresAt) return
    const interval = setInterval(() => {
      const diff = new Date(expiresAt) - new Date()
      if (diff <= 0) {
        setTimeLeft(0)
        setStatus('expired')
        clearInterval(interval)
      } else {
        setTimeLeft(Math.floor(diff / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  useEffect(() => { applyFilter() }, [records, activeFilter, search])

  async function validateToken() {
    setStatus('loading')
    const { data: tokenData, error } = await supabase
      .from('qr_token')
      .select('*')
      .eq('token_hash', token)
      .single()

    if (error || !tokenData) { setStatus('invalid'); return }

    const now = new Date()
    const expires = new Date(tokenData.expires_at)
    if (now > expires) { setStatus('expired'); return }

    setExpiresAt(tokenData.expires_at)
    setTimeLeft(Math.floor((expires - now) / 1000))

    await supabase.from('doctor_access_log').insert({
      token_id: tokenData.token_id,
      doctor_name: 'Doctor',
      accessed_at: new Date().toISOString()
    })

    const { data: patientData } = await supabase
      .from('patient').select('*')
      .eq('patient_id', tokenData.patient_id).single()
    setPatient(patientData)

    const { data: recordsData } = await supabase
      .from('medical_record').select('*')
      .eq('patient_id', tokenData.patient_id)
      .order('record_date', { ascending: false })
    setRecords(recordsData || [])

    const { data: medsData } = await supabase
      .from('medication').select('*')
      .eq('patient_id', tokenData.patient_id)
      .order('created_at', { ascending: false })
    setMedications(medsData || [])
    setStatus('valid')
  }

  function applyFilter() {
    let result = [...records]
    if (activeFilter !== 'All') {
      result = result.filter(r => r.record_type === activeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      )
      result.sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(q) ? 1 : 0
        const bExact = b.title.toLowerCase().startsWith(q) ? 1 : 0
        if (bExact !== aExact) return bExact - aExact
        return new Date(b.record_date) - new Date(a.record_date)
      })
    }
    setFiltered(result)
  }

  async function openFile(record) {
    setLoadingFile(true)
    setViewingFile(record)
    const { data } = await supabase.storage
      .from('medical-files')
      .createSignedUrl(record.file_url, 300)
    setViewingUrl(data?.signedUrl)
    setLoadingFile(false)
  }

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--'
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const activeMeds = medications.filter(m => m.is_active)
  const pastMeds = medications.filter(m => !m.is_active)

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif' }}>
        <p style={{ fontSize: 16, color: '#888' }}>Verifying access...</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif', padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 56, marginBottom: 16 }}>🔗</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#c62828', marginBottom: 8 }}>Invalid QR Code</h2>
        <p style={{ fontSize: 14, color: '#888' }}>This link is not valid. Please ask the caregiver to generate a new QR code.</p>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif', padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 56, marginBottom: 16 }}>🔒</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#c62828', marginBottom: 8 }}>Access Expired</h2>
        <p style={{ fontSize: 14, color: '#888' }}>This QR code has expired. Please ask the caregiver to generate a new one.</p>
      </div>
    )
  }

  if (viewingFile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#111', fontFamily: 'Poppins, sans-serif' }}>
        <div style={{ background: '#1D7C57', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => { setViewingFile(null); setViewingUrl(null) }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            Back
          </button>
          <span style={{ color: 'white', fontWeight: 600 }}>{viewingFile.title}</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{formatTime(timeLeft)} left</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {loadingFile ? (
            <p style={{ color: 'white' }}>Loading...</p>
          ) : viewingUrl ? (
            viewingFile.file_type && viewingFile.file_type.includes('image') ? (
              <img
                src={viewingUrl}
                alt={viewingFile.title}
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }}
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', marginBottom: 8, fontSize: 15 }}>{viewingFile.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 24 }}>Tap below to open the file</p>
                  <a
                  href={viewingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '14px 28px', background: '#1D7C57', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15, display: 'inline-block' }}>
                  Open File
                </a>
              </div>
            )
          ) : (
            <p style={{ color: 'white' }}>Could not load file.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif' }}>

      <nav style={{ background: '#1D7C57', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>MEDI-CO</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: timeLeft < 300 ? '#fdecea' : 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20 }}>
          <span style={{ fontSize: 14 }}>⏱</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: timeLeft < 300 ? '#c62828' : 'white' }}>{formatTime(timeLeft)}</span>
          <span style={{ fontSize: 12, color: timeLeft < 300 ? '#c62828' : 'rgba(255,255,255,0.8)' }}>remaining</span>
        </div>
      </nav>

      <div style={{ padding: 20, paddingBottom: 80 }}>

        {patient && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0faf5', border: '2px solid #1D7C57', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {patient.profile_pic_url ? (
                <img src={patient.profile_pic_url} alt="patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 28 }}>👤</span>
              )}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2d2d2d', marginBottom: 4 }}>{patient.full_name}</h2>
              <p style={{ fontSize: 13, color: '#888' }}>
                {patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years` : ''}
                {patient.gender ? ` · ${patient.gender}` : ''}
                {patient.blood_group ? ` · ${patient.blood_group}` : ''}
              </p>
            </div>
          </div>
        )}

        <input
          type="search"
          placeholder="Search records..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', height: 42, borderRadius: 12, padding: '0 16px', border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white', marginBottom: 14 }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['All', 'lab_report', 'scan', 'prescription'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: activeFilter === f ? '2px solid #1D7C57' : '2px solid #e0e0e0', background: activeFilter === f ? '#1D7C57' : 'white', color: activeFilter === f ? 'white' : '#555' }}>
              {FILTER_LABELS[f] || f}
            </button>
          ))}
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2d2d2d', marginBottom: 12 }}>Medical Records ({filtered.length})</h3>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, background: 'white', borderRadius: 14, color: '#888', marginBottom: 20 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📂</p>
            <p>No records found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {filtered.map(record => (
              <div
                key={record.record_id}
                onClick={() => openFile(record)}
                style={{ background: 'white', borderRadius: 12, padding: '12px 16px', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0faf5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {TYPE_ICONS[record.record_type] || '📁'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2d2d', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.title}</p>
                  <p style={{ fontSize: 12, color: '#888' }}>
                    {FILTER_LABELS[record.record_type]} · {record.record_date ? new Date(record.record_date).toLocaleDateString('en-GB') : 'No date'}
                  </p>
                </div>
                <span style={{ fontSize: 18, color: '#ccc' }}>›</span>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2d2d2d', marginBottom: 12 }}>Active Medications ({activeMeds.length})</h3>

        {activeMeds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, background: 'white', borderRadius: 14, color: '#888', marginBottom: 20 }}>
            No active medications
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e0e0', overflow: 'hidden', marginBottom: 20 }}>
            {activeMeds.map((med, i) => (
              <div key={med.medication_id} style={{ padding: '14px 16px', borderBottom: i < activeMeds.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#2d2d2d' }}>{med.medicine_name}</p>
                <p style={{ fontSize: 13, color: '#666' }}>{med.dose} · {med.timing}</p>
                {med.notes && <p style={{ fontSize: 12, color: '#aaa' }}>{med.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {pastMeds.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
              <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>Past Medications</span>
              <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
            </div>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e0e0', overflow: 'hidden', maxHeight: 240, overflowY: 'auto', marginBottom: 20 }}>
              {pastMeds.map((med, i) => (
                <div key={med.medication_id} style={{ padding: '12px 16px', opacity: 0.6, borderBottom: i < pastMeds.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#555' }}>{med.medicine_name}</p>
                  <p style={{ fontSize: 12, color: '#888' }}>{med.dose} · {med.timing} · Discontinued</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <footer style={{ background: '#1D7C57', color: 'white', textAlign: 'center', padding: '12px', fontSize: 13, position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 100 }}>
        MEDI-CO · Secure Temporary Access
      </footer>

    </div>
  )
}