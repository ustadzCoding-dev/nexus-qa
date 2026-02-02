# **Dokumen 3: Perancangan Proses & API (Sequence Diagram)**

## **3.1 Sequence Diagram: Manual to Maestro Conversion**

Proses ini menjelaskan bagaimana langkah manual di Grid Editor berubah menjadi file automasi yang siap pakai.

1. **User** menginput langkah di Grid Editor (misal: "Klik tombol Login").  
2. **Frontend** mengirimkan array objek langkah ke **Conversion Engine**.  
3. **Conversion Engine** melakukan *mapping* kata kunci (misal: "Klik" \-\> `tapOn`, "Isi" \-\> `inputText`).  
4. **Backend** menyimpan metadata automasi ke tabel `TestCase` dan mengembalikan file `.yaml` ke **User**.

## **3.2 Sequence Diagram: Automated Defect Drafting**

Inilah fitur "Otomatisasi Hubungan" yang kita janjikan.

1. **QA** menjalankan tes dan memilih status `FAILED`.  
2. **System** mendeteksi status `FAILED` dan secara otomatis mengambil:  
   * Langkah-langkah dari `TestCase`.  
   * `Actual Result` yang diinput user.  
   * `Environment` dari `TestRun`.  
3. **System** melakukan *trigger* ke `Defect Service` untuk membuat draft laporan bug (Pre-filled).  
4. **User** tinggal meninjau dan klik "Save/Push to Jira".

---

## **3.3 API Design (RESTful Specification)**

Untuk **Vibe Coding**, AI Anda butuh kontrak API yang jelas. Berikut adalah *endpoint* krusial yang harus dibangun:

### **1\. Module: Projects & Requirements (RTM)**

* `GET /api/projects` \- Mengambil semua proyek.  
* `POST /api/projects/:id/requirements` \- Menambah requirement baru untuk RTM.

### **2\. Module: Test Case & Maestro (The Core)**

* `GET /api/suites/:id/test-cases` \- List test case dalam satu scenario.  
* `PATCH /api/test-cases/:id` \- Update langkah (Grid Editor autosave).  
* `GET /api/test-cases/:id/export-maestro` \- Mengambil file YAML hasil konversi.

### **3\. Module: Execution & Reporting (TSR)**

* `POST /api/test-runs` \- Membuat sesi eksekusi baru.  
* `POST /api/test-results` \- Mencatat hasil (Pass/Fail) per case.  
* `GET /api/projects/:id/stats` \- Data untuk Dashboard (Total tests, % Success, % Failure).

