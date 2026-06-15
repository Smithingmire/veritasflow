import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="nav" id="main-nav">
      <Link to="/" className="nav-brand">
        <div className="nav-brand-dot" />
        VeritasFlow
      </Link>
      <div className="nav-actions">
        <Link to="/auth" className="nav-btn nav-btn-ghost" id="nav-login">Login</Link>
        <Link to="/auth?mode=signup" className="nav-btn nav-btn-fill" id="nav-register">Register</Link>
      </div>
    </nav>
  )
}
