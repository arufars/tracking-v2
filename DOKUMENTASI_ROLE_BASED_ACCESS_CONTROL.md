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

| Role | Access Level | Data Scope | Write Permission |
|------|-------------|-----------|------------------|
| **Tim Produksi** | **Full** | All Projects | ✅ Yes |
| **Broadcaster** | **Limited** | Own Projects Only | ❌ No |
| **Investor** | **Summary** | All Projects (High-level) | ❌ No |

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
    broadcasterId: session.user.id  // Filter by own ID
  }
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
      broadcasterId: session.user.id
    },
    visibleToClient: true  // Filter: hanya yang public
  }
});
```

**Example - Apa yang Terlihat**:
```typescript
// ✅ VISIBLE (visibleToClient: true)
- "Master Episode 1 Ready"
- "Shooting Complete"
- "Final Review Approved"

// ❌ HIDDEN (visibleToClient: false)
- "Script Revision Round 3"
- "Internal Budget Review"
- "Crew Payment Processing"
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
    fileUrl: "https://storage.../master-ep1.mp4",  // ✅ Can download
    downloadCount: 3
  },
  {
    deliverable: "Master Episode 2",
    dueDate: "2026-01-15",
    status: "PENDING",
    fileUrl: null  // ⏳ Not yet available
  }
]
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

| Permission | Tim Produksi | Broadcaster | Investor |
|-----------|--------------|-------------|----------|
| **PROJECTS** | | | |
| Create Project | ✅ | ❌ | ❌ |
| View All Projects | ✅ | ❌ (Own only) | ✅ (Summary) |
| Edit Project | ✅ | ❌ | ❌ |
| Delete Project | ✅ | ❌ | ❌ |
| **MILESTONES** | | | |
| Create Milestone | ✅ | ❌ | ❌ |
| View Milestone | ✅ (All) | ✅ (Public) | ✅ (Public) |
| Edit Milestone | ✅ | ❌ | ❌ |
| Delete Milestone | ✅ | ❌ | ❌ |
| **EPISODES** | | | |
| Create Episode | ✅ | ❌ | ❌ |
| View Episode Status | ✅ | ✅ | ❌ |
| Edit Episode | ✅ | ❌ | ❌ |
| Delete Episode | ✅ | ❌ | ❌ |
| **FINANCIAL** | | | |
| View Total Budget | ✅ | ❌ | ✅ |
| View Expense Amount | ✅ | ❌ | ❌ |
| View Expense % | ✅ | ❌ | ✅ |
| View Team Payments | ✅ | ❌ | ❌ |
| View Income Amount | ✅ | ❌ | ❌ |
| View Income % | ✅ | ❌ | ✅ |
| Edit Budget | ✅ | ❌ | ❌ |
| Add Expense | ✅ | ❌ | ❌ |
| **DELIVERY** | | | |
| Create Delivery | ✅ | ❌ | ❌ |
| View Delivery Schedule | ✅ | ✅ | ❌ |
| Upload Files | ✅ | ❌ | ❌ |
| Download Files | ✅ | ✅ | ❌ |
| **USER MANAGEMENT** | | | |
| Create User | ✅ | ❌ | ❌ |
| View Users | ✅ | ❌ | ❌ |
| Edit User | ✅ | ❌ | ❌ |
| Delete User | ✅ | ❌ | ❌ |
| Assign Role | ✅ | ❌ | ❌ |
| **REPORTS** | | | |
| Generate Report | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ (Own) | ✅ (Summary) |
| View Audit Log | ✅ | ❌ | ❌ |

---

## 7. 🔒 **DATA VISIBILITY RULES**

### **Rule 1: Project Scope**

```typescript
// Tim Produksi: ALL projects
const projects = await prisma.project.findMany();

// Broadcaster: OWN projects only
const projects = await prisma.project.findMany({
  where: { broadcasterId: session.user.id }
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
  }
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
      detailedExpenses: await prisma.budgetAllocation.findMany({ projectId })
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
      incomePercentage: (project.totalIncome / (project.totalIncome + project.accountReceivable)) * 100,
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
    where.visibleToClient = true;  // Filter: hanya public
  }
  
  if (userRole === "INVESTOR") {
    where.visibleToInvestor = true;  // Filter: hanya public
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
      project: { broadcasterId: session.user.id }
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
      deliveryDate: true
    }
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
    where: { projectId }
  });
}
```

---

## 8. 🛠️ **IMPLEMENTATION STRATEGY**

### **A. Middleware-Based Authorization**

**File**: `src/middleware/auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function authMiddleware(req: NextRequest) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Attach user role to request
  req.user = session.user;
  
  return NextResponse.next();
}
```

---

### **B. Route Protection**

**File**: `src/lib/permissions.ts`

```typescript
export const ROUTE_PERMISSIONS = {
  '/dashboard': ['TIM_PRODUKSI', 'BROADCASTER', 'INVESTOR'],
  '/projects/create': ['TIM_PRODUKSI'],
  '/projects/[id]/edit': ['TIM_PRODUKSI'],
  '/projects/[id]/team-payments': ['TIM_PRODUKSI'],
  '/projects/[id]/episodes': ['TIM_PRODUKSI', 'BROADCASTER'],
  '/financial-overview': ['TIM_PRODUKSI', 'INVESTOR'],
  '/users': ['TIM_PRODUKSI'],
} as const;

export function canAccessRoute(userRole: string, route: string): boolean {
  const allowedRoles = ROUTE_PERMISSIONS[route];
  return allowedRoles?.includes(userRole as any) ?? false;
}
```

---

### **C. Component-Level Authorization**

```typescript
// src/components/protected.tsx
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

// Usage
<ProtectedComponent requiredRole={['TIM_PRODUKSI']}>
  <Button>Edit Project</Button>
</ProtectedComponent>
```

---

### **D. API Route Authorization**

```typescript
// src/app/api/projects/[id]/team-payments/route.ts
import { getServerSession } from 'next-auth';

export async function GET(req: Request) {
  const session = await getServerSession();
  
  // Check authentication
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Check authorization
  if (session.user.role !== 'TIM_PRODUKSI') {
    return new Response(
      'Forbidden: Team payments are only accessible to production team',
      { status: 403 }
    );
  }
  
  // Proceed with data fetch
  const payments = await prisma.teamPayment.findMany({
    where: { projectId: params.id }
  });
  
  return Response.json(payments);
}
```

---

### **E. Server Action Authorization**

```typescript
// src/server/actions/projects.ts
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
```

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
```

---

### **3. Fail-Safe Defaults** ⚠️

```typescript
// ❌ BAD: Default to allowing
function canAccess(user: User, resource: string) {
  if (user.role === 'TIM_PRODUKSI') return true;
  // Missing other role checks = default allow!
}

// ✅ GOOD: Default to denying
function canAccess(user: User, resource: string) {
  if (user.role === 'TIM_PRODUKSI') return true;
  if (user.role === 'BROADCASTER' && resource === 'own_projects') return true;
  
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
      createdAt: new Date()
    }
  });
}

// Usage
try {
  const project = await getProject(projectId);
  await logAccess({
    userId: session.user.id,
    action: 'READ',
    resource: 'Project',
    resourceId: projectId,
    success: true
  });
} catch (error) {
  await logAccess({
    userId: session.user.id,
    action: 'READ',
    resource: 'Project',
    resourceId: projectId,
    success: false
  });
  throw error;
}
```

---

### **5. Data Masking** 🎭

```typescript
// Mask sensitive data untuk non-authorized users
function maskFinancialData(data: any, userRole: Role) {
  if (userRole === 'TIM_PRODUKSI') {
    return data; // Show everything
  }
  
  if (userRole === 'INVESTOR') {
    return {
      ...data,
      totalExpense: '***MASKED***', // Hide amount
      expensePercentage: data.expensePercentage, // Show percentage
      teamPayments: undefined // Remove entirely
    };
  }
  
  if (userRole === 'BROADCASTER') {
    return {
      ...data,
      // Remove all financial fields
      budget: undefined,
      totalExpense: undefined,
      teamPayments: undefined
    };
  }
}
```

---

## 10. ✅ **TESTING & VALIDATION**

### **Test Cases per Role**

#### **Tim Produksi Tests**

```typescript
describe('Tim Produksi Permissions', () => {
  it('should create new project', async () => {
    const user = { role: 'TIM_PRODUKSI' };
    const result = await createProject(user, projectData);
    expect(result.success).toBe(true);
  });
  
  it('should view team payments', async () => {
    const user = { role: 'TIM_PRODUKSI' };
    const payments = await getTeamPayments(user, projectId);
    expect(payments).toBeDefined();
    expect(payments.length).toBeGreaterThan(0);
  });
  
  it('should edit any project', async () => {
    const user = { role: 'TIM_PRODUKSI' };
    const result = await updateProject(user, projectId, updates);
    expect(result.success).toBe(true);
  });
});
```

---

#### **Broadcaster Tests**

```typescript
describe('Broadcaster Permissions', () => {
  it('should view own projects only', async () => {
    const user = { role: 'BROADCASTER', id: 'user_123' };
    const projects = await getProjects(user);
    
    // All projects should belong to this broadcaster
    projects.forEach(p => {
      expect(p.broadcasterId).toBe(user.id);
    });
  });
  
  it('should NOT view team payments', async () => {
    const user = { role: 'BROADCASTER' };
    
    await expect(
      getTeamPayments(user, projectId)
    ).rejects.toThrow('Forbidden');
  });
  
  it('should view episode status', async () => {
    const user = { role: 'BROADCASTER', id: 'user_123' };
    const episodes = await getEpisodes(user, projectId);
    expect(episodes).toBeDefined();
  });
  
  it('should NOT create project', async () => {
    const user = { role: 'BROADCASTER' };
    
    await expect(
      createProject(user, projectData)
    ).rejects.toThrow('Forbidden');
  });
});
```

---

#### **Investor Tests**

```typescript
describe('Investor Permissions', () => {
  it('should view financial percentages', async () => {
    const user = { role: 'INVESTOR' };
    const financials = await getFinancials(user, projectId);
    
    expect(financials.expensePercentage).toBeDefined();
    expect(financials.incomePercentage).toBeDefined();
    
    // Should NOT have actual amounts
    expect(financials.totalExpense).toBeUndefined();
    expect(financials.teamPayments).toBeUndefined();
  });
  
  it('should NOT view episode details', async () => {
    const user = { role: 'INVESTOR' };
    
    await expect(
      getEpisodes(user, projectId)
    ).rejects.toThrow('Forbidden');
  });
  
  it('should view all projects (summary)', async () => {
    const user = { role: 'INVESTOR' };
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
