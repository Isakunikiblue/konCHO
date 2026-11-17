/**
 * =========================================================================
 * konCHO - Client Side JavaScript Controller
 * Unified Card Case List View, Left Sidebar Controls, Status Transitions,
 * In Progress Note Modal, Closed Note & Closed-By User Modal.
 * =========================================================================
 */

(function() {
  'use strict';

  // Application State
  var state = {
    isGasEnvironment: typeof google !== 'undefined' && google.script && google.script.run,
    // Google Apps Script Web App Deployment URL (digunakan saat di-deploy ke Vercel / GitHub)
    gasApiUrl: 'https://script.google.com/macros/s/AKfycbxXTAY8AeF3VyvSgFWgUEMsYMbXBimb8VUZQAns0EGue4F-rgah_0tenQpyaS4V8TFFRw/exec',
    records: [],
    logs: [],
    mobileHeaders: [],
    fixedHeaders: [],
    activeServiceScope: 'ALL',      // 'ALL' | 'MOBILE' | 'FIXED'
    activeMonthFilter: 'all',   // Default aktif: 'all'
    activeStatusFilter: 'all',      // 'all' | 'Open' | 'InProgress' | 'Closed'
    currentView: 'home',            // 'home' | 'detail' (Default: 'home')
    searchQuery: '',
    currentActionTicket: null,      // Tiket yang sedang ditargetkan oleh modal
    dataSource: 'live',             // 'live' | 'simulation'
    theme: localStorage.getItem('koncho_theme') || 'dark',
    defaultAuthor: localStorage.getItem('koncho_pic_name') || '',
    facilitatorRouting: null
  };

  // DOM Elements Cache
  var dom = {
    // Top Bar
    btnRefresh: document.getElementById('btnRefresh'),
    btnToggleTheme: document.getElementById('btnToggleTheme'),
    themeIcon: document.getElementById('themeIcon'),
    
    btnOpenNewModal: document.getElementById('btnOpenNewModal'),

    // Sidebar Kiri: Navigasi Home
    navHome: document.getElementById('navHome'),
    sidebarNavBtns: document.querySelectorAll('.sidebar-nav-btn[data-service]'),
    monthFilterSelect: document.getElementById('monthFilterSelect'),
    kpiNavBtns: document.querySelectorAll('.kpi-nav-btn'),
    countTotal: document.getElementById('countTotal'),
    countOpen: document.getElementById('countOpen'),
    countInProgress: document.getElementById('countInProgress'),
    countClosed: document.getElementById('countClosed'),

    // Area Utama Kanan
    btnViewHome: document.getElementById('btnViewHome'),
    btnViewDetail: document.getElementById('btnViewDetail'),
    searchInput: document.getElementById('searchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    activeScopeLabel: document.getElementById('activeScopeLabel'),
    caseListContainer: document.getElementById('caseListContainer'),
    caseCountBadge: document.getElementById('caseCountBadge'),
    footerSummaryText: document.getElementById('footerSummaryText'),

    // Modal In Progress
    modalInProgress: document.getElementById('modalInProgress'),
    btnCloseInProgressModal: document.getElementById('btnCloseInProgressModal'),
    btnCancelInProgress: document.getElementById('btnCancelInProgress'),
    btnSubmitInProgress: document.getElementById('btnSubmitInProgress'),
    inProgressModalTitle: document.getElementById('inProgressModalTitle'),
    inProgressBadgeService: document.getElementById('inProgressBadgeService'),
    inProgressTicketId: document.getElementById('inProgressTicketId'),
    inProgressRequestor: document.getElementById('inProgressRequestor'),
    inProgressIssueText: document.getElementById('inProgressIssueText'),
    inProgressMessage: document.getElementById('inProgressMessage'),
    inProgressAuthor: document.getElementById('inProgressAuthor'),
    inProgressFollowUp: document.getElementById('inProgressFollowUp'),

    // Modal Closed
    modalClosed: document.getElementById('modalClosed'),
    btnCloseClosedModal: document.getElementById('btnCloseClosedModal'),
    btnCancelClosed: document.getElementById('btnCancelClosed'),
    btnSubmitClosed: document.getElementById('btnSubmitClosed'),
    closedModalTitle: document.getElementById('closedModalTitle'),
    closedBadgeService: document.getElementById('closedBadgeService'),
    closedTicketId: document.getElementById('closedTicketId'),
    closedRequestor: document.getElementById('closedRequestor'),
    closedIssueText: document.getElementById('closedIssueText'),
    closedMessage: document.getElementById('closedMessage'),
    closedByUser: document.getElementById('closedByUser'),
    closedFollowUp: document.getElementById('closedFollowUp'),

    // Modal Log Komunikasi
    modalLog: document.getElementById('modalLog'),
    btnCloseLogModal: document.getElementById('btnCloseLogModal'),
    btnCloseLogFooter: document.getElementById('btnCloseLogFooter'),
    logModalTitle: document.getElementById('logModalTitle'),
    logDetailIssue: document.getElementById('logDetailIssue'),
    logDetailReq: document.getElementById('logDetailReq'),
    logDetailFollowUp: document.getElementById('logDetailFollowUp'),
    logDetailService: document.getElementById('logDetailService'),
    logDetailStatus: document.getElementById('logDetailStatus'),
    logTimelineContainer: document.getElementById('logTimelineContainer'),
    logQuickAuthor: document.getElementById('logQuickAuthor'),
    logQuickMessage: document.getElementById('logQuickMessage'),
    btnSubmitQuickLog: document.getElementById('btnSubmitQuickLog'),

    // Modal Input Baru
    newDataModal: document.getElementById('newDataModal'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnCancelModal: document.getElementById('btnCancelModal'),
    btnSubmitNewReport: document.getElementById('btnSubmitNewReport'),
    toggleMobile: document.getElementById('toggleMobile'),
    toggleFixed: document.getElementById('toggleFixed'),
    toggleEcare: document.getElementById('toggleEcare'),
    togglePriority: document.getElementById('togglePriority'),
    inputTanggalAgenda: document.getElementById('inputTanggalAgenda'),
    inputBulanTahun: document.getElementById('inputBulanTahun'),
    inputCaseIssue: document.getElementById('inputCaseIssue'),
    inputRequestor: document.getElementById('inputRequestor'),
    inputStatus: document.getElementById('inputStatus'),
    inputProgressQuickWin: document.getElementById('inputProgressQuickWin'),
    inputDetail: document.getElementById('inputDetail'),
    inputNeedSupport: document.getElementById('inputNeedSupport'),
    inputFollowUp: document.getElementById('inputFollowUp'),
    lblNomorLayanan: document.getElementById('lblNomorLayanan'),
    lblWilayah: document.getElementById('lblWilayah'),
    inputNomorLayanan: document.getElementById('inputNomorLayanan'),
    inputNamaPelanggan: document.getElementById('inputNamaPelanggan'),
    inputWilayah: document.getElementById('inputWilayah'),
    newCasePptFile: document.getElementById('newCasePptFile'),

    // Modal Upload PPT
    modalUploadPpt: document.getElementById('modalUploadPpt'),
    uploadPptModalTitle: document.getElementById('uploadPptModalTitle'),
    uploadPptTicketId: document.getElementById('uploadPptTicketId'),
    uploadPptBadgeService: document.getElementById('uploadPptBadgeService'),
    uploadPptIssueText: document.getElementById('uploadPptIssueText'),
    btnCloseUploadPptModal: document.getElementById('btnCloseUploadPptModal'),
    btnCancelUploadPpt: document.getElementById('btnCancelUploadPpt'),
    btnSubmitUploadPpt: document.getElementById('btnSubmitUploadPpt'),
    pptFileInput: document.getElementById('pptFileInput'),
    btnBrowsePptFile: document.getElementById('btnBrowsePptFile'),
    pptDropzone: document.getElementById('pptDropzone'),
    dropzoneEmpty: document.getElementById('dropzoneEmpty'),
    dropzoneSelected: document.getElementById('dropzoneSelected'),
    selectedPptFileName: document.getElementById('selectedPptFileName'),
    selectedPptFileSize: document.getElementById('selectedPptFileSize'),
    btnRemovePptFile: document.getElementById('btnRemovePptFile'),
    existingPptContainer: document.getElementById('existingPptContainer'),
    existingPptLink: document.getElementById('existingPptLink'),
    btnModalDeletePpt: document.getElementById('btnModalDeletePpt'),
    uploadPptProgress: document.getElementById('uploadPptProgress'),
    uploadPptStatusText: document.getElementById('uploadPptStatusText'),
    uploadPptPercent: document.getElementById('uploadPptPercent'),
    uploadPptBar: document.getElementById('uploadPptBar'),

    // Modal Reschedule Date (Facilitator / Admin)
    modalRescheduleDate: document.getElementById('modalRescheduleDate'),
    btnCloseRescheduleModal: document.getElementById('btnCloseRescheduleModal'),
    btnCancelRescheduleModal: document.getElementById('btnCancelRescheduleModal'),
    btnSubmitReschedule: document.getElementById('btnSubmitReschedule'),
    rescheduleModalTitle: document.getElementById('rescheduleModalTitle'),
    rescheduleBadgeService: document.getElementById('rescheduleBadgeService'),
    rescheduleTicketId: document.getElementById('rescheduleTicketId'),
    rescheduleStatusBadge: document.getElementById('rescheduleStatusBadge'),
    rescheduleIssueText: document.getElementById('rescheduleIssueText'),
    rescheduleTglInputVal: document.getElementById('rescheduleTglInputVal'),
    rescheduleInputerVal: document.getElementById('rescheduleInputerVal'),
    rescheduleTglCurrentVal: document.getElementById('rescheduleTglCurrentVal'),
    inputRescheduleNewDate: document.getElementById('inputRescheduleNewDate'),
    inputRescheduleReason: document.getElementById('inputRescheduleReason'),
    inputReschedulePic: document.getElementById('inputReschedulePic'),
    rescheduleHistorySection: document.getElementById('rescheduleHistorySection'),
    rescheduleHistoryList: document.getElementById('rescheduleHistoryList'),

    // Urgency Case
    inputUrgency: document.getElementById('inputUrgency'),

    // Day Drawer Add Case
    btnDrawerAddCaseSameDay: document.getElementById('btn-drawer-add-case-same-day'),

    // Routing Management Tabs
    tabBtnUsers: document.getElementById('tabBtnUsers'),
    tabBtnRouting: document.getElementById('tabBtnRouting'),
    tabContentUsers: document.getElementById('tabContentUsers'),
    tabContentRouting: document.getElementById('tabContentRouting'),
    routingTableBody: document.getElementById('routingTableBody'),
    btnSaveRouting: document.getElementById('btnSaveRouting'),
    btnResetRoutingDefault: document.getElementById('btnResetRoutingDefault'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  var selectedNewService = 'MOBILE';
  var selectedRole = 'Administrator';

  /**
   * =========================================================================
   * OTENTIKASI & HALAMAN LOGIN (SESSION MANAGEMENT DENGAN 3 ROLE)
   * Role 1: Administrator (Akses Penuh: admin_koncho / koncho123)
   * Role 2: Facilitator (Bisa Update Status s/d Closed: facilitator_cho / koncho123)
   * Role 3: Inputer (Hanya Bisa Input Data, Tidak Bisa Edit: inputer_cho / koncho123)
   * =========================================================================
   */
  function initAuth() {
    var savedUser = localStorage.getItem('koncho_auth_user');
    if (savedUser) {
      try {
        state.authUser = JSON.parse(savedUser);
      } catch (e) {
        state.authUser = { name: 'Administrator Utama', username: savedUser, role: 'Administrator' };
      }

      // Sinkronkan selalu dengan database akun pengguna terbaru untuk memastikan Role dan Nama Lengkap akurat
      if (state.authUser) {
        var accounts = getStoredUserAccounts();
        var cleanLookup = (state.authUser.username || state.authUser.name || '').replace(/^@+/, '').trim().toLowerCase();
        var matchedAcc = accounts.find(function(a) {
          return (a.username || '').replace(/^@+/, '').trim().toLowerCase() === cleanLookup;
        });
        if (matchedAcc) {
          state.authUser.name = matchedAcc.name || matchedAcc.username;
          state.authUser.username = matchedAcc.username;
          state.authUser.role = matchedAcc.role || 'Inputer';
          state.authUser.site = matchedAcc.site || '';
          try {
            localStorage.setItem('koncho_auth_user', JSON.stringify(state.authUser));
          } catch(err) {}
        }
      }

      showDashboardApp();
    } else {
      showLoginScreen();
    }
  }

  // =========================================================================
  // SISTEM KELOLA PENGGUNA (USER MANAGEMENT) - KHUSUS ROLE ADMINISTRATOR
  // =========================================================================
  var DEFAULT_USER_ACCOUNTS = [
    {
      username: 'admin_koncho',
      name: 'Administrator Utama',
      role: 'Administrator',
      password: 'koncho123',
      createdAt: '2026-10-01'
    },
    {
      username: '123galih',
      name: 'Galih',
      role: 'Facilitator',
      password: 'koncho123',
      createdAt: '2026-11-16'
    },
    {
      username: '234reza',
      name: 'Reza',
      role: 'Facilitator',
      password: 'koncho123',
      createdAt: '2026-11-16'
    }
  ];

  // =========================================================================
  // ALUR FLAGGING ROLE FASILITATOR BERDASARKAN SITE REQUESTOR
  // =========================================================================
  var DEFAULT_FACILITATOR_ROUTING = [
    { site: 'CHO Fixed CC Bandung', unit: 'CHO Fixed', serviceType: 'FIXED', facilitator: 'Galih' },
    { site: 'CHO Fixed CC Semarang', unit: 'CHO Fixed', serviceType: 'FIXED', facilitator: 'Reza' },
    { site: 'CHO Mobile CC Bandung', unit: 'CHO Mobile', serviceType: 'MOBILE', facilitator: 'Galih' },
    { site: 'CHO Mobile CC Semarang', unit: 'CHO Mobile', serviceType: 'MOBILE', facilitator: 'Reza' },
    { site: 'CHO E Care', unit: 'CHO eCare', serviceType: 'ECARE', facilitator: 'Ajun' },
    { site: 'CHO Priority Semarang', unit: 'CHO Priority', serviceType: 'PRIORITY', facilitator: 'Yurina' },
    { site: 'CHO Priority Bandung', unit: 'CHO Priority', serviceType: 'PRIORITY', facilitator: 'Kenny' }
  ];

  function getStoredFacilitatorRouting() {
    try {
      var saved = localStorage.getItem('koncho_facilitator_routing');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_FACILITATOR_ROUTING.map(function(r) { return Object.assign({}, r); });
  }

  function saveStoredFacilitatorRouting(routingList) {
    try {
      localStorage.setItem('koncho_facilitator_routing', JSON.stringify(routingList));
    } catch (e) {}
    state.facilitatorRouting = routingList;
  }

  function getFacilitatorForRequestor(requestorName, routingList) {
    var list = routingList || state.facilitatorRouting || getStoredFacilitatorRouting();
    var req = String(requestorName || '').toLowerCase().trim();
    if (!req) return 'Galih';

    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      var siteNorm = String(entry.site || '').toLowerCase().trim();
      if (siteNorm === req || req.indexOf(siteNorm) >= 0 || siteNorm.indexOf(req) >= 0) {
        return entry.facilitator;
      }
    }

    if (req.includes('fixed') && req.includes('bandung')) return 'Galih';
    if (req.includes('fixed') && req.includes('semarang')) return 'Reza';
    if (req.includes('mobile') && req.includes('bandung')) return 'Galih';
    if (req.includes('mobile') && req.includes('semarang')) return 'Reza';
    if (req.includes('ecare') || req.includes('e care') || req.includes('e-care')) return 'Ajun';
    if (req.includes('priority') && req.includes('semarang')) return 'Yurina';
    if (req.includes('priority') && req.includes('bandung')) return 'Kenny';

    return 'Galih';
  }

  function getUrgencyBadgeHtml(urgency) {
    var u = String(urgency || 'Middle').trim().toLowerCase();
    if (u === 'high' || u === 'tinggi') {
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold badge-urgency-high" title="Tingkat Urgensi: High"><span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span>High</span>';
    }
    if (u === 'low' || u === 'rendah') {
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold badge-urgency-low" title="Tingkat Urgensi: Low"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Low</span>';
    }
    return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold badge-urgency-middle" title="Tingkat Urgensi: Middle"><span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>Middle</span>';
  }

  function renderRoutingTable() {
    var tbody = dom.routingTableBody || document.getElementById('routingTableBody');
    if (!tbody) return;

    var routing = state.facilitatorRouting || getStoredFacilitatorRouting();
    
    // Ambil seluruh user yang dibuat / terdaftar dengan role 'Facilitator'
    var accounts = getStoredUserAccounts();
    var facilitatorUsers = accounts.filter(function(acc) {
      return acc && (acc.role === 'Facilitator' || String(acc.role).toLowerCase() === 'facilitator');
    });

    var facilitators = [];
    facilitatorUsers.forEach(function(acc) {
      var displayName = (acc.name && acc.name.trim()) ? acc.name.trim() : (acc.username ? acc.username.trim() : '');
      if (displayName && facilitators.indexOf(displayName) === -1) {
        facilitators.push(displayName);
      }
    });

    // Masukkan fasilitator standar default jika belum ada di list
    ['Galih', 'Reza', 'Ajun', 'Yurina', 'Kenny'].forEach(function(defFac) {
      if (facilitators.indexOf(defFac) === -1) {
        facilitators.push(defFac);
      }
    });

    // Pastikan nilai fasilitator saat ini di setiap baris routing juga ada di list opsi
    routing.forEach(function(item) {
      if (item.facilitator && facilitators.indexOf(item.facilitator) === -1) {
        facilitators.push(item.facilitator);
      }
    });

    tbody.innerHTML = routing.map(function(item, idx) {
      var optionsHtml = facilitators.map(function(fac) {
        var isSelected = (item.facilitator && item.facilitator.toLowerCase() === fac.toLowerCase()) ? 'selected' : '';
        return '<option value="' + escapeHtml(fac) + '" ' + isSelected + '>' + escapeHtml(fac) + '</option>';
      }).join('');

      var uMeta = getUnitMeta(item.serviceType || item.unit);
      var unitBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold ' + uMeta.badgeClass + '">' + escapeHtml(item.unit || uMeta.label) + '</span>';

      return '<tr>' +
        '<td style="text-align:center; font-weight:700; color:#64748b;">' + (idx + 1) + '</td>' +
        '<td><strong class="text-slate-800">' + escapeHtml(item.site) + '</strong></td>' +
        '<td>' + unitBadge + '</td>' +
        '<td>' +
        '  <select class="routing-select" data-site-index="' + idx + '" title="Pilih Fasilitator Penanggung Jawab untuk ' + escapeHtml(item.site) + '">' +
             optionsHtml +
        '  </select>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  function handleSaveRouting() {
    var tbody = dom.routingTableBody || document.getElementById('routingTableBody');
    if (!tbody) return;

    var selects = tbody.querySelectorAll('.routing-select');
    var currentRouting = state.facilitatorRouting || getStoredFacilitatorRouting();
    var updatedRouting = [];

    selects.forEach(function(sel, idx) {
      var item = currentRouting[idx] ? Object.assign({}, currentRouting[idx]) : {};
      item.facilitator = sel.value;
      updatedRouting.push(item);
    });

    saveStoredFacilitatorRouting(updatedRouting);

    if (state.isGasEnvironment) {
      google.script.run
        .withSuccessHandler(function(res) {
          showToast('Alur routing fasilitator berhasil disimpan ke server!', 'success');
        })
        .saveFacilitatorRoutingGas(updatedRouting);
    } else if (state.gasApiUrl) {
      try {
        fetch(state.gasApiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveFacilitatorRouting', routing: updatedRouting })
        });
      } catch(e) {}
    }

    showToast('Alur Flagging Fasilitator berhasil diperbarui dan disimpan!', 'success');
  }

  function handleResetRoutingDefault() {
    var resetList = DEFAULT_FACILITATOR_ROUTING.map(function(r) { return Object.assign({}, r); });
    saveStoredFacilitatorRouting(resetList);
    renderRoutingTable();
    showToast('Alur routing dikembalikan ke standar awal.', 'info');
  }

  function switchMgmtTab(tab) {
    var btnUsers = dom.tabBtnUsers || document.getElementById('tabBtnUsers');
    var btnRouting = dom.tabBtnRouting || document.getElementById('tabBtnRouting');
    var contentUsers = dom.tabContentUsers || document.getElementById('tabContentUsers');
    var contentRouting = dom.tabContentRouting || document.getElementById('tabContentRouting');

    if (tab === 'routing') {
      if (btnUsers) btnUsers.classList.remove('active');
      if (btnRouting) btnRouting.classList.add('active');
      if (contentUsers) contentUsers.style.display = 'none';
      if (contentRouting) contentRouting.style.display = 'block';
      renderRoutingTable();
    } else {
      if (btnUsers) btnUsers.classList.add('active');
      if (btnRouting) btnRouting.classList.remove('active');
      if (contentUsers) contentUsers.style.display = 'block';
      if (contentRouting) contentRouting.style.display = 'none';
    }
  }

  // Auto-clean akun demo viewer_koncho agar tidak pernah muncul lagi
  (function ensureViewerDemoRemoved() {
    try {
      var d = JSON.parse(localStorage.getItem('koncho_deleted_users') || '[]');
      if (!Array.isArray(d)) d = [];
      if (d.indexOf('viewer_koncho') === -1) {
        d.push('viewer_koncho');
        localStorage.setItem('koncho_deleted_users', JSON.stringify(d));
      }
      var raw = localStorage.getItem('koncho_user_accounts');
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list)) {
          var filtered = list.filter(function(u) {
            return (u.username || '').replace(/^@+/, '').trim().toLowerCase() !== 'viewer_koncho';
          });
          localStorage.setItem('koncho_user_accounts', JSON.stringify(filtered));
        }
      }
    } catch(e) {}
  })();

  function getStoredUserAccounts() {
    var accounts = [];
    try {
      var raw = localStorage.getItem('koncho_user_accounts');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          accounts = parsed;
        }
      }
    } catch (e) {}

    // Bersihkan leading @ jika ada
    accounts.forEach(function(u) {
      if (u.username) u.username = u.username.replace(/^@+/, '').trim();
    });

    // Jika belum pernah tersinkron dari Google Sheet sama sekali (offline sebelum respon pertama)
    if (accounts.length === 0) {
      accounts = DEFAULT_USER_ACCOUNTS.map(function(u) { return Object.assign({}, u); });
      saveStoredUserAccounts(accounts);
    }

    return accounts;
  }

  function saveStoredUserAccounts(list) {
    try {
      localStorage.setItem('koncho_user_accounts', JSON.stringify(list));
    } catch (e) {}
  }

  // Buka Modal Kelola User (Khusus Administrator)
  function openManageUsersModal() {
    var role = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    if (role !== 'Administrator') {
      showToast('Akses ditolak: Hanya Administrator yang berwenang mengakses menu Kelola Pengguna.', 'error');
      return;
    }
    renderUserMgmtList();
    renderRoutingTable();
    switchMgmtTab('users');
    hideUserForm();
    var modal = document.getElementById('modalManageUsers');
    if (modal) modal.classList.add('active');
  }

  function closeManageUsersModal() {
    var modal = document.getElementById('modalManageUsers');
    if (modal) modal.classList.remove('active');
  }

  // Render Tabel Daftar User
  function renderUserMgmtList() {
    var tbody = document.getElementById('userMgmtTableBody');
    var countEl = document.getElementById('userCountTotal');
    if (!tbody) return;

    var users = getStoredUserAccounts();
    if (countEl) {
      countEl.textContent = 'Total: ' + users.length + ' Pengguna';
    }

    var currentUsername = (state.authUser && (state.authUser.username || state.authUser.name)) ? (state.authUser.username || state.authUser.name) : 'admin_koncho';

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#94a3b8;">Belum ada pengguna terdaftar</td></tr>';
      return;
    }

    var html = '';
    users.forEach(function(u) {
      var isCurrent = u.username.toLowerCase() === currentUsername.toLowerCase();
      var roleIcon = '🛡️';
      var roleBadgeClass = 'role-admin';
      if (u.role === 'Facilitator') {
        roleIcon = '🛠️';
        roleBadgeClass = 'role-facilitator';
      } else if (u.role === 'Inputer') {
        roleIcon = '📝';
        roleBadgeClass = 'role-inputer';
      } else if (u.role === 'Viewer') {
        roleIcon = '👁️';
        roleBadgeClass = 'role-viewer';
      }

      var isRootAdmin = u.username.toLowerCase() === 'admin_koncho';

      html += '<tr>';
      html += '  <td style="text-align: center;">';
      html += '    <div class="user-cell-avatar" style="margin: 0 auto;" title="' + escapeHtml(u.role) + '">' + roleIcon + '</div>';
      html += '  </td>';
      html += '  <td>';
      html += '    <div style="display:flex; align-items:center; gap:6px;">';
      html += '      <span class="user-cell-username">@' + escapeHtml(u.username) + '</span>';
      if (isCurrent) {
        html += '      <span class="user-tag-current">Akun Anda</span>';
      }
      html += '    </div>';
      html += '  </td>';
      html += '  <td><strong>' + escapeHtml(u.name || '-') + '</strong></td>';
      var siteBadge = '';
      var siteName = u.site || (u.name && u.name.indexOf('CHO') >= 0 ? u.name : '');
      if (siteName && siteName !== 'Semua Unit') {
        siteBadge = '<div class="user-site-tag"><span style="width:5px; height:5px; border-radius:50%; background:#0284c7; flex-shrink:0;"></span>' + escapeHtml(siteName) + '</div>';
      } else if (u.role === 'Administrator' || siteName === 'Semua Unit') {
        siteBadge = '<div class="user-site-tag" style="background:#f1f5f9; color:#475569; border-color:#e2e8f0;"><span style="width:5px; height:5px; border-radius:50%; background:#64748b; flex-shrink:0;"></span>Semua Unit</div>';
      }
      html += '  <td><div style="display:flex; flex-direction:column; align-items:flex-start; gap:2px;"><span class="badge-role ' + roleBadgeClass + '">' + roleIcon + ' ' + escapeHtml(u.role) + '</span>' + siteBadge + '</div></td>';
      html += '  <td><code style="background:var(--bg-elevated); padding:3px 8px; border-radius:6px; font-size:12px; color:var(--text-primary); border:1px solid var(--border-color);">' + escapeHtml(u.password || '••••••••') + '</code></td>';
      html += '  <td style="text-align: right; white-space: nowrap;">';
      html += '    <button type="button" class="btn-table-action btn-table-edit" onclick="editUserAccount(\'' + escapeHtml(u.username) + '\')" title="Edit Akun">';
      html += '      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      html += '      <span>Edit</span>';
      html += '    </button>';
      if (isRootAdmin || isCurrent) {
        html += '    <button type="button" class="btn-table-action btn-table-delete" disabled title="' + (isRootAdmin ? 'Admin utama tidak dapat dihapus' : 'Tidak dapat menghapus akun yang sedang aktif') + '">';
        html += '      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        html += '      <span>Hapus</span>';
        html += '    </button>';
      } else {
        html += '    <button type="button" class="btn-table-action btn-table-delete" onclick="deleteUserAccount(\'' + escapeHtml(u.username) + '\')" title="Hapus Akun">';
        html += '      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        html += '      <span>Hapus</span>';
        html += '    </button>';
      }
      html += '  </td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  function updateRoleDescHint() {
    var roleInp = document.getElementById('inpUserRole');
    var roleDescHint = document.getElementById('roleDescHint');
    var siteDescHint = document.getElementById('siteDescHint');
    if (!roleInp || !roleDescHint) return;
    var val = roleInp.value;
    if (val === 'Administrator') {
      roleDescHint.textContent = 'Administrator memiliki akses penuh ke seluruh sistem dan menu kelola user.';
      if (siteDescHint) siteDescHint.textContent = 'Pilih "Semua Unit" atau unit spesifik penanggung jawab.';
    } else if (val === 'Facilitator') {
      roleDescHint.textContent = 'Facilitator berwenang mengubah status kasus (In Progress, Closed, Reopen) dan menambah catatan log.';
      if (siteDescHint) siteDescHint.textContent = 'Site / Unit utama yang ditangani oleh fasilitator ini.';
    } else if (val === 'Inputer') {
      roleDescHint.textContent = 'Inputer berwenang menginput kasus baru sesuai Site asal yang dipilih.';
      if (siteDescHint) siteDescHint.textContent = 'Menentukan alur otomatis flagging kasus ke Fasilitator penanggung jawab saat input kasus.';
    } else if (val === 'Viewer') {
      roleDescHint.textContent = 'Viewer hanya dapat memantau dan membaca seluruh data kasus tanpa hak input maupun edit (Read-Only).';
      if (siteDescHint) siteDescHint.textContent = 'Unit atau site yang dipantau (atau Semua Unit).';
    }
  }

  // Tampilkan / Sembunyikan Form Tambah User
  function showAddUserForm() {
    var card = document.getElementById('userFormCard');
    var title = document.getElementById('userFormTitle');
    var sub = document.getElementById('userFormSub');
    var orig = document.getElementById('userEditOriginalUsername');
    var uInp = document.getElementById('inpUserUsername');
    var nameInp = document.getElementById('inpUserFullName');
    var roleInp = document.getElementById('inpUserRole');
    var siteInp = document.getElementById('inpUserSite');
    var passInp = document.getElementById('inpUserPassword');
    var lblToggle = document.getElementById('lblToggleAddUser');

    if (title) title.textContent = 'Tambah Pengguna Baru';
    if (sub) sub.textContent = 'Isi form di bawah untuk membuat kredensial akun baru (tersimpan ke Google Sheet)';
    if (orig) orig.value = '';
    if (uInp) { 
      uInp.value = ''; 
      uInp.readOnly = false;
      uInp.placeholder = 'contoh: budi_cho';
    }
    if (nameInp) nameInp.value = '';
    if (roleInp) roleInp.value = 'Facilitator';
    if (siteInp) siteInp.value = 'CHO Fixed CC Semarang';
    updateRoleDescHint();
    if (passInp) {
      passInp.value = ''; // Jangan default koncho123, diisi manual oleh user
      passInp.placeholder = 'Masukkan kata sandi...';
    }
    if (lblToggle) lblToggle.textContent = 'Tutup Form';
    if (card) {
      card.style.display = 'block';
      if (uInp) uInp.focus();
    }
  }

  function hideUserForm() {
    var card = document.getElementById('userFormCard');
    var lblToggle = document.getElementById('lblToggleAddUser');
    if (card) card.style.display = 'none';
    if (lblToggle) lblToggle.textContent = '+ Tambah Pengguna Baru';
  }

  function toggleAddUserForm() {
    var card = document.getElementById('userFormCard');
    if (card && card.style.display === 'block') {
      hideUserForm();
    } else {
      showAddUserForm();
    }
  }

  // Edit User (Role Administrator dapat edit Username & Kata Sandi)
  window.editUserAccount = function(username) {
    var cleanU = (username || '').replace(/^@+/, '').trim().toLowerCase();
    var users = getStoredUserAccounts();
    var found = users.find(function(u) { return (u.username || '').replace(/^@+/, '').trim().toLowerCase() === cleanU; });
    if (!found) {
      showToast('Pengguna tidak ditemukan!', 'error');
      return;
    }

    var card = document.getElementById('userFormCard');
    var title = document.getElementById('userFormTitle');
    var sub = document.getElementById('userFormSub');
    var orig = document.getElementById('userEditOriginalUsername');
    var uInp = document.getElementById('inpUserUsername');
    var nameInp = document.getElementById('inpUserFullName');
    var roleInp = document.getElementById('inpUserRole');
    var siteInp = document.getElementById('inpUserSite');
    var passInp = document.getElementById('inpUserPassword');
    var lblToggle = document.getElementById('lblToggleAddUser');

    if (title) title.textContent = 'Edit Pengguna: @' + found.username;
    if (sub) sub.textContent = 'Perbarui Nama Pengguna (Username), Nama Lengkap, Peran, atau Kata Sandi';
    if (orig) orig.value = found.username;
    if (uInp) {
      uInp.value = found.username;
      uInp.readOnly = false; // BISA DIEDIT OLEH ADMIN
      uInp.placeholder = 'Nama pengguna...';
    }
    if (nameInp) nameInp.value = found.name || '';
    if (roleInp) roleInp.value = found.role || 'Facilitator';
    if (siteInp) siteInp.value = found.site || (found.name && found.name.indexOf('CHO') >= 0 ? found.name : 'CHO Fixed CC Semarang');
    updateRoleDescHint();
    if (passInp) {
      passInp.value = found.password || ''; // Tampilkan kata sandi saat ini & dapat diedit manual
      passInp.placeholder = 'Masukkan kata sandi baru...';
    }
    if (lblToggle) lblToggle.textContent = 'Tutup Form Edit';
    if (card) {
      card.style.display = 'block';
      if (uInp) uInp.focus();
    }
  };

  // Simpan Pengguna (Create / Update) & Sinkronkan ke Google Sheet
  function handleSaveUserAccount(e) {
    if (e && e.preventDefault) e.preventDefault();
    var orig = (document.getElementById('userEditOriginalUsername') ? document.getElementById('userEditOriginalUsername').value : '').trim().replace(/^@+/, '');
    var username = (document.getElementById('inpUserUsername') ? document.getElementById('inpUserUsername').value : '').trim().replace(/^@+/, '');
    var name = (document.getElementById('inpUserFullName') ? document.getElementById('inpUserFullName').value : '').trim();
    var role = (document.getElementById('inpUserRole') ? document.getElementById('inpUserRole').value : 'Facilitator').trim();
    var siteInp = document.getElementById('inpUserSite');
    var site = siteInp ? siteInp.value : 'CHO Fixed CC Semarang';
    var password = (document.getElementById('inpUserPassword') ? document.getElementById('inpUserPassword').value : '').trim();

    if (!username) {
      showToast('Harap masukkan Nama Pengguna (Username)!', 'warning');
      var uEl = document.getElementById('inpUserUsername');
      if (uEl) uEl.focus();
      return;
    }
    if (!name) {
      showToast('Harap masukkan Nama Lengkap!', 'warning');
      var nEl = document.getElementById('inpUserFullName');
      if (nEl) nEl.focus();
      return;
    }
    if (!password) {
      showToast('Harap isi Kata Sandi (Password)! Jangan dikosongkan.', 'warning');
      var pEl = document.getElementById('inpUserPassword');
      if (pEl) pEl.focus();
      return;
    }

    var users = getStoredUserAccounts();

    if (orig) {
      // Mode Edit
      var idx = users.findIndex(function(u) { return (u.username || '').replace(/^@+/, '').trim().toLowerCase() === orig.toLowerCase(); });
      if (idx !== -1) {
        // Cek jika username diubah, jangan sampai bentrok dengan akun lain
        if (username.toLowerCase() !== orig.toLowerCase()) {
          var conflict = users.some(function(u, i) {
            return i !== idx && (u.username || '').replace(/^@+/, '').trim().toLowerCase() === username.toLowerCase();
          });
          if (conflict) {
            showToast('Username @' + username + ' sudah digunakan akun lain! Harap pilih username berbeda.', 'error');
            return;
          }
        }

        users[idx].username = username;
        users[idx].name = name;
        users[idx].role = role;
        users[idx].site = site;
        users[idx].password = password;
        users[idx].updatedAt = new Date().toISOString();
        saveStoredUserAccounts(users);

        // Sinkronisasi pembaruan ke Google Spreadsheet
        syncUserToGoogleSheet({
          origUsername: orig,
          username: username,
          name: name,
          role: role,
          site: site,
          password: password
        });

        showToast('Akun @' + username + ' berhasil diperbarui dan tersimpan ke Google Sheet!', 'success');

        // Jika mengedit akun yang sedang login, update sesi langsung
        if (state.authUser && (
          (state.authUser.username || '').replace(/^@+/, '').toLowerCase() === orig.toLowerCase() ||
          (state.authUser.username || '').replace(/^@+/, '').toLowerCase() === username.toLowerCase() ||
          (state.authUser.name || '').toLowerCase() === orig.toLowerCase()
        )) {
          state.authUser.username = username;
          state.authUser.name = name;
          state.authUser.role = role;
          state.authUser.site = site;
          try { localStorage.setItem('koncho_auth_user', JSON.stringify(state.authUser)); } catch(err){}
          applyRolePermissions();
    if (typeof checkFacilitatorNotifications === 'function') checkFacilitatorNotifications();
        }
      }
    } else {
      // Mode Create Baru
      var exists = users.some(function(u) { return (u.username || '').replace(/^@+/, '').trim().toLowerCase() === username.toLowerCase(); });
      if (exists) {
        showToast('Username @' + username + ' sudah digunakan! Gunakan username lain.', 'error');
        return;
      }

      var newUser = {
        username: username,
        name: name,
        role: role,
        site: site,
        password: password,
        createdAt: new Date().toISOString().split('T')[0]
      };
      users.push(newUser);
      saveStoredUserAccounts(users);

      // Sinkronisasi akun baru ke Google Spreadsheet
      syncUserToGoogleSheet({
        username: username,
        name: name,
        role: role,
        site: site,
        password: password
      });

      showToast('Pengguna baru @' + username + ' (' + role + ') berhasil ditambahkan dan tersimpan ke Google Sheet!', 'success');
    }

    hideUserForm();
    renderUserMgmtList();
    renderRoutingTable();
  }

  // Hapus Pengguna (Delete) & Sinkronkan ke Google Sheet
  window.deleteUserAccount = function(username) {
    var cleanU = (username || '').replace(/^@+/, '').trim().toLowerCase();
    if (cleanU === 'admin_koncho') {
      showToast('Akun admin_koncho adalah Administrator Utama dan tidak boleh dihapus!', 'warning');
      return;
    }
    var currentUsername = (state.authUser && (state.authUser.username || state.authUser.name)) ? (state.authUser.username || state.authUser.name).replace(/^@+/, '').trim().toLowerCase() : '';
    if (cleanU === currentUsername) {
      showToast('Anda tidak dapat menghapus akun yang sedang aktif digunakan!', 'warning');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus akun @' + cleanU + '? Pengguna ini tidak akan dapat login lagi.')) {
      // Catat ke daftar pengguna yang dihapus agar tidak pernah dibangkitkan lagi
      try {
        var deleted = JSON.parse(localStorage.getItem('koncho_deleted_users') || '[]');
        if (!Array.isArray(deleted)) deleted = [];
        if (deleted.indexOf(cleanU) === -1) deleted.push(cleanU);
        localStorage.setItem('koncho_deleted_users', JSON.stringify(deleted));
      } catch (e) {}

      var users = getStoredUserAccounts();
      users = users.filter(function(u) { return (u.username || '').replace(/^@+/, '').trim().toLowerCase() !== cleanU; });
      saveStoredUserAccounts(users);
      
      // Hapus dari Google Spreadsheet
      deleteUserFromGoogleSheet(cleanU);

      showToast('Akun @' + cleanU + ' berhasil dihapus dari sistem dan Google Sheet.', 'info');
      renderUserMgmtList();
      renderRoutingTable();
    }
  };

  // Sinkronisasi Akun Pengguna ke Google Spreadsheet (Sheet Users)
  function syncUserToGoogleSheet(userPayload) {
    // 1. GAS Native Environment
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(function(res) {
          console.log('Google Sheets user sync response:', res);
        })
        .withFailureHandler(function(err) {
          console.warn('Google Sheets user sync failed:', err);
        })
        .saveUserAccount(userPayload);
    }

    // 2. Vercel / External Web App POST
    if (state.gasApiUrl) {
      try {
        fetch(state.gasApiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveUserAccount', data: userPayload })
        });
      } catch (err) {
        console.warn('Fetch saveUserAccount error:', err);
      }
    }
  }

  // Hapus Akun Pengguna dari Google Spreadsheet
  function deleteUserFromGoogleSheet(username) {
    // 1. GAS Native Environment
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(function(res) {
          console.log('Google Sheets user delete response:', res);
        })
        .withFailureHandler(function(err) {
          console.warn('Google Sheets user delete failed:', err);
        })
        .deleteUserAccount(username);
    }

    // 2. Vercel / External Web App POST
    if (state.gasApiUrl) {
      try {
        fetch(state.gasApiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteUserAccount', data: { username: username } })
        });
      } catch (err) {
        console.warn('Fetch deleteUserAccount error:', err);
      }
    }
  }

  // Sinkronisasi data pengguna dari Google Sheet ke localStorage
  function syncStoredUsersFromSheet(remoteUsers) {
    if (!remoteUsers || !Array.isArray(remoteUsers) || remoteUsers.length === 0) return;

    // Google Sheet sheet 'Users' adalah SUMBER KEBENARAN TUNGGAL (Single Source of Truth)
    var cleanRemoteUsers = remoteUsers.map(function(rem) {
      var cleanU = (rem.username || '').replace(/^@+/, '').trim();
      var siteVal = rem.site || '';
      if (!siteVal) {
        var norm = (rem.name || cleanU).toLowerCase();
        if (norm.includes('fixed') && norm.includes('bandung')) siteVal = 'CHO Fixed CC Bandung';
        else if (norm.includes('fixed') && norm.includes('semarang')) siteVal = 'CHO Fixed CC Semarang';
        else if (norm.includes('mobile') && norm.includes('bandung')) siteVal = 'CHO Mobile CC Bandung';
        else if (norm.includes('mobile') && norm.includes('semarang')) siteVal = 'CHO Mobile CC Semarang';
        else if (norm.includes('ecare')) siteVal = 'CHO eCare';
        else if (norm.includes('priority')) siteVal = 'CHO Priority';
        else if (rem.name && rem.name.indexOf('CHO') >= 0) siteVal = rem.name;
      }
      return {
        username: cleanU,
        name: rem.name || cleanU,
        role: rem.role || 'Inputer',
        site: siteVal,
        password: rem.password || '',
        updatedAt: rem.updatedAt || new Date().toISOString()
      };
    });

    // Simpan daftar akun pengguna persis seperti yang ada di Google Sheet Users
    saveStoredUserAccounts(cleanRemoteUsers);
    if (typeof renderUserMgmtList === 'function') renderUserMgmtList();

    // Verifikasi sesi pengguna yang sedang login
    if (state.authUser) {
      var curU = (state.authUser.username || '').replace(/^@+/, '').trim().toLowerCase();
      var myAcc = cleanRemoteUsers.find(function(a) {
        return (a.username || '').replace(/^@+/, '').trim().toLowerCase() === curU;
      });
      if (myAcc) {
        state.authUser.name = myAcc.name;
        state.authUser.role = myAcc.role;
        state.authUser.username = myAcc.username;
        if (myAcc.site) state.authUser.site = myAcc.site;
        try { localStorage.setItem('koncho_auth_user', JSON.stringify(state.authUser)); } catch(e){}
        applyRolePermissions();
      } else {
        // Akun ini telah dihapus dari Google Sheet Users!
        showToast('Akun Anda telah dinonaktifkan atau dihapus dari Google Sheet Users. Silakan login kembali.', 'warning');
        handleLogout();
      }
    }
  }

  /**
   * Helper Mendapatkan Nama Lengkap Pengguna yang Sedang Login
   */
  function getCurrentLoggedInUserName() {
    if (state.authUser) {
      if (state.authUser.name && state.authUser.name.trim() && state.authUser.name.indexOf('@') !== 0) {
        return state.authUser.name.trim();
      }
      var accounts = getStoredUserAccounts();
      var cleanU = (state.authUser.username || state.authUser.name || '').replace(/^@+/, '').trim().toLowerCase();
      var matched = accounts.find(function(a) {
        return (a.username || '').replace(/^@+/, '').trim().toLowerCase() === cleanU;
      });
      if (matched && matched.name) {
        return matched.name.trim();
      }
      return state.authUser.name || state.authUser.username || 'Administrator Utama';
    }
    return 'Administrator Utama';
  }

  function getUserInitials(name) {
    if (!name || typeof name !== 'string') return 'AU';
    var clean = name.replace(/[^\w\s]/gi, '').trim();
    if (!clean) return 'AU';
    var words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return words[0].slice(0, words[0].length >= 2 ? 2 : 1).toUpperCase();
  }

  function applyRolePermissions() {
    var role = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    
    // 1. Profil Header (Menampilkan Nama Lengkap Saja)
    var nameEl = document.getElementById('hdrUserName');
    var roleEl = document.getElementById('hdrUserRole');
    var avatarEl = document.getElementById('hdrUserAvatar');

    var displayName = '';
    if (state.authUser) {
      displayName = state.authUser.name;
      // Jika displayName masih berupa @username atau sama dengan username, sinkronkan nama lengkap dari database akun
      if (!displayName || displayName.indexOf('@') === 0 || displayName === state.authUser.username) {
        var accounts = getStoredUserAccounts();
        var cleanU = (state.authUser.username || state.authUser.name || '').replace(/^@+/, '').trim().toLowerCase();
        var matched = accounts.find(function(a) {
          return (a.username || '').replace(/^@+/, '').trim().toLowerCase() === cleanU;
        });
        if (matched && matched.name) {
          displayName = matched.name;
          state.authUser.name = matched.name;
          state.authUser.role = matched.role || role;
          role = matched.role || role;
        }
      }
      // Jangan pernah fallback ke email bila name kosong, ambil fallback username atau "Administrator Utama"
      if (!displayName || displayName.indexOf('@') !== -1) {
        displayName = state.authUser.username ? getDisplayNameFromUsername(state.authUser.username) : 'Administrator Utama';
      }
    }
    if (!displayName) displayName = 'Administrator Utama';

    if (nameEl) {
      nameEl.textContent = displayName;
    }

    var badgeClass = 'role-admin';
    if (role === 'Facilitator') {
      badgeClass = 'role-facilitator';
    } else if (role === 'Inputer') {
      badgeClass = 'role-inputer';
    } else if (role === 'Viewer') {
      badgeClass = 'role-viewer';
    }
    
    // Label role bersih; khusus Inputer tampilkan unit/site asal
    var roleLabel = role.toUpperCase();
    if (role === 'Inputer' && state.authUser) {
      var userSite = state.authUser.site;
      if (!userSite) {
        var accounts = getStoredUserAccounts();
        var cleanU = (state.authUser.username || state.authUser.name || '').replace(/^@+/, '').trim().toLowerCase();
        var matched = accounts.find(function(a) {
          return (a.username || '').replace(/^@+/, '').trim().toLowerCase() === cleanU;
        });
        if (matched && matched.site) userSite = matched.site;
        else if (matched && matched.name && matched.name.indexOf('CHO') >= 0) userSite = matched.name;
      }
      if (userSite) {
        roleLabel = 'INPUTER • ' + userSite.toUpperCase();
      }
    }

    if (roleEl) {
      roleEl.innerHTML = '<span class="badge-role ' + badgeClass + '">' + escapeHtml(roleLabel) + '</span>';
    }

    // Logo avatar inisial nama akun (contoh: Administrator Utama -> AU, Reza Trianto -> RT)
    var initials = getUserInitials(displayName);
    if (avatarEl) {
      avatarEl.textContent = initials;
      avatarEl.title = displayName + ' (' + role + ')';
    }

    // 1b. Sinkronkan juga pada kartu profil mobile drawer (jika ada)
    var drawerNameEl = document.getElementById('drawerUserName');
    var drawerRoleEl = document.getElementById('drawerUserRole');
    var drawerAvatarEl = document.getElementById('drawerUserAvatar');
    if (drawerNameEl) {
      drawerNameEl.textContent = displayName;
    }
    if (drawerRoleEl) {
      drawerRoleEl.innerHTML = '<span class="badge-role ' + badgeClass + '">' + escapeHtml(roleLabel) + '</span>';
    }
    if (drawerAvatarEl) {
      drawerAvatarEl.textContent = initials;
      drawerAvatarEl.title = displayName + ' (' + role + ')';
    }

    // 2. Kontrol Tombol Input Kasus Baru:
    // Administrator & Inputer bisa input data baru.
    // Facilitator & Viewer TIDAK input data (Viewer purely read-only).
    var btnNew = document.getElementById('btnOpenNewModal');
    if (btnNew) {
      if (role === 'Facilitator' || role === 'Viewer') {
        btnNew.style.display = 'none';
      } else {
        btnNew.style.display = 'inline-flex';
      }
    }

    // 3. Kontrol Menu Kelola User (KHUSUS ADMINISTRATOR):
    var btnManageHeader = document.getElementById('btnManageUsers');
    var sidebarAdminBlock = document.getElementById('sidebarAdminBlock');
    if (role === 'Administrator') {
      if (btnManageHeader) btnManageHeader.style.display = 'inline-flex';
      if (sidebarAdminBlock) sidebarAdminBlock.style.display = 'block';
    } else {
      if (btnManageHeader) btnManageHeader.style.display = 'none';
      if (sidebarAdminBlock) sidebarAdminBlock.style.display = 'none';
    }

    // 4. Kontrol Tautan Database Terhubung (KHUSUS ADMINISTRATOR):
    // Pada Role selain admin, 📊 Database Terhubung dihide saja
    var sidebarSheetInfo = document.getElementById('sidebarSheetInfo') || document.querySelector('.sidebar-sheet-info');
    if (sidebarSheetInfo) {
      sidebarSheetInfo.style.display = (role === 'Administrator') ? 'block' : 'none';
    }

    // 5. Update Status & Tab Peran di Buku Panduan (User Guide)
    updateGuideCurrentRoleBadge();
    renderGuideRoleTabs();

    // 6. Kontrol Tombol Download User Guide (KHUSUS ADMINISTRATOR)
    var btnDownloadFoot = document.getElementById('btnDownloadUserGuide');
    var btnDownloadHead = document.getElementById('btnDownloadUserGuideHead');
    var isAdministrator = (role === 'Administrator');
    if (btnDownloadFoot) {
      btnDownloadFoot.style.display = isAdministrator ? 'inline-flex' : 'none';
    }
    if (btnDownloadHead) {
      btnDownloadHead.style.display = isAdministrator ? 'inline-flex' : 'none';
    }

    // 7. Kontrol Tombol Simpan Catatan di Quick Win Drawer (Hanya Facilitator & Administrator)
    var btnDrawerSave = document.getElementById('btn-drawer-save');
    var isInputerOrViewer = (role.toLowerCase() === 'inputer' || role.toLowerCase() === 'viewer');
    if (btnDrawerSave) {
      if (isInputerOrViewer) {
        btnDrawerSave.style.setProperty('display', 'none', 'important');
        btnDrawerSave.classList.add('hidden');
        btnDrawerSave.hidden = true;
        if (btnDrawerSave.parentElement) {
          btnDrawerSave.parentElement.style.setProperty('display', 'none', 'important');
        }
      } else {
        btnDrawerSave.style.removeProperty('display');
        btnDrawerSave.classList.remove('hidden');
        btnDrawerSave.hidden = false;
        if (btnDrawerSave.parentElement) {
          btnDrawerSave.parentElement.style.removeProperty('display');
        }
      }
    }
  }

  function showDashboardApp() {
    var loginEl = document.getElementById('loginView');
    var appEl = document.getElementById('appView');
    
    applyRolePermissions();

    if (loginEl) loginEl.style.display = 'none';
    if (appEl) {
      appEl.style.display = 'flex';
      appEl.style.flexDirection = 'column';
      appEl.style.width = '100%';
    }
  }

  function showLoginScreen() {
    var loginEl = document.getElementById('loginView');
    var appEl = document.getElementById('appView');
    if (appEl) appEl.style.display = 'none';
    if (loginEl) loginEl.style.display = 'flex';
    var userInp = document.getElementById('loginUsername');
    var passInp = document.getElementById('loginPassword');
    if (userInp) userInp.value = '';
    if (passInp) passInp.value = '';
  }

  function handleLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    var userInp = document.getElementById('loginUsername');
    var passInp = document.getElementById('loginPassword');
    var btnSubmit = document.getElementById('btnLoginSubmit');
    
    var rawUsername = (userInp && userInp.value ? userInp.value : '').trim();
    var password = (passInp && passInp.value ? passInp.value : '').trim();

    if (!rawUsername) {
      showToast('Harap masukkan Nama Pengguna (Username)!', 'warning');
      if (userInp) userInp.focus();
      return;
    }
    if (!password) {
      showToast('Harap masukkan Kata Sandi (Password)!', 'warning');
      if (passInp) passInp.focus();
      return;
    }

    var cleanUsername = rawUsername.replace(/^@+/, '').trim().toLowerCase();

    if (btnSubmit) {
      btnSubmit.innerHTML = '<span>Memverifikasi Akses ke Google Sheet...</span>';
      btnSubmit.style.opacity = '0.7';
      btnSubmit.disabled = true;
    }

    function doVerifyAndLogin(accountsList) {
      var found = accountsList.find(function(a) {
        return (a.username || '').replace(/^@+/, '').trim().toLowerCase() === cleanUsername;
      });

      if (!found) {
        showToast('Nama Pengguna (Username) "@' + cleanUsername + '" tidak terdaftar di Google Sheet Users!', 'error');
        if (btnSubmit) {
          btnSubmit.innerHTML = '<span>Sign In</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
          btnSubmit.style.opacity = '1';
          btnSubmit.disabled = false;
        }
        if (userInp) userInp.focus();
        return;
      }

      if (found.password && String(found.password).trim() !== password) {
        showToast('Kata sandi salah untuk pengguna: @' + found.username, 'error');
        if (btnSubmit) {
          btnSubmit.innerHTML = '<span>Sign In</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
          btnSubmit.style.opacity = '1';
          btnSubmit.disabled = false;
        }
        if (passInp) passInp.focus();
        return;
      }

      var role = found.role || 'Inputer';
      var fullName = found.name || found.username;

      state.authUser = {
        name: fullName,
        username: found.username,
        role: role,
        site: found.site || (found.name && found.name.indexOf('CHO') >= 0 ? found.name : ''),
        loginTime: new Date().toISOString()
      };
      
      var rememberMe = document.getElementById('loginRememberMe');
      if (rememberMe && rememberMe.checked) {
        try {
          localStorage.setItem('koncho_auth_user', JSON.stringify(state.authUser));
        } catch (err) {}
      }

      showToast('Selamat Datang di konCHO! Masuk sebagai ' + role + ' (' + fullName + ')', 'success');
      showDashboardApp();
      renderCaseList();
      if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
      if (typeof renderTasksTable === 'function') renderTasksTable();
      if (typeof updateTasksKpis === 'function') updateTasksKpis();
      resetIdleTimer();
      silentlySyncFromCloud();

      if (btnSubmit) {
        btnSubmit.innerHTML = '<span>Sign In</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
        btnSubmit.style.opacity = '1';
        btnSubmit.disabled = false;
      }
    }

    // Selalu ambil data pengguna teranyar dari Google Apps Script agar password & akun 100% sinkron
    if (state.gasApiUrl) {
      fetch(state.gasApiUrl + '?action=getInitialData&_t=' + Date.now(), { method: 'GET', redirect: 'follow' })
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (res && res.users && Array.isArray(res.users)) {
            syncStoredUsersFromSheet(res.users);
          }
          if (res && res.success) {
            processLoadedData(res, false);
          }
          var freshAccounts = getStoredUserAccounts();
          doVerifyAndLogin(freshAccounts);
        })
        .catch(function(err) {
          console.warn('Login online check fallback to local:', err);
          var cachedAccounts = getStoredUserAccounts();
          doVerifyAndLogin(cachedAccounts);
        });
    } else {
      var localAccounts = getStoredUserAccounts();
      doVerifyAndLogin(localAccounts);
    }
  }

  // =========================================================================
  // SISTEM KEAMANAN: AUTO-LOGOUT SETELAH 15 MENIT TIDAK AKTIF (IDLE TIMEOUT)
  // =========================================================================
  var IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Menit = 900.000 ms
  var lastUserActivity = Date.now();
  var idleCheckTimer = null;

  function resetIdleTimer() {
    lastUserActivity = Date.now();
  }

  function initIdleAutoLogout() {
    lastUserActivity = Date.now();
    var events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'wheel'];
    events.forEach(function(evt) {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    if (idleCheckTimer) clearInterval(idleCheckTimer);
    idleCheckTimer = setInterval(function() {
      // Hanya berjalan jika user sedang dalam sesi aktif (logged in)
      if (!state.authUser) return;

      var idleTime = Date.now() - lastUserActivity;
      if (idleTime >= IDLE_TIMEOUT_MS) {
        performIdleAutoLogout();
      }
    }, 10000); // Evaluasi setiap 10 detik
  }

  function performIdleAutoLogout() {
    // 1. Tutup seluruh modal jika ada yang sedang terbuka
    var activeModals = document.querySelectorAll('.modal-backdrop.active');
    activeModals.forEach(function(m) {
      m.classList.remove('active');
    });

    // 2. Hapus sesi otentikasi
    try {
      localStorage.removeItem('koncho_auth_user');
    } catch(e) {}
    state.authUser = null;

    // 3. Tampilkan layar login
    showLoginScreen();

    // 4. Berikan notifikasi toast informatif
    showToast('Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 15 menit. Silakan login kembali.', 'warning');
  }

  // =========================================================================
  // BUKU PANDUAN PENGGUNA (USER GUIDE) SESUAI PERAN & ALL ROLE
  // =========================================================================
  var activeGuideTab = 'all';

  function openUserGuideModal() {
    var modal = document.getElementById('modalUserGuide');
    if (!modal) return;

    var role = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    var isAdministrator = (role === 'Administrator');
    var btnDownloadFoot = document.getElementById('btnDownloadUserGuide');
    var btnDownloadHead = document.getElementById('btnDownloadUserGuideHead');
    if (btnDownloadFoot) btnDownloadFoot.style.display = isAdministrator ? 'inline-flex' : 'none';
    if (btnDownloadHead) btnDownloadHead.style.display = isAdministrator ? 'inline-flex' : 'none';

    renderGuideRoleTabs();
    updateGuideCurrentRoleBadge();
    modal.classList.add('active');

    // Reset scroll ke paling atas saat dibuka
    var contentArea = document.getElementById('guideContentArea');
    if (contentArea) contentArea.scrollTop = 0;
  }

  function closeUserGuideModal() {
    var modal = document.getElementById('modalUserGuide');
    if (modal) modal.classList.remove('active');
  }

  // Unduh Buku Panduan (User Guide) - KHUSUS ROLE ADMINISTRATOR
  function handleDownloadUserGuide() {
    var role = (state.authUser && state.authUser.role) ? state.authUser.role : '';
    if (role !== 'Administrator') {
      showToast('Akses Ditolak: Hanya Administrator yang berhak mengunduh Buku Panduan Resmi!', 'error');
      return;
    }

    var contentArea = document.getElementById('guideContentArea');
    if (!contentArea) {
      showToast('Konten panduan tidak ditemukan.', 'error');
      return;
    }

    var adminName = (state.authUser && state.authUser.name) ? state.authUser.name : 'Administrator Utama';
    var nowFormatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) + ' WIB';

    // Buat template dokumen HTML siap cetak / simpan PDF
    var printContent = '<!DOCTYPE html>\n' +
'<html lang="id">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <title>Buku Panduan Pengguna (User Guide) - konCHO</title>\n' +
'  <style>\n' +
'    @page {\n' +
'      size: A4;\n' +
'      margin: 15mm 15mm 20mm 15mm;\n' +
'    }\n' +
'    * {\n' +
'      box-sizing: border-box;\n' +
'      -webkit-print-color-adjust: exact !important;\n' +
'      print-color-adjust: exact !important;\n' +
'    }\n' +
'    body {\n' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\n' +
'      line-height: 1.5;\n' +
'      color: #1e293b;\n' +
'      background: #ffffff;\n' +
'      padding: 24px;\n' +
'      margin: 0;\n' +
'    }\n' +
'    .doc-header {\n' +
'      border-bottom: 3px solid #4f46e5;\n' +
'      padding-bottom: 16px;\n' +
'      margin-bottom: 24px;\n' +
'      display: flex;\n' +
'      justify-content: space-between;\n' +
'      align-items: flex-start;\n' +
'    }\n' +
'    .doc-title {\n' +
'      font-size: 22px;\n' +
'      font-weight: 800;\n' +
'      color: #0f172a;\n' +
'      margin: 0 0 6px 0;\n' +
'    }\n' +
'    .doc-sub {\n' +
'      font-size: 13px;\n' +
'      color: #64748b;\n' +
'      margin: 0;\n' +
'    }\n' +
'    .doc-meta {\n' +
'      text-align: right;\n' +
'      font-size: 11.5px;\n' +
'      color: #475569;\n' +
'      line-height: 1.6;\n' +
'    }\n' +
'    .doc-badge {\n' +
'      display: inline-block;\n' +
'      padding: 4px 10px;\n' +
'      border-radius: 9999px;\n' +
'      font-size: 11px;\n' +
'      font-weight: 700;\n' +
'      background: rgba(79, 70, 229, 0.1);\n' +
'      color: #4f46e5;\n' +
'      border: 1px solid rgba(79, 70, 229, 0.25);\n' +
'      margin-bottom: 6px;\n' +
'    }\n' +
'    .guide-section {\n' +
'      margin-bottom: 28px;\n' +
'      page-break-inside: avoid;\n' +
'    }\n' +
'    .guide-section-header {\n' +
'      border-bottom: 2px solid #e2e8f0;\n' +
'      padding-bottom: 8px;\n' +
'      margin-bottom: 12px;\n' +
'      display: flex;\n' +
'      justify-content: space-between;\n' +
'      align-items: center;\n' +
'    }\n' +
'    .guide-section-title {\n' +
'      font-size: 16px;\n' +
'      font-weight: 800;\n' +
'      color: #0f172a;\n' +
'      margin: 0;\n' +
'    }\n' +
'    .guide-section-desc {\n' +
'      font-size: 12.5px;\n' +
'      color: #334155;\n' +
'      margin-bottom: 12px;\n' +
'    }\n' +
'    .guide-visual-card {\n' +
'      border: 1px solid #cbd5e1;\n' +
'      border-radius: 8px;\n' +
'      overflow: hidden;\n' +
'      margin-top: 10px;\n' +
'      margin-bottom: 14px;\n' +
'      background: #f8fafc;\n' +
'    }\n' +
'    .guide-visual-head {\n' +
'      background: #e2e8f0;\n' +
'      padding: 8px 14px;\n' +
'      font-weight: 700;\n' +
'      font-size: 11.5px;\n' +
'      color: #334155;\n' +
'      border-bottom: 1px solid #cbd5e1;\n' +
'    }\n' +
'    .guide-visual-body {\n' +
'      padding: 14px;\n' +
'    }\n' +
'    .guide-matrix-table {\n' +
'      width: 100%;\n' +
'      border-collapse: collapse;\n' +
'      font-size: 11.5px;\n' +
'    }\n' +
'    .guide-matrix-table th, .guide-matrix-table td {\n' +
'      border: 1px solid #cbd5e1;\n' +
'      padding: 8px 10px;\n' +
'      text-align: left;\n' +
'    }\n' +
'    .guide-matrix-table th {\n' +
'      background: #e2e8f0;\n' +
'      font-weight: 700;\n' +
'    }\n' +
'    .guide-flow-diagram {\n' +
'      display: flex;\n' +
'      align-items: center;\n' +
'      justify-content: center;\n' +
'      gap: 12px;\n' +
'      padding: 14px;\n' +
'      background: #f1f5f9;\n' +
'      border-radius: 6px;\n' +
'      border: 1px dashed #cbd5e1;\n' +
'    }\n' +
'    .guide-flow-node {\n' +
'      padding: 10px 14px;\n' +
'      border-radius: 6px;\n' +
'      font-size: 11.5px;\n' +
'      font-weight: 700;\n' +
'      text-align: center;\n' +
'    }\n' +
'    .guide-flow-node.node-open { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }\n' +
'    .guide-flow-node.node-progress { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }\n' +
'    .guide-flow-node.node-closed { background: #d1fae5; color: #047857; border: 1px solid #a7f3d0; }\n' +
'    .guide-step-row {\n' +
'      display: flex;\n' +
'      gap: 10px;\n' +
'      margin-bottom: 8px;\n' +
'      font-size: 12px;\n' +
'    }\n' +
'    .guide-step-badge {\n' +
'      width: 22px;\n' +
'      height: 22px;\n' +
'      border-radius: 50%;\n' +
'      background: #4f46e5;\n' +
'      color: #fff;\n' +
'      font-size: 11px;\n' +
'      font-weight: 700;\n' +
'      display: flex;\n' +
'      align-items: center;\n' +
'      justify-content: center;\n' +
'      flex-shrink: 0;\n' +
'    }\n' +
'    .guide-step-text {\n' +
'      flex: 1;\n' +
'    }\n' +
'    .guide-idle-box {\n' +
'      background: #fef3c7;\n' +
'      border: 1px solid #fde68a;\n' +
'      border-radius: 6px;\n' +
'      padding: 12px 16px;\n' +
'      font-size: 12px;\n' +
'      color: #92400e;\n' +
'    }\n' +
'    .doc-footer {\n' +
'      border-top: 1px solid #cbd5e1;\n' +
'      padding-top: 12px;\n' +
'      margin-top: 30px;\n' +
'      font-size: 11px;\n' +
'      color: #64748b;\n' +
'      display: flex;\n' +
'      justify-content: space-between;\n' +
'    }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div class="doc-header">\n' +
'    <div>\n' +
'      <span class="doc-badge">DOKUMEN RESMI INTERNAL konCHO</span>\n' +
'      <h1 class="doc-title">Buku Panduan Pengguna (User Guide)</h1>\n' +
'      <p class="doc-sub">Complaint Handling Officer (CHO Mobile & CHO Fixed) • Panduan Operasional Lengkap Seluruh Peran (All Role)</p>\n' +
'    </div>\n' +
'    <div class="doc-meta">\n' +
'      <div><strong>Status Dokumen:</strong> Terverifikasi (Administrator)</div>\n' +
'      <div><strong>Diunduh Oleh:</strong> ' + escapeHtml(adminName) + '</div>\n' +
'      <div><strong>Tanggal Unduh:</strong> ' + escapeHtml(nowFormatted) + '</div>\n' +
'      <div><strong>Sistem:</strong> konCHO v2.0</div>\n' +
'    </div>\n' +
'  </div>\n\n' +
  contentArea.innerHTML + '\n\n' +
'  <div class="doc-footer">\n' +
'    <span>© konCHO Complaint Handling Officer • PT Telkom Indonesia</span>\n' +
'    <span>Dokumen Resmi Administrasi • Khusus Digunakan untuk Internal</span>\n' +
'  </div>\n' +
'</body>\n' +
'</html>';

    // 1. Download file HTML offline
    var blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Buku_Panduan_User_Guide_konCHO_Official.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 2000);

    // 2. Buka jendela cetak / Simpan PDF
    var printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(function() {
        try {
          printWin.print();
        } catch(e) {}
      }, 500);
    }

    showToast('Buku Panduan berhasil disiapkan! Silakan simpan dokumen sebagai PDF.', 'success');
  }

  function updateGuideCurrentRoleBadge() {
    var badge = document.getElementById('guideCurrentRoleBadge');
    if (!badge) return;
    var role = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    if (role === 'Administrator') {
      badge.innerHTML = '👑 Administrator (All Role Access)';
      badge.style.background = 'rgba(246, 200, 76, 0.18)';
      badge.style.color = '#f6c84c';
    } else if (role === 'Facilitator') {
      badge.innerHTML = '🛠️ Facilitator (Penanganan & Resolusi)';
      badge.style.background = 'rgba(59, 130, 246, 0.18)';
      badge.style.color = '#3b82f6';
    } else if (role === 'Viewer') {
      badge.innerHTML = '👁️ Viewer (Monitoring & Read-Only)';
      badge.style.background = 'rgba(14, 165, 233, 0.18)';
      badge.style.color = '#38bdf8';
    } else {
      badge.innerHTML = '📝 Inputer (Pelaporan Kasus Baru)';
      badge.style.background = 'rgba(168, 85, 247, 0.18)';
      badge.style.color = '#a855f7';
    }
  }

  function renderGuideRoleTabs() {
    var role = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    var tabsContainer = document.getElementById('guideRoleTabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    var tabs = [];
    if (role === 'Administrator') {
      // Role admin mendapatkan user guide all role
      tabs = [
        { id: 'all', label: '👑 Semua Panduan (All Role)' },
        { id: 'inputer', label: '📝 Panduan Inputer' },
        { id: 'facilitator', label: '🛠️ Panduan Facilitator' },
        { id: 'admin', label: '👑 Panduan Administrator' },
        { id: 'flow', label: '🔄 Alur Siklus Kasus' }
      ];
    } else if (role === 'Facilitator') {
      tabs = [
        { id: 'facilitator', label: '🛠️ Panduan Facilitator' },
        { id: 'inputer', label: '📝 Referensi Inputer' },
        { id: 'flow', label: '🔄 Alur Siklus Kasus' }
      ];
    } else if (role === 'Viewer') {
      tabs = [
        { id: 'all', label: '👁️ Panduan Viewer (Read-Only)' },
        { id: 'home', label: '🏠 Panduan Membaca Home' },
        { id: 'flow', label: '🔄 Alur Siklus Kasus' }
      ];
    } else {
      // Inputer
      tabs = [
        { id: 'inputer', label: '📝 Panduan Inputer' },
        { id: 'flow', label: '🔄 Alur Siklus Kasus' }
      ];
    }

    var isValid = tabs.some(function(t) { return t.id === activeGuideTab; });
    if (!isValid) {
      activeGuideTab = tabs[0].id;
    }

    tabs.forEach(function(t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'guide-tab-btn' + (t.id === activeGuideTab ? ' active' : '');
      btn.textContent = t.label;
      btn.addEventListener('click', function() {
        activeGuideTab = t.id;
        renderGuideRoleTabs();
        handleGuideTabSwitch(t.id);
      });
      tabsContainer.appendChild(btn);
    });
  }

  function handleGuideTabSwitch(tabId) {
    var targetSecId = 'guide-sec-matrix';
    if (tabId === 'inputer') targetSecId = 'guide-sec-inputer';
    else if (tabId === 'facilitator') targetSecId = 'guide-sec-progress';
    else if (tabId === 'admin') targetSecId = 'guide-sec-admin';
    else if (tabId === 'home') targetSecId = 'guide-sec-home';
    else if (tabId === 'flow') targetSecId = 'guide-sec-progress';
    else if (tabId === 'all') targetSecId = 'guide-sec-matrix';

    scrollGuideToSection(targetSecId);
  }

  function scrollGuideToSection(secId) {
    var sec = document.getElementById(secId);
    var contentArea = document.getElementById('guideContentArea');
    if (sec && contentArea) {
      var topPos = sec.offsetTop - contentArea.offsetTop - 12;
      contentArea.scrollTo({ top: topPos, behavior: 'smooth' });

      // Perbarui status aktif di Daftar Isi (TOC)
      var tocLinks = document.querySelectorAll('.guide-toc-link');
      tocLinks.forEach(function(link) {
        link.classList.toggle('active', link.getAttribute('data-target') === secId);
      });
    }
  }

  function initGuideTocEvents() {
    var tocLinks = document.querySelectorAll('.guide-toc-link');
    tocLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        var targetId = link.getAttribute('data-target');
        if (targetId) {
          scrollGuideToSection(targetId);
        }
      });
    });

    var contentArea = document.getElementById('guideContentArea');
    if (contentArea) {
      contentArea.addEventListener('scroll', function() {
        var sections = document.querySelectorAll('.guide-section');
        var scrollPos = contentArea.scrollTop + 60;
        sections.forEach(function(sec) {
          var top = sec.offsetTop - contentArea.offsetTop;
          var height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            var id = sec.id;
            tocLinks.forEach(function(l) {
              l.classList.toggle('active', l.getAttribute('data-target') === id);
            });
          }
        });
      }, { passive: true });
    }
  }

  function handleLogout() {
    localStorage.removeItem('koncho_auth_user');
    state.authUser = null;
    showLoginScreen();
    showToast('Anda telah keluar dari akun konCHO.', 'info');
  }

  /**
   * Helper Pengendali Mobile Sidebar Drawer (HP Android & iPhone)
   */
  function openMobileSidebar() {
    var sidebar = document.getElementById('sidebarLeft') || document.querySelector('.sidebar-left');
    var backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    var sidebar = document.getElementById('sidebarLeft') || document.querySelector('.sidebar-left');
    var backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  function toggleMobileSidebar() {
    var sidebar = document.getElementById('sidebarLeft') || document.querySelector('.sidebar-left');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      closeMobileSidebar();
    } else {
      openMobileSidebar();
    }
  }

  /**
   * Inisialisasi Aplikasi
   */
  function init() {
    applyTheme(state.theme);
    initAuth();
    // Muat cache lokal terlebih dahulu agar seketika muncul tanpa delay
    var cached = getStoredSharedRecords();
    if (cached && cached.length > 0) {
      state.records = cached;
      if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
      if (typeof renderTasksTable === 'function') renderTasksTable();
    }
    bindEvents();
    initIdleAutoLogout();
    loadApplicationData();
    startBackgroundCloudSync();
  }

  /**
   * Binding Event Listeners
   */
  function bindEvents() {
    // 0. Otentikasi & Login Event Listeners
    var loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

    // Lamp Animation Interactive Toggle (Pull Cord & Lamp Head)
    var lampContainer = document.getElementById('lampContainer');
    var lampPullCord = document.getElementById('lampPullCord');
    var lampHead = document.getElementById('lampHead');
    var isLampOn = true;

    function toggleLamp() {
      isLampOn = !isLampOn;
      if (lampContainer) {
        if (isLampOn) {
          lampContainer.classList.remove('lamp-off');
        } else {
          lampContainer.classList.add('lamp-off');
        }
      }
      if (lampPullCord) {
        lampPullCord.style.transform = 'translateY(14px)';
        setTimeout(function() {
          lampPullCord.style.transform = '';
        }, 220);
      }
    }

    if (lampPullCord) lampPullCord.addEventListener('click', toggleLamp);
    if (lampHead) lampHead.addEventListener('click', function(e) {
      if (e.target.id === 'lampPullCord' || (e.target.closest && e.target.closest('#lampPullCord'))) return;
      toggleLamp();
    });

    // Password Visibility Toggle (Show / Hide Password Eye Icon)
    var btnTogglePassword = document.getElementById('btnTogglePassword');
    var passInp = document.getElementById('loginPassword');
    var eyeIconShow = document.getElementById('eyeIconShow');
    var eyeIconHide = document.getElementById('eyeIconHide');
    if (btnTogglePassword && passInp) {
      btnTogglePassword.addEventListener('click', function(e) {
        e.preventDefault();
        var isPass = passInp.type === 'password';
        passInp.type = isPass ? 'text' : 'password';
        if (eyeIconShow) eyeIconShow.style.display = isPass ? 'none' : 'block';
        if (eyeIconHide) eyeIconHide.style.display = isPass ? 'block' : 'none';
        passInp.focus();
      });
    }

    
    // User Management Events (Khusus Role Administrator)
    var btnManageHeader = document.getElementById('btnManageUsers');
    if (btnManageHeader) btnManageHeader.addEventListener('click', openManageUsersModal);

    var sidebarBtnManage = document.getElementById('sidebarBtnManageUsers');
    if (sidebarBtnManage) sidebarBtnManage.addEventListener('click', function() {
      if (window.innerWidth <= 860) closeMobileSidebar();
      openManageUsersModal();
    });

    var btnCloseManage = document.getElementById('btnCloseManageUsersModal');
    if (btnCloseManage) btnCloseManage.addEventListener('click', closeManageUsersModal);

    var btnDoneManage = document.getElementById('btnDoneManageUsers');
    if (btnDoneManage) btnDoneManage.addEventListener('click', closeManageUsersModal);

    var btnToggleAdd = document.getElementById('btnToggleAddUserForm');
    if (btnToggleAdd) btnToggleAdd.addEventListener('click', toggleAddUserForm);

    var btnCancelUser = document.getElementById('btnCancelUserForm');
    if (btnCancelUser) btnCancelUser.addEventListener('click', hideUserForm);

    var formUser = document.getElementById('formUserMgmt');
    if (formUser) formUser.addEventListener('submit', handleSaveUserAccount);

    var btnSaveUser = document.getElementById('btnSaveUser');
    if (btnSaveUser) btnSaveUser.addEventListener('click', handleSaveUserAccount);

    var roleInpSelect = document.getElementById('inpUserRole');
    if (roleInpSelect) roleInpSelect.addEventListener('change', updateRoleDescHint);

    var btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // 0a. Pengendali Mobile Drawer Menu (HP Android & iPhone)
    var btnToggleSidebar = document.getElementById('btnToggleMobileSidebar');
    if (btnToggleSidebar) btnToggleSidebar.addEventListener('click', toggleMobileSidebar);

    var btnCloseSidebar = document.getElementById('btnCloseMobileSidebar');
    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeMobileSidebar);

    var sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

    var btnDrawerRefresh = document.getElementById('btnDrawerRefresh');
    if (btnDrawerRefresh) {
      btnDrawerRefresh.addEventListener('click', function() {
        closeMobileSidebar();
        loadApplicationData(true);
      });
    }

    var btnDrawerLogout = document.getElementById('btnDrawerLogout');
    if (btnDrawerLogout) {
      btnDrawerLogout.addEventListener('click', function() {
        closeMobileSidebar();
        handleLogout();
      });
    }

    var userProfileBadge = document.getElementById('userProfileBadge');
    if (userProfileBadge) {
      userProfileBadge.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'btnLogout' || (e.target.closest && e.target.closest('#btnLogout')))) return;
        if (window.innerWidth <= 860) {
          openMobileSidebar();
        }
      });
    }

    // 0. Navigasi Menu: Home (Sheet List) vs Detail Case
    if (dom.navHome) {
      dom.navHome.addEventListener('click', function() {
        state.activeServiceScope = 'ALL';
        state.activeStatusFilter = 'all';
        dom.sidebarNavBtns.forEach(function(b) {
          b.classList.toggle('active', b.getAttribute('data-service') === 'ALL');
        });
        dom.kpiNavBtns.forEach(function(b) {
          b.classList.toggle('active', b.getAttribute('data-status') === 'all' || b.id === 'pillTotal');
        });
        updateScopeLabel();
        updateKpiCounters();
        setViewMode('home');
        if (window.innerWidth <= 860) closeMobileSidebar();
      });
    }
    if (dom.btnViewHome) {
      dom.btnViewHome.addEventListener('click', function() {
        setViewMode('home');
      });
    }
    if (dom.btnViewDetail) {
      dom.btnViewDetail.addEventListener('click', function() {
        setViewMode('detail');
      });
    }

    // 1. Theme Toggle
    if (dom.btnToggleTheme) {
      dom.btnToggleTheme.addEventListener('click', function() {
        var next = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }

    // 2. Refresh Button
    if (dom.btnRefresh) {
      dom.btnRefresh.addEventListener('click', function() {
        showToast('Menyinkronkan data terbaru...', 'info');
        loadApplicationData(true);
      });
    }

    // 3. Sidebar Kiri: Layanan Filter (Semua, Mobile, Fixed)
    dom.sidebarNavBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        dom.sidebarNavBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.activeServiceScope = btn.getAttribute('data-service') || 'ALL';
        updateScopeLabel();
        updateKpiCounters();
        renderCaseList();
        if (window.innerWidth <= 860) closeMobileSidebar();
      });
    });

    // 4. Sidebar Kiri: Periode Bulan
    if (dom.monthFilterSelect) {
      dom.monthFilterSelect.addEventListener('change', function(e) {
        state.activeMonthFilter = e.target.value;
        updateScopeLabel();
        updateKpiCounters();
        renderCaseList();
        if (window.innerWidth <= 860) closeMobileSidebar();
      });
    }

    // 5. Sidebar Kiri: Status KPI (Beranda, Open, In Progress, Closed)
    dom.kpiNavBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        dom.kpiNavBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var st = btn.getAttribute('data-status') || 'all';
        state.activeStatusFilter = st;

        // Jika klik Beranda (data-status === 'all'), otomatis aktifkan cakupan kedua layanan (CHO Mobile & Fixed)
        if (st === 'all') {
          state.activeServiceScope = 'ALL';
          dom.sidebarNavBtns.forEach(function(b) { b.classList.remove('active'); });
          var navAllBtn = document.getElementById('navAll');
          if (navAllBtn) navAllBtn.classList.add('active');
          updateScopeLabel();
          updateKpiCounters();
        }
        renderCaseList();
        if (window.innerWidth <= 860) closeMobileSidebar();
      });
    });

    // 6. Pencarian Teks
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', function(e) {
        state.searchQuery = e.target.value.toLowerCase().trim();
        if (dom.btnClearSearch) {
          dom.btnClearSearch.style.display = state.searchQuery ? 'block' : 'none';
        }
        renderCaseList();
      });
    }
    if (dom.btnClearSearch) {
      dom.btnClearSearch.addEventListener('click', function() {
        dom.searchInput.value = '';
        state.searchQuery = '';
        dom.btnClearSearch.style.display = 'none';
        renderCaseList();
        dom.searchInput.focus();
      });
    }

    // 7. Modal In Progress Events
    if (dom.btnCloseInProgressModal) dom.btnCloseInProgressModal.addEventListener('click', closeInProgressModal);
        if (dom.btnCancelInProgress) dom.btnCancelInProgress.addEventListener('click', closeInProgressModal);
    if (dom.modalInProgress) {
      dom.modalInProgress.addEventListener('click', function(e) {
        if (e.target === dom.modalInProgress) closeInProgressModal();
      });
    }
    if (dom.modalClosed) {
      dom.modalClosed.addEventListener('click', function(e) {
        if (e.target === dom.modalClosed) closeClosedModal();
      });
    }
    if (dom.btnSubmitInProgress) dom.btnSubmitInProgress.addEventListener('click', handleSaveInProgress);

    // 8. Modal Closed Events
    if (dom.btnCloseClosedModal) dom.btnCloseClosedModal.addEventListener('click', closeClosedModal);
    if (dom.btnCancelClosed) dom.btnCancelClosed.addEventListener('click', closeClosedModal);
    if (dom.btnSubmitClosed) dom.btnSubmitClosed.addEventListener('click', handleSaveClosed);

    // 9. Modal Log Events
    if (dom.btnCloseLogModal) dom.btnCloseLogModal.addEventListener('click', closeLogModal);
    if (dom.btnCloseLogFooter) dom.btnCloseLogFooter.addEventListener('click', closeLogModal);
    if (dom.btnSubmitQuickLog) dom.btnSubmitQuickLog.addEventListener('click', handleSaveQuickLog);

    // 10. Modal Input Kasus Baru Events
    if (dom.btnOpenNewModal) dom.btnOpenNewModal.addEventListener('click', openNewModal);
    if (dom.btnCloseModal) dom.btnCloseModal.addEventListener('click', closeNewModal);
    if (dom.btnCancelModal) dom.btnCancelModal.addEventListener('click', closeNewModal);
    if (dom.toggleMobile) dom.toggleMobile.addEventListener('click', function() { setNewModalService('MOBILE'); });
    if (dom.toggleFixed) dom.toggleFixed.addEventListener('click', function() { setNewModalService('FIXED'); });
    if (dom.toggleEcare) dom.toggleEcare.addEventListener('click', function() { setNewModalService('ECARE'); });
    if (dom.togglePriority) dom.togglePriority.addEventListener('click', function() { setNewModalService('PRIORITY'); });
    if (dom.btnSubmitNewReport) dom.btnSubmitNewReport.addEventListener('click', handleSubmitNewReport);

    // 11. User Guide Modal Events
    var btnUserGuideHdr = document.getElementById('btnUserGuide');
    if (btnUserGuideHdr) btnUserGuideHdr.addEventListener('click', openUserGuideModal);

    var sidebarBtnUserGuide = document.getElementById('sidebarBtnUserGuide');
    if (sidebarBtnUserGuide) sidebarBtnUserGuide.addEventListener('click', function() {
      if (window.innerWidth <= 860) closeMobileSidebar();
      openUserGuideModal();
    });

    var btnCloseUserGuideModal = document.getElementById('btnCloseUserGuideModal');
    if (btnCloseUserGuideModal) btnCloseUserGuideModal.addEventListener('click', closeUserGuideModal);

    var btnCloseUserGuideFoot = document.getElementById('btnCloseUserGuideFoot');
    if (btnCloseUserGuideFoot) btnCloseUserGuideFoot.addEventListener('click', closeUserGuideModal);

    var btnDownloadGuide = document.getElementById('btnDownloadUserGuide');
    if (btnDownloadGuide) btnDownloadGuide.addEventListener('click', handleDownloadUserGuide);

    var btnDownloadGuideHead = document.getElementById('btnDownloadUserGuideHead');
    if (btnDownloadGuideHead) btnDownloadGuideHead.addEventListener('click', handleDownloadUserGuide);

    initGuideTocEvents();

    // 12. Modal Upload PPT Events
    if (dom.btnCloseUploadPptModal) dom.btnCloseUploadPptModal.addEventListener('click', closeUploadPptModal);
    if (dom.btnCancelUploadPpt) dom.btnCancelUploadPpt.addEventListener('click', closeUploadPptModal);
    if (dom.btnBrowsePptFile) dom.btnBrowsePptFile.addEventListener('click', function() {
      if (dom.pptFileInput) dom.pptFileInput.click();
    });
    if (dom.pptFileInput) {
      dom.pptFileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
          handlePptFileSelect(e.target.files[0]);
        }
      });
    }
    if (dom.pptDropzone) {
      dom.pptDropzone.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'btnRemovePptFile' || (e.target.closest && e.target.closest('#btnRemovePptFile')) || e.target.id === 'btnBrowsePptFile')) return;
        if (dom.pptFileInput) dom.pptFileInput.click();
      });
      dom.pptDropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dom.pptDropzone.classList.add('dragover');
      });
      dom.pptDropzone.addEventListener('dragleave', function() {
        dom.pptDropzone.classList.remove('dragover');
      });
      dom.pptDropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        dom.pptDropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handlePptFileSelect(e.dataTransfer.files[0]);
        }
      });
    }
    if (dom.btnRemovePptFile) {
      dom.btnRemovePptFile.addEventListener('click', function(e) {
        e.stopPropagation();
        state.selectedPptFile = null;
        if (dom.pptFileInput) dom.pptFileInput.value = '';
        if (dom.dropzoneEmpty) dom.dropzoneEmpty.style.display = 'block';
        if (dom.dropzoneSelected) dom.dropzoneSelected.style.display = 'none';
        if (dom.btnSubmitUploadPpt) dom.btnSubmitUploadPpt.disabled = true;
      });
    }
    if (dom.btnSubmitUploadPpt) {
      dom.btnSubmitUploadPpt.addEventListener('click', handleUploadPptSubmit);
    }
    if (dom.btnModalDeletePpt) {
      dom.btnModalDeletePpt.addEventListener('click', function() {
        if (state.uploadPptTarget && state.uploadPptTarget.ticketId) {
          handleDeletePpt(state.uploadPptTarget.ticketId, state.uploadPptTarget.serviceType);
        }
      });
    }

    // 13. Modal Reschedule Date Events (Facilitator & Administrator)
    if (dom.btnCloseRescheduleModal) dom.btnCloseRescheduleModal.addEventListener('click', closeRescheduleModal);
    if (dom.btnCancelRescheduleModal) dom.btnCancelRescheduleModal.addEventListener('click', closeRescheduleModal);
    if (dom.btnSubmitReschedule) dom.btnSubmitReschedule.addEventListener('click', handleSubmitReschedule);

    // Tutup modal jika klik di luar box modal
    [dom.modalInProgress, dom.modalClosed, dom.modalLog, dom.newDataModal, dom.modalUploadPpt, dom.modalRescheduleDate, document.getElementById('modalManageUsers'), document.getElementById('modalUserGuide')].forEach(function(m) {
      if (!m) return;
      m.addEventListener('click', function(e) {
        if (e.target === m) {
          m.classList.remove('active');
        }
      });
    });
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.body.setAttribute('data-theme', theme);
    if (dom.themeIcon) {
      dom.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    localStorage.setItem('koncho_theme', theme);
  }

  function setViewMode(mode) {
    state.currentView = mode;
    if (dom.navHome) dom.navHome.classList.toggle('active', mode === 'home');
    if (dom.btnViewHome) dom.btnViewHome.classList.toggle('active', mode === 'home');
    if (dom.btnViewDetail) dom.btnViewDetail.classList.toggle('active', mode === 'detail');

    var titleEl = document.getElementById('casesCardTitle');
    if (titleEl) {
      titleEl.textContent = mode === 'home' ? 'Home • List Isu CHO (Kolom C, D, H, J)' : 'Daftar Case Isu CHO';
    }

    renderCaseList();
  }

  function updateScopeLabel() {
    if (!dom.activeScopeLabel) return;
    var srvText = 'Semua Unit';
    if (state.activeServiceScope === 'MOBILE') srvText = 'CHO Mobile';
    else if (state.activeServiceScope === 'FIXED') srvText = 'CHO Fixed';
    else if (state.activeServiceScope === 'ECARE') srvText = 'CHO eCare';
    else if (state.activeServiceScope === 'PRIORITY') srvText = 'CHO Priority';

    var monthText = state.activeMonthFilter === 'all' ? 'Semua Periode (Jan - Des)' : state.activeMonthFilter;
    dom.activeScopeLabel.textContent = 'Unit: ' + srvText + ' • Periode: ' + monthText;
  }

  // =========================================================================
  // SISTEM SINKRONISASI REAL-TIME: CROSS-TAB, PERSISTENCE CACHE & AUTO-SYNC
  // Memastikan inputan dari user manapun (Bandung, Semarang, Mobile, Fixed, eCare, Priority)
  // langsung terlihat oleh seluruh user (Inputer, Fasilitator, Viewer, Admin) tanpa perlu refresh
  // =========================================================================
  const konchoSyncChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('koncho_app_sync') : null;

  function saveSharedRecords(records) {
    try {
      if (Array.isArray(records) && records.length > 0) {
        localStorage.setItem('koncho_shared_records', JSON.stringify(records));
        localStorage.setItem('koncho_shared_records_ts', Date.now().toString());
      }
    } catch(e) {}
  }

  function getStoredSharedRecords() {
    try {
      var raw = localStorage.getItem('koncho_shared_records');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [];
  }

  function broadcastRecordUpdate(actionType, recordData) {
    saveSharedRecords(state.records);
    if (konchoSyncChannel) {
      try {
        konchoSyncChannel.postMessage({
          type: actionType,
          record: recordData,
          records: state.records,
          timestamp: Date.now()
        });
      } catch(e) {}
    }
  }

  function mergeLiveRecords(incomingRecords) {
    if (!Array.isArray(incomingRecords) || incomingRecords.length === 0) return;
    if (!Array.isArray(state.records)) state.records = [];

    var changed = false;
    incomingRecords.forEach(function(rec) {
      if (!rec || !rec.id) return;
      var idx = state.records.findIndex(function(r) { return String(r.id) === String(rec.id); });
      if (idx >= 0) {
        var curr = state.records[idx];
        var diff = curr.status !== rec.status || curr.progress !== rec.progress || curr.tanggalAgenda !== rec.tanggalAgenda;
        if (diff) {
          state.records[idx] = Object.assign({}, curr, rec);
          changed = true;
        }
      } else {
        state.records.unshift(rec);
        changed = true;
      }
    });

    if (changed) {
      state.records.sort(function(a, b) {
        var dateA = new Date(a.terakhirUpdate || a.tanggalAgenda || a.tanggal || 0).getTime();
        var dateB = new Date(b.terakhirUpdate || b.tanggalAgenda || b.tanggal || 0).getTime();
        return dateB - dateA;
      });
      state.mobileRecords = state.records.filter(function(r) { return r.serviceType === 'MOBILE'; });
      state.fixedRecords = state.records.filter(function(r) { return r.serviceType === 'FIXED'; });
      state.ecareRecords = state.records.filter(function(r) { return r.serviceType === 'ECARE'; });
      state.priorityRecords = state.records.filter(function(r) { return r.serviceType === 'PRIORITY'; });

      saveSharedRecords(state.records);
      if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
      if (typeof renderCalendarRightPanel === 'function' && (state.selectedDate || state.selectedDay)) {
        renderCalendarRightPanel(state.selectedDate || state.selectedDay);
      }
      if (typeof renderTasksTable === 'function') renderTasksTable();
      if (typeof updateTasksKpis === 'function') updateTasksKpis();
      if (typeof updateKpiCounters === 'function') updateKpiCounters();
      if (typeof renderActivityFeed === 'function') renderActivityFeed();
      if (typeof renderCaseList === 'function') renderCaseList();
    }
  }

  // Cross-Tab Listener: Tab lain seketika menangkap inputan kasus baru dari tab berbeda
  if (konchoSyncChannel) {
    konchoSyncChannel.onmessage = function(event) {
      if (!event || !event.data) return;
      var d = event.data;
      if (d.records && Array.isArray(d.records) && d.records.length > 0) {
        mergeLiveRecords(d.records);
      } else if (d.record && d.record.id) {
        mergeLiveRecords([d.record]);
      }
    };
  }

  // Fallback storage listener (window terpisah / mode berbeda)
  window.addEventListener('storage', function(e) {
    if (e.key === 'koncho_shared_records' && e.newValue) {
      try {
        var updated = JSON.parse(e.newValue);
        if (Array.isArray(updated) && updated.length > 0) {
          mergeLiveRecords(updated);
        }
      } catch(err) {}
    }
  });

  // Background Cloud Sync dengan Google Apps Script (berjalan tiap 12 detik)
  var _gasSyncTimer = null;
  function startBackgroundCloudSync() {
    if (_gasSyncTimer) clearInterval(_gasSyncTimer);
    _gasSyncTimer = setInterval(function() {
      if (document.hidden) return;
      silentlySyncFromCloud();
    }, 6000);
  }

  function silentlySyncFromCloud() {
    if (!state.gasApiUrl) return;
    fetch(state.gasApiUrl + '?action=getInitialData&_t=' + Date.now(), { method: 'GET', redirect: 'follow' })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res && res.success) {
          processLoadedData(res, false);
        }
      })
      .catch(function(e) {});
  }

  // Sinkronisasi otomatis saat user kembali ke tab/window
  window.addEventListener('focus', function() {
    silentlySyncFromCloud();
  });
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      silentlySyncFromCloud();
    }
  });

  /**
   * Load Data dari Backend Google Apps Script (Langsung atau via Live REST API di Vercel)
   */
  function loadApplicationData(showToastAlert) {
    showToast('Memuat data dari Google Sheet...', 'info');

    if (state.isGasEnvironment) {
      // 1. Lingkungan Internal Google Apps Script
      google.script.run
        .withSuccessHandler(function(res) {
          if (res && res.success) {
            processLoadedData(res, false);
            if (showToastAlert) showToast('Data berhasil diperbarui dari Spreadsheet!', 'success');
          } else {
            showToast('Gagal memuat: ' + (res ? res.error : 'Unknown'), 'error');
          }
        })
        .withFailureHandler(function(err) {
          showToast('Koneksi Apps Script error: ' + err.message, 'error');
        })
        .getInitialData();
    } else if (state.gasApiUrl) {
      // 2. Lingkungan Vercel / GitHub: Mengambil LIVE data dari Apps Script Web App API
      fetch(state.gasApiUrl + '?action=getInitialData&_t=' + Date.now(), { method: 'GET', redirect: 'follow' })
        .then(function(response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function(res) {
          if (res && res.success) {
            processLoadedData(res, false);
            
            if (showToastAlert) showToast('Data live terhubung dari Google Spreadsheet!', 'success');
          } else {
            console.warn('API returned error, using fallback:', res);
            loadFallbackData(showToastAlert);
          }
        })
        .catch(function(err) {
          console.warn('Fetch live API unavailable, using simulation fallback:', err);
          loadFallbackData(showToastAlert);
        });
    } else {
      loadFallbackData(showToastAlert);
    }
  }

  function loadFallbackData(showToastAlert) {
    setTimeout(function() {
      var mock = generateMockData();
      processLoadedData(mock, true);
      
      if (showToastAlert) showToast('Data simulasi dimuat!', 'info');
    }, 250);
  }

  /**
   * Proses data dari spreadsheet dan hubungkan keterangan log terbaru
   */
  function processLoadedData(data, isSimulation) {
    state.dataSource = isSimulation ? 'simulation' : 'live';
    state.mobileHeaders = data.mobileHeaders || [];
    state.fixedHeaders = data.fixedHeaders || [];
    state.ecareHeaders = data.ecareHeaders || [];
    state.priorityHeaders = data.priorityHeaders || [];
    state.logs = data.logs || [];

    var mob = (data.mobileRecords || []).map(function(r) { r.serviceType = 'MOBILE'; return r; });
    var fix = (data.fixedRecords || []).map(function(r) { r.serviceType = 'FIXED'; return r; });
    var ecare = (data.ecareRecords || []).map(function(r) { r.serviceType = 'ECARE'; return r; });
    var prio = (data.priorityRecords || []).map(function(r) { r.serviceType = 'PRIORITY'; return r; });

    var allIncoming = mob.concat(fix).concat(ecare).concat(prio);

    // Hubungkan catatan in progress dan closed terbaru dari log komunikasi
    allIncoming.forEach(function(ticket) {
      enrichTicketWithLogs(ticket, state.logs);
    });

    if (data.facilitatorRouting && Array.isArray(data.facilitatorRouting) && data.facilitatorRouting.length > 0) {
      saveStoredFacilitatorRouting(data.facilitatorRouting);
    }

    // Google Spreadsheet adalah SUMBER KEBENARAN TUNGGAL (Single Source of Truth)
    // Jika data di Google Sheet dihapus, maka data di aplikasi konCHO HARUS ikut terhapus!
    if (!isSimulation) {
      var liveIds = new Set(allIncoming.map(function(r) { return String(r.id); }));
      var now = Date.now();
      // Pertahankan HANYA tiket lokal baru yang baru saja diinput pengguna < 20 detik lalu (jika GAS belum selesai append)
      var recentPendingLocal = (state.records || []).filter(function(r) {
        return r && r.id && !liveIds.has(String(r.id)) && r._localCreatedAt && (now - r._localCreatedAt < 20000);
      });
      state.records = recentPendingLocal.concat(allIncoming);
    } else {
      state.records = allIncoming;
    }

    // Urutkan tiket: yang terbaru di atas
    state.records.sort(function(a, b) {
      var dateA = new Date(a.terakhirUpdate || a.tanggalAgenda || a.tanggal || 0).getTime();
      var dateB = new Date(b.terakhirUpdate || b.tanggalAgenda || b.tanggal || 0).getTime();
      return dateB - dateA;
    });

    // Perbarui state pool per unit
    state.mobileRecords = state.records.filter(function(r) { return r.serviceType === 'MOBILE'; });
    state.fixedRecords = state.records.filter(function(r) { return r.serviceType === 'FIXED'; });
    state.ecareRecords = state.records.filter(function(r) { return r.serviceType === 'ECARE'; });
    state.priorityRecords = state.records.filter(function(r) { return r.serviceType === 'PRIORITY'; });

    saveSharedRecords(state.records);

    populateMonthDropdown();
    updateScopeLabel();
    updateKpiCounters();
    renderCaseList();

    // Render Kalender dan Tasks Table seketika agar data langsung ter-update di layar pengguna!
    if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
    if (typeof renderTasksTable === 'function') renderTasksTable();
    if (typeof updateTasksKpis === 'function') updateTasksKpis();
    if (typeof renderCalendarRightPanel === 'function' && (state.selectedDate || state.selectedDay)) {
      renderCalendarRightPanel(state.selectedDate || state.selectedDay);
    }
    if (typeof renderActivityFeed === 'function') renderActivityFeed();

    // Sinkronisasi data pengguna dari Google Sheet (Sheet Users)
    if (data.users && Array.isArray(data.users)) {
      syncStoredUsersFromSheet(data.users);
    }
  }

  /**
   * Menghubungkan tiket dengan log terbaru untuk In Progress & Closed
   */
  function enrichTicketWithLogs(ticket, logs) {
    var ticketLogs = logs.filter(function(l) { return l.ticketId === ticket.id; });
    
    // Cari log InProgress terbaru
    var inProgLog = ticketLogs.find(function(l) { return l.statusTerkait === 'InProgress'; });
    if (inProgLog) {
      ticket.inProgressNote = inProgLog.message;
      ticket.inProgressBy = inProgLog.author;
      ticket.inProgressTime = inProgLog.timestamp;
    }

    // Cari log Closed terbaru
    var closedLog = ticketLogs.find(function(l) { return l.statusTerkait === 'Closed'; });
    if (closedLog) {
      ticket.closedNote = closedLog.message;
      ticket.closedBy = closedLog.author;
      ticket.closedTime = closedLog.timestamp;
    }
  }

  /**
   * Mengisi Opsi Dropdown Bulan secara dinamis (Tahun 2026 & Tahun 2027)
   */
  function populateMonthDropdown() {
    if (!dom.monthFilterSelect) return;

    var monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    var cur = state.activeMonthFilter || 'all';
    var html = '<option value="all">Semua Periode (Semua Bulan & Tahun)</option>';

    // Periode Tahun 2026
    html += '<optgroup label="Tahun 2026">';
    monthNames.forEach(function(m) {
      var val = m + ' 2026';
      var isSel = (cur.toLowerCase() === val.toLowerCase() || cur.toLowerCase() === m.toLowerCase());
      html += '<option value="' + val + '"' + (isSel ? ' selected' : '') + '>' + val + '</option>';
    });
    html += '</optgroup>';

    // Periode Tahun 2027
    html += '<optgroup label="Tahun 2027">';
    monthNames.forEach(function(m) {
      var val = m + ' 2027';
      var isSel = (cur.toLowerCase() === val.toLowerCase());
      html += '<option value="' + val + '"' + (isSel ? ' selected' : '') + '>' + val + '</option>';
    });
    html += '</optgroup>';

    dom.monthFilterSelect.innerHTML = html;
  }

  /**
   * Hitung dan Update Angka pada Status KPI di Sidebar Kiri
   */
  function updateKpiCounters() {
    var monthFilter = state.activeMonthFilter;
    var scope = state.activeServiceScope;

    var counts = {
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0
    };

    state.records.forEach(function(item) {
      if (!itemMatchesMonth(item, monthFilter)) return;
      if (scope === 'MOBILE' && item.serviceType !== 'MOBILE') return;
      if (scope === 'FIXED' && item.serviceType !== 'FIXED') return;
      if (scope === 'ECARE' && item.serviceType !== 'ECARE') return;
      if (scope === 'PRIORITY' && item.serviceType !== 'PRIORITY') return;

      counts.total++;
      if (itemMatchesStatus(item, 'Open')) counts.open++;
      else if (itemMatchesStatus(item, 'InProgress')) counts.inProgress++;
      else if (itemMatchesStatus(item, 'Closed')) counts.closed++;
    });

    if (dom.countTotal) dom.countTotal.textContent = counts.total;
    if (dom.countOpen) dom.countOpen.textContent = counts.open;
    if (dom.countInProgress) dom.countInProgress.textContent = counts.inProgress;
    if (dom.countClosed) dom.countClosed.textContent = counts.closed;
  }

  /**
   * Helper: Filter Pemeriksaan Bulan & Tahun (Mendukung 2026 & 2027)
   */
  function itemMatchesMonth(item, selectedMonth) {
    if (!selectedMonth || selectedMonth === 'all') return true;
    var sel = selectedMonth.toLowerCase().trim();
    var b = String(item.bulan || '').toLowerCase().trim();
    var tgl = String(item.tanggal || '').toLowerCase().trim();
    var det = String(item.detail || '').toLowerCase();
    var isu = String(item.totalCaseIsu || '').toLowerCase();

    // Cek filter spesifik tahun (2026 vs 2027)
    var filterHas2027 = sel.indexOf('2027') >= 0 || sel.indexOf('-27') >= 0;
    var filterHas2026 = sel.indexOf('2026') >= 0 || sel.indexOf('-26') >= 0;

    var itemIs2027 = b.indexOf('2027') >= 0 || tgl.indexOf('2027') >= 0 || b.indexOf('-27') >= 0 || tgl.indexOf('-27') >= 0;

    if (filterHas2027 && !itemIs2027) return false;
    if (filterHas2026 && itemIs2027) return false;

    // Kamus Lengkap Alias dan Singkatan Bulan (Januari s/d Desember)
    var MONTH_ALIASES = {
      'januari': ['januari', 'january', 'jan', '01/', '/01/', '-01-'],
      'februari': ['februari', 'february', 'feb', '02/', '/02/', '-02-'],
      'maret': ['maret', 'march', 'mar', '03/', '/03/', '-03-'],
      'april': ['april', 'apr', '04/', '/04/', '-04-'],
      'mei': ['mei', 'may', '05/', '/05/', '-05-'],
      'juni': ['juni', 'june', 'jun', '06/', '/06/', '-06-'],
      'juli': ['juli', 'july', 'jul', '07/', '/07/', '-07-'],
      'agustus': ['agustus', 'august', 'agu', 'agt', 'aug', '08/', '/08/', '-08-'],
      'september': ['september', 'sep', 'sept', '09/', '/09/', '-09-'],
      'oktober': ['oktober', 'october', 'okt', 'oct', '10/', '/10/', '-10-'],
      'november': ['november', 'nov', '11/', '/11/', '-11-'],
      'desember': ['desember', 'december', 'des', 'dec', '12/', '/12/', '-12-']
    };

    var targetKey = '';
    for (var k in MONTH_ALIASES) {
      if (sel.indexOf(k) >= 0) {
        targetKey = k;
        break;
      }
    }

    if (targetKey && MONTH_ALIASES[targetKey]) {
      var aliases = MONTH_ALIASES[targetKey];
      for (var i = 0; i < aliases.length; i++) {
        var a = aliases[i];
        if (b.indexOf(a) >= 0 || tgl.indexOf(a) >= 0) return true;
      }
      for (var j = 0; j < aliases.length; j++) {
        var al = aliases[j];
        if (al.length >= 3 && (det.indexOf(al) >= 0 || isu.indexOf(al) >= 0)) return true;
      }
    }

    // Direct fallback match
    if (b.indexOf(sel) >= 0 || tgl.indexOf(sel) >= 0) return true;

    return false;
  }

  /**
   * Helper: Filter Pemeriksaan Status
   */
  function itemMatchesStatus(item, targetStatus) {
    if (!targetStatus || targetStatus === 'all') return true;
    var st = (item.status || 'Open').toLowerCase().replace(/[^a-z]/g, '');
    var target = targetStatus.toLowerCase().replace(/[^a-z]/g, '');
    if (target === 'open') return st === 'open' || st === 'new';
    if (target === 'inprogress') return st.indexOf('progress') >= 0;
    if (target === 'closed') return st.indexOf('close') >= 0 || st.indexOf('solve') >= 0 || st.indexOf('selesai') >= 0;
    return st === target;
  }

  /**
   * =========================================================================
   * RENDER UTAMA: SEMUA KASUS DI DALAM SATU CARD BESAR TUNGGAL
   * (Kasus 1, 2, dst dibuat dalam satu card terpadu yang rapi)
   * =========================================================================
   */
  function renderCaseList() {
    var filtered = state.records.filter(function(item) {
      // 1. Filter Periode Bulan
      if (!itemMatchesMonth(item, state.activeMonthFilter)) return false;

      // 2. Filter Layanan (Mobile vs Fixed vs eCare vs Priority vs Semua)
      if (state.activeServiceScope === 'MOBILE' && item.serviceType !== 'MOBILE') return false;
      if (state.activeServiceScope === 'FIXED' && item.serviceType !== 'FIXED') return false;
      if (state.activeServiceScope === 'ECARE' && item.serviceType !== 'ECARE') return false;
      if (state.activeServiceScope === 'PRIORITY' && item.serviceType !== 'PRIORITY') return false;

      // 3. Filter Status (All, Open, InProgress, Closed)
      if (state.activeStatusFilter && state.activeStatusFilter !== 'all') {
        if (!itemMatchesStatus(item, state.activeStatusFilter)) return false;
      }

      // 4. Pencarian Teks
      if (state.searchQuery) {
        var q = state.searchQuery;
        var match = (item.id || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.totalCaseIsu || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.requestor || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.followUpTo || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.nama || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.nomorLayanan || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.status || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.detail || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.inProgressNote || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.closedNote || '').toLowerCase().indexOf(q) >= 0 ||
                    (item.closedBy || '').toLowerCase().indexOf(q) >= 0;
        if (!match) return false;
      }

      return true;
    });

    // Update Header & Footer: 'Kasus' diganti 'Case'
    if (dom.caseCountBadge) {
      dom.caseCountBadge.textContent = filtered.length + ' Case Ditemukan';
    }
    if (dom.footerSummaryText) {
      var srvLabel = state.activeServiceScope === 'ALL' ? 'Semua Unit' : (state.activeServiceScope === 'MOBILE' ? 'CHO Mobile' : (state.activeServiceScope === 'ECARE' ? 'CHO eCare' : (state.activeServiceScope === 'PRIORITY' ? 'CHO Priority' : 'CHO Fixed')));
      var monthLabel = state.activeMonthFilter === 'all' ? 'Semua Periode (Jan - Des)' : state.activeMonthFilter;
      dom.footerSummaryText.textContent = 'Menampilkan ' + filtered.length + ' case • ' + srvLabel + ' • Periode: ' + monthLabel;
    }

    if (filtered.length === 0) {
      dom.caseListContainer.innerHTML = 
        '<div class="empty-card-state">' +
          '<div class="empty-icon">🔍</div>' +
          '<div class="empty-title">Tidak ada case yang sesuai kriteria filter</div>' +
          '<div class="empty-desc">Coba sesuaikan pilihan Unit, Periode Bulan, atau Status di sidebar sebelah kiri.<br>' +
          '<button id="btnQuickAllMonths" style="margin-top:12px; padding:6px 14px; background:var(--primary-color); color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px;">📅 Tampilkan Semua Bulan (Jan - Des)</button>' +
          '</div>' +
        '</div>';
      var btnAll = document.getElementById('btnQuickAllMonths');
      if (btnAll) {
        btnAll.addEventListener('click', function() {
          state.activeMonthFilter = 'all';
          state.activeStatusFilter = 'all';
          if (dom.monthFilterSelect) dom.monthFilterSelect.value = 'all';
          dom.kpiNavBtns.forEach(function(b) { b.classList.remove('active'); });
          if (dom.pillTotal) dom.pillTotal.classList.add('active');
          updateScopeLabel();
          updateKpiCounters();
          renderCaseList();
        });
      }
      return;
    }

    var html = '';

    // =========================================================================
    // BERANDA EXECUTIVE KPI SUMMARY CARDS
    // Tampil untuk memantau secara keseluruhan berapa yang Open, In Progress, Closed
    // =========================================================================
    var totalAll = filtered.length;
    var openCount = filtered.filter(function(i) { return itemMatchesStatus(i, 'Open'); }).length;
    var inprogCount = filtered.filter(function(i) { return itemMatchesStatus(i, 'InProgress'); }).length;
    var closedCount = filtered.filter(function(i) { return itemMatchesStatus(i, 'Closed'); }).length;

    var openMob = filtered.filter(function(i) { return i.serviceType === 'MOBILE' && itemMatchesStatus(i, 'Open'); }).length;
    var openFix = filtered.filter(function(i) { return i.serviceType === 'FIXED' && itemMatchesStatus(i, 'Open'); }).length;
    var openEc = filtered.filter(function(i) { return i.serviceType === 'ECARE' && itemMatchesStatus(i, 'Open'); }).length;
    var openPrio = filtered.filter(function(i) { return i.serviceType === 'PRIORITY' && itemMatchesStatus(i, 'Open'); }).length;

    var inprogMob = filtered.filter(function(i) { return i.serviceType === 'MOBILE' && itemMatchesStatus(i, 'InProgress'); }).length;
    var inprogFix = filtered.filter(function(i) { return i.serviceType === 'FIXED' && itemMatchesStatus(i, 'InProgress'); }).length;
    var inprogEc = filtered.filter(function(i) { return i.serviceType === 'ECARE' && itemMatchesStatus(i, 'InProgress'); }).length;
    var inprogPrio = filtered.filter(function(i) { return i.serviceType === 'PRIORITY' && itemMatchesStatus(i, 'InProgress'); }).length;

    var closedMob = filtered.filter(function(i) { return i.serviceType === 'MOBILE' && itemMatchesStatus(i, 'Closed'); }).length;
    var closedFix = filtered.filter(function(i) { return i.serviceType === 'FIXED' && itemMatchesStatus(i, 'Closed'); }).length;
    var closedEc = filtered.filter(function(i) { return i.serviceType === 'ECARE' && itemMatchesStatus(i, 'Closed'); }).length;
    var closedPrio = filtered.filter(function(i) { return i.serviceType === 'PRIORITY' && itemMatchesStatus(i, 'Closed'); }).length;

    html += '<div class="beranda-kpi-grid">';
    html += '<div class="beranda-kpi-card kpi-card-total" data-quick-filter="all" title="Klik untuk menampilkan semua kasus">';
    html += '<div class="beranda-kpi-title"><span>🏠 Beranda (Total Case)</span><span style="font-size:14px;">📦</span></div>';
    html += '<div class="beranda-kpi-num">' + totalAll + '</div>';
    html += '<div class="beranda-kpi-sub">Konsolidasi CHO Mobile, Fixed, eCare &amp; Priority</div>';
    html += '</div>';

    html += '<div class="beranda-kpi-card kpi-card-open" data-quick-filter="Open" title="Klik untuk filter kasus Open">';
    html += '<div class="beranda-kpi-title"><span>🟡 Open (Kolom H)</span><span style="font-size:12px;">⏳</span></div>';
    html += '<div class="beranda-kpi-num">' + openCount + '</div>';
    html += '<div class="beranda-kpi-sub">' + openMob + ' Mobile • ' + openFix + ' Fixed • ' + openEc + ' eCare • ' + openPrio + ' Priority</div>';
    html += '</div>';

    html += '<div class="beranda-kpi-card kpi-card-inprog" data-quick-filter="InProgress" title="Klik untuk filter kasus In Progress">';
    html += '<div class="beranda-kpi-title"><span>🔵 In Progress (Kolom H)</span><span style="font-size:12px;">⚙️</span></div>';
    html += '<div class="beranda-kpi-num">' + inprogCount + '</div>';
    html += '<div class="beranda-kpi-sub">' + inprogMob + ' Mobile • ' + inprogFix + ' Fixed • ' + inprogEc + ' eCare • ' + inprogPrio + ' Priority</div>';
    html += '</div>';

    html += '<div class="beranda-kpi-card kpi-card-closed" data-quick-filter="Closed" title="Klik untuk filter kasus Closed">';
    html += '<div class="beranda-kpi-title"><span>🟢 Closed (Kolom H)</span><span style="font-size:12px;">✅</span></div>';
    html += '<div class="beranda-kpi-num">' + closedCount + '</div>';
    html += '<div class="beranda-kpi-sub">' + closedMob + ' Mobile • ' + closedFix + ' Fixed • ' + closedEc + ' eCare • ' + closedPrio + ' Priority</div>';
    html += '</div>';
    html += '</div>';

    // =========================================================================
    // JIKA DALAM TAMPILAN HOME: TAMPILKAN LIST SPREADSHEET
    // Kolom: No, Bulan, Unit, Main Issue, Status, Status Update
    // =========================================================================
    if (state.currentView === 'home') {
      html += renderHomeSheetTable(filtered);
      dom.caseListContainer.innerHTML = html;
      attachCardActionHandlers();
      return;
    }

    // =========================================================================
    // JIKA DALAM TAMPILAN DETAIL CASE: TAMPILKAN KARTU CASE LENGKAP
    // =========================================================================
    var isBerandaMode = (!state.activeStatusFilter || state.activeStatusFilter === 'all');

    filtered.forEach(function(item) {
      var srvClass = item.serviceType === 'MOBILE' ? 'mobile' : (item.serviceType === 'ECARE' ? 'ecare' : (item.serviceType === 'PRIORITY' ? 'priority' : 'fixed'));
      var stNorm = (item.status || 'Open').toLowerCase().replace(/[^a-z]/g, '');
      var statusKey = 'open';
      var statusLabel = 'Open';
      var cardStatusClass = 'status-open';

      if (stNorm.indexOf('progress') >= 0) {
        statusKey = 'inprogress';
        statusLabel = 'In Progress';
        cardStatusClass = 'status-inprogress';
      } else if (stNorm.indexOf('close') >= 0 || stNorm.indexOf('solve') >= 0 || stNorm.indexOf('selesai') >= 0) {
        statusKey = 'closed';
        statusLabel = 'Closed';
        cardStatusClass = 'status-closed';
      }

      var ticketLogs = state.logs.filter(function(l) { return l.ticketId === item.id; });
      var logCount = ticketLogs.length;

      // KOTAK PEMBEDA SETIAP CASE (Diberi border, background card, dan jarak pemisah antar case)
      html += '<div class="case-item-row ' + cardStatusClass + '" data-id="' + escapeHtml(item.id) + '" data-service="' + item.serviceType + '">';

      // 1. Header Kotak Case: Case #X, Unit (CHO Mobile/Fixed), Periode Bulan, Status Badge (Open/InProgress/Closed)
      html += '<div class="case-row-header">';
      html += '  <div class="case-row-badges">';
      html += '    <span class="badge-id">Case #' + escapeHtml(item.id) + '</span>';
      html += '    <span class="badge-srv ' + srvClass + '">CHO ' + item.serviceType + '</span>';
      if (item.bulan) {
        html += '    <span class="badge-month">📅 ' + escapeHtml(item.bulan) + '</span>';
      }
      html += '    <span class="badge-status-pill ' + statusKey + '">' + statusLabel + '</span>';
      html += '  </div>';

      html += '  <div class="case-row-time">';
      html += '    <span>Terakhir Update: <strong>' + formatDisplayTime(item.terakhirUpdate || item.tanggal) + '</strong></span>';
      html += '  </div>';
      html += '</div>';

      // 2. Main Issue (Kolom C) - Judul Utama Isu Kasus
      var currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
      var canUploadPpt = currentRole === 'Administrator' || currentRole === 'Inputer';
      var isAdmin = currentRole === 'Administrator';
      var pptInfo = getCasePptAttachment(item.serviceType, item.id);

      html += '<div class="case-col-c-box">';
      html += '  <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">';
      html += '    <div style="display:flex; align-items:center; gap:6px;">';
      html += '      <span class="col-indicator-tag tag-col-c">Kolom C • Main Issue</span>';
      html += '    </div>';
      if (pptInfo && pptInfo.fileUrl) {
        html += '    <div style="display:flex; align-items:center; gap:6px;">';
        html += '      <a href="' + escapeHtml(pptInfo.fileUrl) + '" target="_blank" rel="noopener noreferrer" class="btn-ppt-view" title="Buka File di Google Drive: ' + escapeHtml(pptInfo.fileName || 'Materi PPT') + '">';
        html += '        <span class="ppt-icon">📊</span>';
        html += '        <span class="ppt-text">' + escapeHtml(pptInfo.fileName || 'Materi PPT') + '</span>';
        html += '        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
        html += '      </a>';
        if (canUploadPpt) {
          html += '      <button type="button" class="btn-ppt-reupload" onclick="openUploadPptModal(\'' + escapeHtml(item.id) + '\', \'' + item.serviceType + '\')" title="Ganti / Upload Ulang File PPT">✏️ Ganti</button>';
        }
        if (isAdmin) {
          html += '      <button type="button" class="btn-ppt-delete" onclick="handleDeletePpt(\'' + escapeHtml(item.id) + '\', \'' + item.serviceType + '\')" title="Hapus File PPT">🗑️ Hapus</button>';
        }
        html += '    </div>';
      } else if (canUploadPpt) {
        html += '    <button type="button" class="btn-ppt-upload" onclick="openUploadPptModal(\'' + escapeHtml(item.id) + '\', \'' + item.serviceType + '\')" title="Upload File PPT ke Google Drive untuk kasus ini">';
        html += '      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
        html += '      <span>+ Upload PDF</span>';
        html += '    </button>';
      } else {
        html += '    <span class="ppt-empty-badge" title="Materi PPT belum diunggah">- Belum Ada PDF -</span>';
      }
      html += '  </div>';
      html += '  <div class="case-row-title" style="font-size:16px; font-weight:800; color:var(--text-primary); margin-top:4px;">' + escapeHtml(item.totalCaseIsu || 'Isu Case CHO') + '</div>';
      html += '</div>';

      // 2.5. Issue Details (Kolom D) - Deskripsi Detail Kasus Isu
      var issueDetailsVal = item.issueDetails || item.detail || item.keterangan || '-';
      html += '<div class="case-col-d-box">';
      html += '  <div class="col-d-header">';
      html += '    <span class="col-indicator-tag tag-col-d">Kolom D • Issue Details</span>';
      html += '  </div>';
      html += '  <div class="col-d-text">' + escapeHtml(issueDetailsVal) + '</div>';
      html += '</div>';

      // 3. Status Update (Kolom J) - Catatan Tindak Lanjut Terkini
      var statusUpdateText = item.statusInformasi || item.statusUpdate || (statusKey === 'open' ? 'Belum Ada Update' : 'Update Sedang Berjalan');
      var updateContent = item.inProgressNote || item.closedNote || item.progress || item.detail || 'Belum ada catatan update pada kolom J.';
      var isNewUpdate = statusUpdateText === 'Ada Update Baru' || (statusKey === 'inprogress');

      html += '<div class="case-col-j-box">';
      html += '  <div class="col-j-header">';
      html += '    <div class="col-j-left">';
      html += '      <span class="col-indicator-tag tag-col-j">Kolom J • Status Update</span>';
      html += '      <span class="col-j-pill ' + (isNewUpdate ? 'has-new-update' : '') + '">' + escapeHtml(statusUpdateText) + '</span>';
      if (statusKey === 'inprogress') {
        var progBy = item.inProgressBy || item.pic || 'PIC Lapangan';
        html += '      <span style="font-size:11px; color:var(--text-muted);">PIC: <strong>' + escapeHtml(progBy) + '</strong></span>';
      } else if (statusKey === 'closed') {
        var clBy = item.closedBy || item.pic || 'CHO Team';
        html += '      <span style="font-size:11px; color:var(--text-muted);">Di-Closed: <strong>' + escapeHtml(clBy) + '</strong></span>';
      }
      html += '    </div>';
      html += '    <div class="col-j-time">';
      html += '      Waktu: <strong>' + formatDisplayTime(item.terakhirUpdate || item.tanggal) + '</strong>';
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="col-j-text">' + escapeHtml(updateContent) + '</div>';
      html += '</div>';

      // 4. Metadata Detail (Requestor Kolom G & Follow Up To Kolom I & Akun):
      // Pada mode Beranda dibuat ringkas / toggleable agar tampilan tetap simple dan fokus.
      var reqVal = item.requestor && item.requestor !== '-' ? item.requestor : 'Belum Diisi';
      var followVal = item.followUpTo && item.followUpTo !== '-' ? item.followUpTo : 'Belum Ditentukan';
      var detailId = 'detailBox_' + item.id;

      if (!isBerandaMode) {
        // Tampilan Lengkap Saat Di Tab Status (Open / In Progress / Closed)
        html += '<div class="case-row-meta">';
        html += '  <div class="meta-item"><span style="font-size:12px;">👤</span> Requestor (Kol. G): <strong>' + escapeHtml(reqVal) + '</strong></div>';
        html += '  <div class="meta-item followup"><span style="font-size:12px;">👥</span> Follow Up To (Kol. I): <strong>' + escapeHtml(followVal) + '</strong></div>';
        if (item.nomorLayanan && item.nomorLayanan !== '-') {
          html += '  <div class="meta-item"><span style="font-size:12px;">💳</span> Akun: <strong>' + escapeHtml(item.nomorLayanan) + '</strong> ' + (item.nama && item.nama !== '-' ? '(' + escapeHtml(item.nama) + ')' : '') + '</div>';
        }
        html += '</div>';
      } else {
        // Pada Beranda: Ringkas dengan toggle opsional jika ingin melihat requestor/akun
        html += '<div id="' + detailId + '" class="case-row-meta" style="display:none; margin-top:2px; padding-top:8px; border-top:1px dashed var(--border-color);">';
        html += '  <div class="meta-item"><span style="font-size:12px;">👤</span> Requestor: <strong>' + escapeHtml(reqVal) + '</strong></div>';
        html += '  <div class="meta-item followup"><span style="font-size:12px;">👥</span> Follow Up To: <strong>' + escapeHtml(followVal) + '</strong></div>';
        if (item.nomorLayanan && item.nomorLayanan !== '-') {
          html += '  <div class="meta-item"><span style="font-size:12px;">💳</span> Akun: <strong>' + escapeHtml(item.nomorLayanan) + '</strong> ' + (item.nama && item.nama !== '-' ? '(' + escapeHtml(item.nama) + ')' : '') + '</div>';
        }
        html += '</div>';
      }

      // 5. Tombol Aksi Langsung pada Kotak Case
      html += '<div class="case-row-actions">';
      html += '  <div class="action-primary-group">';
      if (isBerandaMode) {
        html += '    <button type="button" class="btn-toggle-details" onclick="var el=document.getElementById(\'' + detailId + '\'); if(el) el.style.display=(el.style.display===\'none\' || !el.style.display)?\'flex\':\'none\';"><span>ℹ️ Detail Info</span></button>';
      }

      var currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';

      if (currentRole === 'Inputer') {
        // Role Inputer: HANYA BISA INPUT DATA, TIDAK BISA EDIT!
        html += '<span class="badge-role-readonly" title="Role Inputer hanya berwenang menambah kasus baru, tidak dapat mengubah status.">';
        html += '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        html += '<span>Mode Inputer (Hanya Baca • Akses Edit Dibatasi)</span>';
        html += '</span>';
      } else if (currentRole === 'Viewer') {
        // Role Viewer: HANYA BISA MELIHAT DATA, TIDAK BISA INPUT ATAU EDIT!
        html += '<span class="badge-role-readonly" title="Role Viewer hanya berwenang memantau seluruh data tanpa hak input maupun edit.">';
        html += '👁️ <span>Mode Viewer (Read-Only • Hanya Melihat)</span>';
        html += '</span>';
      } else {
        // Role Administrator & Facilitator: BISA UPDATE STATUS SAMPAI CLOSED!
        if (statusKey === 'open') {
          html += '<button class="btn-act btn-act-inprogress btn-trigger-inprog" data-id="' + escapeHtml(item.id) + '">';
          html += '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
          html += '<span>Proses (In Progress)</span>';
          html += '</button>';

          html += '<button class="btn-act btn-act-closed btn-trigger-closed" data-id="' + escapeHtml(item.id) + '">';
          html += '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
          html += '<span>Selesaikan (Closed)</span>';
          html += '</button>';
        } else if (statusKey === 'inprogress') {
          html += '<button class="btn-act btn-act-closed btn-trigger-closed" data-id="' + escapeHtml(item.id) + '">';
          html += '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
          html += '<span>Selesaikan Kasus (Closed)</span>';
          html += '</button>';

          html += '<button class="btn-act btn-act-update btn-trigger-inprog" data-id="' + escapeHtml(item.id) + '" data-update="true">';
          html += '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
          html += '<span>+ Update Keterangan</span>';
          html += '</button>';

          html += '<button class="btn-act btn-act-reopen btn-trigger-reopen" data-id="' + escapeHtml(item.id) + '" data-target="Open">';
          html += '<span>↩️ Buka Kembali ke Open</span>';
          html += '</button>';
        } else if (statusKey === 'closed') {
          html += '<span style="font-size:12.5px; font-weight:700; color:var(--status-closed-color); display:inline-flex; align-items:center; gap:5px; margin-right:4px;">';
          html += '✓ Case Telah Ditutup';
          html += '</span>';

          html += '<button class="btn-act btn-act-reopen btn-trigger-reopen" data-id="' + escapeHtml(item.id) + '" data-target="InProgress">';
          html += '<span>🔄 Buka Kembali (Reopen)</span>';
          html += '</button>';
        }
      }

      html += '</div>';

      // Secondary Actions: Riwayat Log & Salin
      html += '<div class="action-secondary-group">';
      html += '<button class="btn-act btn-act-log btn-trigger-log" data-id="' + escapeHtml(item.id) + '" title="Lihat Riwayat Lengkap">';
      html += '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      html += '<span>Riwayat Log (' + logCount + ')</span>';
      html += '</button>';

      html += '<button class="btn-act btn-act-log btn-trigger-copy" data-id="' + escapeHtml(item.id) + '" title="Salin Ringkasan Kasus">';
      html += '<span>📋 Salin</span>';
      html += '</button>';

      html += '</div>';
      html += '</div>';

      html += '</div>'; // End case-item-row
    });

    dom.caseListContainer.innerHTML = html;
    attachCardActionHandlers();
  }

  /**
   * =========================================================================
   * RENDER HOME SHEET TABLE
   * Tabel bergaya spreadsheet konsolidasi isu CHO:
   * 1. No
   * 2. Bulan (Kolom B)
   * 3. Unit (Pembeda CHO Mobile vs CHO Fixed)
   * 4. Main Issue (Kolom C)
   * 5. Issue Details (Kolom D)
   * 6. Status (Kolom H)
   * 7. Status Update (Kolom J)
   * =========================================================================
   */
  function renderHomeSheetTable(items) {
    if (!items || items.length === 0) {
      return '<div class="empty-card-state" style="margin-top:16px;">' +
        '<div class="empty-icon">📁</div>' +
        '<div class="empty-title">Tidak ada data case isu pada Home</div>' +
        '<div class="empty-desc">Tidak ada data case yang sesuai dengan filter Unit (' + escapeHtml(state.activeServiceScope) + ') atau Periode saat ini.</div>' +
        '</div>';
    }

    var currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    var canUpdate = currentRole !== 'Inputer' && currentRole !== 'Viewer';

    var html = '<div class="home-sheet-container">';
    html += '<div class="home-sheet-card">';
    html += '  <div class="mobile-table-scroll-hint"><span class="hint-icon">👉</span><span>Geser tabel ke samping untuk melihat rincian &amp; status</span></div>';
    html += '  <div class="home-table-responsive">';
    html += '    <table class="home-sheet-table">';
    html += '      <thead>';
    html += '        <tr>';
    html += '          <th style="width: 50px; text-align: center;">No</th>';
    html += '          <th style="width: 135px; text-align: center;">Bulan</th>';
    html += '          <th style="width: 130px; text-align: center;">Tanggal (Kolom K)</th>';
    html += '          <th style="width: 140px; min-width: 140px; text-align: center;">Unit</th>';
    html += '          <th style="min-width: 240px;">Main Issue (Kolom C)</th>';
    html += '          <th style="width: 155px; min-width: 155px; text-align: center;">Materi PPT (Drive)</th>';
    html += '          <th style="min-width: 270px;">Issue Details (Kolom D)</th>';
    html += '          <th style="width: 135px; text-align: center;">Status (Kolom H)</th>';
    html += '          <th style="min-width: 260px;">Status Update (Kolom J)</th>';
    html += '        </tr>';
    html += '      </thead>';
    html += '      <tbody>';

    items.forEach(function(item, idx) {
      var isMobile = item.serviceType === 'MOBILE';
      var isEcare = item.serviceType === 'ECARE';
      var isPriority = item.serviceType === 'PRIORITY';
      var srvLabel = isMobile ? 'CHO Mobile' : (isEcare ? 'CHO eCare' : (isPriority ? 'CHO Priority' : 'CHO Fixed'));
      var srvClass = isMobile ? 'mobile' : (isEcare ? 'ecare' : (isPriority ? 'priority' : 'fixed'));

      var stNorm = (item.status || 'Open').toLowerCase().replace(/[^a-z]/g, '');
      var statusKey = 'open';
      var statusLabel = 'Open';
      if (stNorm.indexOf('progress') >= 0) {
        statusKey = 'inprogress';
        statusLabel = 'In Progress';
      } else if (stNorm.indexOf('close') >= 0 || stNorm.indexOf('solve') >= 0 || stNorm.indexOf('selesai') >= 0) {
        statusKey = 'closed';
        statusLabel = 'Closed';
      }

      var mainIssueText = item.totalCaseIsu || item.mainIssue || '-';
      var issueDetailsText = item.issueDetails || item.detail || item.keterangan || '-';

      // Status Update (Kolom J)
      var statusUpdateText = item.statusInformasi || item.statusUpdate || item.inProgressNote || item.closedNote || item.progress || (statusKey === 'open' ? 'Belum Ada Update' : 'Update Sedang Berjalan');

      var detailBoxId = 'issueDetailBox_' + item.serviceType + '_' + item.id;
      var isLongDetail = (issueDetailsText && (issueDetailsText.length > 110 || issueDetailsText.indexOf('\n') >= 0));

      var updateBoxId = 'statusUpdateBox_' + item.serviceType + '_' + item.id;
      var isLongUpdate = (statusUpdateText && (statusUpdateText.length > 110 || statusUpdateText.indexOf('\n') >= 0));

      html += '        <tr class="home-sheet-row" data-id="' + escapeHtml(item.id) + '" data-service="' + item.serviceType + '">';
      html += '          <td style="text-align: center; font-weight: 700; color: var(--text-muted);">' + (idx + 1) + '</td>';
      html += '          <td style="text-align: center;">';
      html += '            <span class="badge-month-pill">📅 ' + escapeHtml(item.bulan || 'Oktober 2026') + '</span>';
      html += '          </td>';
      html += '          <td style="text-align: center; white-space: nowrap;">';
      html += '            <span class="badge-month-pill">🗓️ ' + escapeHtml(formatShortIndoDate(item.tanggal || item.terakhirUpdate) || '-') + '</span>';
      html += '          </td>';
      html += '          <td style="text-align: center; white-space: nowrap;">';
      html += '            <span class="badge-srv ' + srvClass + '">' + escapeHtml(srvLabel) + '</span>';
      html += '          </td>';
      html += '          <td class="home-col-main-issue">';
      html += '            <div class="main-issue-title">' + escapeHtml(mainIssueText) + '</div>';
      html += '          </td>';

      var canUploadPpt = currentRole === 'Administrator' || currentRole === 'Inputer';
      var isAdmin = currentRole === 'Administrator';
      var pptInfo = getCasePptAttachment(item.serviceType, item.id);

      html += '          <td class="home-col-ppt">';
      if (pptInfo && pptInfo.fileUrl) {
        html += '            <div class="ppt-cell-wrap">';
        html += '              <a href="' + escapeHtml(pptInfo.fileUrl) + '" target="_blank" rel="noopener noreferrer" class="btn-ppt-view" title="Buka File di Google Drive: ' + escapeHtml(pptInfo.fileName || 'Materi PPT') + '">';
        html += '                <span class="ppt-icon">📊</span>';
        html += '                <span class="ppt-text">' + escapeHtml(pptInfo.fileName || 'Lihat PPT') + '</span>';
        html += '                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
        html += '              </a>';
        if (canUploadPpt || isAdmin) {
          html += '              <div class="btn-ppt-actions">';
          if (canUploadPpt) {
            html += '                <button type="button" class="btn-ppt-reupload" onclick="openUploadPptModal(\'' + escapeHtml(item.id) + '\', \'' + item.serviceType + '\')" title="Ganti / Upload Ulang File PPT">✏️ Ganti</button>';
          }
          if (isAdmin) {
            html += '                <button type="button" class="btn-ppt-delete" onclick="handleDeletePpt(\'' + escapeHtml(item.id) + '\', \'' + item.serviceType + '\')" title="Hapus File PPT">🗑️ Hapus</button>';
          }
          html += '              </div>';
        }
        html += '            </div>';
      } else {
        if (canUploadPpt) {
          html += '            <button type="button" class="btn-ppt-upload" onclick="openUploadPptModal(\'' + escapeHtml(item.id) + '\', \'' + item.serviceType + '\')" title="Upload File PPT ke Google Drive untuk kasus ini">';
          html += '              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
          html += '              <span>+ Upload PDF</span>';
          html += '            </button>';
        } else {
          html += '            <span class="ppt-empty-badge" title="Belum ada file PPT diunggah">- Belum Ada PDF -</span>';
        }
      }
      html += '          </td>';
      html += '          <td class="home-col-issue-details">';
      html += '            <div class="issue-details-text" id="' + detailBoxId + '" title="Tarik/geser sudut kanan bawah ke bawah untuk memperbesar kotak">' + escapeHtml(issueDetailsText) + '</div>';
      if (isLongDetail) {
        html += '            <div class="issue-details-expand-wrap">';
        html += '              <button type="button" class="btn-expand-cell" onclick="toggleCellExpand(\'' + detailBoxId + '\', this)" title="Klik untuk membuka/menutup seluruh isi tulisan">';
        html += '                <span>↕️ Buka Semua / Geser</span>';
        html += '              </button>';
        html += '            </div>';
      }
      html += '          </td>';
      html += '          <td style="text-align: center;">';
      if (canUpdate) {
        if (statusKey === 'open') {
          html += '            <span class="badge-status-pill ' + statusKey + ' btn-trigger-inprog" data-id="' + escapeHtml(item.id) + '" style="cursor:pointer;" title="Klik untuk proses (In Progress)">' + escapeHtml(statusLabel) + ' ✏️</span>';
        } else if (statusKey === 'inprogress') {
          html += '            <span class="badge-status-pill ' + statusKey + ' btn-trigger-closed" data-id="' + escapeHtml(item.id) + '" style="cursor:pointer;" title="Klik untuk selesaikan (Closed)">' + escapeHtml(statusLabel) + ' ✏️</span>';
        } else {
          html += '            <span class="badge-status-pill ' + statusKey + ' btn-trigger-reopen" data-id="' + escapeHtml(item.id) + '" style="cursor:pointer;" title="Klik untuk buka kembali">' + escapeHtml(statusLabel) + '</span>';
        }
      } else {
        html += '            <span class="badge-status-pill ' + statusKey + '">' + escapeHtml(statusLabel) + '</span>';
      }
      html += '          </td>';
      html += '          <td class="home-col-status-update">';
      html += '            <div class="status-update-text" id="' + updateBoxId + '" title="Tarik/geser sudut kanan bawah ke bawah untuk memperbesar kotak">' + escapeHtml(statusUpdateText) + '</div>';
      if (isLongUpdate) {
        html += '            <div class="issue-details-expand-wrap">';
        html += '              <button type="button" class="btn-expand-cell" onclick="toggleCellExpand(\'' + updateBoxId + '\', this)" title="Klik untuk membuka/menutup seluruh isi tulisan">';
        html += '                <span>↕️ Buka Semua / Geser</span>';
        html += '              </button>';
        html += '            </div>';
      }
      html += '          </td>';
      html += '        </tr>';
    });

    html += '      </tbody>';
    html += '    </table>';
    html += '  </div>';
    html += '</div>';
    html += '</div>';

    return html;
  }

  /**
   * Helper: Buka atau Ciutkan Kotak Teks Panjang di Home Sheet
   */
  window.toggleCellExpand = function(elId, btn) {
    var el = document.getElementById(elId);
    if (!el) return;
    if (el.getAttribute('data-expanded') === 'true') {
      el.style.maxHeight = '120px';
      el.removeAttribute('data-expanded');
      if (btn) btn.innerHTML = '<span>↕️ Buka Semua / Geser</span>';
    } else {
      el.style.maxHeight = 'none';
      el.setAttribute('data-expanded', 'true');
      if (btn) btn.innerHTML = '<span>▲ Ciutkan Kotak</span>';
    }
  };

  /**
   * Pasang Event Handler pada tombol di setiap baris kasus
   */
  function attachCardActionHandlers() {
    // 0. Quick Filter KPI Cards di Beranda
    dom.caseListContainer.querySelectorAll('.beranda-kpi-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var targetSt = card.getAttribute('data-quick-filter');
        if (!targetSt) return;
        state.activeStatusFilter = targetSt;
        dom.kpiNavBtns.forEach(function(b) {
          b.classList.remove('active');
          if (b.getAttribute('data-status') === targetSt || (targetSt === 'all' && b.id === 'pillTotal')) {
            b.classList.add('active');
          }
        });
        renderCaseList();
      });
    });

    // 1. Tombol In Progress
    dom.caseListContainer.querySelectorAll('.btn-trigger-inprog').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        var isUpdate = btn.getAttribute('data-update') === 'true';
        openInProgressModal(id, isUpdate);
      });
    });

    // 2. Tombol Closed
    dom.caseListContainer.querySelectorAll('.btn-trigger-closed').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        openClosedModal(id);
      });
    });

    // 3. Tombol Reopen
    dom.caseListContainer.querySelectorAll('.btn-trigger-reopen').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        var targetSt = btn.getAttribute('data-target') || 'Open';
        handleQuickReopen(id, targetSt);
      });
    });

    // 4. Tombol Riwayat Log
    dom.caseListContainer.querySelectorAll('.btn-trigger-log').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        openLogModal(id);
      });
    });

    // 5. Tombol Salin Ringkasan
    dom.caseListContainer.querySelectorAll('.btn-trigger-copy').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        copyCaseSummary(id);
      });
    });
  }

  /**
   * =========================================================================
   * LOGIKA FORM PENGISIAN IN PROGRESS (MODAL)
   * =========================================================================
   */
  function openInProgressModal(ticketId, isUpdateOnly, serviceType) {
    if (state.authUser && (state.authUser.role === 'Inputer' || state.authUser.role === 'Viewer')) {
      showToast('Akses ditolak: Peran ' + state.authUser.role + ' tidak berwenang mengubah status kasus.', 'error');
      return;
    }
    var ticket = state.records.find(function(r) {
      return String(r.id) === String(ticketId) && (!serviceType || r.serviceType === serviceType);
    }) || state.records.find(function(r) { return String(r.id) === String(ticketId); });
    if (!ticket) return;

    state.currentActionTicket = ticket;

        state.currentActionIsUpdate = !!isUpdateOnly;
    dom.inProgressModalTitle.textContent = isUpdateOnly ? 'Update Catatan In Progress' : 'Pick up case';
    var submitBtnSpan = dom.btnSubmitInProgress ? dom.btnSubmitInProgress.querySelector('span') : null;
    if (submitBtnSpan) {
      submitBtnSpan.textContent = isUpdateOnly ? 'Simpan Catatan In Progress' : 'Simpan & Ubah ke In Progress';
    }
    dom.inProgressTicketId.textContent = 'Case #' + ticket.id;
    dom.inProgressBadgeService.textContent = ticket.serviceType;
    dom.inProgressBadgeService.className = 'info-badge ' + (ticket.serviceType === 'MOBILE' ? 'badge-srv mobile' : (ticket.serviceType === 'ECARE' ? 'badge-srv ecare' : (ticket.serviceType === 'PRIORITY' ? 'badge-srv priority' : 'badge-srv fixed')));
    dom.inProgressRequestor.textContent = ticket.requestor || '-';
    dom.inProgressIssueText.textContent = ticket.totalCaseIsu || '-';

    dom.inProgressMessage.value = '';
    var loggedInUser = getCurrentLoggedInUserName();
    dom.inProgressAuthor.value = loggedInUser;
    dom.inProgressAuthor.readOnly = true;
    dom.inProgressAuthor.disabled = true;
    dom.inProgressFollowUp.value = ticket.followUpTo && ticket.followUpTo !== '-' ? ticket.followUpTo : '';

    dom.modalInProgress.classList.add('active');
    setTimeout(function() { dom.inProgressMessage.focus(); }, 100);
  }

  function closeInProgressModal() {
    dom.modalInProgress.classList.remove('active');
    dom.inProgressMessage.value = '';
    dom.inProgressAuthor.value = '';
    dom.inProgressFollowUp.value = '';
    state.currentActionTicket = null;
  }

  function handleSaveInProgress() {
    var ticket = state.currentActionTicket;
    if (!ticket) return;

    var message = dom.inProgressMessage.value.trim();
    var author = (dom.inProgressAuthor ? dom.inProgressAuthor.value.trim() : '') || getCurrentLoggedInUserName();
    var followUp = dom.inProgressFollowUp.value.trim();

    if (!message) {
      showToast('Harap isi Keterangan / Catatan In Progress!', 'error');
      dom.inProgressMessage.focus();
      return;
    }
    if (!author) {
      showToast('Harap isi Nama PIC / Petugas Pelaksana!', 'error');
      dom.inProgressAuthor.focus();
      return;
    }

    state.defaultAuthor = author;
    localStorage.setItem('koncho_pic_name', author);

    dom.btnSubmitInProgress.disabled = true;
    dom.btnSubmitInProgress.innerHTML = '<span>Menyimpan ke Sheet...</span>';

    var payload = {
      ticketId: ticket.id,
      serviceType: ticket.serviceType,
      author: author,
      message: message,
      newStatus: 'InProgress',
      followUpTo: followUp || ticket.followUpTo
    };

    if (state.isGasEnvironment) {
      google.script.run
        .withSuccessHandler(function(res) {
          dom.btnSubmitInProgress.disabled = false;
                    var isUpd = !!state.currentActionIsUpdate;
          var btnLabel = isUpd ? 'Simpan Catatan In Progress' : 'Simpan & Ubah ke In Progress';
          dom.btnSubmitInProgress.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>' + btnLabel + '</span>';

          if (res && res.success) {
            applyInProgressUpdateLocal(ticket, payload, res.log);
            closeInProgressModal();
                        var isUpdToast = !!state.currentActionIsUpdate;
            showToast(isUpdToast ? ('Catatan progress kasus #' + ticket.id + ' berhasil diupdate!') : ('Kasus #' + ticket.id + ' berhasil diubah ke In Progress!'), 'success');
          } else {
            showToast('Gagal update: ' + (res ? res.error : 'Unknown'), 'error');
          }
        })
        .withFailureHandler(function(err) {
          dom.btnSubmitInProgress.disabled = false;
          dom.btnSubmitInProgress.innerHTML = '<span>Simpan & Ubah ke In Progress</span>';
          showToast('Error Apps Script: ' + err.message, 'error');
        })
        .postCommunicationUpdate(payload);
    } else {
      // Sync ke Google Apps Script Web App via POST jika URL tersedia (Vercel / GitHub)
      if (state.gasApiUrl) {
        try {
          fetch(state.gasApiUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'postCommunicationUpdate', data: payload })
          });
        } catch (e) {
          console.warn('Sync POST error:', e);
        }
      }

      setTimeout(function() {
        dom.btnSubmitInProgress.disabled = false;
                  var isUpd = !!state.currentActionIsUpdate;
          var btnLabel = isUpd ? 'Simpan Catatan In Progress' : 'Simpan & Ubah ke In Progress';
          dom.btnSubmitInProgress.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>' + btnLabel + '</span>';

        var simLog = {
          logId: 'LOG-SIM-' + Math.floor(1000 + Math.random() * 9000),
          ticketId: payload.ticketId,
          serviceType: payload.serviceType,
          author: payload.author,
          message: payload.message,
          statusTerkait: 'InProgress',
          followUpTo: payload.followUpTo,
          timestamp: new Date().toISOString()
        };
        applyInProgressUpdateLocal(ticket, payload, simLog);
        closeInProgressModal();
                    var isUpdToast = !!state.currentActionIsUpdate;
            showToast(isUpdToast ? ('Catatan progress kasus #' + ticket.id + ' berhasil diupdate!') : ('Kasus #' + ticket.id + ' berhasil diubah ke In Progress!'), 'success');
      }, 350);
    }
  }

  function applyInProgressUpdateLocal(ticket, payload, logObj) {
    state.logs.unshift(logObj);
    ticket.status = 'InProgress';
    ticket.inProgressNote = payload.message;
    ticket.inProgressBy = payload.author;
    ticket.pic = payload.author || ticket.pic;
    ticket.inProgressTime = logObj.timestamp;
    if (payload.followUpTo) ticket.followUpTo = payload.followUpTo;
    ticket.terakhirUpdate = logObj.timestamp;
    ticket.statusInformasi = 'Ada Update Baru';

    updateKpiCounters();
    renderCaseList();
    if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
    if (typeof renderCalendarRightPanel === 'function' && state.selectedDate) renderCalendarRightPanel(state.selectedDate);
    if (typeof renderTasksTable === 'function') renderTasksTable();
    if (typeof updateTasksKpis === 'function') updateTasksKpis();
    if (typeof renderActivityFeed === 'function') renderActivityFeed();
    var issDrawer = document.getElementById('issue-drawer');
    if (issDrawer && issDrawer.classList.contains('drawer-open') && typeof openDrawer === 'function') {
      openDrawer(ticket.id, ticket.serviceType);
    }
  }

  /**
   * =========================================================================
   * LOGIKA FORM PENGISIAN CLOSED (MODAL)
   * (Keterangan Closed & Di-closed oleh user siapa)
   * =========================================================================
   */
  function openClosedModal(ticketId, serviceType) {
    if (state.authUser && (state.authUser.role === 'Inputer' || state.authUser.role === 'Viewer')) {
      showToast('Akses ditolak: Peran ' + state.authUser.role + ' tidak berwenang menyelesaikan/menutup status kasus.', 'error');
      return;
    }
    var ticket = state.records.find(function(r) {
      return String(r.id) === String(ticketId) && (!serviceType || r.serviceType === serviceType);
    }) || state.records.find(function(r) { return String(r.id) === String(ticketId); });
    if (!ticket) return;

    state.currentActionTicket = ticket;

    dom.closedModalTitle.textContent = 'Selesaikan Kasus (Closed)';
    dom.closedTicketId.textContent = 'Kasus #' + ticket.id;
    dom.closedBadgeService.textContent = ticket.serviceType;
    dom.closedBadgeService.className = 'info-badge ' + (ticket.serviceType === 'MOBILE' ? 'badge-srv mobile' : (ticket.serviceType === 'ECARE' ? 'badge-srv ecare' : (ticket.serviceType === 'PRIORITY' ? 'badge-srv priority' : 'badge-srv fixed')));
    dom.closedRequestor.textContent = ticket.requestor || '-';
    dom.closedIssueText.textContent = ticket.totalCaseIsu || '-';

    dom.closedMessage.value = '';
    dom.closedByUser.value = getCurrentLoggedInUserName();
    dom.closedFollowUp.value = '';

    dom.modalClosed.classList.add('active');
    setTimeout(function() { dom.closedMessage.focus(); }, 100);
  }

  function closeClosedModal() {
    dom.modalClosed.classList.remove('active');
    dom.closedMessage.value = '';
    dom.closedByUser.value = '';
    dom.closedFollowUp.value = '';
    state.currentActionTicket = null;
  }

  function handleSaveClosed() {
    var ticket = state.currentActionTicket;
    if (!ticket) return;

    var message = dom.closedMessage.value.trim();
    var closedByUser = dom.closedByUser.value.trim();
    var followUp = dom.closedFollowUp.value.trim();

    if (!message) {
      showToast('Harap isi Keterangan Closed / Solusi Penyelesaian!', 'error');
      dom.closedMessage.focus();
      return;
    }
    if (!closedByUser) {
      showToast('Harap isi nama user yang menutup tiket (Di-Closed Oleh)!', 'error');
      dom.closedByUser.focus();
      return;
    }

    state.defaultAuthor = closedByUser;
    localStorage.setItem('koncho_pic_name', closedByUser);

    dom.btnSubmitClosed.disabled = true;
    dom.btnSubmitClosed.innerHTML = '<span>Menutup Kasus di Sheet...</span>';

    var payload = {
      ticketId: ticket.id,
      serviceType: ticket.serviceType,
      author: closedByUser,
      closedBy: closedByUser,
      message: message,
      newStatus: 'Closed',
      followUpTo: followUp || ticket.followUpTo
    };

    if (state.isGasEnvironment) {
      google.script.run
        .withSuccessHandler(function(res) {
          dom.btnSubmitClosed.disabled = false;
          dom.btnSubmitClosed.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Tutup Kasus Sekarang (Closed)</span>';

          if (res && res.success) {
            applyClosedUpdateLocal(ticket, payload, res.log);
            closeClosedModal();
            showToast('Kasus #' + ticket.id + ' berhasil di-Closed oleh ' + closedByUser + '!', 'success');
          } else {
            showToast('Gagal closed: ' + (res ? res.error : 'Unknown'), 'error');
          }
        })
        .withFailureHandler(function(err) {
          dom.btnSubmitClosed.disabled = false;
          dom.btnSubmitClosed.innerHTML = '<span>Tutup Kasus Sekarang (Closed)</span>';
          showToast('Error Apps Script: ' + err.message, 'error');
        })
        .postCommunicationUpdate(payload);
    } else {
      // Sync ke Google Apps Script Web App via POST jika URL tersedia (Vercel / GitHub)
      if (state.gasApiUrl) {
        try {
          fetch(state.gasApiUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'postCommunicationUpdate', data: payload })
          });
        } catch (e) {
          console.warn('Sync POST error:', e);
        }
      }

      setTimeout(function() {
        dom.btnSubmitClosed.disabled = false;
        dom.btnSubmitClosed.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Tutup Kasus Sekarang (Closed)</span>';

        var simLog = {
          logId: 'LOG-SIM-' + Math.floor(1000 + Math.random() * 9000),
          ticketId: payload.ticketId,
          serviceType: payload.serviceType,
          author: payload.closedBy,
          message: payload.message,
          statusTerkait: 'Closed',
          followUpTo: payload.followUpTo,
          timestamp: new Date().toISOString()
        };
        applyClosedUpdateLocal(ticket, payload, simLog);
        closeClosedModal();
        showToast('Kasus #' + ticket.id + ' berhasil di-Closed oleh ' + closedByUser + '!', 'success');
      }, 350);
    }
  }

  function applyClosedUpdateLocal(ticket, payload, logObj) {
    state.logs.unshift(logObj);
    ticket.status = 'Closed';
    ticket.closedNote = payload.message;
    ticket.closedBy = payload.closedBy;
    ticket.pic = payload.closedBy || ticket.pic;
    ticket.closedTime = logObj.timestamp;
    if (payload.followUpTo) ticket.followUpTo = payload.followUpTo;
    ticket.terakhirUpdate = logObj.timestamp;
    ticket.statusInformasi = 'Closed';

    updateKpiCounters();
    renderCaseList();
    if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
    if (typeof renderCalendarRightPanel === 'function' && state.selectedDate) renderCalendarRightPanel(state.selectedDate);
    if (typeof renderTasksTable === 'function') renderTasksTable();
    if (typeof updateTasksKpis === 'function') updateTasksKpis();
    if (typeof renderActivityFeed === 'function') renderActivityFeed();
    var issDrawer = document.getElementById('issue-drawer');
    if (issDrawer && issDrawer.classList.contains('drawer-open') && typeof openDrawer === 'function') {
      openDrawer(ticket.id, ticket.serviceType);
    }
  }

  /**
   * =========================================================================
   * LOGIKA UPLOAD FILE PPT KE GOOGLE DRIVE
   * Folder Target: https://drive.google.com/drive/folders/1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV?hl=ID
   * Hanya Role Administrator & Inputer yang Berwenang Mengunggah File
   * =========================================================================
   */
  var GOOGLE_DRIVE_FOLDER_ID = '1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV';
  var GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV?hl=ID';

  function getStoredPptAttachments() {
    try {
      var raw = localStorage.getItem('koncho_ppt_attachments');
      return raw ? JSON.parse(raw) : {};
    } catch(e) {
      return {};
    }
  }

  function saveStoredPptAttachments(data) {
    try {
      localStorage.setItem('koncho_ppt_attachments', JSON.stringify(data));
    } catch(e) {}
  }

  function getCasePptAttachment(serviceType, ticketId) {
    if (!state.pptAttachments) state.pptAttachments = getStoredPptAttachments();
    var sType = serviceType || 'MOBILE';
    var key = sType + '_' + ticketId;
    if (state.pptAttachments[key]) {
      return state.pptAttachments[key];
    }
    // Fallback: check case-insensitive or ending with ticketId
    for (var k in state.pptAttachments) {
      if (k.endsWith('_' + ticketId) || k === String(ticketId)) {
        return state.pptAttachments[k];
      }
    }
    // Fallback to record in state.records
    var rec = (state.records || []).find(function(r) {
      return String(r.id) === String(ticketId);
    });
    if (rec && (rec.filePpt || rec.attachmentUrl)) {
      return {
        fileUrl: rec.filePpt || rec.attachmentUrl,
        fileName: rec.fileName || ('Sample_Case_' + ticketId + '.pdf'),
        uploadedBy: rec.uploadedBy || 'User konCHO'
      };
    }
    return null;
  }

  function openUploadPptModal(ticketId, serviceType) {
    var currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    if (currentRole !== 'Administrator' && currentRole !== 'Inputer') {
      showToast('Akses ditolak: Hanya Administrator dan Inputer yang dapat mengunggah file PPT.', 'error');
      return;
    }

    var ticket = state.records.find(function(r) {
      return String(r.id) === String(ticketId) && (!serviceType || r.serviceType === serviceType);
    });
    if (!ticket) {
      showToast('Data kasus tidak ditemukan.', 'error');
      return;
    }

    state.uploadPptTarget = {
      ticketId: ticket.id,
      serviceType: ticket.serviceType,
      record: ticket,
      day: state.selectedDate || state.selectedDay
    };
    state.selectedPptFile = null;

    if (dom.uploadPptTicketId) dom.uploadPptTicketId.textContent = 'Case #' + ticket.id;
    if (dom.uploadPptBadgeService) {
      dom.uploadPptBadgeService.textContent = ticket.serviceType;
      dom.uploadPptBadgeService.className = 'info-badge ' + (ticket.serviceType === 'MOBILE' ? 'badge-srv mobile' : (ticket.serviceType === 'ECARE' ? 'badge-srv ecare' : (ticket.serviceType === 'PRIORITY' ? 'badge-srv priority' : 'badge-srv fixed')));
    }
    if (dom.uploadPptIssueText) dom.uploadPptIssueText.textContent = ticket.totalCaseIsu || ticket.mainIssue || '-';

    // Cek apakah sudah ada file sebelumnya
    var existingPpt = getCasePptAttachment(ticket.serviceType, ticket.id);
    if (existingPpt && existingPpt.fileUrl) {
      if (dom.existingPptContainer) dom.existingPptContainer.style.display = 'block';
      if (dom.existingPptLink) {
        dom.existingPptLink.href = existingPpt.fileUrl;
        dom.existingPptLink.textContent = existingPpt.fileName ? ('Buka: ' + existingPpt.fileName) : 'Buka File PDF';
      }
      if (dom.btnModalDeletePpt) {
        dom.btnModalDeletePpt.style.display = (currentRole === 'Administrator') ? 'inline-flex' : 'none';
      }
    } else {
      if (dom.existingPptContainer) dom.existingPptContainer.style.display = 'none';
      if (dom.btnModalDeletePpt) dom.btnModalDeletePpt.style.display = 'none';
    }

    // Reset Dropzone & Inputs
    if (dom.pptFileInput) dom.pptFileInput.value = '';
    if (dom.dropzoneEmpty) dom.dropzoneEmpty.style.display = 'block';
    if (dom.dropzoneSelected) dom.dropzoneSelected.style.display = 'none';
    if (dom.uploadPptProgress) dom.uploadPptProgress.style.display = 'none';
    if (dom.btnSubmitUploadPpt) {
      dom.btnSubmitUploadPpt.disabled = true;
      dom.btnSubmitUploadPpt.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Upload</span>';
    }

    if (dom.modalUploadPpt) dom.modalUploadPpt.classList.add('active');
  }

  function closeUploadPptModal() {
    if (dom.modalUploadPpt) dom.modalUploadPpt.classList.remove('active');
    state.uploadPptTarget = null;
    state.selectedPptFile = null;
    if (dom.pptFileInput) dom.pptFileInput.value = '';
    if (dom.uploadPptProgress) dom.uploadPptProgress.style.display = 'none';
  }

  function handlePptFileSelect(file) {
    if (!file) return;
    var ext = file.name.split('.').pop().toLowerCase();
    var allowed = ['pdf'];
    if (allowed.indexOf(ext) < 0) {
      showToast('Format file tidak didukung! Format khusus dokumen PDF (.pdf).', 'error');
      return;
    }
    if (file.size > 26214400) { // 25MB
      showToast('Ukuran file terlalu besar! Maksimal 25MB.', 'error');
      return;
    }

    state.selectedPptFile = file;

    if (dom.selectedPptFileName) dom.selectedPptFileName.textContent = file.name;
    if (dom.selectedPptFileSize) {
      var sizeKb = Math.round(file.size / 1024);
      dom.selectedPptFileSize.textContent = sizeKb > 1024 ? ((sizeKb / 1024).toFixed(1) + ' MB') : (sizeKb + ' KB');
    }
    if (dom.dropzoneEmpty) dom.dropzoneEmpty.style.display = 'none';
    if (dom.dropzoneSelected) dom.dropzoneSelected.style.display = 'block';
    if (dom.btnSubmitUploadPpt) dom.btnSubmitUploadPpt.disabled = false;
  }

  function handleUploadPptSubmit() {
    var file = state.selectedPptFile;
    var target = state.uploadPptTarget;
    if (!file || !target) {
      showToast('Silakan pilih file presentasi (.ppt / .pptx) terlebih dahulu!', 'error');
      return;
    }

    var currentUserName = getCurrentLoggedInUserName();

    if (dom.btnSubmitUploadPpt) {
      dom.btnSubmitUploadPpt.disabled = true;
      dom.btnSubmitUploadPpt.innerHTML = '<span>Mengunggah...</span>';
    }
    if (dom.uploadPptProgress) dom.uploadPptProgress.style.display = 'flex';
    if (dom.uploadPptBar) dom.uploadPptBar.style.width = '20%';
    if (dom.uploadPptPercent) dom.uploadPptPercent.textContent = '20%';
    if (dom.uploadPptStatusText) dom.uploadPptStatusText.textContent = 'Membaca data file...';

    var reader = new FileReader();
    reader.onload = function(e) {
      var fullBase64 = e.target.result;
      var base64Data = fullBase64.split(',')[1] || fullBase64;

      if (dom.uploadPptBar) dom.uploadPptBar.style.width = '55%';
      if (dom.uploadPptPercent) dom.uploadPptPercent.textContent = '55%';
      if (dom.uploadPptStatusText) dom.uploadPptStatusText.textContent = 'Mengunggah file PDF...';

      var payload = {
        action: 'uploadPptFile',
        ticketId: target.ticketId,
        serviceType: target.serviceType,
        fileName: file.name,
        mimeType: file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        fileBase64: base64Data,
        uploadedBy: currentUserName
      };

      if (state.isGasEnvironment) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (res && res.success) {
              onUploadPptSuccess(res, file, target, currentUserName);
            } else {
              var errMsg = (res && res.error) ? res.error : 'Gagal mengunggah file ke Google Drive';
              onUploadPptError(errMsg, file, target);
            }
          })
          .withFailureHandler(function(err) {
            onUploadPptError(err.message || 'Gagal memproses upload ke Google Apps Script', file, target);
          })
          .uploadPptFile(payload);
      } else {
        // Lingkungan Vercel / Web Eksternal
        if (state.gasApiUrl) {
          fetch(state.gasApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            redirect: 'follow'
          })
          .then(function(response) {
            return response.json();
          })
          .then(function(res) {
            if (res && res.success) {
              onUploadPptSuccess(res, file, target, currentUserName);
            } else {
              var errMsg = (res && res.error) ? res.error : 'Gagal mengunggah file ke Google Drive';
              onUploadPptError(errMsg, file, target);
            }
          })
          .catch(function(err) {
            console.error('Upload PDF error:', err);
            onUploadPptError('Koneksi upload gagal: ' + err.message, file, target);
          });
        } else {
          onUploadPptError('URL Google Apps Script belum terkonfigurasi.', file, target);
        }
      }
    };
    reader.onerror = function() {
      showToast('Gagal membaca file dari perangkat.', 'error');
      if (dom.btnSubmitUploadPpt) {
        dom.btnSubmitUploadPpt.disabled = false;
        dom.btnSubmitUploadPpt.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Upload</span>';
      }
    };
    reader.readAsDataURL(file);
  }

  function onUploadPptSuccess(res, file, target, currentUserName) {
    if (dom.uploadPptBar) dom.uploadPptBar.style.width = '100%';
    if (dom.uploadPptPercent) dom.uploadPptPercent.textContent = '100%';
    if (dom.uploadPptStatusText) dom.uploadPptStatusText.textContent = 'Selesai diunggah!';

    var fileUrl = (res && res.fileUrl) ? res.fileUrl : GOOGLE_DRIVE_FOLDER_URL;
    var key = target.serviceType + '_' + target.ticketId;

    if (!state.pptAttachments) state.pptAttachments = getStoredPptAttachments();
    state.pptAttachments[key] = {
      fileUrl: fileUrl,
      fileName: file.name,
      uploadedBy: currentUserName,
      timestamp: new Date().toISOString()
    };
    saveStoredPptAttachments(state.pptAttachments);

    if (target.record) {
      target.record.filePpt = fileUrl;
      target.record.fileName = file.name;
    }

    // Update global state.records
    if (Array.isArray(state.records)) {
      state.records.forEach(function(r) {
        if (r && String(r.id) === String(target.ticketId)) {
          r.filePpt = fileUrl;
          r.fileName = file.name;
        }
      });
    }

    // Update service pool records
    var pool = (target.serviceType === 'MOBILE' ? state.mobileRecords : (target.serviceType === 'ECARE' ? state.ecareRecords : (target.serviceType === 'PRIORITY' ? state.priorityRecords : state.fixedRecords))) || [];
    pool.forEach(function(r) {
      if (r && String(r.id) === String(target.ticketId)) {
        r.filePpt = fileUrl;
        r.fileName = file.name;
      }
    });

    setTimeout(function() {
      closeUploadPptModal();
      showToast('File PDF "' + file.name + '" berhasil diunggah!', 'success');
      renderCaseList();
      if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
      const activeDay = (target && target.day) || state.selectedDate || state.selectedDay;
      if (activeDay && typeof renderCalendarRightPanel === 'function') {
        try {
          renderCalendarRightPanel(activeDay);
        } catch (e) {
          console.error('Error re-rendering calendar right panel:', e);
        }
      }
      if (typeof renderTasksTable === 'function') renderTasksTable();
    }, 300);
  }

  function onUploadPptError(errMsg, file, target) {
    console.warn('Upload PPT Error:', errMsg);
    if (dom.btnSubmitUploadPpt) {
      dom.btnSubmitUploadPpt.disabled = false;
      dom.btnSubmitUploadPpt.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Upload</span>';
    }
    if (dom.uploadPptProgress) dom.uploadPptProgress.style.display = 'none';

    var displayMsg = errMsg;
    if (errMsg.indexOf('DriveApp') >= 0 || errMsg.indexOf('izin') >= 0 || errMsg.indexOf('permission') >= 0) {
      displayMsg = 'Izin Google Drive (DriveApp) belum disetujui di Apps Script. Buka editor Apps Script, jalankan fungsi testDriveAuthorization() dan klik Izinkan (Allow), lalu terapkan Versi Baru (Deploy New Version).';
    }
    showToast('Gagal upload: ' + displayMsg, 'error');
  }

  // Ekspor fungsi agar dapat dipanggil dari onclick atribut HTML
  window.openUploadPptModal = openUploadPptModal;
  window.closeUploadPptModal = closeUploadPptModal;
  window.handleDeletePpt = handleDeletePpt;

  /**
   * Hapus File PPT (Khusus Administrator)
   */
  function handleDeletePpt(ticketId, serviceType) {
    var currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    if (currentRole !== 'Administrator') {
      showToast('Akses ditolak: Hanya Administrator yang berwenang menghapus materi PPT.', 'error');
      return;
    }

    var confirmed = window.confirm('Apakah Anda yakin ingin menghapus materi PPT untuk Case #' + ticketId + ' (' + serviceType + ')?');
    if (!confirmed) return;

    var currentUserName = getCurrentLoggedInUserName();
    var key = serviceType + '_' + ticketId;

    // 1. Hapus dari state & localStorage
    if (!state.pptAttachments) state.pptAttachments = getStoredPptAttachments();
    if (state.pptAttachments[key]) {
      delete state.pptAttachments[key];
      saveStoredPptAttachments(state.pptAttachments);
    }

    // 2. Kosongkan di memory record
    var allItems = (serviceType === 'MOBILE' ? state.mobileRecords : (serviceType === 'ECARE' ? state.ecareRecords : (serviceType === 'PRIORITY' ? state.priorityRecords : state.fixedRecords))) || [];
    var targetRec = allItems.find(function(r) { return String(r.id) === String(ticketId); });
    if (targetRec) {
      targetRec.filePpt = '';
    }

        closeUploadPptModal();
    showToast('File PDF berhasil dihapus!', 'success');
    renderCaseList();
    if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
    const activeDay = state.selectedDate || state.selectedDay;
    if (activeDay && typeof renderCalendarRightPanel === 'function') {
      try {
        renderCalendarRightPanel(activeDay);
      } catch (e) {
        console.error('Error re-rendering calendar right panel:', e);
      }
    }
    if (typeof renderTasksTable === 'function') renderTasksTable();

    // 3. Sinkronisasi penghapusan ke Google Apps Script / Sheet & Trash Drive
    var payload = {
      action: 'deletePptFile',
      ticketId: ticketId,
      serviceType: serviceType,
      deletedBy: currentUserName
    };

    if (state.isGasEnvironment) {
      google.script.run
        .withSuccessHandler(function(res) {
          console.log('Delete PPT Apps Script success:', res);
        })
        .withFailureHandler(function(err) {
          console.warn('Delete PPT Apps Script notice:', err);
        })
        .deletePptFile(payload);
    } else if (state.gasApiUrl) {
      try {
        fetch(state.gasApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow'
        })
        .then(function(res) { return res.json(); })
        .then(function(res) {
          console.log('Delete PPT server response:', res);
        })
        .catch(function(err) {
          console.warn('Delete PPT fetch notice:', err);
        });
      } catch (e) {
        console.warn('Delete PPT remote error:', e);
      }
    }
  }

  /**
   * =========================================================================
   * FITUR RESCHEDULE TANGGAL AGENDA (KHUSUS ROLE FACILITATOR & ADMINISTRATOR)
   * Mengubah Tanggal_Agenda (Kolom K) dan merekam History_Reschedule
   * =========================================================================
   */
  function openRescheduleModal(ticketId, serviceType) {
    var currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    if (currentRole === 'Inputer' || currentRole === 'Viewer') {
      showToast('Akses ditolak: Hanya peran Facilitator & Administrator yang berwenang merubah tanggal agenda.', 'error');
      return;
    }

    var ticket = (state.records || []).find(function(r) {
      return String(r.id) === String(ticketId) && (!serviceType || r.serviceType === serviceType);
    }) || (state.records || []).find(function(r) { return String(r.id) === String(ticketId); });
    if (!ticket) return;

    state.currentRescheduleTicket = ticket;

    if (dom.rescheduleModalTitle) dom.rescheduleModalTitle.textContent = 'Ubah Tanggal Agenda: Kasus #' + ticket.id;
    if (dom.rescheduleTicketId) dom.rescheduleTicketId.textContent = 'Case #' + ticket.id;
    if (dom.rescheduleBadgeService) {
      dom.rescheduleBadgeService.textContent = ticket.serviceType;
      dom.rescheduleBadgeService.className = 'info-badge ' + (ticket.serviceType === 'MOBILE' ? 'badge-srv mobile' : (ticket.serviceType === 'ECARE' ? 'badge-srv ecare' : (ticket.serviceType === 'PRIORITY' ? 'badge-srv priority' : 'badge-srv fixed')));
    }
    if (dom.rescheduleStatusBadge) {
      var sm = getCalendarStatusMeta(ticket.status);
      dom.rescheduleStatusBadge.textContent = ticket.status || 'Open';
      dom.rescheduleStatusBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold border ' + sm.cardBadgeClass;
    }
    if (dom.rescheduleIssueText) dom.rescheduleIssueText.textContent = ticket.totalCaseIsu || ticket.caseTitle || '-';

    var tglInputDisplay = formatShortIndoDate(ticket.tanggalInput || ticket.tanggal);
    var tglCurrentDisplay = formatShortIndoDate(ticket.tanggalAgenda || ticket.tanggal);
    if (dom.rescheduleTglInputVal) dom.rescheduleTglInputVal.textContent = tglInputDisplay;
    if (dom.rescheduleInputerVal) dom.rescheduleInputerVal.textContent = 'Oleh: ' + (ticket.inputBy || ticket.requestor || 'Inputer');
    if (dom.rescheduleTglCurrentVal) dom.rescheduleTglCurrentVal.textContent = tglCurrentDisplay;

    // Prefill input date
    var rawDate = ticket.tanggalAgenda || ticket.tanggal || '';
    var parsedDate = '';
    if (rawDate) {
      var dp = parseDateParts(rawDate);
      if (dp) {
        var mm = String(dp.monthIndex + 1).padStart(2, '0');
        var dd = String(dp.day).padStart(2, '0');
        parsedDate = dp.year + '-' + mm + '-' + dd;
      }
    }
    if (dom.inputRescheduleNewDate) dom.inputRescheduleNewDate.value = parsedDate;
    if (dom.inputRescheduleReason) dom.inputRescheduleReason.value = '';
    if (dom.inputReschedulePic) dom.inputReschedulePic.value = getCurrentLoggedInUserName();

    // History
    if (dom.rescheduleHistorySection && dom.rescheduleHistoryList) {
      if (ticket.historyReschedule) {
        dom.rescheduleHistorySection.style.display = 'block';
        var histLines = ticket.historyReschedule.split('|');
        dom.rescheduleHistoryList.innerHTML = histLines.map(function(h) {
          return '<div class="py-1 border-b border-slate-200/60 last:border-0">' + escapeHtml(h.trim()) + '</div>';
        }).join('');
      } else {
        dom.rescheduleHistorySection.style.display = 'none';
        dom.rescheduleHistoryList.innerHTML = '';
      }
    }

    if (dom.modalRescheduleDate) dom.modalRescheduleDate.classList.add('active');
    setTimeout(function() { if (dom.inputRescheduleNewDate) dom.inputRescheduleNewDate.focus(); }, 100);
  }

  function closeRescheduleModal() {
    if (dom.modalRescheduleDate) dom.modalRescheduleDate.classList.remove('active');
    state.currentRescheduleTicket = null;
    if (dom.inputRescheduleReason) dom.inputRescheduleReason.value = '';
  }

  function handleSubmitReschedule() {
    var ticket = state.currentRescheduleTicket;
    if (!ticket) return;

    var newDate = dom.inputRescheduleNewDate ? dom.inputRescheduleNewDate.value : '';
    var reason = dom.inputRescheduleReason ? dom.inputRescheduleReason.value.trim() : '';
    var picName = dom.inputReschedulePic ? dom.inputReschedulePic.value.trim() : getCurrentLoggedInUserName();

    if (!newDate) {
      showToast('Pilih tanggal agenda baru terlebih dahulu!', 'error');
      if (dom.inputRescheduleNewDate) dom.inputRescheduleNewDate.focus();
      return;
    }
    if (!reason) {
      showToast('Harap masukkan alasan atau catatan perubahan tanggal!', 'error');
      if (dom.inputRescheduleReason) dom.inputRescheduleReason.focus();
      return;
    }

    if (dom.btnSubmitReschedule) {
      dom.btnSubmitReschedule.disabled = true;
      dom.btnSubmitReschedule.innerHTML = '<span>Menyimpan ke Sheet...</span>';
    }

    var payload = {
      action: 'rescheduleCaseDate',
      ticketId: ticket.id,
      serviceType: ticket.serviceType,
      newDate: newDate,
      reason: reason,
      rescheduledBy: picName
    };

    if (state.isGasEnvironment) {
      google.script.run
        .withSuccessHandler(function(res) {
          if (dom.btnSubmitReschedule) {
            dom.btnSubmitReschedule.disabled = false;
            dom.btnSubmitReschedule.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>Simpan Perubahan Tanggal</span>';
          }
          if (res && res.success) {
            applyRescheduleUpdateLocal(ticket, payload, res);
            closeRescheduleModal();
            showToast('Tanggal agenda kasus #' + ticket.id + ' berhasil diubah ke ' + newDate + '!', 'success');
          } else {
            showToast('Gagal mengubah tanggal: ' + (res ? res.error : 'Unknown'), 'error');
          }
        })
        .withFailureHandler(function(err) {
          if (dom.btnSubmitReschedule) {
            dom.btnSubmitReschedule.disabled = false;
            dom.btnSubmitReschedule.innerHTML = '<span>Simpan Perubahan Tanggal</span>';
          }
          showToast('Apps Script error: ' + err.message, 'error');
        })
        .rescheduleCaseDate(payload);
    } else if (state.gasApiUrl) {
      fetch(state.gasApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (dom.btnSubmitReschedule) {
            dom.btnSubmitReschedule.disabled = false;
            dom.btnSubmitReschedule.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>Simpan Perubahan Tanggal</span>';
          }
          if (res && res.success) {
            applyRescheduleUpdateLocal(ticket, payload, res);
            closeRescheduleModal();
            showToast('Tanggal agenda kasus #' + ticket.id + ' berhasil diubah ke ' + newDate + '!', 'success');
          } else {
            applyRescheduleUpdateLocal(ticket, payload, null);
            closeRescheduleModal();
            showToast('Perubahan tanggal tersimpan secara lokal (' + newDate + ')', 'info');
          }
        })
        .catch(function() {
          if (dom.btnSubmitReschedule) {
            dom.btnSubmitReschedule.disabled = false;
            dom.btnSubmitReschedule.innerHTML = '<span>Simpan Perubahan Tanggal</span>';
          }
          applyRescheduleUpdateLocal(ticket, payload, null);
          closeRescheduleModal();
          showToast('Tersimpan secara lokal: tanggal agenda dipindahkan ke ' + newDate, 'info');
        });
    } else {
      setTimeout(function() {
        if (dom.btnSubmitReschedule) {
          dom.btnSubmitReschedule.disabled = false;
          dom.btnSubmitReschedule.innerHTML = '<span>Simpan Perubahan Tanggal</span>';
        }
        applyRescheduleUpdateLocal(ticket, payload, null);
        closeRescheduleModal();
        showToast('Tanggal agenda kasus #' + ticket.id + ' berhasil diubah ke ' + newDate + ' (Mode Simulasi)', 'success');
      }, 300);
    }
  }

  function applyRescheduleUpdateLocal(ticket, payload, res) {
    if (!ticket) return;
    var newDate = payload.newDate;
    var actor = payload.rescheduledBy || 'Facilitator';
    var reason = payload.reason || '';

    if (!ticket.tanggalInput) {
      ticket.tanggalInput = ticket.tanggalAgenda || ticket.tanggal || newDate;
    }
    var oldDate = ticket.tanggalAgenda || ticket.tanggal || '';
    ticket.tanggalAgenda = newDate;
    ticket.tanggal = newDate;
    ticket.terakhirUpdate = new Date().toISOString().slice(0, 10);
    ticket.pic = actor;

    var auditEntry = '[' + new Date().toISOString().slice(0, 10) + '] Oleh ' + actor + ': ' + (oldDate ? oldDate + ' -> ' : '') + newDate + (reason ? ' (' + reason + ')' : '');
    if (res && res.historyReschedule) {
      ticket.historyReschedule = res.historyReschedule;
    } else {
      ticket.historyReschedule = ticket.historyReschedule ? (ticket.historyReschedule + ' | ' + auditEntry) : auditEntry;
    }

    var logMsg = 'Reschedule Tanggal Agenda dari ' + (oldDate || '-') + ' ke ' + newDate + '. Alasan: ' + reason;
    var localLog = {
      ticketId: ticket.id,
      serviceType: ticket.serviceType,
      author: actor,
      timestamp: new Date().toISOString(),
      message: logMsg,
      newStatus: ticket.status
    };
    if (Array.isArray(state.logs)) {
      state.logs.unshift(localLog);
    }

    // Refresh views
    if (typeof renderCalendarView === 'function') renderCalendarView();
    if (state.selectedDay && typeof renderCalendarRightPanel === 'function') {
      renderCalendarRightPanel(state.selectedDay);
    }
    if (typeof renderTasksTable === 'function') renderTasksTable();
    if (typeof updateTasksKpis === 'function') updateTasksKpis();
    if (state.activeDrawerTicket && String(state.activeDrawerTicket.id) === String(ticket.id) && typeof openDrawer === 'function') {
      openDrawer(ticket.id, ticket.serviceType);
    }
  }

  /**
   * Reopen / Kembalikan Status
   */
  function handleQuickReopen(ticketId, targetStatus) {
    if (state.authUser && (state.authUser.role === 'Inputer' || state.authUser.role === 'Viewer')) {
      showToast('Akses ditolak: Peran ' + state.authUser.role + ' tidak dapat membuka kembali atau mengubah status kasus.', 'error');
      return;
    }
    var ticket = state.records.find(function(r) { return r.id === ticketId; });
    if (!ticket) return;

    var author = state.defaultAuthor || localStorage.getItem('koncho_pic_name') || 'CHO Operator';
    var note = 'Membuka kembali kasus ke status: ' + targetStatus;

    var payload = {
      ticketId: ticket.id,
      serviceType: ticket.serviceType,
      author: author,
      message: note,
      newStatus: targetStatus,
      followUpTo: ticket.followUpTo
    };

    if (state.isGasEnvironment) {
      google.script.run
        .withSuccessHandler(function(res) {
          ticket.status = targetStatus;
          ticket.terakhirUpdate = new Date().toISOString();
          ticket.statusInformasi = 'Ada Update Baru';
          if (res && res.log) state.logs.unshift(res.log);
          updateKpiCounters();
          renderCaseList();
          showToast('Kasus #' + ticket.id + ' status diubah ke ' + targetStatus, 'success');
        })
        .postCommunicationUpdate(payload);
    } else {
      ticket.status = targetStatus;
      ticket.terakhirUpdate = new Date().toISOString();
      state.logs.unshift({
        logId: 'LOG-SIM-' + Math.floor(1000 + Math.random() * 9000),
        ticketId: ticket.id,
        serviceType: ticket.serviceType,
        author: author,
        message: note,
        statusTerkait: targetStatus,
        followUpTo: ticket.followUpTo,
        timestamp: new Date().toISOString()
      });
      updateKpiCounters();
      renderCaseList();
      showToast('Kasus #' + ticket.id + ' dibuka kembali ke ' + targetStatus + ' (Preview)', 'success');
    }
  }

  /**
   * =========================================================================
   * RIWAYAT LOG KOMUNIKASI & TIMELINE DETAIL
   * =========================================================================
   */
    /**
   * Cek History Case Lengkap: Lifecycle Kasus dari Inputer, Fasilitator sampai Case Closed
   */
      window.closeHistoryDrawer = function() {
    var drawer = document.getElementById('history-drawer');
    if (!drawer) return;
    drawer.classList.remove('drawer-open');
    drawer.classList.add('drawer-closed');
    
    var panel = document.getElementById('history-drawer-panel');
    if (panel) {
      panel.style.transform = 'translateX(100%)';
      panel.style.webkitTransform = 'translateX(100%)';
    }
    var backdrop = document.getElementById('history-drawer-backdrop');
    if (backdrop) {
      backdrop.style.opacity = '0';
    }
    setTimeout(function() {
      if (drawer.classList.contains('drawer-closed')) {
        drawer.style.display = 'none';
        drawer.style.visibility = 'hidden';
        drawer.style.opacity = '0';
        drawer.style.pointerEvents = 'none';
      }
    }, 350);
  };

  window.openHistoryDrawer = function(ticketId, serviceType) {
    window.openHistoryCaseModal(ticketId, serviceType);
  };

  /**
   * =========================================================================
   * SLIDE-OVER DRAWER RIWAYAT FOLLOW UP (HISTORY CASE)
   * Menampilkan riwayat kronologis penanganan kasus bergaya Detil Isu
   * Mulai dari inputan inputer, tindak lanjut fasilitator, hingga case closed
   * =========================================================================
   */
  window.openHistoryCaseModal = function(ticketId, serviceType) {
    if (ticketId && typeof ticketId === 'object') {
      var targetEl = ticketId.target || ticketId;
      var btnEl = targetEl && typeof targetEl.closest === 'function' ? targetEl.closest('.btn-history-case') : null;
      if (btnEl) {
        ticketId = btnEl.getAttribute('data-id');
        serviceType = btnEl.getAttribute('data-service');
      } else {
        ticketId = null;
      }
    }

    var records = state.records || [];
    var ticket = null;
    if (ticketId != null && String(ticketId).trim() !== '') {
      var cleanId = String(ticketId).trim();
      var noHashId = cleanId.replace(/^#/, '');
      ticket = records.find(function(r) { 
        return String(r.id) === cleanId || 
               String(r.ticketId) === cleanId ||
               String(r.id).replace(/^#/, '') === noHashId ||
               String(r.ticketId || '').replace(/^#/, '') === noHashId ||
               (r.totalCaseIsu && String(r.totalCaseIsu) === cleanId); 
      });
    }

    if (!ticket && records.length > 0) {
      ticket = records[0];
    }

    if (!ticket) {
      if (typeof showToast === 'function') showToast('Data kasus tidak ditemukan!', 'error');
      return;
    }

    state.activeHistoryTicket = ticket;

    var drawer = document.getElementById('history-drawer');
    if (!drawer) {
      if (typeof openDrawer === 'function') {
        openDrawer(ticket.id, ticket.serviceType);
      }
      return;
    }

    var titleEl = document.getElementById('history-drawer-issue-title');
    var subtitleEl = document.getElementById('history-drawer-subtitle');
    var unitBadge = document.getElementById('history-drawer-unit-badge');
    var periodBadge = document.getElementById('history-drawer-period-badge');
    var dateBadge = document.getElementById('history-drawer-date-badge');
    var statusBadge = document.getElementById('history-drawer-status');
    var timelineEl = document.getElementById('history-drawer-timeline');
    var countEl = document.getElementById('history-drawer-count');

    var sType = ticket.serviceType || serviceType || 'MOBILE';
    var uMeta = typeof getUnitMeta === 'function' ? getUnitMeta(sType) : { shortBadge: sType, badgeClass: 'bg-blue-100 text-blue-900' };
    var sStatus = String(ticket.status || 'Open').trim();
    var isClosed = sStatus.toLowerCase() === 'closed';
    var isInProg = sStatus.toLowerCase() === 'inprogress';

    if (titleEl) titleEl.textContent = ticket.totalCaseIsu || ticket.caseTitle || 'Detail Isu';
    if (subtitleEl) subtitleEl.textContent = 'Kasus #' + (ticket.id || ticket.ticketId || '-') + ' • Requestor: ' + (ticket.requestor || ticket.inputBy || 'Administrator Utama');
    if (unitBadge) {
      unitBadge.textContent = uMeta.shortBadge;
      unitBadge.className = 'px-2 py-0.5 rounded text-[11px] font-bold ' + uMeta.badgeClass;
    }
    if (periodBadge) periodBadge.textContent = ticket.bulan || 'Oktober 2026';
    if (dateBadge) {
      var dStr = typeof formatShortIndoDate === 'function' ? formatShortIndoDate(ticket.tanggalAgenda || ticket.tanggal || ticket.terakhirUpdate) : (ticket.tanggalAgenda || ticket.tanggal || '-');
      dateBadge.textContent = '📅 ' + dStr;
    }
    if (statusBadge) {
      statusBadge.textContent = sStatus;
      if (isClosed) {
        statusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
      } else if (isInProg) {
        statusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
      } else {
        statusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200';
      }
    }

    // Attach copy summary button
    var copyBtn = document.getElementById('btn-history-drawer-copy');
    if (copyBtn) {
      copyBtn.onclick = function() {
        if (typeof copyCaseSummary === 'function') copyCaseSummary(ticket.id);
      };
    }

    // Attachment
    var ppt = typeof getCasePptAttachment === 'function' ? getCasePptAttachment(sType, ticket.id) : null;
    var pdfLink = (ppt && (ppt.fileUrl || ppt.url)) ? (ppt.fileUrl || ppt.url) : (ticket.filePpt || ticket.filePdf || '');
    var pdfName = (ppt && (ppt.fileName || ppt.name)) ? (ppt.fileName || ppt.name) : 'Sample Case (PDF)';

    var inputerName = ticket.inputBy || ticket.requestor || 'Administrator Utama';
    var inputDate = typeof formatShortIndoDate === 'function' ? formatShortIndoDate(ticket.tanggalInput || ticket.tanggal || ticket.bulan) : (ticket.tanggalInput || ticket.tanggal || '-');
    var detailText = ticket.issueDetails || ticket.detail || ticket.detailKendala || 'Tidak ada catatan detail kendala.';
    var urgencyText = ticket.urgency || 'Low';

    var fasilitatorName = ticket.pic || ticket.picFacilitator || (typeof getFacilitatorForRequestor === 'function' ? getFacilitatorForRequestor(ticket.requestor) : 'Fasilitator CHO');
    var followUpTo = ticket.followUpTo && ticket.followUpTo !== '-' ? ticket.followUpTo : 'Tim CCIS, HCCER, dst';
    var quickWinText = ticket.progress && ticket.progress !== 'Belum Ada Update' ? ticket.progress : (ticket.quickWin || '-');
    var catatanFasilitator = ticket.catatanFasilitator || ticket.keteranganProgress || '-';
    var needSupportText = ticket.needSupport && ticket.needSupport !== '-' ? ticket.needSupport : '';

    var closedBy = ticket.closedBy || (isClosed ? fasilitatorName : '-');
    var closedNotes = ticket.keteranganClosed || ticket.solusi || (isClosed ? 'Kasus telah diselesaikan dan terverifikasi normal.' : '-');

    // Build timeline cards
    var html = '';

    // 1. Tahap Inputan Inputer
    html += '<div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5">';
    html += '  <div class="flex items-center justify-between">';
    html += '    <div class="flex items-center gap-1.5 font-bold text-slate-800 text-xs">';
    html += '      <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>';
    html += '      <span>1. Input Kasus (Inputer)</span>';
    html += '    </div>';
    html += '    <span class="text-[11px] text-slate-500 font-medium">📅 ' + escapeHtml(inputDate) + '</span>';
    html += '  </div>';
    html += '  <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/80">';
    html += '    <div><span class="text-slate-500 text-[11px] font-semibold">Requestor:</span> <span class="font-bold text-slate-800">' + escapeHtml(inputerName) + '</span></div>';
    html += '    <div><span class="text-slate-500 text-[11px] font-semibold">Urgency:</span> <span class="font-bold text-emerald-700">' + escapeHtml(urgencyText) + '</span></div>';
    html += '  </div>';
    html += '  <div class="text-xs pt-1">';
    html += '    <span class="text-slate-500 text-[11px] font-semibold block mb-0.5">Detail Kendala:</span>';
    html += '    <div class="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 leading-relaxed whitespace-pre-line">' + escapeHtml(detailText) + '</div>';
    html += '  </div>';
    if (pdfLink) {
      html += '  <div class="pt-1">';
      html += '    <span class="text-slate-500 text-[11px] font-semibold block mb-1">sample case PDF:</span>';
      html += '    <a href="' + escapeHtml(pdfLink) + '" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors">';
      html += '      <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>';
      html += '      <span>' + escapeHtml(pdfName) + '</span>';
      html += '    </a>';
      html += '  </div>';
    }
    html += '</div>';

    // 2. Tahap Follow Up Fasilitator (In Progress)
    if (isInProg || isClosed || (quickWinText && quickWinText !== '-') || (catatanFasilitator && catatanFasilitator !== '-')) {
      html += '<div class="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col gap-2.5">';
      html += '  <div class="flex items-center justify-between">';
      html += '    <div class="flex items-center gap-1.5 font-bold text-[#061345] text-xs">';
      html += '      <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>';
      html += '      <span>2. Follow Up Tindak Lanjut (Fasilitator)</span>';
      html += '    </div>';
      html += '    <span class="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800">In Progress</span>';
      html += '  </div>';
      html += '  <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-blue-200/80">';
      html += '    <div><span class="text-slate-500 text-[11px] font-semibold">PIC Pelaksana:</span> <span class="font-bold text-slate-800">' + escapeHtml(fasilitatorName) + '</span></div>';
      html += '    <div><span class="text-slate-500 text-[11px] font-semibold">Follow Up To:</span> <span class="font-bold text-blue-800">' + escapeHtml(followUpTo) + '</span></div>';
      html += '  </div>';
      if (quickWinText && quickWinText !== '-') {
        html += '  <div class="text-xs pt-1">';
        html += '    <span class="text-slate-500 text-[11px] font-semibold block mb-0.5">Quick Win:</span>';
        html += '    <div class="p-2.5 bg-white border border-blue-200 rounded-lg text-slate-800 font-medium leading-relaxed whitespace-pre-line">' + escapeHtml(quickWinText) + '</div>';
        html += '  </div>';
      }
      if (catatanFasilitator && catatanFasilitator !== '-') {
        html += '  <div class="text-xs pt-1">';
        html += '    <span class="text-slate-500 text-[11px] font-semibold block mb-0.5">Catatan Tindak Lanjut:</span>';
        html += '    <div class="p-2.5 bg-white border border-blue-200 rounded-lg text-slate-800 leading-relaxed whitespace-pre-line">' + escapeHtml(catatanFasilitator) + '</div>';
        html += '  </div>';
      }
      if (needSupportText) {
        html += '  <div class="text-xs pt-1">';
        html += '    <span class="text-slate-500 text-[11px] font-semibold block mb-0.5">Need Support:</span>';
        html += '    <div class="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed whitespace-pre-line">' + escapeHtml(needSupportText) + '</div>';
        html += '  </div>';
      }
      html += '</div>';
    }

    // 3. Tahap Selesai (Closed)
    if (isClosed) {
      html += '<div class="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col gap-2.5">';
      html += '  <div class="flex items-center justify-between">';
      html += '    <div class="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">';
      html += '      <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>';
      html += '      <span>3. Penyelesaian Kasus (Closed)</span>';
      html += '    </div>';
      html += '    <span class="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">Closed</span>';
      html += '  </div>';
      html += '  <div class="text-xs pt-1 border-t border-emerald-200/80">';
      html += '    <span class="text-slate-500 text-[11px] font-semibold">Ditutup oleh:</span> <span class="font-bold text-slate-800">' + escapeHtml(closedBy) + '</span>';
      html += '  </div>';
      html += '  <div class="text-xs pt-1">';
      html += '    <span class="text-slate-500 text-[11px] font-semibold block mb-0.5">Solusi Penyelesaian:</span>';
      html += '    <div class="p-2.5 bg-white border border-emerald-200 rounded-lg text-slate-800 leading-relaxed whitespace-pre-line">' + escapeHtml(closedNotes) + '</div>';
      html += '  </div>';
      html += '</div>';
    }

    // 4. Log Komunikasi / Audit Trail
    var ticketLogs = (state.logs || []).filter(function(l) { return String(l.ticketId) === String(ticket.id); });
    if (ticketLogs.length > 0) {
      html += '<div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">';
      html += '  <span class="text-xs font-bold text-slate-600 uppercase tracking-wide">Catatan Log Riwayat:</span>';
      html += ticketLogs.map(function(tl) { 
        var msg = tl.message || tl.keterangan || '-';
        msg = msg.replace(/ditugaskan ke Fasilitator/gi, 'diteruskan ke Fasilitator')
                 .replace(/ditugaskan kepada Fasilitator/gi, 'diteruskan kepada Fasilitator')
                 .replace(/ditugaskan/gi, 'diteruskan');
        var author = tl.author || tl.user || 'PIC';
        var timeStr = typeof formatLogTimestamp === 'function' ? formatLogTimestamp(tl.timestamp || tl.tanggal) : (tl.timestamp || tl.tanggal || '');
        return '<div class="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">' +
          '  <div class="flex items-center justify-between text-slate-500 font-semibold mb-0.5 text-[11px]"><span>' + escapeHtml(author) + '</span><span>' + escapeHtml(timeStr) + '</span></div>' +
          '  <p class="text-slate-800 leading-relaxed">' + escapeHtml(msg) + '</p>' +
          '</div>';
      }).join('');
      html += '</div>';
    }

    if (timelineEl) timelineEl.innerHTML = html;
    if (countEl) countEl.textContent = isClosed ? '3 Tahap Selesai' : (isInProg ? '2 Tahap Berjalan' : '1 Tahap (Open)');

    // Buka Drawer dengan paksa style agar 100% langsung muncul tanpa tertunda cache CSS
    drawer.classList.remove('drawer-closed');
    drawer.classList.add('drawer-open');
    drawer.style.display = 'block';
    drawer.style.visibility = 'visible';
    drawer.style.opacity = '1';
    drawer.style.pointerEvents = 'auto';

    var panel = document.getElementById('history-drawer-panel');
    if (panel) {
      panel.style.transform = 'translateX(0)';
      panel.style.webkitTransform = 'translateX(0)';
    }
    var backdrop = document.getElementById('history-drawer-backdrop');
    if (backdrop) {
      backdrop.style.opacity = '1';
      backdrop.style.display = 'block';
    }
  };

  function openLogModal(ticketId) {
    var ticket = state.records.find(function(r) { return r.id === ticketId; });
    if (!ticket) return;

    state.currentActionTicket = ticket;

    dom.logModalTitle.textContent = 'Riwayat Kasus #' + ticket.id + ' (' + ticket.serviceType + ')';
    dom.logDetailIssue.textContent = ticket.totalCaseIsu || '-';
    dom.logDetailReq.textContent = ticket.requestor || '-';
    dom.logDetailFollowUp.textContent = ticket.followUpTo || '-';
    dom.logDetailService.textContent = ticket.serviceType;
    dom.logDetailStatus.textContent = ticket.status || 'Open';

    dom.logQuickAuthor.value = state.defaultAuthor || localStorage.getItem('koncho_pic_name') || '';
    dom.logQuickMessage.value = '';

    // Kontrol form Tambah Catatan Cepat (Viewer: Sembunyikan, Murni Read-Only)
    var role = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    var quickAddBox = dom.modalLog.querySelector('.log-quick-add');
    if (quickAddBox) {
      quickAddBox.style.display = (role === 'Viewer') ? 'none' : 'block';
    }

    renderTimelineLogs(ticket);

    dom.modalLog.classList.add('active');
  }

  function closeLogModal() {
    dom.modalLog.classList.remove('active');
    state.currentActionTicket = null;
  }

  function renderTimelineLogs(ticket) {
    var ticketLogs = state.logs.filter(function(l) { return l.ticketId === ticket.id; });

    if (ticketLogs.length === 0) {
      dom.logTimelineContainer.innerHTML = 
        '<div style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px;">' +
        'Belum ada catatan log komunikasi untuk kasus ini.' +
        '</div>';
      return;
    }

    var html = '';
    ticketLogs.forEach(function(l) {
      var badgeHtml = '';
      if (l.statusTerkait) {
        badgeHtml += '<span class="info-badge">Status: ' + escapeHtml(l.statusTerkait) + '</span>';
      }
      if (l.followUpTo) {
        badgeHtml += '<span class="info-badge" style="color:var(--fixed-color);">Follow Up: ' + escapeHtml(l.followUpTo) + '</span>';
      }

      var msg = l.message || l.keterangan || '-';
      msg = msg.replace(/ditugaskan ke Fasilitator/gi, 'diteruskan ke Fasilitator')
               .replace(/ditugaskan kepada Fasilitator/gi, 'diteruskan kepada Fasilitator')
               .replace(/ditugaskan/gi, 'diteruskan');
      var author = l.author || l.user || 'CHO Staff';
      var timeStr = typeof formatLogTimestamp === 'function' ? formatLogTimestamp(l.timestamp || l.tanggal) : formatDisplayTime(l.timestamp || l.tanggal);

      html += '<div class="log-timeline-item">';
      html += '<div class="log-item-header">';
      html += '<span class="log-item-author">👤 ' + escapeHtml(author) + '</span>';
      html += '<span class="log-item-time">' + timeStr + '</span>';
      html += '</div>';
      html += '<div class="log-item-msg">' + escapeHtml(msg) + '</div>';
      if (badgeHtml) {
        html += '<div class="log-item-badges">' + badgeHtml + '</div>';
      }
      html += '</div>';
    });

    dom.logTimelineContainer.innerHTML = html;
  }

  function handleSaveQuickLog() {
    if (state.authUser && state.authUser.role === 'Viewer') {
      showToast('Akses ditolak: Peran Viewer hanya memiliki hak baca (Read-Only), tidak dapat menambahkan catatan log.', 'error');
      return;
    }
    var ticket = state.currentActionTicket;
    if (!ticket) return;

    var author = dom.logQuickAuthor.value.trim();
    var msg = dom.logQuickMessage.value.trim();

    if (!msg) {
      showToast('Harap tuliskan catatan update!', 'error');
      dom.logQuickMessage.focus();
      return;
    }
    if (!author) {
      showToast('Harap isi nama pengirim!', 'error');
      dom.logQuickAuthor.focus();
      return;
    }

    state.defaultAuthor = author;
    localStorage.setItem('koncho_pic_name', author);

    var payload = {
      ticketId: ticket.id,
      serviceType: ticket.serviceType,
      author: author,
      message: msg,
      newStatus: ticket.status,
      followUpTo: ticket.followUpTo
    };

    dom.btnSubmitQuickLog.disabled = true;
    dom.btnSubmitQuickLog.textContent = 'Mengirim...';

    if (state.isGasEnvironment) {
      google.script.run
        .withSuccessHandler(function(res) {
          dom.btnSubmitQuickLog.disabled = false;
          dom.btnSubmitQuickLog.textContent = 'Kirim Catatan';
          if (res && res.success) {
            state.logs.unshift(res.log);
            dom.logQuickMessage.value = '';
            renderTimelineLogs(ticket);
            renderCaseList();
            showToast('Catatan berhasil ditambahkan!', 'success');
          }
        })
        .postCommunicationUpdate(payload);
    } else {
      setTimeout(function() {
        dom.btnSubmitQuickLog.disabled = false;
        dom.btnSubmitQuickLog.textContent = 'Kirim Catatan';
        state.logs.unshift({
          logId: 'LOG-SIM-' + Math.floor(1000 + Math.random() * 9000),
          ticketId: ticket.id,
          serviceType: ticket.serviceType,
          author: author,
          message: msg,
          statusTerkait: ticket.status,
          followUpTo: ticket.followUpTo,
          timestamp: new Date().toISOString()
        });
        dom.logQuickMessage.value = '';
        renderTimelineLogs(ticket);
        renderCaseList();
        showToast('Catatan tersimpan (Preview)!', 'success');
      }, 250);
    }
  }

  /**
   * Salin Ringkasan Kasus ke Clipboard
   */
  function copyCaseSummary(ticketId) {
    var ticket = state.records.find(function(r) { return r.id === ticketId; });
    if (!ticket) return;

    var text = '📋 *RINGKASAN KASUS konCHO*\n' +
      'ID: Kasus #' + ticket.id + ' (' + ticket.serviceType + ')\n' +
      'Isu Kasus (Kol. B): ' + (ticket.totalCaseIsu || '-') + '\n' +
      'Requestor (Kol. G): ' + (ticket.requestor || '-') + '\n' +
      'Status (Kol. H): ' + (ticket.status || 'Open') + '\n' +
      'Follow Up To (Kol. I): ' + (ticket.followUpTo || '-') + '\n';

    if (ticket.status === 'InProgress' && ticket.inProgressNote) {
      text += 'Catatan In Progress: ' + ticket.inProgressNote + ' (oleh: ' + ticket.inProgressBy + ')\n';
    } else if (ticket.status === 'Closed' && ticket.closedNote) {
      text += 'Keterangan Closed: ' + ticket.closedNote + ' (Di-Closed oleh: ' + ticket.closedBy + ')\n';
    } else if (ticket.detail) {
      text += 'Detail Kendala: ' + ticket.detail + '\n';
    }

    text += 'Waktu Update: ' + formatDisplayTime(ticket.terakhirUpdate || ticket.tanggal) + '\n\n' +
      'Google Sheet: https://docs.google.com/spreadsheets/d/1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc/edit';

    navigator.clipboard.writeText(text).then(function() {
      showToast('Ringkasan Kasus #' + ticket.id + ' disalin ke Clipboard!', 'success');
    }).catch(function() {
      showToast('Gagal menyalin ringkasan', 'error');
    });
  }

  /**
   * =========================================================================
   * MODAL INPUT KASUS BARU
   * =========================================================================
   */
  function parseDateParts(val) {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) {
      return { year: val.getFullYear(), monthIndex: val.getMonth(), day: val.getDate() };
    }
    var s = String(val).trim();
    if (!s) return null;
    var isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      var y = parseInt(isoMatch[1], 10);
      var m = parseInt(isoMatch[2], 10) - 1;
      var d = parseInt(isoMatch[3], 10);
      if (m >= 0 && m <= 11 && d >= 1 && d <= 31) return { year: y, monthIndex: m, day: d };
    }
    var slashMatch = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (slashMatch) {
      var d2 = parseInt(slashMatch[1], 10);
      var m2 = parseInt(slashMatch[2], 10) - 1;
      var y2 = parseInt(slashMatch[3], 10);
      if (m2 >= 0 && m2 <= 11 && d2 >= 1 && d2 <= 31) return { year: y2, monthIndex: m2, day: d2 };
    }
    var parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return { year: parsed.getFullYear(), monthIndex: parsed.getMonth(), day: parsed.getDate() };
    }
    return null;
  }

  function toIsoDateString(year, monthIndex, day) {
    var mm = String(monthIndex + 1);
    if (mm.length < 2) mm = '0' + mm;
    var dd = String(day);
    if (dd.length < 2) dd = '0' + dd;
    return String(year) + '-' + mm + '-' + dd;
  }

  function formatShortIndoDate(val) {
    var p = parseDateParts(val);
    if (!p) return '-';
    var shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var dd = String(p.day);
    if (dd.length < 2) dd = '0' + dd;
    return dd + ' ' + (shortMonths[p.monthIndex] || '') + ' ' + p.year;
  }

  function getUserRestrictedUnit(user) {
    if (!user) return null;
    var role = (user.role || '').toLowerCase();
    if (role === 'administrator' || role === 'admin') {
      return null;
    }
    var uName = (user.username || '').toLowerCase();
    var site = (user.site || '').toLowerCase();
    var name = (user.name || '').toLowerCase();
    var combined = uName + ' ' + site + ' ' + name;

    if (combined.includes('fixed')) {
      return 'FIXED';
    } else if (combined.includes('mobile')) {
      return 'MOBILE';
    } else if (combined.includes('ecare') || combined.includes('e-care') || combined.includes('e care')) {
      return 'ECARE';
    } else if (combined.includes('priority') || combined.includes('prio')) {
      return 'PRIORITY';
    }
    return null;
  }

  function addFacilitatorNotification(ticketId, facilitator, unitLabel, issueText) {
    try {
      var raw = localStorage.getItem('koncho_facilitator_notifications') || '[]';
      var notifs = JSON.parse(raw);
      notifs.unshift({
        id: ticketId,
        facilitator: facilitator,
        unit: unitLabel,
        title: issueText,
        time: new Date().toISOString(),
        read: false
      });
      if (notifs.length > 30) notifs = notifs.slice(0, 30);
      localStorage.setItem('koncho_facilitator_notifications', JSON.stringify(notifs));
    } catch(e) {}
  }

  function checkFacilitatorNotifications() {
    if (!state.authUser) return;
    var userRole = (state.authUser.role || '').toLowerCase();
    var userName = (state.authUser.name || state.authUser.username || '').toLowerCase();
    if (userRole !== 'facilitator' && userRole !== 'administrator') return;

    try {
      var raw = localStorage.getItem('koncho_facilitator_notifications') || '[]';
      var notifs = JSON.parse(raw);
      var unread = notifs.filter(function(n) {
        return !n.read && (userRole === 'administrator' || userName.includes(n.facilitator.toLowerCase()));
      });
      if (unread.length > 0) {
        setTimeout(function() {
          showToast('🔔 Anda memiliki ' + unread.length + ' tugas kasus baru yang diteruskan kepada Fasilitator: ' + (userRole === 'administrator' ? 'Tim CHO' : state.authUser.name) + '!', 'info');
        }, 1200);
        unread.forEach(function(n) { n.read = true; });
        localStorage.setItem('koncho_facilitator_notifications', JSON.stringify(notifs));
      }
    } catch(e) {}
  }

  function hideUnitBtn(btn) {
    if (!btn) return;
    btn.style.setProperty('display', 'none', 'important');
    btn.classList.add('unit-hidden');
    btn.hidden = true;
  }

  function showUnitBtn(btn) {
    if (!btn) return;
    btn.style.setProperty('display', 'flex', 'important');
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.gap = '6px';
    btn.classList.remove('unit-hidden');
    btn.hidden = false;
  }

  function openNewModal(dateContext) {
    if (state.authUser && (state.authUser.role === 'Facilitator' || state.authUser.role === 'Viewer')) {
      showToast('Akses ditolak: Peran ' + state.authUser.role + ' tidak berwenang menginput data kasus baru.', 'error');
      return;
    }

    var restrictedUnit = getUserRestrictedUnit(state.authUser);
    var toggleContainer = document.querySelector('#newDataModal .modal-service-toggle');

    if (restrictedUnit) {
      // Sembunyikan opsi unit yang tidak sesuai, tampilkan hanya unit yang diizinkan untuk akun login
      if (restrictedUnit === 'MOBILE') {
        showUnitBtn(dom.toggleMobile);
        hideUnitBtn(dom.toggleFixed);
        hideUnitBtn(dom.toggleEcare);
        hideUnitBtn(dom.togglePriority);
      } else if (restrictedUnit === 'FIXED') {
        hideUnitBtn(dom.toggleMobile);
        showUnitBtn(dom.toggleFixed);
        hideUnitBtn(dom.toggleEcare);
        hideUnitBtn(dom.togglePriority);
      } else if (restrictedUnit === 'ECARE') {
        hideUnitBtn(dom.toggleMobile);
        hideUnitBtn(dom.toggleFixed);
        showUnitBtn(dom.toggleEcare);
        hideUnitBtn(dom.togglePriority);
      } else if (restrictedUnit === 'PRIORITY') {
        hideUnitBtn(dom.toggleMobile);
        hideUnitBtn(dom.toggleFixed);
        hideUnitBtn(dom.toggleEcare);
        showUnitBtn(dom.togglePriority);
      }

      if (toggleContainer) {
        toggleContainer.style.setProperty('grid-template-columns', '1fr', 'important');
      }
      setNewModalService(restrictedUnit);
    } else {
      // Administrator: tampilkan semua 4 pilihan unit
      showUnitBtn(dom.toggleMobile);
      showUnitBtn(dom.toggleFixed);
      showUnitBtn(dom.toggleEcare);
      showUnitBtn(dom.togglePriority);

      if (toggleContainer) {
        toggleContainer.style.setProperty('grid-template-columns', 'repeat(4, 1fr)', 'important');
      }

      if (state.activeServiceScope === 'FIXED') {
        setNewModalService('FIXED');
      } else if (state.activeServiceScope === 'ECARE') {
        setNewModalService('ECARE');
      } else if (state.activeServiceScope === 'PRIORITY') {
        setNewModalService('PRIORITY');
      } else {
        setNewModalService('MOBILE');
      }
    }

    // Jika dibuka dari tanggal kalender (atau sedang di view kalender), sinkronkan Tanggal Agenda & Bulan - Tahun
    var now = new Date();
    var ctx = (dateContext && typeof dateContext.year === 'number' && typeof dateContext.monthIndex === 'number' && typeof dateContext.day === 'number')
      ? dateContext
      : (state.activeView === 'calendar' && typeof state.selectedYear === 'number' && typeof state.selectedMonthIndex === 'number' && typeof state.selectedDate === 'number')
        ? { year: state.selectedYear, monthIndex: state.selectedMonthIndex, day: state.selectedDate }
        : { year: now.getFullYear(), monthIndex: now.getMonth(), day: now.getDate() };

    state.pendingCalendarDate = ctx;

    if (dom.inputTanggalAgenda) {
      dom.inputTanggalAgenda.value = toIsoDateString(ctx.year, ctx.monthIndex, ctx.day);
    }

    var datePill = document.getElementById('newModalDatePill');
    if (ctx && typeof CAL_MONTHS_ID !== 'undefined') {
      var targetMonthYear = CAL_MONTHS_ID[ctx.monthIndex] + ' ' + ctx.year;
      if (dom.inputBulanTahun) {
        var optExists = Array.from(dom.inputBulanTahun.options).some(function(o) { return o.value === targetMonthYear; });
        if (!optExists) {
          var newOpt = document.createElement('option');
          newOpt.value = targetMonthYear;
          newOpt.textContent = targetMonthYear;
          dom.inputBulanTahun.appendChild(newOpt);
        }
        dom.inputBulanTahun.value = targetMonthYear;
      }
      if (datePill) {
        datePill.textContent = '📅 Tanggal Terpilih: ' + formatFullIndoDate(ctx.year, ctx.monthIndex, ctx.day);
        datePill.style.display = 'inline-flex';
      }
    } else {
      if (dom.inputBulanTahun && state.activeMonthFilter !== 'all') {
        dom.inputBulanTahun.value = state.activeMonthFilter;
      }
      if (datePill) {
        datePill.style.display = 'none';
      }
    }

    // Kosongkan form inputan dan kunci Requestor sesuai user login
    if (dom.inputCaseIssue) dom.inputCaseIssue.value = '';
    if (dom.inputRequestor) {
      var loggedInUser = state.authUser;
      var lockedReq = (loggedInUser && (loggedInUser.site || loggedInUser.name || loggedInUser.username)) 
        ? (loggedInUser.site || loggedInUser.name || loggedInUser.username) 
        : 'Administrator Utama';
      dom.inputRequestor.value = lockedReq;
      dom.inputRequestor.readOnly = true;
      dom.inputRequestor.classList.add('input-locked');
    }
    if (dom.inputUrgency) {
      dom.inputUrgency.value = 'Low';
    }
    if (dom.inputProgress) dom.inputProgress.value = '';
    if (dom.inputDetailKendala) dom.inputDetailKendala.value = '';
    if (dom.inputNeedSupport) dom.inputNeedSupport.value = '';
    if (dom.inputNomorLayanan) dom.inputNomorLayanan.value = '';
    if (dom.inputNamaPelanggan) dom.inputNamaPelanggan.value = '';
    if (dom.inputWilayah) dom.inputWilayah.value = '';

    dom.newDataModal.classList.add('active');
    setTimeout(function() {
      if (dom.inputCaseIssue) dom.inputCaseIssue.focus();
    }, 150);
  }

  function closeNewModal() {
    dom.newDataModal.classList.remove('active');
    state.pendingCalendarDate = null;
    var datePill = document.getElementById('newModalDatePill');
    if (datePill) datePill.style.display = 'none';
    if (dom.inputCaseIssue) dom.inputCaseIssue.value = '';
    if (dom.inputRequestor) {
      var loggedInUser = state.authUser;
      dom.inputRequestor.value = (loggedInUser && (loggedInUser.site || loggedInUser.name || loggedInUser.username)) ? (loggedInUser.site || loggedInUser.name || loggedInUser.username) : 'Administrator Utama';
    }
    if (dom.inputProgress) dom.inputProgress.value = '';
    if (dom.inputDetailKendala) dom.inputDetailKendala.value = '';
    if (dom.inputNeedSupport) dom.inputNeedSupport.value = '';
    if (dom.inputNomorLayanan) dom.inputNomorLayanan.value = '';
    if (dom.inputNamaPelanggan) dom.inputNamaPelanggan.value = '';
    if (dom.inputWilayah) dom.inputWilayah.value = '';
  }

  function setNewModalService(srv) {
    var restrictedUnit = getUserRestrictedUnit(state.authUser);
    if (restrictedUnit && srv !== restrictedUnit) {
      srv = restrictedUnit;
    }
    selectedNewService = srv;
    if (dom.toggleMobile) dom.toggleMobile.classList.toggle('active', srv === 'MOBILE');
    if (dom.toggleFixed) dom.toggleFixed.classList.toggle('active', srv === 'FIXED');
    if (dom.toggleEcare) dom.toggleEcare.classList.toggle('active', srv === 'ECARE');
    if (dom.togglePriority) dom.togglePriority.classList.toggle('active', srv === 'PRIORITY');

    if (srv === 'MOBILE') {
      if (dom.lblNomorLayanan) dom.lblNomorLayanan.textContent = 'Nomor MSISDN Pelanggan';
      if (dom.lblWilayah) dom.lblWilayah.textContent = 'Regional / Cluster';
      if (dom.inputNomorLayanan) dom.inputNomorLayanan.placeholder = 'Contoh: 081234567890';
      if (dom.inputWilayah) dom.inputWilayah.placeholder = 'Contoh: Regional 2 / Sudirman';
    } else if (srv === 'ECARE') {
      if (dom.lblNomorLayanan) dom.lblNomorLayanan.textContent = 'Nomor Tiket / Channel eCare';
      if (dom.lblWilayah) dom.lblWilayah.textContent = 'Channel / Touchpoint eCare';
      if (dom.inputNomorLayanan) dom.inputNomorLayanan.placeholder = 'Contoh: EC-20261105-001 / MyTelkomsel';
      if (dom.inputWilayah) dom.inputWilayah.placeholder = 'Contoh: MyTelkomsel / Veronika / Portal Web';
    } else if (srv === 'PRIORITY') {
      if (dom.lblNomorLayanan) dom.lblNomorLayanan.textContent = 'Nomor Tiket / ID Layanan Priority';
      if (dom.lblWilayah) dom.lblWilayah.textContent = 'Kategori / Segment Priority';
      if (dom.inputNomorLayanan) dom.inputNomorLayanan.placeholder = 'Contoh: PRIO-20261113-001 / VIP Customer';
      if (dom.inputWilayah) dom.inputWilayah.placeholder = 'Contoh: Enterprise / Platinum / High-Value';
    } else {
      if (dom.lblNomorLayanan) dom.lblNomorLayanan.textContent = 'Nomor Internet / PSTN';
      if (dom.lblWilayah) dom.lblWilayah.textContent = 'Witel / Datel / ODP';
      if (dom.inputNomorLayanan) dom.inputNomorLayanan.placeholder = 'Contoh: 122456789012';
      if (dom.inputWilayah) dom.inputWilayah.placeholder = 'Contoh: Witel Bandung / ODP-BDG-01';
    }
  }

  function handleSubmitNewReport() {
    if (state.authUser && (state.authUser.role === 'Facilitator' || state.authUser.role === 'Viewer')) {
      showToast('Akses ditolak: Peran ' + state.authUser.role + ' tidak memiliki hak untuk menginput data kasus baru.', 'error');
      closeNewModal();
      return;
    }
    var issue = dom.inputCaseIssue.value.trim();
    var req = dom.inputRequestor.value.trim();
    var bulan = dom.inputBulanTahun ? dom.inputBulanTahun.value : (state.activeMonthFilter !== 'all' ? state.activeMonthFilter : 'Oktober 2026');
    var st = dom.inputStatus.value;
    var progressQW = dom.inputProgressQuickWin ? dom.inputProgressQuickWin.value.trim() : '';
    var detail = dom.inputDetail ? dom.inputDetail.value.trim() : '';
    var needSupport = dom.inputNeedSupport ? dom.inputNeedSupport.value.trim() : '';
    var follow = dom.inputFollowUp ? dom.inputFollowUp.value.trim() : '-';
    var nomor = dom.inputNomorLayanan ? dom.inputNomorLayanan.value.trim() : '-';
    var nama = dom.inputNamaPelanggan ? dom.inputNamaPelanggan.value.trim() : '-';
    var wil = dom.inputWilayah ? dom.inputWilayah.value.trim() : '-';

    if (!issue) {
      showToast('Harap isi Case Isu yang Masuk!', 'error');
      dom.inputCaseIssue.focus();
      return;
    }
    if (!req) {
      showToast('Harap isi Requestor!', 'error');
      dom.inputRequestor.focus();
      return;
    }
    if (!bulan) {
      showToast('Harap tentukan Bulan - Tahun!', 'error');
      if (dom.inputBulanTahun) dom.inputBulanTahun.focus();
      return;
    }
    if (!detail) {
      showToast('Harap isi Issue Details!', 'error');
      if (dom.inputDetail) dom.inputDetail.focus();
      return;
    }

    var rawDateInputVal = dom.inputTanggalAgenda ? dom.inputTanggalAgenda.value : '';
    var pickedParts = parseDateParts(rawDateInputVal) || state.pendingCalendarDate;
    var nowFallback = new Date();
    if (!pickedParts) {
      pickedParts = { year: nowFallback.getFullYear(), monthIndex: nowFallback.getMonth(), day: nowFallback.getDate() };
    }
    var targetIsoDate = toIsoDateString(pickedParts.year, pickedParts.monthIndex, pickedParts.day);
    var savedCalCtx = { year: pickedParts.year, monthIndex: pickedParts.monthIndex, day: pickedParts.day };

    if (!bulan && typeof CAL_MONTHS_ID !== 'undefined') {
      bulan = CAL_MONTHS_ID[pickedParts.monthIndex] + ' ' + pickedParts.year;
    }

    // Validasi upload format khusus PDF jika user memilih file
    var attachedPdfFile = (dom.newCasePptFile && dom.newCasePptFile.files && dom.newCasePptFile.files.length > 0) ? dom.newCasePptFile.files[0] : null;
    if (attachedPdfFile) {
      var fileExt = attachedPdfFile.name.split('.').pop().toLowerCase();
      if (fileExt !== 'pdf') {
        showToast('Format file lampiran harus PDF (.pdf)!', 'error');
        return;
      }
    }

    var urgency = (dom.inputUrgency ? dom.inputUrgency.value : 'Low') || 'Low';
    var assignedFacilitator = getFacilitatorForRequestor(req);
    var currentInputUser = getCurrentLoggedInUserName();
    var targetSheetName = selectedNewService === 'MOBILE' ? 'Mobile' : (selectedNewService === 'ECARE' ? 'eCare' : (selectedNewService === 'PRIORITY' ? 'Priority' : 'Fixed'));
    var targetUnitLabel = selectedNewService === 'MOBILE' ? 'CHO Mobile' : (selectedNewService === 'ECARE' ? 'CHO eCare' : (selectedNewService === 'PRIORITY' ? 'CHO Priority' : 'CHO Fixed'));

    // Buat Ticket ID baru unik format konCHO: CHO-M/F/E/P-YYYYMMDD-XXXX
    var prefix = selectedNewService === 'FIXED' ? 'CHO-F' : (selectedNewService === 'ECARE' ? 'CHO-E' : (selectedNewService === 'PRIORITY' ? 'CHO-P' : 'CHO-M'));
    var dateCode = (targetIsoDate || '').replace(/-/g, '') || (pickedParts.year + String(pickedParts.monthIndex + 1).padStart(2, '0') + String(pickedParts.day).padStart(2, '0'));
    var rndCode = Math.floor(1000 + Math.random() * 9000);
    var newTicketId = prefix + '-' + dateCode + '-' + rndCode;

    var newRecord = {
      id: newTicketId,
      ticketId: newTicketId,
      serviceType: selectedNewService,
      bulan: bulan,
      totalCaseIsu: issue,
      caseIssue: issue,
      caseTitle: issue,
      requestor: req,
      inputBy: currentInputUser,
      status: st,
      urgency: urgency,
      picFacilitator: assignedFacilitator,
      followUpTo: follow,
      tanggal: targetIsoDate,
      tanggalInput: targetIsoDate,
      tanggalAgenda: targetIsoDate,
      nama: nama,
      nomorLayanan: nomor,
      detail: detail,
      issueDetails: detail,
      progress: progressQW,
      progressQuickWin: progressQW,
      needSupport: needSupport,
      pic: req,
      terakhirUpdate: targetIsoDate,
      statusInformasi: st === 'Open' ? 'Belum Ada Update' : 'Ada Update Baru',
      _localCreatedAt: Date.now()
    };

    // Rekam lampiran PDF bila diunggah
    if (attachedPdfFile) {
      try {
        var attachKey = selectedNewService + '_' + newTicketId;
        var fakeUrl = URL.createObjectURL(attachedPdfFile);
        if (!state.pptAttachments) state.pptAttachments = getStoredPptAttachments();
        state.pptAttachments[attachKey] = {
          fileUrl: fakeUrl,
          fileName: attachedPdfFile.name,
          uploadedBy: currentInputUser,
          uploadedAt: new Date().toISOString()
        };
        saveStoredPptAttachments(state.pptAttachments);
        newRecord.filePpt = fakeUrl;
        newRecord.fileName = attachedPdfFile.name;
      } catch(e) {
        console.warn('Gagal membaca PDF lokal:', e);
      }
    }

    // Rekam log awal di state.logs
    if (!Array.isArray(state.logs)) state.logs = [];
    var nowIso = new Date().toISOString();
    var nowDisplay = typeof formatDisplayTime === 'function' ? formatDisplayTime(nowIso) : nowIso;
    state.logs.unshift({
      logId: 'LOG-' + dateCode + '-' + rndCode,
      ticketId: newTicketId,
      serviceType: selectedNewService,
      user: currentInputUser,
      author: currentInputUser,
      message: 'Laporan baru dibuat untuk Unit ' + targetUnitLabel + ' (Requestor: ' + req + ') diteruskan ke Fasilitator: ' + assignedFacilitator,
      status: st,
      followUpTo: follow,
      tanggal: nowIso,
      timestamp: nowDisplay
    });

    // 1. Masukkan ke state.records & pool masing-masing unit
    if (!Array.isArray(state.records)) state.records = [];
    state.records.unshift(newRecord);
    saveSharedRecords(state.records);
    broadcastRecordUpdate('NEW_RECORD', newRecord);

    if (selectedNewService === 'MOBILE') {
      if (!state.mobileRecords) state.mobileRecords = [];
      state.mobileRecords.unshift(newRecord);
    } else if (selectedNewService === 'FIXED') {
      if (!state.fixedRecords) state.fixedRecords = [];
      state.fixedRecords.unshift(newRecord);
    } else if (selectedNewService === 'ECARE') {
      if (!state.ecareRecords) state.ecareRecords = [];
      state.ecareRecords.unshift(newRecord);
    } else if (selectedNewService === 'PRIORITY') {
      if (!state.priorityRecords) state.priorityRecords = [];
      state.priorityRecords.unshift(newRecord);
    }

    // 2. Navigasikan Kalender ke bulan & tanggal kasus baru agar seketika tampil di Grid
    if (typeof setCalendarMonthYear === 'function' && savedCalCtx) {
      setCalendarMonthYear(savedCalCtx.year, savedCalCtx.monthIndex, savedCalCtx.day);
    } else {
      state.selectedYear = savedCalCtx.year;
      state.selectedMonthIndex = savedCalCtx.monthIndex;
      state.selectedDate = savedCalCtx.day;
    }

    // 3. Pastikan filter Tasks tidak menyembunyikan kasus baru
    state.tasksFilterPeriod = 'all';
    var periodFilterEl = document.getElementById('select-period-filter');
    if (periodFilterEl) periodFilterEl.value = 'all';

    var taskSearchEl = document.getElementById('task-search-input');
    if (taskSearchEl && state.searchQuery) {
      state.searchQuery = '';
      taskSearchEl.value = '';
    }

    // 4. Tutup modal & bersihkan formulir seketika
    closeNewModal();
    resetNewForm();

    // 5. Render seluruh tampilan seketika (Grid Kalender, Drawer/Panel Kanan, Tabel Tasks, KPI)
    if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
    if (typeof renderCalendarRightPanel === 'function') renderCalendarRightPanel(savedCalCtx.day);
    if (typeof openCalendarDayDrawer === 'function' && state.activeView === 'calendar') openCalendarDayDrawer();
    if (typeof renderTasksTable === 'function') renderTasksTable();
    if (typeof updateTasksKpis === 'function') updateTasksKpis();
    if (typeof updateKpiCounters === 'function') updateKpiCounters();
    if (typeof renderActivityFeed === 'function') renderActivityFeed();
    if (typeof renderCaseList === 'function') renderCaseList();

    // 6. Notifikasi seketika kepada pengguna & Fasilitator yang dituju
    showToast('✨ Kasus #' + newTicketId + ' berhasil dibuat! Diteruskan ke Fasilitator: ' + assignedFacilitator, 'success');

    // Rekam notifikasi di antrean notifikasi fasilitator
    addFacilitatorNotification(newTicketId, assignedFacilitator, targetUnitLabel, issue);

    // Jika akun yang sedang login adalah Fasilitator terkait, berikan notifikasi khusus
    var authName = (state.authUser && (state.authUser.name || state.authUser.username) || '').toLowerCase();
    if (authName.includes(assignedFacilitator.toLowerCase())) {
      setTimeout(function() {
        showToast('🔔 Notifikasi Fasilitator: Kasus #' + newTicketId + ' diteruskan kepada Anda!', 'info');
      }, 700);
    }

    // 7. Sinkronisasi latar belakang ke Google Apps Script / Spreadsheet
    var payload = {
      serviceType: selectedNewService,
      bulan: bulan,
      tanggal: targetIsoDate,
      totalCaseIsu: issue,
      caseIssue: issue,
      requestor: req,
      inputBy: currentInputUser,
      status: st,
      urgency: urgency,
      picFacilitator: assignedFacilitator,
      progressQuickWin: progressQW,
      progress: progressQW,
      detail: detail,
      issueDetails: detail,
      needSupport: needSupport,
      followUpTo: follow,
      nomorLayanan: nomor,
      namaPelanggan: nama,
      pic: req,
      customFields: {
        'Bulan - Tahun': bulan,
        'Case Isu yang Masuk': issue,
        'Progress & Quick Win (Temporary Solution)': progressQW,
        'Need Support': needSupport,
        'Issue Details (Description)': detail,
        'Regional_Cluster': wil,
        'Witel_Datel': wil
      }
    };

    if (state.isGasEnvironment) {
      google.script.run
        .withSuccessHandler(function(res) {
          if (res && res.success) {
            if (res.ticketId && res.ticketId !== newTicketId) {
              newRecord.id = res.ticketId;
              newRecord.ticketId = res.ticketId;
              if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
              if (typeof renderCalendarRightPanel === 'function') renderCalendarRightPanel(savedCalCtx.day);
              if (typeof renderTasksTable === 'function') renderTasksTable();
            }
          }
        })
        .withFailureHandler(function(err) {
          console.warn('Apps Script error:', err);
        })
        .submitNewData(payload);
    } else if (state.gasApiUrl) {
      try {
        fetch(state.gasApiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'submitNewData', data: payload })
        });
        // Sinkronkan ulang data dari cloud secara bertahap untuk memastikan konsistensi antar-browser
        setTimeout(function() { silentlySyncFromCloud(); }, 1200);
        setTimeout(function() { silentlySyncFromCloud(); }, 3500);
      } catch (e) {
        console.warn('Sync POST error:', e);
      }
    }
  }

  function resetNewForm() {
    if (dom.inputBulanTahun) {
      dom.inputBulanTahun.value = state.activeMonthFilter !== 'all' ? state.activeMonthFilter : 'Oktober 2026';
    }
    dom.inputCaseIssue.value = '';
    if (dom.inputRequestor) {
      var loggedInUser = state.authUser;
      dom.inputRequestor.value = (loggedInUser && (loggedInUser.site || loggedInUser.name || loggedInUser.username)) ? (loggedInUser.site || loggedInUser.name || loggedInUser.username) : 'Administrator Utama';
      dom.inputRequestor.readOnly = true;
    }
    dom.inputStatus.value = 'Open';
    if (dom.inputUrgency) dom.inputUrgency.value = 'Low';
    if (dom.inputProgressQuickWin) dom.inputProgressQuickWin.value = '';
    if (dom.inputDetail) dom.inputDetail.value = '';
    if (dom.inputNeedSupport) dom.inputNeedSupport.value = '';
    if (dom.inputFollowUp) dom.inputFollowUp.value = '';
    if (dom.inputNomorLayanan) dom.inputNomorLayanan.value = '';
    if (dom.inputNamaPelanggan) dom.inputNamaPelanggan.value = '';
    if (dom.inputWilayah) dom.inputWilayah.value = '';
  }

  /**
   * Utilities & Toast
   */
  function showToast(msg, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span>' + escapeHtml(msg) + '</span>';
    dom.toastContainer.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 3500);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatLogTimestamp(dateInput) {
    if (!dateInput) return '-';
    var str = String(dateInput).trim();
    if (!str) return '-';

    var isPm = /\bPM\b/i.test(str);
    var isAm = /\bAM\b/i.test(str);

    var d = null;
    // Format "YYYY-MM-DD HH:mm:ss" -> ubah ke "YYYY-MM-DDTHH:mm:ss" agar konsisten di seluruh browser
    var isoCandidate = str.replace(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/, '$1T$2');
    var parsed = new Date(isoCandidate);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else {
      var d2 = new Date(str);
      if (!isNaN(d2.getTime())) d = d2;
    }

    if (d) {
      var y = d.getFullYear();
      var day = String(d.getDate()).padStart(2, '0');
      var hh = String(d.getHours()).padStart(2, '0');
      var mm = String(d.getMinutes()).padStart(2, '0');
      var ss = String(d.getSeconds()).padStart(2, '0');

      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      var mName = months[d.getMonth()] || String(d.getMonth() + 1).padStart(2, '0');

      // Standar 24-jam tanpa format AM/PM (WIB)
      return day + ' ' + mName + ' ' + y + ', ' + hh + ':' + mm + ':' + ss + ' WIB';
    }

    // Jika string hanya memuat jam dengan AM/PM (misal: "02:41:02 PM")
    if (isAm || isPm) {
      var timeMatch = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (timeMatch) {
        var h = parseInt(timeMatch[1], 10);
        var min = timeMatch[2];
        var sec = timeMatch[3] || '00';
        var meridiem = (timeMatch[4] || (isPm ? 'PM' : 'AM')).toUpperCase();
        if (meridiem === 'PM' && h < 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        var h24 = String(h).padStart(2, '0');
        return h24 + ':' + min + ':' + sec + ' WIB';
      }
    }

    return str.replace(/\s*(AM|PM)\b/gi, '').trim() + ' WIB';
  }

  function formatDisplayTime(dateString) {
    if (!dateString) return '-';
    return formatLogTimestamp(dateString);
  }

  /**
   * Mock Data Generator
   * Data Sheet Mobile Bulan Oktober: 4 Kasus (3 Open, 1 InProgress)
   */
  function generateMockData() {
    return {
      success: true,
      mobileHeaders: ['ID_Tiket', 'Total Case Isu yang masuk', 'Nomor_MSISDN', 'Nama_Pelanggan', 'Regional_Cluster', 'Kategori_Keluhan', 'Requestor', 'Status', 'Follow up to', 'Detail_Kendala', 'Terakhir_Update', 'Status_Informasi'],
      fixedHeaders: ['ID_Tiket', 'Total Case Isu yang masuk', 'Nomor_Internet_PSTN', 'Nama_Pelanggan', 'Witel_Datel', 'Kategori_Kendala', 'Requestor', 'Status', 'Follow up to', 'Detail_Kendala', 'Terakhir_Update', 'Status_Informasi'],
      ecareHeaders: ['ID_Tiket', 'Bulan - Tahun', 'Case Isu yang Masuk', 'Issue Details (Description)', 'Progress & Quick Win (Temporary Solution)', 'Need Support', 'Requestor', 'Status', 'Follow up to', 'Status Update', 'Tanggal_Agenda', 'Terakhir_Update', 'File PPT', 'Input_By', 'PIC_Facilitator', 'Keterangan_Progress', 'Keterangan_Closed', 'Closed_By'],
      priorityHeaders: ['ID_Tiket', 'Bulan - Tahun', 'Case Isu yang Masuk', 'Issue Details (Description)', 'Progress & Quick Win (Temporary Solution)', 'Need Support', 'Requestor', 'Status', 'Follow up to', 'Status Update', 'Tanggal_Agenda', 'Terakhir_Update', 'File PPT', 'Input_By', 'PIC_Facilitator', 'Keterangan_Progress', 'Keterangan_Closed', 'Closed_By'],
      priorityRecords: [],
      ecareRecords: [],
      fixedRecords: [],
      mobileRecords: [],
      users: DEFAULT_USER_ACCOUNTS
    };
  }

  const DEFAULT_CALENDAR_DATA = {
    'november-2026': {
      title: "November 2026",
      badge: "Cycle CHO • Nov 2026",
      startDayIndex: 6, // 1 Nov 2026 = Minggu (0: Sen .. 6: Min)
      totalDays: 30,
      prevMonthSpill: [26, 27, 28, 29, 30, 31],
      nextMonthSpill: [1, 2, 3, 4, 5, 6],
      summary: { agendas: 0, issues: 0, quickwins: 0 },
      items: {},
      details: {}
    },
    'oktober-2026': {
      title: "Oktober 2026",
      badge: "Cycle CHO • Okt 2026",
      startDayIndex: 3, // 1 Okt 2026 = Kamis (0: Sen, 1: Sel, 2: Rab, 3: Kam, 4: Jum, 5: Sab, 6: Min)
      totalDays: 31,
      prevMonthSpill: [28, 29, 30],
      nextMonthSpill: [1],
      summary: { agendas: 0, issues: 0, quickwins: 0 },
      items: {},
      details: {}
    }
  };

  const CAL_MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const CAL_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const CAL_DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Inisialisasi tanggal & bulan dinamis mengikuti bulan berjalan saat ini
  const _nowInit = new Date();
  state.activeView = 'calendar';
  state.selectedYear = _nowInit.getFullYear();
  state.selectedMonthIndex = _nowInit.getMonth(); // Otomatis bulan berjalan (misal: 10 = Nov, 11 = Des)
  state.pickerBrowseYear = _nowInit.getFullYear();
  state.selectedDate = _nowInit.getDate();
  state.selectedMonth = getCalendarMonthKey(_nowInit.getFullYear(), _nowInit.getMonth());
  state.tasksFilterUnit = 'all';
  state.calendarStatusFilter = 'all';
  state.tasksFilterStatus = 'all';
  state.tasksFilterPeriod = 'all';

  function getCalendarMonthKey(year, monthIndex) {
    const name = (CAL_MONTHS_ID[monthIndex] || 'Oktober').toLowerCase();
    return name + '-' + year;
  }

  function parseMonthKey(key) {
    if (!key || typeof key !== 'string') return { year: 2026, monthIndex: 9 };
    const parts = key.toLowerCase().split('-');
    const mIdx = CAL_MONTHS_ID.findIndex(m => m.toLowerCase() === parts[0]);
    const yr = parseInt(parts[1], 10);
    return {
      monthIndex: mIdx >= 0 ? mIdx : 9,
      year: !isNaN(yr) ? yr : 2026
    };
  }

  function formatFullIndoDate(year, monthIndex, day) {
    const dt = new Date(year, monthIndex, day);
    const dayName = CAL_DAYS_ID[dt.getDay()] || 'Tanggal';
    return dayName + ', ' + day + ' ' + CAL_MONTHS_ID[monthIndex] + ' ' + year;
  }

  function getCalendarMonthData(year, monthIndex) {
    const key = getCalendarMonthKey(year, monthIndex);
    const title = CAL_MONTHS_ID[monthIndex] + ' ' + year;
    const badge = 'Cycle CHO • ' + CAL_MONTHS_SHORT[monthIndex] + ' ' + year;

    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayJs = new Date(year, monthIndex, 1).getDay();
    const startDayIndex = (firstDayJs + 6) % 7; // 0: Sen .. 6: Min

    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
    const prevMonthSpill = [];
    for (let i = startDayIndex - 1; i >= 0; i--) {
      prevMonthSpill.push(prevMonthLastDay - i);
    }

    const totalGridCells = startDayIndex + totalDays;
    const trailingCount = (7 - (totalGridCells % 7)) % 7;
    const nextMonthSpill = [];
    for (let i = 1; i <= trailingCount; i++) {
      nextMonthSpill.push(i);
    }

    const base = (state.dataSource === 'simulation' && DEFAULT_CALENDAR_DATA[key]) ? DEFAULT_CALENDAR_DATA[key] : null;
    const items = {};
    const details = {};

    if (base && base.items) {
      Object.keys(base.items).forEach(d => {
        items[d] = base.items[d].map(it => Object.assign({}, it));
      });
    }
    if (base && base.details) {
      Object.keys(base.details).forEach(d => {
        details[d] = JSON.parse(JSON.stringify(base.details[d]));
      });
    }

    // Integrasikan record live dari Spreadsheet/state.records yang cocok bulan & tahun
    if (Array.isArray(state.records)) {
      state.records.forEach(rec => {
        if (!rec) return;
        const recMonthStr = (rec.bulan || '').trim().toLowerCase();
        const expectedMonthStr = title.toLowerCase();
        const recParts = parseDateParts(rec.tanggalAgenda || rec.tanggalInput || rec.tanggal || rec.terakhirUpdate);
        let matchesMonth = false;
        let recDay = null;

        if (recParts) {
          if (recParts.year === year && recParts.monthIndex === monthIndex) {
            matchesMonth = true;
            recDay = recParts.day;
          } else if (recMonthStr === expectedMonthStr) {
            matchesMonth = true;
            recDay = recParts.day;
          }
        }

        if (!matchesMonth || !recDay || recDay < 1 || recDay > totalDays) return;

        // Status filter
        const stNorm = (rec.status || 'Open').toLowerCase().replace(/\s+/g, '');
        const isClosed = stNorm === 'closed';
        const isInProg = stNorm === 'inprogress';
        const statusKey = isClosed ? 'closed' : (isInProg ? 'inprogress' : 'open');

        if (state.calendarStatusFilter === 'active' && isClosed) return;
        if (state.calendarStatusFilter === 'closed' && !isClosed) return;

        if (!items[recDay]) items[recDay] = [];
        const unitKey = rec.serviceType === 'FIXED' ? 'fixed' : (rec.serviceType === 'ECARE' ? 'ecare' : (rec.serviceType === 'PRIORITY' ? 'priority' : 'mobile'));
        const titleText = rec.totalCaseIsu || 'Isu CHO';
        const alreadyListed = items[recDay].some(it =>
          it.ticketId && String(it.ticketId) === String(rec.id)
        );

        if (!alreadyListed) {
          items[recDay].push({
            type: isClosed ? 'quickwin' : 'issue',
            unit: unitKey,
            text: titleText,
            statusNorm: statusKey,
            urgent: statusKey === 'open',
            ticketId: rec.id,
            serviceType: rec.serviceType || 'MOBILE',
            urgency: rec.urgency || 'Middle',
            picFacilitator: rec.picFacilitator || getFacilitatorForRequestor(rec.requestor),
            record: rec
          });
        }
      });
    }

    // Hitung total seluruh agenda & inputan kasus CHO pada bulan ini
    let summaryAgendas = 0;
    Object.keys(items).forEach(d => {
      summaryAgendas += (items[d] || []).length;
    });
    let summaryIssues = 0;
    let summaryQuickwins = 0;

    return {
      key: key,
      title: title,
      badge: badge,
      year: year,
      monthIndex: monthIndex,
      startDayIndex: startDayIndex,
      totalDays: totalDays,
      prevMonthSpill: prevMonthSpill,
      nextMonthSpill: nextMonthSpill,
      items: items,
      details: details,
      summary: {
        agendas: summaryAgendas,
        issues: summaryIssues,
        quickwins: summaryQuickwins
      }
    };
  }

  function setCalendarMonthYear(year, monthIndex, targetDay) {
    state.selectedYear = year;
    state.selectedMonthIndex = monthIndex;
    state.pickerBrowseYear = year;
    state.selectedMonth = getCalendarMonthKey(year, monthIndex);

    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    if (typeof targetDay === 'number' && !isNaN(targetDay)) {
      state.selectedDate = Math.max(1, Math.min(totalDays, targetDay));
    } else if (state.selectedDate > totalDays) {
      state.selectedDate = totalDays;
    }

    const monthLabelEl = document.getElementById('calendar-month-label');
    if (monthLabelEl) monthLabelEl.textContent = CAL_MONTHS_ID[monthIndex] + ' ' + year;

    const cycleBadgeEl = document.getElementById('calendar-cycle-badge');
    if (cycleBadgeEl) cycleBadgeEl.textContent = 'Cycle CHO • ' + CAL_MONTHS_SHORT[monthIndex] + ' ' + year;

    const selectEl = document.getElementById('select-month-jump');
    if (selectEl) {
      let opt = Array.from(selectEl.options).find(o => o.value === state.selectedMonth);
      if (!opt) {
        opt = document.createElement('option');
        opt.value = state.selectedMonth;
        opt.textContent = CAL_MONTHS_ID[monthIndex] + ' ' + year;
        selectEl.appendChild(opt);
      }
      selectEl.value = state.selectedMonth;
    }

    renderMonthYearPopover();
    closeCalendarDayDrawer();
    renderCalendarGrid();
    renderCalendarRightPanel(state.selectedDate);
  }

  function openCalendarDayDrawer() {
    const drawer = document.getElementById('calendar-day-drawer');
    if (drawer) {
      drawer.classList.remove('calendar-drawer-closed');
      drawer.classList.add('calendar-drawer-open');
    }
  }

  function closeCalendarDayDrawer() {
    const drawer = document.getElementById('calendar-day-drawer');
    if (drawer) {
      drawer.classList.remove('calendar-drawer-open');
      drawer.classList.add('calendar-drawer-closed');
    }
  }

  function renderMonthYearPopover() {
    const yearPillsEl = document.getElementById('picker-year-pills');
    const monthsGridEl = document.getElementById('picker-months-grid');
    if (!yearPillsEl || !monthsGridEl) return;

    const browseYear = state.pickerBrowseYear || state.selectedYear;
    const years = [browseYear - 1, browseYear, browseYear + 1, browseYear + 2];

    yearPillsEl.innerHTML = years.map(yr => {
      const isActiveYear = yr === browseYear;
      return '<button type="button" class="year-picker-pill px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ' +
        (isActiveYear ? 'is-active bg-[#061345] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100') +
        '" data-picker-year="' + yr + '">' + yr + '</button>';
    }).join('');

    yearPillsEl.querySelectorAll('[data-picker-year]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.pickerBrowseYear = parseInt(btn.getAttribute('data-picker-year'), 10);
        renderMonthYearPopover();
      });
    });

    monthsGridEl.innerHTML = CAL_MONTHS_SHORT.map((shortName, mIdx) => {
      const isSelected = (browseYear === state.selectedYear && mIdx === state.selectedMonthIndex);
      const key = getCalendarMonthKey(browseYear, mIdx);
      const hasData = (state.dataSource === 'simulation' && !!DEFAULT_CALENDAR_DATA[key]) || (Array.isArray(state.records) && state.records.some(r => {
        const dp = parseDateParts(r.tanggal || r.terakhirUpdate);
        return dp && dp.year === browseYear && dp.monthIndex === mIdx;
      }));

      return '<button type="button" data-picker-month="' + mIdx + '" class="month-picker-pill relative py-2 px-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1 ' +
        (isSelected ? 'is-active bg-[#061345] text-white' : 'bg-slate-50/90 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/70') + '">' +
        '<span>' + shortName + '</span>' +
        (hasData && !isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>' : '') +
        '</button>';
    }).join('');

    monthsGridEl.querySelectorAll('[data-picker-month]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mIdx = parseInt(btn.getAttribute('data-picker-month'), 10);
        setCalendarMonthYear(browseYear, mIdx);
        closeMonthYearPopover();
      });
    });
  }

  function openMonthYearPopover() {
    const pop = document.getElementById('modern-month-popover');
    const trig = document.getElementById('btn-month-year-trigger');
    const chev = document.getElementById('month-picker-chevron');
    if (!pop) return;
    state.pickerBrowseYear = state.selectedYear;
    renderMonthYearPopover();
    pop.classList.remove('hidden');
    if (trig) trig.setAttribute('aria-expanded', 'true');
    if (chev) chev.style.transform = 'rotate(180deg)';
  }

  function closeMonthYearPopover() {
    const pop = document.getElementById('modern-month-popover');
    const trig = document.getElementById('btn-month-year-trigger');
    const chev = document.getElementById('month-picker-chevron');
    if (!pop) return;
    pop.classList.add('hidden');
    if (trig) trig.setAttribute('aria-expanded', 'false');
    if (chev) chev.style.transform = 'rotate(0deg)';
  }

  function toggleMonthYearPopover() {
    const pop = document.getElementById('modern-month-popover');
    if (!pop) return;
    if (pop.classList.contains('hidden')) openMonthYearPopover();
    else closeMonthYearPopover();
  }

  function activateView(viewName, targetTicketId, targetDate) {
    const vActivity = document.getElementById('view-activity');
    const vCalendar = document.getElementById('view-calendar');
    const vTasks = document.getElementById('view-tasks');

    const navActivity = document.getElementById('nav-link-activity');
    const navCalendar = document.getElementById('nav-link-calendar');
    const navTasks = document.getElementById('nav-link-tasks');

    const activeClass = 'flex flex-col items-center justify-center w-full py-2 rounded-xl bg-white/20 text-white font-bold shadow-sm border border-white/10 transition-all group cursor-pointer';
    const inactiveClass = 'flex flex-col items-center justify-center w-full py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all group cursor-pointer';

    if (vActivity) vActivity.classList.add('hidden');
    if (vCalendar) vCalendar.classList.add('hidden');
    if (vTasks) vTasks.classList.add('hidden');

    if (navActivity) navActivity.className = inactiveClass;
    if (navCalendar) navCalendar.className = inactiveClass;
    if (navTasks) navTasks.className = inactiveClass;

    state.activeView = viewName;

    let targetViewEl = null;
    if (viewName === 'calendar') {
      targetViewEl = vCalendar;
      if (vCalendar) vCalendar.classList.remove('hidden');
      if (navCalendar) navCalendar.className = activeClass;
      if (targetDate) {
        state.selectedDate = parseInt(targetDate, 10);
      }
      renderCalendarGrid();
      renderCalendarRightPanel(state.selectedDate);

      if (targetTicketId) {
        openCalendarDayDrawer();
        showToast('Membuka Detail Isu ' + targetTicketId + ' pada Calendar', 'info');
        setTimeout(() => {
          const panel = document.getElementById('issue-cards-container');
          if (panel) {
            panel.classList.add('ring-2', 'ring-blue-500', 'p-1', 'rounded-xl');
            setTimeout(() => panel.classList.remove('ring-2', 'ring-blue-500', 'p-1'), 2000);
          }
        }, 300);
      } else {
        closeCalendarDayDrawer();
      }
    } else if (viewName === 'tasks') {
      targetViewEl = vTasks;
      if (vTasks) vTasks.classList.remove('hidden');
      if (navTasks) navTasks.className = activeClass;
      renderTasksTable();
      updateTasksKpis();
    } else if (viewName === 'activity') {
      targetViewEl = vActivity;
      if (vActivity) vActivity.classList.remove('hidden');
      if (navActivity) navActivity.className = activeClass;
      renderActivityFeed();
    }

    if (targetViewEl) {
      targetViewEl.classList.remove('view-fade-slide');
      void targetViewEl.offsetWidth; // trigger reflow for smooth animation
      targetViewEl.classList.add('view-fade-slide');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function normalizeUnitKey(val) {
    const s = String(val || '').trim().toUpperCase();
    if (!s || s === 'ALL') return 'ALL';
    if (s.includes('PRIORITY') || s.includes('PRIORITAS') || s.includes('PRIO')) return 'PRIORITY';
    if (s.includes('ECARE') || s.includes('E-CARE')) return 'ECARE';
    if (s.includes('FIXED')) return 'FIXED';
    if (s.includes('MOBILE')) return 'MOBILE';
    return s;
  }

  function getUnitMeta(val) {
    const key = normalizeUnitKey(val);
    if (key === 'PRIORITY') {
      return {
        key: 'PRIORITY',
        label: 'CHO Priority',
        shortBadge: 'CHO PRIORITY',
        pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-900'
      };
    }
    if (key === 'FIXED') {
      return {
        key: 'FIXED',
        label: 'CHO Fixed',
        shortBadge: 'CHO FIXED',
        pillClass: 'bg-teal-50 text-teal-700 border-teal-200',
        badgeClass: 'bg-teal-100 text-teal-800'
      };
    }
    if (key === 'ECARE') {
      return {
        key: 'ECARE',
        label: 'CHO eCare',
        shortBadge: 'CHO ECARE',
        pillClass: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeClass: 'bg-purple-100 text-purple-800'
      };
    }
    return {
      key: 'MOBILE',
      label: 'CHO Mobile',
      shortBadge: 'CHO MOBILE',
      pillClass: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeClass: 'bg-blue-100 text-[#061345]'
    };
  }

  function getUnitDisplayLabel(item) {
    // 1. Tampilkan unit spesifik asal inputan berdasarkan Requestor / InputBy pada item tiket
    if (item) {
      var req = String(item.requestor || item.inputBy || '').trim();
      if (req && req.toUpperCase().indexOf('CHO') >= 0) {
        return req;
      }
      var reqNorm = req.toLowerCase();
      if (reqNorm.includes('fixed') && reqNorm.includes('bandung')) return 'CHO Fixed CC Bandung';
      if (reqNorm.includes('fixed') && reqNorm.includes('semarang')) return 'CHO Fixed CC Semarang';
      if (reqNorm.includes('mobile') && reqNorm.includes('bandung')) return 'CHO Mobile CC Bandung';
      if (reqNorm.includes('mobile') && reqNorm.includes('semarang')) return 'CHO Mobile CC Semarang';
      if (reqNorm.includes('ecare') || reqNorm.includes('e care') || reqNorm.includes('e-care')) return 'CHO eCare';
      if (reqNorm.includes('priority') && reqNorm.includes('semarang')) return 'CHO Priority Semarang';
      if (reqNorm.includes('priority') && reqNorm.includes('bandung')) return 'CHO Priority Bandung';
      if (reqNorm.includes('fixed')) return 'CHO Fixed';
      if (reqNorm.includes('mobile')) return 'CHO Mobile';
    }

    // 2. Jika item dibuat oleh user yang sedang login dan belum memiliki requestor spesifik
    if (state.authUser && state.authUser.site) {
      return state.authUser.site;
    }

    // 3. Fallback default sesuai jenis serviceType
    var sType = (item && item.serviceType) ? item.serviceType : 'MOBILE';
    var uMeta = typeof getUnitMeta === 'function' ? getUnitMeta(sType) : { label: 'CHO Mobile' };
    return (uMeta && uMeta.label) ? uMeta.label : (sType === 'FIXED' ? 'CHO Fixed' : (sType === 'ECARE' ? 'CHO eCare' : (sType === 'PRIORITY' ? 'CHO Priority' : 'CHO Mobile')));
  }

  function getCalendarStatusMeta(statusVal) {
    const s = String(statusVal || 'open').toLowerCase().replace(/\s+/g, '');
    if (s === 'closed') {
      return {
        key: 'closed',
        label: 'Closed',
        topBadgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
        pillClass: 'bg-gradient-to-r from-emerald-50 to-teal-100/80 text-emerald-700 border border-emerald-300 font-bold',
        cardBadgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200'
      };
    }
    if (s === 'inprogress') {
      return {
        key: 'inprogress',
        label: 'InProgress',
        topBadgeClass: 'bg-orange-100 text-orange-700 border border-orange-300',
        pillClass: 'bg-gradient-to-r from-orange-50 to-amber-100/90 text-orange-700 border border-orange-300 font-bold',
        cardBadgeClass: 'bg-orange-100 text-orange-700 border-orange-200'
      };
    }
    return {
      key: 'open',
      label: 'Open',
      topBadgeClass: 'bg-rose-100 text-rose-700 border border-rose-300',
      pillClass: 'bg-gradient-to-r from-rose-50 to-rose-100/90 text-rose-700 border border-rose-300 font-bold',
      cardBadgeClass: 'bg-rose-100 text-rose-700 border-rose-200'
    };
  }

  function renderCalendarGrid() {
    const container = document.getElementById('calendar-grid-cells');
    if (!container) return;

    const calData = getCalendarMonthData(state.selectedYear, state.selectedMonthIndex);
    const startDay = calData.startDayIndex;
    const totalDays = calData.totalDays;
    const prevSpill = calData.prevMonthSpill || [];
    const nextSpill = calData.nextMonthSpill || [];

    const monthLabelEl = document.getElementById('calendar-month-label');
    if (monthLabelEl) monthLabelEl.textContent = calData.title;
    const cycleBadgeEl = document.getElementById('calendar-cycle-badge');
    if (cycleBadgeEl) cycleBadgeEl.textContent = calData.badge;

    // Hitung total inputan / agenda CHO pada bulan kalender yang aktif
    let totalMonthAgenda = 0;
    const activeCalUnit = normalizeUnitKey(state.tasksFilterUnit);
    if (calData && calData.items) {
      Object.keys(calData.items).forEach(d => {
        let dItems = calData.items[d] || [];
        if (activeCalUnit !== 'ALL') {
          dItems = dItems.filter(it => normalizeUnitKey(it.unit) === 'ALL' || normalizeUnitKey(it.unit) === activeCalUnit);
        }
        totalMonthAgenda += dItems.length;
      });
    }

    const agSumEl = document.getElementById('summary-agenda-count');
    if (agSumEl) agSumEl.textContent = totalMonthAgenda;
    const isSumEl = document.getElementById('summary-issue-count');
    const qwSumEl = document.getElementById('summary-quickwin-count');
    if (isSumEl) isSumEl.textContent = 0;
    if (qwSumEl) qwSumEl.textContent = 0;

    let html = '';

    prevSpill.forEach(d => {
      html += '<div class="calendar-day-cell min-h-[78px] sm:min-h-[90px] lg:min-h-[clamp(88px,12.2vh,118px)] p-2 sm:p-2.5 bg-slate-50/70 opacity-45 flex flex-col justify-between"><span class="text-xs sm:text-[13px] font-semibold text-slate-400">' + d + '</span><span class="text-[10px] text-slate-300">Bulan lalu</span></div>';
    });

    for (let day = 1; day <= totalDays; day++) {
      const isSelected = day === state.selectedDate;
      const isWeekend = ((startDay + day - 1) % 7 === 5) || ((startDay + day - 1) % 7 === 6);

      let dayItems = (calData.items && calData.items[day]) ? [...calData.items[day]] : [];
      const activeCalUnit = normalizeUnitKey(state.tasksFilterUnit);
      if (activeCalUnit !== 'ALL') {
        dayItems = dayItems.filter(it => normalizeUnitKey(it.unit) === 'ALL' || normalizeUnitKey(it.unit) === activeCalUnit);
      }
      const itemCount = dayItems.length;

      const hasDetails = !!(calData.details && calData.details[day]);
      const hasAnyDayContent = hasDetails || itemCount > 0;

      // Kumpulkan badge status + unit name unik pada tanggal ini (Open = Merah, InProgress = Orange, Closed = Hijau)
      const seenStatusUnits = [];
      dayItems.forEach(it => {
        if (it.type === 'meeting') return;
        const stKey = it.statusNorm
          || (it.record && (it.record.status || 'open').toLowerCase().replace(/\s+/g, ''))
          || (it.type === 'quickwin' ? 'closed' : (it.urgent ? 'open' : 'inprogress'));
        const normKey = stKey === 'closed' ? 'closed' : (stKey === 'inprogress' ? 'inprogress' : 'open');
        const uMeta = getUnitMeta(it.serviceType || it.unit);
        const comboKey = normKey + '|' + uMeta.key;
        if (!seenStatusUnits.some(x => x.comboKey === comboKey)) {
          seenStatusUnits.push({ comboKey: comboKey, statusKey: normKey, unitLabel: uMeta.label });
        }
      });
      const dayStatusBadgesHtml = seenStatusUnits.map(entry => {
        const sm = getCalendarStatusMeta(entry.statusKey);
        return '<span class="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold leading-tight ' + sm.topBadgeClass + '">' + sm.label + ' &bull; ' + escapeHtml(entry.unitLabel) + '</span>';
      }).join('');

      html += '<div class="calendar-day-cell group min-h-[78px] sm:min-h-[90px] lg:min-h-[clamp(88px,12.2vh,118px)] p-2 sm:p-2.5 flex flex-col justify-between cursor-pointer ' + (isSelected ? 'is-selected' : isWeekend ? 'bg-slate-50/45' : 'bg-white') + '" onclick="handleCalendarDateClick(' + day + ')">';
      html += '  <div class="flex items-center justify-between gap-1">';
      html += '    <div class="flex items-center gap-1.5 min-w-0 flex-wrap">';
      html += '      <span class="text-xs sm:text-[13px] font-extrabold ' + (isSelected ? 'text-blue-700 font-headline' : isWeekend ? 'text-slate-500' : 'text-slate-800') + '">' + day + '</span>';
      if (dayStatusBadgesHtml) {
        html += '      ' + dayStatusBadgesHtml;
      }
      html += '    </div>';
      if (isSelected) {
        html += '    <span class="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-600 text-white shadow-xs shrink-0">Dipilih</span>';
      } else if (itemCount > 0) {
        html += '    <span class="px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-slate-100 text-slate-600 shrink-0">' + itemCount + ' item</span>';
      } else {
        html += '    <span class="opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200/70 shrink-0">+ Input</span>';
      }
      html += '  </div>';

      html += '  <div class="flex flex-col gap-1 mt-1.5 overflow-hidden">';
      dayItems.slice(0, 2).forEach(item => {
        if (item.type === 'meeting') {
          html += '<span class="truncate px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-semibold bg-gradient-to-r from-blue-50 to-indigo-50/80 text-blue-700 border border-blue-200/80">&bull; ' + escapeHtml(item.text) + '</span>';
        } else {
          const itemStKey = item.statusNorm
            || (item.record && (item.record.status || 'open').toLowerCase().replace(/\s+/g, ''))
            || (item.type === 'quickwin' ? 'closed' : (item.urgent ? 'open' : 'inprogress'));
          const sm = getCalendarStatusMeta(itemStKey);
          html += '<span class="truncate px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] ' + sm.pillClass + '">&bull; ' + escapeHtml(item.text) + '</span>';
        }
      });
      if (itemCount > 2) {
        html += '<span class="text-[10px] text-slate-500 font-semibold pl-1">+' + (itemCount - 2) + ' lainnya</span>';
      }
      html += '  </div>';

      html += '  <div class="flex items-center justify-between text-[9.5px] mt-0.5">';
      html += '    <span class="text-blue-600/80 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">' + (hasAnyDayContent ? 'Lihat detail &rarr;' : '') + '</span>';
      html += '    <span class="text-slate-300">' + (isWeekend ? 'Akhir pekan' : '') + '</span>';
      html += '  </div>';
      html += '</div>';
    }

    nextSpill.forEach(d => {
      html += '<div class="calendar-day-cell min-h-[78px] sm:min-h-[90px] lg:min-h-[clamp(88px,12.2vh,118px)] p-2 sm:p-2.5 bg-slate-50/70 opacity-45 flex flex-col justify-between"><span class="text-xs sm:text-[13px] font-semibold text-slate-400">' + d + '</span><span class="text-[10px] text-slate-300">Bulan depan</span></div>';
    });

    container.innerHTML = html;
  }

  function handleCalendarDateClick(day) {
    state.selectedDate = day;
    renderCalendarGrid();

    const calData = getCalendarMonthData(state.selectedYear, state.selectedMonthIndex);
    const activeCalUnit = normalizeUnitKey(state.tasksFilterUnit);
    const dayItems = (calData.items && calData.items[day]) ? calData.items[day].filter(it =>
      activeCalUnit === 'ALL' || normalizeUnitKey(it.unit) === 'ALL' || normalizeUnitKey(it.unit) === activeCalUnit
    ) : [];
    const hasDetails = !!(calData.details && calData.details[day]);

    if (hasDetails || dayItems.length > 0) {
      try {
        renderCalendarRightPanel(day);
      } catch (err) {
        console.error('Error rendering calendar panel:', err);
      }
      openCalendarDayDrawer();
    } else {
      closeCalendarDayDrawer();
      if (state.authUser && (state.authUser.role === 'Facilitator' || state.authUser.role === 'Viewer')) {
        showToast(formatFullIndoDate(state.selectedYear, state.selectedMonthIndex, day) + ' belum memiliki agenda atau kasus.', 'info');
      } else {
        openNewModal({ year: state.selectedYear, monthIndex: state.selectedMonthIndex, day: day });
      }
    }
  }

  function renderCalendarRightPanel(day) {
    const calData = getCalendarMonthData(state.selectedYear, state.selectedMonthIndex);
    const fullDateStr = formatFullIndoDate(state.selectedYear, state.selectedMonthIndex, day);

    let agendas = [];
    let issues = [];
    let quickwins = [];

    let dayItems = (calData.items && calData.items[day]) ? [...calData.items[day]] : [];
    const activeCalUnit = normalizeUnitKey(state.tasksFilterUnit);
    if (activeCalUnit !== 'ALL') {
      dayItems = dayItems.filter(it => normalizeUnitKey(it.unit) === 'ALL' || normalizeUnitKey(it.unit) === activeCalUnit);
    }

    if (dayItems.length > 0) {
      dayItems.forEach(it => {
        const uMeta = getUnitMeta(it.serviceType || it.unit);
        if (it.type === 'meeting') {
          agendas.push({
            time: '09:00 - 10:30 WIB',
            unit: uMeta.label,
            unitClass: uMeta.pillClass,
            title: it.text,
            host: 'Tim CHO / PIC Terkait',
            roomText: 'Sync Room CHO',
            isWarRoom: false
          });
        } else if (it.type === 'quickwin' && !it.record) {
          quickwins.push({
            title: it.text,
            status: 'Selesai',
            statusClass: 'bg-emerald-100 text-emerald-800',
            pic: 'Oleh Tim CHO',
            done: true
          });
        } else {
          const rec = it.record || {};
          const st = (rec.status || it.statusNorm || (it.urgent ? 'Open' : 'InProgress')).toLowerCase().replace(/s+/g, '');
          const sm = getCalendarStatusMeta(st);
          issues.push({
            badge: sm.key === 'closed' ? 'CLOSED' : (sm.key === 'inprogress' ? 'IN PROGRESS' : 'OPEN'),
            badgeClass: sm.cardBadgeClass,
            unit: uMeta.label,
            unitClass: uMeta.pillClass,
            ticket: it.ticketId ? '#' + it.ticketId : '#CHO-' + day,
            title: rec.issueDetails || rec.detail || it.text,
            pic: rec.pic || rec.requestor || 'Tim CHO',
            requestor: rec.requestor || rec.pic || 'Tim CHO',
            urgency: rec.urgency || it.urgency || 'Middle',
            picFacilitator: rec.picFacilitator || it.picFacilitator || getFacilitatorForRequestor(rec.requestor),
            statusNorm: sm.key,
            actionText: 'Detail Isu',
            actionClass: sm.key === 'closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (sm.key === 'inprogress' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-rose-50 text-rose-700 border-rose-200'),
            ticketId: it.ticketId || '1',
            serviceType: it.serviceType || uMeta.key
          });
        }
      });
    } else if (calData.details && calData.details[day]) {
      const d = calData.details[day];
      agendas = d.agendas ? [...d.agendas] : [];
      issues = d.issues ? [...d.issues] : [];
      quickwins = d.quickwins ? [...d.quickwins] : [];
    }

    const titleEl = document.getElementById('panel-selected-date');
    const badgeEl = document.getElementById('panel-agenda-badge');
    if (titleEl) {
      titleEl.textContent = fullDateStr;
      titleEl.title = fullDateStr;
    }
    if (badgeEl) {
      badgeEl.textContent = '';
      badgeEl.style.display = 'none';
      badgeEl.hidden = true;
    }

    const cardAgenda = document.getElementById('card-agenda-pertemuan');
    const cardIssue = document.getElementById('card-isu-kendala');
    const cardQuickwin = document.getElementById('card-quickwins');
    const cardPresentasi = document.getElementById('card-dokumen-presentasi');

    const hasAgendas = agendas.length > 0;
    const hasIssues = issues.length > 0;
    const hasQuickwins = quickwins.length > 0;
    const hasAnyContent = hasAgendas || hasIssues || hasQuickwins;

    if (cardAgenda) cardAgenda.classList.toggle('hidden', !hasAgendas);
    if (cardIssue) cardIssue.classList.toggle('hidden', !hasIssues);
    if (cardQuickwin) cardQuickwin.classList.toggle('hidden', !hasQuickwins);
    if (cardPresentasi) cardPresentasi.classList.toggle('hidden', !hasAnyContent);

    const agendaContainer = document.getElementById('agenda-cards-container');
    if (agendaContainer) {
      if (hasAgendas) {
        agendaContainer.innerHTML = agendas.map(ag =>
          '<div class="p-2.5 sm:p-3 card-meeting-gradient border border-slate-200 rounded-xl flex flex-col gap-1.5 hover:border-blue-300 shadow-xs transition-all">' +
          '  <div class="flex items-center justify-between">' +
          '    <span class="text-[11px] font-bold text-slate-500">' + ag.time + '</span>' +
          '    <span class="px-2 py-0.5 rounded text-[10px] font-bold ' + ag.unitClass + '">' + ag.unit + '</span>' +
          '  </div>' +
          '  <h4 class="text-xs font-bold text-slate-900 leading-snug">' + escapeHtml(ag.title) + '</h4>' +
          '  <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">' +
          '    <span class="text-slate-500 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">person</span><span>' + escapeHtml(ag.host) + '</span></span>' +
          '    <span class="font-semibold text-blue-600 flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">' + (ag.isWarRoom ? 'campaign' : 'video_camera_front') + '</span><span>' + ag.roomText + '</span></span>' +
          '  </div>' +
          '</div>'
        ).join('');
      } else {
        agendaContainer.innerHTML = '';
      }
    }

    const currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    const canPickup = currentRole !== 'Inputer' && currentRole !== 'Viewer';
    const canUploadRole = currentRole === 'Administrator' || currentRole === 'Inputer';
    const isAdminRole = currentRole === 'Administrator';

    const issueContainer = document.getElementById('issue-cards-container');
    if (issueContainer) {
      if (hasIssues) {
        issueContainer.innerHTML = issues.map(iss => {
          const sType = iss.serviceType || normalizeUnitKey(iss.unit) || 'MOBILE';
          const uMeta = getUnitMeta(sType);
          const liveRec = (state.records || []).find(r => String(r.id) === String(iss.ticketId) && r.serviceType === sType);
          const stNorm = ((liveRec && liveRec.status) || iss.statusNorm || (iss.badge.includes('INVESTIGASI') ? 'inprogress' : 'open')).toLowerCase().replace(/\s+/g, '');

          let pickupBtnHtml = '';
          let rescheduleBtnHtml = '';
          if (canPickup && iss.ticketId) {
            rescheduleBtnHtml = '<button type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50/90 hover:bg-blue-100 text-blue-700 shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer" onclick="openRescheduleModal(\'' + iss.ticketId + '\', \'' + sType + '\')" title="Ubah tanggal agenda kasus ini"><span>📅</span><span>Ubah Tanggal</span></button>';
            if (stNorm === 'inprogress') {
              pickupBtnHtml = '<button type="button" class="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-[13px] font-extrabold tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer" onclick="openClosedModal(\'' + iss.ticketId + '\', \'' + sType + '\')"><span>✅</span><span>Selesaikan (Closed)</span></button>';
            } else if (stNorm !== 'closed') {
              pickupBtnHtml = '<button type="button" class="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-[13px] font-extrabold tracking-wide bg-[#061345] hover:bg-[#1e295a] text-white shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer" onclick="openInProgressModal(\'' + iss.ticketId + '\', false, \'' + sType + '\')"><span>🚀</span><span>Pickup Case</span></button>';
            }
          }

          const liveSm = getCalendarStatusMeta(stNorm);
          const liveBadgeText = stNorm === 'closed' ? 'CLOSED' : (stNorm === 'inprogress' ? 'IN PROGRESS' : 'OPEN');
          const cardToneClass = stNorm === 'closed'
            ? 'bg-gradient-to-br from-emerald-50/90 to-white border-emerald-200'
            : (stNorm === 'inprogress' ? 'bg-gradient-to-br from-orange-50/90 to-white border-orange-200' : 'bg-gradient-to-br from-rose-50/90 to-white border-rose-200');

          const urg = (liveRec && liveRec.urgency) || iss.urgency || 'Middle';
          const urgBadge = getUrgencyBadgeHtml(urg);
          const facName = (liveRec && liveRec.picFacilitator) || iss.picFacilitator || getFacilitatorForRequestor((liveRec && (liveRec.requestor || liveRec.pic)) || iss.requestor || iss.pic);

          // PDF attachment section spesifik per masing-masing inputan case
          const casePdf = getCasePptAttachment(sType, iss.ticketId);
          const hasCasePdf = !!(casePdf && (casePdf.fileUrl || casePdf.url));
          let pdfSectionHtml = '';
          if (hasCasePdf) {
            const pName = casePdf.fileName || casePdf.name || 'Lampiran_Sample_Case.pdf';
            const pUrl = casePdf.fileUrl || casePdf.url;
            pdfSectionHtml = '<div class="p-2 bg-white/95 border border-slate-200/90 rounded-xl flex items-center justify-between gap-2 shadow-2xs">' +
              '  <div class="flex items-center gap-2 min-w-0">' +
              '    <div class="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600">' +
              '      <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>' +
              '    </div>' +
              '    <div class="truncate">' +
              '      <div class="text-xs font-bold text-slate-800 truncate" title="' + escapeHtml(pName) + '">' + escapeHtml(pName) + '</div>' +
              '      <div class="text-[10px] text-slate-400">PDF Sample Case (' + (iss.ticket || ('Case #' + iss.ticketId)) + ')</div>' +
              '    </div>' +
              '  </div>' +
              '  <div class="flex items-center gap-1 shrink-0">' +
              '    <a href="' + pUrl + '" target="_blank" rel="noopener noreferrer" class="px-2 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-0.5 transition-colors" title="Buka PDF">' +
              '      <span class="material-symbols-outlined text-[13px]">visibility</span><span>Lihat</span>' +
              '    </a>' +
              (canUploadRole ? '    <button type="button" class="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-0.5 transition-colors cursor-pointer" onclick="openUploadPptModal(\'' + iss.ticketId + '\', \'' + sType + '\')" title="Ganti File PDF"><span class="material-symbols-outlined text-[13px]">edit</span><span>Ganti</span></button>' : '') +
              (isAdminRole ? '    <button type="button" class="w-6 h-6 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded flex items-center justify-center transition-colors cursor-pointer" onclick="handleDeletePpt(\'' + iss.ticketId + '\', \'' + sType + '\')" title="Hapus PDF"><span class="material-symbols-outlined text-[14px]">delete</span></button>' : '') +
              '  </div>' +
              '</div>';
          } else if (canUploadRole && iss.ticketId) {
            pdfSectionHtml = '<button type="button" class="w-full py-1.5 px-3 border border-dashed border-slate-300 hover:border-blue-400 bg-white/70 hover:bg-white rounded-xl text-slate-600 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer group" onclick="openUploadPptModal(\'' + iss.ticketId + '\', \'' + sType + '\')" title="Upload PDF khusus untuk ' + (iss.ticket || ('Case #' + iss.ticketId)) + '">' +
              '  <span class="material-symbols-outlined text-[16px] text-rose-500 group-hover:scale-110 transition-transform">upload_file</span>' +
              '  <span>Upload PDF (' + (iss.ticket || ('Case #' + iss.ticketId)) + ')</span>' +
              '</button>';
          }

          return '<div class="p-3 sm:p-3.5 ' + cardToneClass + ' border rounded-xl flex flex-col gap-2.5 hover:border-slate-300 shadow-xs transition-all">' +
          '  <div class="flex items-center justify-between flex-wrap gap-1">' +
          '    <div class="flex items-center gap-1.5 flex-wrap"><span class="px-2.5 py-0.5 rounded text-[10px] font-extrabold border ' + liveSm.cardBadgeClass + '">' + liveBadgeText + '</span>' + urgBadge + '</div>' +
          '    <div class="flex items-center gap-1.5"><span class="px-1.5 py-0.5 rounded text-[9px] font-bold border ' + uMeta.pillClass + '">' + uMeta.label + '</span><span class="text-[10px] font-mono font-bold text-slate-700">' + iss.ticket + '</span></div>' +
          '  </div>' +
          '  <p class="text-xs font-semibold text-slate-800 leading-relaxed">' + escapeHtml(iss.title) + '</p>' +
          '  <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex-wrap gap-1">' +
          '    <span class="truncate" title="Requestor">Requestor: <strong class="text-slate-700">' + escapeHtml((liveRec && (liveRec.requestor || liveRec.pic)) || iss.pic) + '</strong></span>' +
          '    <span class="text-blue-700 font-semibold flex items-center gap-0.5" title="Diteruskan ke Fasilitator: ' + escapeHtml(facName) + '"><span class="material-symbols-outlined text-[13px]">assignment_ind</span><span>' + escapeHtml(facName) + '</span></span>' +
          '  </div>' +
          pdfSectionHtml +
          '  <div class="flex flex-wrap items-center gap-2">' + pickupBtnHtml + rescheduleBtnHtml +
          '    <button type="button" class="' + (pickupBtnHtml ? 'px-3.5 py-2.5' : 'flex-1 py-2 px-3.5') + ' rounded-xl text-xs font-bold border ' + iss.actionClass + ' hover:opacity-90 transition-opacity cursor-pointer" onclick="openDrawer(\'' + (iss.ticketId || 1) + '\', \'' + sType + '\')">' + iss.actionText + '</button>' +
          '  </div>' +
          '</div>';
        }).join('');
      } else {
        issueContainer.innerHTML = '';
      }
    }

    if (cardPresentasi) {
      cardPresentasi.style.display = 'none';
      cardPresentasi.classList.add('hidden');
    }

    const quickContainer = document.getElementById('quickwins-container');
    if (quickContainer) {
      if (hasQuickwins) {
        quickContainer.innerHTML = quickwins.map(qw =>
          '<div class="p-2 sm:p-2.5 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl flex items-center justify-between gap-2">' +
          '  <div class="flex items-center gap-2 min-w-0"><input type="checkbox" ' + (qw.done ? 'checked' : '') + ' class="rounded border-slate-300 text-blue-600 focus:ring-0"><span class="text-xs text-slate-700 truncate ' + (qw.done ? 'line-through text-slate-400' : '') + '">' + escapeHtml(qw.title) + '</span></div>' +
          '  <span class="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ' + qw.statusClass + '">' + qw.status + '</span>' +
          '</div>'
        ).join('');
      } else {
        quickContainer.innerHTML = '';
      }
    }
  }

  function renderTasksTable() {
    const tbody = document.getElementById('task-table-body');
    if (!tbody) return;

    const records = state.records || [];
    let visible = [...records];

    const activeTaskUnit = normalizeUnitKey(state.tasksFilterUnit);
    if (activeTaskUnit !== 'ALL') {
      visible = visible.filter(r => normalizeUnitKey(r.serviceType) === activeTaskUnit);
    }
    if (state.tasksFilterStatus && state.tasksFilterStatus !== 'all') {
      visible = visible.filter(r => (r.status || '').toLowerCase().replace(/\s+/g, '') === state.tasksFilterStatus.toLowerCase().replace(/\s+/g, ''));
    }
    if (state.tasksFilterPeriod && state.tasksFilterPeriod !== 'all') {
      visible = visible.filter(r => (r.bulan || '').includes(state.tasksFilterPeriod));
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      visible = visible.filter(r => 
        (r.totalCaseIsu || '').toLowerCase().includes(q) ||
        (r.issueDetails || '').toLowerCase().includes(q) ||
        (r.detail || '').toLowerCase().includes(q) ||
        (r.requestor || '').toLowerCase().includes(q) ||
        (r.pic || '').toLowerCase().includes(q)
      );
    }

    const badge = document.getElementById('case-counter-badge');
    if (badge) badge.textContent = visible.length + ' Ditampilkan';
    const info = document.getElementById('pagination-info');
    if (info) info.textContent = 'Menampilkan 1 - ' + visible.length + ' dari ' + visible.length + ' Kasus';

    if (visible.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center py-8 text-slate-400">Tidak ada kasus yang sesuai dengan filter.</td></tr>';
      return;
    }

    const currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    const canPickup = currentRole !== 'Inputer' && currentRole !== 'Viewer';
    const canUploadRole = currentRole === 'Administrator' || currentRole === 'Inputer';
    const isAdminRole = currentRole === 'Administrator';

    tbody.innerHTML = visible.map((item, idx) => {
      const sType = item.serviceType || 'MOBILE';
      const uMeta = getUnitMeta(sType);
      const unitDisplay = getUnitDisplayLabel(item);
      const unitBadge = '<span class="px-2.5 py-1 rounded text-[10.5px] font-bold whitespace-nowrap inline-flex items-center justify-center ' + uMeta.badgeClass + '">' + escapeHtml(unitDisplay) + '</span>';

      const rawStatus = (item.status || 'Open').toLowerCase().replace(/\s+/g, '');
      let statusPill = '';
      if (rawStatus === 'inprogress') {
        statusPill = '<div class="flex flex-wrap items-center gap-1.5">' +
          '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200" onclick="openInProgressModal(\'' + item.id + '\', true, \'' + sType + '\')"><span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>In Progress</span>' +
          (canPickup ? '<button type="button" class="px-3.5 py-1.5 rounded-lg text-xs font-extrabold tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer" onclick="openClosedModal(\'' + item.id + '\', \'' + sType + '\')">✅ Closed</button>' : '') +
          '</div>';
      } else if (rawStatus === 'closed') {
        statusPill = '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200"><span class="w-2 h-2 rounded-full bg-emerald-600"></span>Closed</span>';
      } else {
        statusPill = '<div class="flex flex-wrap items-center gap-1.5">' +
          '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 cursor-pointer hover:bg-amber-200" onclick="openInProgressModal(\'' + item.id + '\', false, \'' + sType + '\')"><span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>Open</span>' +
          (canPickup ? '<button type="button" class="px-3.5 py-1.5 rounded-lg text-xs font-extrabold tracking-wide bg-[#061345] hover:bg-[#1e295a] text-white shadow-xs transition-colors cursor-pointer" onclick="openInProgressModal(\'' + item.id + '\', false, \'' + sType + '\')">🚀 Pickup</button>' : '') +
          '</div>';
      }

      const ppt = getCasePptAttachment(sType, item.id);
      const pptHref = ppt ? (ppt.fileUrl || ppt.url || '') : '';
      const pptLabel = ppt ? (ppt.fileName || ppt.name || 'Lihat PDF') : 'Lihat PDF';
      let pptCell = '';
      if (pptHref) {
        pptCell = '<div class="flex flex-col gap-1">' +
          '<a href="' + pptHref + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-semibold truncate max-w-[130px]" title="' + escapeHtml(pptLabel) + '">' +
          '  <span class="material-symbols-outlined text-[14px]">picture_as_pdf</span><span class="truncate">' + escapeHtml(pptLabel) + '</span>' +
          '</a>' +
          (currentRole === 'Administrator' ? '<button type="button" class="text-[10px] text-rose-600 hover:underline text-left" onclick="handleDeletePpt(\'' + item.id + '\', \'' + sType + '\')">Hapus PDF</button>' : '') +
          '</div>';
      } else {
        if (currentRole === 'Administrator' || currentRole === 'Inputer') {
          pptCell = '<button type="button" class="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-semibold text-[11px] flex items-center gap-1" onclick="openUploadPptModal(\'' + item.id + '\', \'' + sType + '\')"><span class="material-symbols-outlined text-[13px]">upload</span><span>+ Upload PDF</span></button>';
        } else {
          pptCell = '<span class="text-slate-400 text-[11px]">Tersedia di Calendar</span>';
        }
      }

      const mainIssueText = item.totalCaseIsu || item.caseTitle || '-';
      const detailText = item.issueDetails || item.detail || '-';
      const noteText = item.progress || item.keterangan || 'Belum Ada Update';

      // 1. Tanggal Input (oleh Inputer)
      const rawInputDate = item.tanggalInput || item.tanggal || item.terakhirUpdate || '';
      const inputDateDisplay = formatShortIndoDate(rawInputDate);
      const inputerName = item.inputBy || item.requestor || 'Inputer';

      // 2. Tanggal Agenda Saat Ini (Kolom K)
      const rawAgendaDate = item.tanggalAgenda || item.tanggal || item.terakhirUpdate || '';
      const agendaDateDisplay = formatShortIndoDate(rawAgendaDate);
      const hasRescheduled = !!(item.historyReschedule || (item.tanggalInput && item.tanggalAgenda && item.tanggalInput !== item.tanggalAgenda));

      let rescheduleBadge = '';
      if (hasRescheduled) {
        rescheduleBadge = '<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mt-1 cursor-pointer" title="' + escapeHtml(item.historyReschedule || 'Pernah diubah oleh Facilitator') + '">' +
          '<span class="material-symbols-outlined text-[11px] text-amber-600">sync_alt</span>' +
          '<span>Rescheduled</span>' +
        '</span>';
      }

      const ubahTanggalBtn = canPickup ? (
        '<button type="button" class="mt-1 text-[10.5px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 cursor-pointer" onclick="openRescheduleModal(\'' + item.id + '\', \'' + sType + '\')" title="Ubah tanggal agenda kasus ini">' +
        '  <span class="material-symbols-outlined text-[12px]">edit_calendar</span>' +
        '  <span>Ubah Tanggal</span>' +
        '</button>'
      ) : '';

      const taskUrgency = item.urgency || 'Middle';
      const taskUrgencyBadge = getUrgencyBadgeHtml(taskUrgency);
      const taskFacilitator = item.picFacilitator || getFacilitatorForRequestor(item.requestor);
      const isMyTask = currentRole === 'Facilitator' && state.authUser && (
        (taskFacilitator && taskFacilitator.toLowerCase().includes((state.authUser.name || '').toLowerCase())) ||
        ((state.authUser.name || '').toLowerCase().includes((taskFacilitator || '').toLowerCase())) ||
        (state.authUser.site && state.authUser.site !== 'Semua Unit' && item.requestor && item.requestor.toLowerCase().includes(state.authUser.site.toLowerCase()))
      );

      return '<tr class="hover:bg-slate-50/80 transition-colors' + (isMyTask ? ' bg-blue-50/30' : '') + '">' +
        '<td class="py-3 px-4 text-center font-bold text-slate-500">' + (idx + 1) + '</td>' +
        '<td class="py-3 px-4 font-semibold text-slate-700">' + escapeHtml(item.bulan || 'Oktober 2026') + '</td>' +
        '<td class="py-3 px-4 whitespace-nowrap">' +
        '  <div class="flex flex-col gap-0.5">' +
        '    <span class="text-xs font-semibold text-slate-800 flex items-center gap-1">' +
        '      <span class="material-symbols-outlined text-[13px] text-slate-400">event</span>' +
        '      <span>' + escapeHtml(inputDateDisplay) + '</span>' +
        '    </span>' +
        '    <span class="text-[10px] text-slate-500 font-medium truncate max-w-[130px]" title="Inputer: ' + escapeHtml(inputerName) + '">Oleh: ' + escapeHtml(inputerName) + '</span>' +
        '  </div>' +
        '</td>' +
        '<td class="py-3 px-4 whitespace-nowrap">' +
        '  <div class="flex flex-col items-start gap-0.5">' +
        '    <button type="button" class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer" title="Klik untuk buka tanggal ini di Calendar" onclick="jumpToCalendarDate(\'' + escapeHtml(rawAgendaDate) + '\', \'' + item.id + '\')">' +
        '      <span class="material-symbols-outlined text-[13px] text-blue-600">calendar_today</span>' +
        '      <span>' + escapeHtml(agendaDateDisplay) + '</span>' +
        '    </button>' +
        rescheduleBadge +
        ubahTanggalBtn +
        '  </div>' +
        '</td>' +
        '<td class="py-3 px-4 text-center whitespace-nowrap">' + unitBadge + '</td>' +
        '<td class="py-3 px-4">' +
        '  <div class="flex flex-col gap-1">' +
        '    <a href="#" class="font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug" onclick="openDrawer(\'' + item.id + '\', \'' + sType + '\'); return false;">' + escapeHtml(mainIssueText) + '</a>' +
        '    <div class="flex items-center gap-2 mt-0.5 flex-wrap">' +
        '      <button type="button" class="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5" onclick="jumpToCalendarDate(\'' + escapeHtml(rawAgendaDate) + '\', \'' + item.id + '\')">' +
        '        <span>Buka Calendar</span><span class="material-symbols-outlined text-[13px]">arrow_forward</span>' +
        '      </button>' +
        '      <span class="text-slate-300">&bull;</span><span class="text-[10px] text-slate-400 font-mono">#CHO-' + item.id + '</span>' +
        '      <span class="text-slate-300">&bull;</span>' +
        '      ' + taskUrgencyBadge +
        '      <span class="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-600"><span class="material-symbols-outlined text-[12px] text-blue-600">assignment_ind</span><span>Fasilitator: <strong class="text-slate-800">' + escapeHtml(taskFacilitator) + '</strong></span></span>' +
        (isMyTask ? '<span class="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">⭐ Kasus Saya</span>' : '') +
        '    </div>' +
        '  </div>' +
        '</td>' +
        '<td class="py-3 px-4"><div class="issue-details-text text-slate-600">' + escapeHtml(detailText) + '</div></td>' +
        '<td class="py-3 px-4">' + pptCell + '</td>' +
        '<td class="py-3 px-4">' + statusPill + '</td>' +
        '<td class="py-3 px-4"><span class="text-slate-700 font-medium text-xs">' + escapeHtml(item.progress || item.quickWin || item.statusUpdate || '-') + '</span></td>' +
        '<td class="py-3 px-4"><span class="text-slate-600 text-xs">' + escapeHtml(item.catatanFasilitator || item.keteranganProgress || item.followUpTo || '-') + '</span></td>' +
        '<td class="py-3 px-4 text-center">' +
        '  <button type="button" class="btn-history-case inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#061345] text-xs font-bold rounded-lg border border-blue-200 shadow-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap" title="Cek Riwayat History Case Lengkap" data-id="' + escapeHtml(item.id) + '" data-service="' + escapeHtml(sType) + '" onclick="window.openHistoryCaseModal(\'' + escapeHtml(item.id) + '\', \'' + escapeHtml(sType) + '\')">' +
        '    <span class="material-symbols-outlined text-[15px] text-blue-600">history</span>' +
        '    <span>History Case</span>' +
        '  </button>' +
        '</td>' +
        '</tr>';
    }).join('');

    tbody.querySelectorAll('.btn-history-case').forEach(function(btn) {
      btn.onclick = function(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        var tid = btn.getAttribute('data-id');
        var srv = btn.getAttribute('data-service');
        window.openHistoryCaseModal(tid, srv);
      };
    });
  }

  function setTasksUnitFilter(unitKey) {
    var raw = String(unitKey || '').trim().toUpperCase();
    var target = 'all';
    if (raw.includes('MOBILE')) target = 'CHO Mobile';
    else if (raw.includes('FIXED')) target = 'CHO Fixed';
    else if (raw.includes('ECARE')) target = 'CHO eCare';
    else if (raw.includes('PRIOR')) target = 'CHO Priority';

    state.tasksFilterUnit = target;

    // Update filter pills styling
    document.querySelectorAll('[data-filter-unit]').forEach(function(pill) {
      var pUnit = pill.getAttribute('data-filter-unit') || '';
      var pNorm = normalizeUnitKey(pUnit);
      var tNorm = normalizeUnitKey(target);
      var isActive = (pNorm === tNorm);
      pill.classList.toggle('bg-[#061345]', isActive);
      pill.classList.toggle('text-white', isActive);
      pill.classList.toggle('font-bold', isActive);
      pill.classList.toggle('bg-slate-100', !isActive);
      pill.classList.toggle('text-slate-600', !isActive);
    });

    renderTasksTable();
  }

  function updateTasksKpis() {
    const records = state.records || [];
    const total = records.length;
    let open = 0, openMob = 0, openFix = 0, openEc = 0, openPrio = 0;
    let inprog = 0, inprogMob = 0, inprogFix = 0, inprogEc = 0, inprogPrio = 0;
    let closed = 0, closedMob = 0, closedFix = 0, closedEc = 0, closedPrio = 0;

    records.forEach(r => {
      const st = (r.status || 'Open').toLowerCase().replace(/\s+/g, '');
      const uKey = normalizeUnitKey(r.serviceType);
      if (st === 'inprogress') {
        inprog++;
        if (uKey === 'MOBILE') inprogMob++;
        else if (uKey === 'ECARE') inprogEc++;
        else if (uKey === 'PRIORITY') inprogPrio++;
        else inprogFix++;
      } else if (st === 'closed') {
        closed++;
        if (uKey === 'MOBILE') closedMob++;
        else if (uKey === 'ECARE') closedEc++;
        else if (uKey === 'PRIORITY') closedPrio++;
        else closedFix++;
      } else {
        open++;
        if (uKey === 'MOBILE') openMob++;
        else if (uKey === 'ECARE') openEc++;
        else if (uKey === 'PRIORITY') openPrio++;
        else openFix++;
      }
    });

    const setTxt = function(id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // 1. TOTAL Case Card
    setTxt('kpi-total-val', total);
    setTxt('kpi-total-summary', total > 0 ? (open + ' Open • ' + inprog + ' InProg • ' + closed + ' Closed') : '0 Open • 0 InProgress • 0 Closed');

    // 2. CHO Mobile Card
    const mobTotal = openMob + inprogMob + closedMob;
    setTxt('kpi-mob-total', mobTotal);
    setTxt('kpi-mob-open', openMob + ' Open');
    setTxt('kpi-mob-inprog', inprogMob + ' InProg');
    setTxt('kpi-mob-closed', closedMob + ' Closed');

    // 3. CHO Fixed Card
    const fixTotal = openFix + inprogFix + closedFix;
    setTxt('kpi-fix-total', fixTotal);
    setTxt('kpi-fix-open', openFix + ' Open');
    setTxt('kpi-fix-inprog', inprogFix + ' InProg');
    setTxt('kpi-fix-closed', closedFix + ' Closed');

    // 4. CHO eCare Card
    const ecTotal = openEc + inprogEc + closedEc;
    setTxt('kpi-ecare-total', ecTotal);
    setTxt('kpi-ecare-open', openEc + ' Open');
    setTxt('kpi-ecare-inprog', inprogEc + ' InProg');
    setTxt('kpi-ecare-closed', closedEc + ' Closed');

    // 5. Priority Card
    const prioTotal = openPrio + inprogPrio + closedPrio;
    setTxt('kpi-prio-total', prioTotal);
    setTxt('kpi-prio-open', openPrio + ' Open');
    setTxt('kpi-prio-inprog', inprogPrio + ' InProg');
    setTxt('kpi-prio-closed', closedPrio + ' Closed');

    // Compatibility hooks for legacy test assertions
    setTxt('kpi-open-val', open);
    setTxt('kpi-inprogress-val', inprog);
    setTxt('kpi-closed-val', closed);

    const subOpen = document.getElementById('kpi-open-sub');
    const pctOpen = document.getElementById('kpi-open-pct');
    if (subOpen) subOpen.textContent = openMob + ' Mob • ' + openFix + ' Fix • ' + openEc + ' eCare • ' + openPrio + ' Priority';
    if (pctOpen && total > 0) pctOpen.textContent = ((open / total) * 100).toFixed(1) + '% Total';

    const subInprog = document.getElementById('kpi-inprogress-sub');
    const pctInprog = document.getElementById('kpi-inprogress-pct');
    if (subInprog) subInprog.textContent = inprogMob + ' Mob • ' + inprogFix + ' Fix • ' + inprogEc + ' eCare • ' + openPrio + ' Priority';
    if (pctInprog && total > 0) pctInprog.textContent = ((inprog / total) * 100).toFixed(1) + '% Total';

    const subClosed = document.getElementById('kpi-closed-sub');
    const pctClosed = document.getElementById('kpi-closed-pct');
    if (subClosed) subClosed.textContent = closedMob + ' Mob • ' + closedFix + ' Fix • ' + closedEc + ' eCare • ' + closedPrio + ' Priority';
    if (pctClosed && total > 0) pctClosed.textContent = ((closed / total) * 100).toFixed(1) + '% Target';
  }

  function renderActivityFeed() {
    const container = document.getElementById('activity-timeline-feed');
    if (!container) return;

    const unitSel = document.getElementById('activity-unit-filter');
    const searchIn = document.getElementById('activity-search-input');
    const filterUnit = unitSel ? normalizeUnitKey(unitSel.value) : 'ALL';
    const filterQuery = searchIn ? searchIn.value.trim().toLowerCase() : '';

    let logs = state.logs || [];
    if (filterUnit !== 'ALL') {
      logs = logs.filter(l => normalizeUnitKey(l.serviceType) === filterUnit);
    }
    if (filterQuery) {
      logs = logs.filter(l =>
        (l.author || l.pic || '').toLowerCase().includes(filterQuery) ||
        (l.message || l.keterangan || l.catatan || '').toLowerCase().includes(filterQuery) ||
        (l.action || '').toLowerCase().includes(filterQuery) ||
        (l.followUp || '').toLowerCase().includes(filterQuery)
      );
    }

    if (logs.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 py-6 text-center">Belum ada riwayat aktivitas yang tercatat di sheet Log_Komunikasi.</p>';
      return;
    }

    container.innerHTML = logs.map(l => {
      const author = l.author || l.pic || 'Pengguna konCHO';
      const time = l.timestamp || l.tanggal || 'Baru Saja';
      const action = l.action || 'Catatan Koordinasi';
      const message = l.message || l.keterangan || l.catatan || '-';
      const uMeta = getUnitMeta(l.serviceType || 'MOBILE');

      return '<div class="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl flex items-start gap-3 hover:border-slate-300 transition-colors">' +
        '<div class="w-8 h-8 rounded-full bg-[#061345] text-white flex items-center justify-center font-bold text-xs shrink-0">' + (author[0] ? author[0].toUpperCase() : 'A') + '</div>' +
        '<div class="flex-1 flex flex-col gap-1 min-w-0">' +
        '  <div class="flex items-center justify-between flex-wrap gap-1">' +
        '    <div class="flex items-center gap-2">' +
        '      <span class="font-bold text-slate-800 text-xs">' + escapeHtml(author) + '</span>' +
        '      <span class="px-2 py-0.2 rounded text-[10px] font-bold ' + uMeta.badgeClass + '">' + uMeta.label + '</span>' +
        '      <span class="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">' + escapeHtml(action) + '</span>' +
        '    </div>' +
        '    <span class="text-[11px] text-slate-400 font-mono">' + escapeHtml(time) + '</span>' +
        '  </div>' +
        '  <p class="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line">' + escapeHtml(message) + '</p>' +
        '  <div class="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-500">' +
        '    <span>Follow Up: <strong>' + escapeHtml(l.followUp || '-') + '</strong></span>' +
        '    <span>&bull;</span>' +
        '    <button type="button" class="text-blue-600 font-semibold hover:underline" onclick="activateView(\'tasks\')">Lihat di Tasks &rarr;</button>' +
        '  </div>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function jumpToCalendarDate(dateStr, ticketId) {
    const dp = parseDateParts(dateStr);
    if (dp) {
      setCalendarMonthYear(dp.year, dp.monthIndex, dp.day);
      activateView('calendar', ticketId || '', dp.day);
    } else {
      activateView('calendar', ticketId || '', state.selectedDate || 24);
    }
  }

  function openDrawer(ticketId, serviceType) {
    const drawer = document.getElementById('issue-drawer');
    if (!drawer) return;

    const records = state.records || [];
    const ticket = records.find(r => String(r.id) === String(ticketId) && (!serviceType || r.serviceType === serviceType)) || records[0];
    if (!ticket) return;

    state.activeDrawerTicket = ticket;

    const titleEl = document.getElementById('drawer-issue-title');
    const unitBadge = document.getElementById('drawer-unit-badge');
    const periodBadge = document.getElementById('drawer-period-badge');
    const dateBadge = document.getElementById('drawer-date-badge');
    const statusBadge = document.getElementById('drawer-status');
    const detailEl = document.getElementById('drawer-issue-detail');
    const picEl = document.getElementById('drawer-pic');
    const fuEl = document.getElementById('drawer-follow-up');
    const noteInput = document.getElementById('drawer-note-input');
    const pptName = document.getElementById('drawer-ppt-name');

    const uMeta = getUnitMeta(ticket.serviceType);
    if (titleEl) titleEl.textContent = ticket.totalCaseIsu || ticket.caseTitle || 'Isu CHO';
    if (unitBadge) {
      unitBadge.textContent = getUnitDisplayLabel(ticket);
      unitBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold ' + uMeta.badgeClass;
    }
    if (periodBadge) periodBadge.textContent = ticket.bulan || 'Oktober 2026';
    if (dateBadge) dateBadge.textContent = '📅 ' + formatShortIndoDate(ticket.tanggalAgenda || ticket.tanggal || ticket.terakhirUpdate);

    // Tanggal Input (Inputer) & Tanggal Agenda (Kolom K)
    const elTglInput = document.getElementById('drawer-tgl-input');
    const elInputer = document.getElementById('drawer-inputer-name');
    const elTglAgenda = document.getElementById('drawer-tgl-agenda');
    const elReschedBadge = document.getElementById('drawer-reschedule-badge');
    const elReschedCont = document.getElementById('drawer-reschedule-history-container');
    const elReschedHist = document.getElementById('drawer-reschedule-history-text');

    const tglInputStr = formatShortIndoDate(ticket.tanggalInput || ticket.tanggal);
    const tglAgendaStr = formatShortIndoDate(ticket.tanggalAgenda || ticket.tanggal);
    if (elTglInput) elTglInput.textContent = tglInputStr;
    if (elInputer) elInputer.textContent = 'Oleh: ' + (ticket.inputBy || ticket.requestor || 'Inputer');
    if (elTglAgenda) elTglAgenda.textContent = tglAgendaStr;

    const hasResched = !!(ticket.historyReschedule || (ticket.tanggalInput && ticket.tanggalAgenda && ticket.tanggalInput !== ticket.tanggalAgenda));
    if (elReschedBadge) {
      if (hasResched) {
        elReschedBadge.className = 'px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200';
        elReschedBadge.textContent = '🔄 Rescheduled';
      } else {
        elReschedBadge.className = '';
        elReschedBadge.textContent = '';
      }
    }
    if (elReschedCont && elReschedHist) {
      if (ticket.historyReschedule) {
        elReschedCont.classList.remove('hidden');
        elReschedHist.textContent = ticket.historyReschedule;
      } else {
        elReschedCont.classList.add('hidden');
        elReschedHist.textContent = '';
      }
    }
    if (statusBadge) statusBadge.textContent = ticket.status || 'Open';
    if (detailEl) detailEl.textContent = ticket.issueDetails || ticket.detail || 'Tidak ada keterangan kendala.';
    if (picEl) picEl.textContent = ticket.pic || '-';
    if (fuEl) fuEl.textContent = ticket.followUpTo || '-';
    if (noteInput) noteInput.value = ticket.progress && ticket.progress !== 'Belum Ada Update' ? ticket.progress : '';

    const currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
    const isInputerOrViewer = (currentRole.toLowerCase() === 'inputer' || currentRole.toLowerCase() === 'viewer');
    const btnDrawerSave = document.getElementById('btn-drawer-save');
    if (btnDrawerSave) {
      if (isInputerOrViewer) {
        btnDrawerSave.style.setProperty('display', 'none', 'important');
        btnDrawerSave.classList.add('hidden');
        btnDrawerSave.hidden = true;
        if (btnDrawerSave.parentElement) {
          btnDrawerSave.parentElement.style.setProperty('display', 'none', 'important');
        }
      } else {
        btnDrawerSave.style.removeProperty('display');
        btnDrawerSave.classList.remove('hidden');
        btnDrawerSave.hidden = false;
        if (btnDrawerSave.parentElement) {
          btnDrawerSave.parentElement.style.removeProperty('display');
        }
      }
    }
    if (noteInput) {
      noteInput.readOnly = isInputerOrViewer;
      if (isInputerOrViewer) {
        noteInput.classList.add('bg-slate-100', 'cursor-not-allowed');
        noteInput.title = 'Quick Win hanya dapat diperbarui oleh Fasilitator & Administrator';
      } else {
        noteInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
        noteInput.title = '';
      }
    }

    const pickupActionsEl = document.getElementById('drawer-pickup-actions');
    if (pickupActionsEl) {
      const currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
      const canPickup = currentRole !== 'Inputer' && currentRole !== 'Viewer';
      const stNorm = (ticket.status || 'Open').toLowerCase().replace(/\s+/g, '');

      if (canPickup) {
        pickupActionsEl.className = 'mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2';
        const reschedBtn = '<button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer" onclick="openRescheduleModal(\'' + ticket.id + '\', \'' + ticket.serviceType + '\')" title="Ubah tanggal agenda kasus ini"><span>📅</span><span>Ubah Tanggal</span></button>';
        if (stNorm === 'inprogress') {
          pickupActionsEl.innerHTML =
            '<button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer" onclick="openInProgressModal(\'' + ticket.id + '\', true, \'' + ticket.serviceType + '\')">📝 Update Progress</button>' +
            '<button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer" onclick="openClosedModal(\'' + ticket.id + '\', \'' + ticket.serviceType + '\')">✅ Selesaikan (Closed)</button>' +
            reschedBtn;
        } else if (stNorm === 'closed') {
          pickupActionsEl.innerHTML =
            '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✅ Case Selesai (Ditutup oleh ' + escapeHtml(ticket.closedBy || ticket.pic || 'Tim CHO') + ')</span>' +
            reschedBtn;
        } else {
          pickupActionsEl.innerHTML =
            '<button type="button" class="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-bold bg-[#061345] hover:bg-[#1e295a] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer" onclick="openInProgressModal(\'' + ticket.id + '\', false, \'' + ticket.serviceType + '\')">🚀 Pickup Case (Ubah ke In Progress)</button>' +
            reschedBtn;
        }
      } else {
        pickupActionsEl.className = 'hidden';
        pickupActionsEl.innerHTML = '';
      }
    }

    const ppt = getCasePptAttachment(ticket.serviceType, ticket.id);
    if (pptName) pptName.textContent = ppt && (ppt.fileName || ppt.name) ? (ppt.fileName || ppt.name) : 'Belum ada file PDF';

    const timelineEl = document.getElementById('drawer-timeline-container');
    if (timelineEl) {
      const ticketLogs = (state.logs || []).filter(l => String(l.ticketId) === String(ticket.id));
      if (ticketLogs.length > 0) {
        timelineEl.innerHTML = ticketLogs.map(tl => {
          let msg = tl.message || tl.keterangan || '-';
          msg = msg.replace(/ditugaskan ke Fasilitator/gi, 'diteruskan ke Fasilitator')
                   .replace(/ditugaskan kepada Fasilitator/gi, 'diteruskan kepada Fasilitator')
                   .replace(/ditugaskan/gi, 'diteruskan');
          const author = tl.author || tl.user || 'PIC';
          const timeStr = typeof formatLogTimestamp === 'function' ? formatLogTimestamp(tl.timestamp || tl.tanggal) : (tl.timestamp || tl.tanggal || '');
          return '<div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">' +
            '  <div class="flex items-center justify-between text-slate-500 font-semibold mb-0.5"><span>' + escapeHtml(author) + '</span><span>' + escapeHtml(timeStr) + '</span></div>' +
            '  <p class="text-slate-800 leading-relaxed">' + escapeHtml(msg) + '</p>' +
            '</div>';
        }).join('');
      } else {
        timelineEl.innerHTML = '<p class="text-slate-400 py-1 text-center">Belum ada riwayat koordinasi untuk tiket ini.</p>';
      }
    }

    drawer.classList.remove('drawer-closed');
    drawer.classList.add('drawer-open');
  }

  function closeDrawer() {
    const drawer = document.getElementById('issue-drawer');
    if (drawer) {
      drawer.classList.remove('drawer-open');
      drawer.classList.add('drawer-closed');
    }
  }

  // Hook into processLoadedData to update new Google Stitch views
  const oldProcessLoadedData = processLoadedData;
  processLoadedData = function(data, isSimulation) {
    oldProcessLoadedData(data, isSimulation);
    renderCalendarGrid();
    renderCalendarRightPanel(state.selectedDate || 24);
    if (!state.records || state.records.length === 0) {
      closeCalendarDayDrawer();
    }
    renderTasksTable();
    updateTasksKpis();
    renderActivityFeed();
  };

  // Bind Google Stitch UI listeners
  function bindStitchEvents() {
    const inputTglEl = document.getElementById('inputTanggalAgenda');
    if (inputTglEl) {
      inputTglEl.addEventListener('change', () => {
        const dp = parseDateParts(inputTglEl.value);
        if (!dp) return;
        state.pendingCalendarDate = dp;
        const targetMonthYear = CAL_MONTHS_ID[dp.monthIndex] + ' ' + dp.year;
        if (dom.inputBulanTahun) {
          const optExists = Array.from(dom.inputBulanTahun.options).some(o => o.value === targetMonthYear);
          if (!optExists) {
            const newOpt = document.createElement('option');
            newOpt.value = targetMonthYear;
            newOpt.textContent = targetMonthYear;
            dom.inputBulanTahun.appendChild(newOpt);
          }
          dom.inputBulanTahun.value = targetMonthYear;
        }
        const datePill = document.getElementById('newModalDatePill');
        if (datePill) {
          datePill.textContent = '📅 Tanggal Terpilih: ' + formatFullIndoDate(dp.year, dp.monthIndex, dp.day);
          datePill.style.display = 'inline-flex';
        }
      });
    }
    const btnNewCase = document.getElementById('btnOpenNewModal');
    if (btnNewCase) {
      btnNewCase.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof openNewModal === 'function') openNewModal();
      });
    }
    const navCal = document.getElementById('nav-link-calendar');
    const navTsk = document.getElementById('nav-link-tasks');

    if (navCal) navCal.addEventListener('click', (e) => { e.preventDefault(); activateView('calendar'); closeMobileSidebar(); });
    if (navTsk) navTsk.addEventListener('click', (e) => { e.preventDefault(); activateView('tasks'); closeMobileSidebar(); });

    const btnSideHelp = document.getElementById('btnSidebarHelp');
    if (btnSideHelp) btnSideHelp.addEventListener('click', openUserGuideModal);

    const btnSideSettings = document.getElementById('btnSidebarSettings');
    if (btnSideSettings) btnSideSettings.addEventListener('click', openManageUsersModal);

    const btnSideLogout = document.getElementById('btnSidebarLogout');
    if (btnSideLogout) btnSideLogout.addEventListener('click', handleLogout);

    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const btnCloseDrawerFoot = document.getElementById('btn-drawer-close-foot');
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
    if (btnCloseDrawerFoot) btnCloseDrawerFoot.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

    const btnCloseCalDrawer = document.getElementById('btn-close-calendar-drawer');
    const calDrawerBackdrop = document.getElementById('calendar-drawer-backdrop');
    if (btnCloseCalDrawer) btnCloseCalDrawer.addEventListener('click', closeCalendarDayDrawer);
    if (calDrawerBackdrop) calDrawerBackdrop.addEventListener('click', closeCalendarDayDrawer);

    // Tombol + Input Kasus Baru di Tanggal Ini pada Calendar Day Drawer
    var btnAddSameDay = document.getElementById('btn-drawer-add-case-same-day');
    if (btnAddSameDay) {
      btnAddSameDay.addEventListener('click', function() {
        if (state.authUser && (state.authUser.role === 'Facilitator' || state.authUser.role === 'Viewer')) {
          showToast('Akses ditolak: Peran ' + state.authUser.role + ' tidak berwenang menginput data kasus baru.', 'error');
          return;
        }
        openNewModal({ year: state.selectedYear, monthIndex: state.selectedMonthIndex, day: state.selectedDate });
      });
    }

    // Tab Switcher pada Kelola Pengguna (Akun Pengguna vs Alur Routing Fasilitator)
    var tabBtnUsers = document.getElementById('tabBtnUsers');
    var tabBtnRouting = document.getElementById('tabBtnRouting');
    if (tabBtnUsers) tabBtnUsers.addEventListener('click', function() { switchMgmtTab('users'); });
    if (tabBtnRouting) tabBtnRouting.addEventListener('click', function() { switchMgmtTab('routing'); });

    var btnSaveRouting = document.getElementById('btnSaveRouting');
    if (btnSaveRouting) btnSaveRouting.addEventListener('click', handleSaveRouting);

    var btnResetRouting = document.getElementById('btnResetRoutingDefault');
    if (btnResetRouting) btnResetRouting.addEventListener('click', handleResetRoutingDefault);

    // Modern Month & Year Popover Picker Events
    const btnMonthTrigger = document.getElementById('btn-month-year-trigger');
    const pickerWrap = document.getElementById('modern-month-picker-wrap');
    const btnPrevYear = document.getElementById('btn-picker-prev-year');
    const btnNextYear = document.getElementById('btn-picker-next-year');
    const btnCurrMonth = document.getElementById('btn-picker-current-month');

    if (btnMonthTrigger) {
      btnMonthTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMonthYearPopover();
      });
    }
    if (btnPrevYear) {
      btnPrevYear.addEventListener('click', (e) => {
        e.stopPropagation();
        state.pickerBrowseYear = (state.pickerBrowseYear || state.selectedYear) - 1;
        renderMonthYearPopover();
      });
    }
    if (btnNextYear) {
      btnNextYear.addEventListener('click', (e) => {
        e.stopPropagation();
        state.pickerBrowseYear = (state.pickerBrowseYear || state.selectedYear) + 1;
        renderMonthYearPopover();
      });
    }
    if (btnCurrMonth) {
      btnCurrMonth.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = new Date();
        setCalendarMonthYear(now.getFullYear(), now.getMonth(), now.getDate());
        closeMonthYearPopover();
      });
    }
    document.addEventListener('click', (e) => {
      if (pickerWrap && !pickerWrap.contains(e.target)) {
        closeMonthYearPopover();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMonthYearPopover();
        const issDrawer = document.getElementById('issue-drawer');
        if (issDrawer && issDrawer.classList.contains('drawer-open')) {
          closeDrawer();
        } else {
          closeCalendarDayDrawer();
        }
      }
    });

    // Prev / Next / Today Month Navigation
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    const btnToday = document.getElementById('btn-today');

    if (btnPrevMonth) {
      btnPrevMonth.addEventListener('click', () => {
        let m = state.selectedMonthIndex - 1;
        let y = state.selectedYear;
        if (m < 0) { m = 11; y -= 1; }
        setCalendarMonthYear(y, m);
      });
    }
    if (btnNextMonth) {
      btnNextMonth.addEventListener('click', () => {
        let m = state.selectedMonthIndex + 1;
        let y = state.selectedYear;
        if (m > 11) { m = 0; y += 1; }
        setCalendarMonthYear(y, m);
      });
    }
    if (btnToday) {
      btnToday.addEventListener('click', () => {
        const now = new Date();
        setCalendarMonthYear(now.getFullYear(), now.getMonth(), now.getDate());
      });
    }

    const monthSelect = document.getElementById('select-month-jump');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        const parsed = parseMonthKey(e.target.value);
        setCalendarMonthYear(parsed.year, parsed.monthIndex);
      });
    }

    const calUnitFilter = document.getElementById('filter-unit-select');
    if (calUnitFilter) {
      calUnitFilter.addEventListener('change', (e) => {
        state.tasksFilterUnit = e.target.value;
        renderCalendarGrid();
        renderCalendarRightPanel(state.selectedDate);
      });
    }

    const calStatusFilter = document.getElementById('filter-status-select');
    if (calStatusFilter) {
      calStatusFilter.addEventListener('change', (e) => {
        state.calendarStatusFilter = e.target.value;
        renderCalendarGrid();
        renderCalendarRightPanel(state.selectedDate);
      });
    }

    const taskSearch = document.getElementById('table-search-input');
    if (taskSearch) {
      taskSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderTasksTable();
      });
    }

    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (state.activeView !== 'tasks') {
          activateView('tasks');
        }
        renderTasksTable();
      });
    }

    const unitBtns = document.querySelectorAll('.unit-filter-btn');
    unitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        unitBtns.forEach(b => {
          b.classList.remove('bg-white', 'text-[#061345]', 'shadow-xs');
          b.classList.add('text-slate-600');
        });
        btn.classList.add('bg-white', 'text-[#061345]', 'shadow-xs');
        btn.classList.remove('text-slate-600');
        state.tasksFilterUnit = btn.getAttribute('data-filter-unit');
        renderTasksTable();
      });
    });

    const statusFilter = document.getElementById('select-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        state.tasksFilterStatus = e.target.value;
        renderTasksTable();
      });
    }

    const periodFilter = document.getElementById('select-period-filter');
    if (periodFilter) {
      periodFilter.addEventListener('change', (e) => {
        state.tasksFilterPeriod = e.target.value;
        renderTasksTable();
      });
    }

    const btnResetFilters = document.getElementById('btn-reset-filters');
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => {
        state.tasksFilterUnit = 'all';
        state.tasksFilterStatus = 'all';
        state.tasksFilterPeriod = 'all';
        state.searchQuery = '';
        if (taskSearch) taskSearch.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (periodFilter) periodFilter.value = 'all';
        if (calUnitFilter) calUnitFilter.value = 'all';
        unitBtns.forEach((b, i) => {
          if (i === 0) {
            b.classList.add('bg-white', 'text-[#061345]', 'shadow-xs');
            b.classList.remove('text-slate-600');
          } else {
            b.classList.remove('bg-white', 'text-[#061345]', 'shadow-xs');
            b.classList.add('text-slate-600');
          }
        });
        renderTasksTable();
        showToast('Filter telah direset ke tampilan default.', 'info');
      });
    }

    const actUnitFilter = document.getElementById('activity-unit-filter');
    if (actUnitFilter) {
      actUnitFilter.addEventListener('change', () => renderActivityFeed());
    }
    const actSearchInput = document.getElementById('activity-search-input');
    if (actSearchInput) {
      actSearchInput.addEventListener('input', () => renderActivityFeed());
    }

    document.querySelectorAll('.js-switch-calendar-btn').forEach(btn => {
      btn.addEventListener('click', () => activateView('calendar'));
    });

    document.querySelectorAll('.js-open-agenda-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = document.getElementById('modal-tambah-agenda');
        if (m) m.classList.add('active');
      });
    });

    document.querySelectorAll('.js-close-agenda-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = document.getElementById('modal-tambah-agenda');
        if (m) m.classList.remove('active');
      });
    });

    const formAgenda = document.getElementById('form-tambah-agenda');
    if (formAgenda) {
      formAgenda.addEventListener('submit', (e) => {
        e.preventDefault();
        const t = document.getElementById('modal-agenda-title-input').value.trim();
        const d = document.getElementById('modal-agenda-date-input').value;
        const w = document.getElementById('modal-agenda-time-input').value.trim();
        const u = document.getElementById('modal-agenda-unit-input').value;
        const r = document.getElementById('modal-agenda-room-input').value.trim();

        showToast('Agenda baru berhasil ditambahkan!', 'success');
        const m = document.getElementById('modal-tambah-agenda');
        if (m) m.classList.remove('active');
      });
    }

    const btnDrawerSave = document.getElementById('btn-drawer-save');
    if (btnDrawerSave) {
      btnDrawerSave.addEventListener('click', () => {
        const currentRole = (state.authUser && state.authUser.role) ? state.authUser.role : 'Administrator';
        if (currentRole.toLowerCase() === 'inputer' || currentRole.toLowerCase() === 'viewer') {
          showToast('Akun Inputer tidak memiliki akses untuk memperbarui Quick Win!', 'warning');
          return;
        }
        const note = document.getElementById('drawer-note-input').value.trim();
        if (state.activeDrawerTicket) {
          state.activeDrawerTicket.progress = note;
          showToast('Catatan berhasil diperbarui!', 'success');
          renderTasksTable();
        }
      });
    }

    const btnDrawerCopy = document.getElementById('btn-drawer-copy-text');
    if (btnDrawerCopy) {
      btnDrawerCopy.addEventListener('click', () => {
        if (!state.activeDrawerTicket) return;
        const summary = 'Tiket: ' + (state.activeDrawerTicket.totalCaseIsu || '') + '\n' +
          'Unit: ' + state.activeDrawerTicket.serviceType + '\n' +
          'Status: ' + state.activeDrawerTicket.status + '\n' +
          'Detail: ' + (state.activeDrawerTicket.issueDetails || state.activeDrawerTicket.detail || '');
        navigator.clipboard.writeText(summary).then(() => showToast('Ringkasan berhasil disalin!', 'success'));
      });
    }
  }

  // Call bindStitchEvents on init
  const oldBindEvents = bindEvents;
  bindEvents = function() {
    oldBindEvents();
    bindStitchEvents();
  };

  // Expose global helpers
  window.state = state;
  window.dom = dom;
  window.openNewModal = openNewModal;
  window.getUserRestrictedUnit = getUserRestrictedUnit;
  window.handleSubmitNewReport = handleSubmitNewReport;
  window.checkFacilitatorNotifications = checkFacilitatorNotifications;
  window.openInProgressModal = openInProgressModal;
  window.openClosedModal = openClosedModal;
  window.activateView = activateView;
  window.closeHistoryDrawer = window.closeHistoryDrawer;
  window.openHistoryDrawer = window.openHistoryCaseModal;
  window.openDrawer = openDrawer;
  window.closeDrawer = closeDrawer;
  window.openCalendarDayDrawer = openCalendarDayDrawer;
  window.closeCalendarDayDrawer = closeCalendarDayDrawer;
  window.setCalendarMonthYear = setCalendarMonthYear;
  window.handleCalendarDateClick = handleCalendarDateClick;
  window.jumpToCalendarDate = jumpToCalendarDate;
  window.openRescheduleModal = openRescheduleModal;
  window.closeRescheduleModal = closeRescheduleModal;
  window.setTasksUnitFilter = setTasksUnitFilter;

  // Bootstrap saat DOM siap
  document.addEventListener('DOMContentLoaded', init);

})();

/**
   * Export Tabel Tasks (Daftar List Isu CHO) ke file Excel (.xlsx / .csv)
   */
  function exportTasksTableToExcel() {
    const records = state.records || [];
    if (!records || records.length === 0) {
      showToast('Tidak ada data kasus untuk diexport.', 'warning');
      return;
    }

    let visible = [...records];
    const activeTaskUnit = normalizeUnitKey(state.tasksFilterUnit);
    if (activeTaskUnit !== 'ALL') {
      visible = visible.filter(r => normalizeUnitKey(r.serviceType) === activeTaskUnit);
    }
    if (state.tasksFilterStatus && state.tasksFilterStatus !== 'all') {
      visible = visible.filter(r => (r.status || '').toLowerCase().replace(/\s+/g, '') === state.tasksFilterStatus.toLowerCase().replace(/\s+/g, ''));
    }
    if (state.tasksFilterPeriod && state.tasksFilterPeriod !== 'all') {
      visible = visible.filter(r => (r.bulan || '').includes(state.tasksFilterPeriod));
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      visible = visible.filter(r => 
        (r.totalCaseIsu || '').toLowerCase().includes(q) ||
        (r.issueDetails || '').toLowerCase().includes(q) ||
        (r.detail || '').toLowerCase().includes(q) ||
        (r.requestor || '').toLowerCase().includes(q) ||
        (r.pic || '').toLowerCase().includes(q)
      );
    }

    if (visible.length === 0) {
      showToast('Tidak ada data yang sesuai filter untuk diexport.', 'warning');
      return;
    }

    const rows = visible.map((item, idx) => {
      const sType = item.serviceType || 'MOBILE';
      const uMeta = getUnitMeta(sType);
      const ppt = getCasePptAttachment(sType, item.id);
      const pptUrl = ppt ? (ppt.fileUrl || ppt.url || ppt.fileName || 'Ada PDF') : '-';
      const taskFacilitator = item.picFacilitator || getFacilitatorForRequestor(item.requestor);
      const rawInputDate = item.tanggalInput || item.tanggal || item.terakhirUpdate || '';
      const inputDateDisplay = formatShortIndoDate(rawInputDate);
      const inputerName = item.inputBy || item.requestor || '-';
      const rawAgendaDate = item.tanggalAgenda || item.tanggal || item.terakhirUpdate || '';
      const agendaDateDisplay = formatShortIndoDate(rawAgendaDate);

      return {
        'NO': idx + 1,
        'PERIODE': item.bulan || 'Oktober 2026',
        'TANGGAL INPUT': inputDateDisplay + ' (Oleh: ' + inputerName + ')',
        'TANGGAL AGENDA': agendaDateDisplay,
        'UNIT': getUnitDisplayLabel(item),
        'CASE': item.totalCaseIsu || item.caseTitle || item.mainIssue || '-',
        'DETAIL KENDALA': item.issueDetails || item.detail || '-',
        'SAMPLE CASE (PDF)': pptUrl,
        'STATUS CASE': item.status || 'Open',
        'QUICK WIN': item.progress || item.quickWin || item.statusUpdate || '-',
        'CATATAN TINDAK LANJUT FASILITATOR': (item.catatanFasilitator || item.keteranganProgress || item.followUpTo || '-') + (taskFacilitator ? ' (Fasilitator: ' + taskFacilitator + ')' : '')
      };
    });

    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const filename = 'Daftar_List_Isu_CHO_' + dateStr + '.xlsx';

    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 16 },
        { wch: 25 },
        { wch: 18 },
        { wch: 16 },
        { wch: 32 },
        { wch: 40 },
        { wch: 35 },
        { wch: 16 },
        { wch: 30 },
        { wch: 35 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "List Isu CHO");
      XLSX.writeFile(wb, filename);
      showToast('Berhasil mendownload Excel: ' + filename, 'success');
    } else {
      const headers = Object.keys(rows[0]);
      let csv = headers.map(h => '"' + h.replace(/"/g, '""') + '"').join(',') + '\r\n';
      rows.forEach(r => {
        csv += headers.map(h => '"' + String(r[h] || '').replace(/"/g, '""') + '"').join(',') + '\r\n';
      });
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename.replace('.xlsx', '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Berhasil mendownload file Excel (CSV)', 'success');
    }
  }
  window.exportTasksTableToExcel = exportTasksTableToExcel;