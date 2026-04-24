import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { BookOpen, LogOut, Shield, Zap, Menu, X } from 'lucide-react';
import logoImg from '../assets/logopng.png';

export default function Navbar() {
  const { currentUser, logout, isMockMode } = useAppContext();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  const dashPath =
    currentUser?.role === 'super_admin' ? '/admin-panel' :
    currentUser?.role === 'tutor' ? '/tutor' : '/student';

  const navLink = {
    textDecoration: 'none',
    color: '#7A8BA8',
    fontSize: '0.88rem',
    fontWeight: 500,
    transition: 'color 0.2s',
    padding: '0.5rem 1.2rem',
  };

  return (
    <nav style={{
      background: 'rgba(7,11,24,0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0.9rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div className="container flex justify-between items-center" style={{ padding: 0 }}>

        {/* Logo */}
        <Link
          to={currentUser ? dashPath : '/'}
          style={{ textDecoration: 'none', color: '#F0F4FF', display: 'flex', alignItems: 'center' }}
        >
          <img src={logoImg} alt="PPREducation" style={{ height: '55px', width: 'auto', display: 'block' }} />
        </Link>

        {/* Desktop Nav */}
        <div className="hide-on-mobile flex items-center gap-6">
          {currentUser ? (
            <>
              <span style={{ color: '#7A8BA8', fontSize: '0.88rem' }}>
                {currentUser.name}
                <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6 }}>
                  ({currentUser.subscription_tier || currentUser.role})
                </span>
              </span>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/" style={navLink}>Home</Link>
              <Link to="/search" style={navLink}>Find Tutors</Link>
              <Link to="/about" style={navLink}>About</Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Log In</Link>
              <Link to="/signup" className="hp-btn-primary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
                <Zap size={13} /> Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="show-on-mobile" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="show-on-mobile animate-fade-in" style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#070B18', padding: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <Link to="/" onClick={() => setIsMenuOpen(false)} style={navLink}>Home</Link>
          <Link to="/search" onClick={() => setIsMenuOpen(false)} style={navLink}>Find Tutors</Link>
          <Link to="/about" onClick={() => setIsMenuOpen(false)} style={navLink}>About</Link>
          <hr style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
          {currentUser ? (
            <button onClick={handleLogout} className="btn btn-outline" style={{ justifyContent: 'center' }}>
              <LogOut size={18} /> Logout
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-outline" style={{ justifyContent: 'center' }}>Log In</Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="hp-btn-primary" style={{ justifyContent: 'center' }}>
                <Zap size={18} /> Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
