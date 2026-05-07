import { useState, useRef, useEffect } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function CustomSelect({ value, onChange, options, placeholder, style }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          ...style,
          width: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer'
        }}>
        <span style={{ color: selected ? '#1D717C' : '#aaa' }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ fontSize: 10, color: '#888' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '110%', left: 0, right: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: 10,
          maxHeight: 200,
          overflowY: 'auto',
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                padding: '10px 14px',
                fontSize: 14,
                cursor: 'pointer',
                background: opt.value === value ? '#f0faf5' : 'white',
                color: opt.value === value ? '#1D7C57' : '#333',
                fontWeight: opt.value === value ? 600 : 400
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0faf5'}
              onMouseLeave={e => e.currentTarget.style.background = opt.value === value ? '#f0faf5' : 'white'}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DOBPicker({ value, onChange, darkMode = false }) {
  const parts = value ? value.split('-') : ['', '', '']
  const year = parts[0] || ''
  const month = parts[1] || ''
  const day = parts[2] || ''

  const updateDate = (y, m, d) => {
    if (y && m && d) {
      onChange(`${y}-${m}-${d}`)
    } else {
      onChange(`${y || ''}-${m || ''}-${d || ''}`)
    }
  }

  const btnStyle = {
    height: 44, borderRadius: 10,
    padding: '0 10px',
    background: 'white',
    color: '#333',
    border: '1px solid #ddd',
    fontSize: 13, outline: 'none',
    boxSizing: 'border-box'
  }

  const darkBtnStyle = {
    ...btnStyle,
    background: 'white',
    color: '#1D717C',
    border: '1px solid rgba(255,255,255,0.3)',
  }

  const style = darkMode ? darkBtnStyle : btnStyle

  const days = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1).padStart(2, '0')
  }))

  const months = MONTHS.map((m, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: m
  }))

  const years = Array.from({ length: 100 }, (_, i) => {
    const y = new Date().getFullYear() - i
    return { value: String(y), label: String(y) }
  })

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CustomSelect
        value={day}
        onChange={d => updateDate(year, month, d)}
        options={days}
        placeholder="DD"
        style={style}
      />
      <CustomSelect
        value={month}
        onChange={m => updateDate(year, m, day)}
        options={months}
        placeholder="MM"
        style={style}
      />
      <CustomSelect
        value={year}
        onChange={y => updateDate(y, month, day)}
        options={years}
        placeholder="YYYY"
        style={{ ...style, flex: 2 }}
      />
    </div>
  )
}