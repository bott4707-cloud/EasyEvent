/**
 * EasyEvent n8n Automation & User Identification Service
 *
 * This module identifies and structures all database operations ("database work")
 * along with rich user identification (Worker / Organizer / Admin, phone, UPI ID,
 * disciplinary status, and event metadata) and dispatches real-time webhooks to n8n.
 */

const MAX_AUDIT_LOGS = 100;
const auditLogBuffer = [];

/**
 * Normalizes user details into a standardized user identification object.
 */
export function identifyUser(user) {
  if (!user) return null;

  const rawPhone = user.phone ? String(user.phone).trim() : null;
  const cleanPhone = rawPhone ? rawPhone.replace(/[^0-9]/g, "") : null;
  const upiId = cleanPhone ? `${cleanPhone}@upi` : null;

  const warnings = Number(user.warnings) || 0;
  const suspendedUntil = user.suspended_until || user.suspendedUntil || null;
  const isSuspended = Boolean(suspendedUntil && new Date(suspendedUntil) > new Date());

  return {
    userId: user.id || "anonymous",
    name: user.name || "Unknown User",
    email: user.email ? String(user.email).toLowerCase() : "unknown@easyevent.in",
    role: user.role || "guest",
    phone: rawPhone,
    upiId,
    warnings,
    warningReason: user.warning_reason || user.warningReason || null,
    suspendedUntil,
    accountStatus: isSuspended ? "suspended" : warnings > 0 ? "warning_active" : "active",
    identifiedAt: new Date().toISOString(),
  };
}

/**
 * Dispatches identified database work and user identification to the configured n8n webhook.
 * Non-blocking: returns immediately and handles timeouts/failures gracefully.
 */
export async function dispatchDatabaseWork({
  action,
  workType,
  table,
  operation = "INSERT",
  user = null,
  actor = null,
  targetUser = null,
  payload = {},
  metadata = {},
}) {
  const timestamp = new Date().toISOString();
  const workId = `work-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Identify primary user, actor, and any target user
  const primaryUser = identifyUser(user);
  const actorUser = actor ? identifyUser(actor) : primaryUser;
  const targetIdentified = targetUser ? identifyUser(targetUser) : null;

  const eventRecord = {
    workId,
    action,
    workType,
    table,
    operation,
    timestamp,
    databaseWork: {
      workId,
      workType,
      table,
      operation,
      timestamp,
      summary: `${operation} on '${table}' table via [${action}]`,
      payload,
    },
    userIdentification: {
      primary: primaryUser,
      actor: actorUser,
      target: targetIdentified,
      upiVerified: Boolean(primaryUser?.phone && primaryUser.phone.length >= 10),
      upiHandle: primaryUser?.upiId || null,
    },
    metadata: {
      environment: process.env.NODE_ENV || "development",
      source: "easyevent-node-backend",
      ...metadata,
    },
  };

  // Keep in-memory rolling audit log
  auditLogBuffer.unshift(eventRecord);
  if (auditLogBuffer.length > MAX_AUDIT_LOGS) {
    auditLogBuffer.pop();
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(
      `[n8n Automation] ℹ️ Identified Work '${workType}' (${action}) | User: ${primaryUser?.name || "System"} (${primaryUser?.role || "n/a"}) | Phone/UPI: ${primaryUser?.phone || "None"} | N8N_WEBHOOK_URL not set`
    );
    return eventRecord;
  }

  // Non-blocking dispatch to n8n webhook
  (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-EasyEvent-Event": action,
          "X-EasyEvent-Work-Type": workType,
          "X-EasyEvent-Source": "backend-database-worker",
        },
        body: JSON.stringify(eventRecord),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(
          `[n8n Automation] 🚀 Successfully dispatched '${workType}' for ${primaryUser?.name || "System"} to n8n webhook (${response.status} OK)`
        );
      } else {
        console.warn(
          `[n8n Automation] ⚠️ n8n webhook responded with status ${response.status} for work '${workId}'`
        );
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn(`[n8n Automation] ⏱️ Timeout delivering work '${workId}' to n8n webhook`);
      } else {
        console.warn(`[n8n Automation] ⚠️ Could not reach n8n webhook (${err.message}). Work '${workId}' logged locally.`);
      }
    }
  })();

  return eventRecord;
}

/**
 * Returns n8n integration status and recent identified database work.
 */
export function getN8nIntegrationStatus() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL || null;
  return {
    configured: Boolean(webhookUrl),
    webhookUrl: webhookUrl ? webhookUrl.replace(/:[^@]+@/, ":***@") : null,
    totalIdentifiedInSession: auditLogBuffer.length,
    supportedWorkTypes: [
      { workType: "USER_REGISTRATION", table: "users", description: "Worker or Organizer account created with UPI phone identification" },
      { workType: "SHIFT_BOOKING", table: "shifts", description: "Worker applies for event shift, updates slot counts" },
      { workType: "SHIFT_CANCELLATION", table: "shifts", description: "Worker cancels assigned shift within cancellation policy" },
      { workType: "ATTENDANCE_VERIFICATION", table: "shifts", description: "Organizer verifies attendance, triggers UPI payout or delay/suspension" },
      { workType: "EVENT_CREATION", table: "events", description: "Organizer publishes new event needing crew members" },
      { workType: "STAFFING_REQUEST", table: "requests", description: "Organizer creates or modifies crew staffing request" },
    ],
    recentWork: auditLogBuffer.slice(0, 20),
  };
}

/**
 * Dispatches a simulated test event to verify n8n webhook flow.
 */
export async function sendN8nTestEvent(customPayload = {}) {
  const sampleUser = {
    id: "user-test-rohit",
    name: "Rohith N (Test Worker)",
    email: "worker.test@easyevent.in",
    role: "worker",
    phone: "9876543210",
    warnings: 0,
  };

  return await dispatchDatabaseWork({
    action: "test.database_work",
    workType: "ATTENDANCE_VERIFICATION",
    table: "shifts",
    operation: "UPDATE",
    user: sampleUser,
    actor: {
      id: "user-test-organizer",
      name: "Bengaluru Event Manager",
      email: "organizer.test@easyevent.in",
      role: "organizer",
    },
    targetUser: sampleUser,
    payload: {
      shiftId: "shift-sample-123",
      eventTitle: "Bengaluru Tech Summit 2026",
      attended: true,
      payoutAmount: 2500,
      currency: "INR",
      payoutUpiId: "9876543210@upi",
      status: "Completed",
      ...customPayload,
    },
    metadata: {
      isManualTest: true,
      testTriggeredAt: new Date().toISOString(),
    },
  });
}
