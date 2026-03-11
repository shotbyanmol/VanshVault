"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   VANSH·VAULT  —  Cosmic Family Heritage
   
   KEY FEATURES:
   ① Top-center filter bar (no left panel)
   ② Mizar–Alcor binary star view on node select:
      Primary star (person) + companion star (spouse) orbiting each other
      like Earth–Moon close planetary view
   ③ Lineage modal — scrollable ancestry chain root→selected
   ④ Edit modal — full editable form overlay
   ⑤ Pure Galaxy cosmos canvas
═══════════════════════════════════════════════════════════════════ */

// ── PALETTE ────────────────────────────────────────────────────────
const C = {
  void:      "#02010A",
  deep:      "#05030F",
  cosmos:    "#080518",
  nebula:    "#0C0820",
  // Strand colors
  paternal:  "#5B9CF6",   // cool stellar blue — male
  maternal:  "#F472B6",   // warm rose — female
  union:     "#A78BFA",   // violet — the bond
  unionGlow: "rgba(167,139,250,0.3)",

  // Cosmic accents
  gold:      "#F0C040",
  goldGlow:  "rgba(240,192,64,0.25)",
  cyan:      "#22D3EE",
  cyanGlow:  "rgba(34,211,238,0.2)",
  amber:     "#FB923C",

  // Generation ring colors
  gen: ["#F0C040","#FB923C","#34D399","#60A5FA","#C084FC","#F472B6"],

  // Status
  living:    "#34D399",
  deceased:  "#374151",

  // Panels
  glass:     "rgba(5,3,15,0.88)",
  glassBorder:"rgba(91,156,246,0.18)",
  glassBorderHi:"rgba(167,139,250,0.4)",
  chip:      "rgba(255,255,255,0.05)",
  chipBorder:"rgba(255,255,255,0.09)",

  // Text
  ink:       "#F1ECE4",
  inkMid:    "#8B7DA8",
  inkDim:    "#3D3355",
  inkFaint:  "#1A1428",
};

const F = {
  display: "'Cinzel Decorative', 'Cinzel', serif",
  serif:   "'Cormorant Garamond', Georgia, serif",
  body:    "'Outfit', system-ui, sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ── DATA ───────────────────────────────────────────────────────────
// DATA NORMALIZATION
const FEMALE_ROLE_HINTS = ["daughter", "mother", "matriarch", "female", "wife", "granddaughter", "sister"];
const MALE_ROLE_HINTS = ["son", "father", "patriarch", "male", "husband", "grandson", "brother"];

const inferGenderFromRole = (role = "") => {
  const lower = String(role || "").toLowerCase();
  if (FEMALE_ROLE_HINTS.some((hint) => lower.includes(hint))) return "F";
  if (MALE_ROLE_HINTS.some((hint) => lower.includes(hint))) return "M";
  return "M";
};

const normalizeGender = (gender, role = "") => {
  const value = String(gender || "").trim().toUpperCase();
  if (["F", "FEMALE", "WOMAN"].includes(value)) return "F";
  if (["M", "MALE", "MAN"].includes(value)) return "M";
  return inferGenderFromRole(role);
};

const toDisplayName = (member) => {
  const byParts = [member?.firstName, member?.lastName].filter(Boolean).join(" ").trim();
  return byParts || member?.name || "Unknown Member";
};

const splitDisplayName = (name, fallbackFirst = "", fallbackLast = "") => {
  const cleaned = String(name || "").trim();
  if (!cleaned) return { firstName: fallbackFirst || "Unknown", lastName: fallbackLast || "Member" };
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) return { firstName: tokens[0], lastName: fallbackLast || "" };
  return { firstName: tokens[0], lastName: tokens.slice(1).join(" ") };
};

const collectRawMembers = (node, result = []) => {
  if (!node?.id) return result;
  result.push(node);
  (node.children || []).forEach((child) => collectRawMembers(child, result));
  return result;
};

const convertToUiTree = (rawNode, rawById, parentId = null) => {
  const displayName = toDisplayName(rawNode);
  const parsedName = splitDisplayName(displayName, rawNode.firstName, rawNode.lastName);
  const spouseRaw = rawNode.spouseId ? rawById.get(rawNode.spouseId) : null;

  const uiNode = {
    id: rawNode.id,
    isSynthetic: false,
    firstName: parsedName.firstName,
    lastName: parsedName.lastName,
    name: displayName,
    born: rawNode.born || "",
    died: rawNode.died || "",
    gender: normalizeGender(rawNode.gender, rawNode.role),
    location: rawNode.location || rawNode.city || "",
    city: rawNode.city || "",
    country: rawNode.country || "",
    phone: rawNode.phone || "",
    email: rawNode.email || "",
    photo: rawNode.photo || "",
    role: rawNode.role || "Member",
    notes: rawNode.notes || "",
    generation: Number(rawNode.generation || 0),
    isActive: !rawNode.died,
    isComplete: rawNode.isComplete !== false,
    branch: rawNode.branch || "",
    parentId: rawNode.parentId || parentId || null,
    spouseId: rawNode.spouseId || null,
    spouse: spouseRaw
      ? {
          id: spouseRaw.id,
          name: toDisplayName(spouseRaw),
          born: spouseRaw.born || "",
          died: spouseRaw.died || "",
          gender: normalizeGender(spouseRaw.gender, spouseRaw.role),
        }
      : null,
    children: [],
  };

  uiNode.children = (rawNode.children || []).map((child) => convertToUiTree(child, rawById, uiNode.id));
  return uiNode;
};

const shiftGenerations = (node, delta) => ({
  ...node,
  generation: Math.max(0, Number(node.generation || 0) + delta),
  children: (node.children || []).map((child) => shiftGenerations(child, delta)),
});

const isSyntheticMember = (member) =>
  Boolean(member?.isSynthetic) || member?.id === "__vault_root__";

const yearOrInfinity = (value) => {
  if (value === null || value === undefined || value === "") return Number.POSITIVE_INFINITY;
  const match = String(value).match(/\d{3,4}/);
  if (!match) return Number.POSITIVE_INFINITY;
  const numericYear = Number(match[0]);
  return Number.isFinite(numericYear) ? numericYear : Number.POSITIVE_INFINITY;
};

const pickCanonicalSpouseRoot = (left, right) => {
  const leftChildren = (left.children || []).length;
  const rightChildren = (right.children || []).length;
  if (leftChildren !== rightChildren) return leftChildren > rightChildren ? left : right;

  const leftGeneration = Number(left.generation ?? Number.MAX_SAFE_INTEGER);
  const rightGeneration = Number(right.generation ?? Number.MAX_SAFE_INTEGER);
  if (leftGeneration !== rightGeneration) return leftGeneration < rightGeneration ? left : right;

  const leftBorn = yearOrInfinity(left.born);
  const rightBorn = yearOrInfinity(right.born);
  if (leftBorn !== rightBorn) return leftBorn < rightBorn ? left : right;

  const leftName = String(left.name || "").toLowerCase();
  const rightName = String(right.name || "").toLowerCase();
  if (leftName && rightName && leftName !== rightName) return leftName < rightName ? left : right;

  return String(left.id) < String(right.id) ? left : right;
};

const collapseSpousalRoots = (roots) => {
  if (roots.length <= 1) return roots;

  const byId = new Map(roots.map((root) => [root.id, root]));
  const removed = new Set();

  for (const root of roots) {
    if (removed.has(root.id)) continue;

    const spouseId = root.spouseId;
    if (!spouseId || !byId.has(spouseId)) continue;

    const spouseRoot = byId.get(spouseId);
    if (!spouseRoot || removed.has(spouseRoot.id)) continue;
    if (spouseRoot.spouseId !== root.id) continue;

    const keep = pickCanonicalSpouseRoot(root, spouseRoot);
    const drop = keep.id === root.id ? spouseRoot : root;

    const keepChildIds = new Set((keep.children || []).map((child) => child.id));
    (drop.children || []).forEach((child) => {
      if (!keepChildIds.has(child.id)) {
        keep.children.push(child);
        keepChildIds.add(child.id);
      }
    });

    removed.add(drop.id);
  }

  return roots.filter((root) => !removed.has(root.id));
};

// flatten + assign parent refs
const flattenFamily = (node, parent = null, path = [], result = []) => {
  if (!node) return result;
  const nodePath = [...path, node.id];
  result.push({ ...node, _parent: parent, _path: nodePath });
  node.children?.forEach((c) => flattenFamily(c, node, nodePath, result));
  return result;
};

const normalizeFamilyTree = (treePayload) => {
  const roots = (Array.isArray(treePayload) ? treePayload : [treePayload]).filter(Boolean);
  if (!roots.length) return { root: null, all: [], byId: {} };

  const rawMembers = [];
  roots.forEach((root) => collectRawMembers(root, rawMembers));
  const rawById = new Map(rawMembers.filter((m) => m?.id).map((m) => [m.id, m]));

  let uiRoots = roots.map((root) => convertToUiTree(root, rawById, null));
  uiRoots = collapseSpousalRoots(uiRoots);
  let rootNode = uiRoots[0];

  if (uiRoots.length > 1) {
    uiRoots = uiRoots.map((node) => shiftGenerations(node, 1));
    rootNode = {
      id: "__vault_root__",
      isSynthetic: true,
      firstName: "Vault",
      lastName: "Root",
      name: "Vault Root",
      born: "",
      died: "",
      gender: "M",
      location: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      photo: "",
      role: "Root",
      notes: "",
      generation: 0,
      isActive: true,
      isComplete: true,
      branch: "",
      parentId: null,
      spouseId: null,
      spouse: null,
      children: uiRoots,
    };
  }

  const all = flattenFamily(rootNode);
  const byId = Object.fromEntries(all.map((n) => [n.id, n]));
  return { root: rootNode, all, byId };
};

// Build ancestry path from root to node
const getAncestryPath = (nodeId, byIdMap) => {
  const node = byIdMap?.[nodeId];
  if (!node) return [];
  return node._path.map((id) => byIdMap[id]).filter(Boolean);
};

// ── STYLES ─────────────────────────────────────────────────────────
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;overflow:hidden}
    body{background:${C.void};color:${C.ink};font-family:${F.body};font-size:13px}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${C.inkDim};border-radius:4px}
    input,select,textarea{
      background:${C.chip};border:1px solid ${C.chipBorder};color:${C.ink};
      border-radius:8px;padding:8px 12px;font-family:${F.body};font-size:12px;
      outline:none;width:100%;transition:border .2s,box-shadow .2s
    }
    input:focus,select:focus,textarea:focus{
      border-color:${C.cyan};box-shadow:0 0 0 3px ${C.cyanGlow}
    }
    input::placeholder,textarea::placeholder{color:${C.inkDim}}
    select option{background:#080518}
    button{cursor:pointer;border:none;outline:none;font-family:${F.body}}

    @keyframes twinkle{0%,100%{opacity:.15}50%{opacity:.9}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    @keyframes orbit{from{transform:rotate(0deg) translateX(var(--orbit-r)) rotate(0deg)}to{transform:rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg)}}
    @keyframes orbitCCW{from{transform:rotate(0deg) translateX(var(--orbit-r)) rotate(0deg)}to{transform:rotate(-360deg) translateX(var(--orbit-r)) rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes spinRev{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes nebulaDrift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(15px,-12px) scale(1.07)}}
    @keyframes strandFlow{0%{stroke-dashoffset:100}100%{stroke-dashoffset:0}}
    @keyframes planetSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes companionOrbit{
      from{transform:rotate(0deg) translateX(58px) rotate(0deg)}
      to{transform:rotate(360deg) translateX(58px) rotate(-360deg)}
    }
    @keyframes moonOrbit{
      from{transform:rotate(0deg) translateX(28px) rotate(0deg)}
      to{transform:rotate(360deg) translateX(28px) rotate(-360deg)}
    }
    @keyframes zoomIn{from{opacity:0;transform:scale(0.3)}to{opacity:1;transform:scale(1)}}
    @keyframes ringExpand{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes particleDrift{
      0%{transform:translate(0,0) scale(1);opacity:.9}
      33%{transform:translate(var(--px),var(--py)) scale(1.4);opacity:.5}
      66%{transform:translate(var(--px2),var(--py2)) scale(.8);opacity:.8}
      100%{transform:translate(0,0) scale(1);opacity:.9}
    }
    @keyframes atmosphereBreath{
      0%,100%{transform:scale(1);opacity:.55}
      50%{transform:scale(1.06);opacity:.38}
    }
    @keyframes auraExpand{
      0%{transform:scale(0.85);opacity:.8}
      100%{transform:scale(1.6);opacity:0}
    }
    @keyframes surfaceRotate{
      from{transform:rotate(0deg)}to{transform:rotate(360deg)}
    }
    @keyframes particleOrbit{
      from{transform:rotate(var(--start-angle)) translateX(var(--orbit-r)) rotate(calc(-1 * var(--start-angle)))}
      to{transform:rotate(calc(var(--start-angle) + 360deg)) translateX(var(--orbit-r)) rotate(calc(-1 * (var(--start-angle) + 360deg)))}
    }

    .fade-up{animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both}
    .scale-in{animation:scaleIn .35s cubic-bezier(.22,1,.36,1) both}
    .fade-in{animation:fadeIn .3s ease both}
  `}</style>
);

// ── LAYOUT COMPUTATION ─────────────────────────────────────────────
const RINGS = [0, 115, 215, 305, 390];

const computeLayout = (node, cx, cy) => {
  const nodes = [], edges = [];
  const place = (n, x, y, angle, spread, depth) => {
    nodes.push({ ...n, _x: x, _y: y });
    const kids = (n.children || []);
    if (!kids.length || depth >= 4) return;
    const r = RINGS[depth + 1] || RINGS[RINGS.length - 1];
    const step = spread / Math.max(kids.length, 1);
    const start = angle - spread / 2 + step / 2;
    kids.forEach((c, i) => {
      const a = start + i * step;
      const rad = (a - 90) * Math.PI / 180;
      const nx = cx + Math.cos(rad) * r;
      const ny = cy + Math.sin(rad) * r;
      edges.push({ fromId: n.id, toId: c.id, fx: x, fy: y, tx: nx, ty: ny, hasSpouse: !!n.spouse, active: n.isActive });
      place(c, nx, ny, a, step * 0.78, depth + 1);
    });
  };
  place(node, cx, cy, -90, 340, 0);
  return { nodes, edges };
};

// ── STARFIELD ──────────────────────────────────────────────────────
const Starfield = () => {
  const stars = useMemo(() => {
    const seeded = (seed) => {
      const value = Math.sin(seed * 9301 + 49297) * 233280;
      return value - Math.floor(value);
    };

    return Array.from({ length: 200 }, (_, index) => {
      const i = index + 1;
      const x = seeded(i * 1.7);
      const y = seeded(i * 2.3);
      const s = seeded(i * 3.1);
      const o = seeded(i * 3.9);
      const d = seeded(i * 4.7);
      const dl = seeded(i * 5.3);
      return {
        x: x * 100,
        y: y * 100,
        s: 0.4 + s * 1.8,
        o: 0.08 + o * 0.7,
        d: 2 + d * 9,
        dl: dl * 8,
      };
    });
  }, []);

  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {[
        { x:15, y:20, w:500, h:280, col:"rgba(91,156,246,0.055)", dur:22 },
        { x:55, y:35, w:600, h:300, col:"rgba(167,139,250,0.045)", dur:28 },
        { x:5,  y:55, w:400, h:220, col:"rgba(34,211,238,0.04)",   dur:19 },
        { x:70, y:10, w:350, h:200, col:"rgba(244,114,182,0.04)",  dur:25 },
      ].map((n,i) => (
        <div key={i} style={{ position:"absolute", left:`${n.x}%`, top:`${n.y}%`,
          width:n.w, height:n.h, borderRadius:"50%",
          background:`radial-gradient(ellipse,${n.col} 0%,transparent 70%)`,
          filter:"blur(50px)", animation:`nebulaDrift ${n.dur}s ease-in-out ${i*4}s infinite` }}/>
      ))}
      {stars.map((s,i) => (
        <div key={i} style={{ position:"absolute", left:`${s.x}%`, top:`${s.y}%`,
          width:s.s, height:s.s, borderRadius:"50%", background:"#fff", opacity:s.o,
          animation:`twinkle ${s.d}s ease-in-out ${s.dl}s infinite` }}/>
      ))}
      {[{x:25,y:12,dl:3},{x:60,y:5,dl:9},{x:80,y:20,dl:16}].map((s,i)=>(
        <div key={i} style={{ position:"absolute", left:`${s.x}%`, top:`${s.y}%`,
          width:55, height:1.5, borderRadius:1,
          background:"linear-gradient(90deg,rgba(255,255,255,.8),transparent)",
          animation:`shootStar 1.2s ease-in ${s.dl}s infinite` }}/>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  INTERACTIVE PARTICLE PLANET — canvas-driven spirit orb
//  When a node is selected the view fills with a luminous planet
//  surrounded by interactive orbital particles that respond to mouse.
//  Married nodes show a companion (Alcor) orbiting the primary (Mizar).
// ══════════════════════════════════════════════════════════════════

// Generate stable particle configs for a node
const makeParticles = (seed, count, primaryCol, companionCol, hasSpouse) => {
  const rng = (s) => { let x=Math.sin(s)*10000; return x-Math.floor(x); };
  return Array.from({length:count},(_, i)=>{
    const angle  = rng(seed+i*7.3) * Math.PI * 2;
    const band   = Math.floor(rng(seed+i*3.1) * 3); // 0=inner 1=mid 2=outer
    const radius = [90,145,195][band] + rng(seed+i*2.7)*30;
    const speed  = 8 + rng(seed+i*5.9) * 18;
    const size   = 1.5 + rng(seed+i*11)*4;
    const isSpouseParticle = hasSpouse && rng(seed+i*4.4) > .55;
    const col    = isSpouseParticle ? companionCol : primaryCol;
    const drift  = { dx:( rng(seed+i*6.1)-.5)*60, dy:(rng(seed+i*8.2)-.5)*60,
                     dx2:(rng(seed+i*9.1)-.5)*40,  dy2:(rng(seed+i*2.3)-.5)*40 };
    const delay  = rng(seed+i*13.7) * 12;
    const dur    = speed * (0.8 + rng(seed+i*1.9)*.4);
    return { angle, radius, size, col, drift, delay, dur, band };
  });
};

const PlanetaryView = ({ node, onClose, onLineage, onEdit, onBranch }) => {
  const canvasRef  = useRef();
  const mouseRef   = useRef({ x:0, y:0 });
  const rafRef     = useRef();
  const [hovered, setHovered] = useState(false);

  const genCol      = C.gen[node.generation] || C.cyan;
  const hasSpouse   = !!node.spouse;
  const nonEditableNode = isSyntheticMember(node);
  const primaryCol  = node.gender === "M" ? C.paternal : C.maternal;
  const companionCol= node.spouse
    ? (node.spouse.gender === "M" ? C.paternal : C.maternal)
    : primaryCol;

  // Planet radius scales with generation seniority
  const PR = Math.max(64 - node.generation * 7, 36);
  const CR = PR * 0.48;

  // Stable particles for this node
  const particles = useMemo(
    ()=> makeParticles(node.id.charCodeAt(0)*31+node.generation*97, 55, primaryCol, companionCol, hasSpouse),
    [node.id, node.generation, primaryCol, companionCol, hasSpouse]
  );

  // Canvas particle draw loop
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    let t = 0;
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;

    const hex2rgb = h => {
      const r = parseInt(h.slice(1,3),16);
      const g = parseInt(h.slice(3,5),16);
      const b = parseInt(h.slice(5,7),16);
      return [r,g,b];
    };
    const pr = hex2rgb(primaryCol);
    const cr = hex2rgb(companionCol);
    const gc = hex2rgb(genCol);

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0,0,W,H);

      // Mouse influence vector (normalised)
      const mx = (mouseRef.current.x - cx) / W;
      const my = (mouseRef.current.y - cy) / H;

      particles.forEach((p, i) => {
        const orbit_t = t / p.dur + p.delay * 0.1;
        // Base orbit position
        const baseAngle = p.angle + orbit_t * Math.PI * 2;
        const wobble    = Math.sin(t * 1.3 + p.delay) * 8;
        const rx = p.radius + wobble;
        const ry = p.radius * 0.72 + wobble * 0.5; // slight ellipse

        let px = cx + Math.cos(baseAngle) * rx;
        let py = cy + Math.sin(baseAngle) * ry;

        // Mouse repulsion — particles gently drift away from cursor
        const dxm = px - (cx + mx * W * 0.4);
        const dym = py - (cy + my * H * 0.4);
        const distM = Math.sqrt(dxm*dxm + dym*dym) || 1;
        const push = Math.max(0, 1 - distM / 120) * 28;
        px += (dxm / distM) * push;
        py += (dym / distM) * push;

        // Depth fade — particles "behind" planet are dimmer
        const depthT = (Math.sin(baseAngle) + 1) / 2; // 0=back 1=front
        const alpha  = 0.2 + depthT * 0.75;
        const scale  = 0.4 + depthT * 0.9;
        const sz     = p.size * scale;

        // Color — interpolate between primary and companion
        const isCo = p.col === companionCol;
        const [r,g,b] = isCo ? cr : pr;

        // Draw particle as glowing orb
        const grad = ctx.createRadialGradient(px,py,0, px,py,sz*3);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha*0.5})`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(px, py, sz*3, 0, Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Hard core dot
        ctx.beginPath();
        ctx.arc(px, py, Math.max(sz*0.5,0.8), 0, Math.PI*2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha*0.9})`;
        ctx.fill();
      });

      // Draw bond filament between primary and companion particle clusters
      if(hasSpouse) {
        const ang = t * 0.4;
        const bx1 = cx + Math.cos(ang) * (PR + 10);
        const by1 = cy + Math.sin(ang) * (PR + 10) * 0.72;
        const bx2 = cx + Math.cos(ang + Math.PI) * (PR + 10);
        const by2 = cy + Math.sin(ang + Math.PI) * (PR + 10) * 0.72;
        const grad2 = ctx.createLinearGradient(bx1,by1,bx2,by2);
        const [rp,gp,bp] = pr; const [rc,gc2,bc] = cr;
        grad2.addColorStop(0,   `rgba(${rp},${gp},${bp},0.12)`);
        grad2.addColorStop(0.5, `rgba(167,139,250,0.22)`);
        grad2.addColorStop(1,   `rgba(${rc},${gc2},${bc},0.12)`);
        ctx.beginPath();
        ctx.moveTo(bx1,by1);
        ctx.bezierCurveTo(cx,by1-20, cx,by2+20, bx2,by2);
        ctx.strokeStyle = grad2;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [PR, companionCol, genCol, hasSpouse, node.id, particles, primaryCol]);

  const handleMouseMove = useCallback(e => {
    const r = canvasRef.current?.getBoundingClientRect();
    if(!r) return;
    mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      background:"radial-gradient(ellipse 70% 70% at 50% 50%, #07051E 0%, #02010A 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      animation:"fadeIn .4s ease",
    }}
      onMouseMove={handleMouseMove}
    >
      <Starfield/>

      {/* Back */}
      <button onClick={onClose} style={{
        position:"absolute", top:20, right:24, background:"transparent",
        border:`1px solid ${C.glassBorder}`, borderRadius:8, color:C.inkMid,
        padding:"6px 14px", fontSize:12,
      }}>← Back to Galaxy</button>

      {/* Header */}
      <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)",
        textAlign:"center", zIndex:10 }} className="fade-up">
        <div style={{ fontFamily:F.display, fontSize:11, letterSpacing:".18em",
          color:C.inkDim, textTransform:"uppercase", marginBottom:4 }}>
          Mizar · Alcor  ·  Spirit View
        </div>
        <div style={{ fontFamily:F.serif, fontSize:22, fontWeight:600, color:C.ink }}>
          {hasSpouse ? `${node.name}  ·  ${node.spouse.name}` : node.name}
        </div>
        <div style={{ fontSize:11, color:C.inkMid, marginTop:3 }}>
          {hasSpouse ? "Bonded binary — move cursor to disturb the field" : "Solitary spirit — move cursor through the aura"}
        </div>
      </div>

      {/* ── PLANET + PARTICLE CANVAS SCENE ── */}
      <div style={{ position:"relative", width:520, height:520,
        display:"flex", alignItems:"center", justifyContent:"center" }}
        className="scale-in"
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}>

        {/* Particle canvas — full scene layer */}
        <canvas ref={canvasRef} width={520} height={520}
          style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none" }}/>

        {/* Outer aura rings — pulsing atmosphere */}
        {[PR+80, PR+55, PR+34].map((r,i)=>(
          <div key={i} style={{
            position:"absolute", width:r*2, height:r*2, borderRadius:"50%",
            border:`1px solid ${primaryCol}${["14","22","33"][i]}`,
            animation:`atmosphereBreath ${4+i*1.4}s ease-in-out ${i*.6}s infinite`,
          }}/>
        ))}

        {/* Aura pulse burst */}
        <div style={{
          position:"absolute", width:(PR+40)*2, height:(PR+40)*2, borderRadius:"50%",
          border:`2px solid ${primaryCol}22`,
          animation:"auraExpand 3s ease-out infinite",
        }}/>
        <div style={{
          position:"absolute", width:(PR+40)*2, height:(PR+40)*2, borderRadius:"50%",
          border:`2px solid ${genCol}18`,
          animation:"auraExpand 3s ease-out 1.5s infinite",
        }}/>

        {/* Deep glow bloom */}
        <div style={{
          position:"absolute", width:(PR+60)*2, height:(PR+60)*2, borderRadius:"50%",
          background:`radial-gradient(circle, ${primaryCol}18 0%, ${genCol}08 40%, transparent 70%)`,
          filter:"blur(22px)",
        }}/>

        {/* ── PRIMARY PLANET ── */}
        <div style={{ position:"relative", zIndex:5 }}>
          {/* Atmosphere shell — outer */}
          <div style={{
            position:"absolute", inset:-(PR*.32),
            borderRadius:"50%",
            background:`radial-gradient(circle at 40% 35%, transparent 55%, ${primaryCol}18 75%, ${primaryCol}08 100%)`,
            filter:"blur(8px)",
            animation:"atmosphereBreath 5s ease-in-out infinite",
          }}/>

          {/* Planet body */}
          <div
            style={{
              width:PR*2, height:PR*2, borderRadius:"50%",
              background:`
                radial-gradient(circle at 32% 28%,
                  rgba(255,255,255,.28) 0%,
                  ${primaryCol}FF 18%,
                  ${primaryCol}CC 38%,
                  ${primaryCol}88 60%,
                  ${primaryCol}44 78%,
                  ${primaryCol}18 100%
                )
              `,
              boxShadow:`
                0 0 ${PR*.8}px ${primaryCol}99,
                0 0 ${PR*1.8}px ${primaryCol}44,
                0 0 ${PR*3.5}px ${primaryCol}1A,
                inset 0 0 ${PR*.4}px rgba(255,255,255,.12)
              `,
              position:"relative", overflow:"hidden",
              transition:"transform .3s",
              transform: hovered ? "scale(1.04)" : "scale(1)",
            }}>

            {/* Surface: slow-rotating band layer */}
            <div style={{
              position:"absolute", inset:0, borderRadius:"50%", overflow:"hidden",
            }}>
              {/* Latitude bands */}
              {[28,44,58,72].map((top,i)=>(
                <div key={i} style={{
                  position:"absolute", left:0, right:0,
                  top:`${top}%`, height:`${[10,7,9,6][i]}%`,
                  background:`rgba(255,255,255,${[.04,.06,.03,.05][i]})`,
                  borderRadius:"50%",
                }}/>
              ))}
              {/* Storm swirl */}
              <div style={{
                position:"absolute", top:"38%", left:"55%",
                width:"28%", height:"22%", borderRadius:"50%",
                background:`rgba(255,255,255,.09)`,
                filter:"blur(4px)",
              }}/>
            </div>

            {/* Specular highlight */}
            <div style={{
              position:"absolute", top:"14%", left:"18%",
              width:"32%", height:"24%", borderRadius:"50%",
              background:"rgba(255,255,255,.35)", filter:"blur(5px)",
            }}/>
            {/* Secondary glint */}
            <div style={{
              position:"absolute", top:"26%", left:"30%",
              width:"12%", height:"10%", borderRadius:"50%",
              background:"rgba(255,255,255,.55)", filter:"blur(2px)",
            }}/>
          </div>

          {/* Gender + name below planet */}
          <div style={{
            position:"absolute", bottom:-(PR*.55), left:"50%", transform:"translateX(-50%)",
            textAlign:"center", whiteSpace:"nowrap",
          }}>
            <div style={{ fontSize:13, color:primaryCol, fontFamily:F.serif,
              textShadow:`0 0 14px ${primaryCol}` }}>
              {node.gender==="M"?"♂":"♀"}  {node.name}
            </div>
            <div style={{ fontSize:9.5, color:C.inkDim, fontFamily:F.mono,
              marginTop:3, letterSpacing:".06em" }}>
              b.{node.born}{node.died?` · †${node.died}`:""} · {node.location||"—"}
            </div>
          </div>

          {/* ── COMPANION PLANET (Alcor) — orbiting the primary ── */}
          {hasSpouse && (
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              width:CR*2, height:CR*2,
              marginTop:-CR, marginLeft:-CR,
              animation:`companionOrbit ${10+node.generation*2}s linear infinite`,
              zIndex:6,
            }}>
              {/* Companion atmosphere */}
              <div style={{
                position:"absolute", inset:-(CR*.3), borderRadius:"50%",
                background:`radial-gradient(circle at 40% 35%, transparent 55%, ${companionCol}18 80%, transparent 100%)`,
                filter:"blur(6px)",
              }}/>
              {/* Companion body */}
              <div style={{
                width:CR*2, height:CR*2, borderRadius:"50%",
                background:`radial-gradient(circle at 32% 28%,
                  rgba(255,255,255,.22) 0%,
                  ${companionCol}EE 20%,
                  ${companionCol}BB 44%,
                  ${companionCol}55 72%,
                  ${companionCol}18 100%)`,
                boxShadow:`
                  0 0 ${CR*.7}px ${companionCol}88,
                  0 0 ${CR*1.6}px ${companionCol}33,
                  inset 0 0 ${CR*.3}px rgba(255,255,255,.1)`,
                position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute", top:"15%", left:"18%",
                  width:"30%", height:"22%", borderRadius:"50%",
                  background:"rgba(255,255,255,.28)", filter:"blur(3px)" }}/>
                <div style={{ position:"absolute", top:"40%", right:"20%",
                  width:"18%", height:"14%", borderRadius:"50%",
                  background:`rgba(255,255,255,.06)`, filter:"blur(2px)" }}/>
              </div>
              {/* Companion label */}
              <div style={{
                position:"absolute", bottom:-(CR*.7+14), left:"50%", transform:"translateX(-50%)",
                fontSize:10, color:companionCol, whiteSpace:"nowrap",
                textShadow:`0 0 8px ${companionCol}`, fontFamily:F.serif,
              }}>
                {node.spouse.gender==="M"?"♂":"♀"} {node.spouse.name}
              </div>
            </div>
          )}

          {/* ── CHILD MOONS ── */}
          {(node.children||[]).slice(0,5).map((child, i) => {
            const moonR  = Math.max(10 - i, 7);
            const orbitR = PR + 68 + i*26;
            const moonCol= child.gender==="M" ? C.paternal : C.maternal;
            return (
              <div key={child.id} style={{
                position:"absolute", top:"50%", left:"50%",
                width:moonR*2, height:moonR*2,
                marginTop:-moonR, marginLeft:-moonR,
                animation:`moonOrbit ${9+i*3.5}s linear ${i*.9}s infinite`,
                zIndex:4,
              }}>
                {/* Orbit track */}
                <div style={{
                  position:"absolute",
                  top:`${-orbitR+moonR}px`, left:`${-orbitR+moonR}px`,
                  width:orbitR*2, height:orbitR*2, borderRadius:"50%",
                  border:`1px dashed ${moonCol}20`, pointerEvents:"none",
                }}/>
                {/* Moon body */}
                <div style={{
                  width:moonR*2, height:moonR*2, borderRadius:"50%",
                  background:`radial-gradient(circle at 32% 28%, rgba(255,255,255,.2) 0%, ${moonCol}DD 25%, ${moonCol}77 60%, ${moonCol}22 100%)`,
                  border:`1px solid ${moonCol}88`,
                  boxShadow:`0 0 ${moonR*1.8}px ${moonCol}66`,
                  position:"relative", overflow:"hidden",
                }}>
                  <div style={{ position:"absolute", top:"14%", left:"16%",
                    width:"28%", height:"20%", borderRadius:"50%",
                    background:"rgba(255,255,255,.22)", filter:"blur(1px)" }}/>
                </div>
                <div style={{ position:"absolute", bottom:-15, left:"50%",
                  transform:"translateX(-50%)", fontSize:8.5, color:moonCol,
                  whiteSpace:"nowrap", opacity:.75, fontFamily:F.body }}>
                  {child.name.split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── INFO STRIP ── */}
      <div style={{ display:"flex", gap:10, alignItems:"stretch", marginTop:56, zIndex:10 }}
        className="fade-up">
        <InfoCard label="Primary Spirit" col={primaryCol}>
          <div style={{ fontFamily:F.serif, fontSize:15, fontWeight:600 }}>{node.name}</div>
          <div style={{ fontSize:11, color:C.inkMid, marginTop:3 }}>
            {node.born}{node.died?` – ${node.died}`:" – present"}
          </div>
          <div style={{ fontSize:11, color:C.inkMid }}>{node.location||"—"}</div>
          <div style={{ display:"flex", gap:5, marginTop:7, flexWrap:"wrap" }}>
            <Pill col={C.gen[node.generation]}>Gen {node.generation}</Pill>
            <Pill col={node.isActive?C.living:C.inkDim}>
              {node.isActive?"● Living":"† Deceased"}
            </Pill>
          </div>
        </InfoCard>

        {hasSpouse && (
          <InfoCard label="Companion ♡" col={companionCol}>
            <div style={{ fontFamily:F.serif, fontSize:15, fontWeight:600 }}>{node.spouse.name}</div>
            <div style={{ fontSize:11, color:C.inkMid, marginTop:3 }}>b. {node.spouse.born}</div>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:8 }}>
              <div style={{ width:22, height:3, borderRadius:2, background:C.paternal }}/>
              <div style={{ width:22, height:3, borderRadius:2, background:C.maternal }}/>
              <span style={{ fontSize:9.5, color:C.union }}>dual strand</span>
            </div>
          </InfoCard>
        )}

        {(node.children||[]).length>0 && (
          <InfoCard label="Moons" col={genCol}>
            <div style={{ fontFamily:F.serif, fontSize:28, fontWeight:600, color:genCol }}>
              {node.children.length}
            </div>
            <div style={{ fontSize:11, color:C.inkMid }}>
              {node.children.filter(c=>c.gender==="M").length}♂ · {node.children.filter(c=>c.gender==="F").length}♀
            </div>
          </InfoCard>
        )}
      </div>

      {/* ── ACTIONS ── */}
      <div style={{ display:"flex", gap:10, marginTop:14, zIndex:10 }}>
        <ActionBtn icon="📜" label="View Lineage" col={C.cyan}  onClick={onLineage}/>
        <ActionBtn icon="✏️" label={nonEditableNode ? "Edit Disabled" : "Edit Details"} col={C.amber} onClick={onEdit} disabled={nonEditableNode}/>
        <ActionBtn icon="🌿" label="Show Branch"   col={C.living} onClick={onBranch}/>
      </div>
    </div>
  );
};

const InfoCard = ({ label, col, children }) => (
  <div style={{
    background:C.glass, border:`1px solid ${col}28`,
    borderRadius:12, padding:"13px 17px", backdropFilter:"blur(20px)", minWidth:170,
    boxShadow:`0 0 24px ${col}10`,
  }}>
    <div style={{ fontSize:9, color:col, letterSpacing:".12em",
      textTransform:"uppercase", marginBottom:7, opacity:.8 }}>{label}</div>
    {children}
  </div>
);

const Pill = ({ col, children }) => (
  <span style={{ fontSize:9.5, padding:"2px 8px", borderRadius:99,
    background:`${col}18`, border:`1px solid ${col}40`, color:col }}>
    {children}
  </span>
);

const ActionBtn = ({ icon, label, col, onClick, disabled = false }) => {
  const [h,sH] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={()=>{ if (!disabled) sH(true); }}
      onMouseLeave={()=>sH(false)}
      style={{
        display:"flex", alignItems:"center", gap:7, padding:"10px 20px",
        borderRadius:10, fontSize:12.5, fontWeight:500, transition:"all .22s",
        background: disabled ? C.chip : (h ? `${col}1E` : C.glass),
        border:`1px solid ${disabled ? C.chipBorder : (h ? `${col}80` : C.glassBorder)}`,
        color: disabled ? C.inkDim : (h ? col : C.inkMid),
        boxShadow: h ? `0 0 24px ${col}22` : "none",
        backdropFilter:"blur(16px)",
        transform: h ? "translateY(-1px)" : "none",
        opacity: disabled ? .55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}>
      <span style={{fontSize:15}}>{icon}</span>{label}
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════
//  BRANCH PANEL
//  Shows the immediate branch context of the selected node:
//  LEFT  — one step up:  parent node (prev generation)
//  RIGHT — one step down: children nodes (next generation)
//  Each card is a clickable mini star that navigates to that node
// ══════════════════════════════════════════════════════════════════
const BranchPanel = ({ node, byIdMap, onClose, onNavigate }) => {
  // Resolve parent from flattened tree
  const selfRecord = byIdMap?.[node.id];
  const parentNode = selfRecord?._parent ? byIdMap?.[selfRecord._parent.id] || selfRecord._parent : null;
  const children   = node.children || [];
  const hasParent  = !!parentNode;
  const hasChildren = children.length > 0;

  const genCol = C.gen[node.generation] || C.cyan;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:250,
      background:"rgba(2,1,10,0.72)",
      backdropFilter:"blur(14px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      animation:"fadeIn .25s ease",
    }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
    >
      <Starfield/>

      {/* Header */}
      <div style={{ position:"absolute", top:22, left:"50%", transform:"translateX(-50%)",
        textAlign:"center", zIndex:10 }} className="fade-up">
        <div style={{ fontFamily:F.display, fontSize:11, letterSpacing:".14em",
          color:C.inkDim, textTransform:"uppercase", marginBottom:5 }}>Branch View</div>
        <div style={{ fontFamily:F.serif, fontSize:20, fontWeight:600, color:C.ink }}>
          {node.name}
        </div>
        <div style={{ fontSize:11, color:C.inkMid, marginTop:2 }}>
          Showing one generation up &amp; one generation down
        </div>
      </div>

      <button onClick={onClose} style={{
        position:"absolute", top:20, right:24,
        background:"transparent", border:`1px solid ${C.glassBorder}`,
        borderRadius:8, color:C.inkMid, padding:"6px 14px", fontSize:12,
      }}>← Back</button>

      {/* ── THREE COLUMN LAYOUT ── */}
      <div style={{
        display:"flex", alignItems:"center", gap:0,
        width:"92%", maxWidth:920, zIndex:10,
      }} className="scale-in">

        {/* ── LEFT: PARENT (prev gen) ── */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", gap:14,
        }}>
          <div style={{ fontSize:9.5, color:C.inkDim, fontFamily:F.mono,
            letterSpacing:".12em", textTransform:"uppercase", marginBottom:2 }}>
            ← Prev Generation
          </div>

          {hasParent ? (
            <BranchStarCard
              node={parentNode}
              direction="parent"
              onClick={()=>{ onNavigate(parentNode); onClose(); }}
            />
          ) : (
            <div style={{
              width:140, padding:"22px 16px", borderRadius:14, textAlign:"center",
              background:"rgba(255,255,255,.02)", border:`1px dashed ${C.inkFaint}`,
            }}>
              <div style={{ fontSize:22, opacity:.2, marginBottom:8 }}>✦</div>
              <div style={{ fontSize:11, color:C.inkDim }}>Root ancestor</div>
              <div style={{ fontSize:10, color:C.inkFaint, marginTop:3 }}>No generation above</div>
            </div>
          )}
        </div>

        {/* ── CENTER CONNECTOR ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
          gap:0, width:180, flexShrink:0, position:"relative" }}>

          {/* Left arrow line */}
          <svg width="180" height="60" style={{ overflow:"visible" }}>
            <defs>
              <linearGradient id="leftLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={C.gen[Math.max(0,node.generation-1)]} stopOpacity=".5"/>
                <stop offset="100%" stopColor={genCol} stopOpacity=".9"/>
              </linearGradient>
              <linearGradient id="rightLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={genCol} stopOpacity=".9"/>
                <stop offset="100%" stopColor={C.gen[Math.min(5,node.generation+1)]} stopOpacity=".5"/>
              </linearGradient>
            </defs>
            {/* Parent arrow */}
            {hasParent && (
              <g>
                <path d="M 0 30 L 85 30" stroke="url(#leftLine)"
                  strokeWidth="1.5" fill="none" strokeDasharray="5,4"/>
                <polygon points="82,25 90,30 82,35" fill={genCol} opacity=".7"/>
              </g>
            )}
            {/* Child arrow */}
            {hasChildren && (
              <g>
                <path d="M 95 30 L 180 30" stroke="url(#rightLine)"
                  strokeWidth="1.5" fill="none" strokeDasharray="5,4"/>
                <polygon points="177,25 185,30 177,35" fill={C.gen[Math.min(5,node.generation+1)]} opacity=".7"/>
              </g>
            )}
          </svg>

          {/* Current node — center star */}
          <div style={{ marginTop:-8, display:"flex", flexDirection:"column", alignItems:"center" }}>
            {/* Orbit rings */}
            <div style={{ position:"relative", width:100, height:100,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ position:"absolute", width:90, height:90, borderRadius:"50%",
                border:`1px solid ${genCol}30`,
                animation:"spinSlow 12s linear infinite" }}/>
              <div style={{ position:"absolute", width:74, height:74, borderRadius:"50%",
                border:`1px solid ${genCol}20` }}/>

              {/* Star */}
              <div style={{
                width:56, height:56, borderRadius:"50%",
                background:`radial-gradient(circle at 35% 30%, ${genCol}EE 0%, ${genCol}88 40%, ${genCol}22 100%)`,
                border:`2px solid ${genCol}`,
                boxShadow:`0 0 20px ${genCol}66, 0 0 50px ${genCol}22`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, color:"rgba(255,255,255,.9)",
                position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute", top:"18%", left:"20%",
                  width:"28%", height:"18%", borderRadius:"50%",
                  background:"rgba(255,255,255,.25)", filter:"blur(2px)" }}/>
                {node.gender==="M"?"♂":"♀"}
              </div>
            </div>

            <div style={{ textAlign:"center", marginTop:6 }}>
              <div style={{ fontFamily:F.serif, fontSize:14, fontWeight:600, color:C.ink }}>
                {node.name.split(" ")[0]}
              </div>
              <div style={{ fontSize:10, color:C.inkMid, marginTop:2 }}>
                b.{node.born} · Gen {node.generation}
              </div>
              {node.spouse && (
                <div style={{ fontSize:10, color:C.union, marginTop:3 }}>
                  ♡ {node.spouse.name.split(" ")[0]}
                </div>
              )}
            </div>

            <div style={{ marginTop:8 }}>
              <span style={{ fontSize:9, padding:"2px 10px", borderRadius:99,
                background:`${genCol}18`, border:`1px solid ${genCol}40`,
                color:genCol, fontFamily:F.mono, letterSpacing:".06em" }}>
                SELECTED
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: CHILDREN (next gen) ── */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", gap:12,
        }}>
          <div style={{ fontSize:9.5, color:C.inkDim, fontFamily:F.mono,
            letterSpacing:".12em", textTransform:"uppercase", marginBottom:2 }}>
            Next Generation →
          </div>

          {hasChildren ? (
            <div style={{
              display:"flex", flexDirection:"column", gap:8,
              maxHeight:360, overflowY:"auto", paddingRight:4, width:"100%",
              alignItems:"center",
            }}>
              {children.map((child, i) => (
                <BranchStarCard
                  key={child.id}
                  node={child}
                  direction="child"
                  delay={i * 0.06}
                  onClick={()=>{ onNavigate(child); onClose(); }}
                />
              ))}
            </div>
          ) : (
            <div style={{
              width:140, padding:"22px 16px", borderRadius:14, textAlign:"center",
              background:"rgba(255,255,255,.02)", border:`1px dashed ${C.inkFaint}`,
            }}>
              <div style={{ fontSize:22, opacity:.2, marginBottom:8 }}>◌</div>
              <div style={{ fontSize:11, color:C.inkDim }}>Leaf node</div>
              <div style={{ fontSize:10, color:C.inkFaint, marginTop:3 }}>No descendants recorded</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{ position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)",
        fontSize:10.5, color:C.inkDim, fontFamily:F.mono,
        display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:C.living, fontSize:12 }}>◉</span>
        Click any star card to travel to that node&apos;s planetary view
      </div>
    </div>
  );
};

// ── MINI STAR CARD — used inside BranchPanel ───────────────────────
const BranchStarCard = ({ node, direction, delay = 0, onClick }) => {
  const [hov, sHov] = useState(false);
  const genCol  = C.gen[node.generation] || C.cyan;
  const genderCol = node.gender === "M" ? C.paternal : C.maternal;
  const starR   = direction === "parent" ? 26 : 22;

  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>sHov(true)}
      onMouseLeave={()=>sHov(false)}
      style={{
        width: 160, borderRadius:14, padding:"14px 14px 12px",
        background: hov ? `${genCol}14` : "rgba(255,255,255,.03)",
        border:`1.5px solid ${hov ? `${genCol}70` : C.chipBorder}`,
        cursor:"pointer", transition:"all .22s",
        boxShadow: hov ? `0 0 24px ${genCol}22, 0 8px 32px rgba(0,0,0,.4)` : "0 4px 16px rgba(0,0,0,.3)",
        transform: hov ? "translateY(-3px) scale(1.03)" : "none",
        animation:`fadeUp .4s ease ${delay}s both`,
        display:"flex", flexDirection:"column", alignItems:"center", gap:8,
        backdropFilter:"blur(12px)",
      }}
    >
      {/* Mini star */}
      <div style={{ position:"relative" }}>
        {/* Orbit ring */}
        <div style={{ position:"absolute", top:"50%", left:"50%",
          width:(starR+12)*2, height:(starR+12)*2,
          transform:"translate(-50%,-50%)", borderRadius:"50%",
          border:`1px solid ${genCol}${hov?"40":"18"}`,
          transition:"border-color .2s",
          animation: hov ? "spinSlow 6s linear infinite" : "spinSlow 12s linear infinite",
        }}/>

        {/* Star body */}
        <div style={{
          width:starR*2, height:starR*2, borderRadius:"50%",
          background:`radial-gradient(circle at 35% 30%, ${genCol}DD 0%, ${genCol}77 45%, ${genCol}22 100%)`,
          border:`${hov?2:1.5}px solid ${genCol}${hov?"EE":"88"}`,
          boxShadow: hov
            ? `0 0 ${starR}px ${genCol}99, 0 0 ${starR*2}px ${genCol}33`
            : `0 0 ${starR*.6}px ${genCol}44`,
          display:"flex", alignItems:"center", justifyContent:"center",
          position:"relative", overflow:"hidden", transition:"all .2s",
        }}>
          <div style={{ position:"absolute", top:"18%", left:"20%",
            width:"28%", height:"18%", borderRadius:"50%",
            background:"rgba(255,255,255,.22)", filter:"blur(1px)" }}/>
          <span style={{ fontSize:starR*.72, color:"rgba(255,255,255,.9)" }}>
            {node.gender==="M"?"♂":"♀"}
          </span>
        </div>

        {/* Companion dot for spouse */}
        {node.spouse && (
          <div style={{
            position:"absolute", top:-2, right:-2,
            width:10, height:10, borderRadius:"50%",
            background:`radial-gradient(circle,${node.spouse.gender==="M"?C.paternal:C.maternal}BB,${node.spouse.gender==="M"?C.paternal:C.maternal}44)`,
            border:`1px solid ${node.spouse.gender==="M"?C.paternal:C.maternal}`,
            boxShadow:`0 0 6px ${node.spouse.gender==="M"?C.paternal:C.maternal}88`,
          }}/>
        )}

        {/* Active pulse */}
        {node.isActive && (
          <div style={{ position:"absolute", inset:-(starR*.3), borderRadius:"50%",
            border:`1px solid ${genCol}25`,
            animation:"pulse 2.5s ease-in-out infinite" }}/>
        )}
      </div>

      {/* Info */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:12.5, fontWeight:hov?600:500,
          color:hov?C.ink:C.inkMid, fontFamily:F.serif,
          transition:"color .2s", lineHeight:1.2 }}>
          {node.name.split(" ").slice(0,2).join(" ")}
        </div>
        <div style={{ fontSize:10, color:C.inkDim, marginTop:3 }}>
          b.{node.born}{node.died?` †${node.died}`:""}
        </div>
        {node.location && (
          <div style={{ fontSize:9.5, color:C.inkDim, marginTop:1 }}>{node.location}</div>
        )}
        {node.spouse && (
          <div style={{ fontSize:9.5, color:C.union, marginTop:3 }}>
            ♡ {node.spouse.name.split(" ")[0]}
          </div>
        )}
      </div>

      {/* Gen badge */}
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99,
          background:`${genCol}${hov?"22":"14"}`,
          border:`1px solid ${genCol}${hov?"60":"30"}`,
          color:genCol, fontFamily:F.mono, letterSpacing:".05em",
          transition:"all .2s" }}>
          G{node.generation}
        </span>
        <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99,
          background:node.isActive?`${C.living}15`:`rgba(55,65,81,.3)`,
          border:`1px solid ${node.isActive?`${C.living}35`:C.inkFaint}`,
          color:node.isActive?C.living:C.inkDim }}>
          {node.isActive?"● live":"† past"}
        </span>
      </div>

      {/* Click hint */}
      {hov && (
        <div style={{ fontSize:9, color:C.cyan, fontFamily:F.mono,
          animation:"fadeIn .15s ease" }}>
          ✦ open planet view
        </div>
      )}
    </div>
  );
};


const LineageModal = ({ node, byIdMap, onClose }) => {
  const chain = getAncestryPath(node.id, byIdMap);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      background:"rgba(2,1,10,0.88)",
      display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(12px)",
      animation:"fadeIn .25s ease",
    }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>

      <div style={{
        background:C.glass, border:`1px solid ${C.glassBorderHi}`,
        borderRadius:18, width:560, maxHeight:"82vh",
        display:"flex", flexDirection:"column",
        boxShadow:`0 24px 80px rgba(0,0,0,.8), 0 0 0 1px ${C.glassBorder}`,
        animation:"scaleIn .3s cubic-bezier(.22,1,.36,1)",
        overflow:"hidden",
      }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px",
          borderBottom:`1px solid ${C.glassBorder}`,
          background:"linear-gradient(135deg,rgba(91,156,246,.08),rgba(167,139,250,.06))" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:F.display, fontSize:11, letterSpacing:".14em",
                color:C.inkDim, textTransform:"uppercase", marginBottom:6 }}>
                Ancestral Lineage
              </div>
              <div style={{ fontFamily:F.serif, fontSize:20, fontWeight:600, color:C.ink }}>
                Heritage of {node.name}
              </div>
              <div style={{ fontSize:11, color:C.inkMid, marginTop:3 }}>
                {chain.length} generation{chain.length!==1?"s":""} from source to present
              </div>
            </div>
            <button onClick={onClose} style={{ background:`${C.chip}`, border:`1px solid ${C.chipBorder}`,
              borderRadius:8, color:C.inkMid, padding:"6px 12px", fontSize:12 }}>✕ Close</button>
          </div>
        </div>

        {/* Scrollable chain */}
        <div style={{ overflowY:"auto", padding:"20px 24px", flex:1 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {chain.map((ancestor, i) => {
              const isLast = i === chain.length - 1;
              const isRoot = i === 0;
              const genCol = C.gen[ancestor.generation] || C.cyan;
              const genderCol = ancestor.gender === "M" ? C.paternal : C.maternal;

              return (
                <div key={ancestor.id}>
                  {/* Node card */}
                  <div style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"14px 16px",
                    background: isLast ? `${genCol}12` : "rgba(255,255,255,0.025)",
                    border:`1px solid ${isLast ? `${genCol}40` : C.chipBorder}`,
                    borderRadius:12,
                    boxShadow: isLast ? `0 0 20px ${genCol}18` : "none",
                    transition:"all .2s",
                    animation:`fadeUp .4s ease ${i*.06}s both`,
                  }}>
                    {/* Star avatar */}
                    <div style={{
                      width:46, height:46, borderRadius:"50%", flexShrink:0,
                      background:`radial-gradient(circle at 35% 30%, ${genCol}CC, ${genCol}33)`,
                      border:`2px solid ${isLast ? genCol : `${genCol}60`}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:18, color:genCol,
                      boxShadow: isLast ? `0 0 18px ${genCol}55` : "none",
                      position:"relative",
                    }}>
                      {ancestor.gender==="M"?"♂":"♀"}
                      {isRoot && (
                        <div style={{ position:"absolute", inset:-4, borderRadius:"50%",
                          border:`1.5px solid ${C.gold}44`,
                          animation:"spinSlow 10s linear infinite" }}/>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontFamily:F.serif, fontSize:15, fontWeight:600,
                          color: isLast ? C.ink : C.inkMid }}>{ancestor.name}</span>
                        {isRoot && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99,
                          background:`${C.gold}18`, border:`1px solid ${C.gold}40`,
                          color:C.gold, letterSpacing:".06em" }}>ROOT</span>}
                        {isLast && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99,
                          background:`${genCol}18`, border:`1px solid ${genCol}40`,
                          color:genCol, letterSpacing:".06em" }}>SELECTED</span>}
                      </div>
                      <div style={{ fontSize:11, color:C.inkDim, marginTop:3 }}>
                        {ancestor.role||"Member"} · b.{ancestor.born}{ancestor.died?` †${ancestor.died}`:""}
                        {ancestor.location ? ` · ${ancestor.location}` : ""}
                      </div>
                      {ancestor.spouse && (
                        <div style={{ fontSize:10.5, color:C.union, marginTop:3,
                          display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ opacity:.7 }}>♡</span>
                          {ancestor.spouse.name} · {ancestor.spouse.gender==="M"?"♂":"♀"}
                        </div>
                      )}
                    </div>

                    {/* Generation badge */}
                    <div style={{ textAlign:"center", flexShrink:0 }}>
                      <div style={{ fontFamily:F.mono, fontSize:18, fontWeight:700, color:genCol,
                        textShadow:`0 0 12px ${genCol}` }}>G{ancestor.generation}</div>
                      <div style={{ fontSize:8.5, color:C.inkDim, letterSpacing:".06em" }}>GEN</div>
                    </div>
                  </div>

                  {/* Connector line between nodes */}
                  {!isLast && (
                    <div style={{ display:"flex", alignItems:"center", padding:"2px 0 2px 23px", gap:8 }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                        <div style={{ width:1.5, height:10,
                          background:`linear-gradient(${C.gen[ancestor.generation]},${C.gen[ancestor.generation+1]||C.cyan})`,
                          opacity:.5 }}/>
                        <div style={{ fontSize:9, color:C.union }}>↓</div>
                        <div style={{ width:1.5, height:10,
                          background:`linear-gradient(${C.gen[ancestor.generation]},${C.gen[ancestor.generation+1]||C.cyan})`,
                          opacity:.5 }}/>
                      </div>
                      <div style={{ fontSize:10, color:C.inkDim, fontStyle:"italic" }}>
                        {chain[i+1]?.gender==="M" ? "son" : "daughter"} of {ancestor.name}
                        {ancestor.spouse ? ` & ${ancestor.spouse.name}` : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 24px", borderTop:`1px solid ${C.glassBorder}`,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:"rgba(255,255,255,.02)" }}>
          <div style={{ fontSize:11, color:C.inkDim }}>
            Lineage depth: {chain.length - 1} generation{chain.length-1!==1?"s":""}
          </div>
          <button onClick={onClose} style={{ background:`${C.cyan}18`,
            border:`1px solid ${C.cyan}50`, borderRadius:8, color:C.cyan,
            padding:"7px 18px", fontSize:12, fontWeight:500 }}>
            Close Lineage
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  EDIT MODAL — full form for updating member details
// ══════════════════════════════════════════════════════════════════
const EditModal = ({ node, onClose, onSave, mode = "edit" }) => {
  const isCreate = mode === "create";
  const [form, setForm] = useState({
    name:     node.name     || "",
    born:     node.born     || "",
    died:     node.died     || "",
    location: node.location || "",
    role:     node.role     || "Member",
    gender:   node.gender   || "M",
    isActive: node.isActive ?? true,
    spouseName: node.spouse?.name || "",
    spouseBorn: node.spouse?.born || "",
    notes:    node.notes    || "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const u = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSave = async () => {
    if (saving) return;
    setSaveError("");
    setSaving(true);
    try {
      const payload = { ...form };
      if (isCreate) {
        Object.assign(payload, {
          parentId: node.parentId || null,
          parentName: node.parentName || "",
          generation: node.generation ?? 0,
          branch: node.branch || "",
          isComplete: node.isComplete ?? true,
        });
      } else {
        Object.assign(payload, {
          id: node.id,
          spouseId: node.spouseId || node.spouse?.id || null,
          generation: node.generation,
          isComplete: node.isComplete,
        });
      }

      await onSave(payload);
      setSaved(true);
      setTimeout(()=>{ setSaved(false); onClose(); }, 900);
    } catch (error) {
      setSaveError(error?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const genCol = C.gen[node.generation ?? 0] || C.cyan;
  const formGenderColor = form.gender === "M" ? C.paternal : C.maternal;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      background:"rgba(2,1,10,0.88)",
      display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(12px)",
      animation:"fadeIn .25s ease",
    }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>

      <div style={{
        background:C.glass, border:`1px solid ${C.glassBorderHi}`,
        borderRadius:18, width:580, maxHeight:"86vh",
        display:"flex", flexDirection:"column",
        boxShadow:`0 24px 80px rgba(0,0,0,.8)`,
        animation:"scaleIn .3s cubic-bezier(.22,1,.36,1)",
        overflow:"hidden",
      }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px",
          borderBottom:`1px solid ${C.glassBorder}`,
          background:`linear-gradient(135deg,${genCol}0A,rgba(167,139,250,.05))` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontFamily:F.display, fontSize:10.5, letterSpacing:".14em",
                color:C.inkDim, textTransform:"uppercase", marginBottom:6 }}>
                {isCreate ? "Create Heritage Record" : "Edit Heritage Record"}
              </div>
              <div style={{ fontFamily:F.serif, fontSize:19, fontWeight:600 }}>
                {isCreate ? "New Heritage Member" : node.name}
              </div>
              <div style={{ display:"flex", gap:6, marginTop:6 }}>
                <span style={{ fontSize:9.5, padding:"2px 8px", borderRadius:99,
                  background:`${genCol}18`, border:`1px solid ${genCol}40`, color:genCol }}>
                  Gen {node.generation ?? 0}
                </span>
                <span style={{ fontSize:9.5, padding:"2px 8px", borderRadius:99,
                  background:`${formGenderColor}18`,
                  border:`1px solid ${formGenderColor}40`,
                  color:formGenderColor }}>
                  {form.gender==="M"?"Male":"Female"}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background:C.chip,
              border:`1px solid ${C.chipBorder}`, borderRadius:8,
              color:C.inkMid, padding:"6px 12px", fontSize:12 }}>✕</button>
          </div>
        </div>

        {/* Form */}
        <div style={{ overflowY:"auto", padding:"20px 24px", flex:1 }}>

          <ESection label="Personal Details">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <EField label="Full Name">
                <input value={form.name} onChange={e=>u("name",e.target.value)} placeholder="Full name"/>
              </EField>
              <EField label="Gender">
                <select value={form.gender} onChange={e=>u("gender",e.target.value)}>
                  <option value="M">♂ Male</option>
                  <option value="F">♀ Female</option>
                </select>
              </EField>
              <EField label="Year of Birth">
                <input value={form.born} onChange={e=>u("born",e.target.value)} placeholder="e.g. 1965" type="number"/>
              </EField>
              <EField label="Year of Death">
                <input value={form.died} onChange={e=>u("died",e.target.value)} placeholder="Leave blank if living" type="number"/>
              </EField>
              <EField label="Location">
                <input value={form.location} onChange={e=>u("location",e.target.value)} placeholder="City, State"/>
              </EField>
              <EField label="Role in Family">
                <select value={form.role} onChange={e=>u("role",e.target.value)}>
                  {["Patriarch","Matriarch","Son","Daughter","Grandson","Granddaughter","Spouse","Member"].map(r=>(
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </EField>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
              background:C.chip, borderRadius:8, border:`1px solid ${C.chipBorder}`, marginTop:12 }}>
              <div onClick={()=>u("isActive",!form.isActive)} style={{
                width:38, height:20, borderRadius:10, cursor:"pointer", position:"relative",
                background:form.isActive?C.living:C.inkFaint, transition:"background .2s",
                border:`1px solid ${form.isActive?C.living:C.inkDim}`,
              }}>
                <div style={{ position:"absolute", top:2, left:form.isActive?18:2,
                  width:14, height:14, borderRadius:7, background:"#fff", transition:"left .2s" }}/>
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:500 }}>Living member</div>
                <div style={{ fontSize:10.5, color:C.inkDim }}>Toggle off if this person is deceased</div>
              </div>
            </div>
          </ESection>

          {/* Spouse section */}
          <ESection label={node.spouse ? "Companion Star (Spouse)" : "Add Spouse"}>
            <div style={{ padding:"10px 14px", background:`${C.union}0A`,
              border:`1px solid ${C.union}25`, borderRadius:8, marginBottom:12,
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>♡</span>
              <span style={{ fontSize:11, color:C.inkMid }}>
                Spouse forms a binary star pair — shown as Mizar & Alcor in the planetary view
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <EField label="Spouse Name">
                <input value={form.spouseName} onChange={e=>u("spouseName",e.target.value)}
                  placeholder={node.spouse?"Edit spouse name":"Add spouse name"}/>
              </EField>
              <EField label="Spouse Birth Year">
                <input value={form.spouseBorn} onChange={e=>u("spouseBorn",e.target.value)}
                  placeholder="e.g. 1968" type="number"/>
              </EField>
            </div>
          </ESection>

          <ESection label="Notes">
            <textarea value={form.notes} onChange={e=>u("notes",e.target.value)}
              rows={3} placeholder="Biography, notable facts, oral history..."
              style={{ resize:"vertical" }}/>
          </ESection>

          {saved && (
            <div style={{ padding:"11px 14px", borderRadius:8, marginTop:8,
              background:`${C.living}15`, border:`1px solid ${C.living}40`,
              display:"flex", alignItems:"center", gap:8, animation:"fadeUp .3s ease" }}>
              <span style={{ fontSize:14 }}>✦</span>
              <span style={{ fontSize:12, color:C.living, fontWeight:500 }}>
                {isCreate ? "Member added to the Vault" : "Record committed to the Vault"}
              </span>
            </div>
          )}
          {saveError && (
            <div style={{ padding:"11px 14px", borderRadius:8, marginTop:8,
              background:"rgba(220,38,38,.12)", border:"1px solid rgba(239,68,68,.4)",
              display:"flex", alignItems:"center", gap:8, animation:"fadeUp .3s ease" }}>
              <span style={{ fontSize:14, color:"#f87171" }}>!</span>
              <span style={{ fontSize:12, color:"#fca5a5", fontWeight:500 }}>
                {saveError}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px", borderTop:`1px solid ${C.glassBorder}`,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:"rgba(255,255,255,.02)" }}>
          <button onClick={onClose} style={{ background:C.chip, border:`1px solid ${C.chipBorder}`,
            borderRadius:8, color:C.inkMid, padding:"8px 18px", fontSize:12 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            background:`linear-gradient(135deg,${C.cyan}CC,${C.paternal}CC)`,
            border:"none", borderRadius:8, color:"#fff", padding:"9px 22px",
            fontSize:12.5, fontWeight:600,
            boxShadow:`0 4px 20px ${C.cyanGlow}`,
            opacity:saving ? .7 : 1,
          }}>
            {saving ? (isCreate ? "Adding..." : "Committing...") : (isCreate ? "✦ Add to Vault" : "✦ Commit to Vault")}
          </button>
        </div>
      </div>
    </div>
  );
};

const ESection = ({ label, children }) => (
  <div style={{ marginBottom:20 }}>
    <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".12em",
      textTransform:"uppercase", color:C.cyan, marginBottom:12,
      display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.cyan}40,transparent)` }}/>
      {label}
      <div style={{ flex:1, height:1, background:`linear-gradient(270deg,${C.cyan}40,transparent)` }}/>
    </div>
    {children}
  </div>
);
const EField = ({ label, children }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
    <label style={{ fontSize:11, color:C.inkMid, fontWeight:500 }}>{label}</label>
    {children}
  </div>
);

// ══════════════════════════════════════════════════════════════════
//  TOP FILTER BAR — compact pills, center-mounted
// ══════════════════════════════════════════════════════════════════
const FilterDropdown = ({ id, open, setOpen, opts, onSelect, current, selectedValue }) => (
  <div style={{ position:"relative" }}>
    <button onClick={()=>setOpen(open===id?null:id)}
      style={{
        display:"flex", alignItems:"center", gap:6, padding:"6px 12px",
        borderRadius:99, fontSize:11.5, fontWeight:500,
        background: open===id ? `${current.col}20` : C.chip,
        border:`1px solid ${open===id ? `${current.col}60` : C.chipBorder}`,
        color: open===id ? current.col : C.inkMid,
        transition:"all .18s", backdropFilter:"blur(8px)",
      }}>
      <span style={{ fontSize:12 }}>{current.icon}</span>
      {current.label}
      <span style={{ fontSize:8, opacity:.5 }}>▾</span>
    </button>
    {open===id && (
      <div style={{
        position:"absolute", top:"calc(100% + 8px)", left:"50%",
        transform:"translateX(-50%)", zIndex:50,
        background:C.glass, border:`1px solid ${C.glassBorderHi}`,
        borderRadius:12, padding:6, minWidth:170,
        backdropFilter:"blur(20px)",
        boxShadow:"0 12px 40px rgba(0,0,0,.7)",
        animation:"fadeUp .2s ease",
      }}>
        {opts.map((o)=>(
          <button key={o.id} onClick={()=>{ onSelect(o.id); setOpen(null); }}
            style={{
              display:"flex", alignItems:"center", gap:9, padding:"8px 12px",
              borderRadius:8, width:"100%", fontSize:12, transition:"all .15s",
              background: selectedValue===o.id ? `${o.col}18` : "transparent",
              border:`1px solid ${selectedValue===o.id ? `${o.col}40` : "transparent"}`,
              color: selectedValue===o.id ? o.col : C.inkMid,
            }}>
            <span style={{ fontSize:13 }}>{o.icon}</span>
            {o.label}
            {selectedValue===o.id && <span style={{ marginLeft:"auto", fontSize:10, color:o.col }}>✓</span>}
          </button>
        ))}
      </div>
    )}
  </div>
);

const TopFilterBar = ({ filters, setFilters }) => {
  const [open, setOpen] = useState(null); // which dropdown is open

  const lineageOpts = [
    { id:"all",      icon:"⬡", label:"All Strands",    col:C.union },
    { id:"paternal", icon:"♂", label:"Paternal",       col:C.paternal },
    { id:"maternal", icon:"♀", label:"Maternal",       col:C.maternal },
    { id:"children", icon:"◈", label:"All Children",   col:C.cyan },
  ];
  const branchOpts = [
    { id:"all",    icon:"●", label:"All Branches",  col:C.inkMid },
    { id:"active", icon:"◉", label:"Living Only",   col:C.living },
    { id:"ended",  icon:"◌", label:"Ended Lines",   col:C.inkDim },
    { id:"recent", icon:"✦", label:"Recent",        col:C.gold },
  ];

  const curLineage = lineageOpts.find((o)=>o.id===filters.lineage) || lineageOpts[0];
  const curBranch  = branchOpts.find((o)=>o.id===filters.branch) || branchOpts[0];

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:6,
      position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
      zIndex:40, background:C.glass, border:`1px solid ${C.glassBorder}`,
      borderRadius:99, padding:"5px 8px",
      backdropFilter:"blur(20px)",
      boxShadow:"0 4px 24px rgba(0,0,0,.5)",
    }}
      onClick={e=>e.stopPropagation()}
    >
      {/* Galaxy badge — single view mode, no toggle needed */}
      <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 13px",
        borderRadius:99, fontSize:11, fontWeight:500,
        background:"rgba(255,255,255,.07)", border:`1px solid ${C.chipBorder}`,
        color:C.inkMid, letterSpacing:".04em" }}>
        ✦ Galaxy
      </div>

      <div style={{ width:1, height:20, background:C.chipBorder }}/>

      {/* Lineage dropdown */}
      <FilterDropdown id="lineage"
        open={open}
        setOpen={setOpen}
        opts={lineageOpts}
        current={curLineage}
        selectedValue={filters.lineage}
        onSelect={v=>setFilters(f=>({...f,lineage:v}))}/>

      {/* Branch dropdown */}
      <FilterDropdown id="branch"
        open={open}
        setOpen={setOpen}
        opts={branchOpts}
        current={curBranch}
        selectedValue={filters.branch}
        onSelect={v=>setFilters(f=>({...f,branch:v}))}/>

      <div style={{ width:1, height:20, background:C.chipBorder }}/>

      {/* Gen depth */}
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"0 8px" }}>
        <span style={{ fontSize:9.5, color:C.inkDim, whiteSpace:"nowrap" }}>Depth</span>
        {[1,2,3,4].map(d=>(
          <button key={d} onClick={()=>setFilters(f=>({...f,genDepth:d}))}
            style={{
              width:22, height:22, borderRadius:"50%", fontSize:10, fontWeight:600,
              background:filters.genDepth>=d?`${C.gen[d-1]}33`:"transparent",
              border:`1px solid ${filters.genDepth>=d?C.gen[d-1]:C.chipBorder}`,
              color:filters.genDepth>=d?C.gen[d-1]:C.inkDim,
              transition:"all .15s",
            }}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  TREE CANVAS (the main interactive field)
// ══════════════════════════════════════════════════════════════════
const TreeCanvas = ({ rootNode, filters, onNodeSelect }) => {
  const svgRef = useRef();
  const [hov, setHov] = useState(null);
  const [pan, setPan] = useState({ x:0, y:0 });
  const [drag, setDrag] = useState(null);
  const [zoom, setZoom] = useState(1);

  const W = 900, H = 660;
  const cx = W/2 + pan.x;
  const cy = H/2 + pan.y + 30;

  const { nodes, edges } = useMemo(
    () => (rootNode ? computeLayout(rootNode, cx, cy) : { nodes: [], edges: [] }),
    [rootNode, cx, cy]
  );

  const visNodes = useMemo(()=>nodes.filter(n=>n.generation<=filters.genDepth),[nodes,filters.genDepth]);
  const visEdges = useMemo(()=>{
    const visIds = new Set(visNodes.map(n=>n.id));
    return edges.filter(e=>visIds.has(e.toId));
  },[edges,visNodes]);

  useEffect(()=>{
    const el=svgRef.current;
    if(!el) return;
    const h=e=>{e.preventDefault();setZoom(z=>Math.max(.3,Math.min(2.8,z-e.deltaY*.001)));};
    el.addEventListener("wheel",h,{passive:false});
    return()=>el.removeEventListener("wheel",h);
  },[]);

  const onMD=e=>setDrag({sx:e.clientX,sy:e.clientY,px:pan.x,py:pan.y});
  const onMM=e=>{if(!drag)return;setPan({x:drag.px+(e.clientX-drag.sx),y:drag.py+(e.clientY-drag.sy)});};
  const onMU=()=>setDrag(null);

  const showPaternal = filters.lineage==="all"||filters.lineage==="paternal"||filters.lineage==="children";
  const showMaternal = filters.lineage==="all"||filters.lineage==="maternal"||filters.lineage==="children";

  return (
    <div style={{ position:"relative", flex:1, overflow:"hidden",
      background:`radial-gradient(ellipse 100% 100% at 50% 50%, #080530 0%, #03020F 55%, ${C.void} 100%)` }}>
      <Starfield/>

      {/* Bottom controls */}
      <div style={{ position:"absolute", bottom:14, right:14, zIndex:20,
        display:"flex", gap:5, alignItems:"center" }}>
        {[["＋",()=>setZoom(z=>Math.min(2.8,z+.25))],
          ["－",()=>setZoom(z=>Math.max(.3,z-.25))],
          ["⊙",()=>{setZoom(1);setPan({x:0,y:0});}]]
          .map(([l,a])=>(
          <button key={l} onClick={a} style={{
            width:32, height:32, borderRadius:8, fontSize:16,
            background:C.glass, border:`1px solid ${C.glassBorder}`,
            color:C.inkMid, backdropFilter:"blur(10px)", transition:"all .18s",
          }}>{l}</button>
        ))}
        <div style={{ padding:"5px 10px", borderRadius:8, background:C.glass,
          border:`1px solid ${C.glassBorder}`, fontSize:10, color:C.inkDim,
          fontFamily:F.mono, backdropFilter:"blur(10px)" }}>
          {Math.round(zoom*100)}%
        </div>
      </div>

      <svg ref={svgRef} width="100%" height="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ cursor:drag?"grabbing":"grab" }}
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>

        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="canopyGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="rgba(91,156,246,0.09)"/>
            <stop offset="50%" stopColor="rgba(167,139,250,0.06)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(240,192,64,0.18)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
        </defs>

        <g transform={`scale(${zoom})`} style={{transformOrigin:`${W/2}px ${H/2}px`}}>

          {/* Central nebula core glow */}
          <ellipse cx={cx} cy={cy} rx={380} ry={280} fill="url(#canopyGlow)"/>
          <ellipse cx={cx} cy={cy} rx={60} ry={60} fill="url(#coreGlow)"/>

          {/* Generation rings */}
          {RINGS.slice(1).map((r,i)=>(
            i < filters.genDepth && (
              <circle key={i} cx={cx} cy={cy} r={r}
                fill="none" stroke={C.gen[i+1]} strokeWidth={.5}
                strokeDasharray="3,9" opacity={.22}/>
            )
          ))}

          {/* Edges — dual strands */}
          {visEdges.map((e,i)=>{
            const mx=(e.fx+e.tx)/2, my=(e.fy+e.ty)/2;
            const dx=e.tx-e.fx, dy=e.ty-e.fy;
            const len=Math.sqrt(dx*dx+dy*dy)||1;
            const ox=-dy/len*9, oy=dx/len*9;
            const dimmed = filters.branch==="active"&&!e.active;
            return (
              <g key={i} opacity={dimmed?.15:1} style={{transition:"opacity .3s"}}>
                {/* Paternal strand */}
                {showPaternal && (
                  <path d={`M ${e.fx} ${e.fy} Q ${mx+ox} ${my+oy} ${e.tx} ${e.ty}`}
                    stroke={C.paternal} strokeWidth={e.active?1.8:1} fill="none"
                    opacity={e.active?.75:.3} strokeLinecap="round"/>
                )}
                {/* Maternal strand */}
                {showMaternal && (
                  <path d={`M ${e.fx} ${e.fy} Q ${mx-ox} ${my-oy} ${e.tx} ${e.ty}`}
                    stroke={C.maternal} strokeWidth={e.active?1.8:1} fill="none"
                    opacity={e.active?.75:.3} strokeLinecap="round"/>
                )}
                {/* Union midpoint */}
                {e.hasSpouse && e.active && showPaternal && showMaternal && (
                  <circle cx={(e.fx+mx)/2+ox/2} cy={(e.fy+my)/2+oy/2}
                    r={2} fill={C.union} opacity={.6}
                    style={{animation:"pulse 2.5s ease-in-out infinite"}}/>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {visNodes.map(n=>{
            const genCol  = C.gen[n.generation] || C.cyan;
            const isRoot  = n.generation===0;
            const r = isRoot?24 : n.generation===1?17 : n.generation===2?13 : 9;
            const isH = hov===n.id;
            const dimmed = filters.branch==="active"&&!n.isActive;
            const showMale   = filters.lineage!=="maternal";
            const showFemale = filters.lineage!=="paternal";
            if ((n.gender==="M"&&!showMale&&!isRoot) || (n.gender==="F"&&!showFemale&&!isRoot)) return null;
            const gCol = n.gender==="M"?C.paternal:C.maternal;

            return (
              <g key={n.id} style={{cursor:"pointer",opacity:dimmed?.15:1,transition:"opacity .3s"}}
                onClick={()=>onNodeSelect(n)}
                onMouseEnter={()=>setHov(n.id)}
                onMouseLeave={()=>setHov(null)}>

                {/* Hover/select ring */}
                {isH && <circle cx={n._x} cy={n._y} r={r+10} fill="none"
                  stroke={genCol} strokeWidth={1} opacity={.4}
                  style={{animation:"pulse 1.5s infinite"}}/>}

                {/* Root orbits */}
                {isRoot && (<>
                  <circle cx={n._x} cy={n._y} r={r+18} fill="none"
                    stroke={C.gold} strokeWidth={.5} strokeDasharray="2,7" opacity={.4}
                    style={{animation:"spinSlow 15s linear infinite",transformOrigin:`${n._x}px ${n._y}px`}}/>
                  <circle cx={n._x} cy={n._y} r={r+30} fill="none"
                    stroke={C.cyan} strokeWidth={.4} strokeDasharray="1,12" opacity={.25}
                    style={{animation:"spinRev 22s linear infinite",transformOrigin:`${n._x}px ${n._y}px`}}/>
                </>)}

                {/* Star body */}
                <circle cx={n._x} cy={n._y} r={r}
                  fill={`url(#starFill_${n.id})`}
                  stroke={isH?genCol:n.isActive?`${genCol}99`:`${genCol}40`}
                  strokeWidth={isH?2:1.2}
                  filter={isH?"url(#glow)":"none"}/>
                <defs>
                  <radialGradient id={`starFill_${n.id}`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={isH?genCol:`${genCol}CC`}/>
                    <stop offset="50%" stopColor={`${genCol}66`}/>
                    <stop offset="100%" stopColor={`${genCol}18`}/>
                  </radialGradient>
                </defs>

                {/* Specular */}
                <circle cx={n._x-r*.28} cy={n._y-r*.3} r={r*.28}
                  fill="rgba(255,255,255,.22)"/>

                {/* Gender */}
                <text x={n._x} y={n._y+r*.38} textAnchor="middle"
                  fontSize={r*.8} fill="rgba(255,255,255,.85)" fontFamily={F.body}>
                  {n.gender==="M"?"♂":"♀"}
                </text>

                {/* Spouse companion dot */}
                {n.spouse && (
                  <circle
                    cx={n._x + r + 8} cy={n._y - r*.3}
                    r={r*.38}
                    fill={`${n.spouse.gender==="M"?C.paternal:C.maternal}55`}
                    stroke={n.spouse.gender==="M"?C.paternal:C.maternal}
                    strokeWidth={.8} opacity={.8}/>
                )}

                {/* Active pulse */}
                {n.isActive && !isH && (
                  <circle cx={n._x} cy={n._y} r={r+5} fill="none"
                    stroke={genCol} strokeWidth={.5} opacity={.3}
                    style={{animation:`pulse ${2+n.generation*.4}s ease-in-out infinite`}}/>
                )}

                {/* Name */}
                <text x={n._x} y={n._y+r+14} textAnchor="middle"
                  fontSize={isRoot?10.5:9} fontFamily={isRoot?F.serif:F.body}
                  fill={isH?C.ink:C.inkMid} fontWeight={isRoot?600:400}
                  style={{transition:"fill .2s",pointerEvents:"none"}}>
                  {n.name.split(" ")[0]}
                </text>

                {/* "Click for planet view" hint on hover */}
                {isH && (
                  <text x={n._x} y={n._y+r+26} textAnchor="middle"
                    fontSize={8} fontFamily={F.mono} fill={C.cyan} opacity={.7}>
                    ✦ click for planet view
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Scroll hint */}
        <text x={W/2} y={H-6} textAnchor="middle" fontSize={9}
          fill={C.inkDim} fontFamily={F.mono} opacity={.4}>
          drag to pan · scroll to zoom · click any star for planetary view
        </text>
      </svg>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  ROOT APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [filters, setFilters] = useState({ viewMode:"galaxy", lineage:"all", branch:"all", genDepth:3 });
  const [planetNode, setPlanetNode] = useState(null);   // triggers zoom-in
  const [lineageNode, setLineageNode] = useState(null); // lineage modal
  const [editNode, setEditNode] = useState(null);       // edit modal
  const [createNode, setCreateNode] = useState(null);   // create modal
  const [branchNode, setBranchNode] = useState(null);   // branch panel
  const [rootNode, setRootNode] = useState(null);
  const [byIdMap, setByIdMap] = useState({});
  const [loadingTree, setLoadingTree] = useState(true);
  const [initializingRoot, setInitializingRoot] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [uiNotice, setUiNotice] = useState("");
  const noticeTimerRef = useRef(null);

  const loadFamily = useCallback(async () => {
    setLoadingTree(true);
    setLoadError("");
    try {
      const res = await fetch("/api/tree", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load family tree.");

      const normalized = normalizeFamilyTree(data);
      setRootNode(normalized.root);
      setByIdMap(normalized.byId);
    } catch (error) {
      console.error(error);
      setRootNode(null);
      setByIdMap({});
      setLoadError(error?.message || "Failed to load family tree.");
    } finally {
      setLoadingTree(false);
    }
  }, []);

  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  useEffect(() => {
    setPlanetNode((prev) => (prev ? byIdMap[prev.id] || null : prev));
    setLineageNode((prev) => (prev ? byIdMap[prev.id] || null : prev));
    setEditNode((prev) => (prev ? byIdMap[prev.id] || null : prev));
    setBranchNode((prev) => (prev ? byIdMap[prev.id] || null : prev));
  }, [byIdMap]);

  const showNotice = useCallback((message) => {
    setUiNotice(message);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => {
      setUiNotice("");
      noticeTimerRef.current = null;
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const handleNodeSelect = useCallback((node) => {
    setPlanetNode(node);
  }, []);

  const handleLineage = useCallback(() => {
    if (planetNode) setLineageNode(planetNode);
  }, [planetNode]);

  const handleEdit = useCallback(() => {
    if (!planetNode) return;
    if (isSyntheticMember(planetNode)) {
      showNotice("Vault Root is an aggregate view. Edit an actual family member node.");
      return;
    }
    setEditNode(planetNode);
  }, [planetNode, showNotice]);

  const handleBranch = useCallback(() => {
    if (planetNode) setBranchNode(planetNode);
  }, [planetNode]);

  const handleCreate = useCallback(() => {
    const selectedParent = planetNode && !isSyntheticMember(planetNode) ? planetNode : null;
    const nextGeneration = selectedParent ? Number(selectedParent.generation || 0) + 1 : 0;

    setCreateNode({
      id: "",
      name: "",
      born: "",
      died: "",
      location: "",
      role: "Member",
      gender: "M",
      isActive: true,
      spouse: null,
      spouseId: null,
      notes: "",
      generation: nextGeneration,
      isComplete: true,
      parentId: selectedParent?.id || null,
      parentName: selectedParent?.name || "",
      branch: selectedParent?.branch || "",
    });
  }, [planetNode]);

  const initializeFirstRoot = useCallback(async () => {
    if (initializingRoot) return;

    setInitializingRoot(true);
    setLoadError("");

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Dubey's",
          lastName: "",
          born: "1700",
          died: "",
          generation: 0,
          role: "Patriarch",
          gender: "M",
          isComplete: true,
        }),
      });

      let responseData = {};
      try {
        responseData = await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to initialize the first root.");
      }

      await loadFamily();
      showNotice("Initialized first root: Dubey's (1700, alive).");
    } catch (error) {
      console.error(error);
      setLoadError(error?.message || "Failed to initialize the first root.");
    } finally {
      setInitializingRoot(false);
    }
  }, [initializingRoot, loadFamily, showNotice]);

  const persistCreate = useCallback(async (formData) => {
    const parseJsonSafe = async (response) => {
      try {
        return await response.json();
      } catch {
        return {};
      }
    };

    const fullName = String(formData.name || "").trim();
    if (!fullName) throw new Error("Full name is required.");

    const parsedName = splitDisplayName(fullName, "", "");
    const payload = {
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      born: String(formData.born || ""),
      died: formData.isActive ? "" : String(formData.died || ""),
      location: String(formData.location || ""),
      city: String(formData.location || ""),
      role: String(formData.role || "Member"),
      notes: String(formData.notes || ""),
      generation: Number(formData.generation ?? 0),
      branch: String(formData.branch || ""),
      isComplete: true,
      gender: String(formData.gender || "M"),
      parentId: formData.parentId || null,
    };

    const createRes = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const createData = await parseJsonSafe(createRes);
    if (!createRes.ok) throw new Error(createData?.error || "Failed to create member.");

    const spouseName = String(formData.spouseName || "").trim();
    if (spouseName) {
      const spouseParsed = splitDisplayName(spouseName, "", "");
      const spouseRes = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: spouseParsed.firstName,
          lastName: spouseParsed.lastName,
          born: String(formData.spouseBorn || ""),
          gender: payload.gender === "M" ? "F" : "M",
          generation: payload.generation,
          role: "Spouse",
          location: payload.location,
          city: payload.city,
          spouseId: createData.id,
          isComplete: true,
          branch: payload.branch,
        }),
      });
      const spouseData = await parseJsonSafe(spouseRes);
      if (!spouseRes.ok) throw new Error(spouseData?.error || "Failed to create spouse.");
    }

    await loadFamily();
    const createdName = [parsedName.firstName, parsedName.lastName].filter(Boolean).join(" ").trim();
    if (formData.parentName) {
      showNotice(`Added ${createdName} under ${formData.parentName}.`);
    } else {
      showNotice(`Added ${createdName} as a new root member.`);
    }
  }, [loadFamily, showNotice]);

  const persistEdit = useCallback(async (formData) => {
    const parseJsonSafe = async (response) => {
      try {
        return await response.json();
      } catch {
        return {};
      }
    };

    const current = byIdMap?.[formData.id] || editNode || planetNode;
    if (!current?.id) throw new Error("Unable to resolve selected member.");
    if (isSyntheticMember(current)) {
      throw new Error("Aggregate root is visual-only and cannot be updated.");
    }

    const parsedName = splitDisplayName(formData.name, current.firstName, current.lastName);
    const nextDied = formData.isActive ? (formData.died || "") : (formData.died || current.died || "");

    const memberPayload = {
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      born: String(formData.born || ""),
      died: nextDied,
      location: String(formData.location || ""),
      city: String(formData.location || ""),
      role: String(formData.role || ""),
      notes: String(formData.notes || ""),
      generation: Number(formData.generation ?? current.generation ?? 0),
      branch: current.branch || "",
      isComplete: current.isComplete ?? true,
      gender: formData.gender,
    };

    const updateRes = await fetch(`/api/members/${current.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberPayload),
    });
    const updateData = await parseJsonSafe(updateRes);
    if (!updateRes.ok) throw new Error(updateData?.error || "Failed to update member.");

    const spouseName = String(formData.spouseName || "").trim();
    if (spouseName) {
      const spouseParsed = splitDisplayName(
        spouseName,
        current.spouse?.name?.split(" ")?.[0] || "",
        current.spouse?.name?.split(" ")?.slice(1).join(" ") || ""
      );
      const spousePayload = {
        firstName: spouseParsed.firstName,
        lastName: spouseParsed.lastName,
        born: String(formData.spouseBorn || current.spouse?.born || ""),
      };

      if (formData.spouseId) {
        const spouseRes = await fetch(`/api/members/${formData.spouseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(spousePayload),
        });
        const spouseData = await parseJsonSafe(spouseRes);
        if (!spouseRes.ok) throw new Error(spouseData?.error || "Failed to update spouse.");
      } else {
        const createSpouseRes = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...spousePayload,
            gender: formData.gender === "M" ? "F" : "M",
            generation: Number(formData.generation ?? current.generation ?? 0),
            role: "Spouse",
            location: String(formData.location || current.location || ""),
            city: String(formData.location || current.city || ""),
            spouseId: current.id,
            isComplete: true,
          }),
        });
        const createSpouseData = await parseJsonSafe(createSpouseRes);
        if (!createSpouseRes.ok) throw new Error(createSpouseData?.error || "Failed to create spouse.");
      }
    }

    await loadFamily();
  }, [byIdMap, editNode, planetNode, loadFamily]);

  const selectedCreateParent = planetNode && !isSyntheticMember(planetNode) ? planetNode : null;
  const showEmptyState = !loadingTree && !loadError && !rootNode;

  return (
    <>
      <GS/>
      <div style={{ display:"flex", flexDirection:"column", height:"100vh",
        background:C.void, color:C.ink, overflow:"hidden" }}>

        {/* TOP NAV */}
        <nav style={{ height:48, background:"rgba(5,3,15,.96)",
          borderBottom:`1px solid ${C.glassBorder}`,
          display:"flex", alignItems:"center", padding:"0 18px",
          gap:0, flexShrink:0, backdropFilter:"blur(20px)",
          boxShadow:"0 2px 24px rgba(0,0,0,.6)", zIndex:50 }}>

          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:30, height:30, borderRadius:8, display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:15,
              background:"linear-gradient(135deg,rgba(240,192,64,.22),rgba(34,211,238,.18))",
              border:`1px solid rgba(240,192,64,.3)`,
              boxShadow:`0 0 12px ${C.goldGlow}` }}>✦</div>
            <div>
              <div style={{ lineHeight:1 }}>
                <span style={{ fontFamily:F.display, fontSize:14, fontWeight:700,
                  letterSpacing:".08em", color:C.ink }}>VANSH</span>
                <span style={{ fontFamily:F.display, fontSize:14, fontWeight:400,
                  letterSpacing:".04em", color:C.gold }}>·VAULT</span>
              </div>
              <div style={{ fontSize:8.5, color:C.inkDim, letterSpacing:".12em",
                textTransform:"uppercase", marginTop:1 }}>Heritage Cosmos</div>
            </div>
          </div>

          {/* Right */}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", gap:4, padding:"4px 10px", borderRadius:99,
              background:C.chip, border:`1px solid ${C.chipBorder}`, alignItems:"center" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.paternal }}/>
              <span style={{ fontSize:10, color:C.inkMid }}>Paternal</span>
              <div style={{ width:1, height:10, background:C.chipBorder, margin:"0 2px" }}/>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.maternal }}/>
              <span style={{ fontSize:10, color:C.inkMid }}>Maternal</span>
              <div style={{ width:1, height:10, background:C.chipBorder, margin:"0 2px" }}/>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.union }}/>
              <span style={{ fontSize:10, color:C.inkMid }}>Bond</span>
            </div>
            <div style={{ width:28, height:28, borderRadius:"50%",
              background:`radial-gradient(circle at 35% 30%,${C.paternal}BB,${C.paternal}44)`,
              border:`1.5px solid ${C.paternal}88`, display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:12, color:C.paternal }}>
              ♂
            </div>
          </div>
        </nav>

        {/* MAIN CANVAS AREA */}
        <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
          <TreeCanvas rootNode={rootNode} filters={filters} onNodeSelect={handleNodeSelect}/>
          <TopFilterBar filters={filters} setFilters={setFilters}/>

          {uiNotice && (
            <div style={{ position:"absolute", top:18, left:"50%", transform:"translateX(-50%)",
              zIndex:45, background:"rgba(12,8,32,.92)", border:`1px solid ${C.glassBorderHi}`,
              borderRadius:10, padding:"8px 14px", color:C.amber, fontSize:11.5,
              boxShadow:"0 8px 28px rgba(0,0,0,.55)" }}>
              {uiNotice}
            </div>
          )}

          {loadingTree && (
            <div style={{ position:"absolute", inset:0, zIndex:35, display:"flex",
              alignItems:"center", justifyContent:"center",
              background:"rgba(2,1,10,.45)", color:C.cyan, fontFamily:F.mono, fontSize:12 }}>
              Syncing lineage from vault...
            </div>
          )}

          {!loadingTree && loadError && (
            <div style={{ position:"absolute", inset:0, zIndex:35, display:"flex",
              alignItems:"center", justifyContent:"center",
              background:"rgba(2,1,10,.65)", color:"#fda4af", fontFamily:F.body, fontSize:13 }}>
              {loadError}
            </div>
          )}

          {showEmptyState && (
            <div style={{ position:"absolute", inset:0, zIndex:35, display:"flex",
              alignItems:"center", justifyContent:"center",
              background:"rgba(2,1,10,.6)" }}>
              <div style={{
                width:"min(92vw, 520px)",
                borderRadius:16,
                border:`1px solid ${C.glassBorderHi}`,
                background:"linear-gradient(180deg, rgba(12,8,32,.92), rgba(5,3,15,.95))",
                boxShadow:"0 18px 60px rgba(0,0,0,.6)",
                padding:"22px 22px 18px",
                display:"grid",
                gap:12,
              }}>
                <div style={{ fontFamily:F.display, color:C.ink, fontSize:18, letterSpacing:".06em" }}>
                  Initialize Family Root
                </div>
                <div style={{ color:C.inkMid, fontSize:12.5, lineHeight:1.55 }}>
                  No family records are present. Start from scratch by creating the first root exactly as:
                  <span style={{ color:C.cyan }}> Dubey&apos;s</span>, born in
                  <span style={{ color:C.gold }}> 1700</span>, and marked alive.
                </div>
                <div style={{
                  border:`1px solid ${C.chipBorder}`,
                  borderRadius:10,
                  background:C.chip,
                  padding:"10px 12px",
                  color:C.inkMid,
                  fontSize:11.5,
                  fontFamily:F.mono,
                  lineHeight:1.7,
                  whiteSpace:"pre-line",
                }}>
                  name: Dubey&apos;s{"\n"}
                  birth year: 1700{"\n"}
                  status: alive
                </div>
                <button
                  type="button"
                  onClick={() => { void initializeFirstRoot(); }}
                  disabled={initializingRoot}
                  style={{
                    justifySelf:"start",
                    minWidth:210,
                    padding:"10px 14px",
                    borderRadius:10,
                    border:`1px solid ${C.cyan}`,
                    background:initializingRoot
                      ? "rgba(34,211,238,.18)"
                      : "linear-gradient(135deg, rgba(34,211,238,.32), rgba(91,156,246,.26))",
                    color:C.ink,
                    fontFamily:F.body,
                    fontSize:12,
                    fontWeight:600,
                    letterSpacing:".02em",
                    opacity:initializingRoot ? 0.75 : 1,
                    cursor:initializingRoot ? "wait" : "pointer",
                  }}
                >
                  {initializingRoot ? "Initializing..." : "Set First Root: Dubey's"}
                </button>
              </div>
            </div>
          )}

          {!showEmptyState && !loadingTree && !loadError && (
            <div style={{
              position:"absolute",
              right:14,
              bottom:58,
              zIndex:42,
              width:"min(90vw, 280px)",
              borderRadius:12,
              border:`1px solid ${C.glassBorderHi}`,
              background:"linear-gradient(180deg, rgba(12,8,32,.92), rgba(5,3,15,.95))",
              boxShadow:"0 12px 36px rgba(0,0,0,.55)",
              padding:"10px 12px",
              display:"grid",
              gap:8,
            }}>
              <div style={{ fontSize:10.5, letterSpacing:".1em", textTransform:"uppercase", color:C.cyan }}>
                Add New Member
              </div>
              <div style={{ fontSize:11, color:C.inkMid, lineHeight:1.45 }}>
                {selectedCreateParent
                  ? `Will be connected as child of ${selectedCreateParent.name}.`
                  : "No star selected. This creates a new root member."}
              </div>
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  justifySelf:"start",
                  padding:"8px 12px",
                  borderRadius:8,
                  border:`1px solid ${C.cyan}`,
                  background:"linear-gradient(135deg, rgba(34,211,238,.32), rgba(91,156,246,.26))",
                  color:C.ink,
                  fontSize:11.5,
                  fontWeight:600,
                }}
              >
                + Open Blank Form
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PLANETARY VIEW OVERLAY */}
      {planetNode && (
        <PlanetaryView
          node={planetNode}
          onClose={()=>setPlanetNode(null)}
          onLineage={handleLineage}
          onEdit={handleEdit}
          onBranch={handleBranch}
        />
      )}

      {/* BRANCH PANEL */}
      {branchNode && (
        <BranchPanel
          node={branchNode}
          byIdMap={byIdMap}
          onClose={()=>setBranchNode(null)}
          onNavigate={(n)=>{ setBranchNode(null); setPlanetNode(n); }}
        />
      )}

      {/* LINEAGE MODAL */}
      {lineageNode && (
        <LineageModal
          node={lineageNode}
          byIdMap={byIdMap}
          onClose={()=>setLineageNode(null)}
        />
      )}

      {/* EDIT MODAL */}
      {editNode && (
        <EditModal
          node={editNode}
          onClose={()=>setEditNode(null)}
          onSave={persistEdit}
        />
      )}

      {/* CREATE MODAL */}
      {createNode && (
        <EditModal
          node={createNode}
          mode="create"
          onClose={()=>setCreateNode(null)}
          onSave={persistCreate}
        />
      )}
    </>
  );
}


