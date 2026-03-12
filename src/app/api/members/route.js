import { NextResponse } from 'next/server';
import { read, write } from '@/lib/neo4j';

const RESET_CONFIRM_TOKEN = 'YES_RESET_TREE';
const toNumber = (value) => (typeof value?.toNumber === 'function' ? value.toNumber() : Number(value || 0));

// GET: Fetch all members with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const gen = searchParams.get('gen');
    const complete = searchParams.get('complete');
    
    let query = `
      MATCH (m:Member)
      WHERE 1=1
    `;
    
    const params = {};
    
    if (search) {
      query += ` AND (toLower(m.firstName) CONTAINS toLower($search) OR toLower(m.lastName) CONTAINS toLower($search))`;
      params.search = search;
    }
    
    if (gen !== null && gen !== '') {
      query += ` AND m.generation = toInteger($gen)`;
      params.gen = gen;
    }
    
    if (complete === 'true') {
      query += ` AND m.isComplete = true`;
    } else if (complete === 'false') {
      query += ` AND m.isComplete = false`;
    }
    
    query += `
      RETURN m
      ORDER BY m.generation ASC, m.lastName ASC
    `;
    
    const result = await read(query, params);
    const members = result.map(record => record.get('m').properties);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new member
export async function POST(request) {
  try {
    const data = await request.json();
    const parentId = String(data.parentId || '').trim();
    const spouseId = String(data.spouseId || '').trim();
    
    // Basic validation
    if (!String(data.firstName || '').trim()) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    if (parentId && spouseId) {
      return NextResponse.json(
        { error: 'Only one relation is allowed at creation time. Provide either parentId or spouseId.' },
        { status: 400 }
      );
    }

    const existingCountResult = await read(`MATCH (m:Member) RETURN count(m) AS total`);
    const existingCount = toNumber(existingCountResult[0]?.get('total'));

    if (existingCount > 0 && !parentId && !spouseId) {
      return NextResponse.json(
        { error: 'parentId is required when adding a new member to an existing tree.' },
        { status: 400 }
      );
    }

    if (parentId) {
      const parentExistsResult = await read(
        `MATCH (p:Member {id: $parentId}) RETURN count(p) AS total`,
        { parentId }
      );
      if (toNumber(parentExistsResult[0]?.get('total')) === 0) {
        return NextResponse.json({ error: 'Selected parent member was not found' }, { status: 404 });
      }
    }

    if (spouseId) {
      const spouseExistsResult = await read(
        `MATCH (s:Member {id: $spouseId}) RETURN count(s) AS total`,
        { spouseId }
      );
      if (toNumber(spouseExistsResult[0]?.get('total')) === 0) {
        return NextResponse.json({ error: 'Selected spouse member was not found' }, { status: 404 });
      }
    }
    
    const query = `
      CREATE (m:Member {
        id: randomUUID(),
        firstName: $firstName,
        lastName: $lastName,
        gender: $gender,
        born: $born,
        died: $died,
        location: $location,
        city: $city,
        country: $country,
        phone: $phone,
        email: $email,
        photo: $photo,
        role: $role,
        notes: $notes,
        isComplete: $isComplete,
        generation: toInteger($generation),
        branch: $branch,
        created_at: datetime()
      })
      RETURN m
    `;
    
    const params = {
      firstName: String(data.firstName || '').trim(),
      lastName: String(data.lastName || '').trim(),
      gender: data.gender || null,
      born: data.born || '',
      died: data.died || null,
      location: data.location || '',
      city: data.city || null,
      country: data.country || null,
      phone: data.phone || null,
      email: data.email || null,
      photo: data.photo || null,
      role: data.role || null,
      notes: data.notes || null,
      isComplete: data.isComplete ?? false,
      generation: data.generation ?? 0,
      branch: data.branch || null
    };
    
    const result = await write(query, params);
    const member = result[0].get('m').properties;
    
    // If a parent or spouse was provided, create those relationships too
    if (parentId) {
      await write(`
        MATCH (p:Member {id: $parentId}), (m:Member {id: $memberId})
        MERGE (p)-[:PARENT_OF]->(m)
      `, { parentId, memberId: member.id });
    }
    
    if (spouseId) {
      await write(`
        MATCH (s:Member {id: $spouseId}), (m:Member {id: $memberId})
        MERGE (s)-[:MARRIED_TO]->(m)
        MERGE (m)-[:MARRIED_TO]->(s)
      `, { spouseId, memberId: member.id });
    }
    
    return NextResponse.json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Reset all members and relationships
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const confirm = searchParams.get('confirm');
  if (confirm !== RESET_CONFIRM_TOKEN) {
    return NextResponse.json(
      { error: `Reset blocked. Pass confirm=${RESET_CONFIRM_TOKEN} to continue.` },
      { status: 400 }
    );
  }

  try {
    const query = `
      MATCH (m:Member)
      DETACH DELETE m
      RETURN count(*) AS deleted
    `;
    const result = await write(query);
    const deletedRaw = result[0]?.get('deleted') ?? 0;
    const deleted = typeof deletedRaw?.toNumber === 'function'
      ? deletedRaw.toNumber()
      : Number(deletedRaw || 0);

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Error resetting members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
