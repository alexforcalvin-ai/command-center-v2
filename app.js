// Command Center v2 - Dashboard Logic
// Syncs with Virtual Office agent states

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

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
    // Tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
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
    setTimeout(() => {
        renderWaitingItems();
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
        renderWaitingItems();
    });
    
    // Poll for changes every 2 seconds
    setInterval(() => {
        renderWaitingItems();
    }, 2000);
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

function renderWaitingItems() {
    const container = document.getElementById('waiting-items');
    if (!container) return;
    
    const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
    
    if (waitingItems.length === 0) {
        container.innerHTML = '<p style="color:#3fb950;padding:10px;">✓ All clear - no one waiting!</p>';
        return;
    }
    
    // Sort by createdAt (oldest first)
    waitingItems.sort((a, b) => a.createdAt - b.createdAt);
    
    container.innerHTML = waitingItems.map(item => {
        const timeAgo = getTimeAgo(item.createdAt);
        return `
            <div class="waiting-item" onclick="showItemDetail('${item.id}')">
                <div class="waiting-item-content">
                    <h4>${item.title}</h4>
                    <p><strong>${item.agent}:</strong> ${item.desc}</p>
                    <p class="click-hint">${timeAgo} · Click for details →</p>
                </div>
            </div>
        `;
    }).join('');
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
        
        <div class="modal-actions">
            <button class="btn-large btn-approve-large" onclick="approveFromModal()">✓ Approve / Provide</button>
            <button class="btn-large btn-later" onclick="closeModal()">Later</button>
            <button class="btn-large btn-deny" onclick="denyFromModal()">✗ Deny</button>
        </div>
    `;
    
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
    currentModalAgent = null;
}

function approveFromModal() {
    if (currentModalAgent && window.removeFromWaitingQueue) {
        // Get the item before removing
        const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
        const item = waitingItems.find(i => i.id === currentModalAgent);
        
        if (item) {
            const agent = window.agents.find(a => a.id === item.agentId);
            
            // Remove from waiting queue
            window.removeFromWaitingQueue(currentModalAgent);
            
            if (agent) {
                addToFeed(agent.name.toLowerCase(), `approved: ${item.title} ✓`, '#22c55e');
            }
        }
    }
    closeModal();
    renderWaitingItems();
}

function denyFromModal() {
    if (currentModalAgent && window.removeFromWaitingQueue) {
        // Get the item before removing
        const waitingItems = window.getWaitingItems ? window.getWaitingItems() : [];
        const item = waitingItems.find(i => i.id === currentModalAgent);
        
        if (item) {
            const agent = window.agents.find(a => a.id === item.agentId);
            
            // Remove from waiting queue
            window.removeFromWaitingQueue(currentModalAgent);
            
            if (agent) {
                addToFeed(agent.name.toLowerCase(), `denied: ${item.title}`, '#f85149');
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
    
    if (feedItems.length === 0) {
        container.innerHTML = '<p style="color:#666;padding:10px;">Activity will appear here...</p>';
        return;
    }
    
    container.innerHTML = feedItems.map(item => `
        <div class="feed-item">
            <div class="feed-avatar" style="background:${item.color}">${item.agent.substring(0,2).toUpperCase()}</div>
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
    
    const filtered = agentFilter === 'all' 
        ? feedItems 
        : feedItems.filter(f => f.agent === agentFilter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:#666;padding:10px;">No activity for this agent...</p>';
        return;
    }
    
    container.innerHTML = filtered.map(item => `
        <div class="feed-item">
            <div class="feed-avatar" style="background:${item.color}">${item.agent.substring(0,2).toUpperCase()}</div>
            <span><strong>${item.agent}</strong> ${item.action}</span>
            <span class="feed-time">${item.time}</span>
        </div>
    `).join('');
}

// Legacy function for inline approve buttons (if any remain)
function approveItem(itemId) {
    showItemDetail(itemId);
}

// Initialize feed with some starting items
setTimeout(() => {
    if (window.agents) {
        addToFeed('alex', 'coordinating team operations', '#8b5cf6');
        addToFeed('devin', 'building Command Center v2', '#10b981');
        addToFeed('leo', 'completed Agent Messaging Policy', '#6366f1');
    }
}, 500);
