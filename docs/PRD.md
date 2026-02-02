# **Dokumen 1: Product Requirements Document (PRD)**

**Nama Proyek:** NexusQA

**Tujuan:** Platform Manajemen Pengujian Software Terpadu dengan Integrasi Automasi Maestro.

## **1\. Pendahuluan**

### **1.1 Latar Belakang (Studi Literatur)**

Berdasarkan standar **ISO/IEC/IEEE 29119** tentang pengujian perangkat lunak, dokumentasi pengujian harus mencakup ketertelusuran (traceability) yang jelas. Saat ini, penggunaan *Spreadsheet* (Google Sheets) menciptakan "Information Silo" di mana hasil tes manual tidak terhubung dengan skrip automasi. NexusQA hadir untuk menjembatani celah ini menggunakan pendekatan *Declarative Testing* melalui framework Maestro.

### **1.2 Masalah Utama**

1. **Inefisiensi Penulisan:** QA menghabiskan waktu menulis ulang langkah yang sama berkali-kali.  
2. **Kesenjangan Automasi:** QA Manual kesulitan beralih ke automasi karena hambatan bahasa pemrograman.  
3. **Audit Trail:** Google Sheets tidak memiliki kontrol versi yang kuat untuk perubahan langkah pengetesan.

## **2\. Cakupan Produk (Scope)**

### **2.1 Fitur Utama (Functional Requirements)**

* **FR-01: Spreadsheet-like Grid Editor:** Interface input data yang cepat dengan dukungan keyboard shortcut.  
* **FR-02: Maestro YAML Generator:** Konversi otomatis dari langkah bahasa manusia ke format `.yaml` Maestro.  
* **FR-03: Centralized Shared Steps:** Pustaka langkah yang dapat digunakan kembali (Reusable) untuk efisiensi.  
* **FR-04: Test Run Execution:** Modul eksekusi tes manual dengan pelaporan status real-time.  
* **FR-05: Analytics Dashboard:** Visualisasi tingkat keberhasilan tes (Pass/Fail rate).

### **2.2 Batasan Teknis (Non-Functional Requirements)**

* **Stack:** Next.js (Gratis di Vercel), Supabase (Gratis di tier hobi).  
* **Performa:** Render ribuan baris tanpa lag menggunakan teknik *Windowing/Virtualization*.  
* **Aksesibilitas:** Berbasis web, responsif, dan mendukung mode gelap.

## **3\. User Journey (Alur Pengguna)**

1. **Manager** membuat proyek dan menentukan *Requirements*.  
2. **QA Manual** menulis *Test Case* pada Grid Editor.  
3. **QA Automation** menekan tombol "Generate Maestro" untuk mendapatkan skrip automasi.  
4. **Sistem** menyimpan hasil eksekusi (manual maupun automasi) ke dalam database terpusat.

