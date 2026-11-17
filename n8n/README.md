# EasyEvent n8n Database Work & User Identification Automation

This folder contains the complete n8n workflow for **identifying and tracking all database operations** alongside **comprehensive user identification** (Worker / Organizer / Admin, UPI-connected phone number, verification risk status, and disciplinary records).

---

## ⚡ How It Works

```
EasyEvent Backend (Node.js/Express)
   │
   │── Dispatches database mutation event + User Identity
   ▼
[POST /webhook/easyevent]  (n8n Webhook Node)
   │
   ▼
[Identify User & Normalize Work]  (Validates 10-digit Indian UPI phone, assigns risk profile)
   │
   ▼
[Route by Work Type]  (Switch Node)
   ├── ATTENDANCE_VERIFICATION ────► [If Attended vs No-Show]
   │                                   ├── TRUE  ──► [Instant UPI Payout (₹) via IMPS/UPI]
   │                                   └── FALSE ──► [Log Strike / Delay Payout / Suspend 48h]
   ├── SHIFT_BOOKING           ────► [Confirm Shift & Slot Allocation]
   ├── SHIFT_CANCELLATION      ────► [Release Slot back to Pool]
   ├── USER_REGISTRATION       ────► [Verify UPI Mobile & Onboard User]
   └── EVENT_CREATION          ────► [Broadcast Event to Bengaluru Workers]
   │
   ▼
[Consolidated Database Audit Log]
```

---

## 🚀 Quick Setup Guide

### 1. Import Workflow into n8n
1. Open your n8n workspace (`http://localhost:5678` or your hosted n8n instance).
2. Click **Add workflow** > **... (Menu)** > **Import from File**.
3. Select `n8n/easyevent-database-user-automation.json`.
4. Click **Save** and toggle the workflow to **Active**.

### 2. Configure EasyEvent Backend
In `backend/.env`, set your webhook URL:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/easyevent
```
*(Or your public n8n cloud webhook URL, e.g. `https://your-n8n.app.n8n.cloud/webhook/easyevent`)*

### 3. Verify Integration
Run a test trigger using curl or PowerShell:
```bash
curl -X POST http://localhost:8000/api/n8n/test \
  -H "Content-Type: application/json" \
  -d '{"eventTitle":"Bengaluru Music Fest 2026","payoutAmount":3000}'
```
Or check integration status:
```bash
curl http://localhost:8000/api/n8n/status
```

---

## 📋 Standardized Payload Structure

Every event dispatched to n8n includes:

```json
{
  "workId": "work-1731671234567-abcde",
  "action": "attendance.verified_attended",
  "workType": "ATTENDANCE_VERIFICATION",
  "table": "shifts",
  "operation": "UPDATE",
  "timestamp": "2026-11-17T13:45:00.000Z",
  "databaseWork": {
    "workId": "work-1731671234567-abcde",
    "workType": "ATTENDANCE_VERIFICATION",
    "table": "shifts",
    "operation": "UPDATE",
    "summary": "UPDATE on 'shifts' table via [attendance.verified_attended]",
    "payload": {
      "shiftId": "shift-123",
      "attended": true,
      "payoutStatus": "Credited"
    }
  },
  "userIdentification": {
    "primary": {
      "userId": "user-456",
      "name": "Rohith N",
      "email": "worker@easyevent.in",
      "role": "worker",
      "phone": "9876543210",
      "upiId": "9876543210@upi",
      "accountStatus": "active",
      "warnings": 0,
      "warningReason": null,
      "suspendedUntil": null
    },
    "actor": {
      "userId": "user-789",
      "name": "Event Organizer",
      "role": "organizer"
    },
    "upiVerified": true,
    "upiHandle": "9876543210@upi"
  }
}
```
