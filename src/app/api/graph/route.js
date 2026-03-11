import { NextResponse } from 'next/server';
import { read } from '@/lib/neo4j';

export async function GET() {
  try {
    // Fetch all members and any outgoing relationships
    const cypher = `
      MATCH (n:Member)
      OPTIONAL MATCH (n)-[r]->(m:Member)
      RETURN n, r, m
    `;
    
    const result = await read(cypher);

    const nodesMap = new Map();
    const edgesMap = new Map();

    result.forEach((record) => {
      const n = record.get('n');
      const r = record.get('r');
      const m = record.get('m');

      // Add Source Node
      if (n && !nodesMap.has(n.properties.id)) {
        nodesMap.set(n.properties.id, {
          group: 'nodes',
          data: {
            id: n.properties.id,
            label: [n.properties.firstName, n.properties.lastName].filter(Boolean).join(' ') || n.properties.id,
            gender: n.properties.gender,
          },
        });
      }

      // Add Target Node (if exists)
      if (m && !nodesMap.has(m.properties.id)) {
        nodesMap.set(m.properties.id, {
          group: 'nodes',
          data: {
            id: m.properties.id,
            label: [m.properties.firstName, m.properties.lastName].filter(Boolean).join(' ') || m.properties.id,
            gender: m.properties.gender,
          },
        });
      }

      // Add Edge (if exists)
      if (r) {
        // Neo4j driver returns integers for identity, but we prefer using UUIDs if available or elementId
        // However, the relationship object 'r' has 'startNodeElementId' and 'endNodeElementId' in newer versions,
        // or we rely on 'n' and 'm' UUIDs which is safer for our app logic.
        
        // We know r connects n -> m because of the query pattern (n)-[r]->(m)
        const edgeId = r.elementId || r.identity.toString();
        
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            group: 'edges',
            data: {
              id: edgeId,
              source: n.properties.id, // Using UUIDs matches the node IDs we set above
              target: m.properties.id,
              type: r.type,
            },
          });
        }
      }
    });

    const elements = [...nodesMap.values(), ...edgesMap.values()];

    return NextResponse.json({ elements });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
