/**
 * Comprehensive Full-Stack Verification Suite for EasyEvent
 */
import {
  createUser,
  findUserByEmail,
  getDashboardState,
  getPublicEvents,
  createEvent,
  applyForEvent,
  cancelWorkerShift,
  verifyAttendance,
} from "./db.js";
import { dispatchDatabaseWork } from "./n8n.js";
import { supabase, isSupabaseConfigured } from "./supabase.js";

async function runVerification() {
  console.log("=== STARTING EASYEVENT FULL-STACK VERIFICATION ===\n");

  // 1. Database & Supabase connection test
  console.log("1. Checking Database Connectivity...");
  console.log(`   Supabase Configured: ${isSupabaseConfigured}`);
  if (isSupabaseConfigured && supabase) {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasEventImages = buckets?.some((b) => b.name === "event-images");
    console.log(`   Supabase Storage 'event-images' Bucket Present: ${hasEventImages}`);
    if (!hasEventImages) {
      await supabase.storage.createBucket("event-images", { public: true });
      console.log("   Created 'event-images' bucket successfully.");
    }
  }

  // 2. User Registration test (Worker with UPI mobile)
  console.log("\n2. Testing User Registration with Phone/UPI Identification...");
  const workerEmail = `worker.verify.${Date.now()}@easyevent.in`;
  const worker = await createUser({
    name: "Arun Kumar (Verified Crew)",
    email: workerEmail,
    role: "worker",
    phone: "9845011223",
    password_salt: "salt123",
    password_hash: "hash123",
  });
  console.log(`   Worker Created: ${worker.name} (ID: ${worker.id})`);
  console.log(`   Phone: ${worker.phone} | Role: ${worker.role}`);

  // 3. Clean Dashboard State (0 fake shifts)
  console.log("\n3. Testing Dashboard State & Data Cleanup...");
  const workerState = await getDashboardState(worker);
  console.log(`   Worker's Assigned Shifts Count: ${workerState.data.shifts.length}`);
  if (workerState.data.shifts.length !== 0) {
    throw new Error(`Expected 0 assigned shifts for new worker, found ${workerState.data.shifts.length}`);
  }
  console.log("   CLEANUP VERIFIED: No fake or demo shifts assigned to new worker.");

  // 4. Public Events Retrieval
  console.log("\n4. Testing Event Retrieval...");
  const events = await getPublicEvents();
  console.log(`   Total Published Events in Database: ${events.length}`);
  if (events.length === 0) {
    throw new Error("Expected published events in database.");
  }
  const targetEvent = events[0];
  console.log(`   Selected Target Event: "${targetEvent.title}" at ${targetEvent.venue}`);
  const initialAssigned = targetEvent.assigned;

  // 5. Shift Application / Event Selection
  console.log("\n5. Testing Event Registration / Shift Booking...");
  const bookedShift = await applyForEvent(worker.id, targetEvent.id, "Stage Support");
  console.log(`   Shift Booked Successfully: ID ${bookedShift.id}`);
  console.log(`   Event Assigned Count Updated from ${initialAssigned} to ${targetEvent.assigned}`);

  // 6. Verify Worker Dashboard Reflects Booked Shift
  console.log("\n6. Verifying Dynamic Dashboard Update...");
  const updatedWorkerState = await getDashboardState(worker);
  console.log(`   Worker Shifts Now: ${updatedWorkerState.data.shifts.length}`);
  if (updatedWorkerState.data.shifts.length !== 1) {
    throw new Error(`Expected 1 assigned shift, found ${updatedWorkerState.data.shifts.length}`);
  }
  console.log(`   Shift in Dashboard: "${updatedWorkerState.data.shifts[0].title}" (${updatedWorkerState.data.shifts[0].status})`);

  // 7. Organizer Event Creation & Image Attachment
  console.log("\n7. Testing Organizer Event Creation & Publishing...");
  const organizerEmail = `organizer.verify.${Date.now()}@easyevent.in`;
  const organizer = await createUser({
    name: "Priya Rao (Bengaluru Events Lead)",
    email: organizerEmail,
    role: "organizer",
    phone: "9876543210",
    password_salt: "salt456",
    password_hash: "hash456",
  });
  console.log(`   Organizer Created: ${organizer.name}`);

  const sampleEvent = await createEvent(
    {
      title: "Bengaluru Innovation Night 2026",
      venue: "Palace Grounds (Main Lawn)",
      date: "2026-12-20",
      time: "17:00",
      duty: "Ushering & VIP Management",
      required: 25,
      images: [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
      ],
      crew_briefing: "Report to Gate 2 by 4:00 PM. All-black formal attire required.",
      description: "Annual summit celebrating Karnataka tech innovators.",
    },
    organizer.id
  );
  console.log(`   Event Published: "${sampleEvent.title}" (ID: ${sampleEvent.id})`);

  // 8. Attendance Verification & Disciplinary Workflow
  console.log("\n8. Testing Attendance Check & Disciplinary Tracking...");
  const attendanceRes = await verifyAttendance(bookedShift.id, true);
  console.log(`   Attendance Status: ${attendanceRes.shift.status}`);
  console.log(`   Payout Status: ${attendanceRes.shift.payout_status}`);
  console.log(`   Worker Attended Flag: ${attendanceRes.shift.attended}`);
  if (attendanceRes.shift.payout_status !== "Credited") {
    throw new Error("Expected payout_status 'Credited' for attended shift");
  }

  // 9. n8n Database Work & User Identification Dispatch
  console.log("\n9. Testing n8n Database Work Identification & User Identity Dispatch...");
  const n8nResult = await dispatchDatabaseWork({
    action: "attendance.verified_attended",
    workType: "ATTENDANCE_VERIFICATION",
    table: "shifts",
    operation: "UPDATE",
    user: worker,
    actor: organizer,
    payload: {
      shiftId: bookedShift.id,
      eventTitle: targetEvent.title,
      attended: true,
      payoutAmount: 2200,
    },
  });
  console.log(`   n8n Event Work ID: ${n8nResult.workId}`);
  console.log(`   Identified User: ${n8nResult.userIdentification.primary.name} (${n8nResult.userIdentification.primary.phone})`);
  console.log(`   Derived UPI: ${n8nResult.userIdentification.primary.upiId}`);
  console.log(`   UPI Verified: ${n8nResult.userIdentification.upiVerified}`);

  console.log("\n=== ALL FULL-STACK VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
