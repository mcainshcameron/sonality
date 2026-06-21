import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  listPeople,
  createPerson,
  updatePerson,
  deletePerson,
  archivePerson,
  type PersonWithCount,
} from '../../data/people.repo'
import PersonForm from '../components/PersonForm'
import ConfirmDialog from '../components/ConfirmDialog'

type Modal =
  | { type: 'create' }
  | { type: 'edit'; person: PersonWithCount }
  | { type: 'delete'; person: PersonWithCount }
  | null

export default function PeopleListPage() {
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [modal, setModal] = useState<Modal>(null)

  const people = useLiveQuery(
    () => listPeople({ search, includeArchived: showArchived }),
    [search, showArchived],
  )

  async function handleCreate(data: { name: string; relationship?: string; notes?: string }) {
    await createPerson(data)
    setModal(null)
  }

  async function handleEdit(data: { name: string; relationship?: string; notes?: string }) {
    if (modal?.type !== 'edit') return
    await updatePerson(modal.person.id, data)
    setModal(null)
  }

  async function handleDelete() {
    if (modal?.type !== 'delete') return
    await deletePerson(modal.person.id)
    setModal(null)
  }

  async function handleArchiveToggle(person: PersonWithCount) {
    await archivePerson(person.id, !person.archived)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">People</h2>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Add person
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search people"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded"
          />
          Show archived
        </label>
      </div>

      {people === undefined ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : people.length === 0 ? (
        <p className="text-gray-500 text-sm">
          {search
            ? 'No people match your search.'
            : 'No people yet. Add someone to get started.'}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
          {people.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <Link
                  to={`/people/${p.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {p.name}
                </Link>
                <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                  {p.relationship && <span>{p.relationship}</span>}
                  <span>
                    {p.observationCount} observation{p.observationCount !== 1 ? 's' : ''}
                  </span>
                  {p.archived && (
                    <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      Archived
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 text-sm text-gray-500 shrink-0 ml-4">
                <button
                  onClick={() => setModal({ type: 'edit', person: p })}
                  className="hover:text-blue-600"
                  aria-label={`Edit ${p.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleArchiveToggle(p)}
                  className="hover:text-blue-600"
                  aria-label={p.archived ? `Restore ${p.name}` : `Archive ${p.name}`}
                >
                  {p.archived ? 'Restore' : 'Archive'}
                </button>
                <button
                  onClick={() => setModal({ type: 'delete', person: p })}
                  className="hover:text-red-600"
                  aria-label={`Delete ${p.name}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {modal.type === 'create' ? 'Add person' : `Edit ${modal.person.name}`}
            </h2>
            <PersonForm
              initial={modal.type === 'edit' ? modal.person : undefined}
              onSubmit={modal.type === 'create' ? handleCreate : handleEdit}
              onCancel={() => setModal(null)}
              submitLabel={modal.type === 'create' ? 'Add' : 'Save'}
            />
          </div>
        </div>
      )}

      {modal?.type === 'delete' && (
        <ConfirmDialog
          message={`Delete "${modal.person.name}"? This will also delete all their observations and evidence. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
