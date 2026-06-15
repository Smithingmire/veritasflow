import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Dashboard from './pages/Dashboard.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}
