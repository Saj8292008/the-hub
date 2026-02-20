/**
 * Signup Page — Using Clerk SignUp with matching landing.html dark theme
 */
import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const styles = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    background: '#0a0a0a',
    color: '#f0f0f0',
    minHeight: '100vh',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    WebkitFontSmoothing: 'antialiased' as const,
  },
  nav: {
    position: 'fixed' as const, top: 0, left: 0, right: 0,
    padding: '20px 48px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(10,10,10,0.92)',
    backdropFilter: 'blur(20px)',
    zIndex: 100,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  navLogo: {
    fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px',
    color: '#f0f0f0', textDecoration: 'none',
  },
  navLinks: { display: 'flex', gap: '32px', alignItems: 'center' },
  navLink: {
    textDecoration: 'none', color: '#888',
    fontSize: '14px', fontWeight: 500,
  },
  btnPrimary: {
    background: '#f0f0f0', color: '#0a0a0a',
    padding: '10px 24px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 600,
    textDecoration: 'none', display: 'inline-block',
    border: 'none', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  content: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '120px 24px 60px',
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '32px 48px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    color: '#888', fontSize: '13px',
  },
  footerLinks: { display: 'flex', gap: '24px' },
  footerLink: { color: '#888', textDecoration: 'none', fontSize: '13px' },
};

export default function Signup() {
  const Nav = () => (
    <nav style={styles.nav}>
      <a href="/" style={styles.navLogo}>The Hub</a>
      <div style={styles.navLinks}>
        <a href="/#how" style={styles.navLink}>How It Works</a>
        <a href="/#categories" style={styles.navLink}>Categories</a>
        <a href="/#channels" style={styles.navLink}>Alerts</a>
        <a href="/login" style={styles.navLink}>Log in</a>
        <a href="/signup" style={styles.btnPrimary}>Get Started Free</a>
      </div>
    </nav>
  );

  const Footer = () => (
    <footer style={styles.footer}>
      <span>© 2026 The Hub. Built for collectors, by collectors.</span>
      <div style={styles.footerLinks}>
        <a href="https://t.me/hubtest123" style={styles.footerLink}>Telegram</a>
        <a href="https://instagram.com/thehubdeals08" style={styles.footerLink}>Instagram</a>
        <a href="/blog" style={styles.footerLink}>Blog</a>
      </div>
    </footer>
  );

  return (
    <div style={styles.page}>
      <Nav />
      <div style={styles.content}>
        <SignUp 
          appearance={{
            elements: {
              rootBox: { 
                width: '100%', 
                maxWidth: '440px',
                fontFamily: "'DM Sans', sans-serif",
              },
              card: { 
                background: '#141414', 
                border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: '12px',
                boxShadow: 'none',
              },
              headerTitle: { 
                color: '#f0f0f0',
                fontSize: '36px',
                fontWeight: 700,
                letterSpacing: '-1px',
              },
              headerSubtitle: { 
                color: '#888',
                fontSize: '15px',
              },
              formFieldInput: { 
                background: '#0a0a0a', 
                border: '1px solid rgba(255,255,255,0.08)', 
                color: '#f0f0f0', 
                borderRadius: '8px',
                fontSize: '15px',
              },
              formFieldLabel: {
                color: '#888',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
              },
              formButtonPrimary: { 
                background: '#f0f0f0', 
                color: '#0a0a0a', 
                borderRadius: '8px', 
                fontWeight: 600,
                fontSize: '15px',
                textTransform: 'none' as const,
              },
              footerActionLink: { 
                color: '#f0f0f0',
                fontWeight: 600,
              },
              footerActionText: {
                color: '#888',
                fontSize: '14px',
              },
              socialButtonsBlockButton: { 
                background: '#141414', 
                border: '1px solid rgba(255,255,255,0.08)', 
                color: '#f0f0f0',
                borderRadius: '8px',
              },
              socialButtonsBlockButtonText: {
                color: '#f0f0f0',
                fontWeight: 500,
              },
              dividerLine: {
                background: 'rgba(255,255,255,0.08)',
              },
              dividerText: {
                color: '#888',
              },
              identityPreviewText: {
                color: '#f0f0f0',
              },
              identityPreviewEditButton: {
                color: '#888',
              },
              formFieldInputShowPasswordButton: {
                color: '#888',
              },
              formFieldAction: {
                color: '#888',
              },
              otpCodeFieldInput: {
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f0f0f0',
                borderRadius: '8px',
              },
              formResendCodeLink: {
                color: '#f0f0f0',
              },
            },
          }}
          routing="path"
          path="/signup"
          signInUrl="/login"
          afterSignUpUrl="/dashboard"
          afterSignInUrl="/dashboard"
        />
      </div>
      <Footer />
    </div>
  );
}
