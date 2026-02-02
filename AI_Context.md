## **1\. Identitas Proyek & Visi Akademik**

* **Nama:** NexusQA (Unified Test Management System).  
* **Latar Belakang:** Mengganti Google Sheets dengan sistem terintegrasi standar ISO/IEC/IEEE 29119\.  
* **Tujuan Skripsi:** Membuktikan efisiensi *Declarative Testing* menggunakan Maestro dalam satu ekosistem *Traceability*.

## **2\. Core Features (Mapping 9 Dokumen QA)**

AI harus mengimplementasikan logika yang menghubungkan dokumen-dokumen berikut secara otomatis:

1. **Strategy & Plan:** Tabel `Project.strategy` & `Milestone`.  
2. **Scenario:** Tabel `TestSuite` sebagai pengelompokan logika.  
3. **Test Case & Steps:** Grid Editor (Jantung sistem) pada tabel `TestCase` & `TestStep`.  
4. **Test Data:** Tabel `TestData` untuk library variabel testing.  
5. **Execution Log & TSR:** Tabel `TestRun` & `TestResult`.  
6. **Bug Report:** Tabel `Defect` (Auto-draft jika `TestResult` status `FAILED`).  
7. **RTM (Traceability):** Relasi Many-to-Many antara `Requirement` dan `TestCase`.

## **3\. Skema Database Final (Prisma ORM)**

*Gunakan skema ini tanpa dikurangi sedikitpun:*

Cuplikan kode  
datasource db {  
  provider  \= "postgresql"  
  url       \= env("DATABASE\_URL")  
  directUrl \= env("DIRECT\_URL")  
}

generator client {  
  provider \= "prisma-client-js"  
}

// \--- STRATEGY, PLANNING & RTM (Doc 1, 2, 9\) \---  
model Project {  
  id            String         @id @default(uuid())  
  name          String  
  strategy      String?        @db.Text  
  requirements  Requirement\[\]    
  suites        TestSuite\[\]  
  testData      TestData\[\]       
  milestones    Milestone\[\]      
  createdAt     DateTime       @default(now())  
}

model Requirement {  
  id          String     @id @default(uuid())  
  code        String     // Contoh: REQ-001  
  title       String  
  description String?  
  projectId   String  
  project     Project    @relation(fields: \[projectId\], references: \[id\])  
  testCases   TestCase\[\]   
}

model Milestone {  
  id          String    @id @default(uuid())  
  name        String      
  startDate   DateTime  
  endDate     DateTime  
  projectId   String  
  project     Project   @relation(fields: \[projectId\], references: \[id\])  
}

// \--- OPERATIONAL & DESIGN (Doc 3, 4, 5\) \---  
model TestSuite {  
  id          String     @id @default(uuid())  
  title       String       
  description String?  
  projectId   String  
  project     Project    @relation(fields: \[projectId\], references: \[id\])  
  testCases   TestCase\[\]  
}

model TestCase {  
  id             String      @id @default(uuid())  
  title          String        
  preCondition   String?  
  priority       String      @default("P2")  
  suiteId        String  
  suite          TestSuite   @relation(fields: \[suiteId\], references: \[id\])  
  requirements   Requirement\[\]   
  steps          TestStep\[\]  
  automationYaml String?       
  results        TestResult\[\]  
}

model TestStep {  
  id         String   @id @default(uuid())  
  order      Int  
  action     String  
  expected   String  
  testCaseId String  
  testCase   TestCase @relation(fields: \[testCaseId\], references: \[id\], onDelete: Cascade)  
}

model TestData {  
  id        String   @id @default(uuid())  
  key       String     
  value     String     
  projectId String  
  project   Project  @relation(fields: \[projectId\], references: \[id\])  
}

// \--- EXECUTION & DEFECTS (Doc 6, 7, 8\) \---  
model TestRun {  
  id          String       @id @default(uuid())  
  name        String         
  environment String         
  results     TestResult\[\]  
  createdAt   DateTime     @default(now())  
}

model TestResult {  
  id           String   @id @default(uuid())  
  testRunId    String  
  testRun      TestRun  @relation(fields: \[testRunId\], references: \[id\])  
  testCaseId   String  
  testCase     TestCase @relation(fields: \[testCaseId\], references: \[id\])  
  status       Status   @default(UNTESTED)   
  actualResult String?  
  defects      Defect\[\]   
}

model Defect {  
  id           String     @id @default(uuid())  
  title        String  
  severity     String  
  status       String     @default("OPEN")  
  evidenceUrl  String?      
  testResultId String  
  testResult   TestResult @relation(fields: \[testResultId\], references: \[id\])  
}

enum Status {  
  PASSED  
  FAILED  
  BLOCKED  
  SKIPPED  
  UNTESTED  
}

## **4\. Alur Logika Utama (Sequence Logic)**

1. **Manual to Maestro:** AI harus menyediakan fungsi di `lib/maestro.ts` untuk memetakan `TestStep.action` menjadi syntax Maestro YAML secara deklaratif.  
2. **Auto-Bug System:** Saat `TestResult` diupdate ke `FAILED`, sistem harus otomatis menyiapkan objek `Defect` baru yang mengambil konteks dari `TestCase` terkait.  
3. **Traceability Matrix:** Dashboard harus menampilkan persentase `Requirement` yang sudah memiliki `TestCase`.

## **5\. Struktur Project (Vibe Coding)**

* Gunakan Next.js App Router.  
* Letakkan API di `app/api/`.  
* UI menggunakan Tailwind \+ ShadcnUI dengan densitas tinggi (Compact).

