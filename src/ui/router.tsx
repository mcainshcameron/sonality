import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './RootLayout'
import PeopleListPage from './pages/PeopleListPage'
import PersonDetailPage from './pages/PersonDetailPage'
import SettingsPage from './pages/SettingsPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <PeopleListPage /> },
      { path: '/people/:id', element: <PersonDetailPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
])
