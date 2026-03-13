import neo4j from 'neo4j-driver';

const URI = process.env.NEO4J_URI || process.env.VITE_NEO4J_URI;
const USER = process.env.NEO4J_USER || process.env.VITE_NEO4J_USER;
const PASSWORD = process.env.NEO4J_PASSWORD || process.env.VITE_NEO4J_PASSWORD;

let driver = null;
let initError = null;
const missingConfig = [];
if (!URI) missingConfig.push('NEO4J_URI');
if (!USER) missingConfig.push('NEO4J_USER');
if (!PASSWORD) missingConfig.push('NEO4J_PASSWORD');

try {
  if (missingConfig.length === 0) {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  } else {
    initError = new Error(`Neo4j is not configured. Missing: ${missingConfig.join(', ')}`);
    console.error(initError.message);
  }
} catch (error) {
  initError = error;
  console.error('Neo4j driver initialization error:', error);
}

const convert = (value) => {
  if (value === null || value === undefined) return value;
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(convert);
  if (typeof value === 'object' && value.constructor === Object) {
    const res = {};
    for (const key in value) res[key] = convert(value[key]);
    return res;
  }
  return value;
};

const assertDriver = () => {
  if (driver) return driver;
  if (initError) {
    throw initError;
  }
  throw new Error('Neo4j driver is unavailable.');
};

export async function read(cypher, params = {}) {
  const activeDriver = assertDriver();
  const session = activeDriver.session();
  try {
    const res = await session.executeRead((tx) => tx.run(cypher, params));
    return res.records.map(record => {
      const converted = {};
      record.keys.forEach(key => {
        const val = record.get(key);
        // If it's a Neo4j Node, convert its properties
        if (val && typeof val === 'object' && val.properties) {
          converted[key] = { ...val, properties: convert(val.properties) };
        } else {
          converted[key] = convert(val);
        }
      });
      // Add a helper to simulate the record.get behavior for existing code
      return {
        get: (key) => converted[key],
        keys: record.keys,
        _raw: record
      };
    });
  } finally {
    await session.close();
  }
}

export async function write(cypher, params = {}) {
  const activeDriver = assertDriver();
  const session = activeDriver.session();
  try {
    const res = await session.executeWrite((tx) => tx.run(cypher, params));
    return res.records.map(record => {
      const converted = {};
      record.keys.forEach(key => {
        const val = record.get(key);
        if (val && typeof val === 'object' && val.properties) {
          converted[key] = { ...val, properties: convert(val.properties) };
        } else {
          converted[key] = convert(val);
        }
      });
      return {
        get: (key) => converted[key],
        keys: record.keys,
        _raw: record
      };
    });
  } finally {
    await session.close();
  }
}

export default driver;
