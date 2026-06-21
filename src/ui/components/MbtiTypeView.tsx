import type { Profile } from '../../domain/types'
import { AXIS_POLES } from '../../domain/types'

interface MbtiTypeViewProps {
  mbti: Profile['mbti']
}

export default function MbtiTypeView({ mbti }: MbtiTypeViewProps) {
  return (
    <section aria-label="MBTI profile">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">MBTI</h3>
        <div className="text-right">
          <span className="text-2xl font-bold tracking-widest text-gray-900">{mbti.type}</span>
          {!mbti.complete && (
            <span className="ml-2 text-xs text-amber-600 align-middle">incomplete</span>
          )}
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">MBTI per-axis breakdown</caption>
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="py-1.5 pr-2 font-medium">Axis</th>
            <th className="py-1.5 px-2 font-medium">Result</th>
            <th className="py-1.5 px-2 font-medium">Split</th>
            <th className="py-1.5 pl-2 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {mbti.axes.map((a) => {
            const [p1, p2] = AXIS_POLES[a.axis]
            return (
              <tr key={a.axis} className="border-b border-gray-100">
                <td className="py-1.5 pr-2 text-gray-700 font-medium">
                  {p1}/{p2}
                </td>
                <td className="py-1.5 px-2">
                  {a.status === 'no-data' ? (
                    <span className="text-gray-400">no data</span>
                  ) : a.status === 'tie' ? (
                    <span className="text-amber-600">tie (?)</span>
                  ) : (
                    <span className="text-gray-900 font-semibold">{a.winner}</span>
                  )}
                </td>
                <td className="py-1.5 px-2 text-gray-500 text-xs">
                  {a.status === 'no-data' ? '—' : `${p1} ${a.tally[p1]} · ${p2} ${a.tally[p2]}`}
                </td>
                <td className="py-1.5 pl-2 text-gray-600">
                  {a.confidence === null ? '—' : `${Math.round(a.confidence * 100)}%`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">
        MBTI is shown as a descriptive typology; the Big Five view is the primary, evidence-weighted profile.
      </p>
    </section>
  )
}
