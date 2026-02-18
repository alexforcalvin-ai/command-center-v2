#!/usr/bin/env node
/**
 * Activity Logger - Log agent activities to Supabase for real-time feed
 * 
 * USAGE AS MODULE:
 *   const activity = require('./activity-logger');
 *   await activity.log('devin', 'started: Building feature X');
 *   await activity.started('devin', 'Building feature X');
 *   await activity.completed('devin', 'Feature X');
 *   await activity.spawned('alex', 'devin', 'Activity feed feature');
 * 
 * USAGE AS CLI:
 *   ./activity-logger.js log devin "started: Building feature X"
 *   ./activity-logger.js started devin "Building feature X"
 *   ./activity-logger.js completed devin "Feature X"
 *   ./activity-logger.js spawned alex devin "Activity feed feature"
 */

const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTI4MDcsImV4cCI6MjA4NTM4ODgwN30.Tpnv0rJBE1WCmdpt-yHzLIbnNrpriFeAJQeY2y33VlM';

// Agent colors for visual consistency
const AGENT_COLORS = {
    alex: '#8b5cf6',    // Purple - Chief of Staff
    penny: '#f472b6',   // Pink - Product Manager
    owen: '#fb923c',    // Orange - Operations
    devin: '#10b981',   // Green - Developer
    denise: '#22d3ee',  // Cyan - Data Scientist
    molly: '#f97316',   // Orange - Marketing
    finn: '#84cc16',    // Lime - Finance
    mark: '#6366f1',    // Indigo - Marketing Creative
    randy: '#ef4444',   // Red - Research
    annie: '#a855f7',   // Purple - Analytics
    ivan: '#06b6d4',    // Cyan - Integration
    sky: '#38bdf8',     // Sky blue - Social Media
    leo: '#818cf8',     // Light indigo - Legal
    clara: '#f472b6',   // Pink - Customer Success
    simon: '#94a3b8',   // Slate - Security
    henry: '#4ade80',   // Green - HR
    system: '#3b82f6',  // Blue - System messages
    calvin: '#fbbf24'   // Amber - Calvin (owner)
};

// ============================================================================
// CORE API
// ============================================================================

/**
 * Log an activity to Supabase
 * @param {string} agentId - Agent ID (lowercase)
 * @param {string} action - What the agent did
 * @param {string} actionType - Category: general, start, complete, commit, error, meeting, waiting
 * @param {object} metadata - Optional extra data
 */
async function log(agentId, action, actionType = 'general', metadata = {}) {
    agentId = agentId.toLowerCase();
    const agentName = agentId.charAt(0).toUpperCase() + agentId.slice(1);
    const agentColor = AGENT_COLORS[agentId] || '#8b949e';
    
    try {
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
                agent_name: agentName,
                action: action,
                action_type: actionType,
                color: agentColor,
                metadata: metadata,
                created_at: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            console.log(`📝 ${agentName}: ${action}`);
            return true;
        } else {
            const errText = await response.text();
            if (errText.includes('activity_log')) {
                console.warn(`⚠️  Activity log table not set up yet. See setup-activity-log.md`);
            } else {
                console.error(`❌ Failed to log activity: ${errText}`);
            }
            return false;
        }
    } catch (err) {
        console.error(`❌ Failed to log activity:`, err.message);
        return false;
    }
}

// ============================================================================
// CONVENIENCE FUNCTIONS - Common activity patterns
// ============================================================================

/**
 * Agent started a task
 */
async function started(agentId, task) {
    return log(agentId, `started: ${task}`);
}

/**
 * Agent completed a task
 */
async function completed(agentId, task) {
    return log(agentId, `completed: ${task} ✓`);
}

/**
 * Agent is waiting on something
 */
async function waiting(agentId, waitingFor) {
    return log(agentId, `waiting on: ${waitingFor}`);
}

/**
 * Agent made a decision
 */
async function decided(agentId, decision) {
    return log(agentId, `decided: ${decision}`);
}

/**
 * Agent spawned another agent
 */
async function spawned(spawnerAgentId, spawnedAgentId, task) {
    const spawnerName = spawnerAgentId.charAt(0).toUpperCase() + spawnerAgentId.slice(1);
    const spawnedName = spawnedAgentId.charAt(0).toUpperCase() + spawnedAgentId.slice(1);
    return log(spawnerAgentId, `spawned ${spawnedName} for: ${task}`);
}

/**
 * Agent sent a message/notification
 */
async function messaged(agentId, recipient, about) {
    return log(agentId, `messaged ${recipient}: ${about}`);
}

/**
 * Agent is researching/investigating
 */
async function researching(agentId, topic) {
    return log(agentId, `researching: ${topic}`);
}

/**
 * Agent encountered an error or issue
 */
async function error(agentId, issue) {
    return log(agentId, `⚠️ ${issue}`);
}

/**
 * Agent is reviewing something
 */
async function reviewing(agentId, what) {
    return log(agentId, `reviewing: ${what}`);
}

/**
 * Agent joined a meeting/collaboration
 */
async function joined(agentId, what) {
    return log(agentId, `joined: ${what}`);
}

/**
 * System message (not from an agent)
 */
async function system(message) {
    return log('system', message, '#3b82f6');
}

/**
 * Get recent activity logs
 * @param {number} limit - Max number of entries (default 50)
 */
async function recent(limit = 50) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/activity_log?select=*&order=created_at.desc&limit=${limit}`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (err) {
        console.error('Failed to fetch activity:', err.message);
        return [];
    }
}

/**
 * Clear old activity logs (older than daysOld)
 */
async function cleanup(daysOld = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/activity_log?created_at=lt.${cutoff.toISOString()}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        
        if (response.ok) {
            console.log(`🧹 Cleaned up logs older than ${daysOld} days`);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Failed to cleanup:', err.message);
        return false;
    }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
📝 Activity Logger - Log agent activities for real-time feed

COMMANDS:
  log <agent> <action>                → Log any activity
  started <agent> <task>              → Agent started a task
  completed <agent> <task>            → Agent completed a task
  waiting <agent> <waiting_for>       → Agent waiting on something
  decided <agent> <decision>          → Agent made a decision
  spawned <spawner> <spawned> <task>  → Agent spawned another agent
  messaged <agent> <recipient> <msg>  → Agent sent a message
  researching <agent> <topic>         → Agent is researching
  reviewing <agent> <what>            → Agent is reviewing
  joined <agent> <what>               → Agent joined something
  error <agent> <issue>               → Agent encountered an error
  system <message>                    → System message
  recent [limit]                      → Show recent activity
  cleanup [days]                      → Remove old logs

EXAMPLES:
  ./activity-logger.js started devin "Building payment integration"
  ./activity-logger.js completed devin "Command Center v2"
  ./activity-logger.js spawned alex devin "Activity feed feature"
  ./activity-logger.js waiting mark "Calvin's approval on marketing strategy"
  ./activity-logger.js recent 20
`);
        process.exit(0);
    }
    
    const [command, ...rest] = args;
    
    switch (command) {
        case 'log': {
            const [agent, ...actionParts] = rest;
            await log(agent, actionParts.join(' '));
            break;
        }
        case 'started': {
            const [agent, ...taskParts] = rest;
            await started(agent, taskParts.join(' '));
            break;
        }
        case 'completed': {
            const [agent, ...taskParts] = rest;
            await completed(agent, taskParts.join(' '));
            break;
        }
        case 'waiting': {
            const [agent, ...waitParts] = rest;
            await waiting(agent, waitParts.join(' '));
            break;
        }
        case 'decided': {
            const [agent, ...decisionParts] = rest;
            await decided(agent, decisionParts.join(' '));
            break;
        }
        case 'spawned': {
            const [spawner, spawned, ...taskParts] = rest;
            await spawned(spawner, spawned, taskParts.join(' '));
            break;
        }
        case 'messaged': {
            const [agent, recipient, ...msgParts] = rest;
            await messaged(agent, recipient, msgParts.join(' '));
            break;
        }
        case 'researching': {
            const [agent, ...topicParts] = rest;
            await researching(agent, topicParts.join(' '));
            break;
        }
        case 'reviewing': {
            const [agent, ...whatParts] = rest;
            await reviewing(agent, whatParts.join(' '));
            break;
        }
        case 'joined': {
            const [agent, ...whatParts] = rest;
            await joined(agent, whatParts.join(' '));
            break;
        }
        case 'error': {
            const [agent, ...issueParts] = rest;
            await error(agent, issueParts.join(' '));
            break;
        }
        case 'system': {
            await system(rest.join(' '));
            break;
        }
        case 'recent': {
            const limit = parseInt(rest[0]) || 20;
            const logs = await recent(limit);
            console.log(`\n📊 Recent Activity (${logs.length} entries):\n`);
            logs.reverse().forEach(entry => {
                const time = new Date(entry.created_at).toLocaleTimeString();
                console.log(`[${time}] ${entry.agent_name}: ${entry.action}`);
            });
            console.log();
            break;
        }
        case 'cleanup': {
            const days = parseInt(rest[0]) || 7;
            await cleanup(days);
            break;
        }
        default:
            console.error(`Unknown command: ${command}`);
            process.exit(1);
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
    log,
    recent,
    cleanup,
    
    // Convenience functions (USE THESE!)
    started,
    completed,
    waiting,
    decided,
    spawned,
    messaged,
    researching,
    reviewing,
    joined,
    error,
    system,
    
    // Constants
    AGENT_COLORS
};
