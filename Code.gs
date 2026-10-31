/**
 * =========================================================================
 * konCHO - Konsolidasi Complaint Handling Officer (CHO)
 * Web Application Backend Script (Google Apps Script)
 * Database: Google Spreadsheet ID: 1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc
 * Sheets: Mobile, Fixed, Log_Komunikasi
 * =========================================================================
 */

var CONFIG = {
  SPREADSHEET_ID: '1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc',
  SHEET_MOBILE: 'Mobile',
  SHEET_FIXED: 'Fixed',
  SHEET_LOG: 'Log_Komunikasi',
  // Sesuai struktur kolom user:
  // Kolom A: ID_Tiket / Tanggal
  // Kolom B: Total Case Isu yang masuk
  // Kolom C: Nomor_Layanan (MSISDN / Internet)
  // Kolom D: Nama_Pelanggan
  // Kolom E: Wilayah_Cluster
  // Kolom F: Kategori_Keluhan
  // Kolom G: Requestor
  // Kolom H: Status (Open, InProgress, Closed)
  // Kolom I: Follow up to
  DEFAULT_HEADERS_MOBILE: [
    'ID_Tiket', 
    'Total Case Isu yang masuk', 
    'Nomor_MSISDN', 
    'Nama_Pelanggan', 
    'Regional_Cluster', 
    'Kategori_Keluhan', 
    'Requestor', 
    'Status', 
    'Follow up to', 
    'Detail_Kendala', 
    'Terakhir_Update', 
    'Status_Informasi'
  ],
  DEFAULT_HEADERS_FIXED: [
    'ID_Tiket', 
    'Total Case Isu yang masuk', 
    'Nomor_Internet_PSTN', 
    'Nama_Pelanggan', 
    'Witel_Datel', 
    'Kategori_Kendala', 
    'Requestor', 
    'Status', 
    'Follow up to', 
    'Detail_Kendala', 
    'Terakhir_Update', 
    'Status_Informasi'
  ],
  DEFAULT_HEADERS_LOG: [
    'Log_ID', 'ID_Tiket', 'Tipe_Layanan', 'Pengirim', 'Pesan_Update', 
    'Status_Terkait', 'Follow_Up_To', 'Waktu_Update'
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
  var isLog = cleanTarget.indexOf('log') >= 0;

  var candidates = [];

  // Pass 1: Exact matches (case-insensitive & trimmed)
  for (var i = 0; i < sheets.length; i++) {
    var sName = sheets[i].getName();
    var cleanSName = sName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanSName === cleanTarget) {
      candidates.push(sheets[i]);
    }
  }

  // Pass 2: Semantic keyword matching (Fixed vs Mobile vs Log)
  if (candidates.length === 0) {
    for (var j = 0; j < sheets.length; j++) {
      var sName2 = sheets[j].getName();
      var cleanSName2 = sName2.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (isLog && cleanSName2.indexOf('log') >= 0) {
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
 * Helper: Ensure sheet exists with proper headers
 */
function ensureSheet(ss, sheetName, defaultHeaders) {
  var sheet = findSheetCaseInsensitive(ss, sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(defaultHeaders);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    return sheet;
  }
  
  // Periksa apakah baris header sudah ada
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(defaultHeaders);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Inisialisasi sheet & pastikan kolom tracking (Status_Informasi, Terakhir_Update) tersedia
 */
function initializeDatabase() {
  var ss = getSpreadsheet();
  var mobileSheet = ensureSheet(ss, CONFIG.SHEET_MOBILE, CONFIG.DEFAULT_HEADERS_MOBILE);
  var fixedSheet = ensureSheet(ss, CONFIG.SHEET_FIXED, CONFIG.DEFAULT_HEADERS_FIXED);
  var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
  
  // Pastikan kolom tracking aman
  try {
    ensureTrackingColumns(mobileSheet);
    ensureTrackingColumns(fixedSheet);
  } catch (e) {
    Logger.log('ensureTrackingColumns notice: ' + e.message);
  }
  
  return {
    success: true,
    message: 'Database konCHO siap digunakan'
  };
}

/**
 * Pastikan kolom 'Terakhir_Update' dan 'Status_Informasi' ada di header
 */
function ensureTrackingColumns(sheet) {
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  var needsStatusInfo = !headers.some(function(h) { 
    var cleanH = String(h).toLowerCase().replace(/[^a-z]/g, '');
    return cleanH === 'statusinformasi' || cleanH === 'statusupdate'; 
  });
  var needsLastUpdate = !headers.some(function(h) { 
    var cleanL = String(h).toLowerCase().replace(/[^a-z]/g, '');
    return cleanL === 'terakhirupdate' || cleanL === 'lastupdate'; 
  });
  
  if (needsStatusInfo) {
    sheet.getRange(1, lastCol + 1).setValue('Status_Informasi').setFontWeight('bold').setBackground('#E2E8F0');
    lastCol++;
  }
  if (needsLastUpdate) {
    sheet.getRange(1, lastCol + 1).setValue('Terakhir_Update').setFontWeight('bold').setBackground('#E2E8F0');
  }
}

/**
 * Ambil semua data awal (Mobile, Fixed, Log_Komunikasi, dan metadata)
 */
function getInitialData() {
  try {
    initializeDatabase();
    var ss = getSpreadsheet();
    
    var mobileData = getSheetRecords(ss, CONFIG.SHEET_MOBILE, 'MOBILE');
    var fixedData = getSheetRecords(ss, CONFIG.SHEET_FIXED, 'FIXED');
    var logData = getLogRecords(ss);
    
    return {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      mobileHeaders: mobileData.headers,
      fixedHeaders: fixedData.headers,
      mobileRecords: mobileData.records,
      fixedRecords: fixedData.records,
      detectedSheets: {
        mobile: mobileData.sheetName,
        fixed: fixedData.sheetName,
        all: ss.getSheets().map(function(s) { return s.getName(); })
      },
      logs: logData,
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

  var detailIdx = findHeaderIndex(headers, ['issue details', 'detail_kendala', 'detail kendala', 'detail', 'keterangan', 'deskripsi', 'catatan']);
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
  var dateIdx = findHeaderIndex(headers, ['tanggal_lapor', 'tanggal', 'tgl', 'created_at', 'date', 'timestamp', 'waktu']);
  var nameIdx = findHeaderIndex(headers, ['nama_pelanggan', 'nama', 'customer_name', 'pelanggan', 'akun', 'customer']);
  var numIdx = findHeaderIndex(headers, ['nomor_msisdn', 'nomor_internet_pstn', 'msisdn', 'no_layanan', 'no_internet', 'telepon', 'nomor', 'inet']);
  var catIdx = findHeaderIndex(headers, ['kategori_keluhan', 'kategori_kendala', 'kategori']);
  var picIdx = findHeaderIndex(headers, ['pic_handling', 'pic', 'petugas']);
  var lastUpdateIdx = findHeaderIndex(headers, ['terakhir_update', 'last_update', 'update_terakhir']);
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
      nama: rawName,
      nomorLayanan: rawNum,
      kategori: catIdx >= 0 && row[catIdx] ? String(row[catIdx]).trim() : 'General',
      detail: fullDetail,
      progress: rawProgress,
      needSupport: rawNeed,
      pic: picIdx >= 0 && row[picIdx] ? String(row[picIdx]).trim() : rawReq,
      terakhirUpdate: lastUpdateIdx >= 0 && row[lastUpdateIdx] ? formatDate(row[lastUpdateIdx]) : '',
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
 * Simpan Data Baru ke Sheet (Mobile atau Fixed)
 */
function submitNewData(payload) {
  try {
    var ss = getSpreadsheet();
    var sheetName = payload.serviceType === 'MOBILE' ? CONFIG.SHEET_MOBILE : CONFIG.SHEET_FIXED;
    var defaultHeaders = payload.serviceType === 'MOBILE' ? CONFIG.DEFAULT_HEADERS_MOBILE : CONFIG.DEFAULT_HEADERS_FIXED;
    var sheet = ensureSheet(ss, sheetName, defaultHeaders);
    ensureTrackingColumns(sheet);
    
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    
    // Buat Ticket ID baru yang unik
    var prefix = payload.serviceType === 'MOBILE' ? 'CHO-M' : 'CHO-F';
    var now = new Date();
    var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMMdd');
    var randomSuffix = Math.floor(1000 + Math.random() * 9000);
    var ticketId = prefix + '-' + dateStr + '-' + randomSuffix;
    
    var formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var finalStatus = normalizeStatus(payload.status || 'Open');

    // Susun baris baru sesuai urutan header yang ada di sheet
    var newRow = [];
    for (var c = 0; c < headers.length; c++) {
      var headerNorm = headers[c].toLowerCase().replace(/[^a-z0-9]/g, '');
      var val = '';
      
      if (headerNorm.indexOf('idtiket') >= 0 || headerNorm === 'id' || headerNorm === 'ticketid' || c === 0) {
        val = ticketId;
      } else if (headerNorm.indexOf('totalcase') >= 0 || headerNorm.indexOf('isu') >= 0 || c === 1) {
        val = payload.totalCaseIsu || payload.detail || 'Isu Kasus CHO';
      } else if (headerNorm.indexOf('requestor') >= 0 || c === 6) {
        val = payload.requestor || payload.pic || 'Requestor';
      } else if (headerNorm.indexOf('statusinformasi') >= 0) {
        val = 'Laporan Baru';
      } else if (headerNorm.indexOf('status') >= 0 || c === 7) {
        val = finalStatus;
      } else if (headerNorm.indexOf('followup') >= 0 || c === 8) {
        val = payload.followUpTo || '-';
      } else if (headerNorm.indexOf('tanggal') >= 0 || headerNorm.indexOf('date') >= 0) {
        val = formattedDate;
      } else if (headerNorm.indexOf('msisdn') >= 0 || headerNorm.indexOf('internet') >= 0 || headerNorm.indexOf('nomor') >= 0) {
        val = payload.nomorLayanan || '';
      } else if (headerNorm.indexOf('pelanggan') >= 0 || headerNorm.indexOf('nama') >= 0) {
        val = payload.namaPelanggan || '';
      } else if (headerNorm.indexOf('kategori') >= 0) {
        val = payload.kategori || '';
      } else if (headerNorm.indexOf('detail') >= 0 || headerNorm.indexOf('kendala') >= 0) {
        val = payload.detail || '';
      } else if (headerNorm.indexOf('pic') >= 0) {
        val = payload.pic || payload.requestor || 'CHO Team';
      } else if (headerNorm.indexOf('terakhirupdate') >= 0) {
        val = formattedDate;
      } else if (payload.customFields && payload.customFields[headers[c]] !== undefined) {
        val = payload.customFields[headers[c]];
      }
      
      newRow.push(val);
    }
    
    sheet.appendRow(newRow);
    
    // Rekam log awal di Log_Komunikasi
    var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
    var logId = 'LOG-' + dateStr + '-' + Math.floor(1000 + Math.random() * 9000);
    var initialMessage = 'Laporan baru dibuat oleh Requestor: ' + (payload.requestor || '-') + 
      '. Isu: ' + (payload.totalCaseIsu || payload.detail || '-') + 
      ' [Follow up to: ' + (payload.followUpTo || '-') + ']';
    
    logSheet.appendRow([
      logId,
      ticketId,
      payload.serviceType,
      payload.requestor || payload.pic || 'System',
      initialMessage,
      finalStatus,
      payload.followUpTo || '-',
      formattedDate
    ]);
    
    return {
      success: true,
      ticketId: ticketId,
      timestamp: formattedDate,
      message: 'Kasus ' + ticketId + ' berhasil ditambahkan!'
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
 * Tambah Pesan / Update Informasi Komunikasi
 */
function postCommunicationUpdate(payload) {
  try {
    var ss = getSpreadsheet();
    var now = new Date();
    var formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMMdd');
    var finalStatus = payload.newStatus ? normalizeStatus(payload.newStatus) : '';
    
    // 1. Simpan ke Log_Komunikasi
    var logSheet = ensureSheet(ss, CONFIG.SHEET_LOG, CONFIG.DEFAULT_HEADERS_LOG);
    var logId = 'LOG-' + dateStr + '-' + Math.floor(1000 + Math.random() * 9000);
    
    var authorName = payload.closedBy || payload.author || 'CHO Staff';
    
    var logRow = [
      logId,
      payload.ticketId,
      payload.serviceType,
      authorName,
      payload.message,
      finalStatus,
      payload.followUpTo || '',
      formattedDate
    ];
    logSheet.appendRow(logRow);
    
    // 2. Update status, follow up to, dan flag update di sheet induk (Mobile / Fixed)
    var sheetName = payload.serviceType === 'MOBILE' ? CONFIG.SHEET_MOBILE : CONFIG.SHEET_FIXED;
    var targetSheet = findSheetCaseInsensitive(ss, sheetName);
    
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
        serviceType: payload.serviceType,
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
 * Tandai Tiket sebagai Sudah Ditinjau / Dibaca (Reset flag update)
 */
function markTicketAsReviewed(ticketId, serviceType) {
  try {
    var ss = getSpreadsheet();
    var sheetName = serviceType === 'MOBILE' ? CONFIG.SHEET_MOBILE : CONFIG.SHEET_FIXED;
    var sheet = findSheetCaseInsensitive(ss, sheetName);
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
  for (var i = 0; i < headers.length; i++) {
    var cleanHeader = String(headers[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var j = 0; j < candidateNames.length; j++) {
      var candidate = candidateNames[j].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanHeader === candidate || cleanHeader.indexOf(candidate) >= 0) {
        return i;
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
