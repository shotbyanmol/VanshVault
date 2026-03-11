import { NextResponse } from 'next/server';
import { write } from '@/lib/neo4j';

// POST: Create a relationship
export async function POST(request) {
  try {
    const { fromId, toId, type } = await request.json();
    
    if (!fromId || !toId || !type) {
      return NextResponse.json({ error: 'fromId, toId, and type are required' }, { status: 400 });
    }

    const validTypes = ['PARENT_OF', 'MARRIED_TO', 'SIBLING_OF'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid relationship type' }, { status: 400 });
    }

    let query = '';
    if (type === 'MARRIED_TO') {
      // Bi-directional for marriage
      query = `
        MATCH (a:Member {id: $fromId}), (b:Member {id: $toId})
        MERGE (a)-[:MARRIED_TO]->(b)
        MERGE (b)-[:MARRIED_TO]->(a)
        RETURN a, b
      `;
    } else {
      query = `
        MATCH (a:Member {id: $fromId}), (b:Member {id: $toId})
        MERGE (a)-[:${type}]->(b)
        RETURN a, b
      `;
    }

    const result = await write(query, { fromId, toId });
    if (result.length === 0) {
      return NextResponse.json({ error: 'One or both members not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating relationship:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a relationship
export async function DELETE(request) {
  try {
    const { fromId, toId, type } = await request.json();
    
    if (!fromId || !toId || !type) {
      return NextResponse.json({ error: 'fromId, toId, and type are required' }, { status: 400 });
    }

    let query = '';
    if (type === 'MARRIED_TO') {
      query = `
        MATCH (a:Member {id: $fromId})-[r:MARRIED_TO]-(b:Member {id: $toId})
        DELETE r
        RETURN count(r) as deleted
      `;
    } else {
      query = `
        MATCH (a:Member {id: $fromId})-[r:${type}]->(b:Member {id: $toId})
        DELETE r
        RETURN count(r) as deleted
      `;
    }

    const result = await write(query, { fromId, toId });
    const count = result[0].get('deleted');

    return NextResponse.json({ success: count > 0 });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
