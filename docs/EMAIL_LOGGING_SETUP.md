# Email Logging Database Setup

**Status: COMPLETE**

## Table: `admin_email_logs`

Tracks emails sent from the admin portal for audit purposes.

### Schema

```sql
CREATE TABLE admin_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID REFERENCES users(id) NOT NULL,
  recipient_count INTEGER NOT NULL,
  subject TEXT NOT NULL,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_admin_email_logs_sent_by ON admin_email_logs(sent_by);
CREATE INDEX idx_admin_email_logs_created_at ON admin_email_logs(created_at DESC);
```

### Migration

Migration file: `web/supabase/migrations/00019_admin_email_logs.sql`

### RLS Policies

Both SELECT and INSERT policies are applied:
- Admins/moderators can view all email logs
- Admins/moderators can insert new logs

### TypeScript Types

Types defined in `web/src/types/db.ts`:
- `DbAdminEmailLog` - Row type
- `DbAdminEmailLogInsert` - Insert type
- `DbAdminEmailLogUpdate` - Update type
- `AppAdminEmailLog` - Application-level type (camelCase)
- `dbAdminEmailLogToApp()` - Conversion function

### Usage

Email logging is automatically performed when emails are sent via the admin API:
- `POST /api/admin/email` - Logs all email sends
