import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/predict', label: 'Predict' },
    { to: '/about', label: 'About' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(4,6,13,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 0.3s',
    }}>
      <div className="container flex items-center justify-between" style={{ height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="var(--cyan)" strokeWidth="1.5" />
            <path d="M8 14 C8 10 11 8 14 8 C17 8 20 10 20 14 C20 18 17 20 14 20" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="3" fill="var(--cyan)" opacity="0.8"/>
            <path d="M14 20 L10 24 M14 20 L18 24" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Toxi<span style={{ color: 'var(--cyan)' }}>Scan</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4 }}>
          {links.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to} style={{
                padding: '8px 16px',
                borderRadius: 6,
                fontFamily: 'var(--font-display)',
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                color: active ? 'var(--cyan)' : 'var(--text-2)',
                textDecoration: 'none',
                background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
                border: active ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Badge */}
        <div className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-glow 2s ease infinite' }} />
          ML Model Ready
        </div>
      </div>
    </nav>
  );
}
