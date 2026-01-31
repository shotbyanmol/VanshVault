import { NextResponse } from 'next/server';
import { write } from '@/lib/neo4j';

export async function POST(request) {
  try {
    const { name, dob, gender, city } = await request.json();

    // Basic validation
    if (!name || !dob || !gender || !city) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create Member node in Neo4j
    const cypher = `
      CREATE (m:Member {
        id: randomUUID(),
        name: $name,
        dob: $dob,
        gender: $gender,
        city: $city,
        created_at: datetime()
      })
      RETURN m
    `;

    const result = await write(cypher, { name, dob, gender, city });
    const member = result[0].get('m').properties;

    // Convert Neo4j dates/datetimes if necessary, usually properties are just objects
    // But for simple fields it works fine.

    return NextResponse.json({ message: 'Member created', member });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
