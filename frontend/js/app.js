/**
 * LandStack Frontend — Main App
 * Live backend at http://localhost:8000  (auto-detects if online, falls back to mock)
 */

/* ── App State ──────────────────────────────────────────────── */
const state = {
  user: null,
  page: 'dashboard',
  backendOnline: false,   // detected at startup
  parcels: [],            // cached parcel list
};

/* ── Helpers ────────────────────────────────────────────────── */
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const delay = ms => new Promise(r => setTimeout(r, ms));
const fmt = {
  inr: (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—',
  area: (sqm) => sqm ? `${sqm.toLocaleString()} m² · ${(sqm/4047).toFixed(3)} ac` : '—',
  date: (s) => s ? new Date(s).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—',
};

/* ═══════════════════════════════════════════════════════════════
   STARTUP — detect backend
═══════════════════════════════════════════════════════════════ */
async function detectBackend() {
  try {
    state.backendOnline = await API.health();
  } catch {
    state.backendOnline = false;
  }
  const pill = $('#backend-status');
  if (pill) {
    pill.textContent = state.backendOnline ? '🟢 Backend Online' : '🟡 Demo Mode';
    pill.style.color = state.backendOnline ? 'var(--green)' : 'var(--orange)';
  }
}

/* ═══════════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════════ */
function showLogin() {
  $('#login-page').style.display = 'flex';
  $('#app-page').classList.remove('visible');
}

function showApp(user) {
  state.user = user;
  $('#login-page').style.display = 'none';
  $('#app-page').classList.add('visible');
  // update user pill
  const initials = (user.full_name || user.username || 'U')
    .split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  $('#user-avatar').textContent = initials;
  $('#user-name').textContent   = user.full_name || user.username;
  $('#user-role').textContent   = user.role || 'OFFICER';
  navigateTo('dashboard');
}

function logout() {
  API.clearToken();
  state.user = null;
  showLogin();
}

/* ── Login form ─────────────────────────────────────────────── */
function initLogin() {
  $$('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.demo_user) {
        $('#login-username').value = btn.dataset.demo_user;
        $('#login-password').value = 'password123';
      }
    });
  });

  $('#demo-fill').addEventListener('click', () => {
    $('#login-username').value = 'officer_ravi';
    $('#login-password').value = 'password123';
  });

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#login-submit');
    const origText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:8px"></span> Signing in…';

    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;

    try {
      if (state.backendOnline) {
        await API.login(username, password);
        const user = await API.me();
        showApp(user);
      } else {
        await delay(500);
        // Demo mode: accept any credentials
        showApp({ ...MOCK.user, username, role: getSelectedRole() });
      }
    } catch (err) {
      showToast('Login failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });
}

function getSelectedRole() {
  const a = $('.role-btn.active');
  return a ? (a.dataset.role || 'OFFICER') : 'OFFICER';
}

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════════════ */
function navigateTo(page) {
  state.page = page;
  $$('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.page === page));
  $$('.page').forEach(p => p.classList.remove('active'));
  const el = $(`#page-${page}`);
  if (el) el.classList.add('active');

  const titles = { dashboard:'Dashboard', search:'Parcel Search', profile:'Unified Parcel Profile',
                   gis:'GIS Map View', alerts:'Anomaly Alerts', reports:'Reports', settings:'Settings' };
  $('#topbar-title').textContent = titles[page] || page;

  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'search':    loadSearch();    break;
    case 'profile':   initProfile();  break;
    case 'alerts':    loadAlerts();   break;
    case 'reports':   loadReports();  break;
  }
}

function initNav() {
  $$('.nav-item').forEach(i => i.addEventListener('click', () => navigateTo(i.dataset.page)));
  $$('[data-logout]').forEach(b => b.addEventListener('click', logout));
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
async function loadDashboard() {
  // Load parcels (live or mock)
  let parcels = MOCK.parcels;
  if (state.backendOnline) {
    try { parcels = await API.getParcels(6); } catch { parcels = MOCK.parcels; }
  }
  state.parcels = parcels;

  // Stats — derive from real parcel list or use mock stats
  const stats = MOCK.stats;
  $('#stat-total-parcels').textContent   = state.backendOnline ? parcels.length + '+' : stats.total_parcels.toLocaleString();
  $('#stat-anomaly-flagged').textContent = stats.anomaly_flagged.toLocaleString();
  $('#stat-pending-tax').textContent     = stats.pending_tax.toLocaleString();
  $('#stat-mortgages').textContent       = stats.active_mortgages.toLocaleString();
  $('#stat-court-cases').textContent     = stats.court_cases.toLocaleString();
  $('#stat-registrations').textContent   = stats.registrations_today.toLocaleString();

  renderRecentParcels(parcels.slice(0,6));
  renderDashboardAlerts(MOCK.alerts.slice(0,3));
  renderActivity(MOCK.activity);

  // Backend status badge in dept grid
  const statusEl = $('#api-status-badge');
  if (statusEl) {
    statusEl.innerHTML = state.backendOnline
      ? '<span class="badge badge-green">🟢 API Online</span>'
      : '<span class="badge badge-orange">🟡 Demo Mode</span>';
  }
}

function renderRecentParcels(parcels) {
  $('#recent-parcels-body').innerHTML = parcels.map(p => `
    <tr>
      <td class="td-mono clickable" onclick="openProfile('${p.ulpin}')">${p.ulpin}</td>
      <td class="td-bold">${p.owner_name || '—'}</td>
      <td>${p.district || p.village || '—'}</td>
      <td>${fmt.area(p.area_sqm)}</td>
      <td><span class="badge badge-blue">${p.land_type || '—'}</span></td>
      <td><button class="link-btn" onclick="openProfile('${p.ulpin}')">View →</button></td>
    </tr>`).join('');
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
    </div>`).join('');
}

function renderActivity(items) {
  $('#activity-feed').innerHTML = items.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.color}"></div>
      <div class="activity-body">
        <div class="activity-msg">${a.msg}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH
═══════════════════════════════════════════════════════════════ */
async function loadSearch() {
  let parcels = state.parcels.length ? state.parcels : MOCK.parcels;
  if (state.backendOnline && !state.parcels.length) {
    try { parcels = await API.getParcels(50); state.parcels = parcels; } catch {}
  }
  renderSearchTable(parcels);

  const inp = $('#search-parcels-input');
  inp.value = '';
  inp.oninput = (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = parcels.filter(p =>
      (p.ulpin||'').toLowerCase().includes(q) ||
      (p.owner_name||'').toLowerCase().includes(q) ||
      (p.district||'').toLowerCase().includes(q) ||
      (p.village||'').toLowerCase().includes(q) ||
      (p.taluk||'').toLowerCase().includes(q)
    );
    renderSearchTable(filtered);
  };
}

function renderSearchTable(parcels) {
  const body = $('#search-table-body');
  if (!parcels.length) {
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🔍</div><h4>No parcels found</h4><p>Try a different ULPIN, owner name or district</p></div></td></tr>`;
    return;
  }
  body.innerHTML = parcels.map(p => `
    <tr>
      <td class="td-mono clickable" onclick="openProfile('${p.ulpin}')">${p.ulpin}</td>
      <td class="td-bold">${p.owner_name||'—'}</td>
      <td>${p.district||'—'}</td>
      <td>${p.village||p.taluk||'—'}</td>
      <td>${p.area_sqm ? (p.area_sqm).toLocaleString()+' m²' : '—'}</td>
      <td><span class="badge badge-blue">${p.land_type||'—'}</span></td>
      <td><button class="link-btn" onclick="openProfile('${p.ulpin}')">View Profile →</button></td>
    </tr>`).join('');
}

/* ═══════════════════════════════════════════════════════════════
   UNIFIED PROFILE
═══════════════════════════════════════════════════════════════ */
function initProfile() {
  const btn = $('#profile-search-btn');
  const inp = $('#profile-ulpin-input');
  if (btn._init) return;
  btn._init = true;
  btn.addEventListener('click', () => {
    const u = inp.value.trim().toUpperCase();
    if (u) fetchProfile(u);
  });
  inp.addEventListener('keydown', e => { if(e.key==='Enter') btn.click(); });
}

function openProfile(ulpin) {
  navigateTo('profile');
  setTimeout(() => {
    $('#profile-ulpin-input').value = ulpin;
    fetchProfile(ulpin);
  }, 60);
}

async function fetchProfile(ulpin) {
  const result = $('#profile-result');
  result.innerHTML = `
    <div class="loading-overlay">
      <div class="spinner"></div>
      <span>Loading profile for <strong>${ulpin}</strong> from ${state.backendOnline ? 'live API' : 'demo data'}…</span>
    </div>`;

  await delay(state.backendOnline ? 300 : 600);

  try {
    let data;
    if (state.backendOnline) {
      data = await API.getProfile(ulpin);
    } else {
      // Check ULPIN exists in mock
      const found = MOCK.parcels.find(p => p.ulpin === ulpin);
      if (!found && !ulpin.match(/^UL\d+$/)) throw new Error(`No parcel found with ULPIN "${ulpin}"`);
      data = MOCK.profile(ulpin);
    }
    renderProfile(data);
  } catch(err) {
    result.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h4>Parcel not found</h4>
        <p>${err.message}</p>
        <p style="margin-top:12px;font-size:12px;color:var(--text-muted)">Try: UL001, UL002, UL003, UL004, UL005, UL006</p>
      </div>`;
  }
}

/* ── Render the full unified profile ─────────────────────────── */
function renderProfile(d) {
  const { ulpin, parcel={}, ror, registration, tax, encumbrance,
          land_use, building_permit, court_cases=[], anomaly_score=0, anomaly_flags=[], risk_label } = d;

  const score = Math.min(100, Math.max(0, anomaly_score || 0));
  const scoreClass  = score < 30 ? 'low' : score < 70 ? 'medium' : 'high';
  const scoreColor  = score < 30 ? 'var(--green)' : score < 70 ? 'var(--orange)' : 'var(--red)';
  const riskBadge   = score < 30 ? 'badge-green' : score < 70 ? 'badge-orange' : 'badge-red';
  const riskText    = score < 30 ? 'Low Risk' : score < 70 ? 'Medium Risk' : 'High Risk';

  const tabDefs = [
    { id:'ror',          label:'📜 RoR',         badge: ror ? 'badge-green' : 'badge-red',    btext: ror ? '✓ Found' : 'No Record' },
    { id:'registration', label:'📋 Registration', badge: registration ? 'badge-blue' : 'badge-red', btext: registration ? '✓ Deed Found' : 'No Record' },
    { id:'tax',          label:'🏛️ Tax',          badge: tax?.status==='PAID' ? 'badge-green' : 'badge-red', btext: tax?.status || '—' },
    { id:'encumbrance',  label:'🏦 Encumbrance',  badge: encumbrance ? 'badge-orange' : 'badge-green', btext: encumbrance ? 'Mortgaged' : 'Clear' },
    { id:'land_use',     label:'🗺️ Land Use',     badge: 'badge-purple', btext: land_use?.zone_type || '—' },
    { id:'permits',      label:'🏗️ Permits',      badge: building_permit ? 'badge-blue' : 'badge-green', btext: building_permit ? building_permit.approval_status || '—' : 'None' },
    { id:'cases',        label:'⚖️ Court',        badge: court_cases.length ? 'badge-red' : 'badge-green', btext: court_cases.length ? court_cases.length+' Active' : 'Clear' },
  ];

  $('#profile-result').innerHTML = `
    <!-- Source badge -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
      <span class="badge ${state.backendOnline ? 'badge-green' : 'badge-orange'}">
        ${state.backendOnline ? '🟢 Live API Data' : '🟡 Demo Data'}
      </span>
      <span class="badge badge-blue">ULPIN: ${ulpin}</span>
      <span class="badge ${riskBadge}">${riskText} · ${score}/100</span>
    </div>

    <div class="profile-grid">
      <!-- ── LEFT: Parcel ID Card ───────────────────────────── -->
      <div class="parcel-id-card">
        <div class="ulpin-hero">
          <div class="ulpin-label">Unique Land Parcel ID</div>
          <div class="ulpin-code">${ulpin}</div>
          <div class="ulpin-sub">${parcel.district || '—'} · ${parcel.taluk || parcel.village || '—'}</div>
        </div>

        ${kvRow('Owner',       parcel.owner_name || ror?.owner_name || '—')}
        ${kvRow('Survey No.',  parcel.survey_number || '—')}
        ${kvRow('Village',     parcel.village || '—')}
        ${kvRow('State',       parcel.state || 'Karnataka')}
        ${kvRow('GIS Area',    fmt.area(parcel.area_sqm))}
        ${kvRow('Land Type',   parcel.land_type || '—')}

        <!-- Anomaly Meter -->
        <div class="anomaly-meter">
          <div class="anomaly-label">
            <span>AI Anomaly Risk Score</span>
            <span class="anomaly-score" style="color:${scoreColor}">${score}/100</span>
          </div>
          <div class="anomaly-bar-track">
            <div class="anomaly-bar-fill ${scoreClass}" style="width:0%" id="anomaly-fill"></div>
          </div>
        </div>

        <!-- Flags -->
        ${anomaly_flags.length ? `
          <div style="display:flex;flex-direction:column;gap:8px">
            ${anomaly_flags.map(f => `
              <div class="alert-item ${f.severity==='high'?'critical':'warning'}" style="border-radius:var(--radius-sm)">
                <span class="alert-icon">${f.severity==='high'?'🚨':'⚠️'}</span>
                <div class="alert-text"><div class="alert-desc" style="font-size:11.5px">${f.flag}</div></div>
              </div>`).join('')}
          </div>` : `
          <div style="text-align:center;padding:12px;background:rgba(72,187,120,0.06);border:1px solid rgba(72,187,120,0.2);border-radius:var(--radius-sm)">
            <div style="font-size:24px">✅</div>
            <div style="font-size:13px;color:var(--green);font-weight:600;margin-top:4px">No Anomalies Detected</div>
          </div>`}
      </div>

      <!-- ── RIGHT: Department Tabs ────────────────────────── -->
      <div>
        <!-- Tab Buttons -->
        <div class="dept-tab-triggers">
          ${tabDefs.map((t,i) => `
            <button class="dept-tab-btn ${i===0?'active':''}" data-tab="${i}" onclick="switchTab(this)">
              ${t.label} <span class="badge ${t.badge}" style="font-size:10px;margin-left:4px">${t.btext}</span>
            </button>`).join('')}
        </div>

        <!-- RoR -->
        <div id="dtab-0" class="dept-tab-content card active">
          <div class="card-header">
            <span class="card-title">📜 Record of Rights (Pahani / Bhoomi / Jamabandi)</span>
          </div>
          <div class="card-body">
            ${ror ? `<div class="dept-kv-grid">
              ${dKV('Khata No.',          ror.khata_no)}
              ${dKV('Owner Name',         ror.owner_name)}
              ${dKV("Father's Name",      ror.father_name)}
              ${dKV('Pattadar',           ror.pattadar_name)}
              ${dKV('Caste Category',     ror.caste_category)}
              ${dKV('Recorded Area',      ror.recorded_area_acres ? ror.recorded_area_acres+' acres' : '—')}
            </div>` : noRecord('RoR')}
          </div>
        </div>

        <!-- Registration -->
        <div id="dtab-1" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">📋 Sub-Registrar Deed Registration (Kaveri / SRO)</span>
          </div>
          <div class="card-body">
            ${registration ? `<div class="dept-kv-grid">
              ${dKV('Deed No.',           registration.deed_no)}
              ${dKV('Type',               registration.deed_type)}
              ${dKV('Seller',             registration.seller_name)}
              ${dKV('Buyer',              registration.buyer_name)}
              ${dKV('Date',               fmt.date(registration.registration_date))}
              ${dKV('Market Value',       fmt.inr(registration.market_value))}
              ${dKV('Stamp Duty',         fmt.inr(registration.stamp_duty))}
              ${dKV('SRO Office',         registration.sro_office || '—')}
            </div>` : noRecord('Registration Deed')}
          </div>
        </div>

        <!-- Tax -->
        <div id="dtab-2" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">🏛️ Property Tax (BBMP / Municipal Revenue)</span>
            ${tax ? `<span class="badge ${tax.status==='PAID'?'badge-green':'badge-red'}">${tax.status}</span>` : ''}
          </div>
          <div class="card-body">
            ${tax ? `<div class="dept-kv-grid">
              ${dKV('Assessment No.',     tax.assessment_no)}
              ${dKV('Annual Value',       fmt.inr(tax.annual_value))}
              ${dKV('Tax Amount',         fmt.inr(tax.tax_amount))}
              ${dKV('Payment Status',     tax.status)}
              ${dKV('Last Paid',          fmt.date(tax.last_paid_date))}
              ${dKV('Arrears',            tax.arrears > 0 ? `⚠️ ${fmt.inr(tax.arrears)}` : '✅ None')}
            </div>` : noRecord('Property Tax')}
          </div>
        </div>

        <!-- Encumbrance -->
        <div id="dtab-3" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">🏦 Encumbrance Certificate / Mortgage (CERSAI)</span>
            <span class="badge ${encumbrance ? 'badge-orange' : 'badge-green'}">${encumbrance ? 'Mortgaged' : 'Clear Title'}</span>
          </div>
          <div class="card-body">
            ${encumbrance ? `<div class="dept-kv-grid">
              ${dKV('Bank / Lender',      encumbrance.bank_name)}
              ${dKV('Loan Amount',        fmt.inr(encumbrance.loan_amount))}
              ${dKV('Status',             encumbrance.status)}
              ${dKV('Mortgaged On',       fmt.date(encumbrance.mortgaged_date))}
              ${dKV('Loan End Date',      fmt.date(encumbrance.loan_end_date))}
              ${dKV('CERSAI ID',          encumbrance.cersai_id || '—')}
            </div>` : `
            <div class="empty-state" style="padding:28px">
              <div class="empty-icon">✅</div>
              <h4 style="color:var(--green)">Clear Title — No Encumbrances</h4>
              <p>No mortgage, lien, or bank charge found for this parcel.</p>
            </div>`}
          </div>
        </div>

        <!-- Land Use -->
        <div id="dtab-4" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">🗺️ Land Use & Master Plan Zoning (BDA / BBMP)</span>
            ${land_use ? `<span class="badge badge-purple">${land_use.zone_type}</span>` : ''}
          </div>
          <div class="card-body">
            ${land_use ? `<div class="dept-kv-grid">
              ${dKV('Zone Type',          land_use.zone_type)}
              ${dKV('Current Use',        land_use.current_use)}
              ${dKV('Change Requested',   land_use.change_requested ? '⚠️ Yes' : '✅ No')}
              ${dKV('Master Plan Year',   land_use.plan_year || '—')}
              ${dKV('Conversion Order',   land_use.conversion_order || 'None')}
            </div>` : noRecord('Land Use')}
          </div>
        </div>

        <!-- Building Permit -->
        <div id="dtab-5" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">🏗️ Building Permits (BBMP / BDA / Municipal)</span>
          </div>
          <div class="card-body">
            ${building_permit ? `<div class="dept-kv-grid">
              ${dKV('Permit No.',         building_permit.permit_no || '—')}
              ${dKV('Status',             building_permit.approval_status || '—')}
              ${dKV('Construction Type',  building_permit.construction_type || '—')}
              ${dKV('Floors Sanctioned',  building_permit.floors_sanctioned || '—')}
              ${dKV('Issue Date',         fmt.date(building_permit.issue_date))}
              ${dKV('Validity',           fmt.date(building_permit.valid_until))}
            </div>` : `
            <div class="empty-state" style="padding:28px">
              <div class="empty-icon">🏗️</div>
              <h4>No Building Permits</h4>
              <p>No permit records found for this parcel.</p>
            </div>`}
          </div>
        </div>

        <!-- Court Cases -->
        <div id="dtab-6" class="dept-tab-content card">
          <div class="card-header">
            <span class="card-title">⚖️ Court Cases & Litigations (e-Courts)</span>
            <span class="badge ${court_cases.length ? 'badge-red' : 'badge-green'}">
              ${court_cases.length ? court_cases.length+' Active' : 'No Litigation'}
            </span>
          </div>
          <div class="card-body">
            ${court_cases.length ? `
            <table class="data-table">
              <thead><tr><th>Case No.</th><th>Type</th><th>Court</th><th>Status</th><th>Filed</th></tr></thead>
              <tbody>${court_cases.map(c => `
                <tr>
                  <td class="td-mono">${c.case_no||'—'}</td>
                  <td>${c.case_type||'—'}</td>
                  <td>${c.court_name||'—'}</td>
                  <td><span class="badge badge-red">${c.status||'—'}</span></td>
                  <td>${fmt.date(c.filing_date)}</td>
                </tr>`).join('')}
              </tbody>
            </table>` : `
            <div class="empty-state" style="padding:28px">
              <div class="empty-icon">⚖️</div>
              <h4 style="color:var(--green)">No Court Cases</h4>
              <p>This parcel has no litigation or legal stay orders.</p>
            </div>`}
          </div>
        </div>
      </div><!-- /right -->
    </div><!-- /profile-grid -->
  `;

  // Animate anomaly bar
  setTimeout(() => {
    const fill = $('#anomaly-fill');
    if (fill) fill.style.width = score + '%';
  }, 100);
}

function kvRow(k, v) {
  return `<div class="parcel-meta-row"><span class="meta-key">${k}</span><span class="meta-val">${v||'—'}</span></div>`;
}
function dKV(k, v) {
  return `<div class="kv-item"><div class="kv-key">${k}</div><div class="kv-val">${v||'—'}</div></div>`;
}
function noRecord(label) {
  return `<div class="empty-state" style="padding:24px"><div class="empty-icon">📭</div><h4>No ${label} Record</h4><p>This department has no record for this parcel.</p></div>`;
}

// Tab switcher
const TABS = ['dtab-0','dtab-1','dtab-2','dtab-3','dtab-4','dtab-5','dtab-6'];
function switchTab(btn) {
  $$('.dept-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const idx = +btn.dataset.tab;
  TABS.forEach((id,i) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', i===idx);
  });
}

/* ═══════════════════════════════════════════════════════════════
   ALERTS PAGE
═══════════════════════════════════════════════════════════════ */
function loadAlerts() {
  $('#all-alerts-list').innerHTML = MOCK.alerts.map(a => `
    <div class="alert-item ${a.type}" style="margin-bottom:10px;border-radius:var(--radius-sm);cursor:pointer"
         onclick="openProfile('${a.title.match(/UL\d+/)?.[0]||''}')">
      <span class="alert-icon">${a.icon}</span>
      <div class="alert-text">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
      </div>
      <span class="alert-time">${a.time}</span>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════════════════════
   REPORTS PAGE — Area Analysis
═══════════════════════════════════════════════════════════════ */
async function loadReports() {
  const container = $('#reports-content');
  if (!state.backendOnline) {
    container.innerHTML = `
      <div class="empty-state" style="padding:60px">
        <div class="empty-icon">📈</div>
        <h4>Reports require live backend</h4>
        <p>Start the FastAPI server at <code style="background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px">http://localhost:8000</code> to load area analysis reports.</p>
        <button onclick="location.reload()" class="btn-search" style="margin-top:16px">Retry Connection</button>
      </div>`;
    return;
  }
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div> Running area analysis on all parcels…</div>`;
  try {
    const ulpins = state.parcels.length ? state.parcels.map(p=>p.ulpin) : ['UL001','UL002','UL003','UL004','UL005','UL006'];
    const data = await API.analyzeArea(ulpins);
    renderReports(data);
  } catch(err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><h4>Analysis failed</h4><p>${err.message}</p></div>`;
  }
}

function renderReports(data) {
  const agg = data.aggregate || {};
  $('#reports-content').innerHTML = `
    <div class="stats-grid" style="margin-bottom:24px">
      ${reportStat('📐','Total GIS Area', agg.total_gis_area_acres ? agg.total_gis_area_acres.toFixed(2)+' acres':'—','gold')}
      ${reportStat('📋','Total Doc Area', agg.total_document_area_acres ? agg.total_document_area_acres.toFixed(2)+' acres':'—','blue')}
      ${reportStat('⚠️','Area Discrepancy', agg.total_discrepancy_acres ? agg.total_discrepancy_acres.toFixed(2)+' ac':'—','orange')}
      ${reportStat('⚖️','Court Disputes', agg.disputed_parcel_count ?? '—','red')}
      ${reportStat('🏦','Encumbered', agg.encumbered_count ?? '—','purple')}
      ${reportStat('🏛️','Tax Defaulters', agg.tax_default_count ?? '—','red')}
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">📊 Parcel-by-Parcel Analysis</span>
        <span class="badge badge-green">Live from /api/area-analysis/by-ulpins</span>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>ULPIN</th><th>Owner</th><th>Risk Score</th><th>GIS Area</th><th>Land Type</th><th>Status</th></tr></thead>
          <tbody>
            ${(data.parcels||[]).map(p => `
              <tr>
                <td class="td-mono clickable" onclick="openProfile('${p.ulpin}')">${p.ulpin}</td>
                <td class="td-bold">${p.parcel?.owner_name||'—'}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:60px;height:6px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden">
                      <div style="width:${p.anomaly_score||0}%;height:100%;background:${(p.anomaly_score||0)<30?'var(--green)':(p.anomaly_score||0)<70?'var(--orange)':'var(--red)'};border-radius:99px"></div>
                    </div>
                    <span style="font-size:13px;font-weight:600">${p.anomaly_score||0}</span>
                  </div>
                </td>
                <td>${p.parcel?.area_sqm ? (p.parcel.area_sqm/4047).toFixed(3)+' ac' : '—'}</td>
                <td><span class="badge badge-blue">${p.parcel?.land_type||'—'}</span></td>
                <td><button class="link-btn" onclick="openProfile('${p.ulpin}')">Full Profile →</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function reportStat(icon, label, val, color) {
  return `
    <div class="stat-card">
      <div class="stat-top"><span class="stat-label">${label}</span><div class="stat-icon ${color}">${icon}</div></div>
      <div class="stat-value text-${color}">${val}</div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL SEARCH (Topbar)
═══════════════════════════════════════════════════════════════ */
function initGlobalSearch() {
  $('#global-search-btn').addEventListener('click', doGlobalSearch);
  $('#global-search').addEventListener('keydown', e => { if(e.key==='Enter') doGlobalSearch(); });
}

function doGlobalSearch() {
  const q = $('#global-search').value.trim().toUpperCase();
  if (q.match(/^UL\d+/)) {
    openProfile(q);
  } else {
    navigateTo('search');
    setTimeout(() => {
      $('#search-parcels-input').value = $('#global-search').value;
      $('#search-parcels-input').dispatchEvent(new Event('input'));
    }, 60);
  }
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function showToast(msg, type='info') {
  const c = { info:'var(--blue)', error:'var(--red)', success:'var(--green)', warn:'var(--orange)' };
  const el = Object.assign(document.createElement('div'), { textContent: msg });
  Object.assign(el.style, {
    position:'fixed', bottom:'24px', right:'24px', zIndex:'9999',
    background:'var(--bg-secondary)', border:`1px solid ${c[type]}`,
    borderLeft:`4px solid ${c[type]}`, padding:'14px 20px',
    borderRadius:'var(--radius-sm)', fontSize:'14px',
    color:'var(--text-primary)', boxShadow:'var(--shadow-card)',
    animation:'fadeUp 0.3s ease', maxWidth:'360px',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await detectBackend();
  initLogin();
  initNav();
  initGlobalSearch();

  // Auto-restore session if backend is online and token exists
  const saved = API.getToken();
  if (saved && state.backendOnline) {
    try {
      const user = await API.me();
      showApp(user);
      return;
    } catch { API.clearToken(); }
  }
  showLogin();
});
