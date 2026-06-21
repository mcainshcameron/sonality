import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getPerson } from '../../data/people.repo'
import {
  listObservationsByPerson,
  createObservation,
  updateObservation,
  deleteObservation,
} from '../../data/observations.repo'
import {
  addEvidence,
  removeEvidence,
  listEvidenceForPerson,
} from '../../data/evidence.repo'
import { computeProfile } from '../../domain/profile'
import type { Observation, Evidence } from '../../domain/types'
import ObservationEditor from '../components/ObservationEditor'
import EvidencePicker from '../components/EvidencePicker'
import ConfirmDialog from '../components/ConfirmDialog'
import BigFiveChart from '../components/BigFiveChart'
import MbtiTypeView from '../components/MbtiTypeView'
import EvidenceBreakdown from '../components/EvidenceBreakdown'

type Modal =
  | { type: 'add' }
  | { type: 'edit'; obs: Observation }
  | { type: 'delete'; obs: Observation }
  | null

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [modal, setModal] = useState<Modal>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const person = useLiveQuery(
    async () => {
      if (!id) return null
      return (await getPerson(id)) ?? null
    },
    [id],
  )

  const observations = useLiveQuery(
    () => (id ? listObservationsByPerson(id) : Promise.resolve([])),
    [id],
  )

  const evidence = useLiveQuery(
    () => (id ? listEvidenceForPerson(id) : Promise.resolve([])),
    [id],
  )

  // Profile is recomputed only when this person's evidence changes (NFR-04/05).
  const profile = useMemo(() => {
    if (!id) return null
    return computeProfile(id, evidence ?? [])
  }, [id, evidence])

  const evidenceByObs = useMemo(() => {
    const map = new Map<string, Evidence[]>()
    for (const e of evidence ?? []) {
      const list = map.get(e.observationId) ?? []
      list.push(e)
      map.set(e.observationId, list)
    }
    return map
  }, [evidence])

  async function handleAdd(data: { text: string; occurredOn: string }) {
    await createObservation({ personId: id!, ...data })
    setModal(null)
  }

  async function handleEdit(data: { text: string; occurredOn: string }) {
    if (modal?.type !== 'edit') return
    await updateObservation(modal.obs.id, data)
    setModal(null)
  }

  async function handleDelete() {
    if (modal?.type !== 'delete') return
    await deleteObservation(modal.obs.id)
    setModal(null)
  }

  function toggleExpanded(obsId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(obsId)) next.delete(obsId)
      else next.add(obsId)
      return next
    })
  }

  if (person === undefined || observations === undefined || evidence === undefined) {
    return <p className="text-gray-400 text-sm p-6">Loading…</p>
  }

  if (person === null) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← People
        </Link>
        <p className="mt-4 text-gray-500">Person not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← People
      </Link>

      <div className="mt-4 mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900">{person.name}</h2>
        {person.relationship && (
          <p className="text-sm text-gray-500 mt-0.5">{person.relationship}</p>
        )}
        {person.notes && (
          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{person.notes}</p>
        )}
      </div>

      {/* Profile section (T-10 + T-11) */}
      {profile && (
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <BigFiveChart bigFive={profile.bigFive} />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <MbtiTypeView mbti={profile.mbti} />
          </div>
        </div>
      )}

      {observations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <EvidenceBreakdown observations={observations} evidence={evidence} />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Observations
          <span className="ml-2 text-sm font-normal text-gray-400">({observations.length})</span>
        </h3>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Add observation
        </button>
      </div>

      {observations.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No observations yet. Add one to start building a profile.
        </p>
      ) : (
        <ul className="space-y-3">
          {observations.map((obs) => {
            const obsEvidence = evidenceByObs.get(obs.id) ?? []
            const isOpen = expanded.has(obs.id)
            return (
              <li key={obs.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <time dateTime={obs.occurredOn} className="text-xs text-gray-400 shrink-0 mt-0.5">
                    {obs.occurredOn}
                  </time>
                  <div className="flex gap-3 text-sm text-gray-500 shrink-0">
                    <button
                      onClick={() => setModal({ type: 'edit', obs })}
                      className="hover:text-blue-600"
                      aria-label="Edit observation"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setModal({ type: 'delete', obs })}
                      className="hover:text-red-600"
                      aria-label="Delete observation"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{obs.text}</p>

                <button
                  onClick={() => toggleExpanded(obs.id)}
                  className="mt-3 text-xs text-blue-600 hover:underline"
                  aria-expanded={isOpen}
                >
                  {isOpen ? 'Hide evidence' : `Evidence (${obsEvidence.length})`}
                </button>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <EvidencePicker
                      observationId={obs.id}
                      existing={obsEvidence}
                      onAdd={async (data) => {
                        await addEvidence(data)
                      }}
                      onRemove={async (evId) => {
                        await removeEvidence(evId)
                      }}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {modal.type === 'add' ? 'Add observation' : 'Edit observation'}
            </h2>
            <ObservationEditor
              initial={modal.type === 'edit' ? modal.obs : undefined}
              onSubmit={modal.type === 'add' ? handleAdd : handleEdit}
              onCancel={() => setModal(null)}
              submitLabel={modal.type === 'add' ? 'Add' : 'Save'}
            />
          </div>
        </div>
      )}

      {modal?.type === 'delete' && (
        <ConfirmDialog
          message="Delete this observation? Its evidence will also be removed."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
