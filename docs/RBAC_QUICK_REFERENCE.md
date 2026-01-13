# 🎯 RBAC Quick Reference - Tim Produksi

> Reference card cepat untuk Role Tim Produksi

---

## 🔑 **CORE PERMISSIONS**

| Feature            | Tim Produksi    | Broadcaster      | Investor              |
| ------------------ | --------------- | ---------------- | --------------------- |
| **Projects**       | ✅ CRUD All     | 📖 Read Own      | 📖 Read All (Summary) |
| **Milestones**     | ✅ CRUD All     | 📖 Read (Public) | 📖 Read (Public)      |
| **Episodes**       | ✅ CRUD All     | 📖 Read Own      | ❌ No Access          |
| **Team Payments**  | ✅ CRUD All     | ❌ No Access     | ❌ No Access          |
| **Budget Details** | ✅ View All     | ❌ No Access     | 📊 View % Only        |
| **Expenses**       | ✅ CRUD All     | ❌ No Access     | 📊 View % Only        |
| **Users**          | ✅ CRUD All     | ❌ No Access     | ❌ No Access          |
| **Reports**        | ✅ Generate All | ❌ No Access     | 📖 View Summary       |

---

## 🔔 **NOTIFICATION TRIGGERS**

| Event                 | Trigger        | Recipients                |
| --------------------- | -------------- | ------------------------- |
| **Milestone Due**     | H-7, H-3, H-1  | Tim Produksi, PM          |
| **Milestone Overdue** | After deadline | Tim Produksi, PM          |
| **Delivery Reminder** | H-7, H-3       | Tim Produksi, Broadcaster |
| **Payment Due**       | H-7, H-3, H-1  | Finance, PM               |
| **Budget Alert**      | 90%, 95%, 100% | Tim Produksi, Finance     |
| **Episode Status**    | On change      | Tim Produksi, Broadcaster |

---

## 📊 **AUTOMATED REPORTS**

| Report      | Schedule      | Content                             |
| ----------- | ------------- | ----------------------------------- |
| **Daily**   | 08:00 WIB     | Tasks, Expenses, Milestones         |
| **Weekly**  | Mon 09:00 WIB | Projects, Budget, Upcoming, Overdue |
| **Monthly** | 1st 10:00 WIB | Financial, Productivity, Analysis   |

---

## 💰 **BUDGET CATEGORIES**

| Category        | Default % | Alert at |
| --------------- | --------- | -------- |
| Production Cost | 40%       | 90%      |
| Team Payment    | 35%       | 90%      |
| Post Production | 15%       | 90%      |
| Operational     | 5%        | 90%      |
| Contingency     | 5%        | N/A      |

---

## 📅 **PAYMENT REMINDERS**

```
H-7  : First reminder (normal)
H-3  : Second reminder (medium)
H-1  : Urgent reminder (high)
H+1  : Overdue alert (critical)
```

---

## 🔒 **RLS PROTECTED TABLES**

```
✅ projects
✅ milestones
✅ episodes
🔴 team_payments (CRITICAL)
✅ financial_records
✅ expenses
✅ income_records
```

---

## 🚫 **ACCESS RESTRICTIONS**

**Broadcaster CANNOT:**

- View team payments
- View expense amounts
- View other broadcaster's projects
- Edit anything

**Investor CANNOT:**

- View team payments
- View expense amounts
- View income amounts
- View episode details
- Edit anything

---

## 📂 **KEY FILES**

```
docs/
├── DOKUMENTASI_ROLE_BASED_ACCESS_CONTROL.md
├── RBAC_IMPLEMENTATION_SUMMARY.md
└── RBAC_IMPLEMENTATION_CHECKLIST.md

docs/docs-fix/
└── rls-policies.sql

src/lib/
├── permissions.ts
├── auth-helpers.ts
└── query-filters.ts
```

---

## 🎨 **DASHBOARD WIDGETS**

1. **Overview Cards**: Projects, Budget, Expenses, Payments
2. **Project List**: All projects with filters
3. **Task Calendar**: Milestones, Deliveries, Payments
4. **Financial Summary**: Charts & trends
5. **Recent Activity**: Latest updates

---

## 🔐 **SECURITY LAYERS**

```
1. Route-level (middleware)
2. Component-level (guards)
3. API endpoint (validation)
4. Database query (filters)
5. Database RLS (policies)
6. Audit logging
```

---

## 📞 **QUICK LINKS**

- **Full Docs**: `DOKUMENTASI_ROLE_BASED_ACCESS_CONTROL.md`
- **Summary**: `RBAC_IMPLEMENTATION_SUMMARY.md`
- **Checklist**: `RBAC_IMPLEMENTATION_CHECKLIST.md`
- **RLS SQL**: `docs/docs-fix/rls-policies.sql`

---

**Last Updated**: January 8, 2026
