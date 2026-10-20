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
