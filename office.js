// Virtual Office - Pixel Art Canvas Engine
// Real-time agent visualization

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 850;

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

// Layout with Alex's Office added
const layout = {
    // Individual desks - 2 rows of 8 at the top
    desks: [
        // Top row
        { x: 80, y: 80, agent: 'penny' },
        { x: 180, y: 80, agent: 'owen' },
        { x: 280, y: 80, agent: 'devin' },
        { x: 380, y: 80, agent: 'denise' },
        { x: 900, y: 80, agent: 'molly' },
        { x: 1000, y: 80, agent: 'finn' },
        { x: 1100, y: 80, agent: 'mark' },
        { x: 1200, y: 80, agent: 'randy' },
        // Second row
        { x: 80, y: 180, agent: 'annie' },
        { x: 180, y: 180, agent: 'ivan' },
        { x: 280, y: 180, agent: 'tara' },
        { x: 380, y: 180, agent: 'leo' },
        { x: 900, y: 180, agent: 'clara' },
        { x: 1000, y: 180, agent: 'simon' },
        { x: 1100, y: 180, agent: 'henry' }
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
    
    // Alex's Office (CEO) - right side
    alexOffice: {
        x: 1000, y: 320, w: 350, h: 200,
        desk: { x: 1175, y: 420 },
        meetingSpots: [
            { x: 1050, y: 380 }, { x: 1100, y: 380 }, { x: 1150, y: 380 },
            { x: 1050, y: 440 }, { x: 1100, y: 440 }
        ]
    },
    
    // Calvin's office - bottom center, large
    calvinsOffice: {
        x: 450, y: 570, w: 500, h: 250,
        desk: { x: 700, y: 700 },
        queue: [
            { x: 500, y: 640 }, { x: 560, y: 640 }, { x: 620, y: 640 },
            { x: 500, y: 720 }, { x: 560, y: 720 }, { x: 620, y: 720 }
        ],
        inside: { x: 780, y: 700 }
    }
};

let canvas, ctx;
let animationFrame = 0;
let selectedAgent = null;
let lastStateUpdate = 0;

// Central agent state - this is what gets synced with Command Center
let agentStates = {};

// Separate queue for items waiting on Calvin - persists regardless of agent location
let waitingQueue = [];

// Load initial states from localStorage or use defaults
function loadAgentStates() {
    // Check version - if old version, reset to get new data structure
    const version = localStorage.getItem('commandCenterVersion');
    const CURRENT_VERSION = '2.2'; // Bumped to reset Calvin's cleared queue
    
    if (version !== CURRENT_VERSION) {
        // New version - reset everything to get new defaults
        console.log('Command Center updated - resetting to new defaults');
        localStorage.removeItem('agentStates');
        localStorage.removeItem('waitingQueue');
        localStorage.setItem('commandCenterVersion', CURRENT_VERSION);
    }
    
    const saved = localStorage.getItem('agentStates');
    if (saved) {
        try {
            agentStates = JSON.parse(saved);
        } catch(e) {
            agentStates = getDefaultStates();
        }
    } else {
        agentStates = getDefaultStates();
    }
    
    // Load waiting queue separately
    const savedQueue = localStorage.getItem('waitingQueue');
    if (savedQueue) {
        try {
            waitingQueue = JSON.parse(savedQueue);
        } catch(e) {
            waitingQueue = getDefaultWaitingQueue();
        }
    } else {
        waitingQueue = getDefaultWaitingQueue();
    }
    
    // Sync visual states - agents with items in queue should show as waiting
    syncVisualStatesWithQueue();
}

function syncVisualStatesWithQueue() {
    // Get all agent IDs that have items in the waiting queue
    const agentsWithWaitingItems = new Set(waitingQueue.map(item => item.agentId));
    
    // Update visual states - agents with queue items should be in Calvin's office
    for (const agentId of agentsWithWaitingItems) {
        if (agentStates[agentId] && agentStates[agentId].state !== 'waiting') {
            // They have a waiting item but aren't visually waiting - update
            const queueItem = waitingQueue.find(i => i.agentId === agentId);
            if (queueItem) {
                agentStates[agentId].state = 'waiting';
                agentStates[agentId].task = queueItem.title;
            }
        }
    }
    
    // Also: agents visually waiting but without queue items should go back to working
    for (const [agentId, state] of Object.entries(agentStates)) {
        if (state.state === 'waiting' && !agentsWithWaitingItems.has(agentId)) {
            agentStates[agentId].state = 'working';
            agentStates[agentId].task = 'Back to work';
        }
    }
}

function getDefaultWaitingQueue() {
    return [
        {
            id: 'penny-podcast-conflict',
            agentId: 'penny',
            createdAt: Date.now() - 1800000, // 30 min ago
            title: 'Podcast Scheduling Conflict - Need Your Call',
            desc: 'Two podcasts want the same slot, which do you prefer?',
            context: `Two podcast hosts responded at the same time and both want Thursday Feb 13 at 2pm PST:

**Option A: "The Entrepreneur's Journey" with Mike Davidson**
- 50K downloads/episode
- Focus: Business origin stories, overcoming adversity
- Perfect fit for "Hiding from the School Bus" promotion
- Mike specifically mentioned reading your book and loving it

**Option B: "Medicare Decoded" with Sarah Chen**
- 25K downloads/episode  
- Focus: Medicare industry deep-dives, policy discussion
- Great for Nuvo Health/PlanFit positioning
- Sarah wants to discuss the CMS 2027 Final Rule

Both are solid opportunities. I can only book one for Thursday. The other I'd need to push to next week.`,
            whatINeed: [
                'Which podcast should get the Thursday 2pm slot?',
                'Should I try to book the other one for Monday Feb 17 or Tuesday Feb 18?'
            ],
            whyItMatters: 'Both hosts are waiting on confirmation. First-mover advantage - if we delay too long, they may fill the slot with someone else.',
            deadline: 'Need to respond within 24 hours to hold either slot',
            alternatives: 'I could also ask both if they have flexibility on time/date, but that risks losing both if they fill their preferred slots.'
        },
        {
            id: 'mark-linkedin-post',
            agentId: 'mark',
            createdAt: Date.now() - 3600000, // 1 hour ago
            title: 'LinkedIn Post Ready for Review',
            desc: 'Drafted post about CMS transparency - need your approval before posting',
            context: `Here's the draft LinkedIn post I wrote based on your recent talking points:

---
**The CMS transparency problem nobody's talking about:**

When I testify in DC next month, I'll be asking a simple question: Why can't Medicare beneficiaries see the commissions agents earn?

Here's what happens today:
• Agent recommends Plan A (pays $600 commission)
• Beneficiary has no idea Plan B (pays $200) might be better for them
• The agent isn't required to disclose this conflict

I'm not saying most agents are bad actors. Most aren't. But the SYSTEM creates misaligned incentives.

At PlanFit, we solved this by paying agents salary only. Same paycheck whether you enroll someone in a $0 or $600 plan.

Radical transparency shouldn't be radical.

What do you think - should commission disclosure be mandatory?
---

**Stats:** ~2,100 characters. Good length for engagement. I'd post Tuesday morning 8am PST for maximum visibility.`,
            whatINeed: [
                'Approve this draft as-is?',
                'Or provide edits/feedback?',
                'Confirm Tuesday 8am PST posting time works?'
            ],
            whyItMatters: 'This aligns with your DC testimony prep and positions you as the transparency advocate. Good timing before your CMS meetings.',
            deadline: 'Need approval by Monday evening to hit Tuesday morning slot',
            alternatives: 'Could also split into a thread format, or save for after the DC testimony if you want to reference it.'
        },
        {
            id: 'finn-quickbooks',
            agentId: 'finn',
            createdAt: Date.now() - 7200000, // 2 hours ago
            title: 'QuickBooks Access for Financial Dashboards',
            desc: 'Need credentials to start building automated financial tracking',
            context: `I'm ready to build your financial command center, but I need access to the books.

**What I'll create once connected:**
- Real-time revenue dashboard across all entities
- Cash flow alerts (notify you if any account drops below threshold)
- Monthly P&L auto-generated and sent to you
- Expense anomaly detection (flag unusual charges)
- Commission tracking by agent (for Medicare Store locations)

**Current accounting setup I found:**
- Nuvo Health: QuickBooks Online (confirmed with Karissa)
- PlanFit: Likely separate QuickBooks instance
- Medicare Store locations: Unknown - may be consolidated or separate

I need to know what's where before I can connect.`,
            whatINeed: [
                'QuickBooks Online login for Nuvo Health (or admin invite to finn@alex.calvinbagley.com)',
                'Confirmation: Is PlanFit on separate books or consolidated with Nuvo?',
                'Who currently does bookkeeping? (So I can coordinate, not step on toes)'
            ],
            whyItMatters: 'You mentioned wanting better financial visibility. I can\'t provide that without access. Once connected, I can have your first dashboard ready within 48 hours.',
            deadline: 'No hard deadline - but every day without access is a day without visibility',
            alternatives: 'If you\'re not comfortable giving me direct access, I can work with read-only API access, or just receive exported reports to analyze.'
        }
    ];
}

function getDefaultStates() {
    // Agent visual states are separate from waiting queue
    // An agent can be working/meeting and still have items in Calvin's queue
    return {
        alex: { state: 'alexOffice', task: 'Coordinating team' },
        penny: { state: 'working', task: 'Managing calendars' },
        owen: { state: 'working', task: 'Processing applications' },
        devin: { state: 'working', task: 'Building Command Center' },
        denise: { state: 'meeting', task: 'Design review' },
        molly: { state: 'idle', task: '' },
        finn: { state: 'working', task: 'Preparing financial reports' },  // Has item in queue but working
        mark: { state: 'working', task: 'Marketing plan' },
        randy: { state: 'meeting', task: 'Research review' },
        annie: { state: 'idle', task: '' },
        ivan: { state: 'working', task: 'Market analysis' },  // Has item in queue but working
        tara: { state: 'idle', task: '' },
        leo: { state: 'withAlex', task: 'Policy review' },
        clara: { state: 'working', task: 'Support tickets' },
        simon: { state: 'withAlex', task: 'Security review' },
        henry: { state: 'idle', task: '' }
    };
}

function saveAgentStates() {
    localStorage.setItem('agentStates', JSON.stringify(agentStates));
    localStorage.setItem('waitingQueue', JSON.stringify(waitingQueue));
    // Dispatch event for Command Center to pick up
    window.dispatchEvent(new CustomEvent('agentStatesUpdated', { detail: agentStates }));
    window.dispatchEvent(new CustomEvent('waitingQueueUpdated', { detail: waitingQueue }));
}

function initOffice() {
    canvas = document.getElementById('office-canvas');
    if (!canvas) return;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Load states
    loadAgentStates();
    
    // Initial positioning
    updateAgentPositions();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Click handler
    canvas.addEventListener('click', handleClick);
    
    // Simulate state changes every 8 seconds (in production, this would be real data)
    setInterval(simulateStateChanges, 8000);
}

function updateAgentPositions() {
    // Count agents in each zone
    let confIdx = 0, breakIdx = 0, waitIdx = 0, alexMeetIdx = 0;
    
    agents.forEach(agent => {
        const state = agentStates[agent.id] || { state: 'idle', task: '' };
        agent.state = state.state;
        agent.task = state.task;
        agent.waitingItem = state.waitingItem;
        
        let target;
        
        switch(agent.state) {
            case 'working':
                // Go to their assigned desk
                const desk = layout.desks.find(d => d.agent === agent.id);
                target = desk || layout.breakRoom.seats[0];
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
                
            case 'withCalvin':
                target = layout.calvinsOffice.inside;
                break;
                
            case 'alexOffice':
                // Alex at his desk
                target = layout.alexOffice.desk;
                break;
                
            case 'withAlex':
                // Meeting with Alex
                target = layout.alexOffice.meetingSpots[alexMeetIdx % layout.alexOffice.meetingSpots.length];
                alexMeetIdx++;
                break;
                
            default:
                target = layout.breakRoom.seats[0];
        }
        
        agent.targetX = target.x;
        agent.targetY = target.y;
    });
}

function simulateStateChanges() {
    // In production, this would poll from a real data source
    // For now, occasional random changes to show the system works
    const states = ['working', 'meeting', 'idle', 'waiting', 'withAlex'];
    const tasks = {
        working: ['Processing tasks', 'Analyzing data', 'Writing report', 'Reviewing docs', 'Building features'],
        meeting: ['Team sync', 'Project review', 'Planning session', 'Collaboration'],
        idle: ['', 'Coffee break', 'Stretching', ''],
        waiting: ['Needs approval', 'Question for Calvin', 'Blocked on decision', 'Awaiting input'],
        withAlex: ['1:1 meeting', 'Project discussion', 'Status update']
    };
    
    // Change 1-2 random agents (but not Alex)
    const numChanges = Math.floor(Math.random() * 2) + 1;
    const nonAlexAgents = agents.filter(a => a.id !== 'alex');
    
    for (let i = 0; i < numChanges; i++) {
        const agent = nonAlexAgents[Math.floor(Math.random() * nonAlexAgents.length)];
        const newState = states[Math.floor(Math.random() * states.length)];
        const taskList = tasks[newState];
        const newTask = taskList[Math.floor(Math.random() * taskList.length)];
        
        // Generate waiting item if waiting
        let waitingItem = null;
        if (newState === 'waiting') {
            const waitingReasons = [
                { title: 'Approval Needed', desc: 'Requires sign-off to proceed' },
                { title: 'Question', desc: 'Need clarification on project scope' },
                { title: 'Access Request', desc: 'Need credentials or permissions' },
                { title: 'Decision Required', desc: 'Multiple options, need direction' }
            ];
            waitingItem = waitingReasons[Math.floor(Math.random() * waitingReasons.length)];
        }
        
        agentStates[agent.id] = { state: newState, task: newTask, waitingItem };
    }
    
    saveAgentStates();
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
    drawAlexOffice();
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

function drawAlexOffice() {
    const o = layout.alexOffice;
    
    // Room
    ctx.fillStyle = '#15101a';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 4;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    
    // Alex's desk
    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(o.desk.x - 50, o.desk.y - 25, 100, 50);
    ctx.strokeStyle = '#3a3a5e';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.desk.x - 50, o.desk.y - 25, 100, 50);
    
    // Monitor on desk
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(o.desk.x - 15, o.desk.y - 20, 30, 22);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(o.desk.x - 13, o.desk.y - 18, 26, 18);
    
    // Meeting chairs
    o.meetingSpots.forEach(spot => {
        ctx.fillStyle = '#3a3a5e';
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 12, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Label
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText("ALEX'S OFFICE", o.x + o.w/2, o.y + 25);
    
    ctx.fillStyle = '#666';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('CEO', o.x + o.w/2, o.y + 42);
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
    
    // Legs
    ctx.fillStyle = '#333';
    if (agent.moving) {
        const legOffset = walkCycle < 2 ? 3 : -3;
        ctx.fillRect(x - 5 + legOffset, y + 8, 4, 12);
        ctx.fillRect(x + 1 - legOffset, y + 8, 4, 12);
    } else {
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
        case 'withCalvin': stateColor = '#ffd700'; break;
        case 'alexOffice': stateColor = '#8b5cf6'; break;
        case 'withAlex': stateColor = '#a78bfa'; break;
        default: stateColor = '#6b7280';
    }
    
    ctx.fillStyle = stateColor;
    ctx.beginPath();
    ctx.arc(x + 14, y - 24 + bobOffset, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Task bubble
    if (agent.task && ['working', 'waiting', 'withAlex', 'alexOffice'].includes(agent.state)) {
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
            withCalvin: '💬 With Calvin',
            idle: '☕ On break',
            alexOffice: '🏢 In CEO office',
            withAlex: '💼 Meeting with Alex'
        };
        panel.innerHTML = `
            <span style="color:${selectedAgent.color};font-size:12px;">${selectedAgent.name}</span>
            <span style="color:#888;font-size:10px;"> — ${selectedAgent.role}</span><br>
            <span style="font-size:10px;">${states[selectedAgent.state] || selectedAgent.state}</span>
            ${selectedAgent.task ? `<br><span style="color:#aaa;font-size:8px;">${selectedAgent.task}</span>` : ''}
        `;
    } else {
        panel.textContent = 'Click an agent to see details';
    }
}

// Public API
window.moveAgentTo = function(agentId, newState, task = '', waitingItem = null) {
    agentStates[agentId] = { state: newState, task, waitingItem };
    saveAgentStates();
    updateAgentPositions();
};

window.getAgentStates = function() {
    return agentStates;
};

window.getWaitingItems = function() {
    // Return from the persistent waiting queue, not agent visual state
    return waitingQueue.map(item => {
        const agent = agents.find(a => a.id === item.agentId);
        return {
            ...item,
            agent: agent ? agent.name : item.agentId,
            agentColor: agent ? agent.color : '#666',
            agentRole: agent ? agent.role : ''
        };
    });
};

window.addToWaitingQueue = function(agentId, item) {
    // Add a new item to the waiting queue
    const newItem = {
        id: `${agentId}-${Date.now()}`,
        agentId: agentId,
        createdAt: Date.now(),
        ...item
    };
    waitingQueue.push(newItem);
    
    // Move agent to waiting state visually
    if (agentStates[agentId]) {
        agentStates[agentId].state = 'waiting';
        agentStates[agentId].task = item.title || 'Needs Calvin';
    }
    
    saveAgentStates();
    updateAgentPositions();
    return newItem.id;
};

window.removeFromWaitingQueue = function(itemId) {
    const idx = waitingQueue.findIndex(i => i.id === itemId);
    if (idx > -1) {
        const removedItem = waitingQueue[idx];
        waitingQueue.splice(idx, 1);
        
        // If this agent has no more items in queue, move them out of waiting
        const agentId = removedItem.agentId;
        const hasMoreItems = waitingQueue.some(i => i.agentId === agentId);
        if (!hasMoreItems && agentStates[agentId]) {
            agentStates[agentId].state = 'working';
            agentStates[agentId].task = 'Task completed';
        }
        
        saveAgentStates();
        updateAgentPositions();
        return true;
    }
    return false;
};

window.getWaitingQueue = function() {
    return waitingQueue;
};

window.agents = agents;
window.agentStates = agentStates;

document.addEventListener('DOMContentLoaded', initOffice);
