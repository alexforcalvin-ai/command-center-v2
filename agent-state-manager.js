#!/usr/bin/env node
/**
 * Agent State Manager - Auto-update agent states AND activity log
 * 
 * This module provides AUTOMATIC state management AND activity logging
 * for the command center's virtual office and activity feed.
 * 
 * USAGE AS MODULE:
 *   const agent = require('./agent-state-manager');
 *   
 *   // State updates (moves agent in virtual office)
 *   await agent.working('devin', 'Building feature X');
 *   await agent.meeting(['devin', 'penny'], 'Sprint planning');
 *   await agent.idle('devin');
 *   
 *   // Activity logging (appears in activity feed)
 *   await agent.log('devin', 'Started working on payment integration');
 *   await agent.log('devin', 'Pushed 3 commits', 'commit');
 *   await agent.log('devin', 'Completed payment feature', 'complete');
 * 
 * USAGE AS CLI:
 *   ./agent-state-manager.js working devin "Building feature X"
 *   ./agent-state-manager.js log devin "Pushed commit abc123"
 *   ./agent-state-manager.js list
 *   ./agent-state-manager.js feed
 */

const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTI4MDcsImV4cCI6MjA4NTM4ODgwN30.Tpnv0rJBE1WCmdpt-yHzLIbnNrpriFeAJQeY2y33VlM';

const VALID_AGENTS = [
    'alex', 'penny', 'owen', 'devin', 'denise', 'molly', 'finn', 'mark',
    'randy', 'annie', 'ivan', 'sky', 'leo', 'clara', 'simon', 'henry'
];

const VALID_STATES = ['idle', 'working', 'meeting', 'waiting', 'withAlex'];

// Agent colors for activity feed (matches virtual office)
const AGENT_COLORS = {
    alex: '#8b5cf6', penny: '#ec4899', owen: '#f97316', devin: '#10b981',
    denise: '#06b6d4', molly: '#f43f5e', finn: '#84cc16', mark: '#a855f7',
    randy: '#eab308', annie: '#14b8a6', ivan: '#6366f1', sky: '#0ea5e9',
    leo: '#22c55e', clara: '#d946ef', simon: '#f59e0b', henry: '#64748b'
};

// ============================================================================
// ACTIVITY LOGGING - Log what agents are doing to the feed
// ============================================================================

/**
 * Log an activity to the feed
 * 
 * @param {string} agentId - Agent performing the action
 * @param {string} action - Description of what happened
 * @param {string} actionType - Category: 'general', 'start', 'complete', 'commit', 'error', 'meeting', 'waiting'
 * @param {object} metadata - Optional extra data (JSON)
 */
async function log(agentId, action, actionType = 'general', metadata = {}) {
    agentId = agentId.toLowerCase();
    
    if (!VALID_AGENTS.includes(agentId)) {
        console.error(`❌ Invalid agent: ${agentId}`);
        return false;
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            agent_id: agentId,
            agent_name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
            action: action,
            action_type: actionType,
            color: AGENT_COLORS[agentId] || '#6366f1',
            metadata: metadata,
            created_at: new Date().toISOString()
        })
    });
    
    if (response.ok) {
        console.log(`📝 [${agentId}] ${action}`);
        return true;
    }
    
    // Table might not exist yet - that's okay
    const errorText = await response.text();
    if (errorText.includes('activity_log')) {
        console.warn(`⚠️  Activity log table not set up yet. Run setup-activity-log.js`);
    } else {
        console.error(`❌ Failed to log activity: ${errorText}`);
    }
    return false;
}

/**
 * Get recent activity entries
 */
async function getActivity(limit = 30, agentId = null) {
    let url = `${SUPABASE_URL}/rest/v1/activity_log?select=*&order=created_at.desc&limit=${limit}`;
    if (agentId) {
        url += `&agent_id=eq.${agentId.toLowerCase()}`;
    }
    
    const response = await fetch(url, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    
    if (response.ok) {
        return await response.json();
    }
    return [];
}

/**
 * Show recent activity (formatted)
 */
async function showActivity(limit = 20) {
    const activities = await getActivity(limit);
    
    if (activities.length === 0) {
        console.log('\n📋 No activity logged yet.\n');
        return [];
    }
    
    console.log('\n📋 Recent Activity:\n');
    activities.forEach(a => {
        const time = new Date(a.created_at).toLocaleTimeString();
        console.log(`  [${time}] ${a.agent_id}: ${a.action}`);
    });
    console.log();
    return activities;
}

// ============================================================================
// STATE UPDATES - Move agents in the virtual office
// ============================================================================

/**
 * Update a single agent's state (and optionally log it)
 */
async function updateState(agentId, state, task = '', shouldLog = true) {
    agentId = agentId.toLowerCase();
    
    if (!VALID_AGENTS.includes(agentId)) {
        console.error(`❌ Invalid agent: ${agentId}`);
        return false;
    }
    
    if (!VALID_STATES.includes(state)) {
        console.error(`❌ Invalid state: ${state}`);
        return false;
    }
    
    // Try PATCH first
    const patchResponse = await fetch(`${SUPABASE_URL}/rest/v1/agent_states?agent_id=eq.${agentId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            state: state,
            task: task,
            updated_at: new Date().toISOString()
        })
    });
    
    let success = false;
    
    if (patchResponse.ok) {
        const result = await patchResponse.json();
        if (result.length > 0) {
            console.log(`✅ ${agentId} → ${state}${task ? ` (${task})` : ''}`);
            success = true;
        }
    }
    
    if (!success) {
        // Insert if no existing row
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/agent_states`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                agent_id: agentId,
                state: state,
                task: task,
                updated_at: new Date().toISOString()
            })
        });
        
        if (insertResponse.ok) {
            console.log(`✅ ${agentId} → ${state}${task ? ` (${task})` : ''} (created)`);
            success = true;
        } else {
            console.error(`❌ Failed to update ${agentId}`);
        }
    }
    
    // Also log to activity feed
    if (success && shouldLog && task) {
        const actionText = getActionText(state, task);
        await log(agentId, actionText, state);
    }
    
    return success;
}

function getActionText(state, task) {
    switch(state) {
        case 'working': return `started working on: ${task}`;
        case 'meeting': return `joined meeting: ${task}`;
        case 'waiting': return `waiting for Calvin: ${task}`;
        case 'withAlex': return `meeting with Alex: ${task}`;
        case 'idle': return 'taking a break';
        default: return task;
    }
}

/**
 * Update multiple agents at once
 */
async function updateMultiple(agents, state, task = '') {
    const results = await Promise.all(
        agents.map(agent => updateState(agent, state, task, false))
    );
    
    // Log once for the group
    if (results.some(r => r) && task) {
        const agentNames = agents.join(', ');
        await log(agents[0], `Team (${agentNames}): ${getActionText(state, task)}`, state);
    }
    
    return results.every(r => r);
}

// ============================================================================
// CONVENIENCE FUNCTIONS - Use these for automatic state management!
// ============================================================================

/**
 * Agent starts working on a task (goes to their desk)
 * Automatically logs to activity feed!
 */
async function working(agentId, task) {
    return updateState(agentId, 'working', task);
}

/**
 * Agent becomes idle (goes to break room)
 */
async function idle(agentId) {
    return updateState(agentId, 'idle', '', false);
}

/**
 * Multiple agents meeting (all go to conference room)
 * Automatically logs to activity feed!
 */
async function meeting(agents, topic) {
    if (!Array.isArray(agents)) agents = [agents];
    return updateMultiple(agents, 'meeting', topic);
}

/**
 * Agent waiting for Calvin's input (goes to Calvin's office)
 * Automatically logs to activity feed!
 */
async function waiting(agentId, reason) {
    return updateState(agentId, 'waiting', reason || 'Waiting for input');
}

/**
 * Agent working with Alex (goes to Alex's office)
 * Automatically logs to activity feed!
 */
async function withAlex(agentId, task) {
    return updateState(agentId, 'withAlex', task);
}

/**
 * Spawn helper - marks agent as working, logs start, AND returns cleanup function
 * 
 * USAGE:
 *   const cleanup = await agent.spawn('devin', 'Building feature');
 *   // ... do work ...
 *   await cleanup(); // Marks agent as idle and logs completion
 */
async function spawn(agentId, task) {
    await working(agentId, task);
    return async (completionMessage = null) => {
        if (completionMessage) {
            await log(agentId, completionMessage, 'complete');
        } else {
            await log(agentId, `completed: ${task}`, 'complete');
        }
        await idle(agentId);
    };
}

/**
 * Multi-agent spawn - for collaborative tasks
 */
async function spawnTeam(agents, task) {
    await meeting(agents, task);
    return async (completionMessage = null) => {
        const agentNames = agents.join(', ');
        if (completionMessage) {
            await log(agents[0], `Team (${agentNames}): ${completionMessage}`, 'complete');
        } else {
            await log(agents[0], `Team (${agentNames}) completed: ${task}`, 'complete');
        }
        await Promise.all(agents.map(a => idle(a)));
    };
}

/**
 * Get current states of all agents
 */
async function list() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/agent_states?select=*&order=agent_id`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    
    if (response.ok) {
        return await response.json();
    }
    return [];
}

/**
 * Show current states (formatted)
 */
async function showStates() {
    const states = await list();
    console.log('\n📊 Current Agent States:\n');
    console.log('Agent'.padEnd(10) + 'State'.padEnd(12) + 'Task');
    console.log('-'.repeat(50));
    states.forEach(s => {
        console.log(
            s.agent_id.padEnd(10) + 
            s.state.padEnd(12) + 
            (s.task || '-')
        );
    });
    console.log();
    return states;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
🏢 Agent State Manager - Auto-update virtual office & activity feed

STATE COMMANDS (moves agent in office):
  working <agent> <task>       → Agent starts working (at desk)
  idle <agent>                 → Agent becomes idle (break room)
  meeting <agents> <topic>     → Agents in meeting (conference room)
  waiting <agent> [reason]     → Agent waiting for input (Calvin's office)
  withAlex <agent> <task>      → Agent with Alex (Alex's office)
  list                         → Show all current states

ACTIVITY COMMANDS (appears in feed):
  log <agent> <action>         → Log activity to feed
  feed [limit]                 → Show recent activity

EXAMPLES:
  ./agent-state-manager.js working devin "Building payment integration"
  ./agent-state-manager.js log devin "Pushed commit abc123"
  ./agent-state-manager.js log devin "Fixed bug in auth flow"
  ./agent-state-manager.js meeting devin,penny "Code review"
  ./agent-state-manager.js idle devin
  ./agent-state-manager.js feed

AGENTS: ${VALID_AGENTS.join(', ')}
`);
        process.exit(0);
    }
    
    const [command, ...rest] = args;
    
    switch (command) {
        case 'working': {
            const [agent, ...taskParts] = rest;
            await working(agent, taskParts.join(' '));
            break;
        }
        case 'idle': {
            await idle(rest[0]);
            break;
        }
        case 'meeting': {
            const [agentsStr, ...topicParts] = rest;
            const agents = agentsStr.split(',').map(a => a.trim());
            await meeting(agents, topicParts.join(' '));
            break;
        }
        case 'waiting': {
            const [agent, ...reasonParts] = rest;
            await waiting(agent, reasonParts.join(' '));
            break;
        }
        case 'withAlex': {
            const [agent, ...taskParts] = rest;
            await withAlex(agent, taskParts.join(' '));
            break;
        }
        case 'log': {
            const [agent, ...actionParts] = rest;
            await log(agent, actionParts.join(' '));
            break;
        }
        case 'feed': {
            const limit = parseInt(rest[0]) || 20;
            await showActivity(limit);
            break;
        }
        case 'list':
            await showStates();
            break;
        default:
            // Fallback: treat as raw state update
            const [agentId, state, ...taskParts] = args;
            await updateState(agentId, state, taskParts.join(' '));
    }
}

// Run CLI if executed directly
if (require.main === module) {
    main().catch(console.error);
}

// ============================================================================
// EXPORTS - For use as a module
// ============================================================================

module.exports = {
    // Activity logging
    log,
    getActivity,
    showActivity,
    
    // State management
    updateState,
    updateMultiple,
    list,
    showStates,
    
    // Convenience functions (USE THESE!)
    working,
    idle,
    meeting,
    waiting,
    withAlex,
    
    // Spawn helpers with cleanup
    spawn,
    spawnTeam,
    
    // Constants
    VALID_AGENTS,
    VALID_STATES,
    AGENT_COLORS
};
