┌───────────────────────────────┐
│ 1️⃣ User Installs Extension    │
│ - First launch: show prompt   │
│ - Explain: data collection    │
│   for free version funding    │
│ - Paid version: no data       │
│ - User Opt-In or Opt-Out      │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ 2️⃣ Consent Management        │
│ - Store consent in chrome.storage │
│ - Only proceed if user opts in │
│ - Skip tracking if paid version │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ 3️⃣ Tab Tracking (Top 10)     │
│ - Track up to 10 priority tabs │
│ - Map URLs → categories        │
│ - Measure active time per tab  │
│ - Periodically prune to top 10 │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ 4️⃣ Aggregation & Batching    │
│ - Aggregate time per category │
│ - Prepare anonymized batch     │
│ - Pseudonymous user ID         │
│ - Batch interval: e.g., 15min │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ 5️⃣ Secure API Transmission   │
│ - Send batch via HTTPS         │
│ - Backend stores anonymized    │
│   data only                    │
│ - No URLs, no personal info    │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ 6️⃣ Backend Aggregation       │
│ - Aggregate across all users  │
│ - Produce category-level stats│
│ - Optional: expose API to     │
│   brokers or analytics clients│
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│ 7️⃣ Monetization / Reporting  │
│ - Brokers access aggregated    │
│   usage patterns               │
│ - Paid version: no data collected │
│ - Free version funds development │
└───────────────────────────────┘
