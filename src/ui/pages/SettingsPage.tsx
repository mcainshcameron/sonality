import { useRef, useState } from 'react'
import {
  exportToJson,
  importReplace,
  importMerge,
  clearAll,
  ImportError,
} from '../../data/portability'
import ConfirmDialog from '../components/ConfirmDialog'

type Status = { kind: 'idle' } | { kind: 'ok'; msg: string } | { kind: 'err'; msg: string }

export default function SettingsPage() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [confirm, setConfirm] = useState<null | 'clear' | { mode: 'replace'; json: string }>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const mergeInput = useRef<HTMLInputElement>(null)

  async function handleExport() {
    try {
      const json = await exportToJson(new Date().toISOString())
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sonality-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus({ kind: 'ok', msg: 'Exported.' })
    } catch (e) {
      setStatus({ kind: 'err', msg: e instanceof Error ? e.message : 'Export failed' })
    }
  }

  async function readFile(input: HTMLInputElement): Promise<string | null> {
    const file = input.files?.[0]
    if (!file) return null
    const text = await file.text()
    input.value = '' // allow re-importing the same file
    return text
  }

  async function handleReplaceFile() {
    if (!replaceInput.current) return
    const json = await readFile(replaceInput.current)
    if (json === null) return
    setConfirm({ mode: 'replace', json })
  }

  async function doReplace(json: string) {
    setConfirm(null)
    try {
      await importReplace(json)
      setStatus({ kind: 'ok', msg: 'Data replaced from file.' })
    } catch (e) {
      setStatus({
        kind: 'err',
        msg: e instanceof ImportError ? e.message : 'Import failed — no changes were made.',
      })
    }
  }

  async function handleMergeFile() {
    if (!mergeInput.current) return
    const json = await readFile(mergeInput.current)
    if (json === null) return
    try {
      await importMerge(json)
      setStatus({ kind: 'ok', msg: 'Data merged from file.' })
    } catch (e) {
      setStatus({
        kind: 'err',
        msg: e instanceof ImportError ? e.message : 'Import failed — no changes were made.',
      })
    }
  }

  async function doClear() {
    setConfirm(null)
    try {
      await clearAll()
      setStatus({ kind: 'ok', msg: 'All data cleared.' })
    } catch (e) {
      setStatus({ kind: 'err', msg: e instanceof Error ? e.message : 'Clear failed' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Settings</h2>

      {status.kind !== 'idle' && (
        <div
          role="status"
          className={`mb-6 text-sm rounded px-3 py-2 ${
            status.kind === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {status.msg}
        </div>
      )}

      <section className="mb-8">
        <h3 className="text-base font-medium text-gray-800 mb-1">Export</h3>
        <p className="text-sm text-gray-500 mb-3">
          Download all people, observations, and evidence as a JSON backup.
        </p>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export JSON
        </button>
      </section>

      <section className="mb-8">
        <h3 className="text-base font-medium text-gray-800 mb-1">Import</h3>
        <p className="text-sm text-gray-500 mb-3">
          <strong>Replace</strong> wipes current data and loads the file. <strong>Merge</strong>{' '}
          upserts by id (imported wins). Invalid files are rejected with no changes.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => replaceInput.current?.click()}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Import (Replace)…
          </button>
          <button
            onClick={() => mergeInput.current?.click()}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Import (Merge)…
          </button>
          <input
            ref={replaceInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleReplaceFile}
            aria-label="Import file (replace mode)"
          />
          <input
            ref={mergeInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleMergeFile}
            aria-label="Import file (merge mode)"
          />
        </div>
      </section>

      <section>
        <h3 className="text-base font-medium text-red-700 mb-1">Danger zone</h3>
        <p className="text-sm text-gray-500 mb-3">
          Permanently delete all local data. Export first if you want a backup.
        </p>
        <button
          onClick={() => setConfirm('clear')}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear all data
        </button>
      </section>

      {confirm === 'clear' && (
        <ConfirmDialog
          message="Permanently delete ALL people, observations, and evidence? This cannot be undone."
          confirmLabel="Clear everything"
          onConfirm={doClear}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm && typeof confirm === 'object' && confirm.mode === 'replace' && (
        <ConfirmDialog
          message="Replace ALL current data with the imported file? Existing data will be wiped first. This cannot be undone."
          confirmLabel="Replace data"
          onConfirm={() => doReplace(confirm.json)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
