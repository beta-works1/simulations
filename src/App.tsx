import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { SimulationsPage } from './pages/SimulationsPage'
import { SimulationDetailPage } from './pages/SimulationDetailPage'
import './App.css'

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
      <main id="page-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/simulations/:id" element={<SimulationDetailPage />} />
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
