# **Dokumen 4: Struktur Folder & Inisialisasi Project (Vibe Coding Ready)**

Ini adalah instruksi langsung yang bisa Anda berikan ke **Cursor/Windsurf** untuk memulai project.

### **1\. Struktur Folder (Next.js App Router)**

Plaintext  
nexus-qa/  
├── app/                  \# Frontend (Next.js Pages & Actions)  
│   ├── (auth)/           \# Login/Register  
│   ├── projects/         \# Dashboard & List Project  
│   ├── test-case/        \# The Grid Editor  
│   └── execution/        \# Test Runner Interface  
├── components/           \# Reusable UI (Radix/Shadcn)  
│   ├── editor/           \# Custom Grid Components  
│   └── charts/           \# Dashboard Components  
├── lib/                  \# Logic & Utilities  
│   ├── maestro/          \# YAML Parser Engine  
│   └── prisma.ts         \# Database Client  
├── prisma/  
│   └── schema.prisma     \# Skema yang sudah kita buat  
└── public/               \# Assets (Icons, Logos)  
