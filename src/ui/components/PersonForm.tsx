import { useState } from 'react'

interface FormData {
  name: string
  relationship: string
  notes: string
}

interface PersonFormProps {
  initial?: { name?: string; relationship?: string; notes?: string }
  onSubmit: (data: { name: string; relationship?: string; notes?: string }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export default function PersonForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: PersonFormProps) {
  const [form, setForm] = useState<FormData>({
    name: initial?.name ?? '',
    relationship: initial?.relationship ?? '',
    notes: initial?.notes ?? '',
  })
  const [nameError, setNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleNameChange(value: string) {
    setForm((f) => ({ ...f, name: value }))
    if (nameError && value.trim()) setNameError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setNameError('Name is required')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        relationship: form.relationship.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <label htmlFor="pf-name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="pf-name"
          type="text"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          aria-describedby={nameError ? 'pf-name-error' : undefined}
          aria-invalid={nameError ? true : undefined}
          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            nameError ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
          }`}
          autoFocus
          maxLength={120}
        />
        {nameError && (
          <p id="pf-name-error" role="alert" className="mt-1 text-sm text-red-600">
            {nameError}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="pf-relationship" className="block text-sm font-medium text-gray-700 mb-1">
          Relationship
        </label>
        <input
          id="pf-relationship"
          type="text"
          value={form.relationship}
          onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          maxLength={60}
          placeholder="e.g. colleague, friend"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="pf-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="pf-notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
          rows={3}
          maxLength={5000}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
