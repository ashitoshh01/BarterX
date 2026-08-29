import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogoWordmark } from "@/components/Logo";
import {
  ArrowRight,
  Shield,
  MessageCircle,
  Star,
  CheckCircle,
  Globe,
  PlusSquare,
  Search,
  ArrowLeftRight,
  Menu,
  X,
  Twitter,
  Instagram,
  Youtube,
  Mail,
} from "lucide-react";

/* ── Landing page — clean, minimal, light SaaS aesthetic ── */

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (id === '#') {
      const rootEl = document.getElementById('root') || document.documentElement;
      rootEl.scrollTo({ top: 0, behavior: 'smooth' });
      setMobileMenuOpen(false);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  /* Override global dark theme while Landing is mounted */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    // Save originals
    const origHtmlBg = html.style.background;
    const origBodyBg = body.style.background;
    const origBodyColor = body.style.color;
    const origRootBg = root?.style.background;

    // Apply light overrides
    html.style.background = "#ffffff";
    body.style.background = "#ffffff";
    body.style.color = "#1a1a1a";
    if (root) root.style.background = "#ffffff";

    return () => {
      html.style.background = origHtmlBg;
      body.style.background = origBodyBg;
      body.style.color = origBodyColor;
      if (root) root.style.background = origRootBg;
    };
  }, []);

  return (
    <div
      className="landing-page"
      style={{
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#1a1a1a",
        background: "#ffffff",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* ═══════════ NAVBAR ═══════════ */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <nav
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none" }}>
            <LogoWordmark size="text-2xl" markSize={32} />
          </Link>

          {/* Desktop Nav Links */}
          <div
            className="landing-nav-links"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
            }}
          >
            <a href="#how" onClick={(e) => handleScrollTo(e, 'how')} style={navLinkStyle}>
              How it works
            </a>
            <a href="#explore" onClick={(e) => handleScrollTo(e, 'explore')} style={navLinkStyle}>
              Explore
            </a>
            <a href="#faq" onClick={(e) => handleScrollTo(e, 'faq')} style={navLinkStyle}>
              FAQ
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div
            className="landing-nav-auth"
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <Link
              to="/auth"
              style={{
                ...navLinkStyle,
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
            <Link to="/auth" style={{ textDecoration: "none" }}>
              <button style={primaryBtnStyle}>
                Get started <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="landing-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#1a1a1a",
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu (Overlapping Overlay & Sticky/Fixed) */}
        {mobileMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              width: "100%",
              maxHeight: "calc(100vh - 72px)",
              overflowY: "auto",
              background: "#ffffff",
              borderTop: "1px solid #f0f0f0",
              borderBottom: "1px solid #e8e8e8",
              padding: "20px 24px 24px",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15)",
              zIndex: 1000,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <a
                href="#how"
                onClick={(e) => handleScrollTo(e, 'how')}
                style={{ ...navLinkStyle, fontSize: 16 }}
              >
                How it works
              </a>
              <a
                href="#explore"
                onClick={(e) => handleScrollTo(e, 'explore')}
                style={{ ...navLinkStyle, fontSize: 16 }}
              >
                Explore
              </a>
              <a
                href="#faq"
                onClick={(e) => handleScrollTo(e, 'faq')}
                style={{ ...navLinkStyle, fontSize: 16 }}
              >
                FAQ
              </a>
              <div
                style={{
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ ...navLinkStyle, fontSize: 16 }}
                >
                  Sign in
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  <button style={{ ...primaryBtnStyle, width: "100%" }}>
                    Get started <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "120px 24px 60px",
        }}
      >
        <div
          className="landing-hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 60,
            alignItems: "center",
          }}
        >
          {/* Hero Left */}
          <div>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#f0ffc0",
                border: "1px solid #d4f000",
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 600,
                color: "#5a6600",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                marginBottom: 32,
              }}
            >
              Trade without money
            </div>

            <h1
              style={{
                fontSize: "clamp(40px, 5vw, 64px)",
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              Trade what
              <br />
              you have.
              <br />
              <span
                style={{
                  fontFamily: '"Instrument Serif", Georgia, serif',
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#888",
                }}
              >
                Get what you{" "}
                <span
                  style={{
                    fontFamily: '"Instrument Serif", Georgia, serif',
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#888",
                  }}
                >
                  want.
                </span>
              </span>
            </h1>

            <p
              style={{
                marginTop: 24,
                fontSize: 17,
                lineHeight: 1.65,
                color: "#666",
                maxWidth: 460,
                fontWeight: 400,
              }}
            >
              Exchange products, skills and services with people around you —
              without using money.
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                marginTop: 36,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <button style={{ ...primaryBtnStyle, padding: "14px 28px", fontSize: 15 }}>
                  Get started <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              </Link>
              <Link to="/app/explore" style={{ textDecoration: "none" }}>
                <button style={secondaryBtnStyle}>Explore swaps</button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div
              style={{
                marginTop: 40,
                display: "flex",
                alignItems: "center",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              {[
                { icon: <Shield size={15} strokeWidth={2} />, text: "Secure & trusted" },
                { icon: <MessageCircle size={15} strokeWidth={2} />, text: "Built-in chat" },
                { icon: <Globe size={15} strokeWidth={2} />, text: "Local & global" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#888",
                    fontWeight: 450,
                  }}
                >
                  <span style={{ color: "#999" }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Right — Product Mockup */}
          <div
            className="landing-hero-mockup"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 560,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow:
                  "0 25px 80px -12px rgba(0,0,0,0.12), 0 8px 24px -8px rgba(0,0,0,0.08)",
                border: "1px solid #e8e8e8",
                background: "#fff",
              }}
            >
              <img
                src="/product-mockup.png"
                alt="Baarter marketplace interface"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section
        id="how"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 24px",
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: 16,
            }}
          >
            How it works
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#1a1a1a",
              margin: 0,
            }}
          >
            Three simple steps
          </h2>
          <p
            style={{
              marginTop: 12,
              fontSize: 16,
              color: "#888",
              fontWeight: 400,
            }}
          >
            List, match and trade in minutes.
          </p>
        </div>

        {/* Steps */}
        <div
          className="landing-steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 40,
          }}
        >
          {[
            {
              num: "01",
              icon: <PlusSquare size={22} strokeWidth={1.5} />,
              title: "List what you have",
              desc: "Add the items, skills or services you're willing to trade.",
            },
            {
              num: "02",
              icon: <Star size={22} strokeWidth={1.5} />,
              title: "Find a match",
              desc: "Our smart matching helps you find the right people nearby.",
            },
            {
              num: "03",
              icon: <ArrowLeftRight size={22} strokeWidth={1.5} />,
              title: "Trade & enjoy the swap",
              desc: "Chat, agree and exchange. It's that simple.",
            },
          ].map((step, i) => (
            <div key={i}>
              {/* Step Number */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#ccc",
                  marginBottom: 16,
                }}
              >
                {step.num}
              </div>

              {/* Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: "1px solid #e8e8e8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                  marginBottom: 20,
                }}
              >
                {step.icon}
              </div>

              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.02em",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#888",
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {step.desc}
              </p>

              {/* Connector line between steps (not after last) */}
              {i < 2 && (
                <div
                  className="landing-step-connector"
                  style={{
                    marginTop: 24,
                    height: 1,
                    background:
                      "linear-gradient(90deg, #e0e0e0 0%, #e0e0e0 60%, transparent 100%)",
                    width: "80%",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ BENEFITS ═══════════ */}
      <section
        id="explore"
        style={{
          background: "#fafafa",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 3.5vw, 42px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              Why traders love Baarter
            </h2>
          </div>

          <div
            className="landing-benefits-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 40,
            }}
          >
            {[
              {
                icon: <CheckCircle size={28} strokeWidth={1.5} />,
                iconColor: "#5cb85c",
                iconBg: "#edf7ed",
                title: "No money required",
                desc: "Trade without cash. Save and get more.",
              },
              {
                icon: <Search size={28} strokeWidth={1.5} />,
                iconColor: "#C8F000",
                iconBg: "#f5ffc0",
                title: "Better matches",
                desc: "AI-powered matching finds what truly fits you.",
              },
              {
                icon: <MessageCircle size={28} strokeWidth={1.5} />,
                iconColor: "#888",
                iconBg: "#f2f2f2",
                title: "Built-in chat",
                desc: "Discuss, negotiate and coordinate in-app.",
              },
              {
                icon: <Shield size={28} strokeWidth={1.5} />,
                iconColor: "#5cb85c",
                iconBg: "#edf7ed",
                title: "Trusted community",
                desc: "Profiles, reviews and trust scores keep it real.",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: benefit.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: benefit.iconColor,
                    margin: "0 auto 20px",
                  }}
                >
                  {benefit.icon}
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#1a1a1a",
                    margin: "0 0 8px 0",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {benefit.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#888",
                    margin: 0,
                    fontWeight: 400,
                  }}
                >
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#C8F000",
            marginBottom: 16,
          }}
        >
          Ready to trade?
        </div>
        <h2
          style={{
            fontSize: "clamp(28px, 3.5vw, 42px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#1a1a1a",
            margin: "0 0 16px 0",
          }}
        >
          Join thousands of smart traders.
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "#888",
            marginBottom: 32,
            fontWeight: 400,
          }}
        >
          List your first item and start swapping today.
        </p>
        <Link to="/auth" style={{ textDecoration: "none" }}>
          <button
            style={{
              ...primaryBtnStyle,
              padding: "14px 32px",
              fontSize: 15,
            }}
          >
            Get started <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </Link>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer
        style={{
          borderTop: "1px solid #eee",
          padding: "60px 24px 24px",
          background: "#fff",
        }}
      >
        <div
          className="landing-footer-grid"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
            gap: 40,
          }}
        >
          {/* Brand */}
          <div className="landing-footer-brand">
            <div style={{ marginBottom: 12 }}>
              <LogoWordmark size="text-2xl" markSize={32} />
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "#999",
                maxWidth: 240,
                margin: 0,
              }}
            >
              The modern marketplace to exchange products, skills and services
              without money.
            </p>
          </div>

          {/* PRODUCT */}
          <div>
            <div style={footerHeadingStyle}>PRODUCT</div>
            <ul style={footerListStyle}>
              <li>
                <a href="#explore" onClick={(e) => handleScrollTo(e, 'explore')} style={footerLinkStyle}>
                  Explore
                </a>
              </li>
              <li>
                <a href="#how" onClick={(e) => handleScrollTo(e, 'how')} style={footerLinkStyle}>
                  How it works
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  Matching
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  Safety
                </a>
              </li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <div style={footerHeadingStyle}>COMPANY</div>
            <ul style={footerListStyle}>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  About
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  Blog
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  Careers
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <div style={footerHeadingStyle}>LEGAL</div>
            <ul style={footerListStyle}>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  Terms
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleScrollTo(e, '#')} style={footerLinkStyle}>
                  Community Guidelines
                </a>
              </li>
            </ul>
          </div>

          {/* FOLLOW US */}
          <div>
            <div style={footerHeadingStyle}>FOLLOW US</div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {[
                { icon: <Twitter size={18} />, label: "Twitter" },
                { icon: <Instagram size={18} />, label: "Instagram" },
                { icon: <Youtube size={18} />, label: "YouTube" },
                { icon: <Mail size={18} />, label: "Email" },
              ].map((social, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={social.label}
                  style={{
                    color: "#999",
                    transition: "color 0.2s",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            maxWidth: 1200,
            margin: "48px auto 0",
            borderTop: "1px solid #eee",
            paddingTop: 20,
            textAlign: "center",
            fontSize: 12,
            color: "#bbb",
            fontWeight: 400,
          }}
        >
          © 2025 Baarter. All rights reserved.
        </div>
      </footer>

      {/* ═══════════ RESPONSIVE STYLES (injected as <style>) ═══════════ */}
      <style>{`
        /* Import Inter for the landing page */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');

        /* Reset landing page from the dark global styles */
        .landing-page,
        .landing-page * {
          box-sizing: border-box;
          border-color: #e8e8e8;
        }
        .landing-page {
          /* Override global dark styles */
          color: #1a1a1a !important;
          background: #ffffff !important;
        }
        .landing-page h1,
        .landing-page h2,
        .landing-page h3,
        .landing-page h4,
        .landing-page h5,
        .landing-page h6 {
          color: #1a1a1a !important;
        }

        /* Smooth scroll */
        html, body, #root {
          scroll-behavior: smooth;
          scroll-padding-top: 72px;
        }

        /* Nav link hover */
        .landing-page a:hover {
          color: #1a1a1a;
        }

        /* Mobile responsive */
        @media (max-width: 900px) {
          .landing-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .landing-hero-mockup {
            order: 2;
          }
          .landing-steps-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .landing-step-connector {
            display: none !important;
          }
          .landing-benefits-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px !important;
          }
          .landing-footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px 24px !important;
          }
          .landing-footer-brand {
            grid-column: 1 / -1 !important;
          }
          .landing-nav-links {
            display: none !important;
          }
          .landing-nav-auth {
            display: none !important;
          }
          .landing-hamburger {
            display: flex !important;
          }
        }

        @media (max-width: 600px) {
          .landing-benefits-grid {
            grid-template-columns: 1fr !important;
          }
          .landing-footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px 20px !important;
          }
          .landing-footer-brand {
            grid-column: 1 / -1 !important;
          }
        }

        @media (min-width: 901px) {
          .landing-hamburger {
            display: none !important;
          }
        }

        /* Button hover effects */
        .landing-page button {
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .landing-page button:hover {
          transform: translateY(-1px);
        }
        .landing-page button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

/* ── Shared inline styles ── */

const navLinkStyle = {
  textDecoration: "none",
  color: "#666",
  fontSize: 14,
  fontWeight: 450,
  letterSpacing: "-0.005em",
  transition: "color 0.2s",
  cursor: "pointer",
};

const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 600,
  color: "#1a1a1a",
  background: "#C8F000",
  border: "none",
  borderRadius: 999,
  cursor: "pointer",
  letterSpacing: "-0.005em",
  fontFamily: '"Inter", sans-serif',
  transition: "all 0.15s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const secondaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 600,
  color: "#1a1a1a",
  background: "#ffffff",
  border: "1.5px solid #e0e0e0",
  borderRadius: 999,
  cursor: "pointer",
  letterSpacing: "-0.005em",
  fontFamily: '"Inter", sans-serif',
  transition: "all 0.15s ease",
};

const footerHeadingStyle = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#999",
  marginBottom: 16,
};

const footerListStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const footerLinkStyle = {
  textDecoration: "none",
  color: "#666",
  fontSize: 13,
  fontWeight: 400,
  transition: "color 0.2s",
};

export default Landing;
