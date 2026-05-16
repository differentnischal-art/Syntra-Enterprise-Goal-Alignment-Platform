# Syntra / AlignOS — Enterprise Goal Lifecycle Suite

**AtomQuest Hackathon 1.0 — In-House Goal Setting & Tracking Portal**

## Problem Statement

Traditional goal management in enterprises often suffers from:
- Scattered spreadsheets creating blind spots and misalignment
- Managers lacking real-time visibility into team progress
- Employees unclear about expectations and objectives
- HR struggling during appraisal cycles with manual tracking and compliance risks

AlignOS solves these challenges by providing a unified, role-based platform for the complete goal lifecycle.

## Key Roles

### Employee
- Creates goals with weightage validation
- Submits goal sheet for manager approval
- Updates quarterly achievement (Q1-Q4 check-ins)
- Views shared departmental KPIs

### Manager
- Reviews team goal submissions
- Approves or returns goal sheets with feedback
- Adds check-in comments (coaching, appreciation, escalation)
- Monitors team performance and alignment

### Admin / HR
- Manages goal cycles and windows
- Configures and pushes shared goals
- Monitors audit logs and compliance
- Generates reports and handles escalations

## Key Features

- **Goal Creation** — Structured goal entry with thrust area, UoM, target, and weightage
- **Weightage Validation** — Real-time validation ensuring total = 100%, min 10% per goal, max 8 goals
- **Manager Approval Workflow** — Review, adjust targets, approve or return with mandatory comments
- **Goal Locking** — Approved goals become locked for the cycle
- **Quarterly Check-ins** — Planned vs actual tracking with score calculation
- **Shared Goals** — Departmental KPIs synced across multiple employees
- **Audit Trail** — Complete history of all changes with before/after values
- **Reports & Export** — CSV export for compliance and performance reports
- **Escalations** — Automated alerts for overdue submissions and approvals

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Icons:** lucide-react
- **Data:** Static mock data (frontend-only)

## Local Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Demo Flow

1. **Landing Page** (`/`) — Product overview and role selection
2. **Demo Guide** (`/demo-guide`) — Step-by-step workflow walkthrough
3. **Employee View** (`/employee`) — Goal sheet creation and check-ins
4. **Manager View** (`/manager`) — Team approvals and check-in reviews
5. **Admin View** (`/admin`) — Compliance dashboard and reports

### Key Routes

| Route | Description |
|-------|-------------|
| `/employee` | Employee dashboard |
| `/employee/create-goal-sheet` | Create and submit goals |
| `/employee/shared-goals` | View assigned shared KPIs |
| `/employee/quarterly-check-ins` | Submit Q1-Q4 updates |
| `/manager` | Manager dashboard |
| `/manager/approvals` | Review and approve goal sheets |
| `/manager/check-ins` | Review team check-ins |
| `/manager/team-goals` | View all team goals |
| `/admin` | HR command center |
| `/admin/audit-trail` | Complete change history |
| `/admin/reports-export` | Export compliance reports |
| `/admin/escalations` | Monitor overdue items |

## Frontend-Only Note

This hackathon version uses **static mock data and frontend state** to simulate the complete workflow. No backend, database, or authentication is required. All data is ephemeral and resets on page refresh.

The application demonstrates:
- Role-based access patterns
- Complete CRUD workflow simulation
- Validation and business rule enforcement
- Professional enterprise UI/UX

## Project Structure

```
├── app/
│   ├── admin/          # Admin/HR pages
│   ├── employee/       # Employee pages
│   ├── manager/        # Manager pages
│   ├── demo-guide/     # Demo walkthrough
│   └── login/          # Login page
├── components/
│   ├── dashboard/      # Dashboard components
│   ├── goals/          # Goal-related components
│   ├── landing/        # Landing page components
│   ├── layout/         # Layout components (sidebar, header)
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── mock-data.ts    # Static demo data
│   ├── types.ts        # TypeScript interfaces
│   └── export-csv.ts   # CSV export utility
```

## License

Built for AtomQuest Hackathon 1.0 demonstration purposes.
