# TODO - Attachments display + role-aware dashboard analytics

## Step 1: Attachments (minimal frontend change)
- [x] Confirm `TicketController@show` already serializes `ticket.attachments`.
- [x] Update `client/src/pages/manager/Tickets/TeamTicketDetail.jsx` to render `ticket.attachments`:
  - clickable download for all attachments
  - inline preview for images (png/jpg/jpeg)
  - open PDF in new tab



## Step 2: Dashboard analytics (Employee + Manager)
- [ ] Create backend endpoints under `/api/dashboard/...` that return real DB-driven datasets.
- [ ] Update `client/src/pages/employee/Dashboard/Dashboard.jsx` to:
  - fetch role-aware stats (only own tickets)
  - render KPI cards + Recharts charts.
- [ ] Update `client/src/pages/manager/Dashboard/Dashboard.jsx` to:
  - fetch role-aware stats (all tickets)
  - render KPI cards + Recharts charts.

## Step 3: Wiring / verification
- [ ] Ensure modified endpoints are added to `server/routes/api.php`.
- [ ] Verify no auth/routing breaks.
- [ ] Smoke test:
  - open a ticket detail page and confirm attachments render
  - open both dashboards and confirm charts render with real data.

