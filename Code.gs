/**
 * =========================================================================
 * konCHO - Konsolidasi Complaint Handling Officer (CHO)
 * Web Application Backend Script (Google Apps Script)
 * Database: Google Spreadsheet ID: 1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc
 * Sheets: Mobile, Fixed, Log_Komunikasi
 * =========================================================================
 */

var STANDARD_CASE_HEADERS = [
  'ID_Tiket',                                  // Kolom A
  'Bulan - Tahun',                             // Kolom B
  'Case Isu yang Masuk',                       // Kolom C (Main Issue)
  'Issue Details (Description)',               // Kolom D
  'Progress & Quick Win (Temporary Solution)', // Kolom E
  'Need Support',                              // Kolom F
  'Requestor',                                 // Kolom G
  'Status',                                    // Kolom H (Open, InProgress, Closed)
  'Follow up to',                              // Kolom I
  'Status Update',                             // Kolom J
  'Tanggal_Agenda',                            // Kolom K (Tanggal Kalender YYYY-MM-DD)
  'Terakhir_Update',                           // Kolom L
  'File PPT',                                  // Kolom M (Google Drive Link)
  'Input_By',                                  // Kolom N (Nama Inputer/Admin)
  'PIC_Facilitator',                           // Kolom O (Facilitator yang Pickup / Handling)
  'Keterangan_Progress',                       // Kolom P (Catatan saat Pickup / InProgress)
  'Keterangan_Closed',                         // Kolom Q (Catatan penyelesaian saat Closed)
  'Closed_By',                                 // Kolom R (Petugas penutup kasus)
  'Tanggal_Input',                             // Kolom S (Tanggal Awal Input oleh Inputer)
  'History_Reschedule'                         // Kolom T (Riwayat Perubahan Tanggal oleh Facilitator)
];

var CONFIG = {
  SPREADSHEET_ID: '1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc',
  SHEET_MOBILE: 'Mobile',
  SHEET_FIXED: 'Fixed',
  SHEET_ECARE: 'eCare',
  SHEET_PRIORITY: 'Priority',
  SHEET_LOG: 'Log_Komunikasi',
  SHEET_USERS: 'Users',
  DRIVE_FOLDER_ID: '1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV',
  DRIVE_FOLDER_URL: 'https://drive.google.com/drive/folders/1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV?hl=ID',
  DEFAULT_HEADERS_MOBILE: STANDARD_CASE_HEADERS,
  DEFAULT_HEADERS_FIXED: STANDARD_CASE_HEADERS,
  DEFAULT_HEADERS_ECARE: STANDARD_CASE_HEADERS,
  DEFAULT_HEADERS_PRIORITY: STANDARD_CASE_HEADERS,
  DEFAULT_HEADERS_LOG: [
    'Log_ID', 'ID_Tiket', 'Tipe_Layanan', 'Pengirim', 'Pesan_Update', 
    'Status_Terkait', 'Follow_Up_To', 'Waktu_Update'
  ],
  DEFAULT_HEADERS_USERS: [
    'Username', 'Nama Lengkap', 'Role', 'Password', 'Terakhir Diperbarui'
  ]
};

/**
 * Handle HTTP GET Request - Render Web App Interface or Return JSON API for Vercel/External
 */
function doGet(e) {
  // 1. Jika request memiliki parameter action (misal dari Vercel / fetch API)
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var responseData = {};
    if (action === 'getInitialData') {
      responseData = getInitialData();
    } else if (action === 'getUsers') {
      var ss = getSpreadsheet();
      responseData = { success: true, users: getUserRecords(ss) };
    } else {
      responseData = { success: false, message: 'Action tidak dikenal' };
    }
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Default: Render Web App bawaan Google Apps Script
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('konCHO - Konsolidasi Complaint Handling Officer')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle HTTP POST Request - Terima data dari Vercel / Client eksternal
 */
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    var action = body.action;
    var data = body.data || body;
    var result = {};

    if (action === 'submitNewData') {
      result = submitNewData(data);
    } else if (action === 'postCommunicationUpdate') {
      result = postCommunicationUpdate(data);
    } else if (action === 'uploadPptFile') {
      result = uploadPptFile(data);
    } else if (action === 'deletePptFile') {
      result = deletePptFile(data);
    } else if (action === 'rescheduleCaseDate') {
      result = rescheduleCaseDate(data);
    } else if (action === 'saveUserAccount') {
      result = saveUserAccount(data);
    } else if (action === 'deleteUserAccount') {
      result = deleteUserAccount(data.username || data);
    } else {
      result = { success: false, error: 'Aksi POST tidak valid' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to include HTML partials (Styles.html, Scripts.html)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper: Get or Open Spreadsheet
 */
function getSpreadsheet() {
  try {
    if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== '') {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    }
  } catch (err) {
    Logger.log('Gagal membuka spreadsheet by ID: ' + err.message);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Helper: Find sheet case-insensitively and whitespace-tolerantly
 */
function findBestSheet(ss, targetName) {
  if (!ss) return null;
  var sheets = ss.getSheets();
  var rawTarget = String(targetName || '').toLowerCase().trim();
  var cleanTarget = rawTarget.replace(/[^a-z0-9]/g, '');

  var isFixed = cleanTarget.indexOf('fix') >= 0;
  var isMobile = cleanTarget.indexOf('mob') >= 0;
  var isEcare = cleanTarget.indexOf('ecare') >= 0;
  var isPriority = cleanTarget.indexOf('prior') >= 0 || cleanTarget.indexOf('prio') >= 0;
  var isLog = cleanTarget.indexOf('log') >= 0;
  var isUsers = cleanTarget.indexOf('user') >= 0;

  var candidates = [];

  // Pass 1: Exact matches (case-insensitive & trimmed)
  for (var i = 0; i < sheets.length; i++) {
    var sName = sheets[i].getName();
    var cleanSName = sName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanSName === cleanTarget) {
      candidates.push(sheets[i]);
    }
  }

  // Pass 2: Semantic keyword matching (Fixed vs Mobile vs eCare vs Priority vs Log vs Users)
  if (candidates.length === 0) {
    for (var j = 0; j < sheets.length; j++) {
      var sName2 = sheets[j].getName();
      var cleanSName2 = sName2.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (isLog && cleanSName2.indexOf('log') >= 0) {
        candidates.push(sheets[j]);
      } else if (isUsers && cleanSName2.indexOf('user') >= 0) {
        candidates.push(sheets[j]);
      } else if (isPriority && (cleanSName2.indexOf('prior') >= 0 || cleanSName2.indexOf('prio') >= 0)) {
        candidates.push(sheets[j]);
      } else if (isEcare && cleanSName2.indexOf('ecare') >= 0) {
        candidates.push(sheets[j]);
      } else if (isFixed && cleanSName2.indexOf('fix') >= 0) {
        candidates.push(sheets[j]);
      } else if (isMobile && cleanSName2.indexOf('mob') >= 0) {
        candidates.push(sheets[j]);
      }
    }
  }

  // Pass 3: Substring / contains matching
  if (candidates.length === 0) {
    for (var k = 0; k < sheets.length; k++) {
      var sName3 = sheets[k].getName();
      var cleanSName3 = sName3.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanSName3.indexOf(cleanTarget) >= 0 || cleanTarget.indexOf(cleanSName3) >= 0) {
        candidates.push(sheets[k]);
      }
    }
  }

  // Pass 4: Fallback untuk sheet Fixed jika nama tab berbeda (hindari Mobile, eCare, Priority, Log, Users)
  if (candidates.length === 0 && isFixed) {
    for (var s = 0; s < sheets.length; s++) {
      var sClean = sheets[s].getName().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sClean.indexOf('mob') < 0 && sClean.indexOf('ecare') < 0 && sClean.indexOf('prio') < 0 && sClean.indexOf('prior') < 0 && sClean.indexOf('log') < 0 && sClean.indexOf('user') < 0) {
        candidates.push(sheets[s]);
        break;
      }
    }
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // If multiple candidate sheets exist, prioritize the one with actual data rows (lastRow > 1)
  for (var m = 0; m < candidates.length; m++) {
    if (candidates[m].getLastRow() > 1) {
      return candidates[m];
    }
  }

  return candidates[0];
}

// Backward compatibility alias
function findSheetCaseInsensitive(ss, targetName) {
  return findBestSheet(ss, targetName);
}

/**
 * Helper: Resolve target sheet metadata berdasarkan serviceType ('MOBILE' | 'FIXED' | 'ECARE' | 'PRIORITY')
 */
function resolveTargetSheetMeta(serviceType) {
  var norm = String(serviceType || 'MOBILE').toUpperCase().trim();
  if (norm === 'FIXED' || norm === 'CHO FIXED') {
    return { serviceType: 'FIXED', sheetName: CONFIG.SHEET_FIXED, prefix: 'CHO-F', defaultHeaders: CONFIG.DEFAULT_HEADERS_FIXED };
  }
  if (norm === 'ECARE' || norm === 'E-CARE' || norm === 'CHO ECARE') {
    return { serviceType: 'ECARE', sheetName: CONFIG.SHEET_ECARE, prefix: 'CHO-E', defaultHeaders: CONFIG.DEFAULT_HEADERS_ECARE };
  }
  if (norm === 'PRIORITY' || norm === 'PRIO' || norm === 'CHO PRIORITY' || norm === 'PRIOTITY' || norm === 'PRIORITAS') {
    return { serviceType: 'PRIORITY', sheetName: CONFIG.SHEET_PRIORITY, prefix: 'CHO-P', defaultHeaders: CONFIG.DEFAULT_HEADERS_PRIORITY };
  }
  return { serviceType: 'MOBILE', sheetName: CONFIG.SHEET_MOBILE, prefix: 'CHO-M', defaultHeaders: CONFIG.DEFAULT_HEADERS_MOBILE };
}

/**
 * Helper: Ensure sheet exists with proper headers
 */
function ensureSheet(ss, sheetName, defaultHeaders) {
  var sheet = findSheetCaseInsensitive(ss, sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders])
      .setFontWeight('bold').setBackground('#061345').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    return sheet;
  }
  
  // Periksa apakah baris header masih kosong (misal tab baru dibuat manual oleh user)
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var isHeaderEmpty = (lastRow === 0 || lastCol === 0);
  if (!isHeaderEmpty) {
    var firstRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    isHeaderEmpty = firstRow.every(function(cell) { return String(cell || '').trim() === ''; });
  }

  if (isHeaderEmpty) {
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders])
      .setFontWeight('bold').setBackground('#061345').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Inisialisasi seluruh sheet (Mobile, Fixed, eCare, Priority, Log_Komunikasi, Users)
 * & pastikan semua 18 kolom standar tersedia di seluruh sheet kasus.
 * Dapat dijalankan manual 1x dari editor Apps Script melalui fungsi setupAllSheets() atau setupAllThreeSheets().
 */
function setupAllSheets() {
  return initializeDatabase();
}

function setupAllThreeSheets() {
  return initializeDatabase();
}

function initializeDatabase() {
  var ss = getSpreadsheet();
  var mobileSheet = ensureSheet(ss, CONFIG.SHEET_MOBILE, CONFIG.DEFAULT_HEADERS_MOBILE);
  var fixedSheet = ensureSheet(ss, CONFIG.SHEET_FIXED, CONFIG.DEFAULT_HEADERS_FIXED);
  var ecareSheet = ensureSheet(ss, CONFIG.SHEET_ECARE, CONFIG.DEFAULT_HEADERS_ECARE);
  var prioritySheet = ensureSheet(ss, CONFIG.SHEET_PRIORITY, CONFIG.DEFAULT_HEADERS_PRIORITY);
  var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
  var usersSheet = ensureUsersSheet(ss);
  
  // Pastikan seluruh kolom kalender & workflow Inputer -> Facilitator Pickup aman di seluruh sheet kasus
  try {
    ensureTrackingColumns(mobileSheet);
    ensureTrackingColumns(fixedSheet);
    ensureTrackingColumns(ecareSheet);
    ensureTrackingColumns(prioritySheet);
  } catch (e) {
    Logger.log('ensureTrackingColumns notice: ' + e.message);
  }
  
  return {
    success: true,
    sheets: [mobileSheet.getName(), fixedSheet.getName(), ecareSheet.getName(), prioritySheet.getName()],
    message: 'Database konCHO (Mobile, Fixed, eCare, Priority) beserta seluruh kolom siap digunakan'
  };
}

/**
 * Pastikan seluruh kolom tracking kalender & workflow Pickup tersedia di baris header sheet
 */
function ensureTrackingColumns(sheet) {
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, STANDARD_CASE_HEADERS.length).setValues([STANDARD_CASE_HEADERS])
      .setFontWeight('bold').setBackground('#061345').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var requiredCols = [
    { label: 'Status Update', aliases: ['statusinformasi', 'statusupdate', 'keteranganupdate'] },
    { label: 'Tanggal_Agenda', aliases: ['tanggalagenda', 'tanggalcase', 'tanggallapor', 'tanggal', 'date'] },
    { label: 'Terakhir_Update', aliases: ['terakhirupdate', 'lastupdate', 'updateterakhir'] },
    { label: 'File PPT', aliases: ['fileppt', 'materippt', 'linkppt', 'lampiranppt'] },
    { label: 'Input_By', aliases: ['inputby', 'inputoleh', 'inputer', 'createdby'] },
    { label: 'PIC_Facilitator', aliases: ['picfacilitator', 'pickupby', 'pichandling', 'facilitator'] },
    { label: 'Keterangan_Progress', aliases: ['keteranganprogress', 'catatanprogress', 'progressnote', 'keteranganinprogress'] },
    { label: 'Keterangan_Closed', aliases: ['keteranganclosed', 'catatanclosed', 'closingnote', 'solusi'] },
    { label: 'Closed_By', aliases: ['closedby', 'diclosedoleh', 'picclosed'] },
    { label: 'Tanggal_Input', aliases: ['tanggalinput', 'tanggal_input', 'tanggalinputawal', 'tglinput', 'createdat'] },
    { label: 'History_Reschedule', aliases: ['historyreschedule', 'history_reschedule', 'riwayatreschedule', 'riwayat_reschedule'] }
  ];

  for (var r = 0; r < requiredCols.length; r++) {
    var colDef = requiredCols[r];
    var exists = headers.some(function(h) {
      var cleanH = String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return colDef.aliases.indexOf(cleanH) >= 0;
    });
    if (!exists) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue(colDef.label).setFontWeight('bold').setBackground('#E2E8F0');
      headers.push(colDef.label);
    }
  }
}

/**
 * Ambil semua data awal (Mobile, Fixed, eCare, Priority, Log_Komunikasi, Users)
 */
function getInitialData() {
  try {
    initializeDatabase();
    var ss = getSpreadsheet();
    
    var mobileData = getSheetRecords(ss, CONFIG.SHEET_MOBILE, 'MOBILE');
    var fixedData = getSheetRecords(ss, CONFIG.SHEET_FIXED, 'FIXED');
    var ecareData = getSheetRecords(ss, CONFIG.SHEET_ECARE, 'ECARE');
    var priorityData = getSheetRecords(ss, CONFIG.SHEET_PRIORITY, 'PRIORITY');
    var logData = getLogRecords(ss);
    var usersData = getUserRecords(ss);
    
    return {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      mobileHeaders: mobileData.headers,
      fixedHeaders: fixedData.headers,
      ecareHeaders: ecareData.headers,
      priorityHeaders: priorityData.headers,
      mobileRecords: mobileData.records,
      fixedRecords: fixedData.records,
      ecareRecords: ecareData.records,
      priorityRecords: priorityData.records,
      detectedSheets: {
        mobile: mobileData.sheetName,
        fixed: fixedData.sheetName,
        ecare: ecareData.sheetName,
        priority: priorityData.sheetName,
        all: ss.getSheets().map(function(s) { return s.getName(); })
      },
      logs: logData,
      users: usersData,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    Logger.log('Error in getInitialData: ' + err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}

function normalizeStatus(st) {
  if (!st) return 'Open';
  var s = String(st).toLowerCase().replace(/[^a-z]/g, '');
  if (s.indexOf('progress') >= 0) return 'InProgress';
  if (s.indexOf('close') >= 0 || s.indexOf('solve') >= 0 || s.indexOf('selesai') >= 0) return 'Closed';
  return 'Open';
}

/**
 * Helper: Parse nama bulan dari nilai sel, tanggal, atau teks deskripsi
 */
function parseMonthString(val) {
  if (!val) return '';
  var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  if (val instanceof Date) {
    return monthNames[val.getMonth()] + ' ' + val.getFullYear();
  }
  var str = String(val).toLowerCase().trim();
  if (!str) return '';

  // Cek format ISO YYYY-MM-DD (misal dari Tanggal_Agenda: 2026-11-05)
  var isoDateMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoDateMatch) {
    var mNum = parseInt(isoDateMatch[2], 10);
    if (mNum >= 1 && mNum <= 12) {
      return monthNames[mNum - 1] + ' ' + isoDateMatch[1];
    }
  }

  var monthRegexes = [
    { name: 'Januari', regex: /januari|january|\bjan\b/ },
    { name: 'Februari', regex: /februari|february|\bfeb\b/ },
    { name: 'Maret', regex: /maret|march|\bmar\b/ },
    { name: 'April', regex: /april|\bapr\b/ },
    { name: 'Mei', regex: /mei|may/ },
    { name: 'Juni', regex: /juni|june|\bjun\b/ },
    { name: 'Juli', regex: /juli|july|\bjul\b/ },
    { name: 'Agustus', regex: /agustus|august|\bagu\b|\baug\b|\bagt\b/ },
    { name: 'September', regex: /september|\bsep\b|\bsept\b/ },
    { name: 'Oktober', regex: /oktober|october|\bokt\b|\boct\b/ },
    { name: 'November', regex: /november|\bnov\b/ },
    { name: 'Desember', regex: /desember|december|\bdes\b|\bdec\b/ }
  ];

  for (var m = 0; m < monthRegexes.length; m++) {
    if (monthRegexes[m].regex.test(str)) {
      var yearMatch = str.match(/\b(202\d)\b/) || str.match(/[-/](\d{2})\b/);
      var year = '2026';
      if (yearMatch) {
        year = yearMatch[1].length === 2 ? ('20' + yearMatch[1]) : yearMatch[1];
      }
      return monthRegexes[m].name + ' ' + year;
    }
  }

  // Check numeric dates like DD/MM/YYYY or YYYY-MM-DD or DD-MM-YYYY
  var dateMatch1 = str.match(/\b\d{1,2}[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (dateMatch1) {
    var mNum = parseInt(dateMatch1[1], 10);
    var yNum = dateMatch1[2].length === 2 ? ('20' + dateMatch1[2]) : dateMatch1[2];
    if (mNum >= 1 && mNum <= 12) {
      return monthNames[mNum - 1] + ' ' + yNum;
    }
  }
  var dateMatch2 = str.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-]\d{1,2}\b/);
  if (dateMatch2) {
    var yNum2 = dateMatch2[1];
    var mNum2 = parseInt(dateMatch2[2], 10);
    if (mNum2 >= 1 && mNum2 <= 12) {
      return monthNames[mNum2 - 1] + ' ' + yNum2;
    }
  }

  return '';
}

/**
 * Helper: Ambil data record dari sheet tertentu secara dinamis
 */
function getSheetRecords(ss, sheetName, serviceType) {
  var sheet = findBestSheet(ss, sheetName);
  if (!sheet) return { headers: [], records: [] };
  
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) {
    var rawHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    return { headers: rawHeaders, records: [] };
  }
  
  var allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  
  // Deteksi Baris Header Otomatis (scan baris 1 s/d 6 untuk menangani judul/banner pada baris 1)
  var scanLimit = Math.min(lastRow, 6);
  var headerRowIdx = 0;
  var maxHeaderScore = -1;
  var keywords = [
    'main issue', 'total case', 'isu', 'kasus', 'issue', 'requestor', 'status', 'follow up', 
    'nomor', 'msisdn', 'internet', 'pelanggan', 'nama', 'kategori', 'kendala', 
    'detail', 'tiket', 'witel', 'datel', 'regional', 'cluster', 'id'
  ];

  for (var r = 0; r < scanLimit; r++) {
    var score = 0;
    for (var c = 0; c < lastCol; c++) {
      var valStr = String(allValues[r][c] || '').toLowerCase().trim();
      if (!valStr) continue;
      for (var kw = 0; kw < keywords.length; kw++) {
        if (valStr.indexOf(keywords[kw]) >= 0) {
          score++;
          break;
        }
      }
    }
    if (score > maxHeaderScore) {
      maxHeaderScore = score;
      headerRowIdx = r;
    }
  }

  // Jika tidak ditemukan header spesifik (skor < 2), fallback ke baris 0
  if (maxHeaderScore < 2) {
    headerRowIdx = 0;
  }

  var rawHeaderRow = allValues[headerRowIdx];
  var headers = rawHeaderRow.map(function(h, idx) { 
    var clean = String(h || '').trim();
    return clean !== '' ? clean : ('Kolom ' + String.fromCharCode(65 + idx));
  });

  var records = [];

  // Deteksi indeks penting berdasarkan nama kolom atau posisi fallback
  var idIdx = findHeaderIndex(headers, ['id_tiket', 'id', 'notiket', 'no_tiket', 'ticket_id', 'tiket']);
  if (idIdx < 0) idIdx = 0; // Kolom A

  // Prioritaskan 'main issue' agar tepat mendeteksi Kolom C pada sheet user
  var caseIdx = findHeaderIndex(headers, ['main issue', 'total case isu yang masuk', 'total case isu', 'total case', 'case isu', 'isu yang masuk', 'main_issue', 'isu', 'kasus', 'issue', 'gangguan', 'kendala', 'keluhan', 'problem']);
  if (caseIdx < 0 && headers.length > 2) caseIdx = 2; // Kolom C fallback
  else if (caseIdx < 0 && headers.length > 1) caseIdx = 1;

  var detailIdx = findHeaderIndex(headers, ['issue details (description)', 'issue details', 'issue detail', 'detail_kendala', 'detail kendala', 'detail', 'keterangan', 'deskripsi', 'catatan']);
  if (detailIdx < 0 && headers.length > 3) detailIdx = 3; // Kolom D fallback
  var progressIdx = findHeaderIndex(headers, ['progress & quick win', 'progress', 'quick win', 'temporary solution', 'solusi']);
  var needSupportIdx = findHeaderIndex(headers, ['need support', 'need_support', 'support', 'bantuan', 'dukungan']);

  var reqIdx = findHeaderIndex(headers, ['requestor', 'requester', 'pemohon', 'pelapor', 'pic']);
  if (reqIdx < 0 && headers.length > 6) reqIdx = 6; // Kolom G fallback

  var statusIdx = findHeaderIndex(headers, ['status', 'status_tiket', 'status_cho']);
  if (statusIdx < 0 && headers.length > 7) statusIdx = 7; // Kolom H fallback

  var followUpIdx = findHeaderIndex(headers, ['follow up to', 'follow up', 'followup', 'follow_up_to', 'tindak lanjut ke', 'tindak lanjut']);
  if (followUpIdx < 0 && headers.length > 8) followUpIdx = 8; // Kolom I fallback

  var monthColIdx = findHeaderIndex(headers, ['bulan - tahun', 'bulan-tahun', 'bulan', 'month', 'periode', 'period', 'tahun']);
  if (monthColIdx < 0 && headers.length > 1) {
    monthColIdx = 1; // Kolom B fallback
  }
  var dateIdx = findHeaderIndex(headers, ['tanggal_agenda', 'tanggal_case', 'tanggal_lapor', 'tanggal', 'tgl', 'created_at', 'date', 'timestamp', 'waktu']);
  var tglInputIdx = findHeaderIndex(headers, ['tanggal_input', 'tanggal_input_awal', 'tgl_input', 'created_at', 'input_date']);
  var historyRescheduleIdx = findHeaderIndex(headers, ['history_reschedule', 'riwayat_reschedule', 'reschedule_history', 'history_tanggal']);
  var nameIdx = findHeaderIndex(headers, ['nama_pelanggan', 'nama', 'customer_name', 'pelanggan', 'akun', 'customer']);
  var numIdx = findHeaderIndex(headers, ['nomor_msisdn', 'nomor_internet_pstn', 'msisdn', 'no_layanan', 'no_internet', 'telepon', 'nomor', 'inet']);
  var catIdx = findHeaderIndex(headers, ['kategori_keluhan', 'kategori_kendala', 'kategori']);
  var inputByIdx = findHeaderIndex(headers, ['input_by', 'input_oleh', 'inputer', 'created_by']);
  var picIdx = findHeaderIndex(headers, ['pic_facilitator', 'pickup_by', 'pic_handling', 'facilitator', 'pic', 'petugas']);
  var lastUpdateIdx = findHeaderIndex(headers, ['terakhir_update', 'last_update', 'update_terakhir']);
  var pptIdx = findHeaderIndex(headers, ['file ppt', 'file_ppt', 'link_ppt', 'materi ppt', 'materi_ppt', 'lampiran ppt', 'ppt', 'materi']);
  var statusInfoIdx = findHeaderIndex(headers, ['status update', 'status_update', 'status informasi', 'status_informasi', 'update_status', 'ada_update', 'status_info', 'update info', 'keterangan update']);
  if (statusInfoIdx < 0 && headers.length > 9) statusInfoIdx = 9; // Kolom J fallback (index 9)

  // Mulai baca data dari baris setelah headerRowIdx
  for (var i = headerRowIdx + 1; i < allValues.length; i++) {
    var row = allValues[i];

    // Cek apakah baris benar-benar kosong
    var isRowEmpty = true;
    for (var k = 0; k < row.length; k++) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        isRowEmpty = false;
        break;
      }
    }
    if (isRowEmpty) continue;

    var rawCase = caseIdx >= 0 && row[caseIdx] ? String(row[caseIdx]).trim() : '';

    // Deteksi jika Kolom C kosong tapi teks isu berada di Kolom B atau D
    if (!rawCase || rawCase === '' || rawCase === '-' || (!isNaN(rawCase) && String(rawCase).length < 5)) {
      var candidateCols = [2, 1, 3, 0];
      for (var cc = 0; cc < candidateCols.length; cc++) {
        var colNum = candidateCols[cc];
        if (colNum < row.length && row[colNum]) {
          var cand = String(row[colNum]).trim();
          if (cand && cand !== '-' && !parseMonthString(cand) && (isNaN(cand) || cand.length > 5)) {
            rawCase = cand;
            break;
          }
        }
      }
    }

    // =========================================================================
    // PENANGANAN BARIS MERGED CELL / CONTINUATION SUB-ITEM
    // Jika Main Issue kosong (karena merged cell seperti baris 'Perbaikan tools DSC...'
    // yang berada di bawah SMOOA), jangan buat tiket baru, tapi gabungkan ke Main Issue sebelumnya.
    // =========================================================================
    if (!rawCase || rawCase === '' || rawCase === '-') {
      if (records.length > 0) {
        var lastRecord = records[records.length - 1];
        
        var subNeed = needSupportIdx >= 0 && row[needSupportIdx] ? String(row[needSupportIdx]).trim() : '';
        var subDetail = detailIdx >= 0 && row[detailIdx] ? String(row[detailIdx]).trim() : '';
        var subProg = progressIdx >= 0 && row[progressIdx] ? String(row[progressIdx]).trim() : '';
        var subFollow = followUpIdx >= 0 && row[followUpIdx] ? String(row[followUpIdx]).trim() : '';

        // Jika needSupportIdx tidak spesifik, cari di kolom manapun yang terisi
        if (!subNeed && !subDetail && !subProg) {
          for (var cScan = 0; cScan < row.length; cScan++) {
            var valC = String(row[cScan] || '').trim();
            if (valC && valC !== '-' && valC.length > 3) {
              subNeed = valC;
              break;
            }
          }
        }

        // Gabungkan ke record Main Issue sebelumnya
        if (subNeed && subNeed !== '-') {
          if (!lastRecord.needSupport) {
            lastRecord.needSupport = subNeed;
          } else if (lastRecord.needSupport.indexOf(subNeed) < 0) {
            lastRecord.needSupport += '\n• ' + subNeed;
          }
          if (lastRecord.detail.indexOf(subNeed) < 0) {
            lastRecord.detail += '\n• ' + subNeed;
          }
        }

        if (subDetail && subDetail !== '-' && lastRecord.detail.indexOf(subDetail) < 0) {
          lastRecord.detail += '\n' + subDetail;
        }

        if (subProg && subProg !== '-' && (!lastRecord.progress || lastRecord.progress.indexOf(subProg) < 0)) {
          lastRecord.progress = (lastRecord.progress ? lastRecord.progress + ' | ' : '') + subProg;
        }

        if (subFollow && subFollow !== '-' && (!lastRecord.followUpTo || lastRecord.followUpTo === '-')) {
          lastRecord.followUpTo = subFollow;
        }

        // Lewati agar tidak menjadi baris kasus terpisah
        continue;
      } else {
        // Jika belum ada record sebelumnya, lewati
        continue;
      }
    }

    // Jika teks kasus adalah label header duplikat atau subtotal
    if (rawCase.toLowerCase().indexOf('kasus baris') >= 0 || rawCase.toLowerCase().indexOf('total case') >= 0 || rawCase.toLowerCase() === 'main issue') {
      continue;
    }

    var rawDetail = detailIdx >= 0 && row[detailIdx] ? String(row[detailIdx]).trim() : '';
    var rawNeed = needSupportIdx >= 0 && row[needSupportIdx] ? String(row[needSupportIdx]).trim() : '';
    var rawProgress = progressIdx >= 0 && row[progressIdx] ? String(row[progressIdx]).trim() : '';

    var fullDetail = rawDetail || rawCase;
    if (rawNeed && rawNeed !== '-') {
      fullDetail += '\n\nNeed Support:\n• ' + rawNeed;
    }
    if (rawProgress && rawProgress !== '-') {
      fullDetail += '\n\nProgress & Quick Win:\n' + rawProgress;
    }

    var rawReq = reqIdx >= 0 && row[reqIdx] ? String(row[reqIdx]).trim() : 'CHO Staff';
    var rawStatus = statusIdx >= 0 && row[statusIdx] ? String(row[statusIdx]).trim() : 'Open';
    var rawFollowUp = followUpIdx >= 0 && row[followUpIdx] ? String(row[followUpIdx]).trim() : '-';
    var rawName = nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : '-';
    var rawNum = numIdx >= 0 && row[numIdx] ? String(row[numIdx]).trim() : '-';

    var rawId = idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : '';
    if (!rawId || rawId === '-' || isNaN(rawId) && rawId.toLowerCase().indexOf('id') >= 0) {
      rawId = String(records.length + 1);
    }

    // Deteksi Bulan
    var detectedMonth = '';
    if (monthColIdx >= 0 && row[monthColIdx]) {
      detectedMonth = parseMonthString(row[monthColIdx]);
    }
    if (!detectedMonth && dateIdx >= 0 && row[dateIdx]) {
      detectedMonth = parseMonthString(row[dateIdx]);
    }
    if (!detectedMonth && rawDetail) {
      detectedMonth = parseMonthString(rawDetail);
    }
    if (!detectedMonth && rawCase) {
      detectedMonth = parseMonthString(rawCase);
    }
    if (!detectedMonth) {
      detectedMonth = 'Oktober 2026'; // Default periode aktif
    }

    var rowObj = {
      rowIndex: i + 1,
      serviceType: serviceType,
      sheetName: sheet.getName(),
      id: rawId,
      totalCaseIsu: rawCase,
      requestor: rawReq,
      status: normalizeStatus(rawStatus),
      followUpTo: rawFollowUp,
      bulan: detectedMonth,
      tanggal: dateIdx >= 0 && row[dateIdx] ? formatDate(row[dateIdx]) : '',
      tanggalAgenda: dateIdx >= 0 && row[dateIdx] ? formatDate(row[dateIdx]) : '',
      tanggalInput: tglInputIdx >= 0 && row[tglInputIdx] ? formatDate(row[tglInputIdx]) : (dateIdx >= 0 && row[dateIdx] ? formatDate(row[dateIdx]) : ''),
      historyReschedule: historyRescheduleIdx >= 0 && row[historyRescheduleIdx] ? String(row[historyRescheduleIdx]).trim() : '',
      nama: rawName,
      nomorLayanan: rawNum,
      kategori: catIdx >= 0 && row[catIdx] ? String(row[catIdx]).trim() : 'General',
      issueDetails: rawDetail || fullDetail,
      detail: fullDetail || rawDetail,
      progress: rawProgress,
      needSupport: rawNeed,
      inputBy: inputByIdx >= 0 && row[inputByIdx] ? String(row[inputByIdx]).trim() : rawReq,
      pic: picIdx >= 0 && row[picIdx] ? String(row[picIdx]).trim() : rawReq,
      terakhirUpdate: lastUpdateIdx >= 0 && row[lastUpdateIdx] ? formatDate(row[lastUpdateIdx]) : '',
      filePpt: pptIdx >= 0 && row[pptIdx] ? String(row[pptIdx]).trim() : '',
      statusInformasi: statusInfoIdx >= 0 && row[statusInfoIdx] ? String(row[statusInfoIdx]).trim() : 'Belum Ada Update',
      statusUpdate: statusInfoIdx >= 0 && row[statusInfoIdx] ? String(row[statusInfoIdx]).trim() : 'Belum Ada Update',
      rawRowData: {}
    };

    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      if (val instanceof Date) {
        val = formatDate(val);
      }
      rowObj.rawRowData[headers[c]] = val !== undefined && val !== null ? String(val) : '';
    }

    records.push(rowObj);
  }

  return {
    sheetName: sheet.getName(),
    headers: headers,
    records: records
  };
}

/**
 * Helper: Ambil seluruh log komunikasi
 */
function getLogRecords(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_LOG);
  if (!sheet) return [];
  
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var logs = [];
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1]) continue;
    logs.push({
      logId: String(row[0] || ''),
      ticketId: String(row[1] || ''),
      serviceType: String(row[2] || ''),
      author: String(row[3] || 'Anonim'),
      message: String(row[4] || ''),
      statusTerkait: String(row[5] || ''),
      followUpTo: String(row[6] || ''),
      timestamp: row[7] ? formatDate(row[7]) : (row[6] ? formatDate(row[6]) : '')
    });
  }
  
  // Urutkan dari yang terbaru ke terlama
  logs.sort(function(a, b) {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  return logs;
}

/**
 * Simpan Data Baru ke Sheet (Mobile, Fixed, atau eCare)
 */
function submitNewData(payload) {
  try {
    var ss = getSpreadsheet();
    var targetMeta = resolveTargetSheetMeta(payload && payload.serviceType);
    var sheetName = targetMeta.sheetName;
    var defaultHeaders = targetMeta.defaultHeaders;
    
    // Cari sheet secara cerdas (mendukung 'Mobile', 'Fixed', 'eCare', dll)
    var sheet = findBestSheet(ss, sheetName);
    if (!sheet) {
      sheet = ensureSheet(ss, sheetName, defaultHeaders);
    }
    ensureTrackingColumns(sheet);
    
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    
    // Buat Ticket ID baru yang unik
    var prefix = targetMeta.prefix;
    var now = new Date();
    var tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    var dateStr = Utilities.formatDate(now, tz, 'yyyyMMdd');
    var randomSuffix = Math.floor(1000 + Math.random() * 9000);
    var ticketId = prefix + '-' + dateStr + '-' + randomSuffix;
    
    var formattedDate = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');
    var agendaDateStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    if (payload && payload.tanggal) {
      var rawTgl = String(payload.tanggal).trim();
      var isoTglMatch = rawTgl.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoTglMatch) {
        agendaDateStr = isoTglMatch[1] + '-' + isoTglMatch[2] + '-' + isoTglMatch[3];
      } else {
        var parsedAgendaDate = new Date(rawTgl);
        if (!isNaN(parsedAgendaDate.getTime())) {
          agendaDateStr = Utilities.formatDate(parsedAgendaDate, tz, 'yyyy-MM-dd');
        } else {
          agendaDateStr = rawTgl;
        }
      }
    }

    var finalStatus = normalizeStatus(payload.status || 'Open');
    var defaultMonth = Utilities.formatDate(now, tz, 'MMMM yyyy');
    var selectedMonth = payload.bulan || defaultMonth;
    var inputByName = payload.inputBy || payload.author || payload.pic || payload.requestor || 'Inputer konCHO';

    // Susun baris baru sesuai urutan header yang ada di sheet target (Mobile / Fixed / eCare)
    var newRow = [];
    for (var c = 0; c < headers.length; c++) {
      var headerNorm = headers[c].toLowerCase().replace(/[^a-z0-9]/g, '');
      var val = '';
      
      if (headerNorm.indexOf('idtiket') >= 0 || headerNorm === 'id' || headerNorm === 'ticketid' || headerNorm === 'no' || c === 0) {
        val = ticketId;
      } else if (headerNorm.indexOf('bulan') >= 0 || headerNorm.indexOf('month') >= 0 || headerNorm.indexOf('periode') >= 0 || c === 1) {
        val = selectedMonth;
      } else if (headerNorm.indexOf('mainissue') >= 0 || headerNorm.indexOf('caseisu') >= 0 || headerNorm.indexOf('totalcase') >= 0 || headerNorm.indexOf('isu') >= 0 || c === 2) {
        val = payload.totalCaseIsu || payload.caseIssue || payload.issue || 'Isu Kasus CHO';
      } else if (headerNorm.indexOf('issuedetail') >= 0 || headerNorm.indexOf('description') >= 0 || headerNorm.indexOf('detail') >= 0 || headerNorm.indexOf('kendala') >= 0 || c === 3) {
        val = payload.detail || payload.issueDetails || '';
      } else if (headerNorm.indexOf('progress') >= 0 || headerNorm.indexOf('quickwin') >= 0 || headerNorm.indexOf('temporary') >= 0 || headerNorm.indexOf('solusi') >= 0 || c === 4) {
        val = payload.progressQuickWin || payload.progress || '';
      } else if (headerNorm.indexOf('needsupport') >= 0 || headerNorm.indexOf('support') >= 0 || headerNorm.indexOf('bantuan') >= 0 || c === 5) {
        val = payload.needSupport || '';
      } else if (headerNorm.indexOf('requestor') >= 0 || headerNorm.indexOf('pemohon') >= 0 || headerNorm.indexOf('pelapor') >= 0 || c === 6) {
        val = payload.requestor || payload.pic || 'Requestor';
      } else if (headerNorm.indexOf('statusinformasi') >= 0 || headerNorm.indexOf('statusupdate') >= 0) {
        val = (finalStatus === 'Open') ? 'Belum Ada Update' : 'Laporan Baru';
      } else if (headerNorm.indexOf('status') >= 0 || c === 7) {
        val = finalStatus;
      } else if (headerNorm.indexOf('followup') >= 0 || c === 8) {
        val = payload.followUpTo || '-';
      } else if (headerNorm.indexOf('tanggalagenda') >= 0 || headerNorm.indexOf('tanggal') >= 0 || headerNorm.indexOf('date') >= 0) {
        val = agendaDateStr;
      } else if (headerNorm.indexOf('terakhirupdate') >= 0 || headerNorm.indexOf('lastupdate') >= 0) {
        val = formattedDate;
      } else if (headerNorm.indexOf('inputby') >= 0 || headerNorm.indexOf('inputer') >= 0 || headerNorm.indexOf('createdby') >= 0) {
        val = inputByName;
      } else if (headerNorm.indexOf('picfacilitator') >= 0 || headerNorm.indexOf('pickupby') >= 0 || headerNorm.indexOf('facilitator') >= 0) {
        val = (finalStatus === 'Open') ? '' : inputByName;
      } else if (headerNorm.indexOf('msisdn') >= 0 || headerNorm.indexOf('internet') >= 0 || headerNorm.indexOf('nomor') >= 0) {
        val = payload.nomorLayanan || '';
      } else if (headerNorm.indexOf('pelanggan') >= 0 || headerNorm.indexOf('nama') >= 0) {
        val = payload.namaPelanggan || '';
      } else if (headerNorm.indexOf('kategori') >= 0) {
        val = payload.kategori || '';
      } else if (headerNorm.indexOf('pic') >= 0) {
        val = payload.pic || payload.requestor || 'CHO Team';
      } else if (headerNorm.indexOf('fileppt') >= 0 || headerNorm.indexOf('materippt') >= 0 || headerNorm.indexOf('linkppt') >= 0) {
        val = payload.filePpt || '';
      } else if (headerNorm.indexOf('tanggalinput') >= 0 || headerNorm.indexOf('tglinput') >= 0) {
        val = agendaDateStr;
      } else if (headerNorm.indexOf('historyreschedule') >= 0 || headerNorm.indexOf('riwayatreschedule') >= 0) {
        val = '';
      } else if (payload.customFields && payload.customFields[headers[c]] !== undefined) {
        val = payload.customFields[headers[c]];
      }
      
      newRow.push(val);
    }
    
    sheet.appendRow(newRow);
    
    // Rekam log awal di Log_Komunikasi
    var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
    var logId = 'LOG-' + dateStr + '-' + Math.floor(1000 + Math.random() * 9000);
    var unitDisplay = targetMeta.serviceType === 'FIXED' ? 'CHO Fixed' : (targetMeta.serviceType === 'ECARE' ? 'CHO eCare' : (targetMeta.serviceType === 'PRIORITY' ? 'CHO Priority' : 'CHO Mobile'));
    var initialMessage = 'Laporan baru dibuat untuk Unit ' + unitDisplay + 
      ' [Bulan: ' + selectedMonth + ', Tgl Agenda: ' + agendaDateStr + '] oleh ' + inputByName + ' (Requestor: ' + (payload.requestor || '-') + ')' + 
      '. Isu: ' + (payload.totalCaseIsu || payload.caseIssue || '-') + 
      ' [Progress & Quick Win: ' + (payload.progressQuickWin || '-') + ']';
    
    logSheet.appendRow([
      logId,
      ticketId,
      targetMeta.serviceType,
      inputByName,
      initialMessage,
      finalStatus,
      payload.followUpTo || '-',
      formattedDate
    ]);
    
    return {
      success: true,
      ticketId: ticketId,
      serviceType: targetMeta.serviceType,
      sheetName: sheet.getName(),
      tanggalAgenda: agendaDateStr,
      timestamp: formattedDate,
      message: 'Kasus ' + ticketId + ' berhasil ditambahkan ke sheet ' + sheet.getName() + '!'
    };
  } catch (err) {
    Logger.log('Error in submitNewData: ' + err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Tambah Pesan / Update Informasi Komunikasi (Termasuk Facilitator Pickup Open -> InProgress -> Closed)
 */
function postCommunicationUpdate(payload) {
  try {
    var ss = getSpreadsheet();
    var now = new Date();
    var tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    var formattedDate = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');
    var dateStr = Utilities.formatDate(now, tz, 'yyyyMMdd');
    var finalStatus = payload.newStatus ? normalizeStatus(payload.newStatus) : '';
    var targetMeta = resolveTargetSheetMeta(payload && payload.serviceType);
    
    // 1. Simpan ke Log_Komunikasi
    var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
    var logId = 'LOG-' + dateStr + '-' + Math.floor(1000 + Math.random() * 9000);
    
    var authorName = payload.closedBy || payload.author || 'CHO Staff';
    
    var logRow = [
      logId,
      payload.ticketId,
      targetMeta.serviceType,
      authorName,
      payload.message,
      finalStatus,
      payload.followUpTo || '',
      formattedDate
    ];
    logSheet.appendRow(logRow);
    
    // 2. Update status, follow up to, PIC Facilitator, dan flag update di sheet induk (Mobile / Fixed / eCare)
    var targetSheet = findBestSheet(ss, targetMeta.sheetName);
    
    if (targetSheet) {
      var lastRow = targetSheet.getLastRow();
      var lastCol = targetSheet.getLastColumn();
      if (lastRow > 1 && lastCol > 0) {
        var headers = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
        var idIdx = findHeaderIndex(headers, ['id_tiket', 'id', 'notiket', 'no_tiket', 'ticket_id']);
        if (idIdx < 0) idIdx = 0; // Kolom A fallback

        var statusIdx = findHeaderIndex(headers, ['status', 'status_tiket', 'status_cho']);
        if (statusIdx < 0 && headers.length > 7) statusIdx = 7; // Kolom H fallback

        var followUpIdx = findHeaderIndex(headers, ['follow up to', 'follow up', 'followup', 'follow_up_to']);
        if (followUpIdx < 0 && headers.length > 8) followUpIdx = 8; // Kolom I fallback

        var lastUpdateIdx = findHeaderIndex(headers, ['terakhir_update', 'last_update', 'update_terakhir']);
        var statusInfoIdx = findHeaderIndex(headers, ['status update', 'status_update', 'status informasi', 'status_informasi', 'update_status', 'ada_update', 'status_info', 'update info', 'keterangan update']);
        if (statusInfoIdx < 0 && headers.length > 9) statusInfoIdx = 9; // Kolom J fallback
        
        var idValues = targetSheet.getRange(2, idIdx + 1, lastRow - 1, 1).getValues();
        var targetRowIndex = -1;
        
        for (var r = 0; r < idValues.length; r++) {
          if (String(idValues[r][0]).trim() === String(payload.ticketId).trim()) {
            targetRowIndex = r + 2; // offset 1-indexed header
            break;
          }
        }
        
        if (targetRowIndex > 0) {
          // Update Status jika ada perubahan status (Kolom H)
          if (finalStatus && statusIdx >= 0) {
            targetSheet.getRange(targetRowIndex, statusIdx + 1).setValue(finalStatus);
          }
          // Update Follow Up To jika ada perubahan (Kolom I)
          if (payload.followUpTo && followUpIdx >= 0) {
            targetSheet.getRange(targetRowIndex, followUpIdx + 1).setValue(payload.followUpTo);
          }
          // Set flag Ada Update Baru atau Closed
          if (statusInfoIdx >= 0) {
            targetSheet.getRange(targetRowIndex, statusInfoIdx + 1).setValue(finalStatus === 'Closed' ? 'Closed' : 'Ada Update Baru');
          }
          // Set timestamp terakhir update
          if (lastUpdateIdx >= 0) {
            targetSheet.getRange(targetRowIndex, lastUpdateIdx + 1).setValue(formattedDate);
          }

          // Update PIC_Facilitator saat Facilitator melakukan Pickup (InProgress) atau Close
          var picFacIdx = findHeaderIndex(headers, ['pic_facilitator', 'pickup_by', 'pic_handling', 'facilitator']);
          if (picFacIdx >= 0 && authorName) {
            targetSheet.getRange(targetRowIndex, picFacIdx + 1).setValue(authorName);
          }
          
          // Cek jika kolom Closed_By, Keterangan_Closed, atau Keterangan_Progress ada di sheet
          var closedByIdx = findHeaderIndex(headers, ['closed_by', 'closedby', 'di_closed_oleh', 'pic_closed']);
          if (closedByIdx >= 0 && payload.closedBy) {
            targetSheet.getRange(targetRowIndex, closedByIdx + 1).setValue(payload.closedBy);
          }
          var closedNoteIdx = findHeaderIndex(headers, ['keterangan_closed', 'solusi', 'catatan_closed', 'closing_note']);
          if (closedNoteIdx >= 0 && payload.message && finalStatus === 'Closed') {
            targetSheet.getRange(targetRowIndex, closedNoteIdx + 1).setValue(payload.message);
          }
          var progressNoteIdx = findHeaderIndex(headers, ['keterangan_progress', 'catatan_progress', 'progress_note', 'keterangan_inprogress']);
          if (progressNoteIdx >= 0 && payload.message && finalStatus === 'InProgress') {
            targetSheet.getRange(targetRowIndex, progressNoteIdx + 1).setValue(payload.message);
          }
        }
      }
    }
    
    return {
      success: true,
      log: {
        logId: logId,
        ticketId: payload.ticketId,
        serviceType: targetMeta.serviceType,
        author: authorName,
        message: payload.message,
        statusTerkait: finalStatus,
        followUpTo: payload.followUpTo || '',
        timestamp: formattedDate
      },
      message: 'Status berhasil diubah menjadi ' + (finalStatus || 'updated') + '!'
    };
  } catch (err) {
    Logger.log('Error in postCommunicationUpdate: ' + err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Ubah Tanggal Agenda Kasus (Reschedule) oleh Facilitator / Administrator
 */
function rescheduleCaseDate(data) {
  try {
    if (!data || !data.ticketId || !data.newDate) {
      return { success: false, error: 'Data tiket atau tanggal baru tidak lengkap' };
    }
    var ss = getSpreadsheet();
    var targetMeta = resolveTargetSheetMeta(data.serviceType);
    var sheet = findBestSheet(ss, targetMeta.sheetName);
    if (!sheet) return { success: false, error: 'Sheet tidak ditemukan: ' + targetMeta.sheetName };

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return { success: false, error: 'Data sheet kosong' };

    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var idIdx = findHeaderIndex(headers, ['id_tiket', 'id', 'notiket', 'ticket_id']);
    if (idIdx < 0) idIdx = 0;

    var dateIdx = findHeaderIndex(headers, ['tanggal_agenda', 'tanggal', 'date']);
    var tglInputIdx = findHeaderIndex(headers, ['tanggal_input', 'tanggal_input_awal', 'tgl_input', 'created_at']);
    var histIdx = findHeaderIndex(headers, ['history_reschedule', 'riwayat_reschedule', 'reschedule_history', 'history_tanggal']);
    var lastUpdateIdx = findHeaderIndex(headers, ['terakhir_update', 'last_update']);
    var facilitatorIdx = findHeaderIndex(headers, ['pic_facilitator', 'facilitator', 'pickup_by']);
    var statusInfoIdx = findHeaderIndex(headers, ['status update', 'status_update', 'status informasi']);

    var idValues = sheet.getRange(2, idIdx + 1, lastRow - 1, 1).getValues();
    var targetRow = -1;
    for (var r = 0; r < idValues.length; r++) {
      if (String(idValues[r][0]).trim() === String(data.ticketId).trim()) {
        targetRow = r + 2;
        break;
      }
    }
    if (targetRow < 2) return { success: false, error: 'Tiket #' + data.ticketId + ' tidak ditemukan di sheet ' + targetMeta.sheetName };

    var now = new Date();
    var tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    var formattedDate = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');
    var actor = data.rescheduledBy || data.author || 'Facilitator';
    var reason = data.reason || '';

    // Ambil tanggal lama
    var oldDate = '';
    if (dateIdx >= 0) {
      var rawOld = sheet.getRange(targetRow, dateIdx + 1).getValue();
      oldDate = rawOld ? formatDate(rawOld) : '';
    }

    var newIsoDate = String(data.newDate).trim();
    var matchIso = newIsoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!matchIso) {
      var pDate = new Date(newIsoDate);
      if (!isNaN(pDate.getTime())) {
        newIsoDate = Utilities.formatDate(pDate, tz, 'yyyy-MM-dd');
      }
    }

    // Update Tanggal_Agenda di baris target
    if (dateIdx >= 0) {
      sheet.getRange(targetRow, dateIdx + 1).setValue(newIsoDate);
    }

    // Jika Tanggal_Input belum ada di sheet, buat kolomnya atau isi tanggal lama
    if (tglInputIdx >= 0) {
      var curInputDate = sheet.getRange(targetRow, tglInputIdx + 1).getValue();
      if (!curInputDate) {
        sheet.getRange(targetRow, tglInputIdx + 1).setValue(oldDate || newIsoDate);
      }
    }

    // Susun riwayat reschedule
    var historyEntry = '[' + formattedDate + '] Diubah dari ' + (oldDate || '-') + ' ke ' + newIsoDate + ' oleh ' + actor + (reason ? ' (Alasan: ' + reason + ')' : '');
    if (histIdx >= 0) {
      var existingHist = String(sheet.getRange(targetRow, histIdx + 1).getValue() || '');
      var updatedHist = existingHist ? existingHist + ' | ' + historyEntry : historyEntry;
      sheet.getRange(targetRow, histIdx + 1).setValue(updatedHist);
    }

    // Update Terakhir_Update
    if (lastUpdateIdx >= 0) {
      sheet.getRange(targetRow, lastUpdateIdx + 1).setValue(formattedDate);
    }

    // Update PIC Facilitator jika masih kosong
    if (facilitatorIdx >= 0) {
      var curFac = sheet.getRange(targetRow, facilitatorIdx + 1).getValue();
      if (!curFac || String(curFac).trim() === '') {
        sheet.getRange(targetRow, facilitatorIdx + 1).setValue(actor);
      }
    }

    // Update Status Update
    if (statusInfoIdx >= 0) {
      sheet.getRange(targetRow, statusInfoIdx + 1).setValue('Rescheduled ke ' + newIsoDate + ' oleh ' + actor);
    }

    // Catat di Log_Komunikasi
    try {
      var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
      var dateStr = Utilities.formatDate(now, tz, 'yyyyMMdd');
      var logId = 'LOG-' + dateStr + '-' + Math.floor(1000 + Math.random() * 9000);
      logSheet.appendRow([
        logId,
        data.ticketId,
        targetMeta.serviceType,
        actor,
        'Reschedule Tanggal Agenda dari ' + (oldDate || '-') + ' ke ' + newIsoDate + (reason ? '. Alasan: ' + reason : ''),
        'Reschedule',
        'Agenda Kalender',
        formattedDate
      ]);
    } catch (logErr) {
      Logger.log('Log reschedule error: ' + logErr.message);
    }

    return {
      success: true,
      ticketId: data.ticketId,
      serviceType: targetMeta.serviceType,
      oldDate: oldDate,
      newDate: newIsoDate,
      rescheduledBy: actor,
      historyEntry: historyEntry,
      message: 'Tanggal agenda tiket #' + data.ticketId + ' berhasil diubah menjadi ' + newIsoDate + ' oleh ' + actor
    };
  } catch (err) {
    Logger.log('rescheduleCaseDate error: ' + err.stack);
    return { success: false, error: err.message };
  }
}

/**
 * Tandai Tiket sebagai Sudah Ditinjau / Dibaca (Reset flag update)
 */
function markTicketAsReviewed(ticketId, serviceType) {
  try {
    var ss = getSpreadsheet();
    var targetMeta = resolveTargetSheetMeta(serviceType);
    var sheet = findBestSheet(ss, targetMeta.sheetName);
    if (!sheet) return { success: false, error: 'Sheet tidak ditemukan' };
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var idIdx = findHeaderIndex(headers, ['id_tiket', 'id', 'notiket', 'no_tiket', 'ticket_id']);
    var statusInfoIdx = findHeaderIndex(headers, ['status update', 'status_update', 'status informasi', 'status_informasi', 'update_status', 'ada_update', 'status_info', 'update info']);
    if (statusInfoIdx < 0 && headers.length > 9) statusInfoIdx = 9; // Kolom J fallback
    
    if (idIdx < 0 || statusInfoIdx < 0) return { success: false, error: 'Kolom tidak ditemukan' };
    
    var idValues = sheet.getRange(2, idIdx + 1, lastRow - 1, 1).getValues();
    for (var r = 0; r < idValues.length; r++) {
      if (String(idValues[r][0]).trim() === String(ticketId).trim()) {
        sheet.getRange(r + 2, statusInfoIdx + 1).setValue('Sudah Ditinjau');
        return { success: true, message: 'Status informasi ditandai sudah ditinjau' };
      }
    }
    return { success: false, error: 'Tiket tidak ditemukan' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Update Status Tiket secara langsung
 */
function updateTicketStatus(ticketId, serviceType, newStatus, author) {
  return postCommunicationUpdate({
    ticketId: ticketId,
    serviceType: serviceType,
    author: author || 'CHO Operator',
    newStatus: newStatus,
    message: 'Mengubah status tiket menjadi: ' + newStatus
  });
}

/**
 * Helper Pencarian Indeks Header yang fleksibel
 */
function findHeaderIndex(headers, candidateNames) {
  if (!headers || !candidateNames) return -1;
  // Pass 1: Exact matches by priority of candidateNames
  for (var j = 0; j < candidateNames.length; j++) {
    var candidate = candidateNames[j].toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var i = 0; i < headers.length; i++) {
      var cleanHeader = String(headers[i] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanHeader === candidate) {
        return i;
      }
    }
  }
  // Pass 2: Substring matches by priority of candidateNames
  for (var k = 0; k < candidateNames.length; k++) {
    var candidateSub = candidateNames[k].toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var m = 0; m < headers.length; m++) {
      var cleanHeaderSub = String(headers[m] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanHeaderSub.indexOf(candidateSub) >= 0 || candidateSub.indexOf(cleanHeaderSub) >= 0) {
        return m;
      }
    }
  }
  return -1;
}

/**
 * Helper Format Tanggal yang rapi
 */
function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  }
  return String(val);
}

/**
 * =========================================================================
 * MANAJEMEN AKUN PENGGUNA (USERS) DI GOOGLE SPREADSHEET
 * =========================================================================
 */

/**
 * Memastikan sheet 'Users' tersedia dan terstruktur di Google Spreadsheet
 */
function ensureUsersSheet(ss) {
  if (!ss) ss = getSpreadsheet();
  var sheet = findBestSheet(ss, CONFIG.SHEET_USERS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_USERS);
  }

  // Jika sheet masih baru atau kosong, pasang header & seed pengguna awal
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CONFIG.DEFAULT_HEADERS_USERS);
    var headerRange = sheet.getRange(1, 1, 1, CONFIG.DEFAULT_HEADERS_USERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f1f5f9');
    
    // Seed pengguna awal ke Google Sheets
    var defaultUsers = [
      ['admin_koncho', 'Administrator Utama', 'Administrator', 'koncho123', '2026-10-01 08:00:00'],
      ['23255592', 'Moch Fajar Sahuri', 'Administrator', 'koncho123', '2026-10-15 09:00:00'],
      ['96137', 'Reza Trianto', 'Facilitator', 'koncho@26', '2026-10-18 10:00:00'],
      ['19233208', 'EVA AROMA FITRIAWAN', 'Administrator', 'koncho123', '2026-10-20 11:00:00'],
      ['23255029', 'Putri Wahyu Febriani', 'Inputer', 'koncho123', '2026-10-22 13:00:00'],
      ['23255561', 'MARTA DEWI RAKHMANITA', 'Inputer', 'koncho123', '2026-10-25 14:00:00']
    ];
    for (var i = 0; i < defaultUsers.length; i++) {
      sheet.appendRow(defaultUsers[i]);
    }
  } else {
    var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    if (existingHeaders.length === 0 || !existingHeaders[0]) {
      sheet.getRange(1, 1, 1, CONFIG.DEFAULT_HEADERS_USERS.length).setValues([CONFIG.DEFAULT_HEADERS_USERS]);
    }
  }

  return sheet;
}

/**
 * Membaca daftar akun pengguna dari sheet Users di Google Spreadsheet
 */
function getUserRecords(ss) {
  try {
    if (!ss) ss = getSpreadsheet();
    var sheet = ensureUsersSheet(ss);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol < 4) {
      return [];
    }

    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = values[0].map(function(h) { return String(h || '').trim(); });

    var uIdx = findHeaderIndex(headers, ['Username', 'User', 'Nama Pengguna']);
    var nameIdx = findHeaderIndex(headers, ['Nama Lengkap', 'Nama', 'Identitas', 'FullName']);
    var roleIdx = findHeaderIndex(headers, ['Role', 'Peran', 'Peran Akun']);
    var passIdx = findHeaderIndex(headers, ['Password', 'Kata Sandi', 'Sandi']);
    var timeIdx = findHeaderIndex(headers, ['Terakhir Diperbarui', 'Terakhir Update', 'Waktu Update']);

    if (uIdx === -1) uIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    if (roleIdx === -1) roleIdx = 2;
    if (passIdx === -1) passIdx = 3;
    if (timeIdx === -1) timeIdx = 4;

    var users = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var rawUser = String(row[uIdx] || '').trim();
      if (!rawUser) continue;
      var cleanUser = rawUser.replace(/^@+/, '').trim();
      var rawName = String(row[nameIdx] || '').trim();
      var rawRole = String(row[roleIdx] || '').trim();
      var rawPass = String(row[passIdx] || '').trim();
      var rawTime = row[timeIdx] ? formatDate(row[timeIdx]) : '';

      users.push({
        username: cleanUser,
        name: rawName || cleanUser,
        role: rawRole || 'Inputer',
        password: rawPass,
        updatedAt: rawTime
      });
    }

    return users;
  } catch (err) {
    Logger.log('getUserRecords error: ' + err.message);
    return [];
  }
}

/**
 * Menyimpan / memperbarui akun pengguna ke sheet Users di Google Spreadsheet
 */
function saveUserAccount(userPayload) {
  try {
    var ss = getSpreadsheet();
    var sheet = ensureUsersSheet(ss);

    var origUsername = String(userPayload.origUsername || userPayload.orig || '').replace(/^@+/, '').trim();
    var newUsername = String(userPayload.username || '').replace(/^@+/, '').trim();
    var fullName = String(userPayload.name || userPayload.fullName || '').trim();
    var role = String(userPayload.role || 'Inputer').trim();
    var password = String(userPayload.password || '').trim();
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    if (!newUsername) {
      return { success: false, error: 'Username tidak boleh kosong' };
    }

    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (lastRow > 1) {
      var uValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < uValues.length; i++) {
        var rowU = String(uValues[i][0] || '').replace(/^@+/, '').trim().toLowerCase();
        if (origUsername && rowU === origUsername.toLowerCase()) {
          targetRow = i + 2;
          break;
        } else if (!origUsername && rowU === newUsername.toLowerCase()) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 1) {
      // Update baris pengguna
      sheet.getRange(targetRow, 1).setValue(newUsername);
      sheet.getRange(targetRow, 2).setValue(fullName);
      sheet.getRange(targetRow, 3).setValue(role);
      sheet.getRange(targetRow, 4).setValue(password);
      sheet.getRange(targetRow, 5).setValue(nowStr);
    } else {
      // Tambah baris baru
      sheet.appendRow([newUsername, fullName, role, password, nowStr]);
    }

    return {
      success: true,
      message: 'Akun @' + newUsername + ' berhasil disimpan di Google Sheets',
      user: {
        username: newUsername,
        name: fullName,
        role: role,
        password: password,
        updatedAt: nowStr
      }
    };
  } catch (err) {
    Logger.log('saveUserAccount error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Menghapus akun pengguna dari sheet Users di Google Spreadsheet
 */
function deleteUserAccount(username) {
  try {
    var ss = getSpreadsheet();
    var sheet = ensureUsersSheet(ss);
    var cleanU = String(username || '').replace(/^@+/, '').trim().toLowerCase();

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true };

    var uValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < uValues.length; i++) {
      var rowU = String(uValues[i][0] || '').replace(/^@+/, '').trim().toLowerCase();
      if (rowU === cleanU) {
        sheet.deleteRow(i + 2);
        return { success: true, message: 'Akun @' + cleanU + ' berhasil dihapus dari Google Sheets' };
      }
    }

    return { success: true, message: 'Akun tidak ditemukan di Google Sheets' };
  } catch (err) {
    Logger.log('deleteUserAccount error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Upload File PPT ke Google Drive Folder Khusus konCHO dan Update Link ke Sheet
 * Folder ID: 1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV
 * Folder Link: https://drive.google.com/drive/folders/1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV?hl=ID
 */
function uploadPptFile(data) {
  try {
    if (!data || !data.fileBase64) {
      return { success: false, error: 'Data file base64 tidak ditemukan' };
    }

    var folderId = CONFIG.DRIVE_FOLDER_ID || '1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV';
    var folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (fErr) {
      Logger.log('Drive folder access warning: ' + fErr.message);
      folder = DriveApp.getRootFolder();
    }

    var ticketId = data.ticketId || ('CASE-' + Date.now());
    var rawFileName = data.fileName || ('Materi_PPT_' + ticketId + '.pptx');
    var safeFileName = rawFileName.replace(/[<>:"/\\|?*]+/g, '_');

    var decoded = Utilities.base64Decode(data.fileBase64);
    var mimeType = data.mimeType || 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    var blob = Utilities.newBlob(decoded, mimeType, safeFileName);
    var driveFile = folder.createFile(blob);

    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (permErr) {
      Logger.log('Set sharing notice: ' + permErr.message);
    }

    var fileUrl = driveFile.getUrl();
    var fileId = driveFile.getId();

    // Jika terkait tiket tertentu, perbarui kolom 'File PPT' di sheet induk (Mobile / Fixed / eCare)
    if (data.ticketId && data.serviceType) {
      var ss = getSpreadsheet();
      var targetMeta = resolveTargetSheetMeta(data.serviceType);
      var sheet = findBestSheet(ss, targetMeta.sheetName);

      if (sheet) {
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        if (lastRow > 0 && lastCol > 0) {
          var allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
          var headers = allValues[0] || [];
          var pptColIdx = findHeaderIndex(headers, ['file ppt', 'file_ppt', 'link_ppt', 'materi ppt', 'materi_ppt', 'lampiran ppt']);
          
          if (pptColIdx < 0) {
            pptColIdx = lastCol;
            sheet.getRange(1, pptColIdx + 1).setValue('File PPT').setFontWeight('bold').setBackground('#E2E8F0');
          }

          var targetRowIdx = -1;
          for (var r = 1; r < allValues.length; r++) {
            if (String(allValues[r][0]).trim() === String(data.ticketId).trim()) {
              targetRowIdx = r + 1;
              break;
            }
          }

          if (targetRowIdx > 1) {
            sheet.getRange(targetRowIdx, pptColIdx + 1).setValue(fileUrl);
          }
        }
      }

      // Rekam di Log_Komunikasi
      try {
        var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
        var now = new Date();
        var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMMdd');
        var formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
        var logId = 'LOG-' + dateStr + '-' + Math.floor(1000 + Math.random() * 9000);
        var uploader = data.uploadedBy || 'User konCHO';

        logSheet.appendRow([
          logId,
          data.ticketId,
          data.serviceType,
          uploader,
          'Upload Materi PPT (' + safeFileName + ') ke Google Drive: ' + fileUrl,
          'Update PPT',
          'Materi Presentasi',
          formattedDate
        ]);
      } catch (logErr) {
        Logger.log('Log komunikasi PPT notice: ' + logErr.message);
      }
    }

    return {
      success: true,
      fileUrl: fileUrl,
      fileId: fileId,
      fileName: safeFileName,
      folderUrl: CONFIG.DRIVE_FOLDER_URL,
      message: 'Materi PPT berhasil diupload ke Google Drive konCHO!'
    };
  } catch (err) {
    Logger.log('uploadPptFile error: ' + err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Hapus File PPT dari Sheet dan Trash file di Google Drive (Khusus Role Administrator)
 */
function deletePptFile(data) {
  try {
    if (!data || !data.ticketId || !data.serviceType) {
      return { success: false, error: 'Data tiket tidak lengkap' };
    }

    var ss = getSpreadsheet();
    var targetMeta = resolveTargetSheetMeta(data.serviceType);
    var sheet = findBestSheet(ss, targetMeta.sheetName);
    var oldFileUrl = '';

    if (sheet) {
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      if (lastRow > 0 && lastCol > 0) {
        var allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
        var headers = allValues[0] || [];
        var pptColIdx = findHeaderIndex(headers, ['file ppt', 'file_ppt', 'link_ppt', 'materi ppt', 'materi_ppt', 'lampiran ppt']);
        
        if (pptColIdx >= 0) {
          for (var r = 1; r < allValues.length; r++) {
            if (String(allValues[r][0]).trim() === String(data.ticketId).trim()) {
              oldFileUrl = String(allValues[r][pptColIdx] || '');
              sheet.getRange(r + 1, pptColIdx + 1).setValue('');
              break;
            }
          }
        }
      }
    }

    // Jika file ada di Google Drive dan URL memiliki ID file, coba masukkan ke sampah (trash)
    if (oldFileUrl) {
      try {
        var matchId = oldFileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || oldFileUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (matchId && matchId[1]) {
          var driveFile = DriveApp.getFileById(matchId[1]);
          if (driveFile) {
            driveFile.setTrashed(true);
            Logger.log('File Drive ditrash: ' + matchId[1]);
          }
        }
      } catch (driveErr) {
        Logger.log('DriveApp trash notice: ' + driveErr.message);
      }
    }

    // Catat ke Log_Komunikasi
    try {
      var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
      var now = new Date();
      var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMMdd');
      var formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      var logId = 'LOG-' + dateStr + '-' + Math.floor(1000 + Math.random() * 9000);
      var adminUser = data.deletedBy || 'Administrator';

      logSheet.appendRow([
        logId,
        data.ticketId,
        data.serviceType,
        adminUser,
        'Hapus Materi PPT untuk tiket ' + data.ticketId + ' (' + (oldFileUrl || 'Lampiran PPT') + ')',
        'Hapus PPT',
        'Materi Presentasi',
        formattedDate
      ]);
    } catch (logErr) {
      Logger.log('Log komunikasi PPT notice: ' + logErr.message);
    }

    return {
      success: true,
      message: 'Materi PPT untuk Case #' + data.ticketId + ' berhasil dihapus.'
    };
  } catch (err) {
    Logger.log('deletePptFile error: ' + err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Jalankan fungsi ini SATU KALI di Google Apps Script editor (pilih fungsi ini lalu klik tombol 'Run' / 'Jalankan')
 * untuk mengesahkan perizinan Google Drive (DriveApp) dan menguji koneksi folder tujuan.
 */
function testDriveAuthorization() {
  var folderId = CONFIG.DRIVE_FOLDER_ID || '1KHMMjAovxmRpyd0JTAehyoSgH2sWItMV';
  try {
    var folder = DriveApp.getFolderById(folderId);
    var folderName = folder.getName();
    Logger.log('✅ SUKSES: Izin Google Drive aktif! Folder ditemukan: "' + folderName + '" (ID: ' + folder.getId() + ')');
    
    // Uji buat file teks kecil untuk verifikasi hak tulis
    var testFile = folder.createFile('_tes_koneksi_koncho.txt', 'Tes koneksi Google Drive konCHO berhasil pada ' + new Date().toISOString(), MimeType.PLAIN_TEXT);
    Logger.log('✅ SUKSES: Berhasil membuat file tes di folder: ' + testFile.getUrl());
    testFile.setTrashed(true);
    Logger.log('✅ File tes otomatis dibersihkan dari folder.');
    
    return {
      success: true,
      folderName: folderName,
      folderId: folder.getId(),
      message: 'Izin Google Drive berhasil diaktifkan dan folder ' + folderName + ' siap digunakan!'
    };
  } catch (err) {
    Logger.log('❌ GAGAL: ' + err.message);
    throw err;
  }
}
