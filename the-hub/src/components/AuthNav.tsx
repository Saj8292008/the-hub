import React from 'react';
import { Link } from 'react-router-dom';

const AuthNav: React.FC = () => {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <a
        href="/"
        style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          color: '#f0f0f0',
          textDecoration: 'none',
        }}
      >
        The Hub
      </a>
      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <Link
          to="/login"
          style={{
            textDecoration: 'none',
            color: '#888',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Log in
        </Link>
        <Link
          to="/signup"
          style={{
            background: '#f0f0f0',
            color: '#0a0a0a',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Get Started Free
        </Link>
      </div>
    </nav>
  );
};

export default AuthNav;
