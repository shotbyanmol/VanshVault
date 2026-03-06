import { NextResponse } from 'next/server';
import { read, write } from '@/lib/neo4j';

// GET: Fetch all members for the dropdown
export async function GET() {
  try {
    const cypher = `
      MATCH (m:Member)
      RETURN m.id AS id, m.name AS name, m.gender AS gender
      ORDER BY m.created_at DESC
    `;
    const result = await read(cypher);

    const members = result.map((record) => ({
      id: record.get('id'),
      name: record.get('name'),
      gender: record.get('gender'),
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new member and link potential relationship
export async function POST(request) {
  try {
    const { 
      name, 
      dob, 
      gender, 
      city, 
      relatedNodeId, 
      relationType, // 'PARENT_OF' or 'MARRIED_TO'
      isRoot 
    } = await request.json();

    // Basic validation
    if (!name || !dob || !gender || !city) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!isRoot && (!relatedNodeId || !relationType)) {
      return NextResponse.json(
        { error: 'Related member and relationship type are required for non-root members' },
        { status: 400 }
      );
    }

    // 1. Create the new Member node (isolated first)
    // We use a transaction or just simple cypher. merging it into one query is safer.
    
    let cypher;
    const params = { name, dob, gender, city };

    if (isRoot) {
      // Create isolated root node
      cypher = `
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
    } else {
      // Create node AND link to existing node
      // Logic:
      // MATCH (existing:Member {id: $relatedNodeId})
      // CREATE (newMember:Member { ... })
      // CREATE (existing)-[:RELATION_TYPE]->(newMember)
      
      params.relatedNodeId = relatedNodeId;

      // Validate Relation Type to prevent injection
      const validRelations = ['PARENT_OF', 'MARRIED_TO'];
      if (!validRelations.includes(relationType)) {
         return NextResponse.json({ error: 'Invalid relationship type' }, { status: 400 });
      }

      cypher = `
        MATCH (existing:Member {id: $relatedNodeId})
        CREATE (m:Member {
          id: randomUUID(),
          name: $name,
          dob: $dob,
          gender: $gender,
          city: $city,
          created_at: datetime()
        })
        MERGE (existing)-[:${relationType}]->(m)
        RETURN m
      `;
    }

    const result = await write(cypher, params);
    
    if (result.length === 0) {
       // This might happen if relatedNodeId wasn't found
       if (!isRoot) {
         return NextResponse.json({ error: 'Related member not found' }, { status: 404 });
       }
    }

    const member = result[0].get('m').properties;

    return NextResponse.json({ message: 'Member created', member });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
