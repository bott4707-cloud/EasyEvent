-- =========================================================================
-- EasyEvent Supabase / PostgreSQL Direct n8n Automation Setup
-- =========================================================================
-- This script configures database triggers and webhooks so that every INSERT,
-- UPDATE, or DELETE on `users`, `shifts`, and `events` tables automatically
-- forwards the database work with user identification to n8n.
-- =========================================================================

-- Enable pg_net extension for async HTTP POST requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- Function: Dispatches database work and user identification to n8n webhook
CREATE OR REPLACE FUNCTION notify_easyevent_n8n()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  user_ident JSONB;
  work_type TEXT;
  n8n_url TEXT := 'http://localhost:5678/webhook/easyevent'; -- Replace with your public n8n webhook URL
BEGIN
  -- Determine work type based on table and TG_OP
  IF TG_TABLE_NAME = 'users' THEN
    work_type := 'USER_REGISTRATION';
    user_ident := jsonb_build_object(
      'userId', NEW.id,
      'name', NEW.name,
      'email', NEW.email,
      'role', NEW.role,
      'phone', NEW.phone,
      'upiId', CASE WHEN NEW.phone IS NOT NULL THEN regexp_replace(NEW.phone, '[^0-9]', '', 'g') || '@upi' ELSE NULL END,
      'warnings', COALESCE(NEW.warnings, 0),
      'accountStatus', CASE WHEN NEW.suspended_until IS NOT NULL AND NEW.suspended_until > NOW() THEN 'suspended' ELSE 'active' END
    );
  ELSIF TG_TABLE_NAME = 'shifts' THEN
    IF TG_OP = 'INSERT' THEN
      work_type := 'SHIFT_BOOKING';
    ELSIF NEW.status = 'Cancelled' THEN
      work_type := 'SHIFT_CANCELLATION';
    ELSIF NEW.attended IS NOT NULL THEN
      work_type := 'ATTENDANCE_VERIFICATION';
    ELSE
      work_type := 'SHIFT_UPDATE';
    END IF;

    -- Query worker identification if available
    SELECT jsonb_build_object(
      'userId', u.id,
      'name', u.name,
      'email', u.email,
      'role', u.role,
      'phone', u.phone,
      'upiId', CASE WHEN u.phone IS NOT NULL THEN regexp_replace(u.phone, '[^0-9]', '', 'g') || '@upi' ELSE NULL END,
      'warnings', COALESCE(u.warnings, 0),
      'accountStatus', CASE WHEN u.suspended_until IS NOT NULL AND u.suspended_until > NOW() THEN 'suspended' ELSE 'active' END
    ) INTO user_ident
    FROM users u
    WHERE u.id = NEW.worker_id;
  ELSIF TG_TABLE_NAME = 'events' THEN
    work_type := 'EVENT_CREATION';
    user_ident := jsonb_build_object('userId', NEW.owner_id);
  ELSE
    work_type := 'GENERAL_DATABASE_WORK';
    user_ident := '{}'::JSONB;
  END IF;

  -- Build consolidated event payload
  payload := jsonb_build_object(
    'workId', 'pg-work-' || extract(epoch from now())::bigint || '-' || floor(random() * 10000)::int,
    'action', lower(TG_TABLE_NAME) || '.' || lower(TG_OP),
    'workType', work_type,
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'timestamp', now(),
    'databaseWork', jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'summary', TG_OP || ' on table ' || TG_TABLE_NAME,
      'record', to_jsonb(NEW)
    ),
    'userIdentification', jsonb_build_object(
      'primary', user_ident,
      'source', 'postgresql-trigger'
    )
  );

  -- Perform asynchronous HTTP POST via pg_net (non-blocking)
  PERFORM extensions.net_http_post(
    url := n8n_url,
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-Source', 'supabase-postgres')
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block table writes if webhook fails
  RAISE WARNING 'n8n webhook dispatch failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: shifts table
DROP TRIGGER IF EXISTS trg_easyevent_shifts_n8n ON shifts;
CREATE TRIGGER trg_easyevent_shifts_n8n
AFTER INSERT OR UPDATE ON shifts
FOR EACH ROW EXECUTE FUNCTION notify_easyevent_n8n();

-- Trigger: users table
DROP TRIGGER IF EXISTS trg_easyevent_users_n8n ON users;
CREATE TRIGGER trg_easyevent_users_n8n
AFTER INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION notify_easyevent_n8n();

-- Trigger: events table
DROP TRIGGER IF EXISTS trg_easyevent_events_n8n ON events;
CREATE TRIGGER trg_easyevent_events_n8n
AFTER INSERT ON events
FOR EACH ROW EXECUTE FUNCTION notify_easyevent_n8n();
