import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useTheme } from './hooks/useTheme'
import AuthGuard from './components/auth/AuthGuard'
import Layout from './components/layout/Layout'

const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Kalender      = lazy(() => import('./pages/Kalender'))
const Noten         = lazy(() => import('./pages/Noten'))
const Faecher       = lazy(() => import('./pages/Faecher'))
const Pruefungen    = lazy(() => import('./pages/Pruefungen'))
const Aufgaben      = lazy(() => import('./pages/Aufgaben'))
const Dokumente     = lazy(() => import('./pages/Dokumente'))
const Statistiken   = lazy(() => import('./pages/Statistiken'))
const Abitur        = lazy(() => import('./pages/Abitur'))
const Einstellungen = lazy(() => import('./pages/Einstellungen'))
const Ziele         = lazy(() => import('./pages/Ziele'))

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const initialize = useAuthStore(s => s.initialize)
  useTheme()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <BrowserRouter>
      <AuthGuard>
        <Layout>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/"              element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"     element={<Dashboard />} />
              <Route path="/kalender"      element={<Kalender />} />
              <Route path="/noten"         element={<Noten />} />
              <Route path="/faecher"       element={<Faecher />} />
              <Route path="/pruefungen"    element={<Pruefungen />} />
              <Route path="/aufgaben"      element={<Aufgaben />} />
              <Route path="/dokumente"     element={<Dokumente />} />
              <Route path="/statistiken"   element={<Statistiken />} />
              <Route path="/abitur"        element={<Abitur />} />
              <Route path="/einstellungen" element={<Einstellungen />} />
              <Route path="/ziele"         element={<Ziele />} />
            </Routes>
          </Suspense>
        </Layout>
      </AuthGuard>
    </BrowserRouter>
  )
}