import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { signOut } from '../lib/auth'
import AddPatientModal from '../components/AddPatientModal'
import AddMedicationModal from '../components/AddMedicationModal'
import UploadRecordModal from '../components/UploadRecordModal'
import ProfileModal from '../components/ProfileModal'
import QRModal from '../components/QRModal'
import ChatBot from '../components/ChatBot'
import Records from '../pages/Records'

export default function Dashboard() {
  const [manager, setManager] = useState(null)
  const [patients, setPatients] = useState([])
  const [activePatient, setActivePatient] = useState(null)
  const [medications, setMedications] = useState([])
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showRecords, setShowRecords] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [openChat, setOpenChat] = useState(false)
  const [uploadLabel, setUploadLabel] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { loadManager() }, [])

  useEffect(() => {
    if (activePatient) loadMedications()
  }, [activePatient])

  async function loadManager() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }

    const { data: mgr } = await supabase
      .from('manager')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!mgr) { navigate('/'); return }
    setManager(mgr)

    const { data: pts } = await supabase
      .from('patient')
      .select('*')
      .eq('manager_id', mgr.manager_id)
      .eq('is_active', true)

    setPatients(pts || [])
    if (pts && pts.length > 0) setActivePatient(pts[pts.length - 1])
  }

  async function loadMedications() {
    const { data } = await supabase
      .from('medication')
      .select('*')
      .eq('patient_id', activePatient.patient_id)
      .order('created_at', { ascending: false })
    setMedications(data || [])
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function markMedicationDone(medicationId) {
    await supabase
      .from('medication')
      .update({ is_active: false })
      .eq('medication_id', medicationId)
    loadMedications()
  }

  async function deleteMedication(medicationId) {
    if (!window.confirm('Delete this medication? This cannot be undone.')) return
    await supabase.from('medication').delete().eq('medication_id', medicationId)
    loadMedications()
  }

  const activeMeds = medications.filter(m => m.is_active)
  const pastMeds = medications.filter(m => !m.is_active)

  const quickActions = [
    { icon: '📄', label: 'Upload Report' },
    { icon: '🩻', label: 'Upload Scan' },
    { icon: '💊', label: 'Upload Prescription' },
    { icon: '📋', label: 'View Records' },
    { icon: '📱', label: 'Doctor QR' },
    // { icon: '🤖', label: 'AI Assistant' },
  ]

  const uploadTypes = ['Upload Report', 'Upload Scan', 'Upload Prescription']

  if (showRecords && activePatient) {
    return (
      <Records
        activePatient={activePatient}
        manager={manager}
        onBack={() => setShowRecords(false)}
      />
    )
  }

  const thStyle = (w) => ({
    width: w, padding: '14px 16px', textAlign: 'left',
    fontSize: 13, fontWeight: 600, color: '#1D7C57',
    borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap'
  })

  const pastThStyle = (w) => ({
    width: w, padding: '12px 16px', textAlign: 'left',
    fontSize: 13, fontWeight: 600, color: '#888',
    borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap'
  })

  const tdStyle = {
    padding: '14px 16px', fontSize: 14,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', width: '100vw',
      background: '#f5f5f5', fontFamily: 'Poppins, sans-serif'
    }}>

      {/* Navbar */}
      <nav style={{
        background: '#1D7C57', padding: '0 24px',
        height: 68, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
         <div style={{
  width: 36, height: 36, borderRadius: 8,
  background: 'white', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  flexShrink: 0
}}>
  <img
    src="/fevicon.svg"
    alt="logo"
    style={{ width: 28, height: 28, objectFit: 'contain' }}
    onError={e => { e.target.style.display = 'none' }}
  />
</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 22 }}>
            MEDI-CO
          </span>
        </div>


        <button
          onClick={() => setShowProfile(true)}
          title="Profile"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'white', color: '#1D7C57',
            border: 'none', fontWeight: 700, fontSize: 18,
            cursor: 'pointer', flexShrink: 0
          }}>
          {manager?.full_name?.[0]?.toUpperCase() || 'M'}
        </button>
      </nav>

      {/* Body */}
      <div style={{
        display: 'flex', flex: 1,
        flexDirection: isMobile ? 'column' : 'row'
      }}>

        {/* Sidebar */}
        <div style={{
          width: isMobile ? '100%' : 280, flexShrink: 0,
          background: 'white', borderRight: '1px solid #e0e0e0', padding: 20
        }}>

          {/* Patient Switcher */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <button
              onClick={() => setShowPatientDropdown(!showPatientDropdown)}
              style={{
                width: '100%', padding: '10px 14px',
                background: '#f0faf5', border: '1px solid #1D7C57',
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 14, fontWeight: 500, color: '#1D7C57'
              }}>
              <span>{activePatient ? activePatient.full_name : 'No patient selected'}</span>
              <span>{showPatientDropdown ? '▲' : '▼'}</span>
            </button>

            {showPatientDropdown && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0,
                background: 'white', border: '1px solid #e0e0e0',
                borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 50, overflow: 'hidden'
              }}>
                {patients.map(p => (
                  <button
                    key={p.patient_id}
                    onClick={() => { setActivePatient(p); setShowPatientDropdown(false) }}
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: activePatient?.patient_id === p.patient_id
                        ? '#f0faf5' : 'white',
                      border: 'none', borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer', textAlign: 'left',
                      fontSize: 14, color: '#333'
                    }}>
                    {p.full_name}
                  </button>
                ))}
                <button
                  onClick={() => { setShowPatientDropdown(false); setShowAddPatient(true) }}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'white', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: 14, color: '#1D7C57', fontWeight: 600
                  }}>
                  + Add New Patient
                </button>
              </div>
            )}
          </div>

          {/* Patient Info */}
          {activePatient ? (
            <div style={{
              background: 'white', borderRadius: 16,
              padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                width: '100%', height: 160, background: '#f0faf5',
                borderRadius: 12, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 16,
                border: '2px dashed #1D7C57', overflow: 'hidden'
              }}>
                {activePatient.profile_pic_url ? (
                  <img
                    src={activePatient.profile_pic_url}
                    alt="patient"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 48, color: '#1D7C57' }}>?</span>
                )}
              </div>
              {[
                ['Name', activePatient.full_name],
                ['Age', activePatient.date_of_birth
                  ? `${new Date().getFullYear() - new Date(activePatient.date_of_birth).getFullYear()} years`
                  : 'N/A'],
                ['DOB', activePatient.date_of_birth
                  ? new Date(activePatient.date_of_birth).toLocaleDateString('en-GB')
                  : 'N/A'],
                ['Gender', activePatient.gender || 'N/A'],
                ['Blood Group', activePatient.blood_group || 'N/A'],
              ].map(([label, value]) => (
                <p key={label} style={{ fontSize: 14, marginBottom: 8, color: '#333' }}>
                  <strong style={{ color: '#1D7C57' }}>{label}:</strong> {value}
                </p>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: '#888', fontSize: 14 }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>+</p>
              <p>No patient selected.</p>
              <p>Add a patient to get started.</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1, padding: 24,
          overflowY: 'auto', paddingBottom: 80, minWidth: 0
        }}>

          <h4 style={{ fontSize: 20, fontWeight: 600, color: '#2d2d2d', marginBottom: 16 }}>
            Quick Actions
          </h4>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 32 }}>
            {quickActions.map(({ icon, label }) => (
              <button
                key={label}
                onClick={() => {
                  if (label === 'AI Assistant') {
                    setOpenChat(true)
                    return
                  }
                  if (!activePatient) { alert('Please select a patient first'); return }
                  if (uploadTypes.includes(label)) { setUploadLabel(label); setShowUploadModal(true) }
                  if (label === 'View Records') setShowRecords(true)
                  if (label === 'Doctor QR') setShowQR(true)
                }}
                style={{
                  width: 120, height: 90,
                  border: '2px solid #e0e0e0', borderRadius: 16,
                  background: 'white', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 8, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', color: '#333', transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#1D7C57'
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.borderColor = '#1D7C57'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.color = '#333'
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Active Medications */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 16
          }}>
            <h4 style={{ fontSize: 20, fontWeight: 600, color: '#2d2d2d' }}>
              Active Medications
            </h4>
            <button
              onClick={() => setShowAddMedication(true)}
              style={{
                background: '#1D7C57', color: 'white', border: 'none',
                borderRadius: 10, padding: '8px 16px',
                fontSize: 13, fontWeight: 500, cursor: 'pointer'
              }}>
              + Add Medication
            </button>
          </div>

          <div style={{
            background: 'white', borderRadius: 16,
            border: '1px solid #e0e0e0',
            overflowX: 'auto', marginBottom: 24
          }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              tableLayout: 'fixed', minWidth: 560
            }}>
              <thead>
                <tr style={{ background: '#f9f9f9' }}>
                  <th style={thStyle('24%')}>Medicine</th>
                  <th style={thStyle('16%')}>Dose</th>
                  <th style={thStyle('26%')}>Timing</th>
                  <th style={thStyle('20%')}>Notes</th>
                  <th style={thStyle('14%')}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeMeds.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{
                      textAlign: 'center', padding: 32,
                      color: '#888', fontSize: 14
                    }}>No active medications</td>
                  </tr>
                ) : activeMeds.map(med => (
                  <tr key={med.medication_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{med.medicine_name}</td>
                    <td style={tdStyle}>{med.dose}</td>
                    <td style={tdStyle}>{med.timing}</td>
                    <td style={{ ...tdStyle, color: '#666' }}>{med.notes || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => markMedicationDone(med.medication_id)}
                          style={{
                            padding: '5px 10px', fontSize: 11,
                            background: '#e8f5e9', color: '#1D7C57',
                            border: '1px solid #1D7C57', borderRadius: 7,
                            cursor: 'pointer', fontWeight: 500
                          }}>Done</button>
                        <button
                          onClick={() => deleteMedication(med.medication_id)}
                          style={{
                            padding: '5px 10px', fontSize: 11,
                            background: '#fdecea', color: '#c62828',
                            border: '1px solid #c62828', borderRadius: 7,
                            cursor: 'pointer', fontWeight: 500
                          }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Past Medications */}
          {pastMeds.length > 0 && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16
              }}>
                <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
                  Past Medications
                </span>
                <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
              </div>

              <div style={{
                background: 'white', borderRadius: 16,
                border: '1px solid #e0e0e0',
                overflowX: 'auto', maxHeight: 300, overflowY: 'auto'
              }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  tableLayout: 'fixed', minWidth: 560
                }}>
                  <thead>
                    <tr style={{ background: '#f9f9f9' }}>
                      <th style={pastThStyle('24%')}>Medicine</th>
                      <th style={pastThStyle('16%')}>Dose</th>
                      <th style={pastThStyle('26%')}>Timing</th>
                      <th style={pastThStyle('20%')}>Notes</th>
                      <th style={pastThStyle('14%')}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastMeds.map(med => (
                      <tr key={med.medication_id}
                        style={{ borderBottom: '1px solid #f0f0f0', opacity: 0.7 }}>
                        <td style={tdStyle}>{med.medicine_name}</td>
                        <td style={tdStyle}>{med.dose}</td>
                        <td style={tdStyle}>{med.timing}</td>
                        <td style={{ ...tdStyle, color: '#666' }}>{med.notes || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: 12, padding: '4px 10px',
                            background: '#f0f0f0', color: '#888',
                            borderRadius: 20, fontWeight: 500
                          }}>Done</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        background: '#1D7C57', color: 'white', textAlign: 'center',
        padding: '12px', fontSize: 13, position: 'fixed',
        bottom: 0, left: 0, width: '100%', zIndex: 100
      }}>
        Developed & Maintained by @Medi-Co
      </footer>

      {/* ChatBot */}
      <ChatBot triggerOpen={openChat} />

      {/* Modals */}
      {showProfile && manager && (
        <ProfileModal
          manager={manager}
          onClose={() => setShowProfile(false)}
          onSaved={() => { loadManager(); setShowProfile(false) }}
          onSignOut={handleSignOut}
        />
      )}

      {showAddPatient && (
        <AddPatientModal
          managerId={manager?.manager_id}
          onClose={() => setShowAddPatient(false)}
          onSaved={async () => { setShowAddPatient(false); await loadManager() }}
        />
      )}

      {showAddMedication && activePatient && (
        <AddMedicationModal
          patientId={activePatient.patient_id}
          onClose={() => setShowAddMedication(false)}
          onSaved={() => { loadMedications(); setShowAddMedication(false) }}
        />
      )}

      {showUploadModal && activePatient && (
        <UploadRecordModal
          patientId={activePatient.patient_id}
          recordLabel={uploadLabel}
          onClose={() => setShowUploadModal(false)}
          onSaved={() => setShowUploadModal(false)}
        />
      )}

      {showQR && activePatient && manager && (
        <QRModal
          patient={activePatient}
          manager={manager}
          onClose={() => setShowQR(false)}
        />
      )}

    </div>
  )
}