# Sprint 23 — Release Notes

**Version**: 2.3.0  
**Date**: 2026-06-01  
**Status**: Closed & merged to main

---

## Summary

Sprint 23 focused on **publication control** for scheduled months and critical **bug fixes** affecting grid layout and night block rotation. The feature allows SUPER_ADMIN and PROJECT_ADMIN to control which months are visible to read-only users, implementing RF-20 requirements fully.

**Key Metrics:**
- **Commits**: 8 commits base + addendum de estabilizacion
- **Unit Tests**: 419/419 passing (12 suites)
- **E2E Smoke**: 22/22 passing
- **New Requirements**: RF-20 (Schedule publication) fully documented
- **Build**: ✅ Production build OK
- **CI Checks**: ✅ TypeScript + ESLint OK

---

## Addendum — Critical Stabilization (2026-06-01)

Sprint 23 continued in stabilization mode to address three critical QA findings.

### HOTFIX-23-A: Cross-project holes during generation ✅
- Root cause: generation pre-read considered assignments from other projects for the same employee, which could lock days incorrectly.
- Fix: project scoping enforced for month assignments and previous-month tail before calling the scheduler.
- Files:
  - `app/api/schedules/generate/route.ts`
  - `lib/schedules/generation-scoping.ts`
- Regression coverage:
  - Unit: `tests/unit/schedules/generation-scoping.test.ts`
  - E2E: `tests/e2e/sprint-23.spec.ts` (CP-147)

### HOTFIX-23-B: Logout stuck on loading ✅
- Root cause: direct signOut redirect path could leave UI in an uncertain transition in some states.
- Fix: explicit async logout flow with `redirect: false`, client navigation, and disabled state while completing sign-out.
- File:
  - `components/layout/header.tsx`
- Regression coverage:
  - E2E: `tests/e2e/sprint-23.spec.ts` (CP-148)

### HOTFIX-23-C: Password-change accessibility for SUPER_ADMIN ✅
- Root cause: password change existed only inside edit modal flow and was not obvious in table operations.
- Fix: added direct "Contraseña" action button per user row in admin table.
- Files:
  - `app/admin/page.tsx`
  - `tests/e2e/sprint-19.spec.ts` (CP-142)

### HOTFIX-23-D: Empty trailing area after day 31 in grid ✅
- Root cause: grid container used full width (`w-full`) even when table content ended at the last day column.
- Fix: container now uses intrinsic width (`inline-block max-w-full`) so it ends exactly with the month columns.
- Files:
  - `components/schedule/schedule-grid.tsx`

### HOTFIX-23-E: Extra-pay summary layout cleanup ✅
- Root cause: the complementos block still rendered a redundant "Paga/turno" header row that made the counters and the summary table feel visually split.
- Fix: the extra-pay wrapper now renders only the table, so both blocks share the same top alignment and the layout stays compact.
- Files:
  - `app/page.tsx`
- Regression coverage:
  - E2E: `tests/e2e/sprint-16.spec.ts` (CP-107, CP-108, CP-110)

### Validation snapshot (hotfixes)
- `npm run ci:check` ✅
- `npm run test:unit -- tests/unit/schedules/generation-scoping.test.ts` ✅
- `npm run test:e2e -- tests/e2e/sprint-23.spec.ts --grep "CP-147|CP-148"` ✅
- `npm run test:e2e -- tests/e2e/sprint-19.spec.ts --grep "CP-142"` ✅
- `npx playwright test tests/e2e/sprint-16.spec.ts -g "CP-107|CP-108|CP-110" --workers=1` ✅
- Manual UI verification: grid ends at day 31 without trailing empty block ✅

---

## Tasks Completed

### TASK-01: Fix Night Block Integrity ✅
**Problem**: In generations with 7 technicians on night rotation, the scheduler was incorrectly overwriting preserved rest days with "relaxed repair" logic.

**Solution**: 
- Added `preserveNightBlockRest = nightOrder.length >= 7` condition in `monthly-schedule-engine.ts`
- Prevents overwriting nightPlan rests when full 7-tech rotation is active
- Regression test added: `tests/unit/scheduler/night-blocks.test.ts` (10 tests)

**Impact**: Ensures night shift blocks maintain integrity; no empty cells due to incorrect rest reallocation.

### TASK-02: Fix Ultrawide Grid Layout ✅
**Problem**: Grid cells stretched inconsistently on ultrawide screens (2560px+), breaking responsive design expectation.

**Solution**:
- Changed table layout from `table-auto` to `w-max` (intrinsic width)
- Fixed day column widths: `32px` constant
- Added constraints to header/cell: `w-8 min-w-8 max-w-8`
- Fixed grid in `components/schedule/schedule-grid.tsx`

**Impact**: CP-144 smoke test validates cells remain square on all viewport sizes.

### TASK-03: Auto-closure under TASK-01 ✅
**Note**: Automatically closed when TASK-01 fix was implemented and committed.

### TASK-04: End-to-End Publication Feature ✅
**Scope**: Full RF-20 implementation (publication control per month/project)

#### 4a. Schema & Persistence
- `Schedule` model updated with:
  - `published: Boolean (default: false)`
  - `publishedAt: DateTime?`
  - `publishedBy: String?`
  - Unique constraint: `(year, month, projectId)`
- Migration: `20260601092142_add_published_to_schedule`

#### 4b. Authorization
- Permission helper: `canPublishSchedule(session, projectId)` in `lib/auth/permissions.ts`
- Supports SUPER_ADMIN + PROJECT_ADMIN of active project
- 69 unit tests for permission logic

#### 4c. API Endpoint
- New: `PATCH /api/schedules/publish`
- Idempotent publish/unpublish toggle
- Validates auth, returns 404 if Schedule missing
- Returns: `{published, publishedAt, publishedBy}`

#### 4d. Publication Gating
- `POST /api/schedules/generate` now upserts `Schedule` record (unpublished by default)
- `GET /api/schedules` implements gating:
  - If month unpublished AND user is read-only: returns `monthStatus: "unpublished"`, `assignments: []`
  - Otherwise: returns full schedule with `published` flag
  
#### 4e. UI Implementation
- Publication badge on main page (status: "No publicado" | "Publicado")
- Toggle button (publish/unpublish) visible only for admins
- Message "Cuadrante no disponible aún" shown to read-only users on unpublished months
- `MonthStatus` enum extended: `"ungenerated" | "preparation" | "generated" | "unpublished"`
- Toast notifications for publication actions

#### 4f. E2E Smoke Coverage
New tests in `tests/e2e/sprint-23.spec.ts`:
- **CP-143**: No empty cells after generation
- **CP-144**: Grid maintains square cells on ultrawide (1920px → 2560px)
- **CP-145**: SUPER_ADMIN can publish a generated month
- **CP-146**: USER sees unpublished message on non-published months (read-only)

---

## Documentation Updates

### REQUIREMENTS.md
- Version: 2.0.0 → 2.3.0 (2026-06-01)
- Added **RF-20 — Schedule Publication** (8 requirements):
  - RF-20.1: Persistence model
  - RF-20.2: Unique per (year, month, projectId)
  - RF-20.3: Authorization (SUPER_ADMIN, PROJECT_ADMIN)
  - RF-20.4: Idempotent endpoint
  - RF-20.5: Publication gating for read-only
  - RF-20.6: UI visibility rules
  - RF-20.7: Unpublished message for read-only users
  - RF-20.8: Default state after generation
- Updated `Schedule` model section
- Added `canPublishSchedule()` authorization rule

### CHANGELOG.md
- **[2.3.0] — 2026-06-01**
  - Added: Publication persistence + endpoint
  - Changed: Publication gating in GET /api/schedules
  - Fixed: Night block integrity (TASK-01), Ultrawide layout (TASK-02)

---

## Breaking Changes

**None**. Publication feature is additive; unpublished months default to visible for admins and hidden (unpublished message) for read-only users.

---

## Validated Outcomes

| Category | Result |
|----------|--------|
| Unit Tests | 419/419 ✅ |
| E2E Smoke | 22/22 ✅ |
| TypeScript Compile | ✅ |
| ESLint | ✅ |
| Production Build | ✅ |
| Branch | `main` (merged from `feature/sprint-23-bugs-publish`) |

---

## Next Steps

1. **CI/CD**: GitHub Actions will run full E2E suite on merge to main
2. **Monitoring**: Watch for any publication-related issues in staging/production
3. **Sprint 24**: Backlog includes:
   - Advanced publication workflows (scheduled publication)
   - User notifications on publication changes
   - Publication audit trail
