import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { SimulationsPage } from './pages/SimulationsPage'
import { AboutPage } from './pages/AboutPage'
import { Gs8LocaleEffect } from './i18n/Gs8LocaleEffect'
import './App.css'

const SimulationDetailPage = lazy(() =>
  import('./pages/SimulationDetailPage').then((m) => ({ default: m.SimulationDetailPage })),
)

const SimulationRunPage = lazy(() =>
  import('./pages/SimulationRunPage').then((m) => ({ default: m.SimulationRunPage })),
)

const Gs8LibraryPage = lazy(() =>
  import('./app/Gs8LibraryPage').then((m) => ({ default: m.Gs8LibraryPage })),
)
const Gs8RunPage = lazy(() => import('./app/Gs8RunPage').then((m) => ({ default: m.Gs8RunPage })))
const Gs8UiPlaygroundPage = lazy(() =>
  import('./ui/__playground__/Gs8UiPlaygroundPage').then((m) => ({
    default: m.Gs8UiPlaygroundPage,
  })),
)
const Gs8TeacherPage = lazy(() =>
  import('./app/Gs8TeacherPage').then((m) => ({ default: m.Gs8TeacherPage })),
)

function CatalogLayout() {
  const navigate = useNavigate()

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/simulations?q=${encodeURIComponent(query.trim())}`)
    } else {
      navigate('/simulations')
    }
  }

  return (
    <>
      <Header onSearch={handleSearch} />
      <main id="page-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Gs8LocaleEffect />
      <Routes>
        <Route
          path="/run/:id"
          element={
            <Suspense
              fallback={
                <div className="route-fallback" role="status">
                  Loading simulation…
                </div>
              }
            >
              <SimulationRunPage />
            </Suspense>
          }
        />
        <Route
          path="/gs8"
          element={
            <Suspense fallback={<div className="route-fallback">Loading GS8…</div>}>
              <Gs8LibraryPage />
            </Suspense>
          }
        />
        <Route
          path="/gs8/teacher"
          element={
            <Suspense fallback={<div className="route-fallback">Loading teacher view…</div>}>
              <Gs8TeacherPage />
            </Suspense>
          }
        />
        <Route
          path="/gs8/run/:id"
          element={
            <Suspense fallback={<div className="route-fallback">Loading GS8 simulation…</div>}>
              <Gs8RunPage />
            </Suspense>
          }
        />
        <Route
          path="/gs8/ui"
          element={
            <Suspense fallback={<div className="route-fallback">Loading UI playground…</div>}>
              <Gs8UiPlaygroundPage />
            </Suspense>
          }
        />
        <Route element={<CatalogLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/play/:id"
            element={
              <Suspense
                fallback={
                  <div className="route-fallback" role="status">
                    Loading simulation…
                  </div>
                }
              >
                <SimulationDetailPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
