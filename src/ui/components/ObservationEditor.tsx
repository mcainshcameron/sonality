import { useState } from 'react'
import { localDateString } from '../../utils/date'

interface ObservationEditorProps {
  initial?: { text?: string; occurredOn?: string }
  onSubmit: (data: { text: string; occurredOn: string }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export default function ObservationEditor({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: ObservationEditorProps) {
  const [text, setText] = useState(initial?.text ?? '')
  const [occurredOn, setOccurredOn] = useState(initial?.occurredOn ?? localDateString())
  const [textError, setTextError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleTextChange(value: string) {
    setText(value)
    if (textError && value.trim()) setTextError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      setTextError('Observation text is required')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ text: text.trim(), occurredOn })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <label htmlFor="oe-text" className="block text-sm font-medium text-gray-700 mb-1">
          Observation <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="oe-text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          aria-describedby={textError ? 'oe-text-error' : undefined}
          aria-invalid={textError ? true : undefined}
          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-y ${
            textError
              ? 'border-red-500 focus:ring-red-300'
              : 'border-gray-300 focus:ring-blue-300'
          }`}
          rows={4}
          maxLength={5000}
          autoFocus
        />
        {textError && (
          <p id="oe-text-error" role="alert" className="mt-1 text-sm text-red-600">
            {textError}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="oe-date" className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          id="oe-date"
          type="date"
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
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
