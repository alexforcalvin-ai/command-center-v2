// Virtual Office - Pixel Art Canvas Engine
// Real-time agent visualization

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 800;

// Agent definitions
const agents = [
    { id: 'alex', name: 'Alex', role: 'CEO', color: '#8b5cf6' },
    { id: 'penny', name: 'Penny', role: 'Assistant', color: '#ec4899' },
    { id: 'owen', name: 'Owen', role: 'Operations', color: '#f59e0b' },
    { id: 'devin', name: 'Devin', role: 'Developer', color: '#10b981' },
    { id: 'denise', name: 'Denise', role: 'Design', color: '#06b6d4' },
    { id: 'molly', name: 'Molly', role: 'Medicare', color: '#ef4444' },
    { id: 'finn', name: 'Finn', role: 'Financial', color: '#22c55e' },
    { id: 'mark', name: 'Mark', role: 'Marketing', color: '#3b82f6' },
    { id: 'randy', name: 'Randy', role: 'R&D', color: '#a855f7' },
    { id: 'annie', name: 'Annie', role: 'Analyst', color: '#f97316' },
    { id: 'ivan', name: 'Ivan', role: 'Trader', color: '#eab308' },
    { id: 'tara', name: 'Tara', role: 'Travel', color: '#14b8a6' },
    { id: 'leo', name: 'Leo', role: 'Legal', color: '#6366f1' },
    { id: 'clara', name: 'Clara', role: 'Support', color: '#f472b6' },
    { id: 'simon', name: 'Simon', role: 'Security', color: '#64748b' },
    { id: 'henry', name: 'Henry', role: 'Health', color: '#84cc16' }
].map(a => ({ ...a, x: 100, y: 400, targetX: 100, targetY: 400, state: 'idle', task: '' }));

// Bigger, better laid out zones
const layout = {
    // Individual desks - 2 rows of 8 at the top
    desks: [
        // Top row
        { x: 80, y: 80, agent: 'alex' },
        { x: 180, y: 80, agent: 'penny' },
        { x: 280, y: 80, agent: 'owen' },
        { x: 380, y: 80, agent: 'devin' },
        { x: 900, y: 80, agent: 'denise' },
        { x: 1000, y: 80, agent: 'molly' },
        { x: 1100, y: 80, agent: 'finn' },
        { x: 1200, y: 80, agent: 'mark' },
        // Second row
        { x: 80, y: 180, agent: 'randy' },
        { x: 180, y: 180, agent: 'annie' },
        { x: 280, y: 180, agent: 'ivan' },
        { x: 380, y: 180, agent: 'tara' },
        { x: 900, y: 180, agent: 'leo' },
        { x: 1000, y: 180, agent: 'clara' },
        { x: 1100, y: 180, agent: 'simon' },
        { x: 1200, y: 180, agent: 'henry' }
    ],
    
    // Conference room - large central area
    conference: {
        x: 500, y: 280, w: 400, h: 200,
        seats: [
            { x: 560, y: 340 }, { x: 640, y: 340 }, { x: 720, y: 340 }, { x: 800, y: 340 },
            { x: 560, y: 420 }, { x: 640, y: 420 }, { x: 720, y: 420 }, { x: 800, y: 420 }
        ]
    },
    
    // Break room - left side
    breakRoom: {
        x: 50, y: 320, w: 350, h: 200,
        seats: [
            { x: 100, y: 380 }, { x: 180, y: 380 }, { x: 260, y: 380 },
            { x: 100, y: 460 }, { x: 180, y: 460 }, { x: 260, y: 460 },
            { x: 340, y: 380 }, { x: 340, y: 460 }
        ]
    },
    
    // Calvin's office - bottom center, large
    calvinsOffice: {
        x: 450, y: 550, w: 500, h: 220,
        desk: { x: 700, y: 660 },
        queue: [
            { x: 500, y: 620 }, { x: 560, y: 620 }, { x: 620, y: 620 },
            { x: 500, y: 700 }, { x: 560, y: 700 }, { x: 620, y: 700 }
        ],
        inside: { x: 780, y: 660 }
    }
};

let canvas, ctx;
let animationFrame = 0;
let selectedAgent = null;
let lastStateUpdate = 0;

// Simulated real-time states (in production, poll from backend)
let agentStates = {
    alex: { state: 'working', task: 'Coordinating team' },
    penny: { state: 'waiting', task: 'Calendar approval needed' },
    owen: { state: 'working', task: 'Processing applications' },
    devin: { state: 'working', task: 'Building Command Center' },
    denise: { state: 'meeting', task: 'Design review' },
    molly: { state: 'idle', task: '' },
    finn: { state: 'waiting', task: 'Needs QuickBooks access' },
    mark: { state: 'working', task: 'Marketing plan' },
    randy: { state: 'meeting', task: 'Research review' },
    annie: { state: 'idle', task: '' },
    ivan: { state: 'waiting', task: 'Trading credentials' },
    tara: { state: 'idle', task: '' },
    leo: { state: 'meeting', task: 'Policy review' },
    clara: { state: 'working', task: 'Support tickets' },
    simon: { state: 'meeting', task: 'Security review' },
    henry: { state: 'idle', task: '' }
};

function initOffice() {
    canvas = document.getElementById('office-canvas');
    if (!canvas) return;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Initial positioning
    updateAgentPositions();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Click handler
    canvas.addEventListener('click', handleClick);
    
    // Simulate state changes every few seconds
    setInterval(simulateStateChanges, 5000);
}

function updateAgentPositions() {
    // Count agents in each zone
    let confIdx = 0, breakIdx = 0, waitIdx = 0;
    
    agents.forEach(agent => {
        const state = agentStates[agent.id];
        agent.state = state.state;
        agent.task = state.task;
        
        let target;
        
        switch(agent.state) {
            case 'working':
                // Go to their assigned desk
                const desk = layout.desks.find(d => d.agent === agent.id);
                target = desk || layout.desks[0];
                break;
                
            case 'meeting':
                target = layout.conference.seats[confIdx % layout.conference.seats.length];
                confIdx++;
                break;
                
            case 'idle':
                target = layout.breakRoom.seats[breakIdx % layout.breakRoom.seats.length];
                breakIdx++;
                break;
                
            case 'waiting':
                target = layout.calvinsOffice.queue[waitIdx % layout.calvinsOffice.queue.length];
                waitIdx++;
                break;
                
            case 'talking':
                target = layout.calvinsOffice.inside;
                break;
                
            default:
                target = layout.breakRoom.seats[0];
        }
        
        agent.targetX = target.x;
        agent.targetY = target.y;
    });
}

function simulateStateChanges() {
    // Randomly change some agent states to simulate real activity
    const states = ['working', 'meeting', 'idle', 'waiting'];
    const tasks = {
        working: ['Processing tasks', 'Analyzing data', 'Writing report', 'Reviewing docs'],
        meeting: ['Team sync', 'Project review', 'Planning session', 'Collaboration'],
        idle: ['', 'Coffee break', 'Stretching', ''],
        waiting: ['Needs approval', 'Question for Calvin', 'Blocked on decision', 'Awaiting input']
    };
    
    // Change 1-3 random agents
    const numChanges = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numChanges; i++) {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const newState = states[Math.floor(Math.random() * states.length)];
        const taskList = tasks[newState];
        const newTask = taskList[Math.floor(Math.random() * taskList.length)];
        
        agentStates[agent.id] = { state: newState, task: newTask };
    }
    
    updateAgentPositions();
}

function gameLoop() {
    animationFrame++;
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Smooth movement toward targets
    agents.forEach(agent => {
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 3) {
            // Move toward target
            const speed = 2.5;
            agent.x += (dx / dist) * speed;
            agent.y += (dy / dist) * speed;
            agent.moving = true;
        } else {
            agent.x = agent.targetX;
            agent.y = agent.targetY;
            agent.moving = false;
        }
    });
}

function render() {
    // Clear
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Floor pattern
    ctx.fillStyle = '#0f0f1a';
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
        for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
            if ((x + y) % 100 === 0) {
                ctx.fillRect(x, y, 50, 50);
            }
        }
    }
    
    // Draw zones
    drawDesks();
    drawConferenceRoom();
    drawBreakRoom();
    drawCalvinsOffice();
    
    // Draw agents (sorted by Y for depth)
    [...agents].sort((a, b) => a.y - b.y).forEach(agent => drawAgent(agent));
}

function drawDesks() {
    layout.desks.forEach(desk => {
        // Desk
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(desk.x - 30, desk.y - 20, 60, 40);
        ctx.strokeStyle = '#2a2a4e';
        ctx.lineWidth = 2;
        ctx.strokeRect(desk.x - 30, desk.y - 20, 60, 40);
        
        // Monitor
        ctx.fillStyle = '#2a2a4e';
        ctx.fillRect(desk.x - 12, desk.y - 15, 24, 18);
        ctx.fillStyle = '#00cc33';
        ctx.fillRect(desk.x - 10, desk.y - 13, 20, 14);
        
        // Name plate
        const agent = agents.find(a => a.id === desk.agent);
        if (agent) {
            ctx.fillStyle = '#666';
            ctx.font = '6px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(agent.name, desk.x, desk.y + 30);
        }
    });
}

function drawConferenceRoom() {
    const c = layout.conference;
    
    // Room
    ctx.fillStyle = '#12122a';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    
    // Table
    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(c.x + 80, c.y + 60, 240, 80);
    ctx.strokeStyle = '#3a3a5e';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 80, c.y + 60, 240, 80);
    
    // Label
    ctx.fillStyle = '#3b82f6';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('CONFERENCE ROOM', c.x + c.w/2, c.y + 25);
}

function drawBreakRoom() {
    const b = layout.breakRoom;
    
    // Room
    ctx.fillStyle = '#121520';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    
    // Couch
    ctx.fillStyle = '#4a4a6e';
    ctx.fillRect(b.x + 20, b.y + 100, 120, 40);
    
    // Coffee table
    ctx.fillStyle = '#3a3a4e';
    ctx.fillRect(b.x + 160, b.y + 90, 60, 50);
    
    // Coffee machine
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(b.x + 280, b.y + 40, 40, 60);
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(b.x + 285, b.y + 50, 10, 10);
    
    // Label
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('BREAK ROOM', b.x + b.w/2, b.y + 25);
}

function drawCalvinsOffice() {
    const o = layout.calvinsOffice;
    
    // Room
    ctx.fillStyle = '#1a1015';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 4;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    
    // Calvin's desk
    ctx.fillStyle = '#3a2a4e';
    ctx.fillRect(o.desk.x - 50, o.desk.y - 25, 100, 50);
    
    // Calvin
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(o.desk.x, o.desk.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffed4a';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#1a1015';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('C', o.desk.x, o.desk.y + 6);
    
    // Queue markers
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(o.x + 30, o.y + 60);
    ctx.lineTo(o.x + 200, o.y + 60);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#f85149';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText("CALVIN'S OFFICE", o.x + o.w/2, o.y + 25);
    
    ctx.fillStyle = '#888';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('WAITING LINE', o.x + 115, o.y + 80);
}

function drawAgent(agent) {
    const x = Math.round(agent.x);
    const y = Math.round(agent.y);
    
    // Walking animation
    const walkCycle = agent.moving ? Math.floor(animationFrame / 8) % 4 : 0;
    const bobOffset = agent.moving ? Math.sin(animationFrame / 5) * 3 : Math.sin(animationFrame / 20) * 1;
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Legs (if walking)
    if (agent.moving) {
        ctx.fillStyle = '#333';
        const legOffset = walkCycle < 2 ? 3 : -3;
        ctx.fillRect(x - 5 + legOffset, y + 8, 4, 12);
        ctx.fillRect(x + 1 - legOffset, y + 8, 4, 12);
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 5, y + 8, 4, 12);
        ctx.fillRect(x + 1, y + 8, 4, 12);
    }
    
    // Body
    ctx.fillStyle = agent.color;
    ctx.fillRect(x - 10, y - 8 + bobOffset, 20, 20);
    
    // Head
    ctx.fillStyle = '#ffd5b8';
    ctx.beginPath();
    ctx.arc(x, y - 16 + bobOffset, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x - 5, y - 18 + bobOffset, 3, 4);
    ctx.fillRect(x + 2, y - 18 + bobOffset, 3, 4);
    
    // Hair
    ctx.fillStyle = agent.color;
    ctx.beginPath();
    ctx.arc(x, y - 22 + bobOffset, 8, Math.PI, 0);
    ctx.fill();
    
    // Name
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(agent.name.toUpperCase(), x, y + 42);
    
    // State indicator
    let stateColor;
    switch(agent.state) {
        case 'working': stateColor = '#00ff41'; break;
        case 'meeting': stateColor = '#3b82f6'; break;
        case 'waiting': stateColor = '#f85149'; break;
        case 'talking': stateColor = '#ffd700'; break;
        default: stateColor = '#6b7280';
    }
    
    ctx.fillStyle = stateColor;
    ctx.beginPath();
    ctx.arc(x + 14, y - 24 + bobOffset, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Task bubble if working/waiting
    if (agent.task && (agent.state === 'working' || agent.state === 'waiting')) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        const textWidth = ctx.measureText(agent.task).width;
        ctx.fillRect(x - textWidth/2 - 5, y - 50 + bobOffset, textWidth + 10, 16);
        ctx.fillStyle = '#fff';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText(agent.task, x, y - 40 + bobOffset);
    }
    
    // Selection highlight
    if (selectedAgent === agent) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x - 18, y - 35 + bobOffset, 36, 70);
        ctx.setLineDash([]);
    }
}

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    selectedAgent = null;
    agents.forEach(agent => {
        const dist = Math.sqrt((clickX - agent.x) ** 2 + (clickY - agent.y) ** 2);
        if (dist < 25) selectedAgent = agent;
    });
    
    updateInfoPanel();
}

function updateInfoPanel() {
    const panel = document.getElementById('agent-info-panel');
    if (!panel) return;
    
    if (selectedAgent) {
        const states = {
            working: '💻 Working at desk',
            meeting: '🤝 In conference room',
            waiting: '⏳ Waiting on Calvin',
            talking: '💬 With Calvin',
            idle: '☕ On break'
        };
        panel.innerHTML = `
            <span style="color:${selectedAgent.color};font-size:12px;">${selectedAgent.name}</span>
            <span style="color:#888;font-size:10px;"> — ${selectedAgent.role}</span><br>
            <span style="font-size:10px;">${states[selectedAgent.state]}</span>
            ${selectedAgent.task ? `<br><span style="color:#aaa;font-size:8px;">${selectedAgent.task}</span>` : ''}
        `;
    } else {
        panel.textContent = 'Click an agent to see details';
    }
}

// Public API
window.moveAgentTo = function(agentId, newState, task = '') {
    agentStates[agentId] = { state: newState, task };
    updateAgentPositions();
};

window.agents = agents;
window.agentStates = agentStates;

document.addEventListener('DOMContentLoaded', initOffice);
