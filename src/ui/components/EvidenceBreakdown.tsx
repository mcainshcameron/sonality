import { useState } from 'react'
import type { Observation, Evidence, BigFiveDimension, MbtiAxis } from '../../domain/types'
import { BIG_FIVE_ORDER, MBTI_AXIS_ORDER, AXIS_POLES } from '../../domain/types'
import { BIG_FIVE_LABELS, WEIGHT_LABELS } from '../../domain/labels'

interface EvidenceBreakdownProps {
  observations: Observation[]
  evidence: Evidence[]
}

interface Contribution {
  observation: Observation
  evidence: Evidence
}

export default function EvidenceBreakdown({ observations, evidence }: EvidenceBreakdownProps) {
  const obsById = new Map(observations.map((o) => [o.id, o]))

  function bigFiveContributions(dimension: BigFiveDimension): Contribution[] {
    return evidence
      .filter((e) => e.framework === 'BIG_FIVE' && e.dimension === dimension)
      .map((e) => ({ evidence: e, observation: obsById.get(e.observationId)! }))
      .filter((c) => c.observation !== undefined)
  }

  function axisContributions(axis: MbtiAxis): Contribution[] {
    return evidence
      .filter((e) => e.framework === 'MBTI' && e.axis === axis)
      .map((e) => ({ evidence: e, observation: obsById.get(e.observationId)! }))
      .filter((c) => c.observation !== undefined)
  }

  return (
    <section aria-label="Evidence breakdown">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Why — evidence breakdown</h3>

      <div className="space-y-1">
        <h4 className="text-xs font-medium uppercase tracking-wide text-gray-400 mt-2">Big Five</h4>
        {BIG_FIVE_ORDER.map((dim) => (
          <BreakdownRow
            key={dim}
            label={`${dim} — ${BIG_FIVE_LABELS[dim].name}`}
            contributions={bigFiveContributions(dim)}
            renderDetail={(c) => (
              <>
                {c.evidence.direction === 1 ? 'High (+1)' : 'Low (−1)'} · {WEIGHT_LABELS[c.evidence.weight]}
              </>
            )}
          />
        ))}

        <h4 className="text-xs font-medium uppercase tracking-wide text-gray-400 mt-3">MBTI</h4>
        {MBTI_AXIS_ORDER.map((axis) => {
          const [p1, p2] = AXIS_POLES[axis]
          return (
            <BreakdownRow
              key={axis}
              label={`${p1}/${p2}`}
              contributions={axisContributions(axis)}
              renderDetail={(c) => (
                <>
                  pole {c.evidence.pole} · {WEIGHT_LABELS[c.evidence.weight]}
                </>
              )}
            />
          )
        })}
      </div>
    </section>
  )
}

interface BreakdownRowProps {
  label: string
  contributions: Contribution[]
  renderDetail: (c: Contribution) => React.ReactNode
}

function BreakdownRow({ label, contributions, renderDetail }: BreakdownRowProps) {
  const [open, setOpen] = useState(false)
  const count = contributions.length
  const totalWeight = contributions.reduce((sum, c) => sum + c.evidence.weight, 0)

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-2 text-left text-sm hover:bg-gray-50"
      >
        <span className="text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">
          {count === 0 ? 'no evidence' : `${count} obs · weight ${totalWeight}`}
          <span className="ml-2">{open ? '▾' : '▸'}</span>
        </span>
      </button>

      {open && (
        <div className="pb-2 pl-2">
          {count === 0 ? (
            <p className="text-xs text-gray-400 py-1">No observations tagged for this yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {contributions.map((c) => (
                <li key={c.evidence.id} className="text-xs text-gray-600">
                  <span className="text-gray-400">{c.observation.occurredOn}</span> ·{' '}
                  <span className="text-gray-500">{renderDetail(c)}</span>
                  <p className="text-gray-700 mt-0.5 line-clamp-2">{c.observation.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
