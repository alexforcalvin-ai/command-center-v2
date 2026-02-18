-- Activity Log Table for Real-time Activity Feed
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/wfwglzrsuuqidscdqgao/sql

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    action_type TEXT DEFAULT 'general',  -- general, start, complete, commit, error, meeting, waiting
    color TEXT DEFAULT '#8b949e',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast time-based queries
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- Index for agent filtering
CREATE INDEX IF NOT EXISTS idx_activity_log_agent ON activity_log(agent_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- Enable RLS but allow anon access (internal tool)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Allow public read" ON activity_log
    FOR SELECT USING (true);

-- Allow anyone to insert
CREATE POLICY "Allow public insert" ON activity_log
    FOR INSERT WITH CHECK (true);

-- Allow anyone to delete (for cleanup)
CREATE POLICY "Allow public delete" ON activity_log
    FOR DELETE USING (true);

-- Optional: Auto-cleanup old logs (keep last 7 days)
-- Run periodically: DELETE FROM activity_log WHERE created_at < NOW() - INTERVAL '7 days';
