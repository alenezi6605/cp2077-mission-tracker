'use strict';

// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  missions: [],
  filter: 'all',
  category: 'all',
};

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const content = document.getElementById('content');
const addForm = document.getElementById('add-form');
const addPanel = document.getElementById('add-panel');
const addPanelToggle = document.getElementById('add-panel-toggle');
const toast = document.getElementById('toast');

const PRIORITY_LABELS = {
  very_high: 'VERY HIGH',
  high: 'HIGH',
  moderate: 'MODERATE',
  low: 'LOW',
  very_low: 'VERY LOW',
};

const CATEGORY_LABELS = {
  main: 'Main Jobs',
  side: 'Side Jobs',
  gig: 'Gigs',
};

const CATEGORY_COLORS = {
  main: 'var(--cp-red)',
  side: 'var(--cp-yellow)',
  gig: 'var(--cp-cyan)',
};

const STATUS_LABELS = {
  active: 'ACTIVE',
  tracked: 'TRACKED',
  completed: 'COMPLETE',
  failed: 'FAILED',
};

// ─── API ──────────────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function loadMissions() {
  const params = new URLSearchParams();
  if (state.filter !== 'all') params.set('filter', state.filter);
  if (state.category !== 'all') params.set('category', state.category);
  const missions = await apiFetch(`/api/missions?${params}`);
  state.missions = missions;
  return missions;
}

async function createMission(name, category, priority) {
  return apiFetch('/api/missions', {
    method: 'POST',
    body: JSON.stringify({ name, category, priority }),
  });
}

async function updateStatus(id, status) {
  return apiFetch(`/api/missions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

async function deleteMission(id) {
  return apiFetch(`/api/missions/${id}`, { method: 'DELETE' });
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function renderMissions(missions) {
  updateStats(missions);
  updateCategoryCounts(missions);

  if (missions.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">&#9876;</div>
        <div class="empty-state-text">No missions found — stay sharp, choom</div>
      </div>
    `;
    return;
  }

  // Group by category when showing all categories
  if (state.category === 'all') {
    const groups = { main: [], side: [], gig: [] };
    missions.forEach(m => groups[m.category].push(m));

    const activeCategories = Object.entries(groups).filter(([, list]) => list.length > 0);

    content.innerHTML = activeCategories.map(([cat, list]) => `
      <div class="category-section">
        <div class="category-header">
          <svg class="category-icon" viewBox="0 0 20 20" width="16" height="16">
            <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" fill="none" stroke="${CATEGORY_COLORS[cat]}" stroke-width="1.5"/>
          </svg>
          <span class="category-name" style="color: ${CATEGORY_COLORS[cat]}">${CATEGORY_LABELS[cat]}</span>
          <span class="category-count">${list.length}</span>
        </div>
        <div class="missions-list">
          ${list.map(renderCard).join('')}
        </div>
      </div>
    `).join('');
  } else {
    content.innerHTML = `
      <div class="category-section">
        <div class="category-header">
          <span class="category-name" style="color: ${CATEGORY_COLORS[state.category]}">${CATEGORY_LABELS[state.category]}</span>
          <span class="category-count">${missions.length}</span>
        </div>
        <div class="missions-list">
          ${missions.map(renderCard).join('')}
        </div>
      </div>
    `;
  }

  // Bind action buttons
  content.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', handleAction);
  });
}

function renderCard(m) {
  const actions = buildActions(m);
  const trackedMarker = m.status === 'tracked' ? '<div class="tracked-marker"></div>' : '';

  return `
    <div class="mission-card" data-id="${m.id}" data-status="${m.status}">
      ${trackedMarker}
      <div class="mission-info">
        <div class="mission-name">${escapeHtml(m.name)}</div>
        <div class="mission-meta">
          <span class="mission-status-badge ${m.status}">${STATUS_LABELS[m.status]}</span>
          <span class="mission-priority ${m.priority}">${PRIORITY_LABELS[m.priority]}</span>
        </div>
      </div>
      <div class="mission-actions">
        ${actions}
      </div>
    </div>
  `;
}

function buildActions(m) {
  const btns = [];

  if (m.status === 'active') {
    btns.push(`<button class="action-btn track" data-id="${m.id}" data-action="tracked" title="Track mission">&#9654;</button>`);
    btns.push(`<button class="action-btn complete" data-id="${m.id}" data-action="completed" title="Mark completed">&#10003;</button>`);
    btns.push(`<button class="action-btn fail" data-id="${m.id}" data-action="failed" title="Mark failed">&#10007;</button>`);
  } else if (m.status === 'tracked') {
    btns.push(`<button class="action-btn reactivate" data-id="${m.id}" data-action="active" title="Untrack">&#9632;</button>`);
    btns.push(`<button class="action-btn complete" data-id="${m.id}" data-action="completed" title="Mark completed">&#10003;</button>`);
    btns.push(`<button class="action-btn fail" data-id="${m.id}" data-action="failed" title="Mark failed">&#10007;</button>`);
  } else if (m.status === 'completed' || m.status === 'failed') {
    btns.push(`<button class="action-btn reactivate" data-id="${m.id}" data-action="active" title="Reactivate">&#8635;</button>`);
  }

  btns.push(`<button class="action-btn delete" data-id="${m.id}" data-action="delete" title="Remove mission">&#128465;</button>`);

  return btns.join('');
}

function updateStats(missions) {
  // Always fetch full stats — filter may be applied, so count from full data
  // For header stats, count from current loaded missions + fetch totals separately
  // We'll count from all currently visible; totals fetched separately
  const all = missions;
  document.getElementById('stat-active').textContent = all.filter(m => m.status === 'active').length;
  document.getElementById('stat-tracked').textContent = all.filter(m => m.status === 'tracked').length;
  document.getElementById('stat-completed').textContent = all.filter(m => m.status === 'completed').length;
  document.getElementById('stat-failed').textContent = all.filter(m => m.status === 'failed').length;
}

function updateCategoryCounts(missions) {
  // When filter is applied, counts reflect filtered set
  document.getElementById('count-all').textContent = missions.length;
  document.getElementById('count-main').textContent = missions.filter(m => m.category === 'main').length;
  document.getElementById('count-side').textContent = missions.filter(m => m.category === 'side').length;
  document.getElementById('count-gig').textContent = missions.filter(m => m.category === 'gig').length;
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────
async function handleAction(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  btn.disabled = true;

  try {
    if (action === 'delete') {
      await deleteMission(id);
      showToast('Mission removed.', 'info');
    } else {
      await updateStatus(id, action);
      const actionLabel = {
        tracked: 'Mission tracked.',
        completed: 'Mission completed. Eddies incoming.',
        failed: 'Mission failed. Happens to the best.',
        active: 'Mission reactivated.',
      }[action] || 'Status updated.';
      showToast(actionLabel, action === 'failed' ? 'error' : action === 'completed' ? 'success' : 'info');
    }
    await refresh();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
  }
}

// ─── FORM ─────────────────────────────────────────────────────────────────────
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('mission-name').value.trim();
  const category = document.getElementById('mission-category').value;
  const priority = document.getElementById('mission-priority').value;

  if (!name) return;

  const btn = addForm.querySelector('.btn-add');
  btn.disabled = true;
  btn.textContent = 'DEPLOYING...';

  try {
    await createMission(name, category, priority);
    document.getElementById('mission-name').value = '';
    showToast('Mission deployed.', 'success');
    await refresh();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Deploy Mission';
  }
});

// ─── PANEL TOGGLE ─────────────────────────────────────────────────────────────
addPanelToggle.addEventListener('click', () => {
  addPanel.classList.toggle('collapsed');
});

// ─── FILTERS ──────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.filter = tab.dataset.filter;
    refresh();
  });
});

document.querySelectorAll('.filter-btn[data-category]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-category]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.category = btn.dataset.category;
    refresh();
  });
});

// ─── TOAST ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'info') {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function refresh() {
  try {
    const missions = await loadMissions();
    renderMissions(missions);
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-text">ERROR: ${escapeHtml(err.message)}</div></div>`;
  }
}

refresh();
