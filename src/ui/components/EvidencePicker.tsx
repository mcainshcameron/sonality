import { useState } from 'react'
import type {
  BigFiveDimension,
  Direction,
  MbtiAxis,
  MbtiPole,
  Weight,
  Evidence,
} from '../../domain/types'
import { BIG_FIVE_ORDER, MBTI_AXIS_ORDER, AXIS_POLES } from '../../domain/types'
import { BIG_FIVE_LABELS, DIRECTION_LABELS, WEIGHT_LABELS, getPoleLabel } from '../../domain/labels'

type Framework = 'BIG_FIVE' | 'MBTI'

interface EvidencePickerProps {
  observationId: string
  existing: Evidence[]
  onAdd: (data: Omit<Evidence, 'id'>) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

const WEIGHTS: Weight[] = [1, 2, 3]

export default function EvidencePicker({
  observationId,
  existing,
  onAdd,
  onRemove,
}: EvidencePickerProps) {
  const [framework, setFramework] = useState<Framework>('BIG_FIVE')
  // Big Five
  const [dimension, setDimension] = useState<BigFiveDimension>('O')
  const [direction, setDirection] = useState<Direction>(1)
  // MBTI
  const [axis, setAxis] = useState<MbtiAxis>('EI')
  const [pole, setPole] = useState<MbtiPole>('E')
  // common
  const [weight, setWeight] = useState<Weight>(2)
  const [adding, setAdding] = useState(false)

  // When axis changes, reset pole to the first valid pole for that axis
  function handleAxisChange(newAxis: MbtiAxis) {
    setAxis(newAxis)
    setPole(AXIS_POLES[newAxis][0])
  }

  async function handleAdd() {
    setAdding(true)
    try {
      if (framework === 'BIG_FIVE') {
        await onAdd({ observationId, framework: 'BIG_FIVE', dimension, direction, weight })
      } else {
        await onAdd({ observationId, framework: 'MBTI', axis, pole, weight })
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3">Evidence tags</h4>

      {/* Existing evidence */}
      {existing.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {existing.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5"
            >
              <span className="text-gray-700">
                {e.framework === 'BIG_FIVE' ? (
                  <>
                    <span className="font-medium">
                      {BIG_FIVE_LABELS[e.dimension!].name}
                    </span>{' '}
                    · {e.direction === 1 ? 'High' : 'Low'} · {WEIGHT_LABELS[e.weight]}
                  </>
                ) : (
                  <>
                    <span className="font-medium">{e.axis}</span> → {e.pole} · {WEIGHT_LABELS[e.weight]}
                  </>
                )}
              </span>
              <button
                onClick={() => onRemove(e.id)}
                className="ml-3 text-gray-400 hover:text-red-500 text-base leading-none"
                aria-label="Remove evidence"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        {/* Framework toggle */}
        <div className="flex gap-2 mb-3">
          {(['BIG_FIVE', 'MBTI'] as Framework[]).map((fw) => (
            <button
              key={fw}
              type="button"
              onClick={() => setFramework(fw)}
              className={`px-3 py-1 text-xs rounded font-medium ${
                framework === fw
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {fw === 'BIG_FIVE' ? 'Big Five' : 'MBTI'}
            </button>
          ))}
        </div>

        {framework === 'BIG_FIVE' ? (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dimension</label>
              <select
                value={dimension}
                onChange={(e) => setDimension(e.target.value as BigFiveDimension)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                {BIG_FIVE_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {d} — {BIG_FIVE_LABELS[d].name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(Number(e.target.value) as Direction)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value={1}>{DIRECTION_LABELS[1]} — {BIG_FIVE_LABELS[dimension].high}</option>
                <option value={-1}>{DIRECTION_LABELS[-1]} — {BIG_FIVE_LABELS[dimension].low}</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Axis</label>
              <select
                value={axis}
                onChange={(e) => handleAxisChange(e.target.value as MbtiAxis)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                {MBTI_AXIS_ORDER.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pole</label>
              <select
                value={pole}
                onChange={(e) => setPole(e.target.value as MbtiPole)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                {AXIS_POLES[axis].map((p) => (
                  <option key={p} value={p}>
                    {getPoleLabel(axis, p)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-2">
          <label className="block text-xs text-gray-600 mb-1">Weight</label>
          <select
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value) as Weight)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w} — {WEIGHT_LABELS[w]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="mt-3 w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {adding ? 'Adding…' : 'Add evidence'}
        </button>
      </div>
    </div>
  )
}
