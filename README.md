# CampusCred Trust

### A campus-native trust and credit infrastructure for student-to-student lending

CampusCred Trust is a campus-focused financial trust platform designed to make peer-to-peer lending between students more transparent, accountable, and trust-driven.

Instead of relying entirely on personal familiarity when lending money to another student, CampusCred creates a persistent digital identity around campus financial behavior through a **CampusCred ID**, **CampusCred Score**, and a structured **loan lifecycle**.

The platform allows students to discover other students, evaluate their campus trust profile, create loan requests, accept or decline requests, track active loans, record repayments, and build a history of responsible financial behavior.

> **Core idea:**
> **Campus identity → Transaction history → Repayment behavior → Trust signal**

---

## 🚀 Why CampusCred?

Student-to-student lending happens frequently inside colleges.

Examples include:

* "Can you lend me ₹500 until tomorrow?"
* "I forgot my wallet."
* "Can you pay the mess bill for me?"
* "I'll return the money after my stipend arrives."
* "Can you lend me money for an emergency?"

The problem is not always access to money.

The problem is **trust**.

Students usually make lending decisions using:

* Personal familiarity
* WhatsApp conversations
* Verbal promises
* Reputation among friends
* Informal records
* Memory of previous transactions

These methods do not create a persistent, structured trust layer.

CampusCred attempts to solve this by creating a **campus-native financial reputation system**.

---

# 🎯 Problem Statement

Peer-to-peer lending within campuses is informal and largely trust-based.

There is usually no standardized mechanism for:

* Identifying a student consistently
* Checking their previous repayment behavior
* Tracking outstanding loans
* Recording successful repayments
* Understanding a student's campus financial reputation
* Creating accountability around informal lending

As a result, students face uncertainty before lending money.

CampusCred introduces a structured trust layer between students.

---

# 💡 Our Solution

CampusCred provides every student with a unique **CampusCred ID**.

Example:

```text
CC7X4K2P
```

This identity is connected to a student's campus profile and trust score.

A student can then:

```text
Search Student
      ↓
View CampusCred Profile
      ↓
Evaluate Trust Score
      ↓
Create / Accept Loan
      ↓
Track Loan
      ↓
Repayment
      ↓
Trust Score Update
      ↓
Stronger Financial Reputation
```

The objective is to turn informal campus lending into a transparent and traceable process.

---

# ⭐ Core Features

## 1. CampusCred ID

Every registered student receives a unique CampusCred identifier.

Example:

```text
CC7X4K2P
```

The identifier provides a simple way to find another student inside the CampusCred ecosystem.

CampusCred IDs are generated server-side and checked for uniqueness before assignment.

---

## 2. CampusCred Score

Every student has a numerical trust score.

The dashboard visualizes the score using a dedicated score indicator and trust tier.

Current score ranges:

| Score | Tier           |
| ----- | -------------- |
| 0–30  | Red Flag       |
| 30–50 | Risky          |
| 50–70 | Neutral        |
| 70–85 | Trusted        |
| 85+   | Highly Trusted |

The score is intended to represent historical behavior within the CampusCred ecosystem rather than acting as a conventional banking credit score.

---

## 3. Student Search

Students can search for another campus member using their CampusCred ID.

Example:

```text
Enter CampusCred ID
        ↓
Find Profile
        ↓
View Student Information
        ↓
View CampusCred Score
```

This provides a lightweight trust-discovery mechanism before initiating a transaction.

---

## 4. Student Profiles

A CampusCred profile contains information such as:

* CampusCred ID
* Full name
* College
* Academic year
* Profile image
* Contact information where available
* CampusCred Score

The profile becomes the student's persistent identity within the platform.

---

# 💰 Peer-to-Peer Loan Management

CampusCred provides a structured lifecycle for student loans.

### Loan states

```text
Requested
   ↓
Active
   ↓
Repaid
```

Other terminal states include:

```text
Cancelled
Defaulted
Disputed
```

This allows the system to represent the complete lifecycle of an informal student loan.

---

# 🔄 Loan Lifecycle

### Step 1 — Create Request

A student creates a loan request containing information such as:

* Borrower
* Lender
* Amount
* Purpose
* Due date
* Notes

Example:

```text
Amount: ₹1,500
Purpose: Emergency expense
Due Date: 15 October 2026
Status: Requested
```

---

### Step 2 — Accept / Decline

The other party can:

```text
Accept → Active Loan
Decline → Cancelled
```

The initiating student can also cancel a pending request.

---

### Step 3 — Active Loan

Once accepted, the loan becomes active.

The dashboard can show:

* Active loans
* Money lent
* Money borrowed
* Outstanding amount
* Due dates
* Recent activity

---

### Step 4 — Repayment

Once the borrower repays the amount, the loan can be marked as repaid.

The lender can also confirm the repayment.

This creates a recorded transaction history.

---

### Step 5 — Default / Closure

Loans can also be marked as:

```text
Defaulted
Cancelled
```

This allows the platform to preserve the outcome of the transaction rather than simply deleting it.

---

# 📊 Personal Financial Dashboard

The dashboard provides a centralized view of a student's CampusCred activity.

It includes:

### Trust information

* CampusCred Score
* Trust tier
* CampusCred ID

### Loan statistics

* Active Loans
* Loans Given
* Loans Taken
* Outstanding Amount

### Activity

* Recent Loans
* Recent Repayments

### Quick Actions

* Create Loan Request
* Search by CampusCred ID

The dashboard is designed to make a student's campus financial activity understandable at a glance.

---

# 🔐 Authentication & Security

CampusCred uses Supabase Authentication for user identity and session management.

Authentication supports persistent sessions and automatic token refresh.

The application retrieves the authenticated user's identity before accessing their CampusCred profile and loan information.

Sensitive database operations are protected using database-level controls rather than relying exclusively on frontend logic.

---

# 🛡️ Row-Level Security

Database access is protected using Supabase/PostgreSQL Row-Level Security policies.

The security model is designed around authenticated users and their relationship to the underlying records.

This is particularly important for loan data because financial relationships should not be exposed indiscriminately to every user.

Database functions that perform sensitive operations are also restricted from unrestricted public execution.

---

# 🧠 Trust Score Architecture

CampusCred treats trust as a **behavioral signal derived from platform activity**.

The conceptual model is:

```text
                  ┌─────────────────┐
                  │ Student Profile │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ CampusCred ID   │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Loan Activity   │
                  └────────┬────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        Requested       Active        Repaid
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                  ┌─────────────────┐
                  │ Score Events    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ CampusCred      │
                  │ Score           │
                  └─────────────────┘
```

The database contains a score-event mechanism so that score changes can be associated with specific events rather than being treated as an unexplained number.

---

# 🧾 Score Events

Instead of storing only a final score, the system maintains score-related events.

Conceptually:

```text
Student
   │
   ├── Loan Created
   ├── Loan Accepted
   ├── Loan Repaid
   ├── Loan Defaulted
   └── Other Trust Events
             │
             ▼
       Score Event
             │
             ▼
      CampusCred Score
```

This architecture provides a foundation for making the score more explainable and auditable.

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────┐
│                 Frontend                 │
│                                          │
│ React + TypeScript + TanStack Router     │
│ Tailwind CSS + UI Components             │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│            Application Layer             │
│                                          │
│ React Query                              │
│ CampusCred Services                      │
│ Authentication Logic                     │
│ Loan State Management                    │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│                Supabase                 │
│                                          │
│ Authentication                           │
│ PostgreSQL                               │
│ Row-Level Security                       │
│ Database Functions                       │
│ Database Triggers / Logic                │
└──────────────────────────────────────────┘
```

---

# 🗄️ Data Model

The system is centered around several important entities.

## Profiles

Represents a CampusCred user.

Important fields include:

```text
id
campuscred_id
full_name
college
year
avatar_url
phone
score
email
```

---

## Loans

Represents a peer-to-peer lending relationship.

Important fields include:

```text
id
lender_id
borrower_id
amount
purpose
due_date
status
initiator_id
created_at
funded_at
repaid_at
notes
```

Loan statuses include:

```text
requested
active
repaid
defaulted
cancelled
disputed
```

---

## Score Events

Represents events that affect or explain a user's trust score.

This creates the foundation for an event-driven reputation system rather than a completely opaque score.

---

# 🧩 Project Structure

A simplified view of the project:

```text
campus-cred-trust/
│
├── src/
│   ├── components/
│   │
│   ├── integrations/
│   │   └── supabase/
│   │
│   ├── lib/
│   │   ├── campuscred.ts
│   │   └── auth.ts
│   │
│   ├── routes/
│   │   ├── _authenticated/
│   │   │   ├── dashboard
│   │   │   ├── loans
│   │   │   └── search
│   │   │
│   │   └── authentication/
│   │
│   └── ...
│
├── supabase/
│   └── migrations/
│
├── public/
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

# 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* TanStack Router
* TanStack Start
* React Query
* Tailwind CSS
* Lucide Icons

### Backend / Database

* Supabase
* PostgreSQL
* Supabase Auth
* Row-Level Security
* PostgreSQL Functions
* Database migrations

### Development

* Vite
* Bun / npm
* Git
* GitHub

---

# ⚙️ Getting Started

## Prerequisites

Make sure the following are installed:

```text
Node.js
npm
Git
```

You also need a Supabase project.

---

## 1. Clone the Repository

```bash
git clone https://github.com/ADxSD-143/campus-cred-trust.git
```

Move into the project:

```bash
cd campus-cred-trust
```

---

## 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

---

## 3. Configure Environment Variables

Create a `.env.local` file.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit private credentials or secret keys to GitHub.

---

# ▶️ Running Locally

Start the development server:

```bash
npm run dev
```

Or:

```bash
bun run dev
```

Then open the local development URL shown in the terminal.

---

# 🔑 Environment Configuration

CampusCred requires the following Supabase configuration:

| Variable                        | Purpose                         |
| ------------------------------- | ------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable client key |

The application reads these values when initializing the Supabase client.

---

# 🔒 Security Principles

CampusCred is designed around several security principles:

### Authentication-first access

Users must be authenticated before accessing protected application functionality.

### Database-level authorization

Authorization is enforced through PostgreSQL/Supabase policies rather than relying exclusively on UI restrictions.

### No secret credentials in frontend code

Only publishable Supabase configuration should be exposed to the client.

### Persistent transaction records

Loan state changes are recorded instead of simply deleting transaction history.

---

# 🎨 Product Philosophy

CampusCred is intentionally designed around three principles.

### 1. Trust should be visible

Students should have a simple signal that helps them understand the financial reputation of another campus member.

### 2. Transactions should be accountable

A verbal promise should become a structured transaction with:

```text
Amount
Purpose
Due Date
Status
Participants
Repayment State
```

### 3. Reputation should be earned

A CampusCred Score should evolve from platform behavior rather than being manually assigned.

---

# 🔮 Future Scope

CampusCred is designed to evolve beyond simple peer-to-peer lending.

Potential future capabilities include:

## Campus Verification

Integration with institutional email or student identity verification.

```text
College Email
      ↓
Student Verification
      ↓
Verified Campus Identity
```

---

## Explainable Trust Score

Instead of displaying only:

```text
CampusCred Score: 82
```

the platform could explain:

```text
82 CampusCred Score

+ Successful repayments
+ On-time repayment history
+ Consistent transaction behavior
- Overdue loans
- Defaults
```

This would make the trust score more interpretable.

---

## Fraud & Abuse Detection

Future versions could detect suspicious patterns such as:

* Multiple accounts
* Circular lending
* Unusual transaction patterns
* Coordinated score manipulation
* Repeated defaults
* Suspicious account activity

---

## Dispute Resolution

The existing loan model supports a `disputed` state, providing a foundation for a future structured dispute-resolution workflow.

Possible workflow:

```text
Loan Dispute
     ↓
Evidence Submission
     ↓
Review
     ↓
Resolution
     ↓
Score Adjustment
```

---

## Campus-Wide Trust Graph

A future version could model relationships between students and transactions as a graph.

```text
Student A
   │
   │ ₹1000
   ▼
Student B
   │
   │ ₹500
   ▼
Student C
```

This could enable more sophisticated fraud detection and reputation analysis.

---

## AI-Powered Risk Analysis

Future iterations could use machine learning to identify transaction-level risk patterns.

Potential signals:

* Historical repayment behavior
* Loan frequency
* Loan amount
* Repayment delays
* Default history
* Transaction patterns
* Account activity

Important principle:

> AI-generated risk signals should assist decision-making rather than automatically determine whether a student is trustworthy.

---

# 🌍 Long-Term Vision

CampusCred can evolve from a simple student lending application into a broader **campus trust infrastructure**.

Potential ecosystem:

```text
                 CampusCred
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
   Lending       Identity       Reputation
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
              Campus Trust Layer
```

The long-term goal is to create a reusable trust layer for campus communities.

---

# 📈 Example User Journey

Consider a student named Rahul.

Rahul needs ₹1,000 for an emergency expense.

Instead of asking someone through an informal message:

```text
"Bro can you lend me ₹1000?"
```

Rahul creates a CampusCred loan request.

```text
Amount: ₹1,000
Purpose: Emergency expense
Due Date: 10 October
```

Another student searches Rahul's CampusCred ID.

They can see Rahul's campus profile and trust score before deciding whether to proceed.

If the request is accepted:

```text
Requested
    ↓
Active
    ↓
Repaid
```

The successful repayment becomes part of Rahul's CampusCred history.

Repeated responsible behavior can therefore contribute to a stronger campus reputation.

---

# 🧪 Current Implementation

The current application includes:

* Student authentication
* CampusCred profile
* Unique CampusCred ID
* CampusCred Score visualization
* Trust tiers
* Student search by CampusCred ID
* Loan creation
* Loan requests
* Loan acceptance
* Loan cancellation
* Loan repayment
* Loan default state
* Loan detail pages
* Lender / borrower identification
* Due-date tracking
* Personal loan dashboard
* Recent loan activity
* Recent repayment activity
* Supabase persistence
* PostgreSQL-backed data model
* Row-Level Security
* Score event infrastructure

The dashboard consumes profile and loan data from Supabase and provides aggregated views such as active loans, loans given, loans taken, outstanding amount, recent loans, and recent repayments.

Loan detail pages support the core transaction lifecycle, including accepting requests, declining/cancelling requests, recording repayments, and marking active loans as defaulted.

---

# ⚠️ Important Product Boundary

CampusCred Score is a **platform-specific trust signal**.

It is not intended to be:

* A bank credit score
* A government financial rating
* A guarantee that a person will repay
* A replacement for institutional verification
* A legally binding assessment of creditworthiness

The score should be interpreted within the context of the CampusCred ecosystem.

---

# 🤝 Contributing

Contributions are welcome.

Typical contribution workflow:

```bash
git checkout -b feature/your-feature
```

Make your changes, test them locally, then:

```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

Open a Pull Request describing:

* What changed
* Why it changed
* How it was tested
* Any database migrations required

---

# 🗺️ Roadmap

### Phase 1 — Foundation

* [x] Authentication
* [x] CampusCred ID
* [x] Student profiles
* [x] CampusCred Score
* [x] Student search
* [x] Loan creation
* [x] Loan lifecycle

### Phase 2 — Trust Infrastructure

* [x] Score event architecture
* [x] Loan history
* [x] Repayment tracking
* [x] Database security policies

### Phase 3 — Advanced Trust

* [ ] Explainable score breakdown
* [ ] Campus verification
* [ ] Dispute workflow
* [ ] Fraud detection
* [ ] Trust graph
* [ ] Advanced risk analytics

### Phase 4 — Campus Ecosystem

* [ ] Institutional integration
* [ ] Campus-wide deployment
* [ ] Multi-campus support
* [ ] Advanced analytics
* [ ] Mobile application

---

# 📜 License

This project is currently developed as a project/hackathon application.

Add the appropriate license here when the project is ready for open-source distribution.

---

# 👥 Team

Built by the CampusCred team.

**Project:** CampusCred Trust
**Repository:** `ADxSD-143/campus-cred-trust`

---

# ⭐ Support the Project

If you find the idea interesting:

* ⭐ Star the repository
* 🍴 Fork the project
* 🐛 Report issues
* 💡 Suggest improvements
* 🤝 Contribute

---

## CampusCred

### Turning informal campus lending into a structured trust system.

```text
Identity → Trust → Transaction → Repayment → Reputation
```

**Build trust. Track accountability. Strengthen campus communities.**
