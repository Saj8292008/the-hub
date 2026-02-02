/**
 * Projects Dashboard API
 * Tracks all projects, goals, and completion status
 * Jay maintains this - auto-updates when goals are completed
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Projects data file path
const PROJECTS_FILE = path.join(__dirname, '../../data/projects.json');

// Default projects structure
const DEFAULT_PROJECTS = {
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Jay',
  projects: [
    {
      id: 'the-hub',
      name: 'The Hub',
      emoji: '🏠',
      status: 'live',
      priority: 'high',
      path: '/Users/sydneyjackson/the-hub',
      description: 'Deal aggregator for watches, sneakers, cars',
      goals: [
        { id: 'watch-scraping', name: 'Watch scraping (Reddit, eBay, WatchUSeek)', status: 'done', notes: 'Reddit & WatchUSeek working, eBay blocked' },
        { id: 'deal-scoring', name: 'Deal scoring system', status: 'done', notes: 'AI-powered scoring live' },
        { id: 'newsletter', name: 'Newsletter system', status: 'done', notes: 'Daily sends at 8am' },
        { id: 'telegram-bot', name: 'Telegram bot (@hubtest123)', status: 'done', notes: 'Posting deals, interactive buttons' },
        { id: 'discord-bot', name: 'Discord bot', status: 'blocked', notes: 'Need Syd to create bot & get token' },
        { id: 'mission-control', name: 'Mission Control (system status)', status: 'done', notes: 'localhost:5173/mission-control' },
        { id: 'auth', name: 'User authentication', status: 'done', notes: 'Login/signup working' },
        { id: 'premium', name: 'Premium tiers', status: 'done', notes: 'Stripe integration' },
        { id: 'sneakers', name: 'Sneaker vertical', status: 'in-progress', notes: 'Basic structure, needs data sources' },
        { id: 'cars', name: 'Car vertical', status: 'in-progress', notes: 'Basic structure, needs scrapers' },
        { id: 'sports', name: 'Sports tracking', status: 'done', notes: 'ESPN scores updating' }
      ],
      nextUp: [
        'Get Discord bot token from Syd',
        'Add more watch data sources',
        'Improve deal scoring accuracy',
        'Grow Telegram channel'
      ]
    },
    {
      id: 'second-brain',
      name: 'Second Brain',
      emoji: '🧠',
      status: 'active',
      priority: 'medium',
      path: '/Users/sydneyjackson/second-brain',
      description: 'Knowledge base and research documentation',
      goals: [
        { id: 'daily-research', name: 'Daily research reports (2pm)', status: 'done', notes: 'Cron job set up' },
        { id: 'concepts', name: 'Concept documentation', status: 'in-progress', notes: 'Adding as we learn' },
        { id: 'journal', name: 'Daily journal entries', status: 'in-progress', notes: 'memory/YYYY-MM-DD.md' }
      ],
      nextUp: []
    },
    {
      id: 'jay-systems',
      name: 'Jay (AI Partner)',
      emoji: '🤖',
      status: 'active',
      priority: 'high',
      path: '/Users/sydneyjackson/clawd',
      description: 'AI automation and proactive systems',
      goals: [
        { id: 'morning-briefs', name: 'Morning briefs (7am)', status: 'done', notes: 'Weather, stocks, sports, overnight work' },
        { id: 'monitoring', name: 'Proactive monitoring', status: 'done', notes: 'Heartbeats + health checks' },
        { id: 'night-builds', name: 'Night builds', status: 'done', notes: 'Building while Syd sleeps' },
        { id: 'henry-training', name: 'Henry training', status: 'done', notes: 'Training doc created' },
        { id: 'project-dashboard', name: 'Project dashboard', status: 'done', notes: 'This!' }
      ],
      nextUp: []
    }
  ],
  ideas: [
    { id: 'ai-digest', name: 'AI Digest newsletter', category: 'Content', priority: 'low', notes: 'Paused - focusing on The Hub' },
    { id: 'chrome-ext', name: 'Chrome extension for deals', category: 'The Hub', priority: 'medium', notes: 'Quick price check overlay' },
    { id: 'mobile-app', name: 'Mobile app', category: 'The Hub', priority: 'low', notes: 'Future - web first' },
    { id: 'affiliate', name: 'Affiliate revenue', category: 'The Hub', priority: 'medium', notes: 'WatchBox, Chrono24 partnerships' },
    { id: 'premium-content', name: 'Premium content', category: 'The Hub', priority: 'medium', notes: 'Exclusive deals for paid users' }
  ],
  recentCompletions: [
    { date: '2026-01-31', project: 'The Hub', what: 'Projects Dashboard web UI' },
    { date: '2026-01-31', project: 'The Hub', what: 'Mission Control dashboard' },
    { date: '2026-01-31', project: 'The Hub', what: 'Fixed Telegram bot bug' },
    { date: '2026-01-31', project: 'Jay', what: 'Henry training document' },
    { date: '2026-01-31', project: 'Jay', what: 'Server health monitoring' },
    { date: '2026-01-30', project: 'The Hub', what: 'Telegram interactive features' },
    { date: '2026-01-30', project: 'The Hub', what: 'Telegram content scheduler' },
    { date: '2026-01-29', project: 'The Hub', what: 'Newsletter automation' },
    { date: '2026-01-28', project: 'The Hub', what: 'Full production deployment' }
  ],
  weeklyGoals: {
    week: 'Jan 27 - Feb 2, 2026',
    goals: [
      { name: 'Launch The Hub to production', done: true },
      { name: 'Set up newsletter automation', done: true },
      { name: 'Build Telegram bot features', done: true },
      { name: 'Mission Control dashboard', done: true },
      { name: 'Projects dashboard', done: true },
      { name: 'Grow Telegram to 50 members', done: false },
      { name: 'First paying customer', done: false },
      { name: 'Discord bot live', done: false }
    ]
  }
};

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(PROJECTS_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (e) {
    // Directory exists
  }
}

// Load projects data
async function loadProjects() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    // File doesn't exist, create with defaults
    await saveProjects(DEFAULT_PROJECTS);
    return DEFAULT_PROJECTS;
  }
}

// Save projects data
async function saveProjects(data) {
  await ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2));
  return data;
}

/**
 * GET /api/projects
 * Get all projects and goals
 */
router.get('/', async (req, res) => {
  try {
    const data = await loadProjects();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/summary
 * Quick summary for dashboard widgets
 */
router.get('/summary', async (req, res) => {
  try {
    const data = await loadProjects();
    
    let totalGoals = 0;
    let completedGoals = 0;
    let inProgressGoals = 0;
    let blockedGoals = 0;
    
    data.projects.forEach(project => {
      project.goals.forEach(goal => {
        totalGoals++;
        if (goal.status === 'done') completedGoals++;
        else if (goal.status === 'in-progress') inProgressGoals++;
        else if (goal.status === 'blocked') blockedGoals++;
      });
    });
    
    const weeklyDone = data.weeklyGoals.goals.filter(g => g.done).length;
    const weeklyTotal = data.weeklyGoals.goals.length;
    
    res.json({
      lastUpdated: data.lastUpdated,
      updatedBy: data.updatedBy,
      projectCount: data.projects.length,
      goals: {
        total: totalGoals,
        completed: completedGoals,
        inProgress: inProgressGoals,
        blocked: blockedGoals,
        percentComplete: Math.round((completedGoals / totalGoals) * 100)
      },
      weeklyGoals: {
        done: weeklyDone,
        total: weeklyTotal,
        percentComplete: Math.round((weeklyDone / weeklyTotal) * 100)
      },
      recentCompletions: data.recentCompletions.slice(0, 5),
      ideasCount: data.ideas.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/projects/goal/:projectId/:goalId
 * Update a goal's status
 */
router.put('/goal/:projectId/:goalId', async (req, res) => {
  try {
    const { projectId, goalId } = req.params;
    const { status, notes } = req.body;
    
    const data = await loadProjects();
    const project = data.projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const goal = project.goals.find(g => g.id === goalId);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Update goal
    if (status) goal.status = status;
    if (notes) goal.notes = notes;
    
    // If marking as done, add to recent completions
    if (status === 'done') {
      data.recentCompletions.unshift({
        date: new Date().toISOString().split('T')[0],
        project: project.name,
        what: goal.name
      });
      // Keep only last 20 completions
      data.recentCompletions = data.recentCompletions.slice(0, 20);
    }
    
    data.updatedBy = 'Jay';
    await saveProjects(data);
    
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:projectId/goal
 * Add a new goal to a project
 */
router.post('/:projectId/goal', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, status = 'todo', notes = '' } = req.body;
    
    const data = await loadProjects();
    const project = data.projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const goalId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newGoal = { id: goalId, name, status, notes };
    
    project.goals.push(newGoal);
    data.updatedBy = 'Jay';
    await saveProjects(data);
    
    res.json({ success: true, goal: newGoal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/projects/weekly/:index
 * Update weekly goal status
 */
router.put('/weekly/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const { done } = req.body;
    
    const data = await loadProjects();
    
    if (index < 0 || index >= data.weeklyGoals.goals.length) {
      return res.status(404).json({ error: 'Weekly goal not found' });
    }
    
    data.weeklyGoals.goals[index].done = done;
    data.updatedBy = 'Jay';
    await saveProjects(data);
    
    res.json({ success: true, goal: data.weeklyGoals.goals[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/completion
 * Log a completion (Jay calls this when finishing something)
 */
router.post('/completion', async (req, res) => {
  try {
    const { project, what } = req.body;
    
    const data = await loadProjects();
    
    data.recentCompletions.unshift({
      date: new Date().toISOString().split('T')[0],
      project,
      what
    });
    
    // Keep only last 20
    data.recentCompletions = data.recentCompletions.slice(0, 20);
    data.updatedBy = 'Jay';
    await saveProjects(data);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
