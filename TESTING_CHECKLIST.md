# Platform Testing Checklist

How to use this file:
- Go through each item, test it in the browser.
- Mark `[x]` when it works correctly.
- If something is broken or needs a change, leave it `[ ]` and write a line under it sta rting with `ISSUE:` describing what's wrong. Example:
  ```
  - [] Reorder button on Orders page
    ISSUE: clicking Reorder does nothing, no toast, no network request
  ```
- When you're done with a section (or the whole thing), tell me and I'll read this file and fix everything marked with an `ISSUE:`.

---

## 0. Setup / Accounts needed
- [ x ] One buyer account (or register a new one)
- [ ] One seller account (approved by admin)
- [ ] One admin account
- [ ] At least 2-3 products created by the seller, with stock
- [ ] At least one order placed end-to-end (buyer → seller → admin) before testing the deeper flows below

---

## 1. Auth (all roles)
- [ x ] Register as buyer
- [ ] Register as seller (goes to pending approval)
- [ ] Login as buyer
- [ ] Login as seller
- [ ] Login as admin
- [ ] Logout works and redirects correctly
- [ ] Visiting a `/buyer/*` page while logged out doesn't crash (no forced redirect expected, but page should handle missing user gracefully)
- [ ] Visiting a `/seller/*` or `/admin/*` page while logged out redirects to `/login`

---

## 2. Buyer — Dashboard (`/buyer/dashboard`)
- [ x ] Stat cards show correct numbers: Total Orders, Total Spend, Pending, In Transit, Completed, Saved Products
- [ x ] Recent Orders list shows the 5 most recent orders
- [ ] Order Status Timeline widget shows correct step progress for an active order
- [ ] Notifications section shows something sensible (or empty state)
- [ ] Saved Products preview shows saved items (or empty state) and links work
- [ ] Quick Links in sidebar navigate to the right pages

## 3. Buyer — Orders (`/buyer/orders`)
- [ ] Orders list loads and shows correct status badges
- [ ] **Cancel** button appears only for `pending` orders and actually cancels
- [ ] **Request Cancellation** button appears for `in-production`/`ready` orders, sends request, shows "pending supplier approval" message
- [ ] **Reorder** button creates a new order (check it shows up in the list / triggers toast)
- [ ] **Return / Refund** button only shows for `delivered` orders, opens dialog, submitting works and shows confirmation
- [ ] **Download Invoice** button — if invoice doesn't exist yet, shows a clear error; if it exists, downloads a PDF that opens correctly
- [ ] Production progress bar shows correct % for orders with `unitsCompleted`
- [ ] Seller updates timeline expands/collapses and shows messages with timestamps
- [ ] Tracking number + carrier show up once a seller adds them

## 4. Buyer — Quote Requests / RFQs (`/buyer/rfqs`)
- [ ] List of RFQs loads with correct status (Awaiting Quote / Quoted / Accepted / Rejected)
- [ ] Quoted RFQs show price, lead time, notes, and total
- [ ] **Accept Quote** creates a real order and updates status to Accepted
- [ ] **Reject** works and updates status
- [ ] **Negotiate** button opens chat panel, can send and receive messages tied to that specific RFQ
- [ ] Chat messages persist after closing/reopening the panel
- [ ] If an RFQ has a `requestGroupId` (sent to multiple sellers), **Compare Quotes** link appears
- [ ] `/buyer/rfqs/compare/[groupId]` page shows all sellers' quotes side by side
- [ ] Best price and best lead time are visually highlighted
- [ ] **Accept This Quote** from the comparison page creates an order and redirects to Orders

## 5. Buyer — Procurement Center (`/buyer/procurement`)
- [ ] "New Purchase Request" dialog opens and submits correctly (productId, quantity, budget, justification)
- [ ] Recurring request checkbox + interval field work
- [ ] List shows all requests with correct status badges
- [ ] **Approve** on a `pending-approval` request converts it into a real order and decrements stock
- [ ] **Reject** sets status to rejected
- [ ] Already-converted/rejected requests no longer show approve/reject buttons

## 6. Buyer — Supplier Management (`/buyer/suppliers`)
- [ ] Saved sellers list loads with performance stats (totalOrders, totalSpend, onTimeRate)
- [ ] **Rate** (star widget) saves a rating
- [ ] **Chat** button opens chat panel scoped to that specific buyer-seller pair
- [ ] Sending a message in supplier chat works and persists
- [ ] **Remove** (trash icon) unsaves a seller and removes it from the list
- [ ] (If built) Compare Sellers / multi-seller comparison works — confirm whether this exists; if not, note it as a known gap, not a bug

## 7. Buyer — Support Center (`/buyer/support`)
- [ ] "Raise Ticket" dialog opens, category dropdown works, submits correctly
- [ ] New ticket appears in "My Tickets" list with correct status
- [ ] FAQ accordion items expand/collapse correctly
- [ ] Ticket status badge colors match status (open/in-progress/resolved/closed)

## 8. Buyer — Returns/Refunds + Credit Balance
- [ ] Return/Refund request (from Orders page) submits successfully
- [ ] Credit balance shows up correctly after a return is approved (check Payments page or wherever it's displayed)
- [ ] Duplicate return request on the same order is blocked with a clear message

## 9. Buyer — Analytics (`/buyer/analytics`)
- [ ] Stat cards show Total Orders, Total Spend, Top Suppliers count
- [ ] Spend Trend bar chart renders with hover tooltips showing $ amounts
- [ ] Orders by Status bar list renders correctly proportioned bars
- [ ] Top Suppliers by Spend list shows correct names, totals, order counts
- [ ] Empty states show correctly for a brand-new buyer with no orders

## 10. Buyer — Profile & Company (`/buyer/profile`)
- [ ] Name, company name, tax ID fields load existing values and save correctly
- [ ] Email field is read-only (cannot be edited)
- [ ] Adding a company address works, removing one works
- [ ] Adding a document (name + URL) works and shows in the list with a working link
- [ ] Notification toggles (email/sms/push) save correctly
- [ ] "Save Changes" button shows success toast and persists after page refresh

## 11. Buyer — Shipment & Tracking (`/buyer/shipments`)
- [ ] Only orders with status ready/shipped/delivered show up here
- [ ] Tracking number + carrier display correctly when present
- [ ] Timeline (Ready → Shipped → Delivered) highlights the correct current step
- [ ] Delivery proof link shows and opens when present
- [ ] Empty state shows correctly when buyer has no shipments yet

## 12. Buyer — Navbar
- [ ] All new links present in desktop dropdown: Procurement, Suppliers, Shipments, Analytics, Support, Profile & Company
- [ ] All links present and working in mobile menu
- [ ] Every link actually navigates to the correct, working page (no 404s)

---

## 13. Seller — Shipments & Tracking (`/seller/shipments`)
- [ ] Tracking dialog: leaving Tracking Number blank and saving still works (auto-generates an ID like `TRK-YYYYMMDD-XXXXXX`)
- [ ] Manually entering a tracking number still works and overrides auto-generation
- [ ] Saving tracking on a `ready` order bumps its status to `shipped`
- [ ] "Mark as Delivered" works on shipped orders
- [ ] Status filter dropdown (All/Ready/Shipped/Delivered) filters correctly

## 14. Seller — other existing pages (regression check only)
- [ ] Seller dashboard still loads correctly
- [ ] Seller products page still loads/edits correctly
- [ ] Seller orders page still loads correctly
- [ ] Seller RFQs — submitting a quote still works
- [ ] Seller analytics still loads
- [ ] Seller payments still loads
- [ ] Seller profile still loads/saves

---

## 15. Admin — Dashboard (`/admin/dashboard`)
- [ ] "Production Expenses" card shows month total in main number, and "This month · $X today" in the sub-line with a correct today's value
- [ ] "Profit / Loss" card shows month total + today's profit/loss in the sub-line, correctly signed (+/-)
- [ ] All other existing cards/charts still render correctly (Orders Overview, Production Progress, Low Stock, Revenue vs Profit, Top Selling, Recent Orders, Order Timeline, Recent Alerts)

## 16. Admin — Finance (`/admin/finance`)
- [ ] "Today" / "This Month" toggle switches all three top cards (Revenue, Expenses, Profit) to the correct values for that range
- [ ] Numbers visibly change between Today and This Month (don't just stay identical unless that's genuinely correct for a quiet day)
- [ ] Expenses by Category breakdown still correct
- [ ] 30-Day Revenue vs Expenses chart still renders
- [ ] Recording a new expense works and updates totals
- [ ] Deleting an expense works and updates totals

## 17. Admin — Order Management (`/admin/orders`)
- [ ] Tracking section: leaving Tracking Number blank and saving auto-generates an ID
- [ ] Manually entering a tracking number still works
- [ ] **Tax %** input next to "Generate Invoice" — entering a value (e.g. 5) and generating produces an invoice with that tax applied (check the PDF or the invoice total math: total = subtotal + subtotal*tax%)
- [ ] Leaving Tax % blank generates invoice with 0% tax (no crash)
- [ ] Generating a second invoice for the same order is blocked with a clear message (no duplicate invoices)
- [ ] WhatsApp share link appears after generating and opens correctly
- [ ] Status change dropdown still works
- [ ] Production stage dropdown still works
- [ ] Posting a production update still works and shows in the update list

## 18. Admin — Invoices (`/admin/invoices`)
- [ ] List shows all generated invoices with correct invoice #, order, buyer, total, date
- [ ] PDF download link opens/downloads correctly
- [ ] WhatsApp share link works
- [ ] Pagination works if more than 20 invoices exist

## 19. Admin — other existing pages (regression check only)
- [ ] Inventory page loads correctly
- [ ] Production page loads correctly
- [ ] Products moderation page loads correctly
- [ ] Sellers approval page loads correctly (approve/reject pending sellers)
- [ ] Users page loads correctly
- [ ] Alerts page loads correctly
- [ ] Inquiries page loads correctly

---

## 20. Cross-cutting / edge cases worth poking at
- [ ] Negotiation chat (RFQ) and Supplier chat (seller-chat) don't leak messages between threads — open two different RFQs/sellers and confirm each chat only shows its own messages
- [ ] A seller cannot read/post into a buyer's RFQ chat with a *different* seller (authorization check)
- [ ] A buyer cannot approve/reject another buyer's procurement requests via direct API/URL manipulation
- [ ] Refreshing mid-flow (e.g. mid-dialog) doesn't lose critical data unexpectedly
- [ ] Mobile/responsive check on at least: Buyer Dashboard, Orders, Suppliers, Admin Finance

---

## Notes / Issues Found
*(Free-form space — list anything that doesn't fit neatly above, or anything you want changed even if not strictly "broken")*

-
