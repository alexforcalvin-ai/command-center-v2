// Virtual Office - Pixel Art Canvas Engine

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const GRID_SIZE = 10;

// Agent definitions with pixel colors
const agents = [
    { id: 'alex', name: 'Alex', role: 'CEO', color: '#8b5cf6', x: 0, y: 0, targetX: 0, targetY: 0, state: 'working' },
    { id: 'penny', name: 'Penny', role: 'Assistant', color: '#ec4899', x: 0, y: 0, targetX: 0, targetY: 0, state: 'waiting' },
    { id: 'owen', name: 'Owen', role: 'Operations', color: '#f59e0b', x: 0, y: 0, targetX: 0, targetY: 0, state: 'working' },
    { id: 'devin', name: 'Devin', role: 'Developer', color: '#10b981', x: 0, y: 0, targetX: 0, targetY: 0, state: 'working' },
    { id: 'denise', name: 'Denise', role: 'Design', color: '#06b6d4', x: 0, y: 0, targetX: 0, targetY: 0, state: 'meeting' },
    { id: 'molly', name: 'Molly', role: 'Medicare', color: '#ef4444', x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle' },
    { id: 'finn', name: 'Finn', role: 'Financial', color: '#22c55e', x: 0, y: 0, targetX: 0, targetY: 0, state: 'waiting' },
    { id: 'mark', name: 'Mark', role: 'Marketing', color: '#3b82f6', x: 0, y: 0, targetX: 0, targetY: 0, state: 'working' },
    { id: 'randy', name: 'Randy', role: 'R&D', color: '#a855f7', x: 0, y: 0, targetX: 0, targetY: 0, state: 'meeting' },
    { id: 'annie', name: 'Annie', role: 'Analyst', color: '#f97316', x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle' },
    { id: 'ivan', name: 'Ivan', role: 'Trader', color: '#eab308', x: 0, y: 0, targetX: 0, targetY: 0, state: 'waiting' },
    { id: 'tara', name: 'Tara', role: 'Travel', color: '#14b8a6', x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle' },
    { id: 'leo', name: 'Leo', role: 'Legal', color: '#6366f1', x: 0, y: 0, targetX: 0, targetY: 0, state: 'meeting' },
    { id: 'clara', name: 'Clara', role: 'Support', color: '#f472b6', x: 0, y: 0, targetX: 0, targetY: 0, state: 'working' },
    { id: 'simon', name: 'Simon', role: 'Security', color: '#64748b', x: 0, y: 0, targetX: 0, targetY: 0, state: 'meeting' },
    { id: 'henry', name: 'Henry', role: 'Health', color: '#84cc16', x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle' }
];

// Office zones
const zones = {
    // Agent desks around perimeter
    desks: [
        { x: 40, y: 60 }, { x: 140, y: 60 }, { x: 240, y: 60 }, { x: 340, y: 60 },
        { x: 40, y: 160 }, { x: 40, y: 260 }, { x: 40, y: 360 }, { x: 40, y: 460 },
        { x: 1100, y: 60 }, { x: 1000, y: 60 }, { x: 900, y: 60 }, { x: 800, y: 60 },
        { x: 1100, y: 160 }, { x: 1100, y: 260 }, { x: 1100, y: 360 }, { x: 1100, y: 460 }
    ],
    // Conference room center
    conference: { x: 500, y: 200, w: 200, h: 150 },
    conferenceSeats: [
        { x: 520, y: 240 }, { x: 580, y: 240 }, { x: 640, y: 240 },
        { x: 520, y: 310 }, { x: 580, y: 310 }, { x: 640, y: 310 }
    ],
    // Break room
    breakRoom: { x: 150, y: 400, w: 150, h: 100 },
    breakSeats: [
        { x: 170, y: 430 }, { x: 220, y: 430 }, { x: 270, y: 430 },
        { x: 170, y: 480 }, { x: 220, y: 480 }, { x: 270, y: 480 }
    ],
    // Calvin's office
    calvinsOffice: { x: 450, y: 520, w: 300, h: 150 },
    calvinDesk: { x: 580, y: 580 },
    waitingQueue: [
        { x: 470, y: 550 }, { x: 510, y: 550 }, { x: 550, y: 550 },
        { x: 470, y: 600 }, { x: 510, y: 600 }
    ],
    insideCalvin: { x: 650, y: 580 }
};

let canvas, ctx;
let animationFrame = 0;
let selectedAgent = null;

function initOffice() {
    canvas = document.getElementById('office-canvas');
    if (!canvas) return;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Position agents initially
    positionAgents();
    
    // Start animation loop
    requestAnimationFrame(gameLoop);
    
    // Click handler
    canvas.addEventListener('click', handleCanvasClick);
}

function positionAgents() {
    let deskIdx = 0, confIdx = 0, breakIdx = 0, waitIdx = 0;
    
    agents.forEach(agent => {
        let pos;
        switch(agent.state) {
            case 'working':
                pos = zones.desks[deskIdx % zones.desks.length];
                deskIdx++;
                break;
            case 'meeting':
                pos = zones.conferenceSeats[confIdx % zones.conferenceSeats.length];
                confIdx++;
                break;
            case 'idle':
                pos = zones.breakSeats[breakIdx % zones.breakSeats.length];
                breakIdx++;
                break;
            case 'waiting':
                pos = zones.waitingQueue[waitIdx % zones.waitingQueue.length];
                waitIdx++;
                break;
            case 'talking':
                pos = zones.insideCalvin;
                break;
            default:
                pos = zones.desks[0];
        }
        agent.x = pos.x;
        agent.y = pos.y;
        agent.targetX = pos.x;
        agent.targetY = pos.y;
    });
}

function gameLoop() {
    animationFrame++;
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Move agents toward targets
    agents.forEach(agent => {
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 2) {
            agent.x += (dx / dist) * 2;
            agent.y += (dy / dist) * 2;
        } else {
            agent.x = agent.targetX;
            agent.y = agent.targetY;
        }
    });
}

function render() {
    // Clear
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw floor grid (subtle)
    ctx.strokeStyle = '#151525';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
    
    // Draw zones
    drawZones();
    
    // Draw agents
    agents.forEach(agent => drawAgent(agent));
}

function drawZones() {
    // Desks
    zones.desks.forEach((desk, i) => {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(desk.x - 25, desk.y - 20, 50, 40);
        ctx.strokeStyle = '#30363d';
        ctx.strokeRect(desk.x - 25, desk.y - 20, 50, 40);
        
        // Computer
        ctx.fillStyle = '#2a2a4e';
        ctx.fillRect(desk.x - 10, desk.y - 15, 20, 15);
        ctx.fillStyle = '#00ff41';
        ctx.fillRect(desk.x - 8, desk.y - 13, 16, 10);
    });
    
    // Conference room
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(zones.conference.x, zones.conference.y, zones.conference.w, zones.conference.h);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(zones.conference.x, zones.conference.y, zones.conference.w, zones.conference.h);
    
    // Conference table
    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(zones.conference.x + 30, zones.conference.y + 40, 140, 70);
    
    // Label
    ctx.fillStyle = '#3b82f6';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText('CONFERENCE', zones.conference.x + 40, zones.conference.y + 20);
    
    // Break room
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(zones.breakRoom.x, zones.breakRoom.y, zones.breakRoom.w, zones.breakRoom.h);
    ctx.strokeStyle = '#8b949e';
    ctx.lineWidth = 2;
    ctx.strokeRect(zones.breakRoom.x, zones.breakRoom.y, zones.breakRoom.w, zones.breakRoom.h);
    
    // Couch
    ctx.fillStyle = '#4a4a6e';
    ctx.fillRect(zones.breakRoom.x + 20, zones.breakRoom.y + 50, 60, 30);
    
    // Coffee
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(zones.breakRoom.x + 100, zones.breakRoom.y + 30, 30, 20);
    
    ctx.fillStyle = '#8b949e';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('BREAK ROOM', zones.breakRoom.x + 20, zones.breakRoom.y + 20);
    
    // Calvin's office
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(zones.calvinsOffice.x, zones.calvinsOffice.y, zones.calvinsOffice.w, zones.calvinsOffice.h);
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 3;
    ctx.strokeRect(zones.calvinsOffice.x, zones.calvinsOffice.y, zones.calvinsOffice.w, zones.calvinsOffice.h);
    
    // Calvin's desk
    ctx.fillStyle = '#3a2a4e';
    ctx.fillRect(zones.calvinDesk.x - 30, zones.calvinDesk.y - 15, 60, 30);
    
    // Calvin avatar
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(zones.calvinDesk.x, zones.calvinDesk.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a1a';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('C', zones.calvinDesk.x, zones.calvinDesk.y + 4);
    
    ctx.fillStyle = '#f85149';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText("CALVIN'S OFFICE", zones.calvinsOffice.x + 60, zones.calvinsOffice.y + 20);
    
    // Queue line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(zones.calvinsOffice.x + 20, zones.calvinsOffice.y + 40);
    ctx.lineTo(zones.calvinsOffice.x + 120, zones.calvinsOffice.y + 40);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#8b949e';
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText('QUEUE', zones.calvinsOffice.x + 40, zones.calvinsOffice.y + 50);
}

function drawAgent(agent) {
    const x = agent.x;
    const y = agent.y;
    const bobOffset = Math.sin(animationFrame / 10 + agents.indexOf(agent)) * 2;
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.fillStyle = agent.color;
    ctx.fillRect(x - 8, y - 5 + bobOffset, 16, 20);
    
    // Head
    ctx.fillStyle = '#ffd5b8';
    ctx.beginPath();
    ctx.arc(x, y - 12 + bobOffset, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(x - 4, y - 14 + bobOffset, 3, 3);
    ctx.fillRect(x + 1, y - 14 + bobOffset, 3, 3);
    
    // Hair (color matches agent)
    ctx.fillStyle = agent.color;
    ctx.fillRect(x - 8, y - 20 + bobOffset, 16, 6);
    
    // Name tag - full name
    ctx.fillStyle = agent.color;
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(agent.name.toUpperCase(), x, y + 35);
    
    // State indicator
    let indicatorColor;
    switch(agent.state) {
        case 'working': indicatorColor = '#00ff41'; break;
        case 'meeting': indicatorColor = '#3b82f6'; break;
        case 'waiting': indicatorColor = '#f85149'; break;
        case 'talking': indicatorColor = '#ffd700'; break;
        default: indicatorColor = '#8b949e';
    }
    
    ctx.fillStyle = indicatorColor;
    ctx.beginPath();
    ctx.arc(x + 12, y - 20 + bobOffset, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight selected
    if (selectedAgent === agent) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 15, y - 25 + bobOffset, 30, 55);
    }
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    selectedAgent = null;
    
    agents.forEach(agent => {
        const dx = clickX - agent.x;
        const dy = clickY - agent.y;
        if (Math.sqrt(dx*dx + dy*dy) < 20) {
            selectedAgent = agent;
        }
    });
    
    updateInfoPanel();
}

function updateInfoPanel() {
    const panel = document.getElementById('agent-info-panel');
    if (!panel) return;
    
    if (selectedAgent) {
        const stateText = {
            'working': '💻 Working at desk',
            'meeting': '🤝 In conference room',
            'waiting': '⏳ Waiting on Calvin',
            'talking': '💬 Talking to Calvin',
            'idle': '☕ On break'
        };
        panel.innerHTML = `
            <span style="color: ${selectedAgent.color}">${selectedAgent.name}</span> - ${selectedAgent.role}<br>
            ${stateText[selectedAgent.state] || selectedAgent.state}
        `;
    } else {
        panel.textContent = 'Click an agent to see details';
    }
}

// Move agent to new state
function moveAgentTo(agentId, newState) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    agent.state = newState;
    
    // Calculate new position
    let pos;
    switch(newState) {
        case 'working':
            const deskIdx = agents.filter(a => a.state === 'working').indexOf(agent);
            pos = zones.desks[deskIdx % zones.desks.length];
            break;
        case 'meeting':
            const confIdx = agents.filter(a => a.state === 'meeting').indexOf(agent);
            pos = zones.conferenceSeats[confIdx % zones.conferenceSeats.length];
            break;
        case 'idle':
            const breakIdx = agents.filter(a => a.state === 'idle').indexOf(agent);
            pos = zones.breakSeats[breakIdx % zones.breakSeats.length];
            break;
        case 'waiting':
            const waitIdx = agents.filter(a => a.state === 'waiting').indexOf(agent);
            pos = zones.waitingQueue[waitIdx % zones.waitingQueue.length];
            break;
        case 'talking':
            pos = zones.insideCalvin;
            break;
    }
    
    if (pos) {
        agent.targetX = pos.x;
        agent.targetY = pos.y;
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', initOffice);

// Export for use in app.js
window.moveAgentTo = moveAgentTo;
window.agents = agents;
