import neo4j from 'neo4j-driver';

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER;
const PASSWORD = process.env.NEO4J_PASSWORD;

let driver;

try {
  driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
} catch (error) {
  console.error('Neo4j connection error:', error);
}

export async function read(cypher, params = {}) {
  const session = driver.session();
  try {
    const res = await session.executeRead((tx) => tx.run(cypher, params));
    return res.records;
  } finally {
    await session.close();
  }
}

export async function write(cypher, params = {}) {
  const session = driver.session();
  try {
    const res = await session.executeWrite((tx) => tx.run(cypher, params));
    return res.records;
  } finally {
    await session.close();
  }
}

export default driver;
