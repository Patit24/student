import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { BookOpen, LogOut, Shield, Zap } from 'lucide-react';
import logoImg from '../assets/logopng.png';

export default function Navbar() {
  const { currentUser, logout, isMockMode } = useAppContext();
  const navigate = useNavigate();

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
          style={{ textDecoration: 'none', color: '#F0F4FF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
        >
          <img src={logoImg} alt="PPREducation" style={{ height: '36px', width: 'auto' }} />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            PPREducation
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {isMockMode && (
            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#EF4444', borderRadius: '4px', fontWeight: 700 }}>
              MOCK MODE
            </span>
          )}

          {currentUser?.role === 'super_admin' && (
            <span className="flex items-center gap-1" style={{ fontSize: '0.82rem', color: '#F5C518' }}>
              <Shield size={13} /> Super Admin
            </span>
          )}

          {currentUser ? (
            <>
              <span style={{ color: '#7A8BA8', fontSize: '0.88rem' }}>
                {currentUser.name}
                {currentUser.role !== 'super_admin' && (
                  <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6 }}>
                    ({currentUser.subscription_tier || currentUser.role})
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/"      style={navLink} id="nav-home">Home</Link>
              <Link to="/search" style={navLink} id="nav-search">Find Tutors</Link>
              <Link to="/about" style={navLink} id="nav-about">About</Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} id="nav-login">
                Log In
              </Link>
              <Link
                to="/signup"
                id="nav-signup"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: '#F5C518', color: '#07090F',
                  fontWeight: 700, fontSize: '0.85rem',
                  padding: '0.45rem 1.1rem', borderRadius: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(245,197,24,0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Zap size={13} /> Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
