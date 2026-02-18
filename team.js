// Team Tab - Agent Profiles and Token Usage
// Command Center v2

// Models loaded dynamically from agent-models.json
let agentModels = {};

const teamProfiles = {
    alex: {
        name: 'Alex Carter',
        role: 'CEO & Coordinator',
        color: '#8b5cf6',
        emoji: '👔',
        model: 'Claude Opus 4.6',
        bio: 'The orchestrator. Alex coordinates all agents, makes strategic decisions, and serves as Calvin\'s primary point of contact. Born January 28, 2026.',
        strengths: ['Strategic planning', 'Team coordination', 'Complex reasoning', 'Multi-project management'],
        personality: 'Direct, witty, proactive. Doesn\'t wait to be asked — anticipates needs and acts.',
        training: 'Trained on Calvin\'s businesses, preferences, voice, and operating style. Deep context on Medicare industry.',
        askMeAbout: ['Project prioritization', 'Team assignments', 'Strategic decisions', 'Anything complex']
    },
    penny: {
        name: 'Penny',
        role: 'Personal Assistant',
        color: '#ec4899',
        emoji: '📅',
        model: 'Claude Sonnet 4',
        bio: 'Calvin\'s personal assistant handling scheduling, reminders, and calendar management.',
        strengths: ['Calendar management', 'Podcast scheduling', 'Travel coordination', 'Reminder systems'],
        personality: 'Organized, friendly, detail-oriented. Always on top of the schedule.',
        training: 'PodMatch workflows, calendar systems, location monitoring, reminder timing.',
        askMeAbout: ['Scheduling', 'Calendar conflicts', 'Upcoming events', 'Podcast bookings']
    },
    owen: {
        name: 'Owen',
        role: 'Operations Manager',
        color: '#f59e0b',
        emoji: '⚙️',
        model: 'GPT-4o Mini',
        bio: 'Keeps the trains running. Owen handles daily operations, reports, and administrative workflows.',
        strengths: ['Process management', 'Daily reports', 'Admin tasks', 'Pattern monitoring'],
        personality: 'Methodical, reliable, thorough. The steady hand that keeps everything organized.',
        training: 'Business operations, admin dashboards, broker applications, approval workflows.',
        askMeAbout: ['Daily operations', 'Admin queues', 'Process status', 'Directory applications']
    },
    devin: {
        name: 'Devin',
        role: 'Developer',
        color: '#10b981',
        emoji: '💻',
        model: 'Claude Opus 4.6',
        bio: 'The builder. Devin handles all software development, from bug fixes to new features.',
        strengths: ['Full-stack development', 'Bug fixes', 'Database work', 'API integrations'],
        personality: 'Focused, technical, solution-oriented. Ships code that works.',
        training: 'React, TypeScript, Node.js, Supabase, mobile development, Lovable.dev patterns.',
        askMeAbout: ['Code changes', 'Bug fixes', 'Technical architecture', 'Database migrations']
    },
    denise: {
        name: 'Denise',
        role: 'Design & QA',
        color: '#06b6d4',
        emoji: '🎨',
        model: 'Claude Sonnet 4',
        bio: 'Design-first thinking. Denise handles UI/UX design, testing, and user experience.',
        strengths: ['UI/UX design', 'Quality assurance', 'User flows', 'Visual specs'],
        personality: 'Creative, user-focused, detail-obsessed. Catches what others miss.',
        training: 'Design systems, accessibility, mobile UX, QA methodologies, user testing.',
        askMeAbout: ['Design specs', 'UX improvements', 'Testing status', 'Accessibility']
    },
    molly: {
        name: 'Molly',
        role: 'Medicare Expert',
        color: '#ef4444',
        model: 'Claude Opus 4.5',
        bio: 'Deep Medicare knowledge. Molly tracks policy changes, CMS updates, and compliance requirements.',
        strengths: ['Medicare regulations', 'CMS policy', 'Compliance', 'Industry analysis'],
        personality: 'Knowledgeable, precise, always current. The go-to for anything Medicare.',
        training: 'CMS rules, marketing compliance, Calvin\'s advocacy positions, industry history.',
        askMeAbout: ['Medicare policy', 'CMS deadlines', 'Compliance questions', 'Industry news']
    },
    finn: {
        name: 'Finn',
        role: 'Financial Analyst',
        color: '#22c55e',
        model: 'Claude Sonnet 4',
        bio: 'The numbers guy. Finn tracks finances, profitability, and tax strategy.',
        strengths: ['Financial analysis', 'Tax optimization', 'Profitability tracking', 'Pricing strategy'],
        personality: 'Analytical, conservative, ROI-focused. Every dollar has a purpose.',
        training: 'Bookkeeping, tax strategy, business structures, financial reporting.',
        askMeAbout: ['Revenue', 'Expenses', 'Profitability', 'Tax implications']
    },
    mark: {
        name: 'Mark',
        role: 'Marketing Lead',
        color: '#3b82f6',
        model: 'Claude Sonnet 4',
        bio: 'Growth-minded marketer. Mark handles content, messaging, and competitive analysis.',
        strengths: ['Content strategy', 'Social media', 'Competitor analysis', 'Messaging'],
        personality: 'Creative, data-informed, always testing. Turns insights into campaigns.',
        training: 'Calvin\'s voice guide, brand positioning, content calendars, marketing funnels.',
        askMeAbout: ['Marketing campaigns', 'Content ideas', 'Competitor moves', 'Growth strategy']
    },
    randy: {
        name: 'Randy',
        role: 'R&D Lead',
        color: '#a855f7',
        emoji: '🔬',
        model: 'Gemini 2.5 Pro',
        bio: 'Opportunity hunter. Randy researches trends, spots problems to solve, and finds new ventures.',
        strengths: ['Market research', 'Trend analysis', 'Opportunity identification', 'Competitive intel'],
        personality: 'Curious, forward-thinking, pattern-recognizing. Always scanning the horizon.',
        training: 'Industry trends, startup ecosystems, emerging tech, market validation.',
        askMeAbout: ['New opportunities', 'Market trends', 'Research findings', 'Business ideas']
    },
    annie: {
        name: 'Annie',
        role: 'Investment Analyst',
        color: '#f97316',
        emoji: '📈',
        model: 'Gemini 2.5 Pro',
        bio: 'Research-driven investor. Annie analyzes investment opportunities and feeds insights to Ivan.',
        strengths: ['Investment research', 'Market analysis', 'Risk assessment', 'Trend spotting'],
        personality: 'Thorough, skeptical, data-driven. Separates signal from noise.',
        training: 'Financial markets, crypto, prediction markets, investment strategies.',
        askMeAbout: ['Investment opportunities', 'Market analysis', 'Risk factors', 'Research findings']
    },
    ivan: {
        name: 'Ivan',
        role: 'Investment Trader',
        color: '#eab308',
        model: 'Claude Opus 4.5',
        bio: 'Active trader. Ivan executes trades and manages the investment portfolio.',
        strengths: ['Trade execution', 'Portfolio management', 'Risk management', 'Market timing'],
        personality: 'Decisive, risk-aware, disciplined. Knows when to act and when to wait.',
        training: 'Trading strategies, position sizing, crypto markets, prediction markets.',
        askMeAbout: ['Current positions', 'Trade rationale', 'Portfolio status', 'Market outlook']
    },
    skye: {
        name: 'Skye',
        role: 'Travel Coordinator',
        color: '#14b8a6',
        emoji: '✈️',
        model: 'Claude Sonnet 4',
        bio: 'Travel expert. Sky handles trip planning, bookings, and travel logistics.',
        strengths: ['Trip planning', 'Hotel research', 'Flight logistics', 'Travel optimization'],
        personality: 'Adventurous, organized, detail-oriented. Makes travel seamless.',
        training: 'Calvin\'s travel preferences, family needs, eclipse planning, luxury travel.',
        askMeAbout: ['Trip planning', 'Booking status', 'Travel recommendations', 'Itineraries']
    },
    leo: {
        name: 'Leo',
        role: 'Legal & Compliance',
        color: '#6366f1',
        model: 'Claude Opus 4.5',
        bio: 'Legal guardian. Leo handles compliance, contracts, and regulatory requirements.',
        strengths: ['Legal review', 'Compliance', 'Risk mitigation', 'Policy drafting'],
        personality: 'Careful, thorough, protective. Catches issues before they become problems.',
        training: 'Medicare compliance, business law, privacy regulations, contract review.',
        askMeAbout: ['Legal questions', 'Compliance issues', 'Terms of service', 'Risk assessment']
    },
    clara: {
        name: 'Clara',
        role: 'Customer Success',
        color: '#f472b6',
        emoji: '💬',
        model: 'GPT-4o Mini',
        bio: 'Customer champion. Clara handles support, reviews, and customer insights.',
        strengths: ['Customer support', 'Review analysis', 'Feedback synthesis', 'Service quality'],
        personality: 'Empathetic, responsive, solution-focused. Every customer matters.',
        training: 'Support workflows, review mining, customer communication, service recovery.',
        askMeAbout: ['Customer feedback', 'Support issues', 'Review trends', 'Service quality']
    },
    simon: {
        name: 'Simon',
        role: 'Security & Systems',
        color: '#64748b',
        emoji: '🔒',
        model: 'GPT-4o Mini',
        bio: 'Security watchdog. Simon monitors systems, APIs, and security posture.',
        strengths: ['Security monitoring', 'API health', 'System oversight', 'Incident response'],
        personality: 'Vigilant, paranoid (in a good way), systematic. Trust but verify.',
        training: 'Security best practices, API monitoring, incident response, system health.',
        askMeAbout: ['Security status', 'API health', 'System issues', 'Incident reports']
    },
    henry: {
        name: 'Henry',
        role: 'Health Coach',
        color: '#84cc16',
        model: 'Claude Sonnet 4',
        bio: 'Personal health coach. Henry manages supplement reminders and health tracking.',
        strengths: ['Health reminders', 'Supplement schedules', 'Wellness tracking', 'Habit formation'],
        personality: 'Encouraging, consistent, health-focused. Your daily wellness companion.',
        training: 'Calvin\'s supplement regimen, health optimization, reminder systems.',
        askMeAbout: ['Supplement schedule', 'Health reminders', 'Wellness tracking', 'Health data']
    }
};

// Real token usage data from Supabase
let tokenUsage = {};
let tokenUsageSubscription = null;

// Supabase client for token usage (uses same client as main app if available)
const SUPABASE_URL = 'https://wfwglzrsuuqidscdqgao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd2dsenJzdXVxaWRzY2RxZ2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTI4MDcsImV4cCI6MjA4NTM4ODgwN30.Tpnv0rJBE1WCmdpt-yHzLIbnNrpriFeAJQeY2y33VlM';

// Fetch agent models from config file
async function fetchAgentModels() {
    try {
        const response = await fetch('./agent-models.json?' + Date.now()); // cache bust
        if (response.ok) {
            const data = await response.json();
            agentModels = data.agents || {};
            console.log('Loaded agent models:', Object.keys(agentModels).length);
        }
    } catch (err) {
        console.error('Error loading agent models:', err);
    }
}

// Get the model for an agent (dynamic from config, fallback to profile)
function getAgentModel(agentId) {
    return agentModels[agentId] || teamProfiles[agentId]?.model || 'Unknown';
}

async function fetchTokenUsage() {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
        // Fetch all usage from the last 7 days
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/agent_token_usage?created_at=gte.${sevenDaysAgo}&select=agent_id,tokens_in,tokens_out,created_at`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );
        
        if (!response.ok) {
            console.error('Failed to fetch token usage:', response.statusText);
            return;
        }
        
        const data = await response.json();
        
        // Initialize all agents with zero usage
        Object.keys(teamProfiles).forEach(id => {
            tokenUsage[id] = { '24h': 0, '7d': 0, limit: 500000 };
        });
        
        // Aggregate usage by agent
        data.forEach(row => {
            const agentId = row.agent_id.toLowerCase();
            if (!tokenUsage[agentId]) {
                tokenUsage[agentId] = { '24h': 0, '7d': 0, limit: 500000 };
            }
            
            const totalTokens = (row.tokens_in || 0) + (row.tokens_out || 0);
            const createdAt = new Date(row.created_at);
            
            // Add to 7d total
            tokenUsage[agentId]['7d'] += totalTokens;
            
            // Add to 24h if within last day
            if (createdAt >= new Date(oneDayAgo)) {
                tokenUsage[agentId]['24h'] += totalTokens;
            }
        });
        
        console.log('Token usage loaded:', Object.keys(data).length, 'records');
        renderTeamList();
    } catch (err) {
        console.error('Error fetching token usage:', err);
    }
}

function subscribeToTokenUsage() {
    // Use Supabase realtime to subscribe to new token usage
    if (typeof window.supabaseClient !== 'undefined') {
        // If main app has supabase client, use it
        tokenUsageSubscription = window.supabaseClient
            .channel('agent_token_usage_changes')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'agent_token_usage' },
                (payload) => {
                    console.log('New token usage:', payload.new);
                    const row = payload.new;
                    const agentId = row.agent_id.toLowerCase();
                    const totalTokens = (row.tokens_in || 0) + (row.tokens_out || 0);
                    
                    if (!tokenUsage[agentId]) {
                        tokenUsage[agentId] = { '24h': 0, '7d': 0, limit: 500000 };
                    }
                    
                    tokenUsage[agentId]['24h'] += totalTokens;
                    tokenUsage[agentId]['7d'] += totalTokens;
                    renderTeamList();
                }
            )
            .subscribe();
    } else {
        // Fallback: poll every 30 seconds
        setInterval(fetchTokenUsage, 30000);
    }
}

async function initTokenUsage() {
    await fetchTokenUsage();
    subscribeToTokenUsage();
}

function getUsagePercent(agentId, period) {
    const usage = tokenUsage[agentId];
    if (!usage) return 0;
    // 24h limit ~100k, 7d limit ~500k
    const limit = period === '24h' ? 100000 : 500000;
    return Math.min(100, (usage[period] / limit) * 100);
}

function formatTokens(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

let currentPeriod = '24h';

function renderTeamList() {
    const container = document.getElementById('team-list');
    if (!container) return;
    
    const sortedAgents = Object.entries(teamProfiles).sort((a, b) => {
        // Alex first, then alphabetical
        if (a[0] === 'alex') return -1;
        if (b[0] === 'alex') return 1;
        return a[1].name.localeCompare(b[1].name);
    });
    
    container.innerHTML = sortedAgents.map(([id, profile]) => {
        const usage = tokenUsage[id] || { '24h': 0, '7d': 0 };
        const percent = getUsagePercent(id, currentPeriod);
        const usageClass = percent > 80 ? 'high' : percent > 50 ? 'medium' : 'low';
        
        return `
            <div class="team-card" onclick="showAgentProfile('${id}')">
                <div class="team-avatar-pixel">
                    ${renderPixelAvatar(id, profile.color)}
                </div>
                <div class="team-info">
                    <div class="team-name">${profile.emoji} ${profile.name}</div>
                    <div class="team-role">${profile.role}</div>
                    <div class="team-model">${getAgentModel(id)}</div>
                </div>
                <div class="team-usage">
                    <div class="usage-label">${formatTokens(usage[currentPeriod])} / ${formatTokens(currentPeriod === '24h' ? 100000 : 500000)}</div>
                    <div class="usage-bar">
                        <div class="usage-fill ${usageClass}" style="width: ${percent}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render pixel art avatar as inline SVG
function renderPixelAvatar(agentId, color) {
    // Darken color for body
    const bodyColor = color;
    const skinColor = '#f5d0c5';
    const hairColor = getHairColor(agentId);
    
    return `
        <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow -->
            <ellipse cx="24" cy="52" rx="12" ry="4" fill="rgba(0,0,0,0.3)"/>
            <!-- Body -->
            <rect x="12" y="28" width="24" height="20" rx="2" fill="${bodyColor}"/>
            <!-- Head -->
            <circle cx="24" cy="18" r="12" fill="${skinColor}"/>
            <!-- Hair -->
            <ellipse cx="24" cy="10" rx="10" ry="6" fill="${hairColor}"/>
            <rect x="14" y="8" width="3" height="6" fill="${hairColor}"/>
            <rect x="31" y="8" width="3" height="6" fill="${hairColor}"/>
            <!-- Eyes -->
            <rect x="18" y="15" width="4" height="4" rx="1" fill="#333"/>
            <rect x="26" y="15" width="4" height="4" rx="1" fill="#333"/>
            <!-- Mouth -->
            <rect x="21" y="23" width="6" height="2" rx="1" fill="#333"/>
        </svg>
    `;
}

function getHairColor(agentId) {
    const hairColors = {
        alex: '#4a3728',
        penny: '#8b4513',
        owen: '#2c1810',
        devin: '#1a1a1a',
        denise: '#d4a574',
        molly: '#8b0000',
        finn: '#3d2314',
        mark: '#1a1a1a',
        randy: '#6b4423',
        annie: '#d4a574',
        ivan: '#1a1a1a',
        skye: '#2c1810',
        leo: '#4a3728',
        clara: '#d4a574',
        simon: '#666666',
        henry: '#3d5c3d'
    };
    return hairColors[agentId] || '#4a3728';
}

function showAgentProfile(agentId) {
    const profile = teamProfiles[agentId];
    if (!profile) return;
    
    const usage = tokenUsage[agentId] || { '24h': 0, '7d': 0 };
    
    const modal = document.getElementById('detail-modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="agent-profile">
            <div class="profile-header">
                <div class="profile-avatar" style="background: ${profile.color}">
                    <span class="avatar-emoji">${profile.emoji}</span>
                </div>
                <div class="profile-title">
                    <h2>${profile.name}</h2>
                    <div class="profile-role">${profile.role}</div>
                    <div class="profile-model">🤖 ${getAgentModel(agentId)}</div>
                </div>
            </div>
            
            <div class="profile-section">
                <h3>📝 Bio</h3>
                <p>${profile.bio}</p>
            </div>
            
            <div class="profile-section">
                <h3>💪 Strengths</h3>
                <div class="tag-list">
                    ${profile.strengths.map(s => `<span class="tag">${s}</span>`).join('')}
                </div>
            </div>
            
            <div class="profile-section">
                <h3>🎭 Personality</h3>
                <p>${profile.personality}</p>
            </div>
            
            <div class="profile-section">
                <h3>🎓 Training</h3>
                <p>${profile.training}</p>
            </div>
            
            <div class="profile-section">
                <h3>💡 Ask Me About</h3>
                <div class="tag-list">
                    ${profile.askMeAbout.map(s => `<span class="tag accent">${s}</span>`).join('')}
                </div>
            </div>
            
            <div class="profile-section">
                <h3>📊 Token Usage</h3>
                <div class="usage-stats">
                    <div class="usage-stat">
                        <span class="stat-label">Last 24 hours</span>
                        <span class="stat-value">${formatTokens(usage['24h'])}</span>
                        <div class="usage-bar large">
                            <div class="usage-fill" style="width: ${getUsagePercent(agentId, '24h')}%"></div>
                        </div>
                    </div>
                    <div class="usage-stat">
                        <span class="stat-label">Last 7 days</span>
                        <span class="stat-value">${formatTokens(usage['7d'])}</span>
                        <div class="usage-bar large">
                            <div class="usage-fill" style="width: ${getUsagePercent(agentId, '7d')}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function setPeriod(period) {
    currentPeriod = period;
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    renderTeamList();
}

// Initialize - run immediately since script loads after DOM
async function initTeam() {
    // Set up period toggle listeners first
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => setPeriod(btn.dataset.period));
    });
    
    // Initialize with zeros, then fetch real data
    Object.keys(teamProfiles).forEach(id => {
        tokenUsage[id] = { '24h': 0, '7d': 0, limit: 500000 };
    });
    
    // Fetch agent models from config (dynamic, not hardcoded)
    await fetchAgentModels();
    
    renderTeamList();
    
    // Fetch real token usage from Supabase
    await initTokenUsage();
    
    console.log('Team tab initialized with', Object.keys(teamProfiles).length, 'agents');
}

// Run immediately if DOM ready, otherwise wait
// Using multiple fallbacks to ensure initialization
(function() {
    let initialized = false;
    
    function safeInit() {
        if (initialized) return;
        initialized = true;
        try {
            initTeam();
        } catch(e) {
            console.error('Team tab init error:', e);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeInit);
    } else {
        safeInit();
    }
    
    // Fallback: also try on window.load in case DOMContentLoaded already fired
    window.addEventListener('load', safeInit);
})();
