# 🔧 Activity Log Table Setup

The activity feed needs a Supabase table to store real-time activity.

## Quick Setup (One-Time)

1. Open the Supabase SQL Editor:
   **https://supabase.com/dashboard/project/wfwglzrsuuqidscdqgao/sql/new**

2. Paste and run this SQL:

```sql
-- Activity Log Table for Real-time Activity Feed
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    action_type TEXT DEFAULT 'general',
    color TEXT DEFAULT '#8b949e',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_agent ON activity_log(agent_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- Enable RLS with public access
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON activity_log FOR DELETE USING (true);
```

3. Click "Run" - you should see "Success"

4. Test it works:
```bash
cd ~/alex/command-center
node agent-state-manager.js log devin "Test activity entry"
node agent-state-manager.js feed
```

## What This Enables

Once set up, the activity feed in the Command Center will show REAL agent activity:
- "Devin started working on: Payment integration"
- "Penny pushed 3 commits"
- "Team (Devin, Penny) completed: Code review"

Activities appear in real-time via Supabase Realtime subscriptions!
