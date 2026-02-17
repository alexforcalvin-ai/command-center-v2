#!/usr/bin/env node
/**
 * Agent State Manager - Auto-update agent states in the Virtual Office
 * 
 * This module provides AUTOMATIC state management for the command center.
 * Import it in Alex's scripts or call via CLI.
 * 
 * USAGE AS MODULE:
 *   const state = require('./agent-state-manager');
 *   await state.working('devin', 'Building feature X');
 *   await state.meeting(['devin', 'penny'], 'Sprint planning');
 *   await state.idle('devin');
 * 
 * USAGE AS CLI:
 *   ./agent-state-manager.js working devin "Building feature X"
 *   ./agent-state-manager.js meeting devin,penny "Sprint planning"
 *   ./agent-state-manager.js idle devin
 *   ./agent-state-manager.js list
 */

const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTI4MDcsImV4cCI6MjA4NTM4ODgwN30.Tpnv0rJBE1WCmdpt-yHzLIbnNrpriFeAJQeY2y33VlM';

const VALID_AGENTS = [
    'alex', 'penny', 'owen', 'devin', 'denise', 'molly', 'finn', 'mark',
    'randy', 'annie', 'ivan', 'sky', 'leo', 'clara', 'simon', 'henry'
];

const VALID_STATES = ['idle', 'working', 'meeting', 'waiting', 'withAlex'];

// ============================================================================
// CORE API
// ============================================================================

/**
 * Update a single agent's state
 */
async function updateState(agentId, state, task = '') {
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
    
    if (patchResponse.ok) {
        const result = await patchResponse.json();
        if (result.length > 0) {
            console.log(`✅ ${agentId} → ${state}${task ? ` (${task})` : ''}`);
            return true;
        }
    }
    
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
        return true;
    }
    
    console.error(`❌ Failed to update ${agentId}`);
    return false;
}

/**
 * Update multiple agents at once
 */
async function updateMultiple(agents, state, task = '') {
    const results = await Promise.all(
        agents.map(agent => updateState(agent, state, task))
    );
    return results.every(r => r);
}

// ============================================================================
// CONVENIENCE FUNCTIONS - Use these for automatic state management!
// ============================================================================

/**
 * Agent starts working on a task (goes to their desk)
 * Call this when spawning a subagent!
 */
async function working(agentId, task) {
    return updateState(agentId, 'working', task);
}

/**
 * Agent becomes idle (goes to break room)
 * Call this when agent session ends!
 */
async function idle(agentId) {
    return updateState(agentId, 'idle', '');
}

/**
 * Multiple agents meeting (all go to conference room)
 * Call this when multiple agents work on the same task!
 */
async function meeting(agents, topic) {
    if (!Array.isArray(agents)) agents = [agents];
    return updateMultiple(agents, 'meeting', topic);
}

/**
 * Agent waiting for Calvin's input (goes to Calvin's office)
 * Call this when agent needs user approval/input!
 */
async function waiting(agentId, reason) {
    return updateState(agentId, 'waiting', reason || 'Waiting for input');
}

/**
 * Agent working with Alex (goes to Alex's office)
 * Call this when agent is assisting Alex or vice versa!
 */
async function withAlex(agentId, task) {
    return updateState(agentId, 'withAlex', task);
}

/**
 * Spawn helper - marks agent as working AND returns cleanup function
 * 
 * USAGE:
 *   const cleanup = await state.spawn('devin', 'Building feature');
 *   // ... do work ...
 *   await cleanup(); // Marks agent as idle
 */
async function spawn(agentId, task) {
    await working(agentId, task);
    return async () => await idle(agentId);
}

/**
 * Multi-agent spawn - for collaborative tasks
 * 
 * USAGE:
 *   const cleanup = await state.spawnTeam(['devin', 'penny'], 'Sprint planning');
 *   // ... do work ...
 *   await cleanup(); // Marks all as idle
 */
async function spawnTeam(agents, task) {
    await meeting(agents, task);
    return async () => {
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
🏢 Agent State Manager - Auto-update virtual office states

QUICK COMMANDS:
  working <agent> <task>       → Agent starts working (at desk)
  idle <agent>                 → Agent becomes idle (break room)
  meeting <agents> <topic>     → Agents in meeting (conference room)
  waiting <agent> [reason]     → Agent waiting for input (Calvin's office)
  withAlex <agent> <task>      → Agent with Alex (Alex's office)
  list                         → Show all current states

EXAMPLES:
  ./agent-state-manager.js working devin "Building payment integration"
  ./agent-state-manager.js meeting devin,penny "Code review"
  ./agent-state-manager.js waiting finn "Needs API key"
  ./agent-state-manager.js idle devin
  ./agent-state-manager.js list

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
    // Core
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
    VALID_STATES
};
