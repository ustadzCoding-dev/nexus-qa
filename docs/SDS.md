# **Dokumen 2: Software Design Specification (SDS)**

**NexusQA: Unified Traceability & Automation System**

## **1\. Arsitektur Relasi (Mapping 9 Dokumen ke Database)**

Agar Anda tidak mengisi 9 dokumen manual, skema ini dirancang dengan **Otomatisasi Hubungan**:

1. **Test Strategy & Plan** $\\rightarrow$ Disimpan dalam tabel Project & Milestone.  
2. **Test Scenario** $\\rightarrow$ Disimpan dalam TestSuite (Grouping logic).  
3. **Test Case & Steps** $\\rightarrow$ Jantung sistem (The Grid Editor).  
4. **Test Data** $\\rightarrow$ Tabel TestDataLibrary yang bisa di-inject ke Steps.  
5. **Execution Log & TSR** $\\rightarrow$ Tabel TestRun & TestResult.  
6. **Bug Report** $\\rightarrow$ Tabel Defect yang otomatis ter-draft saat status "Fail".  
7. **RTM** $\\rightarrow$ Tabel Requirement yang terhubung langsung ke TestCase.

---

## **2\. Skema Database Final (Prisma ORM)**

Berikan kode ini ke AI Anda sebagai instruksi utama pembuatan database:

Cuplikan kode  
// \--- KELOMPOK STRATEGI & PERENCANAAN (Doc 1, 2, 9\) \---

model Project {  
  id            String         @id @default(uuid())  
  name          String  
  strategy      String?        @db.Text // Dokumen 1: Test Strategy  
  requirements  Requirement\[\]  // Dokumen 9: RTM Base  
  suites        TestSuite\[\]  
  testData      TestData\[\]     // Dokumen 5: Test Data Library  
  milestones    Milestone\[\]    // Dokumen 2: Test Plan/Jadwal  
  createdAt     DateTime       @default(now())  
}

model Requirement {  
  id          String     @id @default(uuid())  
  code        String     // Contoh: REQ-001  
  title       String  
  description String?  
  projectId   String  
  project     Project    @relation(fields: \[projectId\], references: \[id\])  
  testCases   TestCase\[\] // Relasi untuk RTM (Traceability)  
}

model Milestone {  
  id          String    @id @default(uuid())  
  name        String    // Contoh: Sprint 1 Release  
  startDate   DateTime  
  endDate     DateTime  
  projectId   String  
  project     Project   @relation(fields: \[projectId\], references: \[id\])  
}

// \--- KELOMPOK OPERASIONAL (Doc 3, 4, 5\) \---

model TestSuite {  
  id          String     @id @default(uuid())  
  title       String     // Dokumen 4: Test Scenario Name  
  description String?  
  projectId   String  
  project     Project    @relation(fields: \[projectId\], references: \[id\])  
  testCases   TestCase\[\]  
}

model TestCase {  
  id             String      @id @default(uuid())  
  title          String      // Dokumen 3: Test Case Title  
  preCondition   String?  
  priority       String      @default("P2")  
  suiteId        String  
  suite          TestSuite   @relation(fields: \[suiteId\], references: \[id\])  
  requirements   Requirement\[\] // Link ke RTM  
  steps          TestStep\[\]  
  automationYaml String?     // Maestro Integration  
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
  key       String   // Nama variabel, misal: "valid\_user"  
  value     String   // Nilai data, misal: "test@example.com"  
  projectId String  
  project   Project  @relation(fields: \[projectId\], references: \[id\])  
}

// \--- KELOMPOK EKSEKUSI & TEMUAN (Doc 6, 7, 8\) \---

model TestRun {  
  id          String       @id @default(uuid())  
  name        String       // Dokumen 6: Execution Log Name  
  environment String       // Staging / Prod  
  results     TestResult\[\]  
  createdAt   DateTime     @default(now())  
}

model TestResult {  
  id          String   @id @default(uuid())  
  testRunId   String  
  testRun     TestRun  @relation(fields: \[testRunId\], references: \[id\])  
  testCaseId  String  
  testCase    TestCase @relation(fields: \[testCaseId\], references: \[id\])  
  status      Status   @default(UNTESTED) // Dokumen 8: TSR Source  
  actualResult String?  
  defects     Defect\[\] // Dokumen 7: Bug Report  
}

model Defect {  
  id           String     @id @default(uuid())  
  title        String  
  severity     String  
  status       String     @default("OPEN")  
  evidenceUrl  String?    // Screenshot/Video  
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
