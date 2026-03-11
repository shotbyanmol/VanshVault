'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const DS = {
  colors: {
    bg: '#0A0D0F',
    surface: '#111518',
    surfaceElevated: '#161C20',
    surfaceBorder: '#1E2830',
    accent: '#4E9B6F',
    accentDim: 'rgba(78,155,111,0.08)',
    gold: '#C9A84C',
    goldSoft: 'rgba(201,168,76,0.15)',
    text: '#E8EDF0',
    textMuted: '#6B8090',
    textDim: '#3E5060',
    warn: '#D4914A',
    info: '#4A8FD4',
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
  },
  radii: { sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' },
};

const FALLBACK_FAMILY = {
  id: 'root',
  name: 'Elias Thornwood',
  born: '1891',
  died: '1967',
  generation: 0,
  role: 'Patriarch',
  location: 'Yorkshire, England',
  isComplete: true,
  children: [
    {
      id: 'c1', name: 'Margaret Thornwood', born: '1918', died: '1998', generation: 1, location: 'London, UK', isComplete: true, spouse: 'Harold Weston',
      children: [
        { id: 'c1a', name: 'Clara Weston', born: '1945', generation: 2, location: 'Bristol, UK', isComplete: true, children: [
          { id: 'c1a1', name: 'Sophie Weston', born: '1972', generation: 3, location: 'Edinburgh, UK', isComplete: true, children: [] },
          { id: 'c1a2', name: 'James Weston', born: '1975', generation: 3, location: 'Bristol, UK', isComplete: false, children: [] },
        ] },
        { id: 'c1b', name: 'Robert Weston', born: '1948', generation: 2, location: 'Oxford, UK', isComplete: true, children: [
          { id: 'c1b1', name: 'Liam Weston', born: '1978', generation: 3, location: 'New York, USA', isComplete: true, children: [] },
        ] },
      ],
    },
    {
      id: 'c2', name: 'Frederick Thornwood', born: '1921', died: '2003', generation: 1, location: 'Manchester, UK', isComplete: true, spouse: 'Dorothy Price',
      children: [
        { id: 'c2a', name: 'Arthur Thornwood', born: '1950', generation: 2, location: 'Manchester, UK', isComplete: true, children: [
          { id: 'c2a1', name: 'Oliver Thornwood', born: '1980', generation: 3, location: 'Toronto, CA', isComplete: true, children: [] },
          { id: 'c2a2', name: 'Emma Thornwood', born: '1983', generation: 3, location: 'Sydney, AU', isComplete: false, children: [] },
        ] },
      ],
    },
    {
      id: 'c3', name: 'Harriet Thornwood', born: '1925', generation: 1, location: 'Edinburgh, UK', isComplete: true, spouse: 'George Alderton',
      children: [
        { id: 'c3a', name: 'Violet Alderton', born: '1955', generation: 2, location: 'Paris, FR', isComplete: false, children: [] },
        { id: 'c3b', name: 'Thomas Alderton', born: '1958', generation: 2, location: 'Berlin, DE', isComplete: true, children: [
          { id: 'c3b1', name: 'Noah Alderton', born: '1989', generation: 3, location: 'Berlin, DE', isComplete: true, children: [] },
        ] },
      ],
    },
  ],
};

const flattenFamily = (node, result = []) => {
  result.push(node);
  (node.children || []).forEach((child) => flattenFamily(child, result));
  return result;
};

const Icon = ({ name, size = 16, color, style }) => {
  const icons = {
    person: 'M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v1h20v-1c0-3.3-6.7-5-10-5z',
    tree: 'M17 8C8 10 5.9 16.17 3.82 21L5.71 22l1.23-4.1A4.9 4.49 0 0012 20c1.9 0 2.3-1.2 2.3-2.3 0-1.2-1.8-2.8-2.4-3.8-2.8-2.2-4.6-6-8-8-2-2-5-3-5-3l1.5-1.5s3 4 6 4c0-3-3-7-3-7l2.5-1.5s2.4.9 4.5 2.5V2h2v2h2v-2h2v2h2v2c-6 .5-7.8 7-8.8 8.5s-3 4-4 4z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    location: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    warn: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    zoom: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z',
    rotate: 'M12 5V1L7 5l5 4V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color || 'currentColor'} style={style}>
      {icons[name] && <path d={icons[name]} />}
    </svg>
  );
};

const Avatar = ({ name, size = 36, incomplete }) => {
  const initials = name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hue = (name?.charCodeAt(0) || 0) * 17 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: DS.radii.full, background: `linear-gradient(135deg, hsl(${hue},40%,25%), hsl(${hue},50%,35%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 600, color: '#fff', border: incomplete ? `2px dashed ${DS.colors.warn}` : `2px solid ${DS.colors.surfaceBorder}`, flexShrink: 0, position: 'relative', overflow: 'hidden', fontFamily: DS.fonts.display }}>
      {initials}
      {incomplete && <div style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.35, height: size * 0.35, background: DS.colors.warn, borderRadius: '4px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.2, color: '#fff' }}>!</div>}
    </div>
  );
};

const Badge = ({ children, color = 'accent' }) => {
  const colors = {
    accent: { bg: DS.colors.accentDim, text: DS.colors.accent, border: 'rgba(78,155,111,0.3)' },
    gold: { bg: DS.colors.goldSoft, text: DS.colors.gold, border: 'rgba(201,168,76,0.3)' },
    warn: { bg: 'rgba(212,145,74,0.1)', text: DS.colors.warn, border: 'rgba(212,145,74,0.3)' },
    dim: { bg: 'rgba(255,255,255,0.04)', text: DS.colors.textMuted, border: DS.colors.surfaceBorder },
  };
  const c = colors[color];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: DS.radii.full, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 600, letterSpacing: '0.03em' }}>{children}</span>;
};

const TreeNode = ({ x, y, person, isRoot, isLeaf, isSelected, isHovered, onHover, onSelect, searchFocus }) => {
  const isMatch = searchFocus && person.name.toLowerCase().includes(searchFocus.toLowerCase());
  const r = isRoot ? 28 : isLeaf ? 14 : 20;
  const color = isRoot ? DS.colors.gold : !person.isComplete ? DS.colors.warn : DS.colors.accent;
  const fillColor = isSelected ? DS.colors.info : isHovered ? color : `${color}CC`;

  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }} onClick={() => onSelect(person)} onMouseEnter={() => onHover(person.id)} onMouseLeave={() => onHover(null)}>
      {(isSelected || isMatch) && <circle r={r + 10} fill="none" stroke={isSelected ? DS.colors.info : DS.colors.gold} strokeWidth="1.5" opacity="0.5" strokeDasharray="4,3" />}
      <circle r={r} fill={fillColor} stroke={isSelected ? DS.colors.info : color} strokeWidth={isSelected ? 2.5 : 1.5} style={{ filter: isHovered || isSelected ? `drop-shadow(0 0 8px ${color}80)` : 'none', transition: 'all 0.2s' }} />
      {isRoot && <text textAnchor="middle" dominantBaseline="middle" fontSize="14" fill={DS.colors.bg} fontFamily={DS.fonts.display}>{person.name?.slice(0, 1) || 'R'}</text>}
      {!person.isComplete && !isRoot && <text x={r - 5} y={-(r - 5)} fontSize="10" fill={DS.colors.warn} fontWeight="700">!</text>}
      <text y={r + 14} textAnchor="middle" fontSize={isRoot ? 11 : 9} fontWeight={isSelected ? 700 : 500} fill={isSelected ? DS.colors.text : DS.colors.textMuted} fontFamily={DS.fonts.body} style={{ pointerEvents: 'none' }}>{person.name?.split(' ')[0]}</text>
      {isRoot && <text y={r + 24} textAnchor="middle" fontSize={8} fill={DS.colors.textDim} fontFamily={DS.fonts.body}>{person.name?.split(' ').slice(1).join(' ')}</text>}
    </g>
  );
};

const PersonDetailPanel = ({ person, onClose }) => {
  const [tab, setTab] = useState('profile');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 20px 0', borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar name={person.name} size={48} incomplete={!person.isComplete} />
            <div>
              <div style={{ fontFamily: DS.fonts.display, fontWeight: 600, fontSize: 16, lineHeight: 1.2 }}>{person.name}</div>
              <div style={{ color: DS.colors.textMuted, fontSize: 11, marginTop: 3 }}>Generation {person.generation + 1}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: DS.colors.textMuted, cursor: 'pointer', padding: 4 }}><Icon name="close" size={16} /></button>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {['profile', 'family', 'contact'].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 14px', borderRadius: '6px 6px 0 0', fontSize: 12, fontWeight: tab === t ? 600 : 400, background: tab === t ? DS.colors.surfaceElevated : 'transparent', color: tab === t ? DS.colors.text : DS.colors.textMuted, border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge color={person.isComplete ? 'accent' : 'warn'}>{person.isComplete ? 'Complete' : 'Incomplete'}</Badge>
              {person.role && <Badge color="dim">{person.role}</Badge>}
              {person.died && <Badge color="dim">Deceased</Badge>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Born', person.born], ['Died', person.died || 'Living'], ['Location', person.location], ['Spouse', person.spouse || '—'], ['Children', person.children?.length || 0]].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: DS.colors.surfaceElevated, borderRadius: DS.radii.md }}>
                  <span style={{ color: DS.colors.textMuted, fontSize: 12 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'family' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {person.spouse && <div style={{ padding: '10px 12px', background: DS.colors.surfaceElevated, borderRadius: DS.radii.md, fontSize: 12 }}>Spouse: {person.spouse}</div>}
            {(person.children || []).map((child) => (
              <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: DS.colors.surfaceElevated, borderRadius: DS.radii.md }}>
                <Avatar name={child.name} size={26} incomplete={!child.isComplete} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{child.name}</div>
                  <div style={{ fontSize: 10, color: DS.colors.textMuted }}>b. {child.born || '?'} · {child.location || 'Unknown'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'contact' && (
          <div style={{ padding: '12px 14px', background: DS.colors.surfaceElevated, borderRadius: DS.radii.md, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="location" size={14} color={DS.colors.textMuted} />
            <span style={{ fontSize: 12 }}>{person.location || 'No location'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const normalizeTreeForView = (rawTree) => {
  if (!rawTree) return FALLBACK_FAMILY;
  const roots = Array.isArray(rawTree) ? rawTree : [rawTree];
  const idMap = new Map();

  const collect = (node) => {
    if (!node?.id || idMap.has(node.id)) return;
    const name = [node.firstName, node.lastName].filter(Boolean).join(' ').trim() || node.name || node.id;
    idMap.set(node.id, name);
    (node.children || []).forEach(collect);
  };
  roots.forEach(collect);

  const convert = (node) => ({
    id: node.id,
    name: [node.firstName, node.lastName].filter(Boolean).join(' ').trim() || node.name || 'Unknown',
    born: node.born || '',
    died: node.died || '',
    generation: Number(node.generation || 0),
    role: node.role || '',
    location: node.location || node.city || '',
    isComplete: node.isComplete !== false,
    spouse: node.spouse || (node.spouseId ? idMap.get(node.spouseId) : ''),
    children: (node.children || []).map(convert),
  });

  if (roots.length === 1) return convert(roots[0]);
  return { id: 'synthetic-root', name: 'Family Root', generation: 0, role: 'Root', location: '', isComplete: true, children: roots.map(convert) };
};

export default function HeritageTreeVisualization({ refreshTrigger = 0 }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [hovLeaf, setHovLeaf] = useState(null);
  const [searchFocus, setSearchFocus] = useState('');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [treeData, setTreeData] = useState(FALLBACK_FAMILY);
  const [fetchError, setFetchError] = useState('');
  const [isNarrow, setIsNarrow] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1200);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/tree');
        if (!res.ok) throw new Error('Failed to load tree');
        const raw = await res.json();
        if (!cancelled) {
          setTreeData(normalizeTreeForView(raw));
          setFetchError('');
        }
      } catch (error) {
        if (!cancelled) {
          setTreeData(FALLBACK_FAMILY);
          setFetchError('Using fallback sample view');
          console.error(error);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const allMembers = useMemo(() => flattenFamily(treeData), [treeData]);
  const summary = useMemo(() => {
    const generations = allMembers.length ? Math.max(...allMembers.map((m) => m.generation || 0)) + 1 : 0;
    const branches = Math.max(1, treeData.children?.length || 0);
    return { members: allMembers.length, generations, branches };
  }, [allMembers, treeData.children]);

  return (
    <div style={{ display: 'flex', flexDirection: isNarrow ? 'column' : 'row', height: isNarrow ? 'auto' : 'calc(100vh - 210px)', minHeight: 640, borderRadius: DS.radii.lg, border: `1px solid ${DS.colors.surfaceBorder}`, overflow: 'hidden', background: DS.colors.bg }}>
      <div style={{ width: isNarrow ? '100%' : 260, borderRight: isNarrow ? 'none' : `1px solid ${DS.colors.surfaceBorder}`, borderBottom: isNarrow ? `1px solid ${DS.colors.surfaceBorder}` : 'none', display: 'flex', flexDirection: 'column', background: DS.colors.surface }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
          <div style={{ fontFamily: DS.fonts.display, fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Explore Tree</div>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={13} color={DS.colors.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input placeholder="Find a person..." value={searchFocus} onChange={(e) => setSearchFocus(e.target.value)} style={{ paddingLeft: 30, fontSize: 12, width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.md, color: DS.colors.text }} />
          </div>
          {fetchError && <div style={{ marginTop: 8, fontSize: 11, color: DS.colors.warn }}>{fetchError}</div>}
        </div>

        <div style={{ padding: 16, borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DS.colors.textMuted, marginBottom: 10 }}>Legend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ color: DS.colors.gold, label: 'Patriarch / Matriarch' }, { color: DS.colors.accent, label: 'Complete Record' }, { color: DS.colors.warn, label: 'Incomplete Record' }, { color: DS.colors.info, label: 'Selected' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: DS.radii.full, background: color }} />
                <span style={{ fontSize: 11, color: DS.colors.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DS.colors.textMuted, marginBottom: 10 }}>Quick Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['Members', summary.members], ['Generations', summary.generations], ['Branches', summary.branches]].map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: DS.colors.surfaceElevated, borderRadius: DS.radii.sm }}>
                <span style={{ fontSize: 12, color: DS.colors.textMuted }}>{key}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: DS.colors.accent }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse at center, #0D1710 0%, ${DS.colors.bg} 70%)` }}>
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[{ icon: 'zoom', label: 'Zoom In', action: () => setZoom((z) => Math.min(2, z + 0.2)) }, { icon: 'search', label: 'Zoom Out', action: () => setZoom((z) => Math.max(0.4, z - 0.2)) }, { icon: 'rotate', label: 'Rotate', action: () => setRotation((r) => (r + 45) % 360) }].map(({ icon, label, action }) => (
            <button key={label} onClick={action} title={label} style={{ width: 36, height: 36, borderRadius: DS.radii.md, background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.colors.textMuted, cursor: 'pointer' }}><Icon name={icon} size={16} /></button>
          ))}
        </div>

        <svg ref={svgRef} width="100%" height="100%" viewBox="-400 -50 800 650" style={{ transition: 'transform 0.3s ease', cursor: isDragging ? 'grabbing' : 'grab' }} onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }); }} onMouseMove={(e) => { if (isDragging && dragStart) setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }} onMouseUp={() => { setIsDragging(false); setDragStart(null); }} onMouseLeave={() => { setIsDragging(false); setDragStart(null); }}>
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(78,155,111,0.08)" /><stop offset="100%" stopColor="rgba(0,0,0,0)" /></radialGradient>
            <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#7A5230" /><stop offset="100%" stopColor="#3D2010" /></linearGradient>
          </defs>

          <g transform={`translate(${panOffset.x},${panOffset.y}) scale(${zoom}) rotate(${rotation}, 0, 300)`}>
            <ellipse cx="0" cy="250" rx="350" ry="280" fill="url(#bgGlow)" />
            <ellipse cx="0" cy="580" rx="120" ry="18" fill="rgba(60,35,15,0.4)" />
            <path d="M -18 580 C -20 520, -12 450, -8 400 C -5 360, 2 320, 0 280 C -3 240, 8 200, 5 170" stroke="url(#trunkGrad)" strokeWidth="28" fill="none" strokeLinecap="round" />
            <path d="M 8 430 C 10 420, 14 410, 18 400 C 22 390, 16 380, 12 370" stroke="#5C3D2E" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.6" />

            <TreeNode x={0} y={140} person={treeData} isRoot isSelected={selectedPerson?.id === treeData.id} isHovered={hovLeaf === treeData.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />

            <path d="M 0 200 C -80 200, -150 250, -180 300" stroke="#6B4C38" strokeWidth="14" fill="none" strokeLinecap="round" />
            <path d="M -180 300 C -200 320, -220 340, -210 370" stroke="#7A5230" strokeWidth="10" fill="none" strokeLinecap="round" />

            {(treeData.children?.[0] ? [treeData.children[0]] : []).map((branch) => (
              <g key={branch.id}>
                <TreeNode x={-180} y={295} person={branch} isSelected={selectedPerson?.id === branch.id} isHovered={hovLeaf === branch.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                {(branch.children || []).map((child, ci) => (
                  <g key={child.id}>
                    <TreeNode x={-270 + ci * 90} y={355} person={child} isSelected={selectedPerson?.id === child.id} isHovered={hovLeaf === child.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                    {(child.children || []).map((grand, gci) => (
                      <g key={grand.id}>
                        <path d={`M ${-270 + ci * 90} 390 C ${-270 + ci * 90} 410, ${-290 + ci * 90 + gci * 60} 420, ${-290 + ci * 90 + gci * 60} 440`} stroke="#5A4030" strokeWidth="3" fill="none" />
                        <TreeNode x={-290 + ci * 90 + gci * 60} y={445} person={grand} isSelected={selectedPerson?.id === grand.id} isHovered={hovLeaf === grand.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} isLeaf />
                      </g>
                    ))}
                  </g>
                ))}
              </g>
            ))}

            <path d="M 5 180 C 60 180, 120 220, 140 270" stroke="#6B4C38" strokeWidth="14" fill="none" strokeLinecap="round" />
            {(treeData.children?.[1] ? [treeData.children[1]] : []).map((branch) => (
              <g key={branch.id}>
                <TreeNode x={145} y={265} person={branch} isSelected={selectedPerson?.id === branch.id} isHovered={hovLeaf === branch.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                {(branch.children || []).map((child, ci) => (
                  <g key={child.id}>
                    <path d={`M 145 300 C 145 320, ${120 + ci * 60} 335, ${120 + ci * 60} 360`} stroke="#5A4030" strokeWidth="4" fill="none" />
                    <TreeNode x={120 + ci * 60} y={362} person={child} isSelected={selectedPerson?.id === child.id} isHovered={hovLeaf === child.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                    {(child.children || []).map((grand, gci) => (
                      <g key={grand.id}>
                        <path d={`M ${120 + ci * 60} 395 L ${100 + ci * 60 + gci * 55} 435`} stroke="#5A4030" strokeWidth="2.5" fill="none" />
                        <TreeNode x={100 + ci * 60 + gci * 55} y={440} person={grand} isSelected={selectedPerson?.id === grand.id} isHovered={hovLeaf === grand.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} isLeaf />
                      </g>
                    ))}
                  </g>
                ))}
              </g>
            ))}

            <path d="M 3 155 C 100 150, 200 180, 230 230" stroke="#6B4C38" strokeWidth="12" fill="none" strokeLinecap="round" />
            {(treeData.children?.[2] ? [treeData.children[2]] : []).map((branch) => (
              <g key={branch.id}>
                <TreeNode x={238} y={228} person={branch} isSelected={selectedPerson?.id === branch.id} isHovered={hovLeaf === branch.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                {(branch.children || []).map((child, ci) => (
                  <g key={child.id}>
                    <path d={`M 238 265 C 238 285, ${200 + ci * 70} 300, ${200 + ci * 70} 325`} stroke="#5A4030" strokeWidth="4" fill="none" />
                    <TreeNode x={200 + ci * 70} y={328} person={child} isSelected={selectedPerson?.id === child.id} isHovered={hovLeaf === child.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                    {(child.children || []).map((grand, gci) => (
                      <g key={grand.id}>
                        <path d={`M ${200 + ci * 70} 360 L ${185 + ci * 70 + gci * 40} 400`} stroke="#5A4030" strokeWidth="2.5" fill="none" />
                        <TreeNode x={185 + ci * 70 + gci * 40} y={405} person={grand} isSelected={selectedPerson?.id === grand.id} isHovered={hovLeaf === grand.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} isLeaf />
                      </g>
                    ))}
                  </g>
                ))}
              </g>
            ))}
          </g>
        </svg>

        <div style={{ position: 'absolute', top: 16, left: 16, background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.md, padding: '8px 12px', fontSize: 11, color: DS.colors.textMuted }}>Interactive 2.5D Tree</div>
      </div>

      <div style={{ width: isNarrow ? '100%' : 300, borderLeft: isNarrow ? 'none' : `1px solid ${DS.colors.surfaceBorder}`, borderTop: isNarrow ? `1px solid ${DS.colors.surfaceBorder}` : 'none', background: DS.colors.surface, display: 'flex', flexDirection: 'column', minHeight: isNarrow ? 340 : 'auto' }}>
        {selectedPerson ? (
          <PersonDetailPanel person={selectedPerson} onClose={() => setSelectedPerson(null)} />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: DS.radii.full, background: DS.colors.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: `1px solid ${DS.colors.surfaceBorder}` }}><Icon name="person" size={28} color={DS.colors.textDim} /></div>
            <div style={{ fontFamily: DS.fonts.display, fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No one selected</div>
            <div style={{ color: DS.colors.textMuted, fontSize: 12, lineHeight: 1.7 }}>Click any node on the tree to view profile and family connections</div>
          </div>
        )}
      </div>
    </div>
  );
}

