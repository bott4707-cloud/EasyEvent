# EASYEVENT Frontend (React & TypeScript)

The frontend is a single-page application built with React 19, TypeScript, Vite, and Lucide React icons.

## Separate Dashboards

- **User (Worker) Dashboard (`/worker`)**:
  - Upcoming shifts count, monthly logged hours, completed assignments
  - Weekly 7-day availability roster with interactive day chips & master availability switch
  - Real-time assigned shift tracking with status progression (`Assigned` → `Accepted` → `Reporting` → `Completed`)
  - Embedded venue maps & Google Maps turn-by-turn navigation links
  - Browse and apply for open shift opportunities

- **Organizer Dashboard (`/organizer`)**:
  - Real-time overview of events managed, crew required vs assigned, and shortage counters
  - Interactive **Create Event** modal (Title, Venue, Date, Time, Duty, Required crew count)
  - Managed events cards with live staffing progress bars and shortage warnings
  - Staffing Requests management to dispatch extra crew and withdraw requests

- **Admin Console (`/admin`)**:
  - Full management of platform events (approve, reject, delete)
  - Staffing requests approval & rejection
  - User account auditing and removal

## Running Locally

1. Install dependencies:
   ```powershell
   cd frontend
   npm.cmd install
   ```

2. Start the Vite development server:
   ```powershell
   npm.cmd run dev
   ```
   The frontend runs on `http://localhost:5173` and proxies `/api` calls to the Node.js backend on `http://127.0.0.1:8000`.

3. Build for production:
   ```powershell
   npm.cmd run build
   ```
