import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { SimulationsPage } from './pages/SimulationsPage'
import { AboutPage } from './pages/AboutPage'
import './App.css'

const SimulationDetailPage = lazy(() =>
  import('./pages/SimulationDetailPage').then((m) => ({ default: m.SimulationDetailPage })),
)

const SimulationRunPage = lazy(() =>
  import('./pages/SimulationRunPage').then((m) => ({ default: m.SimulationRunPage })),
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
