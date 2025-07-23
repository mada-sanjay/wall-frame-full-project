import React from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  // Dummy gallery images (replace with your own)
  const galleryImages = [
    "/gallery1.jpg",
    "/gallery2.jpg",
    "/gallery3.jpg"
  ];

  return (
    <div style={{ fontFamily: "Segoe UI, Arial, sans-serif", background: "#f9fbe7" }}>
      {/* Hero Section */}
      <section style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "60vh", background: "linear-gradient(135deg, #e3f2fd 0%, #fce4ec 100%)", padding: "48px 0"
      }}>
        <h1 style={{ fontSize: 40, color: "#af4261", fontWeight: 800, marginBottom: 12 }}>Design Your Dream Walls in Minutes</h1>
        <p style={{ fontSize: 20, color: "#555", maxWidth: 540, textAlign: "center", marginBottom: 32 }}>
          Create custom wall designs using our intuitive online designer. Perfect for homes, offices, and creative spaces.
        </p>
        <button
          className="cta-button"
          style={{
            background: "linear-gradient(90deg, #b3e5fc 0%, #f8bbd0 100%)",
            color: "#af4261",
            fontWeight: 700,
            fontSize: 20,
            border: "none",
            borderRadius: 10,
            padding: "16px 40px",
            cursor: "pointer",
            marginBottom: 32
          }}
          onClick={() => navigate("/walldesigner")}
        >
          Start Designing
        </button>
        <img src="/hero-wall-design.png" alt="Preview of wall designer tool" style={{ width: 340, borderRadius: 18, boxShadow: "0 4px 24px #e3f2fd" }} />
      </section>

      {/* How It Works Section */}
      <section style={{ padding: "48px 0", background: "#fff" }}>
        <h2 style={{ textAlign: "center", color: "#1976d2", fontWeight: 700, marginBottom: 32 }}>How It Works</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            { title: "1. Choose a Wall", desc: "Upload a photo or select from our templates." },
            { title: "2. Add Elements", desc: "Drag and drop paint colors, wallpapers, or art pieces." },
            { title: "3. Customize", desc: "Adjust scale, lighting, and layout." },
            { title: "4. Save & Share", desc: "Download your design or share with clients/friends." }
          ].map((step, idx) => (
            <div key={idx} style={{
              background: "#f9fbe7", borderRadius: 14, padding: 24, minWidth: 180, maxWidth: 220,
              boxShadow: "0 1px 4px #e3f2fd", textAlign: "center"
            }}>
              <h3 style={{ color: "#af4261", fontWeight: 700 }}>{step.title}</h3>
              <p style={{ color: "#555", fontSize: 15 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "48px 0", background: "#fce4ec" }}>
        <h2 style={{ textAlign: "center", color: "#af4261", fontWeight: 700, marginBottom: 24 }}>Features You’ll Love</h2>
        <ul style={{ listStyle: "none", padding: 0, maxWidth: 500, margin: "0 auto", color: "#555", fontSize: 18 }}>
          <li>✅ Real-time wall preview</li>
          <li>✅ Upload custom photos</li>
          <li>✅ Wide range of materials & textures</li>
          <li>✅ Easy drag & drop editor</li>
          <li>✅ Works on desktop & mobile</li>
        </ul>
      </section>

      {/* Gallery Section */}
      <section style={{ padding: "48px 0", background: "#fff" }}>
        <h2 style={{ textAlign: "center", color: "#1976d2", fontWeight: 700, marginBottom: 32 }}>Get Inspired</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {galleryImages.map((src, idx) => (
            <img key={idx} src={src} alt={`Gallery ${idx + 1}`} style={{
              width: 220, height: 140, objectFit: "cover", borderRadius: 12, boxShadow: "0 2px 8px #e3f2fd"
            }} />
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ padding: "48px 0", background: "#f9fbe7" }}>
        <h2 style={{ textAlign: "center", color: "#af4261", fontWeight: 700, marginBottom: 24 }}>What Our Users Say</h2>
        <blockquote style={{
          maxWidth: 500, margin: "0 auto 24px auto", fontSize: 18, color: "#555", background: "#fff",
          borderLeft: "6px solid #af4261", padding: "18px 24px", borderRadius: 10
        }}>
          "The easiest tool I’ve used to visualize wall changes. My clients love it!"<br /><span style={{ color: "#af4261" }}>– Interior Designer Sarah T.</span>
        </blockquote>
        <blockquote style={{
          maxWidth: 500, margin: "0 auto", fontSize: 18, color: "#555", background: "#fff",
          borderLeft: "6px solid #1976d2", padding: "18px 24px", borderRadius: 10
        }}>
          "Helped me pick the perfect wallpaper before buying. So cool!"<br /><span style={{ color: "#1976d2" }}>– Homeowner Mike R.</span>
        </blockquote>
      </section>

      {/* Call to Action (Repeat) */}
      <section style={{ padding: "48px 0", background: "#fce4ec", textAlign: "center" }}>
        <h2 style={{ color: "#af4261", fontWeight: 700, marginBottom: 24 }}>Ready to Design Your Walls?</h2>
        <button
          className="cta-button"
          style={{
            background: "linear-gradient(90deg, #b3e5fc 0%, #f8bbd0 100%)",
            color: "#af4261",
            fontWeight: 700,
            fontSize: 20,
            border: "none",
            borderRadius: 10,
            padding: "16px 40px",
            cursor: "pointer"
          }}
          onClick={() => navigate("/walldesigner")}
        >
          Launch the Wall Designer
      </button>
      </section>

      {/* Footer */}
      <footer style={{
        background: "#fff", color: "#888", fontSize: 15, textAlign: "center", padding: "24px 0", marginTop: 0
      }}>
        <p>&copy; 2025 Wall Designer Tool. All rights reserved.</p>
        <nav>
          <a href="/privacy" style={{ color: "#af4261", textDecoration: "underline", margin: "0 8px" }}>Privacy</a> |
          <a href="/terms" style={{ color: "#af4261", textDecoration: "underline", margin: "0 8px" }}>Terms</a> |
          <a href="/contact" style={{ color: "#af4261", textDecoration: "underline", margin: "0 8px" }}>Contact</a>
        </nav>
      </footer>
    </div>
  );
}

export default LandingPage; 
