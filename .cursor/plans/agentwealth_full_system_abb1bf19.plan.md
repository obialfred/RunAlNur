---
name: AgentWealth Full System
overview: Complete AgentWealth system with multi-entity architecture (Personal + House Al Nur + Arms), maximum financial integrations (Plaid, email, crypto, brokerages), email scanning for legal/tax notices, and intelligent triage system. Powers the Capital mode of Dynasty OS.
todos:
  - id: entity-model
    content: Build entity data model and CRUD (Personal, House Al Nur, Arms, future UAE entities)
    status: pending
  - id: accounts-manual
    content: Build manual account entry and balance tracking per entity
    status: pending
  - id: plaid-integration
    content: Integrate Plaid for bank/credit card auto-sync
    status: pending
  - id: email-oauth
    content: Add Gmail/Outlook OAuth connections
    status: pending
  - id: email-scanner
    content: Build email scanner service with pattern matching for financial/legal notices
    status: pending
  - id: triage-system
    content: Build triage dashboard with priority queue and action workflows
    status: pending
  - id: triage-ai-summary
    content: Add AI-generated plain English summaries for scary items
    status: pending
  - id: crypto-integration
    content: Add Coinbase and crypto exchange integrations
    status: pending
  - id: price-feeds
    content: Add market data feeds (Polygon, CoinGecko) for holdings
    status: pending
  - id: capital-dashboard
    content: Build full Capital mode dashboard with net worth, cash flow, entity breakdown
    status: pending
  - id: recurring-detection
    content: Build subscription/bill detection from transactions
    status: pending
  - id: cross-mode-alerts
    content: Connect AgentWealth alerts to cross-mode notification system
    status: pending
---

# AgentWealth - Full Financial Intelligence System

## The Vision

AgentWealth is your financial brain that:

- **Knows everything** - All accounts, all entities, all obligations
- **Surfaces the scary stuff** - So you don't have to go looking for it
- **Tells you what to do** - Clear actions, not just data
- **Acts on your behalf** - When you authorize it

---

## Multi-Entity Architecture

AgentWealth manages a constellation of entities, not just one bucket:

```
HOUSE AL NUR (Master View)
├── PERSONAL (You as individual)
│   ├── Bank Accounts (Chase, etc.)
│   ├── Credit Cards
│   ├── Personal Investments
│   ├── Crypto Holdings
│   └── Personal Liabilities
│
├── HOUSE AL NUR LLC (Operating Entity)
│   ├── Business Bank Accounts
│   ├── Business Credit Cards
│   ├── Receivables
│   └── Payables
│
├── JANNA (Real Estate Arm)
│   ├── Properties (already tracked)
│   ├── Rental Income
│   ├── Mortgages
│   └── Property Expenses
│
├── OTHER ARMS (Nova, Silk, etc.)
│   └── Per-arm financials
│
└── FUTURE ENTITIES
    ├── UAE Entities (to be formed)
    └── Trusts (if applicable)
```

### Entity Data Model

```typescript
interface Entity {
  id: string;
  name: string;
  type: 'personal' | 'llc' | 'corporation' | 'trust' | 'holding' | 'arm';
  jurisdiction: string; // 'US-TX', 'UAE', 'UK', etc.
  parentEntityId?: string;
  status: 'active' | 'dissolving' | 'dissolved' | 'forming';
  registeredAgent?: {
    name: string;
    renewalDate: Date;
    lastNotice?: Date;
  };
  taxInfo: {
    filingType: string;
    filingDeadlines: Date[];
    lastFiled?: Date;
    status: 'current' | 'unfiled' | 'extension' | 'unknown';
  };
}

interface Account {
  id: string;
  entityId: string;
  provider: 'plaid' | 'manual' | 'coinbase' | 'alpaca' | 'email_detected';
  type: 'checking' | 'savings' | 'credit' | 'brokerage' | 'crypto' | 'property' | 'receivable' | 'payable';
  institutionName: string;
  accountName: string;
  balance: number;
  currency: string;
  lastSynced: Date;
}
```

---

## Integration Map

### Tier 1: Core Financial (Auto-sync)

| Integration | API | What It Gets |

|-------------|-----|--------------|

| **Plaid** | Plaid API | Bank accounts, credit cards, transactions from 11,000+ institutions |

| **Coinbase** | Coinbase API | Crypto holdings, transactions, cost basis |

| **Other Crypto** | Exchange APIs | Binance, Kraken, etc. holdings |

| **Alpaca** | Alpaca API | Brokerage holdings, trades |

| **Interactive Brokers** | IB API | Brokerage if using IB |

### Tier 2: Email Intelligence (Auto-scan)

| Source | API | What It Extracts |

|--------|-----|------------------|

| **Gmail** | Gmail API | Bills, legal notices, tax notices, payment confirmations |

| **Outlook** | Microsoft Graph | Same as above |

| **Custom Domain** | IMAP | Same as above |

**Email Scanner Categories:**

- 🔴 Legal/Compliance (registered agent, SoS, court)
- 🔴 Tax Notices (IRS, state tax authorities)
- 🟡 Bills & Due Dates
- 🟡 Subscription Confirmations
- 🟢 Payment Confirmations
- 🟢 Account Statements

### Tier 3: Market Data (Auto-update)

| Integration | API | What It Gets |

|-------------|-----|--------------|

| **Polygon.io** | Polygon API | Stock prices, historical data |

| **CoinGecko** | CoinGecko API | Crypto prices for all tokens |

| **Zillow** | Zillow API | Property value estimates |

| **FRED** | FRED API | Interest rates, macro data |

| **OpenFX** | Exchange Rates API | Currency conversion |

### Tier 4: Manual Entry (When No API)

- Private investments (PE, VC commitments)
- Physical assets (vehicles, jewelry, art)
- Loans from individuals
- Some foreign accounts
- Entity formation costs

---

## Email Intelligence System

### How It Works

1. **Connect email accounts** via OAuth (Gmail, Outlook)
2. **Scanner runs daily** looking for financial-related emails
3. **AI categorizes** each email by type and urgency
4. **Creates action items** automatically
5. **Surfaces in triage** based on priority

### Email Pattern Matching

```typescript
const EMAIL_PATTERNS = {
  legal_notice: {
    senders: ['registeredagent', 'sos.state', 'court', 'legal'],
    subjects: ['notice', 'filing', 'renewal', 'franchise', 'annual report'],
    priority: 'critical'
  },
  tax_notice: {
    senders: ['irs.gov', 'tax.', 'revenue', 'comptroller'],
    subjects: ['notice', 'tax', 'filing', 'payment due'],
    priority: 'critical'
  },
  bill: {
    subjects: ['bill', 'invoice', 'payment due', 'statement ready'],
    priority: 'medium'
  },
  subscription: {
    subjects: ['subscription', 'renewed', 'receipt', 'your plan'],
    priority: 'low'
  }
};
```

### Email-to-Action Pipeline

```
Email: "Texas Franchise Tax Report Due"
  ↓
Categorize: legal_notice, critical
  ↓
Extract: Entity = [Entity A], Deadline = Feb 15, Amount = $300
  ↓
Create Action Item:
  - Title: "Texas Franchise Tax - [Entity A]"
  - Deadline: Feb 15
  - Entity: [Entity A]
  - Amount: $300
  - Actions: [File Now] [Dissolve Instead] [Delegate to Pro]
```

---

## Triage System

The heart of AgentWealth - surfaces what matters, tells you what to do.

### Triage Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  FINANCIAL TRIAGE                         [All Entities ▼]  │
│ "Here's what needs your attention, in order of urgency."       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL (Action within 7 days)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Texas Registered Agent Notices                    [Entity A] │
│    Found: 4 emails from Texas Registered Agent                  │
│    Issue: Annual franchise tax / registered agent renewal       │
│    Deadline: Feb 15, 2026                                       │
│    Risk: Penalties accruing, potential dissolution              │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ [READ SUMMARY]  [FILE NOW]  [DISSOLVE]  [FIND ATTORNEY] │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 2. US Tax Filing Status                              [Personal] │
│    Status: Unclear - potentially unfiled years                  │
│    Years: 2023, 2024, 2025 need verification                    │
│    Risk: IRS penalties compound, but fixable                    │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ [FIND CPA]  [UNDERSTAND OPTIONS]  [SNOOZE 7 DAYS]       │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🟡 IMPORTANT (Action within 30 days)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 3. US Entity Cleanup                                            │
│    Entities to dissolve: [Entity A], [Entity B]                 │
│    Steps: File dissolution, settle obligations, close accounts  │
│    [SHOW CHECKLIST]  [FIND ATTORNEY]                            │
│                                                                 │
│ 4. UAE Entity Setup                                             │
│    Recommended: ADGM or DIFC free zone structure                │
│    Steps: Choose jurisdiction, formation agent, setup           │
│    [SHOW OPTIONS]  [FIND FORMATION AGENT]                       │
│                                                                 │
│ 5. Cash Runway Warning                               [Personal] │
│    Current cash: $12,340                                        │
│    Monthly burn: $4,200                                         │
│    Runway: 2.9 months                                           │
│    [SEE OPTIMIZATION]  [ADJUST BUDGET]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🟢 MONITORED (Under control)                                    │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Bills: All current (next: Rent $2,400 on Jan 25)             │
│ ✓ Subscriptions: 12 active ($847/mo) - 2 flagged unused        │
│ ✓ Bank accounts: 4 connected, syncing normally                  │
│ ✓ Investments: $XX,XXX - up 3.2% this month                     │
└─────────────────────────────────────────────────────────────────┘
```

### Triage Item Actions

When you click **[READ SUMMARY]** on a scary item:

```
┌─────────────────────────────────────────────────────────────────┐
│ SUMMARY: Texas Registered Agent Notices                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ I found 4 emails from Texas Registered Agent about [Entity A].  │
│                                                                 │
│ WHAT THIS IS ABOUT:                                             │
│ Texas requires an annual franchise tax filing and registered    │
│ agent renewal to keep your LLC active.                          │
│                                                                 │
│ WHAT'S AT STAKE:                                                │
│ • Late fees accumulating (~$50/month)                           │
│ • After 90 days: potential administrative dissolution           │
│ • Your entity could lose good standing                          │
│                                                                 │
│ THE FIX:                                                        │
│ Option A: File the reports + pay fees (~$300)                   │
│   - Takes about 30 minutes online                               │
│   - I can walk you through it                                   │
│                                                                 │
│ Option B: Formally dissolve if moving to UAE structure          │
│   - Need to settle any outstanding obligations first            │
│   - File Certificate of Termination with TX SoS                 │
│   - Close associated bank accounts                              │
│                                                                 │
│ YOUR DECISION:                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ [FILE & KEEP ACTIVE]  [START DISSOLUTION]  [TALK TO PRO]   ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Capital Mode Dashboard (Full View)

This is what Capital mode looks like with AgentWealth powering it:

```
┌─────────────────────────────────────────────────────────────────┐
│ CAPITAL                                    [All Entities ▼]     │
│ Total Net Worth: $XXX,XXX                  as of Jan 20, 2026  │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────┐  ┌────────────────────────────────────┐
│ NET WORTH BREAKDOWN    │  │ CASH POSITION                      │
├────────────────────────┤  ├────────────────────────────────────┤
│ Cash         $22,440   │  │ Personal Checking    ████████ $12K │
│ Investments  $45,200   │  │ Personal Savings     ██████    $5K │
│ Crypto       $12,800   │  │ Business Operating   ████      $3K │
│ Real Estate  $85,000   │  │ Janna Property       ██        $2K │
│ Other        $5,000    │  │ ─────────────────────────────────  │
│ ─────────────────────  │  │ Total Cash          $22,440        │
│ Liabilities ($28,000)  │  │ Monthly Burn        ($4,200)       │
│ ─────────────────────  │  │ Runway              5.3 months     │
│ NET WORTH   $142,440   │  └────────────────────────────────────┘
└────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BY ENTITY                                                       │
├─────────────────────────────────────────────────────────────────┤
│ Personal           ████████████████░░░░  $98,200  (69%)        │
│ House Al Nur LLC   ████░░░░░░░░░░░░░░░░  $24,240  (17%)        │
│ Janna              ███░░░░░░░░░░░░░░░░░  $20,000  (14%)        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ UPCOMING (Next 30 Days)                                         │
├─────────────────────────────────────────────────────────────────┤
│ 🔴 Jan 25  Rent (Personal)                         -$2,400     │
│ 🟡 Jan 28  Credit Card (Chase)                       -$450     │
│ 🟢 Feb 1   Rental Income (123 Main)                +$1,800     │
│ 🟡 Feb 5   Insurance (House Al Nur)                  -$890     │
│ 🔴 Feb 15  TX Franchise Tax (Entity A)               -$300     │
│ ────────────────────────────────────────────────────────────── │
│ NET 30-DAY CASH FLOW                               -$2,240     │
│ PROJECTED CASH (Feb 20)                            $20,200     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ TRIAGE ITEMS (2 critical)                      [View All →] │
├─────────────────────────────────────────────────────────────────┤
│ 🔴 Texas Registered Agent notices need action                   │
│ 🔴 Tax filing status unclear - find CPA                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- Entities (companies, LLCs, personal)
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- personal, llc, corp, trust, arm
  jurisdiction VARCHAR(50),
  parent_entity_id UUID REFERENCES entities(id),
  status VARCHAR(20) DEFAULT 'active',
  registered_agent_name VARCHAR(255),
  registered_agent_renewal DATE,
  tax_filing_type VARCHAR(50),
  tax_filing_deadline DATE,
  last_tax_filed DATE,
  tax_status VARCHAR(20) DEFAULT 'unknown',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial Accounts
CREATE TABLE financial_accounts (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  provider VARCHAR(50) NOT NULL, -- plaid, manual, coinbase, etc.
  provider_account_id VARCHAR(255),
  type VARCHAR(50) NOT NULL, -- checking, savings, credit, etc.
  institution_name VARCHAR(255),
  account_name VARCHAR(255),
  balance DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'USD',
  last_synced TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES financial_accounts(id),
  provider_transaction_id VARCHAR(255),
  date DATE NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  category VARCHAR(100),
  merchant VARCHAR(255),
  is_recurring BOOLEAN DEFAULT false,
  recurring_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recurring Items (bills, subscriptions)
CREATE TABLE recurring_items (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  account_id UUID REFERENCES financial_accounts(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- bill, subscription, income
  amount DECIMAL(15,2),
  frequency VARCHAR(20), -- monthly, quarterly, annual
  next_date DATE,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_detected_usage TIMESTAMP, -- for subscription usage tracking
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email Extracted Items
CREATE TABLE email_items (
  id UUID PRIMARY KEY,
  email_account VARCHAR(255),
  email_id VARCHAR(255),
  email_date TIMESTAMP,
  sender VARCHAR(255),
  subject TEXT,
  category VARCHAR(50), -- legal_notice, tax, bill, etc.
  priority VARCHAR(20),
  entity_id UUID REFERENCES entities(id),
  extracted_data JSONB, -- deadline, amount, entity name, etc.
  action_item_id UUID REFERENCES triage_items(id),
  processed_at TIMESTAMP DEFAULT NOW()
);

-- Triage Items (action queue)
CREATE TABLE triage_items (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  source VARCHAR(50), -- email, account, manual
  source_id UUID,
  category VARCHAR(50), -- legal, tax, bill, cash_flow, etc.
  priority VARCHAR(20), -- critical, high, medium, low
  title VARCHAR(255),
  description TEXT,
  summary TEXT, -- AI-generated plain English explanation
  deadline DATE,
  amount DECIMAL(15,2),
  actions JSONB, -- available actions: [{id, label, type, url}]
  status VARCHAR(20) DEFAULT 'pending', -- pending, snoozed, resolved, dismissed
  snoozed_until DATE,
  resolved_at TIMESTAMP,
  resolved_action VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Holdings (investments, crypto, property)
CREATE TABLE holdings (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  type VARCHAR(50), -- stock, crypto, property, private_investment
  symbol VARCHAR(20),
  name VARCHAR(255),
  quantity DECIMAL(20,8),
  cost_basis DECIMAL(15,2),
  current_value DECIMAL(15,2),
  last_price DECIMAL(15,4),
  last_price_updated TIMESTAMP,
  account_id UUID REFERENCES financial_accounts(id),
  metadata JSONB, -- property address, VC fund details, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plaid Connections
CREATE TABLE plaid_connections (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  access_token TEXT ENCRYPTED,
  item_id VARCHAR(255),
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  last_synced TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email Connections
CREATE TABLE email_connections (
  id UUID PRIMARY KEY,
  provider VARCHAR(50), -- gmail, outlook
  email_address VARCHAR(255),
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  status VARCHAR(20) DEFAULT 'active',
  last_scanned TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Phases

### Phase 1: Foundation (Entity + Manual Entry)

- Entity CRUD (add your entities)
- Manual account entry
- Manual balance tracking
- Basic net worth calculation
- Entity-based views

### Phase 2: Plaid Integration

- Plaid Link setup
- Account sync
- Transaction import
- Balance auto-update
- Recurring detection

### Phase 3: Email Intelligence

- Gmail/Outlook OAuth
- Email scanning service
- Pattern matching for financial emails
- Triage item creation
- Action item queue

### Phase 4: Triage System

- Triage dashboard UI
- Priority calculation
- Summary generation (AI)
- Action workflows
- Snooze/resolve tracking

### Phase 5: Investment Tracking

- Crypto exchange connections
- Brokerage sync
- Price updates
- Performance calculation
- Holdings by entity

### Phase 6: Full Dashboard

- Capital mode integration
- Net worth over time
- Cash flow projections
- 30-day outlook
- Cross-mode notifications

---

## Integration with Dynasty OS

AgentWealth powers **Capital Mode** and contributes to **Command Mode**:

**Capital Mode Navigation:**

- Dashboard → Full AgentWealth dashboard
- Net Worth → Breakdown by entity/asset class
- Triage → All action items
- Accounts → Connected accounts management
- Entities → Entity management (US, UAE, etc.)

**Cross-Mode Contributions:**

- Capital Snapshot widget in Command mode
- Cash runway alerts → Command triage
- Tax deadlines → Calendar integration
- Bill due dates → Daily briefing