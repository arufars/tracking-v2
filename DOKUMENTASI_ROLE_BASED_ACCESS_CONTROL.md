# 🔐 Dokumentasi Role-Based Access Control (RBAC)

> Dokumentasi lengkap sistem Role-Based Access Control untuk Dreamlight World Media Production Tracking System

**Tanggal Dokumentasi**: 2 Januari 2026  
**Project**: Dreamlight World Media Production Tracking  
**Security Model**: Role-Based Access Control (RBAC)

---

## 📑 **DAFTAR ISI**

1. [Pengenalan RBAC](#1-pengenalan-rbac)
2. [Struktur Role System](#2-struktur-role-system)
3. [Role: Tim Produksi](#3-role-tim-produksi)
4. [Role: Broadcaster/Client](#4-role-broadcasterclient)
5. [Role: Investor](#5-role-investor)
6. [Permission Matrix](#6-permission-matrix)
7. [Data Visibility Rules](#7-data-visibility-rules)
8. [Implementation Strategy](#8-implementation-strategy)
9. [Security Best Practices](#9-security-best-practices)
10. [Testing & Validation](#10-testing--validation)

---

## 1. 🎯 **PENGENALAN RBAC**

### **Apa itu RBAC?**

**Role-Based Access Control (RBAC)** adalah metode security di mana akses ke resources (data, fitur, halaman) dikontrol berdasarkan **role** yang dimiliki user.

### **Kenapa RBAC Penting untuk Sistem Ini?**

Sistem ini menangani data sensitif dengan stakeholder berbeda:

- 🔒 **Keuangan Internal Tim** (sensitive) → Hanya Tim Produksi
- 📊 **Progress Detail** (operational) → Tim Produksi & Broadcaster
- 💰 **Financial Summary** (strategic) → Investor
- 🎬 **Production Status** (delivery) → Broadcaster

**Tanpa RBAC**:

- ❌ Broadcaster bisa lihat gaji tim internal
- ❌ Investor bisa lihat detail pembayaran honor
- ❌ Data breach & loss of trust

**Dengan RBAC**:

- ✅ Setiap role hanya lihat data yang relevan
- ✅ Sensitive data terlindungi
- ✅ Compliance dengan privacy requirements
- ✅ Audit trail untuk akses data

---

## 2. 🏗️ **STRUKTUR ROLE SYSTEM**

### **Hierarki Role**

```
┌─────────────────────────────────────┐
│       TIM PRODUKSI (Admin)          │
│       • Full Access                 │
│       • CRUD All Resources          │
│       • View Sensitive Data         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    BROADCASTER/CLIENT (Viewer)      │
│    • Read-Only (Own Projects)       │
│    • Production Status              │
│    • Delivery Schedule              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     INVESTOR (Stakeholder)          │
│     • Read-Only (High-Level)        │
│     • Financial Summary             │
│     • Progress Overview             │
└─────────────────────────────────────┘
```

### **Role Characteristics**

| Role             | Access Level | Data Scope                | Write Permission |
| ---------------- | ------------ | ------------------------- | ---------------- |
| **Tim Produksi** | **Full**     | All Projects              | ✅ Yes           |
| **Broadcaster**  | **Limited**  | Own Projects Only         | ❌ No            |
| **Investor**     | **Summary**  | All Projects (High-level) | ❌ No            |

---

## 3. 👨‍💼 **ROLE: TIM PRODUKSI**

### **Identitas Role**

```typescript
{
  roleId: "TIM_PRODUKSI",
  displayName: "Tim Produksi",
  level: "ADMIN",
  description: "Internal production team dengan full access"
}
```

---

### **Permissions Lengkap**

#### **A. Project Management** 📁

```typescript
projects: {
  create: true,        // ✅ Buat proyek baru
  read: true,          // ✅ Lihat semua proyek
  update: true,        // ✅ Edit proyek
  delete: true,        // ✅ Hapus proyek

  scope: "ALL",        // Semua proyek
  filters: null        // Tidak ada filter
}
```

**Use Cases**:

- Buat proyek baru untuk klien
- Update status produksi
- Assign broadcaster/client
- Set budget & timeline
- Archive/delete completed projects

---

#### **B. Milestone Management** 🎯

```typescript
milestones: {
  create: true,        // ✅ Buat milestone baru
  read: true,          // ✅ Lihat semua milestone
  update: true,        // ✅ Update progress milestone
  delete: true,        // ✅ Hapus milestone

  visibility: {
    setClientVisibility: true,    // ✅ Control visibility untuk client
    setInvestorVisibility: true   // ✅ Control visibility untuk investor
  }
}
```

**Use Cases**:

- Define project milestones
- Track completion status
- Control apa yang visible ke client/investor
- Update milestone progress
- Set due dates & reminders

**Example**:

```typescript
// Internal milestone (hanya tim)
{
  name: "Script Revision Round 3",
  visibleToClient: false,     // ❌ Client tidak perlu tahu
  visibleToInvestor: false    // ❌ Investor tidak perlu tahu
}

// Public milestone (semua stakeholder)
{
  name: "Master Episode 4 Ready",
  visibleToClient: true,      // ✅ Client perlu tahu
  visibleToInvestor: true     // ✅ Investor perlu tahu
}
```

---

#### **C. Episode Management** 🎬

```typescript
episodes: {
  create: true,        // ✅ Tambah episode baru
  read: true,          // ✅ Lihat detail semua episode
  update: true,        // ✅ Update status episode
  delete: true,        // ✅ Hapus episode

  statusTracking: {
    updatePhase: true,           // ✅ Update: Editing, Shooting, Master Ready
    uploadDeliverables: true,    // ✅ Upload file master
    setDeliveryDate: true        // ✅ Set tanggal penyerahan
  }
}
```

**Episode Lifecycle**:

```
1. Shooting Berlangsung  (shooting: true)
   ↓
2. Editing Selesai       (editing: true)
   ↓
3. Master Siap Kirim     (masterReady: true)
   ↓
4. Delivered             (delivered: true)
```

---

#### **D. Financial Management** 💰

```typescript
financials: {
  // Budget
  viewBudget: true,              // ✅ Lihat total budget
  editBudget: true,              // ✅ Edit allocation budget
  viewBudgetBreakdown: true,     // ✅ Lihat breakdown per kategori

  // Expenses
  viewExpenses: true,            // ✅ Lihat total expense
  viewDetailedExpenses: true,    // ✅ Lihat detail per transaksi
  addExpense: true,              // ✅ Input expense baru
  editExpense: true,             // ✅ Edit expense

  // Income
  viewIncome: true,              // ✅ Lihat total income
  viewAccountReceivable: true,   // ✅ Lihat piutang
  editIncome: true,              // ✅ Update income status

  // EXCLUSIVE: Team Payments (HANYA TIM PRODUKSI)
  viewTeamPayments: true,        // ✅ Lihat pembayaran tim
  addTeamPayment: true,          // ✅ Input honor/gaji
  editTeamPayment: true,         // ✅ Edit status pembayaran
  deleteTeamPayment: true,       // ✅ Hapus record pembayaran

  viewPaymentDetails: {
    honor: true,                 // ✅ Honor per person
    gaji: true,                  // ✅ Gaji per person
    pettyCash: true,             // ✅ Petty cash details
    perPerson: true              // ✅ Breakdown per anggota tim
  }
}
```

**Sensitive Data yang HANYA Tim Produksi Bisa Akses**:

```typescript
// Example: Team Payment Record
{
  memberName: "John Doe",
  role: "Producer",
  type: "HONOR",
  amount: 15000000,           // ✅ HANYA Tim Produksi lihat
  status: "PAID",
  paidDate: "2026-01-01",
  description: "Honor Episode 1-4"
}
```

---

#### **E. User Management** 👥

```typescript
users: {
  create: true,        // ✅ Buat user baru
  read: true,          // ✅ Lihat semua user
  update: true,        // ✅ Edit user data
  delete: true,        // ✅ Hapus user

  roleManagement: {
    assignRole: true,            // ✅ Assign role ke user
    changeRole: true,            // ✅ Ubah role user
    viewRolePermissions: true    // ✅ Lihat permission per role
  }
}
```

---

#### **F. Notifications & Reports** 🔔

```typescript
notifications: {
  send: true,          // ✅ Kirim notifikasi manual
  manage: true,        // ✅ Manage notification settings
  viewAll: true        // ✅ Lihat semua notification log
}

reports: {
  generate: true,      // ✅ Generate custom reports
  export: true,        // ✅ Export ke PDF/Excel
  schedule: true,      // ✅ Schedule automatic reports
  viewAuditLog: true   // ✅ Lihat audit trail
}
```

---

#### **G. Delivery Management** 📦

```typescript
delivery: {
  createSchedule: true,        // ✅ Buat jadwal penyerahan
  updateSchedule: true,        // ✅ Update jadwal
  uploadDeliverables: true,    // ✅ Upload file master
  markAsDelivered: true,       // ✅ Mark sebagai delivered
  viewClientDownloads: true    // ✅ Track siapa download apa
}
```

---

#### **H. Advanced Features** ⭐

##### **1. Automatic Notification System** 🔔

Tim Produksi dapat mengkonfigurasi notifikasi otomatis untuk berbagai event penting:

```typescript
notifications: {
  // Manual notifications
  send: true,                   // ✅ Kirim notifikasi manual
  manage: true,                 // ✅ Manage notification settings
  viewAll: true,                // ✅ Lihat semua notification log

  // AUTOMATIC TRIGGERS
  automaticTriggers: {
    milestoneReminder: {
      enabled: true,            // ✅ Reminder milestone mendekati deadline
      triggerBefore: [7, 3, 1], // H-7, H-3, H-1
      recipients: ["TIM_PRODUKSI", "PROJECT_MANAGER"],
      channels: ["EMAIL", "IN_APP"]
    },

    milestoneOverdue: {
      enabled: true,            // ✅ Alert saat milestone terlambat
      triggerAfter: 0,          // Setelah deadline terlewat
      recipients: ["TIM_PRODUKSI", "PROJECT_MANAGER"],
      channels: ["EMAIL", "IN_APP"],
      priority: "URGENT"
    },

    deliveryReminder: {
      enabled: true,            // ✅ Reminder H-7 delivery
      triggerBefore: [7, 3],    // H-7, H-3
      recipients: ["TIM_PRODUKSI", "BROADCASTER"],
      channels: ["EMAIL"]
    },

    paymentDue: {
      enabled: true,            // ✅ Alert pembayaran tim jatuh tempo
      triggerBefore: [7, 3, 1], // H-7, H-3, H-1
      recipients: ["FINANCE_TEAM", "PROJECT_MANAGER"],
      channels: ["EMAIL", "IN_APP"]
    },

    budgetExceeded: {
      enabled: true,            // ✅ Warning saat expense > threshold
      thresholds: [90, 95, 100], // 90%, 95%, 100% budget
      recipients: ["TIM_PRODUKSI", "FINANCE_TEAM"],
      channels: ["EMAIL", "IN_APP"],
      priority: "HIGH"
    },

    episodeStatusChange: {
      enabled: true,            // ✅ Notif saat episode berubah status
      statuses: ["EDITING_COMPLETE", "MASTER_READY", "DELIVERED"],
      recipients: ["TIM_PRODUKSI", "BROADCASTER"],
      channels: ["IN_APP"]
    }
  },

  // Notification Channels
  notificationChannels: {
    inApp: true,                // ✅ In-app notification (real-time)
    email: true,                // ✅ Email notification
    webhook: false,             // 🚧 Future: Webhook integration
    sms: false                  // 🚧 Future: SMS notification
  },

  // Recipient Management
  recipientRules: {
    canSetRecipients: true,     // ✅ Set siapa terima notifikasi
    canConfigureRules: true,    // ✅ Konfigurasi rule per project
    canSetPriority: true,       // ✅ Set priority level
    canMuteNotifications: true  // ✅ Mute notification sementara
  }
}
```

**Notification Configuration Example**:

```typescript
// Example: Configure milestone reminder untuk project tertentu
{
  projectId: "proj_123",
  notificationRule: {
    type: "MILESTONE_REMINDER",
    enabled: true,
    triggerBefore: 3,           // 3 hari sebelum deadline
    recipients: [
      "user_001",               // Project Manager
      "user_002"                // Producer
    ],
    customMessage: "Milestone {milestone_name} akan jatuh tempo dalam {days} hari. Status: {progress}%"
  }
}
```

**Notification Dashboard**:

- View all active notifications
- Configure triggers per project
- View notification history
- Export notification reports

---

##### **2. Automated Reports** 📊

Tim Produksi dapat menjadwalkan laporan otomatis dengan berbagai frekuensi:

```typescript
reports: {
  // Manual reports
  generate: true,               // ✅ Generate custom reports
  export: true,                 // ✅ Export ke PDF/Excel
  schedule: true,               // ✅ Schedule automatic reports
  viewAuditLog: true,           // ✅ Lihat audit trail

  // AUTOMATIC REPORTS
  automaticReports: {
    daily: {
      enabled: true,            // ✅ Laporan harian
      schedule: "08:00 WIB",    // Jam kirim (setiap hari)
      timezone: "Asia/Jakarta",

      content: {
        taskCompletion: true,    // Task yang selesai hari ini
        expensesToday: true,     // Expense yang diinput hari ini
        milestoneProgress: true, // Progress milestone aktif
        episodeUpdates: true     // Update status episode
      },

      recipients: ["TIM_PRODUKSI"],
      format: "EMAIL_SUMMARY",   // Email summary (bukan PDF)
      priority: "LOW"
    },

    weekly: {
      enabled: true,            // ✅ Laporan mingguan
      schedule: "MON 09:00 WIB", // Senin pagi
      timezone: "Asia/Jakarta",

      content: {
        projectSummary: true,     // Summary progress semua project
        budgetVsExpense: true,    // Financial summary
        upcomingMilestones: true, // Milestone minggu depan
        overdueTasks: true,       // Task yang terlambat
        episodeStatus: true,      // Status semua episode
        deliverySchedule: true,   // Jadwal delivery minggu depan
        teamProductivity: true    // Produktivitas tim (optional)
      },

      recipients: ["TIM_PRODUKSI", "PROJECT_MANAGER"],
      format: "PDF",             // PDF attachment
      priority: "MEDIUM",

      includeCharts: true,       // Include visualisasi chart
      compareLastWeek: true      // Bandingkan dengan minggu lalu
    },

    monthly: {
      enabled: true,            // ✅ Laporan bulanan
      schedule: "1st 10:00 WIB", // Tanggal 1 setiap bulan
      timezone: "Asia/Jakarta",

      content: {
        financialReport: true,    // Laporan keuangan lengkap
        projectStatusAll: true,   // Status semua project
        budgetAnalysis: true,     // Analisis budget vs actual
        teamProductivity: true,   // Produktivitas tim
        milestoneAchievement: true, // Pencapaian milestone
        deliveryTracking: true,   // Tracking delivery ke client
        paymentSchedule: true,    // Jadwal pembayaran bulan depan
        revenueProjection: true   // Proyeksi pendapatan
      },

      recipients: ["TIM_PRODUKSI", "MANAGEMENT", "FINANCE_TEAM"],
      format: "PDF_AND_EXCEL",   // PDF untuk overview, Excel untuk detail
      priority: "HIGH",

      includeCharts: true,       // Include visualisasi chart
      includeAnalysis: true,     // Include analisis & insight
      compareLastMonth: true,    // Bandingkan dengan bulan lalu
      compareYTD: true           // Year-to-date comparison
    },

    custom: {
      canCreateSchedule: true,   // ✅ Buat schedule custom
      availableFrequencies: [
        "DAILY",
        "WEEKLY",
        "BIWEEKLY",
        "MONTHLY",
        "QUARTERLY",
        "CUSTOM_INTERVAL"
      ],
      maxSchedules: 10           // Max 10 scheduled reports per user
    }
  },

  // Report Templates
  reportTemplates: {
    available: [
      "project_status",          // Status overview project
      "financial_overview",      // Financial summary
      "episode_tracker",         // Tracking episode production
      "payment_schedule",        // Jadwal pembayaran tim
      "delivery_tracker",        // Tracking delivery ke client
      "budget_analysis",         // Analisis budget vs expense
      "milestone_completion",    // Laporan completion milestone
      "team_productivity"        // Produktivitas tim
    ],

    canCustomize: true,          // ✅ Customize template
    canSaveAsTemplate: true,     // ✅ Save custom report sebagai template
    canShareTemplate: true       // ✅ Share template dengan tim
  },

  // Export Options
  exportFormats: {
    pdf: true,                   // ✅ Export to PDF
    excel: true,                 // ✅ Export to Excel
    csv: true,                   // ✅ Export to CSV
    json: false                  // ❌ JSON (untuk developer only)
  }
}
```

**Report Schedule Example**:

```typescript
// Example: Custom weekly report untuk specific project
{
  reportName: "Project Alpha - Weekly Progress",
  projectId: "proj_123",
  frequency: "WEEKLY",
  schedule: "FRI 16:00 WIB",    // Jumat sore (weekly review)

  content: [
    "milestone_progress",
    "budget_status",
    "upcoming_deliverables"
  ],

  recipients: [
    "project_manager@company.com",
    "producer@company.com"
  ],

  format: "PDF",
  autoSend: true
}
```

---

##### **3. Budget Allocation Management** 💰

Tim Produksi dapat mengalokasikan budget ke berbagai kategori dan melacak spending per kategori:

```typescript
financials: {
  // ... existing code ...

  // BUDGET ALLOCATION
  budgetAllocation: {
    viewCategories: true,        // ✅ Lihat kategori budget
    editAllocation: true,        // ✅ Edit alokasi per kategori
    reallocateBudget: true,      // ✅ Realokasi antar kategori

    // Budget Categories
    categories: {
      PRODUCTION_COST: {
        label: "Biaya Produksi",
        description: "Shooting, equipment, location",
        defaultPercentage: 40,    // 40% dari total budget
        subcategories: [
          {
            id: "equipment_rental",
            label: "Sewa Equipment",
            description: "Camera, lighting, audio equipment"
          },
          {
            id: "location_fees",
            label: "Biaya Lokasi",
            description: "Sewa lokasi shooting"
          },
          {
            id: "props_costumes",
            label: "Props & Kostum",
            description: "Properti dan kostum produksi"
          }
        ]
      },

      TEAM_PAYMENT: {
        label: "Honor & Gaji Tim",
        description: "Pembayaran untuk tim produksi",
        defaultPercentage: 35,    // 35% dari total budget
        subcategories: [
          {
            id: "director_producer",
            label: "Director & Producer",
            description: "Honor sutradara dan producer"
          },
          {
            id: "crew",
            label: "Crew",
            description: "Kameramen, lighting, audio, dll"
          },
          {
            id: "talent",
            label: "Talent/Actor",
            description: "Honor talent dan aktor"
          }
        ]
      },

      POST_PRODUCTION: {
        label: "Post Production",
        description: "Editing, color grading, mixing",
        defaultPercentage: 15,    // 15% dari total budget
        subcategories: [
          {
            id: "editing",
            label: "Editing",
            description: "Video editing"
          },
          {
            id: "color_grading",
            label: "Color Grading",
            description: "Color correction & grading"
          },
          {
            id: "sound_mixing",
            label: "Sound Mixing",
            description: "Audio mixing & mastering"
          }
        ]
      },

      OPERATIONAL: {
        label: "Operasional",
        description: "Transport, meals, accommodation",
        defaultPercentage: 5,     // 5% dari total budget
        subcategories: [
          {
            id: "transport",
            label: "Transport",
            description: "Transportasi tim"
          },
          {
            id: "meals",
            label: "Konsumsi",
            description: "Makan & minum"
          },
          {
            id: "accommodation",
            label: "Akomodasi",
            description: "Hotel/penginapan"
          }
        ]
      },

      CONTINGENCY: {
        label: "Dana Cadangan",
        description: "Buffer untuk unexpected cost",
        defaultPercentage: 5,     // 5% buffer
        subcategories: []         // No subcategories
      }
    },

    // Tracking & Alerts
    tracking: {
      viewPerCategory: true,      // ✅ Lihat spending per kategori
      viewPerSubcategory: true,   // ✅ Lihat spending per subkategori

      alerts: {
        threshold90: true,        // Alert saat kategori mencapai 90%
        threshold95: true,        // Alert saat kategori mencapai 95%
        threshold100: true,       // Alert saat kategori mencapai 100%
        overBudget: true          // Alert saat over budget
      },

      visualization: {
        pieChart: true,           // Pie chart budget allocation
        barChart: true,           // Bar chart spending comparison
        trendLine: true,          // Trend line spending over time
        heatmap: true             // Heatmap kategori over/under budget
      }
    },

    // Reallocation
    reallocation: {
      enabled: true,              // ✅ Izinkan realokasi
      requiresApproval: true,     // Perlu approval untuk realokasi > 10%
      maxReallocation: 20,        // Max 20% dari kategori asal
      logChanges: true,           // Log semua perubahan alokasi
      reason: "REQUIRED"          // Harus ada alasan realokasi
    }
  }
}
```

**Budget Allocation Example**:

```typescript
// Example: Budget allocation untuk project dengan total 1 Miliar
{
  projectId: "proj_123",
  totalBudget: 1000000000,      // Rp 1 Miliar

  allocation: {
    PRODUCTION_COST: {
      allocated: 400000000,      // Rp 400 Juta (40%)
      spent: 350000000,          // Rp 350 Juta (87.5% of allocated)
      remaining: 50000000,       // Rp 50 Juta
      percentage: 87.5,
      status: "NORMAL"           // NORMAL | WARNING | CRITICAL
    },

    TEAM_PAYMENT: {
      allocated: 350000000,      // Rp 350 Juta (35%)
      spent: 320000000,          // Rp 320 Juta (91.4%)
      remaining: 30000000,       // Rp 30 Juta
      percentage: 91.4,
      status: "WARNING"          // 🟡 Warning karena > 90%
    },

    POST_PRODUCTION: {
      allocated: 150000000,      // Rp 150 Juta (15%)
      spent: 50000000,           // Rp 50 Juta (33.3%)
      remaining: 100000000,      // Rp 100 Juta
      percentage: 33.3,
      status: "NORMAL"
    },

    OPERATIONAL: {
      allocated: 50000000,       // Rp 50 Juta (5%)
      spent: 48000000,           // Rp 48 Juta (96%)
      remaining: 2000000,        // Rp 2 Juta
      percentage: 96,
      status: "CRITICAL"         // 🔴 Critical karena > 95%
    },

    CONTINGENCY: {
      allocated: 50000000,       // Rp 50 Juta (5%)
      spent: 0,                  // Belum terpakai
      remaining: 50000000,
      percentage: 0,
      status: "NORMAL"
    }
  }
}
```

---

##### **4. Payment Schedule Management** 📅

Tim Produksi dapat mengelola jadwal pembayaran tim dengan reminder otomatis:

```typescript
financials: {
  // ... existing code ...

  // PAYMENT SCHEDULE
  teamPayments: {
    // ... existing code (viewTeamPayments, addTeamPayment, etc) ...

    // SCHEDULING & REMINDERS
    scheduling: {
      setDueDate: true,           // ✅ Set tanggal jatuh tempo
      viewPaymentCalendar: true,  // ✅ Calendar view pembayaran
      bulkSchedule: true,         // ✅ Schedule multiple payments sekaligus

      // Reminder System
      paymentReminder: {
        enabled: true,            // ✅ Reminder otomatis
        reminderDays: {
          first: 7,               // H-7: Reminder pertama
          second: 3,              // H-3: Reminder kedua
          urgent: 1,              // H-1: Reminder urgent
          overdue: 0              // H+1: Alert overdue
        },

        notificationSettings: {
          notifyFinanceTeam: true, // Notif ke tim finance
          notifyPM: true,         // Notif ke project manager
          notifyAccounting: false, // Optional: notif ke accounting

          channels: ["EMAIL", "IN_APP"],
          urgentChannels: ["EMAIL", "IN_APP", "PUSH"] // Untuk H-1 & overdue
        }
      }
    },

    // Payment Tracking
    paymentTracking: {
      markAsPaid: true,           // ✅ Tandai sudah dibayar
      setPaidDate: true,          // ✅ Set tanggal dibayar
      uploadReceipt: true,        // ✅ Upload bukti transfer
      addNotes: true,             // ✅ Tambah catatan

      // Payment History
      viewHistory: true,          // ✅ Riwayat pembayaran
      filterByStatus: true,       // Filter: PENDING, PAID, OVERDUE
      filterByPerson: true,       // Filter by team member
      filterByDate: true,         // Filter by date range

      // Export & Reporting
      exportReport: true,         // ✅ Export payment report
      generateReceipt: true,      // ✅ Generate bukti pembayaran
      downloadReceipt: true,      // ✅ Download receipt PDF

      formats: ["PDF", "EXCEL"]   // Export format
    },

    // Payment Analytics
    analytics: {
      viewTotalPending: true,     // Total pembayaran pending
      viewTotalPaid: true,        // Total sudah dibayar
      viewOverdue: true,          // Total overdue
      viewUpcoming: true,         // Upcoming dalam 30 hari

      // Charts
      paymentTimeline: true,      // Timeline pembayaran
      paymentByCategory: true,    // Breakdown by category (honor/gaji)
      paymentByPerson: true,      // Breakdown per person
      cashflowProjection: true    // Proyeksi cashflow
    }
  }
}
```

**Payment Schedule Example**:

```typescript
// Example: Schedule pembayaran honor untuk tim
{
  projectId: "proj_123",
  payments: [
    {
      id: "pay_001",
      memberName: "John Doe",
      role: "Director",
      type: "HONOR",
      amount: 20000000,          // Rp 20 Juta
      dueDate: "2026-01-15",     // Due date
      status: "PENDING",         // PENDING | PAID | OVERDUE

      reminders: {
        sent: [
          {
            type: "FIRST_REMINDER",
            sentAt: "2026-01-08",  // H-7
            status: "SENT"
          }
        ],
        upcoming: [
          {
            type: "SECOND_REMINDER",
            scheduledAt: "2026-01-12" // H-3
          },
          {
            type: "URGENT_REMINDER",
            scheduledAt: "2026-01-14" // H-1
          }
        ]
      }
    },

    {
      id: "pay_002",
      memberName: "Jane Smith",
      role: "Producer",
      type: "HONOR",
      amount: 15000000,          // Rp 15 Juta
      dueDate: "2026-01-05",     // Sudah lewat
      status: "OVERDUE",         // 🔴 OVERDUE

      overdueDetails: {
        overdueSince: "2026-01-06",
        overdueDays: 3,
        alertsSent: 5
      }
    },

    {
      id: "pay_003",
      memberName: "Bob Wilson",
      role: "Editor",
      type: "HONOR",
      amount: 10000000,          // Rp 10 Juta
      dueDate: "2025-12-30",
      status: "PAID",            // ✅ PAID

      paidDetails: {
        paidAt: "2025-12-29",
        paidBy: "user_finance_001",
        receipt: "receipt_003.pdf",
        notes: "Dibayar via transfer BCA"
      }
    }
  ]
}
```

**Payment Calendar View**:

```
JANUARI 2026
┌─────────────────────────────────────────┐
│  5 Jan: Jane Smith - Rp 15 Jt 🔴 OVERDUE│
│ 15 Jan: John Doe - Rp 20 Jt ⏳ PENDING  │
│ 20 Jan: Alice Brown - Rp 12 Jt ⏳ PENDING│
│ 25 Jan: Charlie Lee - Rp 8 Jt ⏳ PENDING │
└─────────────────────────────────────────┘

Total Pending: Rp 55 Juta
Total Overdue: Rp 15 Juta 🔴
```

---

##### **5. Data Isolation (Row Level Security)** 🔒

Implementasi security di database level untuk memastikan isolasi data yang ketat:

```typescript
security: {
  // Database Level Security (Supabase RLS)
  rowLevelSecurity: {
    enabled: true,               // ✅ RLS enabled untuk semua tabel sensitif

    policies: {
      // Projects
      projects: [
        "tim_produksi_full_access",    // Tim Produksi: full access
        "broadcaster_own_projects",    // Broadcaster: own projects only
        "investor_summary_access"      // Investor: all projects (summary)
      ],

      // Milestones
      milestones: [
        "tim_produksi_all_milestones",
        "milestone_visibility_filter"  // Filter by visibleToClient/Investor
      ],

      // Episodes
      episodes: [
        "tim_produksi_full_access",
        "broadcaster_episode_view",
        "investor_no_access"           // Investor TIDAK bisa akses episodes
      ],

      // Team Payments (CRITICAL)
      team_payments: [
        "team_payments_tim_only"       // ONLY Tim Produksi
      ],

      // Financial Records
      financial_records: [
        "tim_produksi_full_access",
        "investor_percentage_only"     // Investor hanya lihat %
      ]
    },

    // Policy Details documented in Section 8
    policyDocumentation: "See Section 8.B for complete SQL policies"
  },

  // Application Level Security
  applicationSecurity: {
    middleware: true,              // Route-level protection
    apiValidation: true,           // API parameter validation
    componentGuards: true,         // Component-level authorization
    queryFiltering: true           // Database query filtering
  },

  // Audit & Monitoring
  auditLogging: {
    logAllAccess: true,            // Log semua access attempts
    logFailedAuth: true,           // Log failed authorization
    logDataChanges: true,          // Log data modifications
    retentionDays: 90              // Keep logs for 90 days
  }
}
```

**Security Implementation**: Lihat Section 8 untuk detail lengkap implementasi RLS policies dan middleware authorization.

---

### **Dashboard Tim Produksi**

**Widgets**:

1. **Overview Cards**:

   - Total Projects (Active/Completed)
   - Total Budget Allocated
   - Total Expenses (% of budget)
   - Pending Payments (internal)

2. **Project List**:

   - All projects dengan status
   - Filter by: Status, Broadcaster, Type
   - Quick actions: Edit, View, Archive

3. **Task Calendar**:

   - Upcoming milestones
   - Shooting schedules
   - Delivery deadlines
   - Payment due dates

4. **Financial Summary**:

   - Budget vs Expense chart
   - Expense trend (monthly)
   - Pending team payments
   - Account receivable status

5. **Recent Activity**:
   - Latest updates across all projects
   - Team member activities
   - Client interactions

---

## 4. 📺 **ROLE: BROADCASTER/CLIENT**

### **Identitas Role**

```typescript
{
  roleId: "BROADCASTER",
  displayName: "Broadcaster/Client",
  level: "VIEWER",
  description: "Klien yang memesan produksi, akses terbatas ke proyek mereka"
}
```

---

### **Permissions Lengkap**

#### **A. Project Access** 📁

```typescript
projects: {
  create: false,       // ❌ Tidak bisa buat proyek
  read: true,          // ✅ HANYA proyek mereka
  update: false,       // ❌ Tidak bisa edit
  delete: false,       // ❌ Tidak bisa hapus

  scope: "OWN_ONLY",   // HANYA proyek dengan broadcasterId = user.id
  filters: {
    broadcasterId: "currentUserId"
  }
}
```

**Data Access Logic**:

```typescript
// Query projects untuk broadcaster
const projects = await prisma.project.findMany({
  where: {
    broadcasterId: session.user.id, // Filter by own ID
  },
});
```

---

#### **B. Milestone Viewing** 🎯

```typescript
milestones: {
  create: false,       // ❌ Tidak bisa buat
  read: true,          // ✅ Lihat (yang visible saja)
  update: false,       // ❌ Tidak bisa update
  delete: false,       // ❌ Tidak bisa hapus

  visibility: {
    onlyPublic: true   // ✅ HANYA milestone dengan visibleToClient: true
  }
}
```

**Data Filtering**:

```typescript
// Query milestones untuk broadcaster
const milestones = await prisma.milestone.findMany({
  where: {
    project: {
      broadcasterId: session.user.id,
    },
    visibleToClient: true, // Filter: hanya yang public
  },
});
```

**Example - Apa yang Terlihat**:

```typescript
// ✅ VISIBLE (visibleToClient: true)
-"Master Episode 1 Ready" -
  "Shooting Complete" -
  "Final Review Approved" -
  // ❌ HIDDEN (visibleToClient: false)
  "Script Revision Round 3" -
  "Internal Budget Review" -
  "Crew Payment Processing";
```

---

#### **C. Episode Status** 🎬

```typescript
episodes: {
  create: false,       // ❌ Tidak bisa buat
  read: true,          // ✅ Lihat status episode
  update: false,       // ❌ Tidak bisa update
  delete: false,       // ❌ Tidak bisa hapus

  viewDetails: {
    episodeNumber: true,      // ✅ Nomor episode
    title: true,              // ✅ Judul episode
    status: true,             // ✅ Status (Editing/Shooting/Ready)
    phaseTracking: true,      // ✅ Progress per phase
    deliveryDate: true        // ✅ Tanggal penyerahan
  }
}
```

**Episode View Example**:

```typescript
// Broadcaster lihat:
{
  episodeNumber: 1,
  title: "Pilot Episode",
  status: "MASTER_SIAP_KIRIM",

  // Phase progress (visual indicator)
  preProduction: true,    // ✅ Done
  shooting: true,         // ✅ Done
  editing: true,          // ✅ Done
  masterReady: true,      // ✅ Done
  delivered: false,       // ⏳ Pending

  deliveryDate: "2026-01-15"
}
```

---

#### **D. Production Status** 📊

```typescript
production: {
  viewOverallStatus: true,     // ✅ Pre/Production/Post
  viewProgress: true,          // ✅ Overall progress %
  viewTimeline: false,         // ❌ Detail timeline internal

  statusLevels: {
    preProduction: true,       // ✅ Status level 1
    production: true,          // ✅ Status level 2
    postProduction: true,      // ✅ Status level 3
    detailedTasks: false       // ❌ Internal tasks
  }
}
```

**Status Display**:

```
Current Status: Production (60% complete)

Timeline:
✅ Pre-Production (Completed)
🔄 Production (In Progress)
⏳ Post-Production (Not Started)
```

---

#### **E. Financial Access** 💰

```typescript
financials: {
  viewBudget: false,             // ❌ Tidak lihat budget
  viewExpenses: false,           // ❌ Tidak lihat expense
  viewIncome: false,             // ❌ Tidak lihat income
  viewTeamPayments: false,       // ❌ TIDAK lihat pembayaran tim
  viewDetailedExpenses: false,   // ❌ Tidak lihat breakdown

  // ZERO financial visibility
  message: "Financial data is confidential and managed by production team"
}
```

**Rationale**:

- Broadcaster adalah klien yang membayar untuk deliverables
- Mereka tidak perlu tahu internal cost structure
- Budget management adalah tanggung jawab Tim Produksi
- Fokus broadcaster: **Delivery & Quality**, bukan **Internal Cost**

---

#### **F. Delivery & Downloads** 📦

```typescript
delivery: {
  viewSchedule: true,          // ✅ Lihat jadwal penyerahan
  downloadFiles: true,         // ✅ Download file yang delivered
  requestRevision: true,       // ✅ (Future) Request revisi

  uploadAccess: false,         // ❌ Tidak bisa upload
  editSchedule: false,         // ❌ Tidak bisa edit jadwal

  notifications: {
    onDelivery: true,          // ✅ Notif saat ada delivery baru
    onUpdate: true             // ✅ Notif saat status update
  }
}
```

**Delivery View Example**:

```typescript
// Broadcaster lihat delivery schedule
[
  {
    deliverable: "Master Episode 1",
    dueDate: "2026-01-10",
    status: "DELIVERED",
    deliveredDate: "2026-01-09",
    fileUrl: "https://storage.../master-ep1.mp4", // ✅ Can download
    downloadCount: 3,
  },
  {
    deliverable: "Master Episode 2",
    dueDate: "2026-01-15",
    status: "PENDING",
    fileUrl: null, // ⏳ Not yet available
  },
];
```

---

### **Dashboard Broadcaster/Client**

**Widgets**:

1. **My Projects**:

   - List proyek mereka
   - Status per proyek
   - Next milestone

2. **Episode Progress** (untuk series):

   - Grid view episode status
   - Visual progress indicator
   - Delivery countdown

3. **Delivery Schedule**:

   - Upcoming deliveries
   - Overdue items (if any)
   - Download delivered files

4. **Recent Updates**:

   - Latest milestone completions
   - Status changes
   - Team announcements

5. **Contact/Support**:
   - Contact production team
   - Request information
   - Submit feedback

---

## 5. 💼 **ROLE: INVESTOR**

### **Identitas Role**

```typescript
{
  roleId: "INVESTOR",
  displayName: "Investor/Stakeholder",
  level: "STAKEHOLDER",
  description: "Investor yang memantau kesehatan finansial & progress proyek"
}
```

---

### **Permissions Lengkap**

#### **A. Project Access** 📁

```typescript
projects: {
  create: false,       // ❌ Tidak bisa buat proyek
  read: true,          // ✅ Lihat semua proyek (summary)
  update: false,       // ❌ Tidak bisa edit
  delete: false,       // ❌ Tidak bisa hapus

  scope: "ALL",        // Semua proyek (high-level)
  dataLevel: "SUMMARY" // Hanya data summary, bukan detail
}
```

**Data yang Terlihat**:

```typescript
// Investor lihat:
{
  id: "proj_123",
  title: "Web Series: Journey",
  type: "SERIES",
  status: "PRODUCTION",
  overallProgress: 65,  // ✅ Progress percentage

  // Financial summary (PERCENTAGE ONLY)
  budget: 1000000000,              // ✅ Total budget
  totalExpense: 650000000,         // ❌ HIDDEN (show % instead)
  expensePercentage: 65,           // ✅ 65% of budget spent

  totalIncome: 800000000,          // ❌ HIDDEN (show % instead)
  accountReceivable: 200000000,    // ❌ HIDDEN (show % instead)
  incomePercentage: 80,            // ✅ 80% income received

  // NO DETAIL breakdown
}
```

---

#### **B. Financial Access** 💰

```typescript
financials: {
  // Budget
  viewBudget: true,              // ✅ Total budget
  viewBudgetBreakdown: false,    // ❌ Tidak lihat per kategori

  // Expenses
  viewExpensePercentage: true,   // ✅ % expense vs budget
  viewExpenseAmount: false,      // ❌ Nominal dihide, show % saja
  viewDetailedExpenses: false,   // ❌ Tidak lihat detail transaksi
  viewTeamPayments: false,       // ❌ TIDAK lihat pembayaran tim

  // Income
  viewIncomePercentage: true,    // ✅ % income received
  viewIncomeAmount: false,       // ❌ Nominal dihide
  viewAccountReceivable: true,   // ✅ BUT percentage only

  // Display format
  displayFormat: "PERCENTAGE",   // Show percentages, bukan nominal

  charts: {
    budgetVsExpense: true,       // ✅ Chart % spent vs available
    incomeVsReceivable: true,    // ✅ Chart % received vs pending
    trendOverTime: true          // ✅ Trend chart (monthly %)
  }
}
```

**Financial Dashboard untuk Investor**:

```
┌─────────────────────────────────────────┐
│  Budget Utilization                     │
│                                         │
│  [████████████░░░░░░░] 65%             │
│                                         │
│  Rp 1,000,000,000 Total Budget         │
│  Rp ███████████ Spent (65%)            │  ← Amount hidden
│  Rp ███████████ Remaining (35%)        │  ← Amount hidden
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Income Status                          │
│                                         │
│  [████████████████░░░] 80%             │
│                                         │
│  80% Received                          │
│  20% Pending (Piutang)                 │
└─────────────────────────────────────────┘
```

**Rationale**:

- Investor peduli dengan **ROI & financial health**
- Mereka tidak perlu detail operasional (siapa dibayar berapa)
- **Percentage-based view** cukup untuk monitor performance
- Proteksi privacy tim internal

---

#### **C. Progress Tracking** 📊

```typescript
progress: {
  viewOverallProgress: true,     // ✅ Overall % completion
  viewMilestones: true,          // ✅ High-level milestones
  viewDetailedTasks: false,      // ❌ Task-level detail

  milestoneVisibility: {
    onlyPublic: true,            // ✅ Hanya yang visibleToInvestor: true
    internalHidden: true         // Internal milestones hidden
  },

  charts: {
    progressOverTime: true,      // ✅ Progress trend chart
    milestoneCompletion: true,   // ✅ Milestone completion rate
    deliveryTimeline: false      // ❌ Delivery schedule hidden
  }
}
```

**Progress View Example**:

```typescript
// Investor lihat:
{
  projectId: "proj_123",
  title: "Web Series: Journey",
  overallProgress: 65,  // ✅ 65% complete

  // Public milestones only
  milestones: [
    {
      name: "Pre-Production Complete",
      status: "COMPLETED",
      completedDate: "2025-12-01"
    },
    {
      name: "Shooting Complete",
      status: "IN_PROGRESS",
      expectedCompletion: "2026-01-20"
    },
    {
      name: "Post-Production Complete",
      status: "PENDING"
    }
  ],

  // NO detail tentang:
  // - Individual episode status
  // - Day-to-day tasks
  // - Team assignments
  // - Internal deadlines
}
```

---

#### **D. Restricted Access** 🚫

```typescript
restricted: {
  episodes: false,          // ❌ Tidak lihat episode detail
  teamPayments: false,      // ❌ Tidak lihat pembayaran tim
  deliverySchedule: false,  // ❌ Tidak lihat delivery schedule
  clientInteractions: false,// ❌ Tidak lihat komunikasi client
  internalNotes: false,     // ❌ Tidak lihat catatan internal

  userManagement: false,    // ❌ Tidak manage users
  projectCRUD: false        // ❌ Tidak CRUD projects
}
```

---

### **Dashboard Investor**

**Widgets**:

1. **Portfolio Overview**:

   - Total projects invested
   - Overall financial health score
   - Average project progress

2. **Financial Summary**:

   - Total budget across projects
   - Expense percentage (aggregate)
   - Income percentage (aggregate)
   - Trend chart (last 6 months)

3. **Project List** (High-level):

   - Project name
   - Overall progress %
   - Budget utilization %
   - Status indicator

4. **Risk Indicators**:

   - Projects over budget (if expense > 100%)
   - Projects behind schedule
   - Low income percentage (piutang tinggi)

5. **Reports**:
   - Monthly financial report
   - Quarterly progress report
   - Export to PDF

---

## 6. 📊 **PERMISSION MATRIX**

### **Complete Permission Table**

| Permission             | Tim Produksi | Broadcaster   | Investor     |
| ---------------------- | ------------ | ------------- | ------------ |
| **PROJECTS**           |              |               |              |
| Create Project         | ✅           | ❌            | ❌           |
| View All Projects      | ✅           | ❌ (Own only) | ✅ (Summary) |
| Edit Project           | ✅           | ❌            | ❌           |
| Delete Project         | ✅           | ❌            | ❌           |
| **MILESTONES**         |              |               |              |
| Create Milestone       | ✅           | ❌            | ❌           |
| View Milestone         | ✅ (All)     | ✅ (Public)   | ✅ (Public)  |
| Edit Milestone         | ✅           | ❌            | ❌           |
| Delete Milestone       | ✅           | ❌            | ❌           |
| **EPISODES**           |              |               |              |
| Create Episode         | ✅           | ❌            | ❌           |
| View Episode Status    | ✅           | ✅            | ❌           |
| Edit Episode           | ✅           | ❌            | ❌           |
| Delete Episode         | ✅           | ❌            | ❌           |
| **FINANCIAL**          |              |               |              |
| View Total Budget      | ✅           | ❌            | ✅           |
| View Expense Amount    | ✅           | ❌            | ❌           |
| View Expense %         | ✅           | ❌            | ✅           |
| View Team Payments     | ✅           | ❌            | ❌           |
| View Income Amount     | ✅           | ❌            | ❌           |
| View Income %          | ✅           | ❌            | ✅           |
| Edit Budget            | ✅           | ❌            | ❌           |
| Add Expense            | ✅           | ❌            | ❌           |
| **DELIVERY**           |              |               |              |
| Create Delivery        | ✅           | ❌            | ❌           |
| View Delivery Schedule | ✅           | ✅            | ❌           |
| Upload Files           | ✅           | ❌            | ❌           |
| Download Files         | ✅           | ✅            | ❌           |
| **USER MANAGEMENT**    |              |               |              |
| Create User            | ✅           | ❌            | ❌           |
| View Users             | ✅           | ❌            | ❌           |
| Edit User              | ✅           | ❌            | ❌           |
| Delete User            | ✅           | ❌            | ❌           |
| Assign Role            | ✅           | ❌            | ❌           |
| **REPORTS**            |              |               |              |
| Generate Report        | ✅           | ❌            | ❌           |
| Export Data            | ✅           | ✅ (Own)      | ✅ (Summary) |
| View Audit Log         | ✅           | ❌            | ❌           |

---

## 7. 🔒 **DATA VISIBILITY RULES**

### **Rule 1: Project Scope**

```typescript
// Tim Produksi: ALL projects
const projects = await prisma.project.findMany();

// Broadcaster: OWN projects only
const projects = await prisma.project.findMany({
  where: { broadcasterId: session.user.id },
});

// Investor: ALL projects (summary only)
const projects = await prisma.project.findMany({
  select: {
    id: true,
    title: true,
    status: true,
    overallProgress: true,
    budget: true,
    // Exclude: detailed expense, team payments
  },
});
```

---

### **Rule 2: Financial Data Filtering**

```typescript
function getFinancialData(role: Role, projectId: string) {
  if (role === "TIM_PRODUKSI") {
    // FULL access
    return {
      budget: project.budget,
      totalExpense: project.totalExpense,
      expensePercentage: (project.totalExpense / project.budget) * 100,
      teamPayments: await prisma.teamPayment.findMany({ projectId }),
      detailedExpenses: await prisma.budgetAllocation.findMany({ projectId }),
    };
  }

  if (role === "BROADCASTER") {
    // NO access
    return null; // atau throw Unauthorized error
  }

  if (role === "INVESTOR") {
    // PERCENTAGE only
    return {
      budget: project.budget,
      expensePercentage: (project.totalExpense / project.budget) * 100,
      incomePercentage:
        (project.totalIncome /
          (project.totalIncome + project.accountReceivable)) *
        100,
      // NO: teamPayments, detailedExpenses, actual amounts
    };
  }
}
```

---

### **Rule 3: Milestone Visibility**

```typescript
// Query dengan role-based filtering
async function getMilestones(projectId: string, userRole: Role) {
  const where: any = { projectId };

  if (userRole === "BROADCASTER") {
    where.visibleToClient = true; // Filter: hanya public
  }

  if (userRole === "INVESTOR") {
    where.visibleToInvestor = true; // Filter: hanya public
  }

  // Tim Produksi: no filter (lihat semua)

  return await prisma.milestone.findMany({ where });
}
```

---

### **Rule 4: Episode Access**

```typescript
// Broadcaster: Can view episodes
if (role === "BROADCASTER") {
  const episodes = await prisma.episode.findMany({
    where: {
      project: { broadcasterId: session.user.id },
    },
    select: {
      episodeNumber: true,
      title: true,
      status: true,
      preProduction: true,
      shooting: true,
      editing: true,
      masterReady: true,
      delivered: true,
      deliveryDate: true,
    },
  });
}

// Investor: NO access
if (role === "INVESTOR") {
  throw new UnauthorizedError("Investors cannot view episode details");
}
```

---

### **Rule 5: Team Payment Protection**

```typescript
// CRITICAL: Team payments ONLY for Tim Produksi
async function getTeamPayments(projectId: string, userRole: Role) {
  if (userRole !== "TIM_PRODUKSI") {
    throw new UnauthorizedError(
      "Team payments are confidential and only accessible to production team"
    );
  }

  return await prisma.teamPayment.findMany({
    where: { projectId },
  });
}
```

---

## 8. 🛠️ **IMPLEMENTATION STRATEGY**

### **A. Middleware-Based Authorization**

**File**: `src/middleware/auth.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function authMiddleware(req: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Attach user role to request
  req.user = session.user;

  return NextResponse.next();
}
```

---

### **B. Row Level Security (Database Level)** 🔐

**Implementasi RLS di Supabase untuk isolasi data di database level**

#### **1. Enable RLS pada Tabel Sensitif**

**File**: `docs/docs-fix/rls-policies.sql`

```sql
-- Enable RLS pada semua tabel yang perlu data isolation
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;

-- Pastikan tidak ada bypass RLS (Force RLS)
ALTER TABLE team_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
```

---

#### **2. Policy untuk Tim Produksi (Full Access)**

```sql
-- Tim Produksi: Full access ke semua tabel

-- Projects
CREATE POLICY "tim_produksi_full_access_projects" ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'TIM_PRODUKSI'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'TIM_PRODUKSI'
    )
  );

-- Milestones
CREATE POLICY "tim_produksi_full_access_milestones" ON milestones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'TIM_PRODUKSI'
    )
  );

-- Episodes
CREATE POLICY "tim_produksi_full_access_episodes" ON episodes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'TIM_PRODUKSI'
    )
  );

-- Team Payments (CRITICAL - ONLY Tim Produksi)
CREATE POLICY "team_payments_tim_only" ON team_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'TIM_PRODUKSI'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'TIM_PRODUKSI'
    )
  );

-- Financial Records
CREATE POLICY "tim_produksi_full_access_financials" ON financial_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'TIM_PRODUKSI'
    )
  );
```

---

#### **3. Policy untuk Broadcaster (Own Projects Only)**

```sql
-- Broadcaster: Hanya bisa akses project mereka sendiri

-- Projects: READ only, own projects
CREATE POLICY "broadcaster_own_projects" ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'BROADCASTER'
      AND projects.broadcaster_id = users.id
    )
  );

-- Milestones: READ only, visible to client
CREATE POLICY "broadcaster_visible_milestones" ON milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN projects p ON p.id = milestones.project_id
      WHERE u.id = auth.uid()
      AND u.role = 'BROADCASTER'
      AND p.broadcaster_id = u.id
      AND milestones.visible_to_client = true
    )
  );

-- Episodes: READ only, own project episodes
CREATE POLICY "broadcaster_episode_view" ON episodes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN projects p ON p.id = episodes.project_id
      WHERE u.id = auth.uid()
      AND u.role = 'BROADCASTER'
      AND p.broadcaster_id = u.id
    )
  );

-- Team Payments: NO ACCESS (default deny)
-- NO policy = cannot access

-- Expenses: NO ACCESS
-- NO policy = cannot access
```

---

#### **4. Policy untuk Investor (Summary Only)**

```sql
-- Investor: Dapat melihat semua projects (summary) tapi tidak dapat melihat detail sensitif

-- Projects: READ only, all projects (summary)
CREATE POLICY "investor_summary_access" ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'INVESTOR'
    )
  );

-- Milestones: READ only, visible to investor
CREATE POLICY "investor_visible_milestones" ON milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'INVESTOR'
      AND milestones.visible_to_investor = true
    )
  );

-- Financial Records: READ only, percentage data
-- Note: Application layer harus filter amount, hanya kirim percentage
CREATE POLICY "investor_financial_summary" ON financial_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'INVESTOR'
    )
  );

-- Episodes: NO ACCESS
-- NO policy = cannot access

-- Team Payments: NO ACCESS
-- NO policy = cannot access

-- Expenses: NO ACCESS
-- NO policy = cannot access
```

---

#### **5. Testing RLS Policies**

```sql
-- Test sebagai Tim Produksi (should see all)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-tim-produksi-id';

SELECT * FROM projects;           -- ✅ Should return all projects
SELECT * FROM team_payments;      -- ✅ Should return all payments
SELECT * FROM milestones;         -- ✅ Should return all milestones

-- Test sebagai Broadcaster (should see only own)
SET LOCAL request.jwt.claim.sub = 'user-broadcaster-id';

SELECT * FROM projects;           -- ✅ Should return only own projects
SELECT * FROM team_payments;      -- ❌ Should return 0 rows
SELECT * FROM milestones
  WHERE visible_to_client = true; -- ✅ Should return only public milestones

-- Test sebagai Investor (should see summary only)
SET LOCAL request.jwt.claim.sub = 'user-investor-id';

SELECT * FROM projects;           -- ✅ Should return all projects
SELECT * FROM episodes;           -- ❌ Should return 0 rows
SELECT * FROM team_payments;      -- ❌ Should return 0 rows
SELECT * FROM milestones
  WHERE visible_to_investor = true; -- ✅ Should return only public milestones
```

---

#### **6. RLS Helper Functions**

```sql
-- Function helper untuk check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk check project ownership
CREATE OR REPLACE FUNCTION is_project_owner(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    JOIN users u ON u.id = auth.uid()
    WHERE p.id = project_id
    AND p.broadcaster_id = u.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage dalam policy
CREATE POLICY "check_ownership" ON projects
  FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'BROADCASTER'
    AND is_project_owner(id)
  );
```

---

#### **7. Application Layer Integration**

**Prisma Client dengan RLS**:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Prisma client akan otomatis respect RLS policies
export const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

// Usage: RLS automatically applies
export async function getProjects(session: Session) {
  // RLS policy akan otomatis filter berdasarkan role
  // Tidak perlu manual where filter
  const projects = await prisma.project.findMany();

  // Tim Produksi: return all projects
  // Broadcaster: return only own projects
  // Investor: return all projects

  return projects;
}

// CRITICAL: Untuk Investor, tetap filter amount di application layer
export async function getFinancialData(projectId: string, userRole: string) {
  const financial = await prisma.financialRecord.findUnique({
    where: { projectId },
  });

  if (!financial) return null;

  // Investor: hide amount, show percentage only
  if (userRole === "INVESTOR") {
    return {
      id: financial.id,
      projectId: financial.projectId,
      totalBudget: financial.totalBudget,
      expensePercentage: financial.expensePercentage,
      incomePercentage: financial.incomePercentage,
      // HIDE sensitive amounts
      totalExpense: null,
      totalIncome: null,
      accountReceivable: null,
    };
  }

  // Tim Produksi: return full data
  return financial;
}
```

---

#### **8. RLS Monitoring & Audit**

```sql
-- Create audit table untuk track RLS violations
CREATE TABLE rls_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  blocked BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  policy_name TEXT,
  error_message TEXT
);

-- Trigger untuk log failed access attempts
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log attempt (will be implemented by application)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- View untuk monitoring RLS violations
CREATE VIEW rls_violation_summary AS
SELECT
  u.email,
  u.role,
  a.table_name,
  a.action,
  COUNT(*) as attempt_count,
  MAX(a.attempted_at) as last_attempt
FROM rls_audit_log a
JOIN users u ON u.id = a.user_id
WHERE a.blocked = true
GROUP BY u.email, u.role, a.table_name, a.action
ORDER BY attempt_count DESC;
```

---

### **C. Route Protection**

**File**: `src/lib/permissions.ts`

```typescript
export const ROUTE_PERMISSIONS = {
  "/dashboard": ["TIM_PRODUKSI", "BROADCASTER", "INVESTOR"],
  "/projects/create": ["TIM_PRODUKSI"],
  "/projects/[id]/edit": ["TIM_PRODUKSI"],
  "/projects/[id]/team-payments": ["TIM_PRODUKSI"],
  "/projects/[id]/episodes": ["TIM_PRODUKSI", "BROADCASTER"],
  "/financial-overview": ["TIM_PRODUKSI", "INVESTOR"],
  "/users": ["TIM_PRODUKSI"],
} as const;

export function canAccessRoute(userRole: string, route: string): boolean {
  const allowedRoles = ROUTE_PERMISSIONS[route];
  return allowedRoles?.includes(userRole as any) ?? false;
}
```

---

### **D. Component-Level Authorization**

**File**: `src/components/protected.tsx`

```typescript
import { useSession } from 'next-auth/react';

export function ProtectedComponent({
  children,
  requiredRole
}: {
  children: React.ReactNode;
  requiredRole: Role[]
}) {
  const { data: session } = useSession();

  if (!session) return null;

  const hasAccess = requiredRole.includes(session.user.role);

  if (!hasAccess) return null;

  return <>{children}</>;
}

// Usage examples
<ProtectedComponent requiredRole={['TIM_PRODUKSI']}>
  <Button>Edit Project</Button>
</ProtectedComponent>

<ProtectedComponent requiredRole={['TIM_PRODUKSI', 'BROADCASTER']}>
  <EpisodeList />
</ProtectedComponent>
```

**Permission Hook**:

```typescript
// src/hooks/use-permission.ts
import { useSession } from "next-auth/react";

export function usePermission() {
  const { data: session } = useSession();

  const can = (permission: string) => {
    if (!session) return false;

    const role = session.user.role;

    // Permission mapping
    const permissions = {
      create_project: ["TIM_PRODUKSI"],
      edit_project: ["TIM_PRODUKSI"],
      delete_project: ["TIM_PRODUKSI"],
      view_team_payments: ["TIM_PRODUKSI"],
      view_episodes: ["TIM_PRODUKSI", "BROADCASTER"],
      view_financial_summary: ["TIM_PRODUKSI", "INVESTOR"],
      manage_users: ["TIM_PRODUKSI"],
    };

    return permissions[permission]?.includes(role) ?? false;
  };

  return { can, role: session?.user.role };
}

// Usage in component
function ProjectActions({ projectId }) {
  const { can } = usePermission();

  return (
    <>
      {can("edit_project") && <EditButton />}
      {can("delete_project") && <DeleteButton />}
    </>
  );
}
```

---

### **E. API Route Authorization**

**File**: `src/app/api/projects/[id]/team-payments/route.ts`

```typescript
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  // Check authentication
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check authorization (CRITICAL: Team payments only for Tim Produksi)
  if (session.user.role !== "TIM_PRODUKSI") {
    return new Response(
      JSON.stringify({
        error: "Forbidden",
        message: "Team payments are only accessible to production team",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Fetch data (RLS will also apply at database level)
  const payments = await prisma.teamPayment.findMany({
    where: { projectId: params.id },
  });

  return Response.json(payments);
}
```

**Authorization Helper**:

```typescript
// src/lib/auth-helpers.ts
import { getServerSession } from "next-auth";

export async function requireAuth() {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error(
      `Forbidden: This action requires one of: ${allowedRoles.join(", ")}`
    );
  }

  return session;
}

// Usage in API route
export async function POST(req: Request) {
  // Require Tim Produksi role
  const session = await requireRole(["TIM_PRODUKSI"]);

  // Proceed with action...
  const body = await req.json();
  // ... create project ...

  return Response.json({ success: true });
}
```

---

### **F. Server Actions with Authorization**

**File**: `src/server/actions/projects.ts`

```typescript
"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function deleteProject(projectId: string) {
  // Require Tim Produksi role
  const session = await requireRole(["TIM_PRODUKSI"]);

  // Proceed with deletion
  await prisma.project.delete({
    where: { id: projectId },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE_PROJECT",
      resourceId: projectId,
      timestamp: new Date(),
    },
  });

  return { success: true };
}

export async function createMilestone(data: MilestoneInput) {
  // Require Tim Produksi role
  await requireRole(["TIM_PRODUKSI"]);

  const milestone = await prisma.milestone.create({
    data: {
      ...data,
      createdAt: new Date(),
    },
  });

  return milestone;
}

// Action yang bisa diakses multiple roles
export async function getProjectDetails(projectId: string) {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userRole = session.user.role;

  // Fetch project (RLS will filter based on role)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      milestones: {
        where:
          userRole === "BROADCASTER"
            ? { visibleToClient: true }
            : userRole === "INVESTOR"
            ? { visibleToInvestor: true }
            : {}, // Tim Produksi: no filter
      },
      episodes: userRole !== "INVESTOR", // Investor cannot see episodes
      _count: {
        select: {
          milestones: true,
          episodes: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Filter sensitive data untuk Investor
  if (userRole === "INVESTOR") {
    return {
      ...project,
      financials: {
        totalBudget: project.totalBudget,
        expensePercentage: project.expensePercentage,
        incomePercentage: project.incomePercentage,
        // Hide actual amounts
        totalExpense: null,
        totalIncome: null,
      },
    };
  }

  return project;
}
```

---

### **G. Query Filtering Helper**

**File**: `src/lib/query-filters.ts`

```typescript
import { Session } from "next-auth";

export function getProjectFilter(session: Session) {
  const role = session.user.role;

  switch (role) {
    case "TIM_PRODUKSI":
      return {}; // No filter - see all

    case "BROADCASTER":
      return {
        broadcasterId: session.user.id,
      };

    case "INVESTOR":
      return {}; // See all projects (but summary only)

    default:
      throw new Error("Invalid role");
  }
}

export function getMilestoneFilter(session: Session) {
  const role = session.user.role;

  switch (role) {
    case "TIM_PRODUKSI":
      return {}; // See all milestones

    case "BROADCASTER":
      return {
        visibleToClient: true,
      };

    case "INVESTOR":
      return {
        visibleToInvestor: true,
      };

    default:
      throw new Error("Invalid role");
  }
}

// Usage
export async function getMilestones(projectId: string, session: Session) {
  const filter = getMilestoneFilter(session);

  return await prisma.milestone.findMany({
    where: {
      projectId,
      ...filter,
    },
  });
}
```

---

### **H. Frontend Route Guards**

**File**: `src/app/(main)/projects/[id]/team-payments/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function TeamPaymentsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();

  // Redirect if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Redirect if not Tim Produksi
  if (session.user.role !== "TIM_PRODUKSI") {
    redirect("/unauthorized");
  }

  // Render page
  return <TeamPaymentsContent projectId={params.id} />;
}
```

**Middleware Protection**:

**File**: `src/middleware.ts`

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Route protection rules
    const protectedRoutes = {
      "/projects/create": ["TIM_PRODUKSI"],
      "/projects/*/edit": ["TIM_PRODUKSI"],
      "/projects/*/team-payments": ["TIM_PRODUKSI"],
      "/users": ["TIM_PRODUKSI"],
      "/financial-overview": ["TIM_PRODUKSI", "INVESTOR"],
    };

    // Check if route is protected
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      const routePattern = new RegExp(`^${route.replace("*", "[^/]+")}$`);

      if (routePattern.test(path)) {
        if (!token || !allowedRoles.includes(token.role as string)) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/users/:path*",
    "/financial-overview/:path*",
  ],
};
```

---

'use server';

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function deleteProject(projectId: string) {
const session = await getServerSession();

// Check authentication
if (!session) {
throw new Error('Unauthorized');
}

// Check authorization
if (session.user.role !== 'TIM_PRODUKSI') {
throw new Error('Forbidden: Only production team can delete projects');
}

// Proceed with deletion
await prisma.project.delete({
where: { id: projectId }
});

return { success: true };
}

```

---

## 9. 🔐 **SECURITY BEST PRACTICES**

### **1. Defense in Depth** 🛡️

Implement multiple layers of security:

```

Layer 1: Route-level protection (middleware)
↓
Layer 2: Component-level authorization (UI)
↓
Layer 3: API endpoint validation
↓
Layer 4: Database query filtering
↓
Layer 5: Audit logging

````

---

### **2. Principle of Least Privilege** 🔒

```typescript
// ❌ BAD: Give more access than needed
const user = {
  role: 'BROADCASTER',
  permissions: ['read_all_projects', 'read_all_financials'] // TOO MUCH!
};

// ✅ GOOD: Minimal necessary permissions
const user = {
  role: 'BROADCASTER',
  permissions: ['read_own_projects', 'read_episode_status']
};
````

---

### **3. Fail-Safe Defaults** ⚠️

```typescript
// ❌ BAD: Default to allowing
function canAccess(user: User, resource: string) {
  if (user.role === "TIM_PRODUKSI") return true;
  // Missing other role checks = default allow!
}

// ✅ GOOD: Default to denying
function canAccess(user: User, resource: string) {
  if (user.role === "TIM_PRODUKSI") return true;
  if (user.role === "BROADCASTER" && resource === "own_projects") return true;

  return false; // Explicit deny by default
}
```

---

### **4. Audit Logging** 📝

```typescript
// Log semua access attempts
async function logAccess(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  success: boolean;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      changes: { success: params.success },
      createdAt: new Date(),
    },
  });
}

// Usage
try {
  const project = await getProject(projectId);
  await logAccess({
    userId: session.user.id,
    action: "READ",
    resource: "Project",
    resourceId: projectId,
    success: true,
  });
} catch (error) {
  await logAccess({
    userId: session.user.id,
    action: "READ",
    resource: "Project",
    resourceId: projectId,
    success: false,
  });
  throw error;
}
```

---

### **5. Data Masking** 🎭

```typescript
// Mask sensitive data untuk non-authorized users
function maskFinancialData(data: any, userRole: Role) {
  if (userRole === "TIM_PRODUKSI") {
    return data; // Show everything
  }

  if (userRole === "INVESTOR") {
    return {
      ...data,
      totalExpense: "***MASKED***", // Hide amount
      expensePercentage: data.expensePercentage, // Show percentage
      teamPayments: undefined, // Remove entirely
    };
  }

  if (userRole === "BROADCASTER") {
    return {
      ...data,
      // Remove all financial fields
      budget: undefined,
      totalExpense: undefined,
      teamPayments: undefined,
    };
  }
}
```

---

## 10. ✅ **TESTING & VALIDATION**

### **Test Cases per Role**

#### **Tim Produksi Tests**

```typescript
describe("Tim Produksi Permissions", () => {
  it("should create new project", async () => {
    const user = { role: "TIM_PRODUKSI" };
    const result = await createProject(user, projectData);
    expect(result.success).toBe(true);
  });

  it("should view team payments", async () => {
    const user = { role: "TIM_PRODUKSI" };
    const payments = await getTeamPayments(user, projectId);
    expect(payments).toBeDefined();
    expect(payments.length).toBeGreaterThan(0);
  });

  it("should edit any project", async () => {
    const user = { role: "TIM_PRODUKSI" };
    const result = await updateProject(user, projectId, updates);
    expect(result.success).toBe(true);
  });
});
```

---

#### **Broadcaster Tests**

```typescript
describe("Broadcaster Permissions", () => {
  it("should view own projects only", async () => {
    const user = { role: "BROADCASTER", id: "user_123" };
    const projects = await getProjects(user);

    // All projects should belong to this broadcaster
    projects.forEach((p) => {
      expect(p.broadcasterId).toBe(user.id);
    });
  });

  it("should NOT view team payments", async () => {
    const user = { role: "BROADCASTER" };

    await expect(getTeamPayments(user, projectId)).rejects.toThrow("Forbidden");
  });

  it("should view episode status", async () => {
    const user = { role: "BROADCASTER", id: "user_123" };
    const episodes = await getEpisodes(user, projectId);
    expect(episodes).toBeDefined();
  });

  it("should NOT create project", async () => {
    const user = { role: "BROADCASTER" };

    await expect(createProject(user, projectData)).rejects.toThrow("Forbidden");
  });
});
```

---

#### **Investor Tests**

```typescript
describe("Investor Permissions", () => {
  it("should view financial percentages", async () => {
    const user = { role: "INVESTOR" };
    const financials = await getFinancials(user, projectId);

    expect(financials.expensePercentage).toBeDefined();
    expect(financials.incomePercentage).toBeDefined();

    // Should NOT have actual amounts
    expect(financials.totalExpense).toBeUndefined();
    expect(financials.teamPayments).toBeUndefined();
  });

  it("should NOT view episode details", async () => {
    const user = { role: "INVESTOR" };

    await expect(getEpisodes(user, projectId)).rejects.toThrow("Forbidden");
  });

  it("should view all projects (summary)", async () => {
    const user = { role: "INVESTOR" };
    const projects = await getProjects(user);

    // Should get projects but in summary format
    expect(projects).toBeDefined();
    expect(projects[0].overallProgress).toBeDefined();
    expect(projects[0].teamPayments).toBeUndefined();
  });
});
```

---

### **Security Testing Checklist**

- [ ] **Authentication Tests**

  - [ ] Unauthenticated user cannot access any protected route
  - [ ] Session expires after timeout
  - [ ] Password hashing works correctly

- [ ] **Authorization Tests**

  - [ ] Each role can only access permitted routes
  - [ ] API endpoints reject unauthorized requests
  - [ ] Database queries filter by user permissions

- [ ] **Data Isolation Tests**

  - [ ] Broadcaster cannot view other broadcaster's projects
  - [ ] Team payments not visible to non-Tim Produksi
  - [ ] Financial amounts hidden from Investor (show % only)

- [ ] **Privilege Escalation Tests**

  - [ ] Cannot change own role via API
  - [ ] Cannot bypass middleware protections
  - [ ] Cannot access resources via direct URL manipulation

- [ ] **Audit Logging Tests**
  - [ ] All access attempts logged
  - [ ] Failed authorization attempts logged
  - [ ] Audit log cannot be modified by users

---

## 📚 **REFERENSI & RESOURCES**

### **RBAC Best Practices**

- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [NIST RBAC Standard](https://csrc.nist.gov/projects/role-based-access-control)

### **Next.js Authorization**

- [NextAuth.js Role-Based Authorization](https://next-auth.js.org/getting-started/example#role-based-access-control)
- [Next.js Middleware for Auth](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### **Database Security**

- [Prisma Row-Level Security](https://www.prisma.io/docs/guides/database/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 🎯 **KESIMPULAN**

### **Key Takeaways**

1. ✅ **3 Roles dengan Clear Boundaries**:

   - Tim Produksi: Full access
   - Broadcaster: Limited to own projects, production status
   - Investor: High-level financial & progress overview

2. ✅ **Sensitive Data Protection**:

   - Team payments ONLY for Tim Produksi
   - Financial details hidden from Broadcaster
   - Percentage-based view untuk Investor

3. ✅ **Multi-Layer Security**:

   - Route-level protection
   - Component-level authorization
   - API validation
   - Database query filtering

4. ✅ **Audit Trail**:
   - All access logged
   - Failed attempts tracked
   - Compliance-ready

### **Implementation Checklist**

- [ ] Setup NextAuth with role management
- [ ] Create middleware for route protection
- [ ] Implement permission helper functions
- [ ] Add authorization to all API routes
- [ ] Create role-specific dashboards
- [ ] Implement data filtering in queries
- [ ] Add audit logging
- [ ] Write comprehensive tests
- [ ] Document security procedures
- [ ] Train team on RBAC principles

---

**Security is not a feature, it's a foundation.** 🔒

**Ready to implement? Let's build a secure system!** 🚀
