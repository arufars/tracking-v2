# ✅ RBAC Implementation Checklist

> Checklist praktis untuk implementasi Role-Based Access Control - Tim Produksi Role

**Project**: Dreamlight World Media Production Tracking  
**Date**: January 8, 2026  
**Status**: Ready for Implementation

---

## 📋 **PHASE 1: CORE RBAC SETUP**

### **1.1 Authentication & Session Setup**

- [ ] Install & configure NextAuth.js
- [ ] Setup session provider
- [ ] Configure auth callbacks untuk role management
- [ ] Create login/logout flows
- [ ] Test authentication flow

**Files to create:**

- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API route
- `src/middleware.ts` - Auth middleware

---

### **1.2 User Schema dengan Role**

- [ ] Add role field to User model (Prisma)
- [ ] Create enum untuk roles: TIM_PRODUKSI, BROADCASTER, INVESTOR
- [ ] Run migration
- [ ] Seed initial admin user (Tim Produksi)
- [ ] Test user creation dengan role

**Schema update:**

```prisma
enum UserRole {
  TIM_PRODUKSI
  BROADCASTER
  INVESTOR
}

model User {
  id    String   @id @default(cuid())
  email String   @unique
  role  UserRole @default(TIM_PRODUKSI)
  // ... other fields
}
```

---

### **1.3 Permission System**

- [ ] Create `src/lib/permissions.ts`
- [ ] Define ROUTE_PERMISSIONS mapping
- [ ] Implement `canAccessRoute()` helper
- [ ] Implement `hasPermission()` helper
- [ ] Test permission checks

**Key functions:**

```typescript
canAccessRoute(role, route);
hasPermission(role, action);
getPermissionsForRole(role);
```

---

### **1.4 Middleware Protection**

- [ ] Create route protection middleware
- [ ] Implement role-based redirects
- [ ] Add unauthorized page
- [ ] Test middleware on protected routes
- [ ] Test redirect flows

**Protected routes:**

- `/projects/create` → TIM_PRODUKSI only
- `/projects/[id]/edit` → TIM_PRODUKSI only
- `/projects/[id]/team-payments` → TIM_PRODUKSI only
- `/users` → TIM_PRODUKSI only

---

### **1.5 API Route Authorization**

- [ ] Create `src/lib/auth-helpers.ts`
- [ ] Implement `requireAuth()` helper
- [ ] Implement `requireRole()` helper
- [ ] Add authorization to all API routes
- [ ] Test API authorization

**API routes to protect:**

- `POST /api/projects` → TIM_PRODUKSI
- `DELETE /api/projects/[id]` → TIM_PRODUKSI
- `GET /api/projects/[id]/team-payments` → TIM_PRODUKSI only
- `POST /api/milestones` → TIM_PRODUKSI
- `POST /api/users` → TIM_PRODUKSI

---

### **1.6 Component-Level Guards**

- [ ] Create `src/components/protected.tsx`
- [ ] Implement `<ProtectedComponent>` wrapper
- [ ] Create `usePermission()` hook
- [ ] Apply guards to sensitive UI components
- [ ] Test component visibility per role

**Usage:**

```tsx
<ProtectedComponent requiredRole={["TIM_PRODUKSI"]}>
  <Button>Edit Project</Button>
</ProtectedComponent>
```

---

### **1.7 Query Filtering**

- [ ] Create `src/lib/query-filters.ts`
- [ ] Implement `getProjectFilter(session)`
- [ ] Implement `getMilestoneFilter(session)`
- [ ] Implement `getEpisodeFilter(session)`
- [ ] Apply filters to all data fetching
- [ ] Test data filtering per role

---

### **1.8 Server Actions Authorization**

- [ ] Add authorization to all server actions
- [ ] Use `requireRole()` in actions
- [ ] Add audit logging
- [ ] Test server action authorization

**Server actions to protect:**

- `deleteProject()` → TIM_PRODUKSI
- `createMilestone()` → TIM_PRODUKSI
- `updateEpisode()` → TIM_PRODUKSI
- `addTeamPayment()` → TIM_PRODUKSI

---

## 🔒 **PHASE 2: ROW LEVEL SECURITY (RLS)**

### **2.1 Execute RLS Policies**

- [ ] Review `docs/docs-fix/rls-policies.sql`
- [ ] Backup database
- [ ] Execute SQL file di Supabase
- [ ] Verify policies created successfully
- [ ] Check all tables have RLS enabled

**Tables to protect:**

```
✅ projects
✅ milestones
✅ episodes
✅ team_payments (CRITICAL)
✅ financial_records
✅ expenses
✅ income_records
```

---

### **2.2 Test RLS Policies**

- [ ] Create test users for each role
- [ ] Test Tim Produksi access (should see all)
- [ ] Test Broadcaster access (should see own only)
- [ ] Test Investor access (should see summary)
- [ ] Test team_payments table (Tim Produksi only)
- [ ] Verify RLS violations are blocked

**Test queries:**

```sql
-- Test sebagai Tim Produksi
SELECT * FROM projects; -- Should return ALL
SELECT * FROM team_payments; -- Should return ALL

-- Test sebagai Broadcaster
SELECT * FROM projects; -- Should return OWN only
SELECT * FROM team_payments; -- Should return 0 rows

-- Test sebagai Investor
SELECT * FROM projects; -- Should return ALL
SELECT * FROM episodes; -- Should return 0 rows
```

---

### **2.3 Audit Logging Setup**

- [ ] Verify `rls_audit_log` table created
- [ ] Create application-layer audit logging
- [ ] Test audit log entries
- [ ] Create dashboard untuk view logs
- [ ] Setup alerts untuk violations

---

## 🔔 **PHASE 3: NOTIFICATION SYSTEM**

### **3.1 Notification Infrastructure**

- [ ] Create notification database schema
- [ ] Setup email service (e.g., Resend, SendGrid)
- [ ] Create notification service class
- [ ] Implement notification templates
- [ ] Test email sending

**Schema:**

```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String
  title       String
  message     String
  priority    String
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
  // ... other fields
}
```

---

### **3.2 Automatic Triggers**

- [ ] Implement milestone reminder trigger (H-7, H-3, H-1)
- [ ] Implement milestone overdue trigger
- [ ] Implement delivery reminder trigger
- [ ] Implement payment due trigger
- [ ] Implement budget exceeded trigger
- [ ] Implement episode status change trigger
- [ ] Setup cron jobs untuk scheduled checks

**Cron jobs needed:**

```
Daily 08:00: Check milestones due in 7, 3, 1 days
Daily 08:00: Check overdue milestones
Daily 08:00: Check payments due in 7, 3, 1 days
Hourly:      Check budget thresholds
Real-time:   Episode status changes
```

---

### **3.3 Notification UI**

- [ ] Create notification bell icon dengan badge
- [ ] Create notification dropdown
- [ ] Create notification settings page
- [ ] Implement mark as read
- [ ] Implement notification preferences
- [ ] Test notification flow end-to-end

**Components:**

- `<NotificationBell />` - Bell icon with unread count
- `<NotificationList />` - Dropdown list
- `<NotificationSettings />` - Settings page

---

## 📊 **PHASE 4: AUTOMATED REPORTS**

### **4.1 Report Generation Service**

- [ ] Create report generation service
- [ ] Implement data aggregation functions
- [ ] Create PDF generation (e.g., with Puppeteer)
- [ ] Create Excel generation (e.g., with ExcelJS)
- [ ] Test report generation

---

### **4.2 Daily Report**

- [ ] Implement daily report template
- [ ] Setup cron job (daily 08:00 WIB)
- [ ] Configure recipients
- [ ] Test daily report generation
- [ ] Test email delivery

**Content:**

- Task completion summary
- Expenses logged today
- Active milestone progress

---

### **4.3 Weekly Report**

- [ ] Implement weekly report template
- [ ] Setup cron job (Monday 09:00 WIB)
- [ ] Add charts/visualizations
- [ ] Configure recipients
- [ ] Test weekly report generation

**Content:**

- All projects status summary
- Budget vs actual spending
- Upcoming milestones
- Overdue tasks
- Episode status

---

### **4.4 Monthly Report**

- [ ] Implement monthly report template
- [ ] Setup cron job (1st of month, 10:00 WIB)
- [ ] Add comprehensive charts
- [ ] Add analysis & insights
- [ ] Configure recipients
- [ ] Test monthly report generation

**Content:**

- Complete financial report
- All projects health check
- Team productivity metrics
- Payment schedule
- Revenue projection

---

### **4.5 Custom Report Scheduler**

- [ ] Create UI untuk schedule custom reports
- [ ] Implement custom report builder
- [ ] Allow template saving
- [ ] Test custom scheduling

---

## 💰 **PHASE 5: BUDGET ALLOCATION**

### **5.1 Budget Schema**

- [ ] Create budget allocation schema
- [ ] Define 5 main categories
- [ ] Define subcategories
- [ ] Run migration
- [ ] Seed default allocations

**Categories:**

1. Production Cost (40%)
2. Team Payment (35%)
3. Post Production (15%)
4. Operational (5%)
5. Contingency (5%)

---

### **5.2 Budget Tracking**

- [ ] Implement budget allocation UI
- [ ] Create budget vs actual comparison
- [ ] Implement spending per category
- [ ] Add alert system (90%, 95%, 100%)
- [ ] Test budget tracking

---

### **5.3 Budget Visualization**

- [ ] Create pie chart untuk allocation
- [ ] Create bar chart untuk spending comparison
- [ ] Create trend line untuk spending over time
- [ ] Create heatmap untuk over/under budget
- [ ] Test all visualizations

---

### **5.4 Budget Reallocation**

- [ ] Implement reallocation UI
- [ ] Add approval workflow untuk > 10%
- [ ] Add logging untuk all changes
- [ ] Add reason field (required)
- [ ] Test reallocation flow

---

## 📅 **PHASE 6: PAYMENT SCHEDULE**

### **6.1 Payment Schedule Schema**

- [ ] Add dueDate field to team_payments
- [ ] Add paidDate field
- [ ] Add receipt field
- [ ] Add status enum (PENDING, PAID, OVERDUE)
- [ ] Run migration

---

### **6.2 Payment Calendar**

- [ ] Create calendar view component
- [ ] Show all upcoming payments
- [ ] Color code by status
- [ ] Allow filtering
- [ ] Test calendar display

---

### **6.3 Payment Reminders**

- [ ] Implement reminder system
- [ ] Setup cron job untuk check due dates
- [ ] Send reminders (H-7, H-3, H-1)
- [ ] Send overdue alerts
- [ ] Test reminder delivery

---

### **6.4 Payment Tracking**

- [ ] Create mark as paid functionality
- [ ] Implement receipt upload
- [ ] Create payment history view
- [ ] Add notes field
- [ ] Test payment tracking

---

### **6.5 Payment Analytics**

- [ ] Show total pending
- [ ] Show total paid
- [ ] Show overdue amount
- [ ] Create payment timeline chart
- [ ] Create payment breakdown charts
- [ ] Create cashflow projection
- [ ] Test all analytics

---

## 🎨 **PHASE 7: DASHBOARD ENHANCEMENT**

### **7.1 Tim Produksi Dashboard**

- [ ] Create overview cards
  - [ ] Total Projects (Active/Completed)
  - [ ] Total Budget Allocated
  - [ ] Total Expenses (%)
  - [ ] Pending Payments
- [ ] Create project list widget
  - [ ] Add filters (Status, Broadcaster, Type)
  - [ ] Add quick actions (Edit, View, Archive)
- [ ] Create task calendar widget
  - [ ] Show upcoming milestones
  - [ ] Show shooting schedules
  - [ ] Show delivery deadlines
  - [ ] Show payment due dates
- [ ] Create financial summary widget
  - [ ] Budget vs Expense chart
  - [ ] Expense trend (monthly)
  - [ ] Pending team payments
  - [ ] Account receivable status
- [ ] Create recent activity widget
  - [ ] Latest updates
  - [ ] Team member activities
  - [ ] Client interactions

---

### **7.2 Notification Integration**

- [ ] Add notification bell to header
- [ ] Show unread count badge
- [ ] Add notification center
- [ ] Test notifications on dashboard

---

### **7.3 Quick Actions**

- [ ] Add "Create Project" button
- [ ] Add "Add Payment" quick action
- [ ] Add "Generate Report" quick action
- [ ] Test all quick actions

---

## 🧪 **PHASE 8: TESTING**

### **8.1 Unit Tests**

- [ ] Test permission functions
- [ ] Test authorization helpers
- [ ] Test query filters
- [ ] Test notification triggers
- [ ] Test report generation

---

### **8.2 Integration Tests**

- [ ] Test authentication flow
- [ ] Test authorization on routes
- [ ] Test RLS policies
- [ ] Test notification delivery
- [ ] Test report scheduling
- [ ] Test payment reminders

---

### **8.3 E2E Tests**

- [ ] Test Tim Produksi user flow
- [ ] Test Broadcaster user flow
- [ ] Test Investor user flow
- [ ] Test permission denied scenarios
- [ ] Test data isolation

---

### **8.4 Security Tests**

- [ ] Test privilege escalation prevention
- [ ] Test direct URL access
- [ ] Test API endpoint authorization
- [ ] Test RLS bypass attempts
- [ ] Verify audit logging

---

### **8.5 Performance Tests**

- [ ] Test query performance dengan RLS
- [ ] Test notification system under load
- [ ] Test report generation time
- [ ] Test dashboard load time

---

## 📚 **PHASE 9: DOCUMENTATION**

### **9.1 API Documentation**

- [ ] Document all API endpoints
- [ ] Document required permissions
- [ ] Document request/response schemas
- [ ] Add usage examples

---

### **9.2 User Guides**

- [ ] Create guide for Tim Produksi
- [ ] Create guide for Broadcaster
- [ ] Create guide for Investor
- [ ] Add screenshots & tutorials

---

### **9.3 Admin Documentation**

- [ ] Document user management
- [ ] Document role assignment
- [ ] Document notification configuration
- [ ] Document report customization

---

### **9.4 Developer Documentation**

- [ ] Document permission system
- [ ] Document RLS implementation
- [ ] Document notification service
- [ ] Document report service

---

## 🚀 **PHASE 10: DEPLOYMENT**

### **10.1 Pre-Deployment Checklist**

- [ ] All tests passing
- [ ] Security audit complete
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User training complete

---

### **10.2 Database Migration**

- [ ] Backup production database
- [ ] Execute RLS policies
- [ ] Verify policies active
- [ ] Test with production data

---

### **10.3 Deployment**

- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] UAT with stakeholders
- [ ] Fix any issues
- [ ] Deploy to production

---

### **10.4 Post-Deployment**

- [ ] Monitor error logs
- [ ] Monitor performance
- [ ] Monitor RLS violations
- [ ] Collect user feedback
- [ ] Create bug fix backlog

---

## 📊 **PROGRESS TRACKING**

### **Overall Progress**

```
Phase 1: Core RBAC         [ ] 0%
Phase 2: RLS               [ ] 0%
Phase 3: Notifications     [ ] 0%
Phase 4: Reports           [ ] 0%
Phase 5: Budget            [ ] 0%
Phase 6: Payments          [ ] 0%
Phase 7: Dashboard         [ ] 0%
Phase 8: Testing           [ ] 0%
Phase 9: Documentation     [ ] 0%
Phase 10: Deployment       [ ] 0%

TOTAL: 0% Complete
```

---

## 🎯 **PRIORITY ORDER**

### **Sprint 1 (Week 1-2): Core Security**

1. Phase 1: Core RBAC Setup (1.1 - 1.8)
2. Phase 2: RLS Implementation (2.1 - 2.3)
3. Basic testing

### **Sprint 2 (Week 3-4): Notifications & Reports**

1. Phase 3: Notification System (3.1 - 3.3)
2. Phase 4: Automated Reports (4.1 - 4.5)
3. Integration testing

### **Sprint 3 (Week 5-6): Budget & Payments**

1. Phase 5: Budget Allocation (5.1 - 5.4)
2. Phase 6: Payment Schedule (6.1 - 6.5)
3. Feature testing

### **Sprint 4 (Week 7): Polish & Deploy**

1. Phase 7: Dashboard Enhancement
2. Phase 8: Comprehensive Testing
3. Phase 9: Documentation
4. Phase 10: Deployment

---

## ✅ **COMPLETION CRITERIA**

### **Definition of Done**

- [ ] All features implemented according to spec
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit complete with no critical issues
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User training conducted
- [ ] Successfully deployed to production
- [ ] Monitoring and alerting in place

---

## 📞 **SUPPORT & REFERENCES**

- **Full Documentation**: `DOKUMENTASI_ROLE_BASED_ACCESS_CONTROL.md`
- **RLS SQL**: `docs/docs-fix/rls-policies.sql`
- **Implementation Summary**: `docs/RBAC_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated**: January 8, 2026  
**Status**: ✅ Ready for Development
