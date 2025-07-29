import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div style={{ fontFamily: "Segoe UI, Arial, sans-serif", background: isDarkMode ? "#1f2937" : "#fafafd", minHeight: "100vh" }}>
      {/* Dark Mode Toggle Button */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000 
      }}>
        <button
          onClick={toggleDarkMode}
          style={{
            background: isDarkMode ? '#374151' : '#f3f4f6',
            color: isDarkMode ? '#f9fafb' : '#374151',
            border: 'none',
            borderRadius: '50px',
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: isDarkMode
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
              : '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
          }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span style={{ fontSize: '16px' }}>
            {isDarkMode ? '🌙' : '☀️'}
          </span>
          <span>
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>

      {/* Hero Section */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "48px 0 32px 0" }}>
        <div style={{ background: isDarkMode ? "#374151" : "#fff", color: "#7c3aed", fontWeight: 600, fontSize: 18, borderRadius: 24, boxShadow: isDarkMode ? "0 2px 16px #1f2937" : "0 2px 16px #ede9fe", padding: "10px 32px", marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>✨</span> Professional Wall Design Platform
        </div>
        <h1 style={{ fontSize: 64, fontWeight: 900, color: isDarkMode ? "#f9fafb" : "#232946", margin: 0, textAlign: 'center', letterSpacing: 1 }}>Design Your<br /><span style={{ color: "#a78bfa" }}>Perfect Wall</span></h1>
        <div style={{ fontSize: 22, color: isDarkMode ? "#d1d5db" : "#6b7280", margin: "32px 0 40px 0", textAlign: 'center', maxWidth: 700 }}>
          Complete wall design platform with user authentication, subscription plans, draft management, and professional tools. From concept to creation with enterprise-grade features.
        </div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 32 }}>
          <button onClick={() => navigate("/walldesigner")}
            style={{ background: "#a78bfa", color: "#fff", fontWeight: 700, fontSize: 20, border: 'none', borderRadius: 12, padding: "16px 38px", cursor: "pointer", display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px #ede9fe' }}>
            <span style={{ fontSize: 22 }}>🎨</span> Start Designing Free <span style={{ fontSize: 22 }}>→</span>
          </button>
          <button onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })}
            style={{ background: isDarkMode ? "#374151" : "#fff", color: isDarkMode ? "#f9fafb" : "#232946", fontWeight: 700, fontSize: 20, border: 'none', borderRadius: 12, padding: "16px 38px", cursor: "pointer", display: 'flex', alignItems: 'center', gap: 10, boxShadow: isDarkMode ? '0 2px 8px #1f2937' : '0 2px 8px #ede9fe', border: isDarkMode ? '1.5px solid #4b5563' : '1.5px solid #ececec' }}>
            <span style={{ fontSize: 22 }}>👁️</span> View Features
          </button>
        </div>
        <div style={{ display: 'flex', gap: 32, marginTop: 24, color: '#7c3aed', fontWeight: 600, fontSize: 18 }}>
          <span><span style={{ fontSize: 20 }}>✔️</span> Free Plan Available</span>
          <span><span style={{ fontSize: 20 }}>✔️</span> Secure Authentication</span>
          <span><span style={{ fontSize: 20 }}>✔️</span> Draft Management</span>
        </div>
      </section>

      {/* Feature Highlights */}
      <section style={{ background: isDarkMode ? '#111827' : '#fafafd', padding: '32px 0 0 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: 38, fontWeight: 800, color: isDarkMode ? '#f9fafb' : '#232946', marginBottom: 8 }}>Comprehensive Feature Set</h2>
        <div style={{ textAlign: 'center', color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: 20, marginBottom: 40 }}>
          Everything you need for professional wall design with user management, subscriptions, and collaboration
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32, marginBottom: 48 }}>
          {/* Feature Cards */}
          {[
            {
              icon: '🛡️',
              title: 'User Authentication & Profile',
              desc: 'Secure JWT authentication with complete profile management and session control.',
              bullets: [
                'Secure register/login/logout',
                'Password updates',
                'Session management',
                'User profiles with plan info'
              ]
            },
            {
              icon: '👑',
              title: 'Subscription Plans & Upgrades',
              desc: 'Flexible plans with upgrade workflow and admin approval system.',
              bullets: [
                'Basic, Pro, Pro Max plans',
                'Upgrade request system',
                'Admin approval workflow',
                'Usage tracking & limits'
              ]
            },
            {
              icon: '🎨',
              title: 'Advanced Wall Designer',
              desc: 'Professional wall design tool with drag-and-drop canvas and customization options.',
              bullets: [
                'Custom canvas sizing',
                'Background images/colors',
                'Drag & resize elements',
                'Real-time preview'
              ]
            },
            {
              icon: '🖼️',
              title: 'Image Upload & Manipulation',
              desc: 'Upload and style images with professional frames, shapes, and positioning tools.',
              bullets: [
                'Multiple image shapes',
                'Professional frame styles',
                'Drag & drop positioning',
                'Layer management'
              ]
            },
            {
              icon: '🔲',
              title: 'Decorations & Elements',
              desc: 'Add decorative elements and manage them with full positioning control.',
              bullets: [
                'Public decoration library',
                'Admin-approved decorations',
                'Drag & resize decorations',
                'Element management'
              ]
            },
            {
              icon: '💾',
              title: 'Draft Management System',
              desc: 'Save, load, and manage your designs with plan-based limitations.',
              bullets: [
                'Save/load/delete drafts',
                'Plan-based draft limits',
                'Draft previews',
                'Auto-save functionality'
              ]
            },
            {
              icon: '🔗',
              title: 'Sharing & Download',
              desc: 'Export designs as high-quality images or share with custom links.',
              bullets: [
                'High-quality image export',
                'Shareable links',
                'View-only sharing',
                'Editable sharing'
              ]
            },
            {
              icon: '⚙️',
              title: 'Admin Dashboard',
              desc: 'Comprehensive admin panel for user, content, and system management.',
              bullets: [
                'User management',
                'Draft oversight',
                'Decoration approval',
                'Analytics & reporting'
              ]
            },
            {
              icon: '✉️',
              title: 'Email Notifications',
              desc: 'Automated email system for users and admins with event notifications.',
              bullets: [
                'User event emails',
                'Admin notifications',
                'Upgrade status emails',
                'Custom email system'
              ]
            }
          ].map((f, idx) => (
            <div key={idx} style={{ background: isDarkMode ? '#374151' : '#fff', borderRadius: 18, boxShadow: isDarkMode ? '0 2px 12px #1f2937' : '0 2px 12px #ede9fe', padding: 32, minWidth: 280, maxWidth: 340, flex: 1, margin: 8 }}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8, color: isDarkMode ? '#f9fafb' : '#232946' }}>{f.title}</h3>
              <div style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: 16, marginBottom: 12 }}>{f.desc}</div>
              <ul style={{ color: '#7c3aed', fontSize: 15, paddingLeft: 18, margin: 0 }}>
                {f.bullets.map((b, i) => <li key={i} style={{ marginBottom: 4, listStyle: 'none', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: 6 }}>✔️</span>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ background: isDarkMode ? '#111827' : '#fafafd', padding: '32px 0 0 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: 38, fontWeight: 800, color: isDarkMode ? '#f9fafb' : '#232946', marginBottom: 8 }}>How It Works</h2>
        <div style={{ textAlign: 'center', color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: 20, marginBottom: 40 }}>
          From registration to professional wall designs in 4 simple steps
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', marginBottom: 48 }}>
          {[
            { icon: '🧑‍💼', title: 'Register & Choose Plan', desc: 'Create account, select subscription plan' },
            { icon: '🎨', title: 'Design Your Wall', desc: 'Upload images, add decorations, customize' },
            { icon: '💾', title: 'Save & Manage', desc: 'Save drafts, manage within plan limits' },
            { icon: '🔗', title: 'Share & Export', desc: 'Download or share with custom links' }
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 180, maxWidth: 220 }}>
              <div style={{ background: '#a78bfa', color: '#fff', borderRadius: '50%', width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{idx + 1}</div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{step.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: isDarkMode ? '#f9fafb' : '#232946' }}>{step.title}</div>
              <div style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: 15 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ background: isDarkMode ? '#111827' : '#fafafd', padding: '32px 0 0 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: 38, fontWeight: 800, color: isDarkMode ? '#f9fafb' : '#232946', marginBottom: 8 }}>Choose Your Plan</h2>
        <div style={{ textAlign: 'center', color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: 20, marginBottom: 40 }}>
          Flexible pricing with upgrade request system and admin approval
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 48 }}>
          {/* Pricing Cards */}
          {[
            {
              name: 'Basic', price: 'Free', desc: 'Perfect for getting started', features: ['3 draft saves', 'Basic templates', 'Standard export', 'Community support', 'Email notifications'], cta: 'Get Started Free', color: '#fff', text: '#a78bfa', badge: '5 drafts'
            },
            {
              name: 'Pro', price: '$10/mo', desc: 'For creative professionals', features: ['6 draft saves', 'Premium templates', 'HD export', 'Priority support', 'Advanced tools', 'Upgrade requests'], cta: 'Request Upgrade', color: '#f5e6fa', text: '#a78bfa', badge: '50 drafts', popular: true
            },
            {
              name: 'Pro Max', price: '$30/mo', desc: 'For teams and agencies', features: ['Unlimited drafts', 'All templates', '4K export', '24/7 support', 'Team collaboration', 'Custom branding', 'Admin features'], cta: 'Request Upgrade', color: '#f5e6fa', text: '#a78bfa', badge: 'Unlimited', popular: false
            }
          ].map((plan, idx) => (
            <div key={idx} style={{ background: isDarkMode ? '#374151' : plan.color, borderRadius: 20, boxShadow: isDarkMode ? '0 4px 24px #1f2937' : '0 4px 24px #ede9fe', padding: 36, minWidth: 260, maxWidth: 340, flex: 1, margin: 8, border: plan.popular ? '2.5px solid #a78bfa' : 'none', position: 'relative' }}>
              {plan.popular && <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', background: '#a78bfa', color: '#fff', borderRadius: 16, padding: '4px 18px', fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px #ede9fe' }}>Most Popular</div>}
              <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 8, color: isDarkMode ? '#f9fafb' : '#232946' }}>{plan.name}</h2>
              <div style={{ fontSize: 38, fontWeight: 900, color: plan.text, marginBottom: 4 }}>{plan.price}</div>
              <div style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: 16, marginBottom: 8 }}>{plan.desc}</div>
              <div style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 12, padding: '2px 14px', fontWeight: 600, fontSize: 15, display: 'inline-block', marginBottom: 16 }}>{plan.badge}</div>
              <ul style={{ color: '#7c3aed', fontSize: 15, paddingLeft: 18, margin: 0, marginBottom: 18 }}>
                {plan.features.map((f, i) => <li key={i} style={{ marginBottom: 4, listStyle: 'none', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: 6 }}>✔️</span>{f}</li>)}
              </ul>
              <button style={{ marginTop: 8, background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 24, padding: '10px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #ede9fe' }}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action & Footer */}
      <section style={{ background: 'linear-gradient(90deg, #a78bfa 0%, #c4b5fd 100%)', padding: '64px 0 32px 0', textAlign: 'center', color: '#fff', marginTop: 32 }}>
        <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 16 }}>Ready to Start Your Design Journey?</h2>
        <div style={{ fontSize: 22, marginBottom: 32 }}>Join our platform with secure authentication, flexible plans, and professional tools.<br />Start with our free plan and upgrade when you're ready.</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
          <button style={{ background: '#fff', color: '#7c3aed', border: 'none', borderRadius: 16, padding: '16px 38px', fontWeight: 700, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🧑‍💼</span> Create Free Account
          </button>
          <button style={{ background: '#ede9fe', color: '#a78bfa', border: 'none', borderRadius: 16, padding: '16px 38px', fontWeight: 700, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚙️</span> View Admin Features
      </button>
        </div>
        {/* Footer */}
        <footer style={{ background: 'transparent', color: '#fff', fontSize: 17, textAlign: 'center', padding: '32px 0 0 0', marginTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 800, fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 30 }}>🎨</span> Wall Designer Pro</div>
              <div style={{ color: '#ede9fe', fontSize: 16, marginBottom: 8 }}>Professional wall design platform with enterprise features, user management, and collaboration tools.</div>
            </div>
            <div style={{ minWidth: 140 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Features</div>
              <div style={{ color: '#ede9fe', fontSize: 16 }}>Wall Designer<br />Draft Management<br />User Authentication<br />Admin Dashboard</div>
            </div>
            <div style={{ minWidth: 140 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Plans</div>
              <div style={{ color: '#ede9fe', fontSize: 16 }}>Basic (Free)<br />Pro ($9.99/mo)<br />Pro Max ($19.99/mo)<br />Upgrade Requests</div>
            </div>
            <div style={{ minWidth: 140 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Support</div>
              <div style={{ color: '#ede9fe', fontSize: 16 }}>Help Center<br />Contact Support<br />Email Notifications<br />System Status</div>
            </div>
          </div>
          <div style={{ color: '#ede9fe', fontSize: 15, marginTop: 16 }}>&copy; 2025 Wall Designer Tool. All rights reserved.</div>
        </footer>
      </section>
    </div>
  );
}

export default LandingPage; 
