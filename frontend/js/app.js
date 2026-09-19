/**
 * LandStack Frontend — App Logic
 * Member 4: This is your starting point. Extend each page section below.
 */

/* ── State ──────────────────────────────────────────────────── */
const state = {
  currentUser: null,
  currentPage: 'dashboard',
  useMock: true,   // set false when backend is running
};

/* ── DOM helpers ────────────────────────────────────────────── */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];

/* ═══════════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════════ */
function showLogin() {
  $('#login-page').style.display = 'flex';
  $('#app-page').classList.remove('visible');
}

function showApp(user) {
  state.currentUser = user;
  $('#login-page').style.display = 'none';
  $('#app-page').classList.add('visible');
  updateUserPill(user);
  navigateTo('dashboard');
}

function updateUserPill(user) {
  const initials = (user.full_name || user.username || 'U')
    .split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  $('#user-avatar').textContent = initials;
  $('#user-name').textContent   = user.full_name || user.username;
  $('#user-role').textContent   = user.role || 'OFFICER';
}

/* Login form */
function initLogin() {
  // Role selector
  $$('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('#login-username').value = btn.dataset.demo_user || '';
      $('#login-password').value = 'password123';
    });
  });

  // Demo auto-fill
  $('#demo-fill').addEventListener('click', () => {
    $('#login-username').value = 'officer_ravi';
    $('#login-password').value = 'password123';
  });

  // Submit
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#login-submit');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;

    try {
      if (state.useMock) {
        await delay(600);
        showApp({ ...MOCK.user, username, role: getSelectedRole() });
      } else {
        await API.login(username, password);
        const user = await API.me();
        showApp(user);
      }
    } catch (err) {
      showToast('Login failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In to LandStack';
    }
  });
}

function getSelectedRole() {
  const active = $('.role-btn.active');
  return active ? active.dataset.role : 'OFFICER';
}

/* Logout */
function logout() {
  API.clearToken();
  state.currentUser = null;
  showLogin();
}

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════════════ */
function navigateTo(page) {
  state.currentPage = page;

  // update nav items
  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // show correct page
  $$('.page').forEach(p => p.classList.remove('active'));
  const target = $(`#page-${page}`);
  if (target) target.classList.add('active');

  // update topbar title
  const labels = {
    dashboard: 'Dashboard',
    search:    'Parcel Search',
    profile:   'Unified Parcel Profile',
    gis:       'GIS Map View',
    alerts:    'Anomaly Alerts',
    reports:   'Reports',
    settings:  'Settings',
  };
  $('#topbar-title').textContent = labels[page] || page;

  // load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'search':    loadSearchPage(); break;
    case 'profile':   loadProfilePage(); break;
    case 'alerts':    loadAlertsPage(); break;
  }
}

function initNav() {
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });
  $('#logout-btn').addEventListener('click', logout);
  $('#topbar-logout').addEventListener('click', logout);
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
async function loadDashboard() {
  const stats = state.useMock ? MOCK.stats : await API.getParcels();

  // Stats
  $('#stat-total-parcels').textContent   = stats.total_parcels.toLocaleString();
  $('#stat-anomaly-flagged').textContent = stats.anomaly_flagged.toLocaleString();
  $('#stat-pending-tax').textContent     = stats.pending_tax.toLocaleString();
  $('#stat-mortgages').textContent       = stats.active_mortgages.toLocaleString();
  $('#stat-court-cases').textContent     = stats.court_cases.toLocaleString();
  $('#stat-registrations').textContent   = stats.registrations_today.toLocaleString();

  // Recent parcels table
  const parcels = state.useMock ? MOCK.parcels : (await API.getParcels(0, 6));
  renderRecentParcels(parcels);

  // Alerts
  renderDashboardAlerts(MOCK.alerts.slice(0,3));

  // Activity
  renderActivity(MOCK.activity);
}

function renderRecentParcels(parcels) {
  const tbody = $('#recent-parcels-body');
  tbody.innerHTML = parcels.map(p => `
    <tr>
      <td class="td-mono" style="cursor:pointer" onclick="openProfile('${p.ulpin}')">${p.ulpin}</td>
      <td class="td-bold">${p.owner_name}</td>
      <td>${p.district}</td>
      <td>${(p.area_sqm / 10000).toFixed(3)} ha</td>
      <td><span class="badge badge-blue">${p.land_type}</span></td>
      <td>
        <button class="card-action" onclick="openProfile('${p.ulpin}')">View Profile →</button>
      </td>
    </tr>
  `).join('');
}

function renderDashboardAlerts(alerts) {
  $('#dashboard-alerts').innerHTML = alerts.map(a => `
    <div class="alert-item ${a.type}">
      <span class="alert-icon">${a.icon}</span>
      <div class="alert-text">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
      </div>
      <span class="alert-time">${a.time}</span>
    </div>
  `).join('');
}

function renderActivity(items) {
  $('#activity-feed').innerHTML = items.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.color}"></div>
      <div class="activity-body">
        <div class="activity-msg">${a.msg}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH PAGE
═══════════════════════════════════════════════════════════════ */
function loadSearchPage() {
  renderSearchTable(MOCK.parcels);

  $('#search-parcels-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = MOCK.parcels.filter(p =>
      p.ulpin.toLowerCase().includes(q) ||
      p.owner_name.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    );
    renderSearchTable(filtered);
  });
}

function renderSearchTable(parcels) {
  const tbody = $('#search-table-body');
  if (!parcels.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🔍</div><h4>No parcels found</h4><p>Try a different ULPIN or owner name</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = parcels.map(p => `
    <tr>
      <td class="td-mono">${p.ulpin}</td>
      <td class="td-bold">${p.owner_name}</td>
      <td>${p.district}</td>
      <td>${p.taluk}</td>
      <td>${p.area_sqm} m²</td>
      <td><span class="badge badge-blue">${p.land_type}</span></td>
      <td>
        <button class="btn-search" style="font-size:12px;padding:5px 12px" onclick="openProfile('${p.ulpin}')">View →</button>
      </td>
    </tr>
  `).join('');
}

/* ═══════════════════════════════════════════════════════════════
   UNIFIED PARCEL PROFILE
═══════════════════════════════════════════════════════════════ */
function loadProfilePage() {
  // wire up the search
  $('#profile-search-btn').addEventListener('click', () => {
    const ulpin = $('#profile-ulpin-input').value.trim().toUpperCase();
    if (ulpin) fetchProfile(ulpin);
  });
  $('#profile-ulpin-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('#profile-search-btn').click();
  });
}

function openProfile(ulpin) {
  navigateTo('profile');
  setTimeout(() => {
    $('#profile-ulpin-input').value = ulpin;
    fetchProfile(ulpin);
  }, 50);
}

async function fetchProfile(ulpin) {
  const container = $('#profile-result');
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div> Loading profile for ${ulpin}…</div>`;

  await delay(700);

  try {
    const data = state.useMock
      ? MOCK.profile(ulpin)
      : await API.getUnifiedProfile(ulpin);

    renderProfile(data);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h4>Parcel not found</h4>
        <p>${err.message}</p>
      </div>`;
  }
}

function renderProfile(data) {
  const { ulpin, parcel, ror, registration, tax, encumbrance, land_use,
          building_permit, court_cases, anomaly_score, anomaly_flags } = data;

  const score = anomaly_score || 0;
  const scoreClass = score < 30 ? 'low' : score < 70 ? 'medium' : 'high';
  const scoreColor = score < 30 ? 'var(--green)' : score < 70 ? 'var(--orange)' : 'var(--red)';

  $('#profile-result').innerHTML = `
    <div class="profile-grid">
      <!-- Left: Parcel ID Card -->
      <div class="parcel-id-card">
        <div class="ulpin-hero">
          <div class="ulpin-label">Unique Land Parcel ID</div>
          <div class="ulpin-code">${ulpin}</div>
          <div class="ulpin-sub">${parcel.district} · ${parcel.taluk} Taluk</div>
        </div>

        ${kv('Owner',      parcel.owner_name)}
        ${kv('Survey No.', parcel.survey_no || '—')}
        ${kv('Area',       `${parcel.area_sqm} m² (${(parcel.area_sqm/4047).toFixed(3)} acres)`)}
        ${kv('Land Type',  parcel.land_type)}
        ${kv('State',      'Karnataka')}

        <div class="anomaly-meter">
          <div class="anomaly-label">
            <span>AI Anomaly Risk Score</span>
            <span class="anomaly-score" style="color:${scoreColor}">${score}/100</span>
          </div>
          <div class="anomaly-bar-track">
            <div class="anomaly-bar-fill ${scoreClass}" style="width:${score}%"></div>
          </div>
        </div>

        ${anomaly_flags && anomaly_flags.length ? `
          <div class="alert-list" style="margin-top:4px">
            ${anomaly_flags.map(f => `
              <div class="alert-item ${f.severity === 'high' ? 'critical' : 'warning'}">
                <span class="alert-icon">${f.severity === 'high' ? '🚨' : '⚠️'}</span>
                <div class="alert-text">
                  <div class="alert-desc" style="font-size:12px">${f.flag}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Right: Department Tabs -->
      <div>
        <div class="dept-tab-triggers">
          ${['RoR','Registration','Tax','Encumbrance','Land Use','Permits','Court Cases'].map((t,i) =>
            `<button class="dept-tab-btn ${i===0?'active':''}" data-tab="${i}" onclick="switchDeptTab(this)">${t}</button>`
          ).join('')}
        </div>

        <div id="dept-tab-ror" class="dept-tab-content card active">
          <div class="card-header">
            <span class="card-title">📜 Record of Rights (Pahani / Bhoomi)</span>
            <span class="badge badge-green">✓ Verified</span>
          </div>
          <div class="card-body">
            <div class="dept-kv-grid">
              ${deptKV('Khata No.',       ror?.khata_no || '—')}
              ${deptKV('Owner Name',      ror?.owner_name || '—')}
              ${deptKV("Father's Name",   ror?.father_name || '—')}
              ${deptKV('Pattadar Name',   ror?.pattadar_name || '—')}
              ${deptKV('Caste Category',  ror?.caste_category || '—')}
            </div>
          </div>
        </div>

        <div id="dept-tab-registration" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">📋 Sub-Registrar Deed Registration</span>
            <span class="badge badge-blue">SRO</span>
          </div>
          <div class="card-body">
            <div class="dept-kv-grid">
              ${deptKV('Deed No.',        registration?.deed_no || '—')}
              ${deptKV('Deed Type',       registration?.deed_type || '—')}
              ${deptKV('Seller',          registration?.seller_name || '—')}
              ${deptKV('Buyer',           registration?.buyer_name || '—')}
              ${deptKV('Date',            registration?.registration_date || '—')}
              ${deptKV('Market Value',    registration?.market_value ? '₹' + Number(registration.market_value).toLocaleString() : '—')}
            </div>
          </div>
        </div>

        <div id="dept-tab-tax" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">🏛️ Property Tax (BBMP / Revenue)</span>
            <span class="badge ${tax?.status === 'PAID' ? 'badge-green' : 'badge-red'}">${tax?.status || '—'}</span>
          </div>
          <div class="card-body">
            <div class="dept-kv-grid">
              ${deptKV('Assessment No.',  tax?.assessment_no || '—')}
              ${deptKV('Annual Value',    tax?.annual_value ? '₹' + Number(tax.annual_value).toLocaleString() : '—')}
              ${deptKV('Tax Amount',      tax?.tax_amount   ? '₹' + Number(tax.tax_amount).toLocaleString()   : '—')}
              ${deptKV('Status',          tax?.status || '—')}
              ${deptKV('Last Paid',       tax?.last_paid_date || '—')}
            </div>
          </div>
        </div>

        <div id="dept-tab-encumbrance" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">🏦 Encumbrance / Mortgage (CERSAI)</span>
            <span class="badge ${encumbrance ? 'badge-orange' : 'badge-green'}">${encumbrance ? 'MORTGAGED' : 'CLEAR'}</span>
          </div>
          <div class="card-body">
            ${encumbrance ? `
              <div class="dept-kv-grid">
                ${deptKV('Bank',         encumbrance.bank_name)}
                ${deptKV('Loan Amount',  '₹' + Number(encumbrance.loan_amount).toLocaleString())}
                ${deptKV('Status',       encumbrance.status)}
                ${deptKV('Mortgaged',    encumbrance.mortgaged_date)}
                ${deptKV('End Date',     encumbrance.loan_end_date)}
              </div>` : `<div class="empty-state" style="padding:24px"><div class="empty-icon">✅</div><h4>No Encumbrances</h4><p>This parcel is free of mortgages and liens.</p></div>`}
          </div>
        </div>

        <div id="dept-tab-land_use" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">🗺️ Land Use / Master Plan Zoning</span>
            <span class="badge badge-purple">${land_use?.zone_type || '—'}</span>
          </div>
          <div class="card-body">
            <div class="dept-kv-grid">
              ${deptKV('Zone Type',       land_use?.zone_type || '—')}
              ${deptKV('Current Use',     land_use?.current_use || '—')}
              ${deptKV('Change Request',  land_use?.change_requested ? '⚠️ Yes' : '✅ No')}
              ${deptKV('Plan Year',       land_use?.plan_year || '—')}
            </div>
          </div>
        </div>

        <div id="dept-tab-permits" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">🏗️ Building Permits (Municipal)</span>
          </div>
          <div class="card-body">
            ${building_permit ? `
              <div class="dept-kv-grid">
                ${deptKV('Permit No.',   building_permit.permit_no)}
                ${deptKV('Status',       building_permit.approval_status)}
                ${deptKV('Type',         building_permit.construction_type)}
                ${deptKV('Floors',       building_permit.floors_sanctioned)}
                ${deptKV('Issue Date',   building_permit.issue_date)}
              </div>` : `<div class="empty-state" style="padding:24px"><div class="empty-icon">🏗️</div><h4>No Building Permits</h4><p>No permit records for this parcel.</p></div>`}
          </div>
        </div>

        <div id="dept-tab-cases" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">⚖️ Court Cases / Litigations</span>
            <span class="badge ${court_cases?.length ? 'badge-red' : 'badge-green'}">${court_cases?.length ? court_cases.length + ' Active' : 'Clear'}</span>
          </div>
          <div class="card-body">
            ${court_cases && court_cases.length ? `
              <table class="data-table">
                <thead><tr><th>Case No.</th><th>Type</th><th>Status</th><th>Court</th></tr></thead>
                <tbody>${court_cases.map(c => `
                  <tr>
                    <td class="td-mono">${c.case_no}</td>
                    <td>${c.case_type}</td>
                    <td><span class="badge badge-red">${c.status}</span></td>
                    <td>${c.court_name}</td>
                  </tr>`).join('')}
                </tbody>
              </table>` : `<div class="empty-state" style="padding:24px"><div class="empty-icon">⚖️</div><h4>No Court Cases</h4><p>This parcel has no litigation history.</p></div>`}
          </div>
        </div>
      </div>
    </div>
  `;
}

function kv(key, val) {
  return `<div class="parcel-meta-row"><span class="meta-key">${key}</span><span class="meta-val">${val}</span></div>`;
}
function deptKV(key, val) {
  return `<div class="kv-item"><div class="kv-key">${key}</div><div class="kv-val">${val}</div></div>`;
}

const tabIds = ['dept-tab-ror','dept-tab-registration','dept-tab-tax','dept-tab-encumbrance','dept-tab-land_use','dept-tab-permits','dept-tab-cases'];
function switchDeptTab(btn) {
  $$('.dept-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const idx = parseInt(btn.dataset.tab);
  tabIds.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', i === idx);
  });
}

/* ═══════════════════════════════════════════════════════════════
   ALERTS PAGE
═══════════════════════════════════════════════════════════════ */
function loadAlertsPage() {
  $('#all-alerts-list').innerHTML = MOCK.alerts.map(a => `
    <div class="alert-item ${a.type}" style="margin-bottom:10px; border-radius: var(--radius-sm);">
      <span class="alert-icon">${a.icon}</span>
      <div class="alert-text">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
      </div>
      <span class="alert-time">${a.time}</span>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL SEARCH (topbar)
═══════════════════════════════════════════════════════════════ */
function initGlobalSearch() {
  $('#global-search-btn').addEventListener('click', () => {
    const q = $('#global-search').value.trim().toUpperCase();
    if (q.startsWith('UL')) openProfile(q);
    else navigateTo('search');
  });
  $('#global-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('#global-search-btn').click();
  });
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function showToast(msg, type='info') {
  const colors = { info: 'var(--blue)', error: 'var(--red)', success: 'var(--green)' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:var(--bg-secondary); border:1px solid ${colors[type]};
    border-left:4px solid ${colors[type]};
    padding:14px 20px; border-radius:var(--radius-sm);
    font-size:14px; color:var(--text-primary);
    box-shadow:var(--shadow-card);
    animation:fadeUp 0.3s ease;
    max-width:360px;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ── Util ──────────────────────────────────────────────────── */
const delay = ms => new Promise(r => setTimeout(r, ms));

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initNav();
  initGlobalSearch();

  // check for saved token
  const savedToken = API.getToken();
  if (savedToken && !state.useMock) {
    API.me().then(user => showApp(user)).catch(() => showLogin());
  } else {
    showLogin();
  }
});
