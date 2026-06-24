# TODO

## Knowledge Base + Ticketing Fixes

- [x] Fix client service module issues (ticketService exports/attachments)
- [x] Fix KnowledgeBase frontend 401s via token refresh logic
- [x] Fix React duplicate key warning in EmployeeDashboard DonutChart
- [ ] Fix KnowledgeBase API 500 on GET /api/kb/articles/:id
  - [x] Create migration to add missing kb_articles metric columns (views/helpful_yes/helpful_no/approved_by/approved_at)
  - [ ] Run migrations: `php artisan migrate`
  - [ ] Re-test KB article open: `/employee/knowledge-base`

- [ ] Address any remaining console warnings/errors (if any)

