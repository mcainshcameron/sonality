import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← People
      </Link>
      <p className="mt-4 text-gray-500 text-sm">
        Profile for {id} — T-08 through T-12 will implement this page.
      </p>
    </div>
  )
}
