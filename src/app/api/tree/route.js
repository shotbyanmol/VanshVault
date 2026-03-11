import { NextResponse } from 'next/server';
import { read } from '@/lib/neo4j';

const yearOrInfinity = (value) => {
  if (value === null || value === undefined || value === '') return Number.POSITIVE_INFINITY;
  const match = String(value).match(/\d{3,4}/);
  if (!match) return Number.POSITIVE_INFINITY;
  const numericYear = Number(match[0]);
  return Number.isFinite(numericYear) ? numericYear : Number.POSITIVE_INFINITY;
};

const pickCanonicalRoot = (left, right) => {
  const leftChildren = (left.children || []).length;
  const rightChildren = (right.children || []).length;
  if (leftChildren !== rightChildren) return leftChildren > rightChildren ? left : right;

  const leftGeneration = Number(left.generation ?? Number.MAX_SAFE_INTEGER);
  const rightGeneration = Number(right.generation ?? Number.MAX_SAFE_INTEGER);
  if (leftGeneration !== rightGeneration) return leftGeneration < rightGeneration ? left : right;

  const leftBorn = yearOrInfinity(left.born);
  const rightBorn = yearOrInfinity(right.born);
  if (leftBorn !== rightBorn) return leftBorn < rightBorn ? left : right;

  const leftName = [left.firstName, left.lastName].filter(Boolean).join(' ').trim().toLowerCase();
  const rightName = [right.firstName, right.lastName].filter(Boolean).join(' ').trim().toLowerCase();
  if (leftName && rightName && leftName !== rightName) return leftName < rightName ? left : right;

  return String(left.id) < String(right.id) ? left : right;
};

const dedupeSpousalRoots = (roots) => {
  if (roots.length <= 1) return roots;

  const rootsById = new Map(roots.map((root) => [root.id, root]));
  const suppressedIds = new Set();

  for (const root of roots) {
    if (suppressedIds.has(root.id)) continue;

    const spouseId = root.spouseId;
    if (!spouseId || !rootsById.has(spouseId)) continue;

    const spouseRoot = rootsById.get(spouseId);
    if (!spouseRoot || suppressedIds.has(spouseRoot.id)) continue;
    if (spouseRoot.spouseId !== root.id) continue;

    const canonical = pickCanonicalRoot(root, spouseRoot);
    const duplicate = canonical.id === root.id ? spouseRoot : root;

    const canonicalChildIds = new Set((canonical.children || []).map((child) => child.id));
    (duplicate.children || []).forEach((child) => {
      if (!canonicalChildIds.has(child.id)) {
        canonical.children.push(child);
        canonicalChildIds.add(child.id);
      }
    });

    suppressedIds.add(duplicate.id);
  }

  return roots.filter((root) => !suppressedIds.has(root.id));
};

// GET: Fetch the complete nested tree
export async function GET() {
  try {
    const query = `
      MATCH (m:Member)
      OPTIONAL MATCH (p:Member)-[:PARENT_OF]->(m)
      WITH m, collect(DISTINCT p.id) as parentIds
      OPTIONAL MATCH (m)-[:MARRIED_TO]-(s:Member)
      RETURN m, parentIds, collect(DISTINCT s.id) as spouseIds
    `;

    const result = await read(query);

    const membersMap = {};
    const rootCandidates = [];

    // First pass: Create all member objects
    result.forEach((record) => {
      const m = record.get('m').properties;
      const parentIds = (record.get('parentIds') || []).filter(Boolean);
      const spouseIds = (record.get('spouseIds') || []).filter(Boolean);

      membersMap[m.id] = {
        ...m,
        parentId: parentIds[0] || null,
        spouseId: spouseIds[0] || null,
        children: [],
      };
    });

    // Second pass: Link children and find roots
    Object.values(membersMap).forEach((member) => {
      if (member.parentId && membersMap[member.parentId]) {
        membersMap[member.parentId].children.push(member);
      } else {
        rootCandidates.push(member);
      }
    });

    const roots = dedupeSpousalRoots(rootCandidates);
    return NextResponse.json(roots.length === 1 ? roots[0] : roots);
  } catch (error) {
    console.error('Error fetching tree:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
