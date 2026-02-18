#!/usr/bin/env node
/**
 * Setup Script: Create activity_log table in Supabase
 * 
 * Creates the activity_log table for real-time activity feed.
 * Run this once to initialize.
 */

const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgxMjgwNywiZXhwIjoyMDg1Mzg4ODA3fQ.WPmAxHB6EddgdB_N0aQByAC0sB6RUUojusTQO8CvhkM';

async function checkTableExists() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/activity_log?select=count&limit=1`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    return response.ok;
}

async function main() {
    console.log('🔧 Activity Log Table Setup\n');
    console.log('='.repeat(50));
    
    const exists = await checkTableExists();
    
    if (exists) {
        console.log('✅ Table activity_log already exists!\n');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/activity_log?select=*&order=created_at.desc&limit=10`, {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        });
        
        if (response.ok) {
            const logs = await response.json();
            console.log(`Recent activity (${logs.length} entries):\n`);
            logs.forEach(l => {
                console.log(`  [${l.agent_id}] ${l.action}`);
            });
        }
        return;
    }
    
    console.log('❌ Table activity_log does not exist yet.\n');
    console.log('📋 Please create it by running this SQL in Supabase Dashboard:\n');
    console.log('   Go to: https://supabase.com/dashboard/project/wfwglzrsuuqidscdqgao/sql\n');
    console.log('-'.repeat(60));
    console.log(`
-- Activity Log Table for Real-time Feed
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_name TEXT,
    action TEXT NOT NULL,
    action_type TEXT DEFAULT 'general',
    color TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_agent_id ON activity_log(agent_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- Enable RLS with public access (internal tool)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON activity_log FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON activity_log FOR DELETE USING (true);

-- Auto-cleanup old entries (keep last 7 days)
-- Optional: run this as a cron job or pg_cron
-- DELETE FROM activity_log WHERE created_at < NOW() - INTERVAL '7 days';
`);
    console.log('-'.repeat(60));
    console.log('\nAfter creating the table, agents can log activity!');
}

main().catch(console.error);
