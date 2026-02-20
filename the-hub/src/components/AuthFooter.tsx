import React from 'react';
import { Link } from 'react-router-dom';

const AuthFooter: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '48px',
        fontFamily: "'DM Sans', sans-serif",
        color: '#888',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <span>© 2026 The Hub. Built for collectors, by collectors.</span>
      <div style={{ display: 'flex', gap: '24px' }}>
        <a href="https://t.me/hubtest123" style={{ color: '#888', textDecoration: 'none' }}>Telegram</a>
        <a href="https://instagram.com/thehubdeals08" style={{ color: '#888', textDecoration: 'none' }}>Instagram</a>
        <Link to="/blog" style={{ color: '#888', textDecoration: 'none' }}>Blog</Link>
      </div>
    </footer>
  );
};

export default AuthFooter;
