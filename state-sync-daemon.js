#!/usr/bin/env node
/**
 * State Sync Daemon v2 - Reads OpenClaw's local files to determine agent states.
 * Updates Supabase every 30 seconds. This is the SINGLE SOURCE OF TRUTH.
 * 
 * Data sources:
 * - ~/.openclaw/subagents/runs.json → active sub-agent sessions
 * - ~/.openclaw/cron/runs/ → active cron job runs
 * - ~/.openclaw/agents/main/sessions/ → main session activity (Alex talking to Calvin)
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgxMjgwNywiZXhwIjoyMDg1Mzg4ODA3fQ.WPmAxHB6EddgdB_N0aQByAC0sB6RUUojusTQO8CvhkM';

const OPENCLAW_DIR = '/Users/AlexCarter/.openclaw';
const SYNC_INTERVAL = 30000;

const AGENT_IDS = ['main','penny','owen','devin','denise','molly','finn','mark','randy','annie','ivan','skye','leo','clara','simon','henry'];
const ID_TO_NAME = { main:'alex', penny:'penny', owen:'owen', devin:'devin', denise:'denise', molly:'molly', finn:'finn', mark:'mark', randy:'randy', annie:'annie', ivan:'ivan', skye:'sky', leo:'leo', clara:'clara', simon:'simon', henry:'henry' };
const AGENT_COLORS = { alex:'#8b5cf6', penny:'#ec4899', owen:'#f59e0b', devin:'#10b981', denise:'#06b6d4', molly:'#ef4444', finn:'#22c55e', mark:'#3b82f6', randy:'#a855f7', annie:'#f97316', ivan:'#eab308', sky:'#14b8a6', leo:'#6366f1', clara:'#f472b6', simon:'#64748b', henry:'#84cc16' };

let previousStates = {};

function ts() { return new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/Los_Angeles' }); }

function readJSON(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch { return null; }
}

function getActiveSubagentRuns() {
    const data = readJSON(path.join(OPENCLAW_DIR, 'subagents', 'runs.json'));
    if (!data || !data.runs) return [];
    
    const active = [];
    for (const [runId, run] of Object.entries(data.runs)) {
        // Active runs don't have a completedAt or have status=running
        if (!run.completedAt && !run.error && !run.result) {
            active.push({
                runId,
                agentId: run.childSessionKey?.split(':')[1] || '',
                label: run.label || '',
                task: (run.task || '').substring(0, 100)
            });
        }
    }
    return active;
}

function getActiveCronRuns() {
    const runsDir = path.join(OPENCLAW_DIR, 'cron', 'runs');
    const active = [];
    try {
        const files = fs.readdirSync(runsDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const run = readJSON(path.join(runsDir, file));
            if (run && run.status === 'running') {
                // Try to determine which agent from the job name or session key
                const agentId = run.childSessionKey?.split(':')[1] || run.agentId || '';
                active.push({
                    jobName: run.jobName || run.name || '',
                    agentId,
                    task: run.jobName || ''
                });
            }
        }
    } catch {}
    return active;
}

function getMainSessionActivity() {
    // Check if Alex's main session has recent activity (file modification time)
    const sessionsDir = path.join(OPENCLAW_DIR, 'agents', 'main', 'sessions');
    try {
        const files = fs.readdirSync(sessionsDir)
            .filter(f => f.endsWith('.jsonl') && !f.includes('deleted'))
            .map(f => ({ name: f, mtime: fs.statSync(path.join(sessionsDir, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);
        
        if (files.length > 0) {
            const mostRecent = files[0];
            const ageMs = Date.now() - mostRecent.mtime;
            // If session file was modified in last 5 minutes, Alex is active
            if (ageMs < 300000) {
                return { active: true, ageMs };
            }
        }
    } catch {}
    return { active: false };
}

function determineStates() {
    const states = {};
    const activeSubagents = getActiveSubagentRuns();
    const activeCrons = getActiveCronRuns();
    const mainActivity = getMainSessionActivity();

    // Default everyone to idle
    for (const id of AGENT_IDS) {
        states[ID_TO_NAME[id]] = { state: 'idle', task: '' };
    }

    // Check sub-agent runs
    for (const run of activeSubagents) {
        const name = ID_TO_NAME[run.agentId];
        if (name) {
            const taskDesc = run.label || run.task.split('\n')[0] || 'Running a task';
            states[name] = { state: 'working', task: taskDesc };
        }
    }

    // Check cron runs  
    for (const run of activeCrons) {
        const name = ID_TO_NAME[run.agentId];
        if (name && states[name].state === 'idle') {
            states[name] = { state: 'working', task: run.task || 'Cron task' };
        }
    }

    // Alex's state
    if (mainActivity.active) {
        // Alex is active in main session = talking with Calvin
        states.alex = { state: 'withCalvin', task: 'Talking with Calvin' };
    } else if (activeSubagents.length > 0) {
        // Alex isn't active in main session but has spawned agents = managing team
        states.alex = { state: 'working', task: 'Managing team operations' };
    }

    return states;
}

async function supabasePatch(table, filter, body) {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body)
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`PATCH ${table} failed: ${resp.status} ${text.substring(0,200)}`);
    }
}

async function supabaseInsert(table, body) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body)
    });
}

async function syncOnce() {
    const states = determineStates();
    
    for (const [name, { state, task }] of Object.entries(states)) {
        const prev = previousStates[name];
        
        // Skip if nothing changed
        if (prev && prev.state === state && prev.task === task) continue;
        
        try {
            // Update Supabase agent_states
            await supabasePatch('agent_states', `agent_id=eq.${name}`, {
                state, task: task || '', updated_at: new Date().toISOString()
            });
            
            // Log state change to activity feed
            if (!prev || prev.state !== state) {
                const labels = {
                    idle: 'heading to break room',
                    working: `working on: ${task || 'a task'}`,
                    meeting: `in a meeting: ${task || ''}`,
                    withCalvin: 'meeting with Calvin',
                    withAlex: `meeting with Alex: ${task || ''}`,
                    waiting: `waiting on Calvin: ${task || ''}`
                };
                await supabaseInsert('activity_log', {
                    agent_id: name,
                    agent_name: name.charAt(0).toUpperCase() + name.slice(1),
                    action: labels[state] || state,
                    action_type: state,
                    color: AGENT_COLORS[name] || '#666',
                    metadata: {},
                    created_at: new Date().toISOString()
                });
                console.log(`[${ts()}] ${name}: ${prev?.state || '?'} → ${state}${task ? ` (${task})` : ''}`);
            }
            
            previousStates[name] = { state, task };
        } catch (err) {
            console.error(`[${ts()}] Error updating ${name}:`, err.message);
        }
    }
}

async function main() {
    console.log(`[${ts()}] State Sync Daemon v2 started`);
    console.log(`[${ts()}] Monitoring: ${OPENCLAW_DIR}`);
    console.log(`[${ts()}] Sync interval: ${SYNC_INTERVAL/1000}s`);
    
    await syncOnce();
    setInterval(syncOnce, SYNC_INTERVAL);
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
