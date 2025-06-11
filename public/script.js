// DOM Elements
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const remainingTasksEl = document.getElementById('remainingTasks');
const prioritySelect = document.getElementById('taskPriority');
const tagsInput = document.getElementById('taskTags');
const addTaskBtn = document.getElementById('addTaskBtn');
const historyList = document.getElementById('historyList');
const historyFilter = document.getElementById('historyFilter');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');

// API Configuration
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/tasks',
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

// History Actions
const HISTORY_ACTIONS = {
  COMPLETED: 'completed',
  DELETED: 'deleted',
  EDITED: 'edited'
};

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  loadTasks();
  displayHistory();
  setupEventListeners();
}

function setupEventListeners() {
  taskInput.addEventListener('keypress', handleTaskInputKeyPress);
  addTaskBtn.addEventListener('click', addTask);
  historyFilter.addEventListener('change', filterHistory);
  closeHistoryBtn.addEventListener('click', hideHistory);
}

function handleTaskInputKeyPress(e) {
  if (e.key === 'Enter') addTask();
}

// ======================
// TASK HISTORY FUNCTIONS
// ======================

/**
 * Save task to history when an action is performed
 * @param {Object} task - The task object
 * @param {string} action - The action performed (completed, deleted, edited)
 */
function saveToHistory(task, action) {
  const history = getHistory();
  
  const historyItem = {
    id: Date.now(),
    task: {
      id: task.id,
      text: task.text,
      completed: task.completed,
      priority: task.priority,
      tags: task.tags,
      dueDate: task.dueDate
    },
    action: action,
    date: new Date().toISOString()
  };
  
  history.unshift(historyItem);
  localStorage.setItem('taskHistory', JSON.stringify(history));
}

/**
 * Get task history from localStorage
 * @returns {Array} Array of history items
 */
function getHistory() {
  return JSON.parse(localStorage.getItem('taskHistory') || '[]');
}

/**
 * Display task history with proper formatting
 * @param {string} filter - Filter type (all, completed, deleted, today, week)
 */
function displayHistory(filter = 'all') {
  const history = getHistory();
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = createEmptyHistoryHTML();
    return;
  }

  const filteredHistory = filterHistoryItems(history, filter);
  filteredHistory.forEach(item => {
    historyList.appendChild(createHistoryItemElement(item));
  });

  setupRestoreButtons();
}

function createEmptyHistoryHTML() {
  return `
    <div class="empty-history">
      <i class="fas fa-clipboard-list"></i>
      <p>No history found</p>
    </div>
  `;
}

function createHistoryItemElement(item) {
  const historyItem = document.createElement('div');
  historyItem.className = `history-item ${item.action}`;
  
  const date = new Date(item.date);
  const formattedDate = `${date.toLocaleDateString()}, ${date.toLocaleTimeString()}`;
  const priorityClass = item.task.priority?.toLowerCase() || 'medium';
  
  historyItem.innerHTML = `
    <div class="history-content">
      <div class="history-text">${item.task.text}</div>
      <div class="history-meta">
        <span class="history-action">${formatActionText(item.action)}</span>
        <span class="history-date">${formattedDate}</span>
        <span class="priority ${priorityClass}">
          ${priorityClass.charAt(0).toUpperCase() + priorityClass.slice(1)}
        </span>
      </div>
    </div>
    <div class="history-actions">
      <button class="restore-btn" data-id="${item.id}">
        <i class="fas fa-undo"></i> Restore
      </button>
    </div>
  `;
  
  return historyItem;
}

function setupRestoreButtons() {
  document.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const historyId = this.getAttribute('data-id');
      restoreTask(historyId);
    });
  });
}

/**
 * Filter history items based on selected filter
 * @param {Array} history - Array of history items
 * @param {string} filter - Filter type
 * @returns {Array} Filtered history items
 */
function filterHistoryItems(history, filter) {
  const now = new Date();
  
  switch(filter) {
    case 'completed':
      return history.filter(item => item.action === HISTORY_ACTIONS.COMPLETED);
    case 'deleted':
      return history.filter(item => item.action === HISTORY_ACTIONS.DELETED);
    case 'today':
      const today = now.toDateString();
      return history.filter(item => new Date(item.date).toDateString() === today);
    case 'week':
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return history.filter(item => new Date(item.date) > oneWeekAgo);
    default:
      return history;
  }
}

function formatActionText(action) {
  const actionTextMap = {
    [HISTORY_ACTIONS.COMPLETED]: 'Completed',
    [HISTORY_ACTIONS.DELETED]: 'Deleted',
    [HISTORY_ACTIONS.EDITED]: 'Edited'
  };
  
  return actionTextMap[action] || 'Status changed';
}

/**
 * Restore task from history
 * @param {string} historyId - ID of the history item to restore
 */
async function restoreTask(historyId) {
  try {
    const history = getHistory();
    const itemToRestore = history.find(item => item.id.toString() === historyId);
    
    if (!itemToRestore) {
      throw new Error('History item not found');
    }

    const existingTasks = await fetchTasks();
    if (existingTasks.some(task => task.id === itemToRestore.task.id)) {
      throw new Error('Task already exists');
    }

    await restoreTaskToAPI(itemToRestore.task);
    updateHistoryAfterRestore(history, historyId);
    
    displayHistory();
    await loadTasks();
    
    showAlert('Task restored successfully!');
  } catch (error) {
    console.error('Restore error:', error);
    showAlert(`Failed to restore task: ${error.message}`, 'error');
  }
}

async function fetchTasks() {
  const response = await fetch(API_CONFIG.BASE_URL);
  return await response.json();
}

async function restoreTaskToAPI(task) {
  const response = await fetch(API_CONFIG.BASE_URL, {
    method: 'POST',
    headers: API_CONFIG.HEADERS,
    body: JSON.stringify({
      ...task,
      completed: false // Reset completed status when restoring
    })
  });

  if (!response.ok) throw new Error('Failed to restore task');
}

function updateHistoryAfterRestore(history, historyId) {
  const updatedHistory = history.filter(item => item.id.toString() !== historyId);
  localStorage.setItem('taskHistory', JSON.stringify(updatedHistory));
}

function filterHistory() {
  displayHistory(historyFilter.value);
}

function hideHistory() {
  document.getElementById('historyContainer').style.display = 'none';
}

function showAlert(message, type = 'success') {
  alert(message); // Consider replacing with a more elegant notification system
}
// ======================
// PROGRESS TRACKING FUNCTIONS
// ======================

// DOM Elements for stats
const showStatsBtn = document.getElementById('showStatsBtn');
const statsContainer = document.getElementById('statsContainer');
let productivityChart = null;

// Set up event listener
showStatsBtn.addEventListener('click', showStats);

// Show productivity statistics
async function showStats() {
  try {
    currentTasksContainer.style.display = 'none';
    historyContainer.style.display = 'none';
    statsContainer.style.display = 'block';
    
    const tasks = await loadTasks();
    const history = JSON.parse(localStorage.getItem('taskHistory')) || [];
    
    calculateProductivityStats(tasks, history);
  } catch (error) {
    console.error('Error showing stats:', error);
    statsContainer.innerHTML = '<p>Error loading statistics. Please try again.</p>';
  }
}

// Calculate and display productivity metrics
function calculateProductivityStats(tasks, history) {
  // Basic stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Update DOM
  document.getElementById('totalTasks').textContent = totalTasks;
  document.getElementById('completedTasks').textContent = completedTasks;
  document.getElementById('completionRate').textContent = `${completionRate}%`;
  
  // Calculate average completion time (simplified example)
  let totalTime = 0;
  let completedWithTime = 0;
  
  tasks.forEach(task => {
    if (task.completed && task.completedAt && task.createdAt) {
      const created = new Date(task.createdAt);
      const completed = new Date(task.completedAt);
      totalTime += (completed - created) / (1000 * 60 * 60); // hours
      completedWithTime++;
    }
  });
  
  const avgTime = completedWithTime > 0 ? Math.round(totalTime / completedWithTime) : 0;
  document.getElementById('avgCompletionTime').textContent = `${avgTime}h`;
  
  // Prepare data for chart
  renderProductivityChart(tasks, history);
}

// Render productivity chart
function renderProductivityChart(tasks, history) {
  // Destroy previous chart if exists
  if (productivityChart) {
    productivityChart.destroy();
  }
  
  const ctx = document.getElementById('productivityChart').getContext('2d');
  
  // Group tasks by completion status
  const statusData = {
    completed: tasks.filter(task => task.completed).length,
    pending: tasks.filter(task => !task.completed).length
  };
  
  // Group by priority (if available)
  const priorityData = {
    high: tasks.filter(task => task.priority === 'High').length,
    medium: tasks.filter(task => task.priority === 'Medium').length,
    low: tasks.filter(task => task.priority === 'Low').length,
    none: tasks.filter(task => !task.priority).length
  };
  
  // Create chart
  productivityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Completed', 'Pending'],
      datasets: [{
        label: 'Task Status',
        data: [statusData.completed, statusData.pending],
        backgroundColor: [
          'rgba(44, 182, 125, 0.7)', // green for completed
          'rgba(255, 126, 107, 0.7)'  // red for pending
        ],
        borderColor: [
          'rgba(44, 182, 125, 1)',
          'rgba(255, 126, 107, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Hide stats
function hideStats() {
  statsContainer.style.display = 'none';
}

// ======================
// TASK MANAGEMENT FUNCTIONS
// ======================

// [Your existing task management functions...]

// ======================
// UTILITY FUNCTIONS
// ======================

// [Your existing utility functions...]