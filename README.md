# konCHO (Konsolidasi CHO) - Aplikasi Google Apps Script

Aplikasi web modern berbasis **Google Apps Script** untuk **Konsolidasi Complaint Handling Officer (CHO)** dengan database langsung terhubung ke **Google Spreadsheet**.

- **ID Spreadsheet:** `1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc`
- **Tautan Spreadsheet:** [Buka Google Spreadsheet](https://docs.google.com/spreadsheets/d/1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc/edit)
- **Struktur Kolom Utama (Mobile & Fixed):**
  - **Kolom B:** `Total Case Isu yang masuk` (Headline/Isu utama kasus)
  - **Kolom G:** `Requestor` (Nama pelapor / pemohon tiket / PIC pembuat)
  - **Kolom H:** `Status` (`Open`, `InProgress`, `Closed`)
  - **Kolom I:** `Follow up to` (Tujuan tindak lanjut teknis: NOC, RO, Teknisi Lapangan, dsb.)
  - **Sheet Pendamping:** `Log_Komunikasi` (Merekam kronologis percakapan, balasan, mutasi status, dan pengalihan follow up)

---

## 🌟 Tata Letak Baru: Sidebar Kiri & Satu Card Terpadu (Unified Cases Card)

Antarmuka telah disempurnakan berdasarkan kebutuhan operasional agar semakin ergonomis, mudah dipahami, dan ramah pengguna:

1. **Navigasi & Filter Lengkap di Sebelah Kiri (Sidebar Kiri)**:
   - **Layanan Database**: Pilihan cepat `Semua Layanan`, `CHO Mobile`, atau `CHO Fixed`.
   - **Periode Bulan**: Dropdown dinamis bulan (`Oktober 2026`, `Semua Bulan`, dll.).
   - **Ringkasan Status Kasus (KPI Interaktif)**:
     - 📦 **Total Kasus**: Menampilkan total seluruh kasus aktif.
     - 🟡 **Open**: Filter instan untuk tiket status Open.
     - 🔵 **In Progress**: Filter instan untuk tiket status In Progress.
     - 🟢 **Closed**: Filter instan untuk tiket status Closed.
   - **Status Koneksi Spreadsheet**: Menampilkan ID Sheet yang terhubung (`1bqisp...`).

2. **Satu Card Terpadu untuk Seluruh Kasus (Unified Cases Container)**:
   - Kasus 1, Kasus 2, Kasus 3, dan seterusnya kini dihimpun ke dalam **satu card container besar** yang rapi dengan garis pembatas (divider) yang elegan di sisi kanan layar.
   - Tidak lagi berupa kotak-kotak terpisah yang mengambang, sehingga daftar kasus terlihat terorganisir seperti feed tiket profesional.
   - Setiap baris kasus menampilkan:
     - Nomor Urut Kasus (`Kasus #1`), Badge Layanan (`MOBILE` / `FIXED`), Periode (`📅 Oktober 2026`), dan waktu update terakhir.
     - Badge Status: `🟡 Open`, `🔵 In Progress`, `🟢 Closed`.
     - **Isu Kasus (Kolom B)**: Judul utama dengan teks tebal dan terbaca jelas.
     - **Requestor (Kolom G)** dan **Follow Up To (Kolom I)**.
     - Nomor Layanan & Nama Pelanggan / Akun.

3. **Kotak Keterangan Status Terkini**:
   - **Saat Open**: Menampilkan kotak detail kendala awal dari pelapor.
   - **Saat In Progress**: Menampilkan kotak info biru dengan **Keterangan In Progress** dan nama PIC/pelaksana penanganan.
   - **Saat Closed**: Menampilkan kotak info hijau dengan **Keterangan Closed / Solusi** dan identitas **Di-Closed Oleh (Nama User)**.

4. **Form Pengisian In Progress (Modal)**:
   - Ketika menekan tombol **`▶️ Proses (In Progress)`** atau **`+ Update Keterangan`**:
     - Membuka form modal pengisian:
       - **Keterangan / Catatan Tindak Lanjut In Progress** (Wajib diisi)
       - **PIC / Petugas Pelaksana** (Wajib diisi)
       - **Follow Up To (Kolom I)** (Dapat diubah atau disesuaikan ke tim tujuan)
     - Data otomatis tersimpan ke sheet `Log_Komunikasi` dan mengupdate status sheet utama ke `InProgress`.

5. **Form Pengisian Closed (Modal)**:
   - Ketika user menekan tombol **`✅ Selesaikan Kasus (Closed)`**:
     - Membuka form modal penyelesaian:
       - **Keterangan Closed / Solusi Penyelesaian** (Wajib diisi)
       - **Di-Closed Oleh (Nama User)** (Wajib diisi: mencatat identitas user/petugas yang menyelesaikan kasus)
       - **Follow Up Terakhir** (Opsional)
     - Data otomatis tersimpan ke sheet `Log_Komunikasi` dengan catatan final dan status di sheet utama berubah ke `Closed`.

6. **Tombol Aksi Cepat**:
   - **Buka Kembali (Reopen)**: Untuk mengembalikan status kasus jika ada kendala lanjutan.
   - **Riwayat Log Komunikasi**: Menampilkan kronologis riwayat lengkap percakapan/penanganan.
   - **Salin Ringkasan**: Menyalin ringkasan kasus ke clipboard dalam format teks rapi.

---

## 📁 Struktur File Proyek

| File | Keterangan |
| :--- | :--- |
| `index.html` | File mandiri resmi untuk deployment **Vercel** & **GitHub Pages** (Frontend LIVE dengan auto-fetch ke Spreadsheet) |
| `vercel.json` | Konfigurasi routing & security headers untuk **Vercel** |
| `Code.gs` | Backend Google Apps Script (Endpoint Web App & REST API JSON `doGet`/`doPost` untuk Vercel) |
| `Index.html` | Template antarmuka pengguna Google Apps Script (HTML5) |
| `Styles.html` | Stylesheet CSS responsif (Full page scroll, sticky header & sidebar) |
| `Scripts.html` | Logika JavaScript klien (Live API fetch, optimistic UI, Google Script Runner) |
| `appsscript.json` | Manifest konfigurasi Google Apps Script (Zona waktu Asia/Jakarta, akses Web App) |
| `index_preview.html` | File bundle lokal untuk pengujian instan di browser tanpa server |

---

## ⚡ Panduan Sambung ke GitHub & Deploy ke Vercel

Dengan menghubungkan proyek ke **GitHub** dan **Vercel**, Anda mendapatkan:
- 🌐 Domain publik gratis yang cepat & elegan (contoh: `koncho.vercel.app`).
- 🚀 Performa loading instan via Vercel Edge CDN global.
- 🔄 Tetap terhubung **LIVE** membaca dan menulis data ke Google Spreadsheet Anda.
- 📱 Tampilan responsif sempurna untuk desktop dan mobile tanpa batas iframe Google.

---

### Langkah 1: Persiapan Repository GitHub

Buka terminal PowerShell pada folder proyek ini (`d:\ARENA ANTIGRVTY\LARAVEL_konCHO`), lalu jalankan perintah berikut:

```bash
# 1. Inisialisasi git repository
git init

# 2. Tambahkan semua file proyek (termasuk index.html & vercel.json)
git add .

# 3. Buat commit pertama
git commit -m "feat: konCHO Web App with Vercel and GitHub support"

# 4. Buat branch utama main
git branch -M main

# 5. Sambungkan ke repository GitHub Anda (ganti URL dengan repo Anda di github.com)
git remote add origin https://github.com/USERNAME_ANDA/konCHO.git

# 6. Push kode ke GitHub
git push -u origin main
```

> **Catatan:** Buat repository baru di [GitHub](https://github.com/new) terlebih dahulu (pilih *Public* atau *Private* bebas).

---

### Langkah 2: Deploy ke Vercel (1-Click Import)

1. Buka dashboard [Vercel](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..."** ➔ pilih **"Project"**.
3. Pada daftar repository GitHub, cari repository **`konCHO`** yang baru saja Anda push, lalu klik tombol **"Import"**.
4. Pada halaman konfigurasi project:
   - **Project Name:** `koncho` (atau sesuai keinginan).
   - **Framework Preset:** `Other` (Vercel otomatis mendeteksi file `index.html` murni di root).
   - **Root Directory:** `./` (default).
5. Klik tombol **"Deploy"**.
6. Dalam waktu kurang dari 30 detik, Vercel akan selesai mendeploy dan memberikan URL live Anda (misal: `https://koncho.vercel.app`)!

---

### Langkah 3: Pastikan Izin Google Apps Script Terbuka untuk Vercel

Agar Vercel dapat membaca data dari Google Spreadsheet Anda secara publik tanpa terhalang login akun Google:
1. Buka spreadsheet database Anda: [Google Spreadsheet konCHO](https://docs.google.com/spreadsheets/d/1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc/edit) ➔ **Ekstensi** > **Apps Script**.
2. Pastikan file **[Code.gs](file:///d:/ARENA%20ANTIGRVTY/LARAVEL_konCHO/Code.gs)** sudah diperbarui dengan kode terbaru yang memiliki fungsi `doGet` dan `doPost` API JSON.
3. Klik tombol **Deploy (Terapkan)** di kanan atas ➔ pilih **Kelola Penerapan (Manage deployments)**.
4. Klik ikon pensil (Edit), lalu pastikan:
   - **Execute as (Jalankan sebagai):** `Me / Saya (email Anda)`
   - **Who has access (Siapa yang memiliki akses):** **`Anyone / Siapa saja`**
5. Pilih **Versi Baru (New version)** ➔ klik **Terapkan (Deploy)**.

Dengan settingan ini, frontend di Vercel dapat melakukan `fetch()` data live dari Google Spreadsheet secara aman dan instan!

---

## 🚀 Panduan Pemasangan ke Google Apps Script (Deployment)

Ikuti langkah mudah berikut untuk memasang aplikasi ke Google Apps Script:

### Langkah 1: Buka Editor Apps Script
1. Buka spreadsheet database Anda: [Google Spreadsheet konCHO](https://docs.google.com/spreadsheets/d/1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc/edit)
2. Klik menu **Ekstensi (Extensions)** > **Apps Script**.
3. Tab baru editor Google Apps Script akan terbuka.

### Langkah 2: Salin File-File Proyek
Di editor Apps Script sebelah kiri:
1. Pada file bawaan `Code.gs`, hapus kodenya lalu salin seluruh isi dari file **[Code.gs](file:///d:/ARENA%20ANTIGRVTY/LARAVEL_konCHO/Code.gs)** ke dalamnya.
2. Klik tombol **+** di samping "Files", pilih **HTML**, beri nama `Index`. Salin seluruh isi **[Index.html](file:///d:/ARENA%20ANTIGRVTY/LARAVEL_konCHO/Index.html)**.
3. Klik tombol **+** lagi, pilih **HTML**, beri nama `Styles`. Salin seluruh isi **[Styles.html](file:///d:/ARENA%20ANTIGRVTY/LARAVEL_konCHO/Styles.html)**.
4. Klik tombol **+** lagi, pilih **HTML**, beri nama `Scripts`. Salin seluruh isi **[Scripts.html](file:///d:/ARENA%20ANTIGRVTY/LARAVEL_konCHO/Scripts.html)**.
5. Klik ikon **Simpan (Save)** atau tekan `Ctrl + S`.

### Langkah 3: Deploy sebagai Aplikasi Web (Web App)
1. Klik tombol **Terapkan (Deploy)** berwarna biru di pojok kanan atas > pilih **Penerapan Baru (New deployment)**.
2. Klik ikon gerigi (Select type) > pilih **Aplikasi Web (Web app)**.
3. Atur konfigurasi berikut:
   - **Deskripsi:** `konCHO Production v1.0`
   - **Jalankan sebagai (Execute as):** `Saya (alamat_email_anda@gmail.com)`
   - **Yang memiliki akses (Who has access):** `Siapa saja (Anyone)` atau `Siapa saja yang memiliki Akun Google (Anyone with Google account)`
4. Klik tombol **Terapkan (Deploy)**.
5. Jika muncul jendela otorisasi izin akses:
   - Klik **Tinjau Izin (Review Permissions)**.
   - Pilih akun Google Anda.
   - Klik **Lanjutan (Advanced)** > **Buka konCHO (tidak aman)** / *Go to konCHO*.
   - Klik **Izinkan (Allow)**.
6. Salin **URL Aplikasi Web (Web App URL)** yang muncul. URL ini dapat dibagikan kepada seluruh anggota tim untuk diakses melalui browser laptop atau HP!

---

## 💻 Cara Menguji / Preview Langsung di Laptop Anda

Anda juga dapat melihat dan mencoba langsung antarmuka **konCHO** secara offline di komputer Anda:
1. Buka folder proyek: `d:\ARENA ANTIGRVTY\LARAVEL_konCHO`
2. Klik ganda file **[index_preview.html](file:///d:/ARENA%20ANTIGRVTY/LARAVEL_konCHO/index_preview.html)** untuk membukanya di browser Google Chrome / Microsoft Edge.
3. Server lokal saat ini juga sedang aktif di: **`http://127.0.0.1:8088/index_preview.html`**
4. Anda bisa langsung mencoba:
   - Membaca daftar tiket kasus Mobile & Fixed.
   - Mengetik update di composer media komunikasi dan menekan tombol *Kirim Update Informasi*.
   - Mengklik tombol *+ Input Data CHO* untuk membuat tiket baru.
   - Memfilter tiket "Ada Update Baru 🔥".
