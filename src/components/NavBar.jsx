// src/components/Navbar.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    logoutUser();
    closeMenu();
    showAlert('success', 'You have logged out.');
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <NavLink to="/" className="brand" onClick={closeMenu}>
          <Home size={20} /> CommunityHub
        </NavLink>

        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end className="nav-link" onClick={closeMenu}>
            Announcements
          </NavLink>
          <NavLink to="/events" className="nav-link" onClick={closeMenu}>
            Events
          </NavLink>

          {user && (
            <>
              <NavLink to="/volunteer" className="nav-link" onClick={closeMenu}>
                Volunteer
              </NavLink>
              <NavLink to="/reports" className="nav-link" onClick={closeMenu}>
                Report Problem
              </NavLink>
              <NavLink to="/profile" className="nav-link" onClick={closeMenu}>
                Profile
              </NavLink>
            </>
          )}

          {user?.role === 'admin' && (
            <NavLink to="/admin" className="nav-link" onClick={closeMenu}>
              Admin
            </NavLink>
          )}

          {user ? (
            <>
              <span className="nav-user">
                Hi, {user.name} ({user.role})
              </span>
              <button type="button" className="btn btn-outline" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link" onClick={closeMenu}>
                Log In
              </NavLink>
              <NavLink to="/signup" className="btn btn-primary" onClick={closeMenu}>
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}