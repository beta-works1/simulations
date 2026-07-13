import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { SimulationsPage } from './pages/SimulationsPage'
import { AboutPage } from './pages/AboutPage'
import './App.css'

const SimulationDetailPage = lazy(() =>
  import('./pages/SimulationDetailPage').then((m) => ({ default: m.SimulationDetailPage })),
)

function AppContent() {
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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/simulations/:id"
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
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
