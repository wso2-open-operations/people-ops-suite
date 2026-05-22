# Scheduler Reminder Redesign

**Date:** 2026-05-22
**Status:** Approved

## Overview

Redesign the visitor scheduler from a force-completion-and-notify system into a pure email reminder system. The scheduler no longer updates any visit state — it only sends reminder emails to a shared admin/reception list until someone manually completes the visit.

## Trigger Logic

Two cases remain, unchanged in structure:

**Case 1 — Departure Overdue**
- Condition: visit has a `timeOfDeparture` and `departureDate <= today`
- Sends a departure-overdue reminder email on every scheduler run until the visit is completed

**Case 2 — Long-Running Visit**
- Condition: visit has no `timeOfDeparture` and `timeOfEntry` is 7 or more days ago
- Sends a long-running visit reminder email on every scheduler run until the visit is completed

The scheduler runs on an external schedule (e.g. cron). Frequency of reminders is controlled by how often the scheduler is invoked. No internal throttling or deduplication.

## Email Design

Both emails go to the shared `adminEmailList` (covers admins and reception). Both use the existing red alert banner style.

### Case 1 — Departure Overdue Reminder

- **Subject:** `Visitor Departure Overdue — Immediate Action Required`
- **Alert banner:** `Immediate Action Required — The scheduled departure time for this visit has passed and it has not been marked as complete. Please complete this visit immediately.`
- **Body:** Visit details table with Visit ID, Visitor Name, Company, Visit Date, Entry Time, Scheduled Departure, Whom They Meet, Pass Number, Purpose of Visit

### Case 2 — Long-Running Visit Reminder

- **Subject:** `Visit Active for 7+ Days — Immediate Action Required`
- **Alert banner:** `Immediate Action Required — This visit has been active for more than one week with no departure recorded. Please review and complete it immediately.`
- **Body:** Visit details table with Visit ID, Visitor Name, Company, Visit Date, Entry Time, Whom They Meet, Pass Number, Purpose of Visit (no Scheduled Departure row — there is none)

## Code Changes

All changes are within the scheduler module. No changes to the visitor backend, webapp, or any external system.

| File | Change |
|------|--------|
| `modules/email/constants.bal` | Rename `FORCE_COMPLETE_SUBJECT` → `DEPARTURE_OVERDUE_SUBJECT` and `EXPIRED_VISIT_SUBJECT` → `LONG_RUNNING_VISIT_SUBJECT`; update subject strings |
| `modules/email/templates.bal` | Rename `forceCompleteTemplate` → `departureOverdueTemplate` and `expiredVisitTemplate` → `longRunningVisitTemplate`; update alert banner text in both |
| `modules/email/email.bal` | Rename `sendForceCompleteEmail` → `sendDepartureOverdueReminderEmail` and `sendExpiredVisitEmail` → `sendLongRunningVisitReminderEmail`; update internal template and subject references |
| `modules/visitor/visitor.bal` | Remove dead `completeVisit` function |
| `main.bal` | Update two call sites to use renamed functions; trigger logic already updated (no further changes needed) |

## Out of Scope

- Throttling or deduplication of reminder emails
- Separate recipient lists for admins vs. reception
- Any changes to the visitor backend API
- Any changes to the webapp
