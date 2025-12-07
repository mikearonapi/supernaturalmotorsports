#!/usr/bin/env node
/**
 * Run Schema Migration Script
 * 
 * This script runs the schema.sql file against Supabase using the REST API.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - MUST be set via environment variables
// NEVER hardcode secrets - use .env file locally
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Example: SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/run-schema.js');
  process.exit(1);
}

async function runSchema() {
  console.log('\n🔧 Running database schema migration...\n');
  
  // Read the schema SQL file
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // Split into individual statements (simplified approach)
  // Note: This won't handle all edge cases but works for our schema
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  // Execute via Supabase's REST API
  // We'll use the /rest/v1/rpc endpoint for raw SQL execution
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: schemaSql }),
  });

  if (!response.ok) {
    // RPC function might not exist, try alternative approach
    console.log('Note: exec_sql function not available.');
    console.log('\n📋 Please run the schema manually:');
    console.log(`   1. Go to: ${SUPABASE_URL.replace('.supabase.co', '')}/sql`);
    console.log('   2. Copy everything from supabase/schema.sql');
    console.log('   3. Paste and click "Run"\n');
    
    // Output the schema for easy copy
    console.log('Or copy this schema:\n');
    console.log('='.repeat(60));
    console.log(schemaSql);
    console.log('='.repeat(60));
    return false;
  }

  console.log('✅ Schema migration completed successfully!\n');
  return true;
}

runSchema().catch(console.error);

