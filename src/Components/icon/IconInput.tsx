import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type IconInputProps = {
  open: boolean
  initialValue?: string
  placeholder?: string
  title?: string
  submitLabel?: string
  cancelLabel?: string
  onSubmit: (value: string) => void
  onClose: () => void
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
}

const backdropStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(2px)',
}

const dialogStyle: React.CSSProperties = {
  position: 'relative',
  minWidth: 320,
  maxWidth: '90%',
  padding: '18px 20px',
  borderRadius: 10,
  background: '#fff',
  boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
  zIndex: 1,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 16,
  borderRadius: 8,
  border: '1px solid #ddd',
  boxSizing: 'border-box' as const,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 12,
}

export const IconInput: React.FC<IconInputProps> = ({
  open,
  initialValue = '',
  placeholder = '',
  title,
  submitLabel = 'OK',
  cancelLabel = 'Cancel',
  onSubmit,
  onClose,
}) => {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // keep initialValue in sync when opened
  useEffect(() => {
    if (open) setValue(initialValue)
  }, [open, initialValue])

  useEffect(() => {
    if (!open) return
    // focus when opened
    const t = setTimeout(() => inputRef.current?.focus(), 40)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onSubmit(value)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open, value, onClose, onSubmit])

  if (!open) return null

  const node = (
    <div style={containerStyle} role="dialog" aria-modal="true">
      <div style={backdropStyle} onClick={onClose} />
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {title && <div style={{ marginBottom: 8, fontWeight: 600 }}>{title}</div>}
        <input
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          style={inputStyle}
          type='number'
        />
        <div style={actionsStyle}>
          <button
            type="button"
            onClick={() => onClose()}
            style={{ padding: '8px 12px', borderRadius: 8 }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onSubmit(value)}
            style={{ padding: '8px 12px', borderRadius: 8 }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

export default IconInput
