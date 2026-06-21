import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { DimensionScore } from '../../domain/types'
import { BIG_FIVE_LABELS } from '../../domain/labels'

interface BigFiveChartProps {
  bigFive: DimensionScore[]
}

export default function BigFiveChart({ bigFive }: BigFiveChartProps) {
  const [showTable, setShowTable] = useState(false)

  const withData = bigFive.filter((d) => d.score !== null)
  const chartData = withData.map((d) => ({
    name: BIG_FIVE_LABELS[d.dimension].name,
    dimension: d.dimension,
    score: d.score as number,
  }))

  return (
    <section aria-label="Big Five profile">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Big Five</h3>
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          className="text-xs text-blue-600 hover:underline"
          aria-pressed={showTable}
        >
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-gray-500">
          No Big Five evidence yet. Tag observations to build this profile.
        </p>
      ) : showTable ? (
        <BigFiveTable bigFive={bigFive} />
      ) : (
        <>
          <div style={{ width: '100%', height: chartData.length * 48 + 24 }}>
            <ResponsiveContainer>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 0, right: 40, bottom: 0, left: 8 }}
              >
                <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="dimension"
                  width={28}
                  fontSize={12}
                  tickLine={false}
                />
                <ReferenceLine x={50} stroke="#9ca3af" strokeDasharray="3 3" />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {chartData.map((d) => (
                    <Cell key={d.dimension} fill={d.score >= 50 ? '#2563eb' : '#7c3aed'} />
                  ))}
                  <LabelList dataKey="score" position="right" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 mt-1">50 = balanced / neutral evidence</p>

          {/* Insufficient-data dimensions (FR-17) */}
          {bigFive.some((d) => d.score === null) && (
            <ul className="mt-3 space-y-1">
              {bigFive
                .filter((d) => d.score === null)
                .map((d) => (
                  <li key={d.dimension} className="text-xs text-gray-400">
                    <span className="font-medium text-gray-500">
                      {d.dimension} — {BIG_FIVE_LABELS[d.dimension].name}:
                    </span>{' '}
                    insufficient data
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

function BigFiveTable({ bigFive }: BigFiveChartProps) {
  return (
    <table className="w-full text-sm border-collapse">
      <caption className="sr-only">Big Five dimension scores</caption>
      <thead>
        <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
          <th className="py-1.5 pr-2 font-medium">Dimension</th>
          <th className="py-1.5 px-2 font-medium">Score</th>
          <th className="py-1.5 pl-2 font-medium">Strength</th>
        </tr>
      </thead>
      <tbody>
        {bigFive.map((d) => (
          <tr key={d.dimension} className="border-b border-gray-100">
            <td className="py-1.5 pr-2 text-gray-700">
              {d.dimension} — {BIG_FIVE_LABELS[d.dimension].name}
            </td>
            <td className="py-1.5 px-2 text-gray-900">
              {d.score === null ? (
                <span className="text-gray-400">insufficient data</span>
              ) : (
                d.score
              )}
            </td>
            <td className="py-1.5 pl-2 text-gray-500 text-xs">
              {d.evidenceCount === 0
                ? '—'
                : `${d.evidenceCount} obs · weight ${d.totalWeight}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
