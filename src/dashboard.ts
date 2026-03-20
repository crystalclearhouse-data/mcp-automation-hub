export function dashboardHTML(n8nUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="MCP Hub" />
  <meta name="theme-color" content="#0a0a0f" />
  <title>MCP Automation Hub</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #0a0a0f;
      --surface:  #111118;
      --border:   #1e1e2e;
      --accent:   #7c6aff;
      --accent2:  #22d3ee;
      --green:    #10b981;
      --red:      #ef4444;
      --yellow:   #f59e0b;
      --text:     #e2e8f0;
      --muted:    #64748b;
      --radius:   10px;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.6;
      min-height: 100vh;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* ── Layout ── */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 28px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--text);
    }

    .logo-icon {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--muted);
      background: var(--border);
      padding: 4px 10px;
      border-radius: 20px;
    }

    .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--muted);
      transition: background 0.3s;
    }
    .dot.green  { background: var(--green); box-shadow: 0 0 6px var(--green); }
    .dot.red    { background: var(--red);   box-shadow: 0 0 6px var(--red); }
    .dot.yellow { background: var(--yellow);box-shadow: 0 0 6px var(--yellow); }

    main {
      display: grid;
      grid-template-columns: 260px 1fr;
      grid-template-rows: auto 1fr;
      gap: 0;
      height: calc(100vh - 61px);
    }

    /* ── Sidebar ── */
    .sidebar {
      border-right: 1px solid var(--border);
      background: var(--surface);
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
      grid-row: 1 / 3;
    }

    .sidebar-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      padding: 12px 8px 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius);
      cursor: pointer;
      color: var(--muted);
      transition: all 0.15s;
      border: 1px solid transparent;
      user-select: none;
    }
    .nav-item:hover { background: var(--border); color: var(--text); }
    .nav-item.active {
      background: rgba(124,106,255,0.12);
      border-color: rgba(124,106,255,0.25);
      color: var(--accent);
    }
    .nav-item .icon { font-size: 15px; width: 20px; text-align: center; }
    .nav-item .badge {
      margin-left: auto;
      font-size: 10px;
      background: var(--border);
      color: var(--muted);
      padding: 1px 6px;
      border-radius: 10px;
    }
    .nav-item.active .badge {
      background: rgba(124,106,255,0.2);
      color: var(--accent);
    }

    /* ── Top bar (stats) ── */
    .topbar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--muted);
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text);
      line-height: 1.2;
    }

    .stat-sub {
      font-size: 10px;
      color: var(--muted);
    }

    /* ── Content panels ── */
    .content {
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }

    .panel-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }

    .panel-action {
      font-size: 11px;
      color: var(--accent);
      cursor: pointer;
      background: none;
      border: none;
      font-family: inherit;
      padding: 3px 8px;
      border-radius: 5px;
      transition: background 0.15s;
    }
    .panel-action:hover { background: rgba(124,106,255,0.12); }

    /* ── Workflow rows ── */
    .workflow-row {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
      gap: 12px;
      transition: background 0.1s;
    }
    .workflow-row:last-child { border-bottom: none; }
    .workflow-row:hover { background: rgba(255,255,255,0.02); }

    .wf-status {
      width: 7px; height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .wf-status.active   { background: var(--green); box-shadow: 0 0 5px var(--green); }
    .wf-status.inactive { background: var(--border); }

    .wf-name {
      flex: 1;
      font-size: 13px;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .wf-id {
      font-size: 10px;
      color: var(--muted);
      font-family: monospace;
    }

    .wf-tag {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(124,106,255,0.12);
      color: var(--accent);
    }

    .btn {
      font-family: inherit;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 5px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn:hover { border-color: var(--accent); color: var(--accent); }
    .btn.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .btn.primary:hover { opacity: 0.85; }

    /* ── Execution log ── */
    .exec-row {
      display: grid;
      grid-template-columns: 90px 1fr 80px 100px;
      align-items: center;
      padding: 9px 16px;
      border-bottom: 1px solid var(--border);
      gap: 12px;
      font-size: 12px;
    }
    .exec-row:last-child { border-bottom: none; }
    .exec-row:hover { background: rgba(255,255,255,0.02); }

    .exec-row .col-id  { color: var(--muted); font-size: 11px; }
    .exec-row .col-wf  { color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .exec-row .col-status { }
    .exec-row .col-time { color: var(--muted); font-size: 11px; text-align: right; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-badge.success { background: rgba(16,185,129,0.12); color: var(--green); }
    .status-badge.error   { background: rgba(239,68,68,0.12);  color: var(--red); }
    .status-badge.running { background: rgba(245,158,11,0.12); color: var(--yellow); }
    .status-badge.waiting { background: rgba(100,116,139,0.12); color: var(--muted); }

    /* ── Trigger form ── */
    .trigger-form {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .form-row {
      display: flex;
      gap: 10px;
    }

    input, textarea {
      flex: 1;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-family: inherit;
      font-size: 12px;
      padding: 8px 10px;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, textarea:focus { border-color: var(--accent); }
    textarea { resize: vertical; min-height: 60px; }
    input::placeholder, textarea::placeholder { color: var(--muted); }

    /* ── Toast ── */
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 16px;
      font-size: 12px;
      color: var(--text);
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.2s;
      pointer-events: none;
      z-index: 999;
      max-width: 320px;
    }
    #toast.show { opacity: 1; transform: translateY(0); }
    #toast.ok  { border-color: var(--green); }
    #toast.err { border-color: var(--red); }

    /* ── Empty state ── */
    .empty {
      padding: 32px;
      text-align: center;
      color: var(--muted);
      font-size: 12px;
    }

    /* ── Loading ── */
    .loading {
      padding: 24px;
      text-align: center;
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.05em;
    }
    .loading::after {
      content: '';
      display: inline-block;
      width: 8px;
      animation: dots 1.2s infinite;
    }
    @keyframes dots {
      0%   { content: ''; }
      33%  { content: '.'; }
      66%  { content: '..'; }
      100% { content: '...'; }
    }
  </style>
</head>
<body>

<header>
  <div class="logo">
    <div class="logo-icon">⚡</div>
    MCP Automation Hub
  </div>
  <div style="display:flex;gap:10px;align-items:center;">
    <div class="status-pill">
      <div class="dot" id="n8n-dot"></div>
      <span id="n8n-label">connecting…</span>
    </div>
    <div class="status-pill" style="cursor:pointer;" onclick="refresh()">↻ refresh</div>
  </div>
</header>

<main>
  <!-- Sidebar -->
  <nav class="sidebar">
    <div class="sidebar-label">Workspace</div>
    <div class="nav-item active" onclick="showView('workflows')" id="nav-workflows">
      <span class="icon">⚙</span> Workflows
      <span class="badge" id="wf-count">—</span>
    </div>
    <div class="nav-item" onclick="showView('executions')" id="nav-executions">
      <span class="icon">▶</span> Executions
      <span class="badge" id="exec-count">—</span>
    </div>
    <div class="nav-item" onclick="showView('trigger')" id="nav-trigger">
      <span class="icon">⚡</span> Trigger
    </div>

    <div class="sidebar-label">Services</div>
    <div class="nav-item" id="svc-n8n">
      <span class="icon">🔗</span> n8n Cloud
      <span class="badge" id="svc-n8n-badge">—</span>
    </div>
    <div class="nav-item" id="svc-twilio">
      <span class="icon">📱</span> Twilio
      <span class="badge">cfg</span>
    </div>
    <div class="nav-item" id="svc-crewai">
      <span class="icon">🤖</span> CrewAI
      <span class="badge">cfg</span>
    </div>
    <div class="nav-item" id="svc-ngrok">
      <span class="icon">🌐</span> ngrok
      <span class="badge">cfg</span>
    </div>

    <div style="margin-top:auto;">
      <div class="sidebar-label">Instance</div>
      <div style="padding:8px 10px;font-size:10px;color:var(--muted);word-break:break-all;">
        ${n8nUrl}
      </div>
    </div>
  </nav>

  <!-- Stats bar -->
  <div class="topbar">
    <div class="stat-card">
      <div class="stat-label">Workflows</div>
      <div class="stat-value" id="stat-total">—</div>
      <div class="stat-sub">total</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active</div>
      <div class="stat-value" id="stat-active" style="color:var(--green)">—</div>
      <div class="stat-sub">running</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Executions</div>
      <div class="stat-value" id="stat-execs">—</div>
      <div class="stat-sub">recent</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Errors</div>
      <div class="stat-value" id="stat-errors" style="color:var(--red)">—</div>
      <div class="stat-sub">last 20</div>
    </div>
  </div>

  <!-- Content -->
  <div class="content" id="content">
    <div class="loading">Loading</div>
  </div>
</main>

<div id="toast"></div>

<script>
  const N8N_URL = '${n8nUrl}';
  let allWorkflows = [];
  let allExecutions = [];
  let currentView = 'workflows';

  // ── API helpers ─────────────────────────────────────────────────────────
  async function api(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  async function refresh() {
    try {
      const [ping, wfs, execs] = await Promise.all([
        api('/api/n8n/ping'),
        api('/api/n8n/workflows'),
        api('/api/n8n/executions?limit=20'),
      ]);

      // Connection dot
      const dot = document.getElementById('n8n-dot');
      const lbl = document.getElementById('n8n-label');
      if (ping.ok) {
        dot.className = 'dot green';
        lbl.textContent = 'connected';
      } else {
        dot.className = 'dot red';
        lbl.textContent = 'offline';
      }

      allWorkflows  = wfs;
      allExecutions = execs;

      // Stats
      const active = wfs.filter(w => w.active).length;
      const errors = execs.filter(e => e.status === 'error').length;
      document.getElementById('stat-total').textContent  = wfs.length;
      document.getElementById('stat-active').textContent = active;
      document.getElementById('stat-execs').textContent  = execs.length;
      document.getElementById('stat-errors').textContent = errors;

      // Badges
      document.getElementById('wf-count').textContent   = wfs.length;
      document.getElementById('exec-count').textContent = execs.length;
      document.getElementById('svc-n8n-badge').textContent = ping.ok ? 'live' : 'err';

      renderCurrentView();
    } catch (err) {
      document.getElementById('n8n-dot').className = 'dot red';
      document.getElementById('n8n-label').textContent = 'error';
      renderCurrentView(); // always render so screen is never blank
      toast('n8n unreachable: ' + err.message, true);
    }
  }

  // ── Views ─────────────────────────────────────────────────────────────────
  function showView(view) {
    currentView = view;
    ['workflows','executions','trigger'].forEach(v => {
      document.getElementById('nav-' + v)?.classList.toggle('active', v === view);
    });
    renderCurrentView();
  }

  function renderCurrentView() {
    if (currentView === 'workflows')  renderWorkflows();
    else if (currentView === 'executions') renderExecutions();
    else if (currentView === 'trigger') renderTrigger();
  }

  // ── Workflows ─────────────────────────────────────────────────────────────
  function renderWorkflows() {
    const el = document.getElementById('content');
    if (!allWorkflows.length) {
      el.innerHTML = '<div class="empty">No workflows yet — or n8n is unreachable. Check the connection dot above.</div>';
      return;
    }

    const rows = allWorkflows.map(w => \`
      <div class="workflow-row">
        <div class="wf-status \${w.active ? 'active' : 'inactive'}"></div>
        <div class="wf-name">\${esc(w.name)}</div>
        \${(w.tags||[]).map(t => \`<span class="wf-tag">\${esc(t.name)}</span>\`).join('')}
        <div class="wf-id">#\${w.id}</div>
        <button class="btn" onclick="toggleWorkflow('\${w.id}',\${w.active})">
          \${w.active ? 'pause' : 'activate'}
        </button>
      </div>
    \`).join('');

    el.innerHTML = \`
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Workflows</span>
          <a href="\${N8N_URL}/workflows" target="_blank" style="font-size:11px;color:var(--accent);text-decoration:none;">open in n8n ↗</a>
        </div>
        \${rows}
      </div>
    \`;
  }

  // ── Executions ────────────────────────────────────────────────────────────
  function renderExecutions() {
    const el = document.getElementById('content');
    if (!allExecutions.length) {
      el.innerHTML = '<div class="empty">No recent executions.</div>';
      return;
    }

    const rows = allExecutions.map(e => {
      const wf = allWorkflows.find(w => w.id === e.workflowId);
      const name = wf ? wf.name : e.workflowId;
      const time = e.startedAt ? new Date(e.startedAt).toLocaleTimeString() : '—';
      return \`
        <div class="exec-row">
          <div class="col-id">#\${e.id}</div>
          <div class="col-wf">\${esc(name)}</div>
          <div class="col-status"><span class="status-badge \${e.status}">\${e.status}</span></div>
          <div class="col-time">\${time}</div>
        </div>
      \`;
    }).join('');

    el.innerHTML = \`
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Recent Executions</span>
          <button class="panel-action" onclick="refresh()">↻ refresh</button>
        </div>
        <div class="exec-row" style="color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border);">
          <div>ID</div><div>Workflow</div><div>Status</div><div style="text-align:right">Time</div>
        </div>
        \${rows}
      </div>
    \`;
  }

  // ── Trigger ───────────────────────────────────────────────────────────────
  function renderTrigger() {
    const options = allWorkflows.map(w =>
      \`<option value="\${esc(w.id)}">\${esc(w.name)}</option>\`
    ).join('');

    document.getElementById('content').innerHTML = \`
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Trigger Webhook Workflow</span>
        </div>
        <div class="trigger-form">
          <div class="form-row">
            <input id="wh-path" placeholder="Webhook path  (e.g. my-workflow)" />
          </div>
          <div class="form-row">
            <textarea id="wh-payload" placeholder='{"key": "value"}  — optional JSON payload'></textarea>
          </div>
          <div class="form-row">
            <button class="btn primary" onclick="triggerWebhook()">⚡ Trigger</button>
          </div>
          <div id="trigger-result" style="font-size:11px;color:var(--muted);"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Quick Activate / Deactivate</span>
        </div>
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px;">
          <div class="form-row">
            <select id="wf-select" style="background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:12px;padding:8px 10px;border-radius:6px;flex:1;outline:none;">
              <option value="">— select workflow —</option>
              \${options}
            </select>
          </div>
          <div class="form-row" style="gap:8px;">
            <button class="btn" onclick="quickToggle(true)">✓ Activate</button>
            <button class="btn" onclick="quickToggle(false)">⏸ Deactivate</button>
          </div>
        </div>
      </div>
    \`;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function toggleWorkflow(id, isActive) {
    try {
      const action = isActive ? 'deactivate' : 'activate';
      await fetch(\`/api/n8n/workflows/\${id}/\${action}\`, { method: 'POST' });
      toast(isActive ? 'Workflow paused' : 'Workflow activated');
      await refresh();
    } catch (e) {
      toast('Failed: ' + e.message, true);
    }
  }

  async function quickToggle(activate) {
    const id = document.getElementById('wf-select')?.value;
    if (!id) { toast('Select a workflow first', true); return; }
    await toggleWorkflow(id, !activate);
  }

  async function triggerWebhook() {
    const path = document.getElementById('wh-path')?.value?.trim();
    if (!path) { toast('Enter a webhook path', true); return; }
    let payload = {};
    const raw = document.getElementById('wh-payload')?.value?.trim();
    if (raw) {
      try { payload = JSON.parse(raw); } catch { toast('Invalid JSON payload', true); return; }
    }
    try {
      const res = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookPath: path, payload }),
      });
      const data = await res.json();
      document.getElementById('trigger-result').textContent = JSON.stringify(data, null, 2);
      toast(data.status === 'triggered' ? '⚡ Triggered!' : 'Trigger failed', data.status !== 'triggered');
    } catch (e) {
      toast('Error: ' + e.message, true);
    }
  }

  // ── Utils ─────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  let toastTimer;
  function toast(msg, err = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'show ' + (err ? 'err' : 'ok');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, 3000);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  refresh();
  setInterval(refresh, 30_000);
</script>
</body>
</html>`;
}
