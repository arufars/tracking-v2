# Create Project Feature - Production Role

## ⚠️ SETUP REQUIRED

**IMPORTANT**: Before using this feature, you MUST run the database trigger:

```sql
-- Run this in Supabase SQL Editor
-- File: docs/docs-fix/v3-trigger-FIXED.md
-- Section: Auto-assign project creator
```

This trigger handles:
1. Creating the project
2. Auto-assigning creator to the project
3. Working for any column additions (flexible!)

Without this trigger, create project will work but user won't be assigned automatically.

---

## 📋 Overview
Fitur untuk role **Production** dan **Admin** untuk membuat project baru dalam sistem production tracking.

## 🎯 Permissions

### ✅ Yang Bisa Create Project:
- **Admin** - Full access
- **Production** - Full access

### ❌ Yang TIDAK Bisa Create Project:
- **Broadcaster** - Read-only, hanya lihat project mereka
- **Investor** - Read-only, hanya lihat summary

## 📁 Files Created

### 1. Server Actions
**File**: `src/server/project-actions.ts`

Functions:
- ✅ `createProject()` - Create new project
- ✅ `updateProject()` - Update existing project
- ✅ `deleteProject()` - Delete project (Admin only)
- ✅ `archiveProject()` - Archive project (Admin & Production)

### 2. UI Component
**File**: `src/components/projects/create-project-dialog.tsx`

Features:
- Dialog form untuk create project
- Form validation dengan Zod
- Toast notifications
- Auto refresh after create

### 3. Page Integration
**File**: `src/app/(main)/dashboard/production/projects/page.tsx`

Updated:
- Added `CreateProjectDialog` component
- Integrated with production projects page

## 📝 Form Fields

### Required Fields:
1. **Title** - Project title (max 255 chars)
2. **Type** - Project type: Film, Series, Documentary, Variety

### Optional Fields:
3. **Genre** - Free text (Reality Show, Drama, Comedy, etc.)
4. **Description** - Project description
5. **Start Date** - Project start date
6. **Target Completion Date** - Expected completion date
7. **Total Budget** - Budget in IDR

## 🔐 Security Features

1. **Authentication Check**
   - Must be logged in
   - Redirects to login if not authenticated

2. **Authorization Check**
   - Only `admin` and `production` roles allowed
   - Returns error if unauthorized

3. **Auto Assignment**
   - Creator automatically assigned to project
   - Access level: `admin`
   - Team role: `admin` or `production_manager`

## 🎨 UI/UX Features

- **Dialog Modal** - Non-intrusive creation flow
- **Form Validation** - Client-side & server-side validation
- **Loading States** - Shows spinner during submission
- **Error Handling** - Toast notifications for errors
- **Success Feedback** - Toast confirmation on success
- **Auto Refresh** - Page refreshes after creation

## 🚀 Usage

### For Production Role:
1. Navigate to `/dashboard/production/projects`
2. Click "Create Project" button (top right)
3. Fill in the form
4. Submit
5. Project created and you're automatically assigned

### Database Operations:
```sql
-- Insert into projects table
INSERT INTO projects (title, type, genre, ...) VALUES (...);

-- Auto-assign creator to project
INSERT INTO user_projects (user_id, project_id, access_level, team_role) 
VALUES (creator_id, new_project_id, 'admin', 'production_manager');
```

## 📊 Database Schema Reference

### Table: `projects`
```sql
- id (uuid, PK)
- title (text, required)
- description (text)
- type (enum: film/series/documentary/variety)
- status (enum: active/completed/archived)
- genre (text)
- total_budget (numeric)
- start_date (date)
- target_completion_date (date)
- created_by (uuid, FK -> users)
- created_at (timestamp)
```

### Table: `user_projects`
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users)
- project_id (uuid, FK -> projects)
- access_level (enum: view/edit/admin)
- team_role (text)
```

## ✅ Testing Checklist

- [ ] Production role can create project
- [ ] Admin role can create project
- [ ] Broadcaster role CANNOT create project
- [ ] Investor role CANNOT create project
- [ ] Form validation works
- [ ] Required fields are enforced
- [ ] Optional fields are optional
- [ ] Success toast appears
- [ ] Error handling works
- [ ] Page refreshes after creation
- [ ] Creator auto-assigned to project
- [ ] Project appears in projects list

## 🔄 Next Steps

1. **Add Edit Project Dialog**
2. **Add Archive/Delete Actions**
3. **Add Project Details Page**
4. **Add Team Member Management**
5. **Add Budget Management**
6. **Add Episode Management**

---

**Created**: January 7, 2026
**Status**: ✅ Implemented
**Roles**: Admin, Production
