-- Activity Log Table for Real-time Feed
-- Run this in Supabase Dashboard: https://supabase.com/dashboard/project/wfwglzrsuuqidscdqgao/sql

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
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_agent_id ON activity_log(agent_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- Enable RLS with public access (internal tool)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON activity_log FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON activity_log FOR DELETE USING (true);
