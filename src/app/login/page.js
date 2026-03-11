"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DS = {
  colors: {
    bg: "#0A0D0F",
    surface: "#111518",
    surfaceElevated: "#161C20",
    surfaceBorder: "#1E2830",
    accent: "#4E9B6F",
    accentSoft: "#3A7356",
    accentGlow: "rgba(78,155,111,0.15)",
    accentDim: "rgba(78,155,111,0.08)",
    brand: "#4E9B6F",
    gold: "#C9A84C",
    goldSoft: "rgba(201,168,76,0.15)",
    text: "#E8EDF0",
    textMuted: "#6B8090",
    textDim: "#3E5060",
    danger: "#E05A5A",
    warn: "#D4914A",
    info: "#4A8FD4",
    border: "#1E2830"
  },
  fonts: {
    title: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 },
    body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
    label: { fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: "12px", fontWeight: 500 }
  },
  radius: { sm: "6px", md: "10px", lg: "16px", xl: "24px", full: "9999px" },
  shadow: {
    sm: "0 2px 8px rgba(0,0,0,0.4)",
    md: "0 4px 24px rgba(0,0,0,0.5)",
    xl: "0 8px 48px rgba(0,0,0,0.6)"
  }
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${DS.colors.bg}; color: ${DS.colors.text}; font-family: ${DS.fonts.body.fontFamily}; }
    @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
);

const Btn = ({ children, variant = "default", onClick, style = {}, disabled, loading }) => {
  const [hov, setHov] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
        fontWeight: 500, transition: "all 0.2s", cursor: (disabled || loading) ? "not-allowed" : "pointer",
        opacity: (disabled || loading) ? 0.6 : 1,
        background: isPrimary ? (hov ? DS.colors.accentSoft : DS.colors.accent) : (hov ? DS.colors.surfaceElevated : DS.colors.surface),
        border: isPrimary ? "none" : `1px solid ${hov ? DS.colors.accent : DS.colors.surfaceBorder}`,
        color: isPrimary ? "#fff" : DS.colors.text,
        padding: "8px 18px", borderRadius: DS.radius.md, fontSize: "14px",
        fontFamily: DS.fonts.body.fontFamily,
        ...style
      }}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
};

const Icon = ({ name, size = 16, color }) => {
  const icons = {
    Lock: "M12 2C9.24 2 7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v3H9V7c0-1.66 1.34-3 3-3zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
    AlertCircle: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color || "currentColor"}>
      {icons[name] && <path d={icons[name]} />}
    </svg>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: DS.colors.bg,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${DS.colors.brand}15 0%, transparent 70%)`
      }}>
        <div style={{
          width: "100%",
          maxWidth: "400px",
          padding: "40px",
          background: DS.colors.surface,
          borderRadius: DS.radius.xl,
          border: `1px solid ${DS.colors.border}`,
          boxShadow: DS.shadow.xl,
          animation: "slide-up 0.5s ease-out"
        }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              width: "60px",
              height: "60px",
              background: `${DS.colors.brand}20`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              border: `1px solid ${DS.colors.brand}40`
            }}>
              <Icon name="Lock" size={24} color={DS.colors.brand} />
            </div>
            <h1 style={{ ...DS.fonts.title, fontSize: "24px", color: DS.colors.text }}>Arboris Admin</h1>
            <p style={{ ...DS.fonts.body, color: DS.colors.textMuted, marginTop: "8px" }}>Sign in to manage your lineage</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ ...DS.fonts.label, color: DS.colors.textMuted }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@arboris.com"
                style={{
                  padding: "12px 16px",
                  background: DS.colors.bg,
                  border: `1px solid ${DS.colors.border}`,
                  borderRadius: DS.radius.md,
                  color: DS.colors.text,
                  outline: "none",
                  ...DS.fonts.body
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ ...DS.fonts.label, color: DS.colors.textMuted }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  padding: "12px 16px",
                  background: DS.colors.bg,
                  border: `1px solid ${DS.colors.border}`,
                  borderRadius: DS.radius.md,
                  color: DS.colors.text,
                  outline: "none",
                  ...DS.fonts.body
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px",
                background: "#ff4d4d20",
                border: "1px solid #ff4d4d40",
                borderRadius: DS.radius.md,
                color: "#ff8080",
                fontSize: "14px",
                display: "flex",
                gap: "8px",
                alignItems: "center"
              }}>
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            <Btn variant="primary" loading={loading} style={{ width: "100%", height: "48px", marginTop: "12px" }}>
              Enter Archives
            </Btn>
          </form>
          
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button 
              onClick={() => router.push("/")}
              style={{
                background: "none",
                border: "none",
                color: DS.colors.textMuted,
                cursor: "pointer",
                ...DS.fonts.label,
                textDecoration: "underline"
              }}
            >
              Back to Tree
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
