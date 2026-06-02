# Frontend Requirements Document

This is the working document derived from the master template.
We will fill it row by row during this session.

## 0) Document Control
1. Product/Project Name: Transcendence
2. Version: 0.1.0
3. Last Updated: 2026-05-21
4. Authors: Peter
5. Reviewers: The team
6. Status: Draft
7. Decision Log Link: [TBD - pending]

## 1) Vision and Scope
1. Problem Statement: Create an application that complements different teaching formats with peer-to-peer evaluation. Users enroll in classes, complete assignments, and are evaluated by peers, while Bocal users set up classes and create assignments.
2. Product Vision (2-3 sentences): The frontend should support a learning experience where users explain their submissions to peers and answer follow-up questions to deepen understanding. The platform should make peer evaluations easy to organize, track, and complete across different class formats.
3. Target Users/Roles: Student, Bocal, Admin
4. In Scope (this phase): Authentication and role-based access; class discovery and class list; assignment list and assignment detail; submission upload and status tracking; peer evaluation flow; progress tracking; Bocal panel for class and assignment setup; user profile management.
5. Out of Scope (explicit): Native mobile apps (iOS/Android), payments/billing features, real-time chat or video collaboration, AI-assisted grading, and offline-first support.
6. Success Metrics (3-5 measurable): Login success rate >= 95%; peer evaluation completion rate >= 80%; task failure rate (API/form errors) <= 5%.

## 2) Principles and UX Direction
1. UX Principles (max 5): Clarity over complexity; fast task completion; consistency across screens; feedback for every user action; error prevention before error handling.
2. Tone and Messaging Guidelines: Clear and concise; supportive and non-judgmental; action-oriented error messages; playful and lightly gamified language where appropriate.
3. Accessibility Baseline: Basic accessibility best effort for this phase.
4. Responsive Targets (mobile/tablet/desktop): Desktop 1280px+ and large desktop 1536px+.
5. Performance Targets (page load, interaction): Initial page load p95 <= 2.5s; route transition p95 <= 500ms; visual acknowledgement for main actions <= 200ms.

## 3) Role-Capability Matrix
1. Role: Student
2. Can View: Dashboard; Classes / Class list; Assignment list; Assignment detail; Submission status / My submissions; Peer evaluation flow (assignments to evaluate); Progress page; Own user profile; Notifications / Messages (if present).
3. Can Create/Edit/Delete: Submit assignments (upload files, add submission notes); Edit or replace own submission before deadline; Create evaluation responses (scores, comments) for submissions assigned to them; Add comments/questions on peer submissions where permitted; Edit own user profile; Manage personal notification preferences.
4. Restricted From: Accessing Bocal/Admin panels; editing or deleting other users' profiles or submissions; creating or modifying classes or assignments; changing enrollment for other users; viewing private data of other users beyond permitted evaluation context.
5. Role: Bocal
6. Can View: Dashboard; classes they manage; class rosters; assignment list and details for their classes; all submissions and evaluation queues for their classes; student progress within their classes; bocal panel and administrative tools scoped to their organization; reports/analytics for their classes; user profiles for students in their classes; notifications and messages for their classes.
7. Can Create/Edit/Delete: Create and manage classes; create, edit, publish/unpublish assignments and deadlines for their classes; define evaluation rules and rubrics; assign evaluators or group assignments; manage enrollments for their classes (add/remove students); request or permit resubmissions; release or override scores for their classes; post announcements to class; comment on submissions and evaluation responses.
8. Restricted From: Global admin functions (creating/deleting organizations, managing platform-wide settings); editing classes or assignments owned by other bocals unless explicitly delegated; deleting other users or changing global roles.
9. Role: Admin
10. Can View: All dashboards, organizations, classes, assignments, submissions, evaluations, user accounts, system reports and logs; platform-wide analytics and configuration panels.
11. Can Create/Edit/Delete: Create and manage organizations; create, edit and remove user accounts and assign roles; manage allowed email lists and registration policies; reassign ownership of classes and resources; remove content or users across the platform; manage global settings, feature flags and integrations exposed in the frontend.
12. Restricted From: Low-level infrastructure operations (database migrations, server config) that are outside the frontend UI; direct access to backend-only admin tooling not exposed via the frontend.
13. Global Permission Rules: Role precedence (Admin > Bocal > Student). Users can act on resources when they are the resource owner or have explicit organizational scope. Bocal actions are scoped to their organization or classes they own. Admins have cross-organization access. All privilege-changing operations require audit logging and reviewer approval where applicable.

## 4) Information Architecture and Navigation
1. Primary Navigation Map: Dashboard; Classes; Evaluation; Progress; Profile; Bocal Panel (staff only); Admin Panel (admins only); Logout.
2. Route Access Rules by Role: Dashboard (Student, Bocal, Admin); Classes/Assignments/Evaluation (Student, Bocal, Admin); Bocal Panel (Bocal, Admin); Admin Panel (Admin only).
3. Entry Points (login/deep links): / (redirects to /login or /dashboard); /login; /dashboard; /classes; /class/:id; /assignments; /assignment/:id; /evaluation.
4. Redirect Rules (unauthorized/not found): Unauthenticated users -> /login; Authenticated but unauthorized -> /dashboard or /bocal (based on role); Unknown route -> show 404 page (or redirect to /login when appropriate).
5. Global Layout Regions (header/sidebar/content): Sidebar (left) - primary navigation; Content (main) - route content.

## 5) Journey Catalog
For each key journey:

### STU-01: Submit assignment (upload + confirm)
1. Journey ID and Name: STU-01: Submit assignment (upload + confirm)
2. Actor/Role: Student
3. Trigger: Student clicks 'Submit' on assignment detail page
4. Preconditions: enrolled; assignment deadline open; allowed file types; group membership (if group submission)
5. Happy Path Steps:
	- Open assignment detail page
	- Click "Submit"
	- Upload file(s) and add optional notes
	- Click "Confirm/Submit"
	- View confirmation and submission appears in "My Submissions" with status "Submitted"
6. Alternative Paths: group submission flow; submit via URL/external link; resubmission before deadline (replace file)
7. Error Paths: upload failure (network or size); validation error (wrong file type); permission denied (submission window closed); disk/storage errors. UI should show clear error message and retry option.
8. End State / Success Outcome: Confirmation message displayed; submission listed under "My Submissions" with status "Submitted" and timestamp.
9. Metrics/Events to Capture: submit_attempt, submit_success, submit_failure, time_to_submit, file_size

### STU-02: Complete peer evaluation (evaluate assigned submissions)
1. Journey ID and Name: STU-02: Complete peer evaluation (evaluate assigned submissions)
2. Actor/Role: Student
3. Trigger: Student receives a notification linking to an assigned submission to evaluate
4. Preconditions: the assignment is submitted by other student/group
5. Happy Path Steps:
	- Open assigned evaluation
	- Read submission and any supporting files or notes
	- Score according to rubric and add comments
	- Submit evaluation
	- Confirmation shown; evaluation moves to 'Completed'
6. Alternative Paths: none
7. Error Paths: network failure during save; submission missing or deleted; permission denied. UI should show clear error and allow retry or report issue.
8. End State / Success Outcome: Evaluation marked 'Completed' and confirmation displayed.
9. Metrics/Events to Capture: evaluation_submitted, time_to_evaluate, scores_distribution

### STU-03: View progress and grades
1. Journey ID and Name: STU-03: View progress and grades
2. Actor/Role: Student
3. Trigger: Student clicks 'Progress' in the nav or opens a class progress page
4. Preconditions: enrolled; at least one graded submission (or class has grading enabled)
5. Happy Path Steps:
	- Open progress page
	- See summary of overall progress and recent grades
	- Drill into class or assignment to view detailed grade and feedback
	- Optionally export or snapshot progress
6. Alternative Paths: No grades yet -> show helpful empty state with next steps; filter by class or date range
7. Error Paths: API failure or partial data -> show error state with retry and cached fallback where available
8. End State / Success Outcome: Grades and progress visualized clearly; ability to view feedback and history
9. Metrics/Events to Capture: progress_viewed, grade_viewed, average_score_over_time

### STU-04: Match evaluators to submissions
1. Actor/Role: System / Bocal
2. Trigger: Submission window closes or Bocal clicks "Assign reviewers"
3. Preconditions: Submissions finalized; evaluation rules defined (# evaluators, anonymity, conflicts)
4. Happy Path Steps: system computes matches (or Bocal reviews suggestions) → assign evaluator records created → notifications sent → evaluator queues updated
5. Alternative Paths: manual assignment by Bocal; hybrid (suggest + approve)
6. Error Paths: insufficient evaluators, conflicts detected, notification failures
7. End State: all submissions have required evaluators assigned (or Bocal acknowledged exceptions)
8. Metrics: assignments_assigned, time_to_assign, assignment_unassigned_count

### STU-05: Receive evaluation results & feedback
1. Actor/Role: Student
2. Trigger: Evaluations are completed and scores released by system/Bocal
3. Preconditions: Evaluations submitted and published
4. Happy Path Steps: notification -> open feedback -> view score + comments -> optionally respond/request clarification
5. Alternatives: results not yet published -> show pending state
6. Error Paths: missing feedback, permission denied, API errors
7. End State: student sees finalized score and reviewer comments
8. Metrics: evaluation_result_viewed, feedback_read

### STU-06: Appeal / request clarification on evaluation
1. Actor/Role: Student
2. Trigger: Student clicks "Request clarification" or "Appeal" on evaluation feedback
3. Preconditions: evaluation completed and feedback visible; appeals allowed per class policy
4. Happy Path Steps: open appeal form -> provide reason/evidence -> submit -> Bocal notified -> Bocal responds/decides
5. Alternatives: auto-escalation to Admin if policy requires
6. Error Paths: appeal not allowed, submission fails
7. End State: appeal recorded and response delivered to student
8. Metrics: appeals_submitted, appeals_resolved

### STU-07: Resubmission flow
1. Actor/Role: Student
2. Trigger: Bocal marks for resubmission or student requests resubmission and Bocal allows
3. Preconditions: resubmission permitted for assignment
4. Happy Path Steps: student edits/replaces submission -> confirm -> new submission recorded; previous submission archived
5. Alternatives: no resubmission allowed -> show informative message
6. Error Paths: deadline closed, upload fail
7. End State: new submission recorded, status updated
8. Metrics: resubmissions_count

### STU-08: Enroll / join class
1. Actor/Role: Student
2. Trigger: student clicks 'Join' or Bocal adds student to roster
3. Preconditions: enrollment open or student invited/allowed email
4. Happy Path Steps: enroll via class page or invitation -> confirmation -> class appears in dashboard
5. Error Paths: enrollment closed, not allowed email
6. End State: student enrolled and visible in class roster
7. Metrics: enrollments_created

### STU-09: Respond to reviewer comments / discussion
1. Actor/Role: Student
2. Trigger: student opens submission feedback and posts a reply/comment
3. Preconditions: comments enabled for submission or evaluation
4. Happy Path Steps: open discussion thread -> add comment -> notify reviewer/Bocal -> optionally close thread
5. Error Paths: commenting disabled, permission denied
6. End State: comment posted and visible in thread
7. Metrics: comment_posted, thread_closed

### STU-10: Update profile & settings
1. Actor/Role: Student
2. Trigger: user clicks Profile -> Edit
3. Preconditions: authenticated
4. Happy Path Steps: edit fields -> save -> confirmation and profile updated
5. Error Paths: validation error, API failure
6. End State: profile updated
7. Metrics: profile_updated

### Bocal Journeys (suggested)

### BOC-01: Create class & manage roster
1. Actor/Role: Bocal
2. Trigger: Bocal opens Bocal Panel -> Create class or Manage roster
3. Preconditions: Bocal authenticated and authorized for organization
4. Happy Path Steps: create class -> set metadata -> invite/import students -> confirm roster
5. Error Paths: invalid roster file, duplicate class
6. End State: class created and roster populated
7. Metrics: classes_created, roster_imports

### BOC-02: Create and publish assignments (with rubrics)
1. Actor/Role: Bocal
2. Trigger: Bocal clicks 'New Assignment'
3. Preconditions: class exists and Bocal has edit rights
4. Happy Path Steps: define assignment details -> add rubrics and evaluation rules -> publish -> assignments visible to students
5. Error Paths: validation errors, missing rubric
6. End State: assignment published
7. Metrics: assignments_published

### BOC-03: Configure evaluation assignment rules (auto/manual)
1. Actor/Role: Bocal
2. Trigger: Bocal opens assignment settings -> Evaluation rules
3. Preconditions: assignment exists
4. Happy Path Steps: set # evaluators, anonymity, conflict rules -> save -> rules enforced at assignment time
5. End State: evaluation rules active
6. Metrics: rules_updated

### BOC-04: Manual reviewer assignment & override
1. Actor/Role: Bocal
2. Trigger: Bocal chooses manual assignment in Bocal Panel
3. Preconditions: submissions exist and evaluators available
4. Happy Path Steps: select submissions -> pick reviewers -> confirm -> notifications sent
5. End State: manual assignments complete
6. Metrics: manual_assignments

### BOC-05: Review evaluation progress & release grades
1. Actor/Role: Bocal
2. Trigger: Bocal opens class evaluation dashboard
3. Preconditions: evaluators assigned and some evaluations completed
4. Happy Path Steps: review completion rates -> investigate flagged items -> release grades -> notify students
5. End State: grades released
6. Metrics: release_actions, evaluations_completed

### Admin Journeys (suggested)

### ADM-01: Organization and user management
1. Actor/Role: Admin
2. Trigger: Admin opens Admin Panel -> Users/Orgs
3. Preconditions: Admin authenticated
4. Happy Path Steps: create org -> create/manage users -> assign roles -> confirm
5. End State: org and user accounts updated
6. Metrics: orgs_created, users_managed

### ADM-02: Platform config, audits and feature flags
1. Actor/Role: Admin
2. Trigger: Admin opens platform settings
3. Preconditions: Admin authenticated
4. Happy Path Steps: change config/flag -> save -> changes applied and audited
5. End State: config updated and logged
6. Metrics: config_changes, audit_logs

### Cross-cutting Journeys

### CROSS-01: Notifications & reminders
1. Actor/Role: System
2. Trigger: deadlines approaching, assignments published, evaluations assigned
3. Preconditions: users have notification preferences
4. Happy Path Steps: system creates reminders -> deliver via configured channels -> users act
5. End State: notification delivered or retried on failure
6. Metrics: notifications_sent, notifications_failed

### CROSS-02: Reports & exports
1. Actor/Role: Bocal / Admin
2. Trigger: user requests export or scheduled report runs
3. Preconditions: data available and user authorized
4. Happy Path Steps: generate report -> provide download or email -> archive
5. End State: report delivered
6. Metrics: reports_generated

## 6) Story Backlog (Derived from Journeys)
For each journey below, the backlog lists concrete, assignable stories. Each story includes a brief acceptance criteria and basic metadata so you can convert to tickets.

### STU-01: Submit assignment (upload + confirm)
- STU-01.1: As a Student, I want to open the assignment detail and click Submit so that I can start uploading files. (Priority: Must)
	- Dependencies: assignment detail screen; auth
	- Acceptance: assignment page shows Submit button when enrolled and submission open.
	- UI states: loading, disabled, error
	- DoD: Submit button wired and visible for eligible users.
- STU-01.2: As a Student, I want to upload one or more files and see progress so that I can confirm successful upload. (Priority: Must)
	- Dependencies: file upload API, storage
	- Acceptance: files upload with progress; failures show retry option.
	- UI states: uploading, success, error
	- DoD: upload component integrated with API and shows progress.
- STU-01.3: As a Student, I want to confirm submission and see it in My Submissions so that I know it was submitted. (Priority: Must)
	- Dependencies: submit API, My Submissions endpoint
	- Acceptance: after confirm, submission appears in list with status 'Submitted'.
	- UI states: confirming, success, error
	- DoD: confirmation flow completes end-to-end.

### STU-02: Complete peer evaluation
- STU-02.1: As a Student, I want to open an assigned evaluation and view the submission so I can assess it. (Priority: Must)
	- Dependencies: evaluation queue API, file viewer
	- Acceptance: assigned item opens and shows files and rubric.
	- UI states: loading, empty, error
	- DoD: evaluation screen shows submission and rubric.
- STU-02.2: As a Student, I want to submit scores and comments so my evaluation is recorded. (Priority: Must)
	- Dependencies: evaluation submit API
	- Acceptance: submitting saves data and marks evaluation Completed.
	- UI states: saving, saved, error
	- DoD: evaluation persists and queue status updates.

### STU-03: View progress and grades
- STU-03.1: As a Student, I want to see an overview of my grades so I can track progress. (Priority: Should)
	- Dependencies: progress API
	- Acceptance: page shows overall score, recent grades, and links to details.
	- UI states: loading, empty, error
	- DoD: progress page displays mocked or real data.
- STU-03.2: As a Student, I want to drill into assignment feedback so I can read reviewer comments. (Priority: Should)
	- Dependencies: assignment detail + feedback API
	- Acceptance: feedback visible and timestamped.
	- DoD: feedback view works and links from progress.

### STU-04: Match evaluators to submissions
- STU-04.1: As a System, when submission window closes, generate evaluator assignments automatically per rules. (Priority: Must)
	- Dependencies: matching algorithm service, rules config
	- Acceptance: for each submission required matches created respecting constraints.
	- DoD: assignments created in DB and visible in admin console.
- STU-04.2: As a Bocal, I want to review and approve suggested matches so I can correct conflicts. (Priority: Should)
	- Dependencies: suggestion UI, manual assignment API
	- Acceptance: Bocal can accept/reject suggestions and save overrides.
	- DoD: manual override persists and updates evaluator queues.

### STU-05: Receive evaluation results & feedback
- STU-05.1: As a Student, I want to be notified when results are published so I can view feedback. (Priority: Should)
	- Dependencies: notifications service, published flag
	- Acceptance: notification sent and link opens feedback.
	- DoD: notification links to evaluation result page.
- STU-05.2: As a Student, I want to view consolidated feedback and score history. (Priority: Could)
	- Dependencies: historical grades API
	- Acceptance: history table loads and is exportable.
	- DoD: export CSV present.

### STU-06: Appeal / request clarification on evaluation
- STU-06.1: As a Student, I want to submit an appeal form with rationale so the Bocal can review. (Priority: Should)
	- Dependencies: appeal API, auth
	- Acceptance: form validates and creates an appeal record for staff.
	- DoD: appeal visible in Bocal panel.

### STU-07: Resubmission flow
- STU-07.1: As a Student, I want to replace my submission when resubmission is allowed so my latest work is evaluated. (Priority: Should)
	- Dependencies: resubmission flag, submit API
	- Acceptance: new file replaces old one and history preserved.
	- DoD: submission versioning recorded.

### STU-08: Enroll / join class
- STU-08.1: As a Student, I want to enroll in a class via invitation or open enrollment so I can access materials. (Priority: Must)
	- Dependencies: enroll API
	- Acceptance: successful enrollment adds class to dashboard.
	- DoD: roster updated.

### STU-09: Respond to reviewer comments / discussion
- STU-09.1: As a Student, I want to post comments on a submission thread so I can ask clarifying questions. (Priority: Could)
	- Dependencies: comments API
	- Acceptance: comment appears in thread and notifies participants.
	- DoD: comments persisted and visible.

### STU-10: Update profile & settings
- STU-10.1: As a Student, I want to edit my profile fields and save changes so my public info is up to date. (Priority: Could)
	- Dependencies: profile API
	- Acceptance: save persists and shows confirmation.
	- DoD: profile updated in UI and API.

### BOC-01: Create class & manage roster
- BOC-01.1: As a Bocal, I want to create a class with metadata so students can enroll. (Priority: Must)
	- Dependencies: class API
	- Acceptance: created class appears in Bocal panel.
	- DoD: class record persisted.
- BOC-01.2: As a Bocal, I want to import a roster (CSV) so I can add students in bulk. (Priority: Should)
	- Dependencies: roster import API
	- Acceptance: import shows preview, errors, and final commit.
	- DoD: students added to roster.

### BOC-02: Create and publish assignments
- BOC-02.1: As a Bocal, I want to define an assignment with deadlines and rubrics so students can submit. (Priority: Must)
	- Dependencies: assignment API, rubric editor
	- Acceptance: publishing makes assignment visible to enrolled students.
	- DoD: assignment appears in class and notifications sent.

### BOC-03: Configure evaluation assignment rules
- BOC-03.1: As a Bocal, I want to set #evaluators, anonymity, and conflict rules so the matching honors policy. (Priority: Must)
	- Dependencies: assignment settings API
	- Acceptance: settings saved and used by matcher.
	- DoD: rules reflected in match results.

### BOC-04: Manual reviewer assignment & override
- BOC-04.1: As a Bocal, I want to manually assign reviewers to a submission so I can handle exceptions. (Priority: Should)
	- Dependencies: manual assign API
	- Acceptance: manual assignment updates evaluator queues immediately.
	- DoD: UI shows assignment log.

### BOC-05: Review evaluation progress & release grades
- BOC-05.1: As a Bocal, I want to view evaluation completion rates and flagged items so I can act before releasing grades. (Priority: Must)
	- Dependencies: evaluation dashboard API
	- Acceptance: dashboard shows completion %, flagged issues, and quick links.
	- DoD: dashboard usable with live data.
- BOC-05.2: As a Bocal, I want to release grades to students so they receive final results. (Priority: Must)
	- Dependencies: release API, notification service
	- Acceptance: grades change state to Released and students are notified.
	- DoD: grades visible to students.

### ADM-01: Organization and user management
- ADM-01.1: As an Admin, I want to create an organization via the Admin panel so new orgs can onboard quickly. (Priority: Must)
	- Dependencies: admin/org API
	- Acceptance: org created from UI appears in Admin > Organizations list with name, slug, owner, and status.
	- DoD: form validates, API call succeeds, org listed and selectable in org-scoped views.

- ADM-01.2: As an Admin or Org Manager, I want to add users by email (single or bulk CSV) so members can be onboarded easily. (Priority: Must)
	- Dependencies: user invite API, email sending or invite-code mechanism
	- Acceptance: entering one or more emails sends invites (or creates accounts) and shows per-email status (invited, already member, invalid).
	- DoD: invite records created, optional account creation emails sent, UI shows success/errors and an "undo" for the last bulk import.

- ADM-01.3: As an Admin, I want to generate shareable invite links or codes so enrollment can be done without manual email invites. (Priority: Should)
	- Dependencies: invite-link API
	- Acceptance: generated link/code appears in UI, can be copy-pasted, and enrolling via the link associates the user with the org.
	- DoD: invite creation, revocation, and a usage metric visible in the org details.

- ADM-01.4: As an Admin, I want soft-suspend and soft-delete for user accounts so deletions are reversible and data is preserved. (Priority: Should)
	- Dependencies: user management API
	- Acceptance: suspend disables login but preserves data; soft-delete marks account and provides a recovery window in the UI.
	- DoD: suspended users cannot authenticate; soft-deleted users appear in an "archived" list with a restore action.

- ADM-01.5: As an Admin, I want lightweight audit logs for key actions (org create, invite, role change, suspend) so we can trace admin activity without heavy retention. (Priority: Should)
	- Dependencies: audit log service
	- Acceptance: key admin actions are logged with actor, timestamp, and brief reason; logs exportable as CSV for a limited date range.
	- DoD: audit entries visible in Admin > Audit for recent actions.

### ADM-02: Platform config, audits and feature flags
- ADM-02.1: As an Admin, I want to toggle feature flags and change platform settings with audit logging so changes are reversible. (Priority: Should)
	- Dependencies: admin config API, audit log
	- Acceptance: toggle saved and audit recorded.
	- DoD: audit entries present.

### CROSS-01: Notifications & reminders
- CROSS-01.1: As a System, I want to send deadline reminders to configured users so evaluations and submissions are completed on time. (Priority: Must)
	- Dependencies: notification scheduler
	- Acceptance: reminders enqueued and delivered according to preferences.
	- DoD: retry logic in place for failures.

### CROSS-02: Reports & exports
- CROSS-02.1: As a Bocal/Admin, I want to generate and download reports (CSV/PDF) for a class so I can analyze performance. (Priority: Could)
	- Dependencies: reporting API
	- Acceptance: report generated and downloadable.
	- DoD: report matches requested parameters.