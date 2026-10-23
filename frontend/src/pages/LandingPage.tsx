import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Play, CheckCircle, Brain, Search,
  FileText, Users, GraduationCap, Briefcase,
  ClipboardList, Menu, X, ChevronRight, Globe,
  MessageSquare, Video, Mail, Calendar,
} from 'lucide-react';

/* ── Official Columbia University Brand Palette ───────────────────────── */
const CU = {
  navyHeader:   '#000D74',   /* Primary Web Blue */
  navyDeep:     '#000A5E',   /* Primary dark shade */
  green:        '#0038A8',   /* Pantone 286 — accent/navigation */
  greenDark:    '#002D8A',   /* Accent hover */
  greenLight:   '#0046CC',   /* Accent light */
  blue:         '#0038A8',   /* Pantone 286 */
  blueLight:    '#B9D9EB',   /* Pantone 290 — Official Columbia Blue */
  gold:         '#B9D9EB',   /* Columbia Blue accent */
  goldLight:    '#C8E2F0',   /* Columbia Blue light */
  white:        '#FFFFFF',
  offWhite:     '#F5F6F8',
  cream:        '#FAFAF5',
  textBody:     '#2A2A2A',
  textMuted:    '#555555',
  border:       '#D5D8DE',
};

/* ── Header Bar — Exactly Like columbia.edu ───────────────────────────── */
function HeaderBar() {
  return (
    <div style={{
      background: CU.navyHeader,
      borderBottom: `1px solid rgba(255,255,255,0.08)`,
    }}>
      <div className="container">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 72, gap: 16,
        }}>
          {/* Logo — White version for dark header */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/torios-logo-white.png" alt="ToriOS — Your AI Assistant, Everywhere" style={{ height: 52 }} />
          </Link>

          {/* Utility links — top right like Columbia */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }} className="desktop-nav">
            {['About', 'Contact'].map((item) => (
              <a key={item} href="#"
                style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 500, textDecoration: 'none', letterSpacing: '0.02em' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                {item}
              </a>
            ))}
            <Link to="/login" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
              Login
            </Link>
            <Link to="/register" style={{
              background: CU.green, color: '#fff',
              padding: '7px 18px', fontSize: 12, fontWeight: 700,
              textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              Get Started
            </Link>
          </div>

          {/* Mobile burger */}
          <button onClick={() => document.getElementById('mobile-menu')?.classList.toggle('open')} className="mobile-nav"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'none' }}>
            <Menu size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Green Navigation Bar — Columbia's signature ─────────────────────── */
function GreenNav() {
  return (
    <div style={{ background: CU.green }}>
      <div className="container">
        <div style={{
          display: 'flex', alignItems: 'center', height: 48,
          gap: 0, overflow: 'auto',
        }} className="desktop-nav">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Use Cases', href: '#use-cases' },
            { label: 'Bots', href: '#bots' },
            { label: 'Roadmap', href: '#roadmap' },
          ].map((item) => (
            <a key={item.label} href={item.href}
              style={{
                color: '#fff', fontSize: 14, fontWeight: 500,
                textDecoration: 'none', padding: '0 22px', height: '100%',
                display: 'flex', alignItems: 'center',
                borderBottom: '3px solid transparent',
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = CU.greenDark;
                (e.currentTarget as HTMLElement).style.borderBottomColor = CU.goldLight;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent';
              }}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Breadcrumb — just like Columbia ─────────────────────────────────── */
function Breadcrumb() {
  return (
    <div style={{ background: CU.offWhite, borderBottom: `1px solid ${CU.border}`, padding: '10px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: CU.textMuted }}>
          <a href="/" style={{ color: CU.blue, textDecoration: 'underline' }}>Home</a>
          <ChevronRight size={12} />
          <span style={{ color: CU.textBody }}>AI Meeting Intelligence</span>
        </div>
      </div>
    </div>
  );
}

/* ── Hero — Clean editorial with architectural feel ──────────────────── */
function Hero() {
  return (
    <section style={{ background: CU.navyHeader, position: 'relative', overflow: 'hidden' }}>
      {/* Gold accent line at top — like Columbia's crown detail */}
      <div style={{ height: 4, background: CU.gold }} />

      <div className="container" style={{ padding: '80px 24px 72px' }}>
        <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <img src="/torios-logo-white.png" alt="ToriOS" style={{ height: 100, margin: '0 auto', display: 'block' }} />
          </div>

          <h1 style={{
            fontFamily: "'Cinzel', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: 24,
            letterSpacing: '-0.01em',
          }}>
            Your conversations,<br />
            <em style={{ fontStyle: 'italic', color: CU.blueLight }}>understood.</em>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 19px)',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.75,
            marginBottom: 40,
            maxWidth: 540,
            margin: '0 auto 40px',
            fontFamily: "'Cinzel', 'Times New Roman', serif",
          }}>
            ToriOS attends your Google Meet and Zoom meetings, transcribes
            every word, saves audio and video recordings, and sends AI-generated summaries directly to all participants.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: CU.green, color: '#fff',
              padding: '14px 32px', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'background 150ms ease',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = CU.greenLight; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = CU.green; }}>
              Get Started Free <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.85)',
              padding: '14px 28px', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 150ms ease',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#fff'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}>
              <Play size={14} /> How It Works
            </a>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            {['Google Meet', 'Zoom', 'Auto-Transcription', 'Save Audio & Video', 'Email Summaries'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color={CU.green} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features — White editorial layout ───────────────────────────────── */
function Features() {
  const items = [
    { icon: Calendar, title: 'Connect your calendar', desc: 'Link Google Calendar or Outlook. ToriOS identifies upcoming meetings and joins automatically.' },
    { icon: Video, title: 'Bot joins the call', desc: 'ToriOS joins your Google Meet or Zoom as a silent participant. No downloads needed.' },
    { icon: FileText, title: 'Live transcription', desc: 'Every word captured and transcribed in real-time using Whisper AI with speaker detection.' },
    { icon: Video, title: 'Save audio & video', desc: 'ToriOS automatically records and saves meeting audio and video after Google Meet/Zoom calls, just like Fireflies.ai, so you can replay them anytime.' },
    { icon: Brain, title: 'AI insight generation', desc: 'Gemini AI produces executive summaries, decisions, action items, and key points.' },
    { icon: Mail, title: 'Summary emailed instantly', desc: 'When the meeting ends, all participants receive a clean, structured summary email.' },
  ];

  return (
    <section id="features" style={{ padding: '80px 0', background: CU.white }}>
      <div className="container">
        <div style={{ maxWidth: 640, marginBottom: 56 }}>
          <div style={{ width: 48, height: 3, background: CU.green, marginBottom: 20 }} />
          <h2 style={{
            fontFamily: "'Cinzel', 'Times New Roman', serif",
            fontSize: 'clamp(28px, 3.5vw, 40px)',
            fontWeight: 700,
            color: CU.navyHeader,
            marginBottom: 14,
          }}>
            ToriOS Attends Your Meetings
          </h2>
          <p style={{ fontSize: 17, color: CU.textMuted, lineHeight: 1.7 }}>
            Invite ToriOS to any Google Meet or Zoom call. It joins, listens, and delivers structured intelligence to every participant.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 1, background: CU.border }}>
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: CU.white, padding: '32px 28px',
              transition: 'background 150ms ease',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = CU.cream; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = CU.white; }}>
              <div style={{
                width: 44, height: 44, background: `rgba(90,131,47,0.10)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon size={20} color={CU.green} />
              </div>
              <h3 style={{
                fontFamily: "'Cinzel', 'Times New Roman', serif",
                fontSize: 18, fontWeight: 700, color: CU.navyHeader,
                marginBottom: 8,
              }}>{title}</h3>
              <p style={{ fontSize: 14, color: CU.textMuted, lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Platforms */}
        <div style={{
          marginTop: 40, padding: '24px 32px',
          background: CU.offWhite, border: `1px solid ${CU.border}`,
          display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: CU.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Integrates with</span>
          {[
            { name: 'Google Meet', color: CU.green },
            { name: 'Zoom', color: '#2D8CFF' },
            { name: 'Google Calendar', color: CU.blue },
            { name: 'Gmail / Outlook', color: CU.gold },
          ].map(({ name, color }) => (
            <span key={name} style={{ fontSize: 14, fontWeight: 600, color }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Schedule a bot', desc: 'Paste your Google Meet or Zoom link. ToriOS will join automatically at the scheduled time.' },
    { num: '02', title: 'Bot attends live', desc: 'ToriOS joins as a silent participant, records the audio and video, and begins real-time transcription.' },
    { num: '03', title: 'AI analysis', desc: 'Our Gemini-powered pipeline extracts summaries, key decisions, action items, and open questions.' },
    { num: '04', title: 'Save & share', desc: 'Audio/video recordings are saved securely, and a clean, formatted summary is emailed to the organizer and all participants automatically.' },
  ];

  return (
    <section id="how-it-works" style={{ padding: '80px 0', background: CU.offWhite, borderTop: `1px solid ${CU.border}`, borderBottom: `1px solid ${CU.border}` }}>
      <div className="container">
        <div style={{ maxWidth: 640, marginBottom: 56 }}>
          <div style={{ width: 48, height: 3, background: CU.green, marginBottom: 20 }} />
          <h2 style={{
            fontFamily: "'Cinzel', 'Times New Roman', serif",
            fontSize: 'clamp(28px, 3.5vw, 40px)',
            fontWeight: 700, color: CU.navyHeader, marginBottom: 14,
          }}>
            From Meeting to Insight in Four Steps
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 40 }}>
          {steps.map(({ num, title, desc }) => (
            <div key={num}>
              <div style={{
                width: 48, height: 48,
                background: CU.navyHeader, color: '#fff',
                fontFamily: "'Cinzel', 'Times New Roman', serif",
                fontSize: 16, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>{num}</div>
              <h3 style={{
                fontFamily: "'Cinzel', 'Times New Roman', serif",
                fontSize: 20, fontWeight: 700, color: CU.navyHeader, marginBottom: 10,
              }}>{title}</h3>
              <p style={{ fontSize: 15, color: CU.textMuted, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Use Cases ───────────────────────────────────────────────────────── */
function UseCases() {
  const cases = [
    { icon: GraduationCap, title: 'Students & Researchers', desc: 'Record lectures, seminars, and interviews — get searchable, structured notes automatically.' },
    { icon: Users, title: 'Professional Teams', desc: 'Never lose a decision or commitment made in standups, sprints, or strategy sessions.' },
    { icon: Briefcase, title: 'Project Managers', desc: 'Extract every action item and its owner automatically — no manual note-taking.' },
    { icon: MessageSquare, title: 'Recruiters & HR', desc: 'Structured interview summaries with key signals delivered to hiring managers instantly.' },
    { icon: Globe, title: 'Organizations', desc: 'Build a shared knowledge base from every meeting your team has ever had.' },
  ];

  return (
    <section id="use-cases" style={{ padding: '80px 0', background: CU.white }}>
      <div className="container">
        <div style={{ maxWidth: 640, marginBottom: 56 }}>
          <div style={{ width: 48, height: 3, background: CU.green, marginBottom: 20 }} />
          <h2 style={{
            fontFamily: "'Cinzel', 'Times New Roman', serif",
            fontSize: 'clamp(28px, 3.5vw, 40px)',
            fontWeight: 700, color: CU.navyHeader, marginBottom: 14,
          }}>
            Built for How You Actually Work
          </h2>
          <p style={{ fontSize: 17, color: CU.textMuted, lineHeight: 1.7 }}>
            ToriOS adapts to every team, workflow, and conversation type.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 0 }}>
          {cases.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} style={{
              display: 'flex', gap: 20, padding: '28px 0',
              borderTop: `1px solid ${CU.border}`,
            }}>
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                background: `rgba(90,131,47,0.08)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color={CU.green} />
              </div>
              <div>
                <h3 style={{
                  fontFamily: "'Cinzel', 'Times New Roman', serif",
                  fontSize: 17, fontWeight: 700, color: CU.navyHeader, marginBottom: 6,
                }}>{title}</h3>
                <p style={{ fontSize: 14, color: CU.textMuted, lineHeight: 1.65 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Roadmap ──────────────────────────────────────────────────────────── */
function Roadmap() {
  return (
    <section id="roadmap" style={{ padding: '80px 0', background: CU.navyHeader }}>
      {/* Gold divider */}
      <div style={{ height: 4, background: CU.gold, marginBottom: 0, position: 'relative', top: -80 - 4 }} />

      <div className="container">
        <div style={{ maxWidth: 640, marginBottom: 56 }}>
          <div style={{ width: 48, height: 3, background: CU.gold, marginBottom: 20 }} />
          <h2 style={{
            fontFamily: "'Cinzel', 'Times New Roman', serif",
            fontSize: 'clamp(28px, 3.5vw, 40px)',
            fontWeight: 700, color: '#fff', marginBottom: 14,
          }}>
            The AI Workspace for <em style={{ fontStyle: 'italic', color: CU.blueLight }}>Every Conversation</em>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            ToriOS starts with meeting intelligence. Designed to grow into the central AI workspace for how teams communicate.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.08)' }}>
          {[
            { icon: Video, label: 'ToriOS Meet', desc: 'Join, transcribe, and summarize any meeting', live: true },
            { icon: ClipboardList, label: 'ToriOS Forms', desc: 'AI-generated forms with intelligent response analysis', live: false },
            { icon: GraduationCap, label: 'ToriOS Assess', desc: 'Online exams with automated grading and rubrics', live: false },
            { icon: Users, label: 'ToriOS Interview', desc: 'AI-led interviews with structured evaluation reports', live: false },
          ].map(({ icon: Icon, label, desc, live }) => (
            <div key={label} style={{ background: CU.navyHeader, padding: '28px 24px' }}>
              <div style={{
                width: 40, height: 40,
                background: live ? `rgba(90,131,47,0.20)` : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon size={18} color={live ? CU.greenLight : 'rgba(255,255,255,0.3)'} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', 'Times New Roman', serif" }}>{label}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 14 }}>{desc}</div>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: live ? CU.greenLight : 'rgba(255,255,255,0.25)',
              }}>
                {live ? '● Available Now' : 'Coming Soon'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ──────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{ padding: '80px 0', background: CU.white, borderTop: `1px solid ${CU.border}` }}>
      <div className="container">
        <div style={{
          background: CU.offWhite, border: `1px solid ${CU.border}`,
          padding: '56px 40px', textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: "'Cinzel', 'Times New Roman', serif",
            fontSize: 'clamp(28px, 3.5vw, 38px)',
            fontWeight: 700, color: CU.navyHeader, marginBottom: 16,
          }}>
            Ready to Transform Your Meetings?
          </h2>
          <p style={{ fontSize: 17, color: CU.textMuted, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Join teams using ToriOS to turn every conversation into structured, searchable knowledge.
          </p>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: CU.green, color: '#fff',
            padding: '14px 36px', fontSize: 14, fontWeight: 700,
            textDecoration: 'none', textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'background 150ms ease',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = CU.greenLight; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = CU.green; }}>
            Get Started — It's Free <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Footer — dark institutional ──────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: CU.navyDeep, padding: '40px 0', borderTop: `4px solid ${CU.gold}` }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/torios-logo-white.png" alt="ToriOS" style={{ height: 32 }} />
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', fontFamily: "'Cinzel', 'Times New Roman', serif", letterSpacing: '0.03em', textTransform: 'uppercase' }}>ToriOS</span>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your AI Assistant, Everywhere</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)' }}>
            © 2026 ToriOS. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a key={item} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Landing Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <HeaderBar />
      <GreenNav />
      <Breadcrumb />
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Roadmap />
      <CTA />
      <Footer />
    </div>
  );
}
