import { NextResponse } from 'next/server';
import { read, write } from '@/lib/neo4j';

async function resolveMemberId(paramsLike, request) {
  let resolvedParams = paramsLike;
  if (paramsLike && typeof paramsLike.then === 'function') {
    resolvedParams = await paramsLike;
  }

  let id = resolvedParams?.id;
  if (!id && request?.url) {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/members\/([^/]+)\/?$/);
    id = match?.[1];
  }

  return typeof id === 'string' ? id : '';
}

// GET: Fetch single member with relatives
export async function GET(request, { params }) {
  const id = await resolveMemberId(params, request);
  if (!id) {
    return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
  }

  try {
    // 1. Fetch the member
    const memberQuery = `
      MATCH (m:Member {id: $id})
      RETURN m
    `;
    const memberResult = await read(memberQuery, { id });
    if (memberResult.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    const member = memberResult[0].get('m').properties;

    // 2. Fetch relatives (parent, spouse, children)
    const relativesQuery = `
      MATCH (m:Member {id: $id})
      OPTIONAL MATCH (p:Member)-[:PARENT_OF]->(m)
      OPTIONAL MATCH (m)-[:MARRIED_TO]-(s:Member)
      OPTIONAL MATCH (m)-[:PARENT_OF]->(c:Member)
      RETURN p, s, collect(c) as children
    `;
    const relativesResult = await read(relativesQuery, { id });
    
    if (relativesResult.length > 0) {
      const p = relativesResult[0].get('p');
      const s = relativesResult[0].get('s');
      const c = relativesResult[0].get('children');
      
      member.parent = p ? p.properties : null;
      member.spouse = s ? s.properties : null;
      member.children = c.map(node => node.properties);
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update member
export async function PUT(request, { params }) {
  const id = await resolveMemberId(params, request);
  if (!id) {
    return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
  }

  try {
    const data = await request.json();
    
    // Dynamically build properties to update
    const props = [];
    const updateParams = { id };
    
    const allowedKeys = [
      'firstName', 'lastName', 'born', 'died', 'location', 
      'city', 'country', 'phone', 'email', 'photo', 
      'role', 'notes', 'isComplete', 'generation', 'branch', 'gender'
    ];
    
    allowedKeys.forEach(key => {
      if (data[key] !== undefined) {
        if (key === 'generation') {
          props.push(`m.${key} = toInteger($${key})`);
          updateParams[key] = data[key];
        } else {
          props.push(`m.${key} = $${key}`);
          updateParams[key] = data[key];
        }
      }
    });

    if (props.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const query = `
      MATCH (m:Member {id: $id})
      SET ${props.join(', ')}
      RETURN m
    `;
    
    const result = await write(query, updateParams);
    if (result.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0].get('m').properties);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove member
export async function DELETE(request, { params }) {
  const id = await resolveMemberId(params, request);
  if (!id) {
    return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
  }

  try {
    const query = `
      MATCH (m:Member {id: $id})
      DETACH DELETE m
      RETURN count(m) as deleted
    `;
    const result = await write(query, { id });
    const count = result[0].get('deleted');
    
    if (count === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
