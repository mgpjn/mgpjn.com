# Healthcare homepage and member joining activity

The website replaces the festival header, coupon hero and promotional cards with medical banners and an evergreen healthcare section. Banner photographs are self-hosted WebP files in 640px and 1600px sizes, with responsive sources and descriptive alt text. Sources are the existing Unsplash medical photographs photo-1584308666744-24d5c474f2ae and photo-1631549916768-4119b2e5f926.

The live database already saves every member's registration time in `users.created_at` in UTC. At inspection, all 38 members had timestamps. The display lost time: direct referrals formatted only the date, the genealogy API formatted dates without time, and the hierarchy directory omitted registration details. The frontend now renders date and time explicitly in Asia/Kolkata, including admin member views, referrals, hierarchy, recent joins and the tree. Missing historical times display “Not recorded”. Registration time is account creation, not KYC approval or first purchase.

Member activity supports direct/all-downline scope, server-side search, IST calendar-date filters, newest/oldest sorting and pagination. The referral dashboard refreshes recent team joins through its existing 15-second refresh. Sponsor is the current direct parent in the existing sponsor hierarchy. No new placement hierarchy or commission logic is introduced. The team endpoint derives scope from the authenticated user, with no client-selected owner ID. Invalid explicit referral codes return validation errors rather than silently falling back to another sponsor. Hierarchy creation and updates reject cross-network mutations for non-admin partners.

Backend release files (outside this Git repository):

- `app/Http/Controllers/Api/AuthController.php`
- `app/Http/Controllers/Api/HierarchyController.php`
- `app/Http/Controllers/Api/MlmController.php`
- `app/Services/MlmService.php`
- `routes/api.php`
- `database/migrations/2026_10_20_000001_refresh_healthcare_banners_and_member_index.php`
- `tests/Feature/MemberTrackingTest.php`

Migration adds a composite sponsor/created_at/id index, updates the two known original banner records and disables festival banner/coupon promotions. Historical coupon redemption and orders are retained. No dates, wallet balances or commission records are backfilled.

Validation: Laravel 27 tests / 180 assertions; 6 Node unit tests; isolated Chrome website login/signup/checkout/PIN suite and member activity/responsive banner suite. The member browser suite covers 390, 768 and 1440px, image loading, absence of festival text, pagination, sponsor/status, IST times, unknown dates, empty/error/retry states, recent joins and tree. Browser API fixtures are mocked; production checks are documented separately in the workspace release report.

## Production verification

- Hostinger targeted migration and route cache completed successfully. Backup: `/home/u835925164/deployment_backups/mgpjn-redesign-20261020-065905`, with 0700 directory / 0600 files and gzip integrity verified.
- A temporary registration through the deployed Laravel HTTP kernel, inside a transaction, confirmed server UTC time, correct sponsor, direct/team visibility, recent activity and tree time. A child could not see its upline as a downline; guests received 401. All synthetic users/tokens were rolled back and user count remained 38. MySQL auto-increment sequences may advance through rolled-back inserts.
- Hashes of all existing users, 62 orders, 49 commission records, 56 wallet transactions and 1 payout matched the predeployment snapshot. Commission and payout calculations were not changed.
- Public production Chrome checks passed at 390/768/1440px: medical images loaded, no festival text, no page overflow or JavaScript errors. Private frontend pages redirected to login and private member endpoints returned 401 to guests. Active public coupons excluded the retired campaign.
- Product commit `39f57bc17ef013bb8be786e6294ca10fded0dce4` was pushed to `mgpjn/mgpjn.com` / `main`; GitHub reported successful automatic Vercel deployment. Hostinger frontend files were updated as well.
- Existing withdrawal/admin browser suite passed using mocked requests; no actual order, payout or transfer was submitted. Existing Vite large-bundle warning remains.
