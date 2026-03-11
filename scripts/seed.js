const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '.env.local' });

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER;
const PASSWORD = process.env.NEO4J_PASSWORD;

if (!URI || !USER || !PASSWORD) {
  console.error('Neo4j credentials not found in .env.local');
  process.exit(1);
}

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

const SAMPLE_FAMILY = {
  name: "Elias Thornwood", born: "1891", died: "1967", role: "Patriarch", location: "Yorkshire, England", isComplete: true, generation: 0,
  children: [
    {
      name: "Margaret Thornwood", born: "1918", died: "1998", generation: 1, location: "London, UK", isComplete: true, spouse: "Harold Weston",
      children: [
        { name: "Clara Weston", born: "1945", generation: 2, location: "Bristol, UK", isComplete: true,
          children: [
            { name: "Sophie Weston", born: "1972", generation: 3, location: "Edinburgh, UK", isComplete: true, children: [] },
            { name: "James Weston", born: "1975", generation: 3, location: "Bristol, UK", isComplete: false, children: [] },
          ]
        },
        { name: "Robert Weston", born: "1948", generation: 2, location: "Oxford, UK", isComplete: true,
          children: [
            { name: "Liam Weston", born: "1978", generation: 3, location: "New York, USA", isComplete: true, children: [] },
          ]
        },
      ],
    },
    {
      name: "Frederick Thornwood", born: "1921", died: "2003", generation: 1, location: "Manchester, UK", isComplete: true, spouse: "Dorothy Price",
      children: [
        { name: "Arthur Thornwood", born: "1950", generation: 2, location: "Manchester, UK", isComplete: true,
          children: [
            { name: "Oliver Thornwood", born: "1980", generation: 3, location: "Toronto, CA", isComplete: true, children: [] },
            { name: "Emma Thornwood", born: "1983", generation: 3, location: "Sydney, AU", isComplete: false, children: [] },
          ]
        },
      ],
    },
    {
      name: "Harriet Thornwood", born: "1925", generation: 1, location: "Edinburgh, UK", isComplete: true, spouse: "George Alderton",
      children: [
        { name: "Violet Alderton", born: "1955", generation: 2, location: "Paris, FR", isComplete: false, children: [] },
        { name: "Thomas Alderton", born: "1958", generation: 2, location: "Berlin, DE", isComplete: true,
          children: [
            { name: "Noah Alderton", born: "1989", generation: 3, location: "Berlin, DE", isComplete: true, children: [] },
          ]
        },
      ],
    },
  ],
};

async function seed() {
  const session = driver.session();
  try {
    console.log('Clearing existing data...');
    await session.executeWrite(tx => tx.run('MATCH (n:Member) DETACH DELETE n'));

    console.log('Inserting family members...');
    
    // Recursive function to insert members and their children
    async function insertMember(tx, member, parentId = null) {
      const result = await tx.run(`
        CREATE (m:Member {
          id: randomUUID(),
          firstName: $firstName,
          lastName: $lastName,
          born: $born,
          died: $died,
          location: $location,
          role: $role,
          isComplete: $isComplete,
          generation: $generation,
          created_at: datetime()
        })
        RETURN m.id as id
      `, {
        firstName: member.name.split(' ')[0],
        lastName: member.name.split(' ').slice(1).join(' '),
        born: member.born,
        died: member.died || null,
        location: member.location,
        role: member.role || null,
        isComplete: member.isComplete,
        generation: member.generation
      });
      
      const memberId = result.records[0].get('id');

      if (parentId) {
        await tx.run(`
          MATCH (p:Member {id: $parentId}), (c:Member {id: $memberId})
          CREATE (p)-[:PARENT_OF]->(c)
        `, { parentId, memberId });
      }

      if (member.spouse) {
        // Simple spouse insertion for seed (isolated name)
        await tx.run(`
          MATCH (m:Member {id: $memberId})
          CREATE (s:Member {
            id: randomUUID(),
            firstName: $firstName,
            lastName: $lastName,
            isComplete: true,
            created_at: datetime()
          })
          CREATE (m)-[:MARRIED_TO]->(s)
          CREATE (s)-[:MARRIED_TO]->(m)
        `, {
          memberId,
          firstName: member.spouse.split(' ')[0],
          lastName: member.spouse.split(' ').slice(1).join(' ')
        });
      }

      for (const child of member.children) {
        await insertMember(tx, child, memberId);
      }
    }

    await session.executeWrite(tx => insertMember(tx, SAMPLE_FAMILY));

    console.log('Successfully seeded family tree!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
