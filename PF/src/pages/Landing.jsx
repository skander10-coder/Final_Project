import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

/* ── Keyframes injected once ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    --indigo: #4f46e5;
    --indigo-light: #6366f1;
    --indigo-pale: #eef2ff;
    --indigo-dark: #4338ca;
    --teal: #14b8a6;
    --gold: #f59e0b;
    --white: #ffffff;
    --ink: #0f172a;
    --muted: #64748b;
    --bg-light: #f8fafc;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Inter', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%       { transform: translateY(-18px) rotate(1.5deg); }
    66%       { transform: translateY(-8px) rotate(-1deg); }
  }

  @keyframes blobMorph {
    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    25%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    50%       { border-radius: 50% 60% 30% 60% / 30% 50% 70% 50%; }
    75%       { border-radius: 40% 60% 70% 30% / 60% 40% 30% 70%; }
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(40px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes pulse-ring {
    0%   { transform: scale(0.9); opacity: 0.7; }
    70%  { transform: scale(1.3); opacity: 0; }
    100% { transform: scale(1.3); opacity: 0; }
  }

  .hero-text { animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) both; }
  .hero-sub  { animation: fadeUp 0.9s 0.15s cubic-bezier(.22,1,.36,1) both; }
  .hero-cta  { animation: fadeUp 0.9s 0.28s cubic-bezier(.22,1,.36,1) both; }
  .hero-img  { animation: fadeIn 1.1s 0.3s both, float 6s 1.4s ease-in-out infinite; }

  .blob {
    animation: blobMorph 10s ease-in-out infinite;
  }

  .card-1 { animation: cardReveal 0.7s 0.1s cubic-bezier(.22,1,.36,1) both; }
  .card-2 { animation: cardReveal 0.7s 0.25s cubic-bezier(.22,1,.36,1) both; }
  .card-3 { animation: cardReveal 0.7s 0.4s cubic-bezier(.22,1,.36,1) both; }

  .card-hover {
    transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease;
  }
  .card-hover:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 30px 60px -12px rgba(79,70,229,0.22);
  }
  .card-hover:hover .icon-wrap {
    transform: scale(1.15) rotate(-6deg);
    background: var(--indigo);
  }
  .card-hover:hover .icon-wrap svg {
    color: white;
  }

  .icon-wrap {
    transition: transform 0.3s ease, background 0.3s ease;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--indigo) 0%, var(--indigo-light) 100%);
    color: white;
    border: none;
    padding: 14px 36px;
    border-radius: 50px;
    font-weight: 700;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--indigo-light) 0%, var(--indigo-dark) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(79,70,229,0.45); }
  .btn-primary:hover::before { opacity: 1; }
  .btn-primary span { position: relative; z-index: 1; }

  .btn-secondary {
    background: white;
    color: var(--ink);
    border: 2px solid #e2e8f0;
    padding: 12px 32px;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: all 0.25s ease;
  }
  .btn-secondary:hover {
    border-color: var(--indigo);
    color: var(--indigo);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(79,70,229,0.12);
  }

  .nav-link {
    font-size: 14px;
    font-weight: 500;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .nav-link:hover { color: var(--indigo); }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--indigo-pale);
    color: var(--indigo);
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 50px;
    margin-bottom: 20px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .stat-number {
    font-size: 32px;
    font-weight: 800;
    color: var(--ink);
    line-height: 1;
  }

  .stat-label {
    font-size: 13px;
    color: var(--muted);
    margin-top: 4px;
  }

  .section-enter {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .section-enter.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

function useInView(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

export default function Landing() {
  const featRef = useRef(null);
  const featVisible = useInView(featRef);

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg-light)', overflow: 'hidden' }}>

        {/* ── HEADER ── */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226,232,240,0.8)',
          animation: 'fadeIn 0.6s ease both'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--indigo), var(--indigo-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 17 }}>S</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>Stag.io</span>
            </div>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <a href="#" className="nav-link">Home</a>
              <a href="#features" className="nav-link">Features</a>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>
                <span>Get Started</span>
                <span>→</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 28, paddingRight: 28, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="hero-text">
                <div className="badge">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6"/></svg>
                  Now accepting applications
                </div>
                <h1 style={{ fontWeight: 800, fontSize: 'clamp(38px, 5vw, 62px)', color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  Find Your<br/>
                  <span style={{ background: 'linear-gradient(135deg, var(--indigo), var(--indigo-light), #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Dream Internship
                  </span>
                </h1>
              </div>

              <p className="hero-sub" style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 420 }}>
                Connect with top companies, explore opportunities, and build your career with confidence — all in one platform.
              </p>

              <div className="hero-cta" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn-primary">
                  <span>Get Started Free</span>
                  <span style={{ fontSize: 18 }}>→</span>
                </Link>
                <Link to="/login" className="btn-secondary">Sign In</Link>
              </div>

              {/* Stats */}
              <div className="hero-cta" style={{ display: 'flex', gap: 36, paddingTop: 12 }}>
                {[['2k+', 'Students'], ['300+', 'Companies'], ['95%', 'Success Rate']].map(([n, l]) => (
                  <div key={l}>
                    <div className="stat-number">{n}</div>
                    <div className="stat-label">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Simplified illustration */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420 }}>
              <div className="blob" style={{ position: 'absolute', width: 380, height: 380, background: 'linear-gradient(135deg, rgba(79,70,229,0.85), rgba(99,102,241,0.7))', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: 30, right: 40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(20,184,166,0.3)', zIndex: 1 }} />

              {/* Briefcase icon */}
              <div className="hero-img" style={{ position: 'relative', zIndex: 2 }}>
                <svg width="200" height="180" viewBox="0 0 200 180" fill="none">
                  <rect x="20" y="60" width="160" height="100" rx="14" fill="#eef2ff" stroke="rgba(79,70,229,0.6)" strokeWidth="3"/>
                  <path d="M75 60 V40 Q75 25 100 25 Q125 25 125 40 V60" stroke="rgba(79,70,229,0.8)" strokeWidth="10" strokeLinecap="round" fill="none"/>
                  <rect x="90" y="105" width="30" height="22" rx="5" fill="var(--indigo)"/>
                  <path d="M98 115 v-4 a6 6 0 0 1 12 0 v4" stroke="white" strokeWidth="2" fill="none"/>
                  <line x1="20" y1="110" x2="180" y2="110" stroke="rgba(79,70,229,0.3)" strokeWidth="2"/>
                </svg>
              </div>

              <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', border: '2px solid rgba(79,70,229,0.15)', animation: 'pulse-ring 3s ease-out infinite', pointerEvents: 'none', zIndex: 0 }} />
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" ref={featRef} style={{ padding: '96px 28px', background: 'white', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(79,70,229,0.2), transparent)' }} />

          <div className={`section-enter${featVisible ? ' visible' : ''}`} style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div className="badge" style={{ justifyContent: 'center', margin: '0 auto 16px' }}>Platform Features</div>
              <h2 style={{ fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 16 }}>
                Built for Everyone
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                A powerful platform designed for students, companies and administrators.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }}>
              {[
                {
                  cls: 'card-1',
                  color: 'var(--indigo)',
                  bg: 'var(--indigo-pale)',
                  title: 'For Students',
                  desc: 'Discover internships, track applications and build your career step by step.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                      <path d="M12 20v-6M3 17v-4l9 5 9-5v4"/>
                    </svg>
                  )
                },
                {
                  cls: 'card-2',
                  color: 'var(--indigo-light)',
                  bg: '#eef2ff',
                  title: 'For Companies',
                  desc: 'Manage candidates, post opportunities and find the right talent fast.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2"/>
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    </svg>
                  )
                },
                {
                  cls: 'card-3',
                  color: '#6366f1',
                  bg: '#eef2ff',
                  title: 'For Admins',
                  desc: 'Control the platform, review content, and ensure a high quality experience.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  )
                }
              ].map(({ cls, color, bg, title, desc, icon }) => (
                <div key={title} className={`${cls} card-hover`} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 24, padding: 36, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: '24px 24px 0 0' }} />

                  <div className="icon-wrap" style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color }}>
                    {icon}
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: 20, color: 'var(--ink)', marginBottom: 10 }}>{title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section style={{ padding: '80px 28px', background: 'linear-gradient(135deg, var(--indigo) 0%, var(--indigo-light) 50%, #818cf8 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(26px, 4vw, 44px)', color: 'white', letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.2 }}>
              Ready to Launch Your Career?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
              Join thousands of students and companies already on Stag.io.
            </p>
            <Link to="/register" style={{ background: 'white', color: 'var(--indigo)', padding: '14px 40px', borderRadius: 50, fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'transform 0.25s ease, box-shadow 0.25s ease', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
              Start for Free →
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: '28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--indigo), var(--indigo-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>S</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>Stag.io</span>
          </div>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>© {new Date().getFullYear()} Stag.io · All rights reserved</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>
                {l}
              </a>
            ))}
          </div>
        </footer>

      </div>
    </>
  );
}