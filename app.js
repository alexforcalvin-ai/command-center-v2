// Command Center v2 - Agent Operations Dashboard

// Agent definitions
const agents = [
    { id: 'alex', name: 'Alex', color: '#8b5cf6', role: 'CEO' },
    { id: 'penny', name: 'Penny', color: '#ec4899', role: 'Personal Assistant' },
    { id: 'owen', name: 'Owen', color: '#f59e0b', role: 'Operations' },
    { id: 'devin', name: 'Devin', color: '#10b981', role: 'Developer' },
    { id: 'denise', name: 'Denise', color: '#06b6d4', role: 'Design & QA' },
    { id: 'molly', name: 'Molly', color: '#ef4444', role: 'Medicare Expert' },
    { id: 'finn', name: 'Finn', color: '#22c55e', role: 'Financial' },
    { id: 'mark', name: 'Mark', color: '#3b82f6', role: 'Marketing' },
    { id: 'randy', name: 'Randy', color: '#a855f7', role: 'R&D' },
    { id: 'annie', name: 'Annie', color: '#f97316', role: 'Investment Analyst' },
    { id: 'ivan', name: 'Ivan', color: '#eab308', role: 'Investment Trader' },
    { id: 'tara', name: 'Tara', color: '#14b8a6', role: 'Travel' },
    { id: 'leo', name: 'Leo', color: '#6366f1', role: 'Legal' },
    { id: 'clara', name: 'Clara', color: '#f472b6', role: 'Customer Success' },
    { id: 'simon', name: 'Simon', color: '#64748b', role: 'Security' },
    { id: 'henry', name: 'Henry', color: '#84cc16', role: 'Health Coach' }
];

// Mock agent states
let agentStates = {
    alex: { status: 'working', task: 'Coordinating team security review' },
    penny: { status: 'waiting', task: 'Waiting on calendar approval' },
    owen: { status: 'working', task: 'Processing Directory applications' },
    devin: { status: 'working', task: 'Building Command Center v2' },
    denise: { status: 'collaborating', task: 'Reviewing specs with Devin' },
    molly: { status: 'idle', task: null },
    finn: { status: 'waiting', task: 'Needs QuickBooks access' },
    mark: { status: 'working', task: 'Drafting marketing plan' },
    randy: { status: 'collaborating', task: 'Security research review' },
    annie: { status: 'idle', task: null },
    ivan: { status: 'waiting', task: 'Needs trading credentials' },
    tara: { status: 'idle', task: null },
    leo: { status: 'collaborating', task: 'Security policy review' },
    clara: { status: 'working', task: 'Processing support tickets' },
    simon: { status: 'collaborating', task: 'Security review with team' },
    henry: { status: 'idle', task: null }
};

// Mock waiting items
const waitingItems = [
    { id: 1, agent: 'penny', title: 'Podcast scheduling approval', desc: 'PodMatch booking for March 5', priority: 'high' },
    { id: 2, agent: 'finn', title: 'QuickBooks access needed', desc: 'Required for financial tracking', priority: 'medium' },
    { id: 3, agent: 'ivan', title: 'Trading credentials', desc: 'Coinbase/Kraken access for UNI opportunity', priority: 'high' }
];

// Mock projects
const projects = [
    { name: 'VitalStack', status: 'active', progress: 15 },
    { name: 'Gentle Pace Fitness', status: 'active', progress: 75 },
    { name: 'Medicare Broker Directory', status: 'active', progress: 60 },
    { name: 'Command Center v2', status: 'active', progress: 30 },
    { name: 'Multi-Agent System', status: 'active', progress: 95 }
];

// Activity feed items
let feedItems = [
    { agent: 'leo', action: 'completed Agent Messaging Policy', time: '2 min ago' },
    { agent: 'simon', action: 'finished security review synthesis', time: '5 min ago' },
    { agent: 'randy', action: 'submitted security research findings', time: '8 min ago' },
    { agent: 'denise', action: 'created Command Center specs', time: '12 min ago' },
    { agent: 'alex', action: 'deployed messaging policy to all agents', time: '15 min ago' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    
    renderVirtualOffice();
    renderWaitingItems();
    renderProjects();
    renderActivityFeed();
    populateAgentFilter();
    
    // Simulate activity
    setInterval(simulateActivity, 10000);
});

function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function renderVirtualOffice() {
    const calvinsOffice = document.getElementById('calvins-office-agents');
    const conference = document.getElementById('conference-agents');
    const working = document.getElementById('working-agents');
    const idle = document.getElementById('idle-agents');
    
    // Clear all
    [calvinsOffice, conference, working, idle].forEach(el => el.innerHTML = '');
    
    agents.forEach(agent => {
        const state = agentStates[agent.id];
        const avatar = createAgentAvatar(agent, state);
        
        switch(state.status) {
            case 'waiting':
                calvinsOffice.appendChild(avatar);
                break;
            case 'collaborating':
                conference.appendChild(avatar);
                break;
            case 'working':
                working.appendChild(avatar);
                break;
            case 'idle':
            default:
                idle.appendChild(avatar);
        }
    });
}

function createAgentAvatar(agent, state) {
    const div = document.createElement('div');
    div.className = `agent-avatar ${state.status}`;
    div.style.background = agent.color;
    div.innerHTML = `
        ${agent.name.substring(0, 2)}
        <div class="agent-tooltip">
            <strong>${agent.name}</strong> - ${agent.role}<br>
            ${state.task || 'Available'}
        </div>
    `;
    div.onclick = () => filterFeedByAgent(agent.id);
    return div;
}

function renderWaitingItems() {
    const container = document.getElementById('waiting-items');
    
    if (waitingItems.length === 0) {
        container.innerHTML = '<p style="color: #3fb950; padding: 10px;">✓ All clear! No items waiting.</p>';
        return;
    }
    
    container.innerHTML = waitingItems.map(item => {
        const agent = agents.find(a => a.id === item.agent);
        return `
            <div class="waiting-item">
                <div class="waiting-item-info">
                    <h4>${item.title}</h4>
                    <p>${agent.name}: ${item.desc}</p>
                </div>
                <div class="waiting-item-actions">
                    <button class="btn btn-approve" onclick="approveItem(${item.id})">Approve</button>
                    <button class="btn btn-view">View</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    container.innerHTML = projects.map(p => `
        <div class="project-card">
            <h4>${p.name}</h4>
            <span class="project-status ${p.status}">${p.status}</span>
            <div style="margin-top: 8px; background: #30363d; border-radius: 4px; height: 6px;">
                <div style="width: ${p.progress}%; background: #238636; height: 100%; border-radius: 4px;"></div>
            </div>
        </div>
    `).join('');
}

function renderActivityFeed() {
    const container = document.getElementById('feed-items');
    container.innerHTML = feedItems.map(item => {
        const agent = agents.find(a => a.id === item.agent);
        return `
            <div class="feed-item">
                <div class="feed-item-avatar" style="background: ${agent.color}">${agent.name.substring(0, 2)}</div>
                <div class="feed-item-content">
                    <strong>${agent.name}</strong> ${item.action}
                </div>
                <div class="feed-item-time">${item.time}</div>
            </div>
        `;
    }).join('');
}

function populateAgentFilter() {
    const select = document.getElementById('agent-filter');
    agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = agent.name;
        select.appendChild(option);
    });
    
    select.onchange = () => {
        if (select.value === 'all') {
            renderActivityFeed();
        } else {
            filterFeedByAgent(select.value);
        }
    };
}

function filterFeedByAgent(agentId) {
    const filtered = feedItems.filter(item => item.agent === agentId);
    const container = document.getElementById('feed-items');
    const agent = agents.find(a => a.id === agentId);
    
    if (filtered.length === 0) {
        container.innerHTML = `<p style="color: #8b949e; padding: 10px;">No recent activity from ${agent.name}</p>`;
        return;
    }
    
    container.innerHTML = filtered.map(item => `
        <div class="feed-item">
            <div class="feed-item-avatar" style="background: ${agent.color}">${agent.name.substring(0, 2)}</div>
            <div class="feed-item-content">
                <strong>${agent.name}</strong> ${item.action}
            </div>
            <div class="feed-item-time">${item.time}</div>
        </div>
    `).join('');
    
    document.getElementById('agent-filter').value = agentId;
}

function approveItem(id) {
    const index = waitingItems.findIndex(item => item.id === id);
    if (index > -1) {
        const item = waitingItems[index];
        const agent = agents.find(a => a.id === item.agent);
        
        // Add to feed
        feedItems.unshift({
            agent: item.agent,
            action: `received approval for "${item.title}"`,
            time: 'Just now'
        });
        
        // Update agent status
        agentStates[item.agent] = { status: 'working', task: item.title };
        
        // Remove from waiting
        waitingItems.splice(index, 1);
        
        // Re-render
        renderWaitingItems();
        renderActivityFeed();
        renderVirtualOffice();
    }
}

function simulateActivity() {
    const actions = [
        'started new task',
        'completed analysis',
        'updated documentation',
        'sent report',
        'finished review'
    ];
    
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    feedItems.unshift({
        agent: randomAgent.id,
        action: randomAction,
        time: 'Just now'
    });
    
    // Keep feed at reasonable size
    if (feedItems.length > 20) feedItems.pop();
    
    renderActivityFeed();
}

// Clear feed button
document.getElementById('clear-feed')?.addEventListener('click', () => {
    feedItems = [];
    renderActivityFeed();
});

console.log('Command Center v2 loaded - 16 agents online');
