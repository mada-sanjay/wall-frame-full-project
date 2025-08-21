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

  const handleStartDesigning = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate("/walldesigner");
    } else {
      // Show login prompt or navigate to login with redirect parameter
      navigate("/login?redirect=/walldesigner");
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ 
      fontFamily: "Segoe UI, Arial, sans-serif", 
      background: isDarkMode ? 
        "linear-gradient(135deg, #1e3a8a 0%, #3730a3 25%, #4338ca 50%, #6366f1 75%, #8b5cf6 100%)" : 
        "linear-gradient(135deg, #1e3a8a 0%, #3730a3 25%, #4338ca 50%, #6366f1 75%, #8b5cf6 100%)", 
      minHeight: "100vh" 
    }}>
      {/* Header Navigation */}
      <header style={{
        background: "rgba(30, 58, 138, 0.15)",
        backdropFilter: "blur(10px)",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        {/* Logo and Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            background: "#3b82f6",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              background: "#ffffff",
              borderRadius: "50%",
              position: "absolute",
              top: "6px",
              left: "6px"
            }}></div>
            <div style={{
              width: "6px",
              height: "6px",
              background: "#ffffff",
              borderRadius: "50%",
              position: "absolute",
              top: "8px",
              right: "8px"
            }}></div>
            <div style={{
              width: "4px",
              height: "4px",
              background: "#ffffff",
              borderRadius: "50%",
              position: "absolute",
              bottom: "8px",
              left: "10px"
            }}></div>
          </div>
          <span style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#ffffff"
          }}>
            WallCraft
          </span>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <button onClick={() => scrollToSection('features')} style={{
            color: "rgba(255, 255, 255, 0.9)",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "500",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s ease"
          }}>
            Features
          </button>
          <button onClick={() => scrollToSection('pricing')} style={{
            color: "rgba(255, 255, 255, 0.9)",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "500",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s ease"
          }}>
            Pricing
          </button>
          <button onClick={() => scrollToSection('how-it-works')} style={{
            color: "rgba(255, 255, 255, 0.9)",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "500",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s ease"
          }}>
            How it Works
          </button>
          <button onClick={() => navigate("/login")} style={{
            background: "transparent",
            color: "rgba(255, 255, 255, 0.9)",
            border: "none",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "color 0.2s ease"
          }}>
            Login
          </button>
          <button onClick={() => navigate("/register")} style={{
            background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)"
          }}>
            Sign Up
          </button>
        </nav>
      </header>



      {/* Hero Section */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "48px 0 32px 0" }}>
        <div style={{ background: "rgba(255, 255, 255, 0.1)", color: "#ffffff", fontWeight: 600, fontSize: 18, borderRadius: 24, boxShadow: "0 2px 16px rgba(0, 0, 0, 0.1)", padding: "10px 32px", marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10, border: "1px solid rgba(255, 255, 255, 0.2)" }}>
          <span style={{ fontSize: 22 }}>✨</span> Professional Wall Design Platform
        </div>
        <h1 style={{ fontSize: 64, fontWeight: 900, color: "#ffffff", margin: 0, textAlign: 'center', letterSpacing: 1 }}>Design Your <span style={{ background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Dream Wall</span></h1>
        <div style={{ fontSize: 22, color: "rgba(255, 255, 255, 0.9)", margin: "32px 0 40px 0", textAlign: 'center', maxWidth: 700 }}>
          Create stunning wall art compositions with our intuitive designer. Upload your images, apply beautiful frames, and bring your vision to life.
        </div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 32 }}>
          <button onClick={handleStartDesigning}
            style={{ background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)", color: "#fff", fontWeight: 700, fontSize: 20, border: 'none', borderRadius: 12, padding: "16px 38px", cursor: "pointer", display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)' }}>
            Start Designing <span style={{ fontSize: 22 }}>→</span>
          </button>
          <button onClick={() => scrollToSection('features')}
            style={{ background: "rgba(255, 255, 255, 0.1)", color: "#ffffff", fontWeight: 700, fontSize: 20, border: '1.5px solid rgba(255, 255, 255, 0.3)', borderRadius: 12, padding: "16px 38px", cursor: "pointer", display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', backdropFilter: "blur(10px)" }}>
            Watch Demo
          </button>
        </div>
        <div style={{ display: 'flex', gap: 32, marginTop: 24, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: 18 }}>
          <span><span style={{ fontSize: 20 }}>✔️</span> No Credit Card Required</span>
          <span><span style={{ fontSize: 20 }}>✔️</span> Instant Setup</span>
          <span><span style={{ fontSize: 20 }}>✔️</span> Professional Results</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 48, fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>Powerful Features</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', fontSize: 20, marginBottom: 60, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Everything you need to create professional wall designs with enterprise-grade features and tools.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {[
              { icon: '🎨', title: 'Advanced Design Tools', desc: 'Professional-grade design tools with drag-and-drop functionality' },
              { icon: '💾', title: 'Draft Management', desc: 'Save, load, and manage your design drafts with ease' },
              { icon: '🔐', title: 'Secure Authentication', desc: 'Enterprise-grade security with user authentication and authorization' },
              { icon: '📱', title: 'Responsive Design', desc: 'Works perfectly on desktop, tablet, and mobile devices' },
              { icon: '🎯', title: 'Subscription Plans', desc: 'Flexible plans from free to premium with advanced features' },
              { icon: '👥', title: 'Collaboration', desc: 'Share designs and collaborate with team members seamlessly' }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '32px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                textAlign: 'center',
                transition: 'transform 0.2s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>{feature.title}</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', lineHeight: '1.6' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ background: 'rgba(0, 0, 0, 0.1)', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 48, fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>Simple Pricing</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', fontSize: 20, marginBottom: 60, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Choose the perfect plan for your design needs. Start free and upgrade when you're ready.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {[
              { name: 'Basic', price: 'Free', features: ['Basic design tools', '5 draft saves', 'Standard templates', 'Community support'] },
              { name: 'Pro', price: '$9.99/month', features: ['Advanced tools', 'Unlimited drafts', 'Premium templates', 'Priority support', 'Export options'] },
              { name: 'Pro Max', price: '$19.99/month', features: ['Everything in Pro', 'Team collaboration', 'Custom templates', 'API access', 'White-label options'] }
            ].map((plan, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '40px 32px',
                borderRadius: '16px',
                border: index === 1 ? '2px solid #f97316' : '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center',
                position: 'relative',
                backdropFilter: 'blur(10px)'
              }}>
                {index === 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                    color: '#ffffff',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Most Popular
        </div>
                )}
                <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>{plan.name}</h3>
                <div style={{ fontSize: '48px', fontWeight: '900', color: '#f97316', marginBottom: '24px' }}>{plan.price}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} style={{
                      padding: '8px 0',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
                      {feature}
                    </li>
                  ))}
              </ul>
                <button style={{
                  background: index === 1 ? 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' : 'transparent',
                  color: '#ffffff',
                  border: `2px solid ${index === 1 ? 'transparent' : '#f97316'}`,
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '24px',
                  transition: 'all 0.2s ease'
                }}>
                  {index === 0 ? 'Get Started' : 'Choose Plan'}
                </button>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 48, fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>How It Works</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', fontSize: 20, marginBottom: 60, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Get started with WallCraft in just a few simple steps. Create stunning designs in minutes.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
            {[
              { step: '1', icon: '👤', title: 'Sign Up', desc: 'Create your account in seconds with our simple registration process' },
              { step: '2', icon: '🎨', title: 'Start Designing', desc: 'Choose from our templates or start with a blank canvas' },
              { step: '3', icon: '💾', title: 'Save & Share', desc: 'Save your designs and share them with your team or clients' }
            ].map((item, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 auto 24px'
                }}>
                  {item.step}
        </div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage; 
