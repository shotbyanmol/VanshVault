import { NextResponse } from 'next/server';
import { read } from '@/lib/neo4j';

// GET: Fetch dashboard statistics
export async function GET() {
  try {
    const query = `
      MATCH (m:Member)
      WITH count(m) as total, 
           max(m.generation) as maxGen,
           sum(case when m.isComplete = false then 1 else 0 end) as incomplete,
           count(distinct m.branch) as branches
      RETURN total, maxGen, incomplete, branches
    `;
    
    const result = await read(query);
    
    if (result.length === 0) {
      return NextResponse.json({
        total: 0,
        generations: 0,
        incomplete: 0,
        branches: 0
      });
    }

    const record = result[0];
    return NextResponse.json({
      total: record.get('total'),
      generations: (record.get('maxGen') || 0) + 1, // +1 because generation starts at 0
      incomplete: record.get('incomplete'),
      branches: record.get('branches')
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
