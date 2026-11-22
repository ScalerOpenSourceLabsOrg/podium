# Podium — Changelog & Monthly Progress Report
**Period**: October 22, 2026 – November 23, 2026  
**Target Repository**: `D:\podium`  
**Active Branch**: `Gajanan's_Branch`

---

## 1. Executive Summary

Over the past month, Podium transitioned from its initial MVP stage into a hardened, production-grade, and cross-platform hackathon management system. Major milestones achieved during this cycle include:

1. **Autonomous Operations Supervisor & Web Panel**: Introduced a zero-dependency Node.js admin panel (`npm run panel`) replacing legacy Windows `.bat` scripts, featuring live terminal streaming, service controls, and dynamic credentials.
2. **Infrastructure Telemetry & Auto-Boot**: Added real-time Docker container metrics (CPU, RAM, Block I/O), PostgreSQL database storage footprint analysis (`pg_database_size`, table records), and automated Docker container startup with schema auto-seeding.
3. **Security & Exploit Hardening**: Audited and patched authorization loopholes, enforced strict timeline boundaries across all event phases, resolved headless team leader succession issues, and implemented anti-lockout guards.
4. **Full-Featured User & Role Management**: Developed dedicated user management both within the Next.js application (`/admin/[slug]/users`) and directly embedded inside the Admin Web Panel.
5. **Codebase Compliance & Strict Quality**: Reduced oversized query files to obey the `< 200 lines` rule, achieved 0 lint errors, 0 TypeScript errors, and created 33 passing automated unit/security tests.

---

## 2. Commit Timeline (Chronological)

| Commit Hash | Date | Summary |
| :--- | :--- | :--- |
| `c74b0eb` | 2026-10-22 | **QoL and Exploit Patch**: Initial quality-of-life updates, error boundaries, access-denied pages, CSV exports, and baseline Windows utilities. |
| `29e2997` | 2026-11-22 | **Turbopack & DB Loopback**: Enabled Turbopack (`next dev --turbo`) in `npm run dev` and enforced explicit IPv4 loopback (`127.0.0.1:5432`) to eliminate DNS delays. |
| `fc860a4` | 2026-11-22 | **Cross-Platform Admin Operations Web Panel**: Created `scripts/admin-panel.mjs` with dynamic port discovery, random credential generation (`admin_xxxxxxx` + 16-char pass), SSE log streaming, and Next.js child process supervision. |
| `6d2f1aa` | 2026-11-22 | **Event User Management Panel**: Added `/admin/[slug]/users` route with `UserTable`, `AddUserModal`, server actions, role filtering (`ORGANIZER`, `JUDGE`, `REGISTRANT`), and anti-lockout protection. |
| `f22c328` | 2026-11-22 | **Security & Exploit Hardening**: Patched missing Zod validations in server actions, added timeline boundary checks across all queries, fixed team leader succession bug (`joinedAt: "asc"`), and added `tests/security.test.ts`. |
| `6c9840f` | 2026-11-22 | **Autonomous Docker & Seed Engine**: Integrated autonomous Docker PostgreSQL auto-boot and automatic database schema push/seeding via `scripts/check-seed.mjs`. |
| `7cd787b` | 2026-11-23 | **Integrated Web Panel User Management**: Embedded a full `👥 PODIUM USERS & ROLES` tab inside the Admin Web Panel for unified operations. |
| `39fdf9e` | 2026-11-23 | **Container & Database Telemetry**: Replaced host disk gauges with real-time Docker container metrics (CPU%, RAM, Block I/O via `docker stats`) and PostgreSQL storage footprint (`pg_database_size`, `pg_stat_user_tables`). |
| `ef87941` | 2026-11-23 | **Legacy Cleanup**: Removed obsolete Windows batch scripts (`podium-setup.bat`, `podium-start.bat`, `podium-stop.bat`) while keeping `podium.exe` as a standalone Windows backup tool. |
| `5611f10` | 2026-11-23 | **Process & Port Conflict Fixes**: Resolved Docker container port 5432 collisions, added Docker executable discovery on Windows, and added interactive toast notifications for web panel controls. |
| `be887b6` | 2026-11-23 | **Client Script Syntax Fix**: Resolved client-side template quote escaping issue in user table and added reentrancy polling guards to keep web panel diagnostics fully responsive. |

---

## 3. Detailed Breakdown of Changes

### A. Operations Supervisor & Admin Web Panel (`scripts/admin-panel.mjs`)
- **Cross-Platform Native**: Engineered entirely with standard Node.js libraries (`node:http`, `node:crypto`, `node:child_process`, `node:net`, `node:fs`). Runs identically on Linux and Windows.
- **Dynamic Port Allocation**: Scans starting from port `3001` and automatically binds the next available port if `3001` is occupied.
- **Cryptographic Ephemeral Credentials**:
  - Dynamically generates unpredictable usernames: `admin_xxxxxxx` (7 random high-entropy alphanumeric characters).
  - Generates 16-character high-entropy passwords with mixed case, digits, and symbols.
  - Displays credentials in the console on launch.
- **Rate-Limited Authentication**:
  - Timing-safe credential comparisons (`crypto.timingSafeEqual`).
  - Brute-force rate limiting: locks IP for 5 minutes after 5 consecutive failed login attempts.
  - Session management using cryptographically signed `HttpOnly`, `SameSite=Strict` cookies.
- **Live Terminal & Log Stream**:
  - Server-Sent Events (SSE) endpoint (`/api/logs/stream`) with a 2,000-line circular buffer.
  - Interactive search filter input and auto-scroll toggle.
- **Process Lifecycle Management**:
  - One-click **START**, **RESTART**, and **STOP** controls for Next.js app server.
  - Process tree cleanup (`taskkill /T /F` on Windows; process group `SIGTERM` on Linux) preventing orphaned Node processes on port `3000`.
  - Non-blocking toast notifications in bottom-right corner for instant feedback.

---

### B. Autonomous Infrastructure & Telemetry
- **Autonomous Docker Boot**: Checks if PostgreSQL is listening on `127.0.0.1:5432`. If down, autonomously executes `docker compose up -d db` and waits up to 20 seconds.
- **Autonomous Seeding**: If the database contains no events, automatically runs `prisma db push` and `npm run seed`.
- **Docker Container Telemetry**:
  - Queries `docker stats --no-stream` for live container metrics.
  - Real-time container CPU usage percentage with high-load warning triggers (`> 85%`).
  - Container RAM usage and percentage vs system limit (e.g., `29.1MiB / 7.4GiB (0.38%)`).
  - Real-time Block I/O disk throughput (e.g., `5.8MB / 7.18MB`).
- **PostgreSQL Database Storage Footprint**:
  - Queries actual database disk size using `pg_database_size(current_database())` and `pg_size_pretty()`.
  - Queries `pg_stat_user_tables` to display total record counts and top tables by row count and storage size (`Score`, `User`, `Registration`, `TeamMember`, `Assignment`, `Team`).
  - Safe `BigInt` serialization handling to prevent JSON parsing errors.

---

### C. Security & Business Logic Hardening
- **Missing Zod Validations Patched**:
  - Added `UpdateAwardWinnerSchema` (`awardId`, `submissionId`) and `VisibilitySchema` (`slug`, `visibility`) in `lib/schemas/result.ts`.
  - Enforced `CheckInSchema` in `app/admin/[slug]/actions.ts`.
- **Event Phase Timeline Gates**:
  - Enforced `registrationOpensAt` and `registrationClosesAt` in `lib/queries/registrations.ts` and `lib/queries/teams.ts` (`createTeam`, `joinTeam`).
  - Enforced `submissionOpensAt` and `submissionClosesAt` in `lib/queries/submissions.ts` (`createSubmission`, `updateSubmission`).
  - Enforced `judgingOpensAt` and `judgingClosesAt` in `lib/queries/judging.ts` (`submitScore`).
- **Team Leader Succession**:
  - Patched headless team bug in `lib/queries/teams.ts`: when a leader leaves a multi-member team, leadership is automatically transferred to the earliest joined member (`joinedAt: "asc"`). If all members leave, the team is automatically deleted.
- **Ghost Member Prevention**:
  - Fixed `removeEventRegistration` in `lib/queries/users.ts`: revoking a user's registration automatically cleans up their team membership.
- **Anti-Lockout Protection**:
  - An event organizer cannot be deleted if they are the sole remaining organizer (`count <= 1`).
- **Automated Security Test Suite**:
  - Created `tests/security.test.ts` covering schema parsing, phase boundary restrictions, team leader succession, and anti-lockout rules.

---

### D. User & Role Management
- **Next.js Admin Interface (`app/admin/[slug]/users`)**:
  - Comprehensive user table with search, role filters (`ALL`, `ORGANIZER`, `JUDGE`, `REGISTRANT`), and check-in badges.
  - Role assignment modal (`AddUserModal.tsx`) with automatic user upsert.
  - Role revocation actions (`actions.ts`).
  - Direct deep link card added to event overview (`app/admin/[slug]/page.tsx`).
- **Admin Web Panel User Management**:
  - Embedded `👥 PODIUM USERS & ROLES` tab in `scripts/admin-panel.mjs`.
  - Real-time stat summary cards (Total Users, Organizers, Judges, Registrants).
  - Interactive table with role chips, revocation buttons, and assignment modal.

---

### E. Codebase Standards & Cleanup
- **`< 200 Lines` Rule Adherence**:
  - Refactored `lib/queries/submissions.ts` from 208 lines down to 156 lines.
  - Split large components (`AddUserModal.tsx`, `UserTable.tsx`, `actions.ts`).
  - All files in `app/` and `lib/` strictly obey the `< 200 lines` threshold.
- **Legacy Script Deprecation**:
  - Deleted `podium-setup.bat`, `podium-start.bat`, and `podium-stop.bat`.
  - Preserved `podium.exe` (and source `podium-manager.cs`) as a standalone Windows fallback tool.
- **Quality Metrics**:
  - `npm test`: 33/33 unit and security tests passing.
  - `npm run lint`: 0 ESLint warnings or errors.
  - `npm run typecheck`: 0 TypeScript compiler errors.

---

## 4. Verification & Testing Summary

```text
✓ tests/scoring/normalize.test.ts (6 tests)
✓ tests/csv.test.ts (3 tests)
✓ tests/scoring/rank.test.ts (7 tests)
✓ tests/scoring/assign.test.ts (7 tests)
✓ tests/event.test.ts (3 tests)
✓ tests/security.test.ts (7 tests)

Test Files  6 passed (6)
Tests       33 passed (33)
Duration    1.37s
ESLint:     0 errors, 0 warnings
TypeScript: 0 errors
```
