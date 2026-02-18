// Command Center v2 - Dashboard Logic
// Syncs with Virtual Office agent states

// Supabase connection for real message passing
const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTI4MDcsImV4cCI6MjA4NTM4ODgwN30.Tpnv0rJBE1WCmdpt-yHzLIbnNrpriFeAJQeY2y33VlM';

// Create Supabase client for realtime (named 'sb' to avoid conflict with CDN's global 'supabase')
let sb = null;
try {
    if (window.supabase && window.supabase.createClient) {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
    } else {
        console.warn('Supabase library not loaded - using fallback mode');
    }
} catch (err) {
    console.error('Failed to create Supabase client:', err);
}

// Cache for todos from Supabase
let cachedTodos = [];

// Cache for activity log from Supabase
let cachedActivityLog = [];

// Fetch todos from Supabase
async function fetchTodosFromSupabase() {
    // If Supabase client isn't available, return cached/empty
    if (!sb) {
        console.warn('Supabase client not available - using cached data');
        return cachedTodos;
    }
    
    try {
        const { data, error } = await sb
            .from('calvin_todos')
            .select('*')
            .order('created', { ascending: true });
        
        if (error) {
            console.error('Error fetching todos:', error);
            return cachedTodos;
        }
        
        cachedTodos = data || [];
        console.log('Loaded', cachedTodos.length, 'todos from Supabase');
        return cachedTodos;
    } catch (err) {
        console.error('Failed to fetch todos:', err);
        return cachedTodos;
    }
}

// Subscribe to realtime updates on todos
function subscribeToTodosRealtime() {
    if (!sb) {
        console.warn('Supabase client not available - skipping realtime subscription');
        return;
    }
    
    sb
        .channel('calvin_todos_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'calvin_todos' },
            (payload) => {
                console.log('Realtime todo update:', payload);
                // Re-fetch and re-render on any change
                fetchTodosFromSupabase().then(() => {
                    renderActionItems();
                });
            }
        )
        .subscribe();
}

// Fetch activity log from Supabase
async function fetchActivityLog() {
    if (!sb) {
        console.warn('Supabase client not available - using cached activity');
        return cachedActivityLog;
    }
    
    try {
        const { data, error } = await sb
            .from('activity_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);
        
        if (error) {
            console.error('Error fetching activity log:', error);
            return cachedActivityLog;
        }
        
        cachedActivityLog = data || [];
        console.log('Loaded', cachedActivityLog.length, 'activity entries from Supabase');
        return cachedActivityLog;
    } catch (err) {
        console.error('Failed to fetch activity log:', err);
        return cachedActivityLog;
    }
}

// Subscribe to realtime activity updates
function subscribeToActivityRealtime() {
    if (!sb) {
        console.warn('Supabase client not available - skipping activity subscription');
        return;
    }
    
    const channel = sb.channel('activity_log_changes');
    
    channel.on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
            console.log('New activity:', payload.new);
            // Prepend the new activity to cache
            cachedActivityLog.unshift(payload.new);
            // Keep only last 30
            if (cachedActivityLog.length > 30) cachedActivityLog.pop();
            // Re-render feed
            renderFeed();
        }
    );
    
    channel.subscribe((status) => {
        console.log('Activity realtime subscription status:', status);
    });
}

async function sendToSupabase(response) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/calvin_responses`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(response)
        });
        
        if (!res.ok) {
            console.error('Supabase error:', res.status, await res.text());
            return false;
        }
        return true;
    } catch (err) {
        console.error('Failed to send to Supabase:', err);
        return false;
    }
}

const projects = [
    { name: 'VitalStack', status: 'Design', progress: 15 },
    { name: 'Gentle Pace Fitness', status: 'Development', progress: 75 },
    { name: 'Medicare Broker Directory', status: 'Live', progress: 60 },
    { name: 'Command Center v2', status: 'Building', progress: 70 },
    { name: 'Multi-Agent System', status: 'Complete', progress: 100 }
];

let feedItems = [];
let lastKnownStates = {};
let currentModalAgent = null;
let activityLogEnabled = true; // Use Supabase activity_log table

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
    // Tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            console.log('Tab clicked:', targetId);
            
            // Remove active from all tabs and content
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Find and activate target content
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                console.log('Activated tab content:', targetId);
            } else {
                console.error('Tab content not found:', targetId);
            }
        });
    });
    
    // Close modal on backdrop click
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') closeModal();
    });
    
    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
    
    // Initial render
    setTimeout(async () => {
        // Fetch todos from Supabase on load
        await fetchTodosFromSupabase();
        // Fetch activity log from Supabase
        await fetchActivityLog();
        // Subscribe to realtime updates
        subscribeToTodosRealtime();
        subscribeToActivityRealtime();
        
        renderActionItems();
        renderProjects();
        renderFeed();
        populateFilter();
        
        if (window.getAgentStates) {
            lastKnownStates = JSON.parse(JSON.stringify(window.getAgentStates()));
        }
    }, 100);
    
    // Listen for state updates from Virtual Office
    window.addEventListener('agentStatesUpdated', (e) => {
        detectAndLogChanges(e.detail);
        renderActionItems();
    });
    
    // Poll for changes every 2 seconds
    setInterval(() => {
        renderActionItems();
    }, 2000);
    
    // Also refresh activity feed every 10 seconds as fallback
    setInterval(async () => {
        await fetchActivityLog();
        renderFeed();
    }, 10000);
});

function detectAndLogChanges(newStates) {
    if (!window.agents) return;
    
    for (const [agentId, newState] of Object.entries(newStates)) {
        const oldState = lastKnownStates[agentId];
        if (!oldState || oldState.state !== newState.state || oldState.task !== newState.task) {
            const agent = window.agents.find(a => a.id === agentId);
            if (agent && newState.task) {
                const action = getActionText(newState.state, newState.task);
                addToFeed(agent.name.toLowerCase(), action, agent.color);
            }
        }
    }
    lastKnownStates = JSON.parse(JSON.stringify(newStates));
}

function getActionText(state, task) {
    switch(state) {
        case 'working': return `working on: ${task}`;
        case 'meeting': return `joined meeting: ${task}`;
        case 'waiting': return `needs Calvin: ${task}`;
        case 'withAlex': return `meeting with Alex: ${task}`;
        case 'idle': return 'taking a break';
        default: return task;
    }
}

function addToFeed(agentName, action, color) {
    feedItems.unshift({
        agent: agentName,
        action: action,
        time: 'now',
        color: color
    });
    
    if (feedItems.length > 20) feedItems.pop();
    renderFeed();
    
    setTimeout(() => {
        feedItems.forEach((item) => {
            if (item.time === 'now') item.time = '1m ago';
        });
        renderFeed();
    }, 60000);
}

// Track agents who need Calvin's attention (for Virtual Office positioning)
window.agentsNeedingCalvin = new Set();

// Combined Action Items - merges waiting items and to-dos
async function renderActionItems() {
    const container = document.getElementById('action-items');
    if (!container) return;
    
    // Clear the set of agents needing Calvin
    window.agentsNeedingCalvin = new Set();
    
    // Get waiting items from Virtual Office
    const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
    console.log('Waiting items:', waitingItems.length);
    
    // Get to-do items from Supabase (cached)
    let todoItems = cachedTodos.filter(t => t.status === 'pending');
    console.log('Todo items:', todoItems.length);
    
    // Combine and format all items
    const allItems = [];
    
    // Add waiting items (these are blocking agents)
    waitingItems.forEach(item => {
        window.agentsNeedingCalvin.add(item.agentId);
        allItems.push({
            id: item.id,
            type: 'waiting',
            title: item.title,
            desc: item.desc,
            agent: item.agent,
            agentId: item.agentId,
            createdAt: item.createdAt,
            isBlocking: true
        });
    });
    
    // Add to-do items
    todoItems.forEach(todo => {
        // Find agent ID from name
        const agent = window.agents?.find(a => a.name.toLowerCase() === todo.agent?.toLowerCase());
        if (agent) {
            window.agentsNeedingCalvin.add(agent.id);
        }
        allItems.push({
            id: todo.id,
            type: 'todo',
            title: todo.title,
            desc: todo.context,
            agent: todo.agent,
            agentId: agent?.id,
            priority: todo.priority,
            createdAt: todo.createdAt || Date.now(),
            isBlocking: false
        });
    });
    
    // Dispatch event so Virtual Office can update agent positions
    window.dispatchEvent(new CustomEvent('agentsNeedingCalvinUpdated', { 
        detail: Array.from(window.agentsNeedingCalvin) 
    }));
    
    if (allItems.length === 0) {
        container.innerHTML = '<p style="color:#3fb950;padding:10px;">✓ All clear - nothing needs your attention!</p>';
        return;
    }
    
    // Sort: blocking items first, then by priority, then by time
    allItems.sort((a, b) => {
        if (a.isBlocking !== b.isBlocking) return a.isBlocking ? -1 : 1;
        if (a.priority !== b.priority) {
            if (a.priority === 'high') return -1;
            if (b.priority === 'high') return 1;
        }
        return (a.createdAt || 0) - (b.createdAt || 0);
    });
    
    container.innerHTML = allItems.map(item => {
        const timeAgo = item.createdAt ? getTimeAgo(item.createdAt) : '';
        const typeIcon = item.isBlocking ? '🔴' : '📝';
        const typeLabel = item.isBlocking ? 'Blocking' : 'To-do';
        const priorityClass = item.priority === 'high' ? 'priority-high' : '';
        // Make ALL items clickable - waiting items use showItemDetail, todos use showTodoDetail
        const clickHandler = item.type === 'waiting' 
            ? `onclick="showItemDetail('${item.id}')"` 
            : `onclick="showTodoDetail('${item.id}')"`;
        
        return `
            <div class="action-item ${priorityClass}" ${clickHandler} style="cursor:pointer;">
                <div class="action-item-header">
                    <span class="action-type ${item.isBlocking ? 'blocking' : 'todo'}">${typeIcon} ${typeLabel}</span>
                    ${timeAgo ? `<span class="action-time">${timeAgo}</span>` : ''}
                </div>
                <h4>${item.title}</h4>
                <p>${item.desc}</p>
                <span class="action-agent">👤 ${item.agent}</span>
                <p class="click-hint">Click for details →</p>
            </div>
        `;
    }).join('');
}

function toggleTodo(todoId) {
    alert('To mark complete, tell Alex to update the to-do list');
}

// Show detail modal for to-do items
async function showTodoDetail(todoId) {
    const item = cachedTodos.find(t => t.id === todoId);
    if (!item) return;
    
    const agent = window.agents?.find(a => a.name.toLowerCase() === item.agent?.toLowerCase());
    
    currentModalAgent = todoId; // Store todo ID
    
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <div class="modal-avatar" style="background:${agent?.color || '#6366f1'}">${(item.agent || 'TO').substring(0,2).toUpperCase()}</div>
            <div>
                <div class="modal-title">${item.title}</div>
                <div class="modal-subtitle">${item.agent || 'Team'} — ${item.priority || 'normal'} priority</div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>📋 Context</h4>
            <p>${item.context || 'No additional context provided.'}</p>
        </div>
        
        ${item.options ? `
        <div class="modal-section">
            <h4>🔄 Options</h4>
            <ul>
                ${item.options.map(opt => `<li>${opt}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        <div class="response-section">
            <h4>💬 Your Response to ${item.agent || 'the team'}</h4>
            <textarea id="response-input" class="response-input" placeholder="Provide your decision, answer, or feedback..."></textarea>
        </div>
        
        <div class="modal-actions">
            <button class="btn-large btn-send" onclick="sendTodoResponse('${todoId}')">📤 Send Response</button>
            <button class="btn-large btn-approve-large" onclick="completeTodo('${todoId}')">✓ Mark Complete</button>
            <button class="btn-large btn-deny" onclick="closeModal()">Cancel</button>
        </div>
    `;
    
    document.getElementById('detail-modal').classList.remove('hidden');
}

// Send response to a todo item
async function sendTodoResponse(todoId) {
    const responseInput = document.getElementById('response-input');
    const responseText = responseInput ? responseInput.value.trim() : '';
    
    if (!responseText) {
        showToast('⚠ Please enter a response');
        return;
    }
    
    const item = cachedTodos.find(t => t.id === todoId);
    if (!item) return;
    
    const agent = window.agents?.find(a => a.name.toLowerCase() === item.agent?.toLowerCase());
    
    // Send response to Supabase
    const responsePayload = {
        item_id: todoId,
        agent_id: agent?.id || item.agent,
        agent_name: item.agent || 'Team',
        response_text: responseText,
        task_title: item.title,
        task_context: item.context || '',
        action: 'response',
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    const success = await sendToSupabase(responsePayload);
    
    if (success) {
        addToFeed(item.agent?.toLowerCase() || 'team', `Calvin responded to: ${item.title}`, '#3b82f6');
        showToast(`✓ Response sent to ${item.agent || 'team'}`);
        closeModal();
    } else {
        showToast(`⚠ Failed to send - try again`);
    }
}

// Mark a todo as complete
async function completeTodo(todoId) {
    const item = cachedTodos.find(t => t.id === todoId);
    if (!item) return;
    
    const responseInput = document.getElementById('response-input');
    const notes = responseInput ? responseInput.value.trim() : '';
    
    // Update todo status directly in Supabase (realtime will auto-update)
    const { error: updateError } = await sb
        .from('calvin_todos')
        .update({
            status: 'complete',
            completed_at: new Date().toISOString(),
            completed_by: 'Calvin',
            notes: notes || null
        })
        .eq('id', todoId);
    
    if (updateError) {
        console.error('Error updating todo:', updateError);
        showToast(`⚠ Failed to update - try again`);
        return;
    }
    
    // Also send to calvin_responses for Alex to see
    const responsePayload = {
        item_id: todoId,
        agent_id: item.agent,
        agent_name: item.agent || 'Team',
        response_text: notes || 'Marked complete',
        task_title: item.title,
        task_context: item.context || '',
        action: 'completed',
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    await sendToSupabase(responsePayload);
    
    addToFeed(item.agent?.toLowerCase() || 'team', `completed: ${item.title} ✓`, '#22c55e');
    showToast(`✓ Marked complete!`);
    closeModal();
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function showItemDetail(itemId) {
    const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
    const item = waitingItems.find(i => i.id === itemId);
    if (!item) return;
    
    const agent = window.agents.find(a => a.id === item.agentId);
    if (!agent) return;
    
    currentModalAgent = itemId; // Store item ID, not agent ID
    
    const modalBody = document.getElementById('modal-body');
    
    // Generate quick responses based on what's needed
    const quickResponses = generateQuickResponses(item);
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <div class="modal-avatar" style="background:${agent.color}">${agent.name.substring(0,2).toUpperCase()}</div>
            <div>
                <div class="modal-title">${item.title}</div>
                <div class="modal-subtitle">${agent.name} — ${agent.role}</div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>📋 Context</h4>
            <p>${item.context || item.desc}</p>
        </div>
        
        ${item.whatINeed ? `
        <div class="modal-section">
            <h4>✅ What I Need From You</h4>
            <ul>
                ${item.whatINeed.map(need => `<li>${need}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${item.whyItMatters ? `
        <div class="modal-section">
            <h4>⚡ Why It Matters</h4>
            <p>${item.whyItMatters}</p>
        </div>
        ` : ''}
        
        ${item.deadline ? `
        <div class="modal-section">
            <h4>⏰ Timeline</h4>
            <p>${item.deadline}</p>
        </div>
        ` : ''}
        
        ${item.alternatives ? `
        <div class="modal-section">
            <h4>🔄 Alternatives</h4>
            <p>${item.alternatives}</p>
        </div>
        ` : ''}
        
        <div class="response-section">
            <h4>💬 Your Response to ${agent.name}</h4>
            ${quickResponses.length > 0 ? `
            <div class="quick-responses">
                ${quickResponses.map(qr => `<button class="quick-response-btn" onclick="insertQuickResponse('${escapeHtml(qr)}')">${qr}</button>`).join('')}
            </div>
            ` : ''}
            <textarea id="response-input" class="response-input" placeholder="Type your response, provide credentials, answer questions, or give instructions..."></textarea>
        </div>
        
        <div class="modal-actions">
            <button class="btn-large btn-send" onclick="sendResponseFromModal()">📤 Send Response</button>
            <button class="btn-large btn-approve-large" onclick="approveFromModal()">✓ Approve</button>
            <button class="btn-large btn-deny" onclick="denyFromModal()">✗ Deny</button>
        </div>
    `;
    
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
    currentModalAgent = null;
}

async function approveFromModal() {
    if (currentModalAgent && window.removeFromWaitingQueue) {
        const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
        const item = waitingItems.find(i => i.id === currentModalAgent);
        
        if (item) {
            const agent = window.agents.find(a => a.id === item.agentId);
            const responseInput = document.getElementById('response-input');
            const additionalNotes = responseInput ? responseInput.value.trim() : '';
            
            // Send approval to Supabase
            const responsePayload = {
                item_id: currentModalAgent,
                agent_id: item.agentId,
                agent_name: agent ? agent.name : item.agentId,
                response_text: additionalNotes || 'Approved',
                task_title: item.title,
                task_context: item.context || item.desc,
                action: 'approved',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            const success = await sendToSupabase(responsePayload);
            
            if (success) {
                window.removeFromWaitingQueue(currentModalAgent);
                if (agent) {
                    addToFeed(agent.name.toLowerCase(), `approved: ${item.title} ✓`, '#22c55e');
                }
                showToast(`✓ Approved - ${agent ? agent.name : 'agent'} notified`);
            } else {
                showToast(`⚠ Failed to send - try again`);
                return;
            }
        }
    }
    closeModal();
    renderWaitingItems();
}

async function denyFromModal() {
    if (currentModalAgent && window.removeFromWaitingQueue) {
        const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
        const item = waitingItems.find(i => i.id === currentModalAgent);
        
        if (item) {
            const agent = window.agents.find(a => a.id === item.agentId);
            const responseInput = document.getElementById('response-input');
            const reason = responseInput ? responseInput.value.trim() : '';
            
            // Send denial to Supabase
            const responsePayload = {
                item_id: currentModalAgent,
                agent_id: item.agentId,
                agent_name: agent ? agent.name : item.agentId,
                response_text: reason || 'Denied',
                task_title: item.title,
                task_context: item.context || item.desc,
                action: 'denied',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            const success = await sendToSupabase(responsePayload);
            
            if (success) {
                window.removeFromWaitingQueue(currentModalAgent);
                if (agent) {
                    addToFeed(agent.name.toLowerCase(), `denied: ${item.title}`, '#f85149');
                }
                showToast(`✗ Denied - ${agent ? agent.name : 'agent'} notified`);
            } else {
                showToast(`⚠ Failed to send - try again`);
                return;
            }
        }
    }
    closeModal();
    renderWaitingItems();
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;
    
    container.innerHTML = projects.map(p => `
        <div class="project-card">
            <h4>${p.name} <span style="color:#8b949e;font-size:10px;">${p.status}</span></h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${p.progress}%"></div>
            </div>
        </div>
    `).join('');
}

function renderFeed() {
    const container = document.getElementById('feed-items');
    if (!container) return;
    
    // Merge local feedItems with Supabase activity log
    const allActivity = [];
    
    // Add Supabase activity log entries
    cachedActivityLog.forEach(entry => {
        allActivity.push({
            agent: entry.agent_name || entry.agent_id,
            action: entry.action,
            time: getTimeAgo(new Date(entry.created_at).getTime()),
            color: entry.color || '#8b949e',
            timestamp: new Date(entry.created_at).getTime()
        });
    });
    
    // Add local feedItems (for backward compatibility)
    feedItems.forEach(item => {
        allActivity.push({
            ...item,
            timestamp: item.timestamp || Date.now()
        });
    });
    
    // Sort by timestamp (newest first) and limit to 30
    allActivity.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const displayItems = allActivity.slice(0, 30);
    
    if (displayItems.length === 0) {
        container.innerHTML = '<p style="color:#666;padding:10px;">Activity will appear here...</p>';
        return;
    }
    
    container.innerHTML = displayItems.map(item => `
        <div class="feed-item">
            <div class="feed-avatar" style="background:${item.color}">${(item.agent || 'SYS').substring(0,2).toUpperCase()}</div>
            <span><strong>${item.agent}</strong> ${item.action}</span>
            <span class="feed-time">${item.time}</span>
        </div>
    `).join('');
}

function populateFilter() {
    const select = document.getElementById('agent-filter');
    if (!select || !window.agents) return;
    
    window.agents.forEach(agent => {
        const opt = document.createElement('option');
        opt.value = agent.id;
        opt.textContent = agent.name;
        select.appendChild(opt);
    });
    
    select.addEventListener('change', () => {
        const val = select.value;
        renderFilteredFeed(val);
    });
}

function renderFilteredFeed(agentFilter) {
    const container = document.getElementById('feed-items');
    if (!container) return;
    
    // Merge local feedItems with Supabase activity log
    const allActivity = [];
    
    cachedActivityLog.forEach(entry => {
        allActivity.push({
            agent: entry.agent_name || entry.agent_id,
            action: entry.action,
            time: getTimeAgo(new Date(entry.created_at).getTime()),
            color: entry.color || '#8b949e',
            timestamp: new Date(entry.created_at).getTime()
        });
    });
    
    feedItems.forEach(item => {
        allActivity.push({
            ...item,
            timestamp: item.timestamp || Date.now()
        });
    });
    
    // Sort and filter
    allActivity.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    const filtered = agentFilter === 'all' 
        ? allActivity 
        : allActivity.filter(f => f.agent.toLowerCase() === agentFilter.toLowerCase());
    
    const displayItems = filtered.slice(0, 30);
    
    if (displayItems.length === 0) {
        container.innerHTML = '<p style="color:#666;padding:10px;">No activity for this agent...</p>';
        return;
    }
    
    container.innerHTML = displayItems.map(item => `
        <div class="feed-item">
            <div class="feed-avatar" style="background:${item.color}">${(item.agent || 'SYS').substring(0,2).toUpperCase()}</div>
            <span><strong>${item.agent}</strong> ${item.action}</span>
            <span class="feed-time">${item.time}</span>
        </div>
    `).join('');
}

function generateQuickResponses(item) {
    const responses = [];
    
    // Generic quick responses
    responses.push("Yes, approved");
    responses.push("Not right now");
    responses.push("Let's discuss first");
    
    // Context-specific responses based on keywords
    if (item.title.toLowerCase().includes('access') || item.title.toLowerCase().includes('credentials')) {
        responses.push("I'll send credentials separately");
        responses.push("Use my standard login");
    }
    if (item.title.toLowerCase().includes('budget') || item.title.toLowerCase().includes('cost')) {
        responses.push("What's the cost?");
        responses.push("Keep it under $500");
    }
    if (item.title.toLowerCase().includes('schedule') || item.title.toLowerCase().includes('meeting')) {
        responses.push("Check my calendar");
        responses.push("After 2pm works");
    }
    
    return responses.slice(0, 5); // Max 5 quick responses
}

function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function insertQuickResponse(text) {
    const input = document.getElementById('response-input');
    if (input) {
        input.value = text;
        input.focus();
    }
}

async function sendResponseFromModal() {
    const input = document.getElementById('response-input');
    const response = input ? input.value.trim() : '';
    
    if (!response) {
        alert('Please enter a response');
        return;
    }
    
    if (currentModalAgent && window.removeFromWaitingQueue) {
        const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
        const item = waitingItems.find(i => i.id === currentModalAgent);
        
        if (item) {
            const agent = window.agents.find(a => a.id === item.agentId);
            
            // Build the response payload
            const responsePayload = {
                item_id: currentModalAgent,
                agent_id: item.agentId,
                agent_name: agent ? agent.name : item.agentId,
                response_text: response,
                task_title: item.title,
                task_context: item.context || item.desc,
                action: 'response',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            // Send to Supabase (real connectivity)
            showToast(`Sending to ${agent ? agent.name : 'agent'}...`);
            const success = await sendToSupabase(responsePayload);
            
            if (success) {
                // Remove from waiting queue
                window.removeFromWaitingQueue(currentModalAgent);
                
                if (agent) {
                    addToFeed(agent.name.toLowerCase(), `received response: "${response.substring(0, 30)}${response.length > 30 ? '...' : ''}"`, agent.color);
                }
                
                showToast(`✓ Response sent to ${agent ? agent.name : 'agent'}`);
            } else {
                showToast(`⚠ Failed to send - try again`);
                return; // Don't close modal on failure
            }
        }
    }
    closeModal();
    renderWaitingItems();
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #238636;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Legacy function for inline approve buttons (if any remain)
function approveItem(itemId) {
    showItemDetail(itemId);
}

// Activity feed now loads from Supabase - no fake initialization needed
// Real activity appears as agents log their work via activity-logger.js
