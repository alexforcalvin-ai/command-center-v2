# 🏢 Agent State & Activity Guide

This system keeps the virtual office AND activity feed in sync with what agents are actually doing.

**Two systems:**
1. **State Updates** → Moves agents in the virtual office (desk, conference room, etc.)
2. **Activity Logging** → Shows what agents did in the activity feed

## Quick Reference (CLI)

```bash
# From anywhere (full path)
node ~/alex/command-center/agent-state-manager.js working devin "Task description"

# Or use the wrapper
~/alex/command-center/astate working devin "Task description"

# Commands:
astate working <agent> <task>      # Agent at desk, working
astate idle <agent>                # Agent in break room
astate meeting <a1,a2> <topic>     # Multiple agents in conference room
astate waiting <agent> <reason>    # Agent waiting in Calvin's office
astate withAlex <agent> <task>     # Agent in Alex's office
astate list                        # Show all current states
```

## For Alex: Auto-Updating When Spawning Subagents

### Option 1: Using the Module (Recommended)

If Alex can run Node code:

```javascript
const state = require('/Users/calvinbagley/alex/command-center/agent-state-manager');

// When spawning an agent:
await state.working('devin', 'Building payment integration');

// When agent finishes:
await state.idle('devin');

// When multiple agents work together:
await state.meeting(['devin', 'penny'], 'Code review session');

// When agent needs Calvin's input:
await state.waiting('finn', 'Needs approval for API changes');

// When agent works with Alex:
await state.withAlex('mark', 'Helping with deployment');
```

### Option 2: Shell Commands (For Any Context)

When spawning a subagent, run these shell commands:

```bash
# At spawn time
node ~/alex/command-center/agent-state-manager.js working devin "Building feature X"

# When task completes
node ~/alex/command-center/agent-state-manager.js idle devin
```

### Option 3: Spawn with Auto-Cleanup

```javascript
const state = require('/Users/calvinbagley/alex/command-center/agent-state-manager');

// Returns a cleanup function that marks agent idle
const cleanup = await state.spawn('devin', 'Analyzing logs');

// ... agent does work ...

// When done, cleanup marks them idle
await cleanup();
```

## State → Location Mapping

| State    | Location           | When to Use                               |
|----------|-------------------|-------------------------------------------|
| idle     | Break Room        | Agent finished, resting                   |
| working  | Agent's Desk      | Agent actively working on a task          |
| meeting  | Conference Room   | Multiple agents on same task              |
| waiting  | Calvin's Office   | Agent needs Calvin's input/approval       |
| withAlex | Alex's Office     | Agent assisting Alex or vice versa        |

## Valid Agents

alex, penny, owen, devin, denise, molly, finn, mark, randy, annie, ivan, sky, leo, clara, simon, henry

---

## 📋 Activity Logging (Activity Feed)

Besides state updates, agents can log activities that appear in the feed:

### CLI

```bash
# Log any activity
node ~/alex/command-center/agent-state-manager.js log devin "Pushed commit abc123"
node ~/alex/command-center/agent-state-manager.js log devin "Fixed authentication bug"
node ~/alex/command-center/agent-state-manager.js log penny "Completed code review"

# View recent activity
node ~/alex/command-center/agent-state-manager.js feed
```

### Module

```javascript
const agent = require('/Users/calvinbagley/alex/command-center/agent-state-manager');

// Log activities
await agent.log('devin', 'Started analyzing logs');
await agent.log('devin', 'Pushed 3 commits', 'commit');
await agent.log('devin', 'Completed feature', 'complete');

// Get recent activity
const activities = await agent.getActivity(20);
```

### Activity Types

- `general` - Default, general activity
- `start` - Started a task
- `complete` - Finished something
- `commit` - Code commits
- `error` - Something went wrong
- `meeting` - Joined a meeting
- `waiting` - Waiting for input

### Auto-Logging

State changes automatically log to the activity feed:
- `working('devin', 'Building X')` → Logs "started working on: Building X"
- `meeting(['devin', 'penny'], 'Review')` → Logs "joined meeting: Review"
- Using `spawn()` helper also logs completion when cleanup is called

## Integration Checklist for Alex

When Alex spawns a subagent:
1. ✅ Update state to `working` with task description
2. ✅ If multiple agents on same task → use `meeting` instead
3. ✅ If working with Alex directly → use `withAlex`
4. ✅ When agent needs Calvin → use `waiting`
5. ✅ When agent session ends → update to `idle`

## Example Workflow

```
1. Calvin: "Hey Alex, have Devin build the payment feature"
2. Alex spawns Devin subagent
3. Alex runs: state.working('devin', 'Building payment feature')
4. Devin works...
5. Devin finishes
6. Alex runs: state.idle('devin')
7. Virtual office now shows Devin in break room
```

This keeps the command center's virtual office visualization accurate in real-time!
