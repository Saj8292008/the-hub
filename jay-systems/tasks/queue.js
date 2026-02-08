/**
 * Task Queue System
 * Priority-based queue with dependency management
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class TaskQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.running = new Map();
    this.completed = [];
    this.queueFile = path.join(__dirname, '../data/queue.json');
  }

  /**
   * Add task to queue
   */
  async add(task) {
    const queuedTask = {
      id: this.generateId(),
      ...task,
      status: 'queued',
      priority: task.priority || 50,
      addedAt: new Date().toISOString(),
      attempts: 0
    };

    this.queue.push(queuedTask);
    this.sortQueue();
    await this.save();

    console.log(`📥 Task queued: ${task.title} (Priority: ${queuedTask.priority})`);
    this.emit('taskAdded', queuedTask);

    return queuedTask;
  }

  /**
   * Get next task to execute
   */
  getNext() {
    // Find highest priority task that's ready
    for (const task of this.queue) {
      if (task.status === 'queued' && this.areDependenciesMet(task)) {
        return task;
      }
    }
    return null;
  }

  /**
   * Start executing a task
   */
  async start(taskId) {
    const taskIndex = this.queue.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.queue[taskIndex];
    task.status = 'in-progress';
    task.startedAt = new Date().toISOString();
    task.attempts++;

    this.running.set(taskId, task);
    await this.save();

    console.log(`🔨 Started: ${task.title}`);
    this.emit('taskStarted', task);

    return task;
  }

  /**
   * Mark task as completed
   */
  async complete(taskId, result = {}) {
    const task = this.running.get(taskId);
    if (!task) {
      const queuedTask = this.queue.find(t => t.id === taskId);
      if (queuedTask) {
        queuedTask.status = 'completed';
        queuedTask.completedAt = new Date().toISOString();
        queuedTask.result = result;
      }
      return;
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;

    this.running.delete(taskId);
    this.completed.push(task);
    
    // Remove from queue
    this.queue = this.queue.filter(t => t.id !== taskId);

    // Keep last 100 completed tasks
    if (this.completed.length > 100) {
      this.completed = this.completed.slice(-100);
    }

    await this.save();

    console.log(`✅ Completed: ${task.title}`);
    this.emit('taskCompleted', task);
  }

  /**
   * Mark task as failed
   */
  async fail(taskId, error) {
    const task = this.running.get(taskId) || this.queue.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'failed';
    task.failedAt = new Date().toISOString();
    task.error = error;

    this.running.delete(taskId);

    // Retry logic
    const maxRetries = task.maxRetries || 3;
    if (task.attempts < maxRetries) {
      task.status = 'queued';
      console.log(`⚠️  Failed: ${task.title} (Retry ${task.attempts}/${maxRetries})`);
    } else {
      console.log(`❌ Failed permanently: ${task.title}`);
      this.queue = this.queue.filter(t => t.id !== taskId);
    }

    await this.save();
    this.emit('taskFailed', task);
  }

  /**
   * Check if task dependencies are met
   */
  areDependenciesMet(task) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every(depId => {
      const dep = this.completed.find(t => t.id === depId);
      return dep && dep.status === 'completed';
    });
  }

  /**
   * Sort queue by priority
   */
  sortQueue() {
    this.queue.sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Older first if same priority
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queued: this.queue.filter(t => t.status === 'queued').length,
      inProgress: this.running.size,
      completed: this.completed.length,
      failed: this.queue.filter(t => t.status === 'failed').length,
      tasks: {
        queued: this.queue.filter(t => t.status === 'queued').slice(0, 10),
        inProgress: Array.from(this.running.values()),
        recentCompleted: this.completed.slice(-5)
      }
    };
  }

  /**
   * Save queue to disk
   */
  async save() {
    try {
      await fs.mkdir(path.dirname(this.queueFile), { recursive: true });
      await fs.writeFile(this.queueFile, JSON.stringify({
        queue: this.queue,
        running: Array.from(this.running.entries()),
        completed: this.completed
      }, null, 2));
    } catch (error) {
      console.error('Failed to save queue:', error.message);
    }
  }

  /**
   * Load queue from disk
   */
  async load() {
    try {
      const data = await fs.readFile(this.queueFile, 'utf8');
      const saved = JSON.parse(data);
      
      this.queue = saved.queue || [];
      this.running = new Map(saved.running || []);
      this.completed = saved.completed || [];

      console.log(`📂 Loaded queue: ${this.queue.length} tasks`);
    } catch (error) {
      console.log('📝 Starting with empty queue');
    }
  }

  /**
   * Generate unique task ID
   */
  generateId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear completed tasks
   */
  async clearCompleted() {
    this.completed = [];
    await this.save();
    console.log('🗑️  Cleared completed tasks');
  }
}

module.exports = { TaskQueue };

// CLI usage
if (require.main === module) {
  (async () => {
    const queue = new TaskQueue();
    await queue.load();

    // Example: Add some tasks
    await queue.add({
      title: 'Check system health',
      description: 'Run health checks on all systems',
      priority: 80,
      type: 'monitoring'
    });

    await queue.add({
      title: 'Scrape Reddit deals',
      description: 'Run Reddit scraper for watches',
      priority: 70,
      type: 'scraping'
    });

    await queue.add({
      title: 'Generate morning report',
      description: 'Create daily status report',
      priority: 90,
      type: 'reporting'
    });

    // Show status
    console.log('\nQueue Status:', queue.getStatus());

    // Process one task
    const next = queue.getNext();
    if (next) {
      await queue.start(next.id);
      
      // Simulate completion
      setTimeout(async () => {
        await queue.complete(next.id, { success: true });
        console.log('\nUpdated Status:', queue.getStatus());
      }, 2000);
    }
  })();
}
