# RunAlNur - House Al Nur Empire OS

AI-powered command center for managing House Al Nur and all its arms: Nova, Janna, Silk, ATW, OBX, House, and Maison.

## Features

- **Command Center Dashboard** - Overview of all arms, projects, and activities
- **Arm-specific Views** - Dedicated pages for each company/arm
- **Project Management** - Track projects with tasks, progress, and deadlines
- **Contact Management** - Manage contacts across all arms
- **AI Manager** - Natural language interface to manage your empire
- **SOP Management** - Standard operating procedures with Process Street integration
- **Integrations** - ClickUp, Process Street, HubSpot, and more

## Tech Stack

- **Frontend**: Next.js 16 + React 19, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Turbopack
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Auth**: Supabase Auth (email/password)
- **Integrations**: ClickUp, Process Street, HubSpot, Guru
- **AI**: OpenAI GPT-4 / Anthropic Claude
- **Mobile**: Capacitor (iOS), Tauri (Desktop), PWA

## iOS PWA Notes (Bottom Nav Safe Area)

iOS PWAs (installed “Add to Home Screen”) treat `position: fixed; bottom: 0` as the bottom of the **safe-area**, not the physical bottom of the screen. That can make the bottom nav appear to “ride too high” with a dead zone above the home indicator.

Current approach:

- Detect standalone/PWA mode inside `components/layout/MobileNav.tsx` (client-side).
- In PWA mode, render an extra fixed **safe-area underlay** behind the nav with height `env(safe-area-inset-bottom)` so the bar background visually extends behind the home indicator, while keeping the icon row stable and readable.

## Getting Started

### 1. Install Dependencies

```bash
cd runalnur-app
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your values
```

**Required variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

See `.env.example` for all available configuration options including AI, integrations, and mobile settings.

### 3. Set Up Database

#### Option A: Supabase Dashboard (Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **API** to get your keys
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `lib/supabase/schema.sql`
6. Paste and click **Run**

#### Option B: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push the schema
supabase db push
```

#### Verify Setup

After running the schema, you should have:
- 17 tables (arms, projects, contacts, tasks, activities, etc.)
- 7 default arms pre-seeded (Nova, Janna, Silk, ATW, OBX Music, House, Maison)
- Row Level Security enabled on all tables
- Indexes for optimal query performance

**Quick verification query:**
```sql
SELECT name, slug, description FROM arms ORDER BY name;
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create Your Account

1. Navigate to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Register with your email and password
3. You'll be redirected to the Command Center dashboard

## Project Structure

```
runalnur-app/
├── app/
│   ├── page.tsx                    # Command Center dashboard
│   ├── layout.tsx                  # Root layout with navigation
│   ├── arms/[arm]/page.tsx         # Arm-specific views
│   ├── projects/
│   │   ├── page.tsx               # All projects list
│   │   └── [id]/page.tsx          # Project detail
│   ├── contacts/page.tsx           # Contacts management
│   ├── sops/page.tsx               # SOPs management
│   ├── ai/page.tsx                 # AI Manager interface
│   ├── settings/page.tsx           # Settings & integrations
│   └── api/
│       ├── ai/chat/route.ts       # AI chat endpoint
│       ├── projects/route.ts      # Projects CRUD
│       ├── contacts/route.ts      # Contacts CRUD
│       └── clickup/route.ts       # ClickUp integration
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/                    # Sidebar, TopBar
│   ├── dashboard/                 # Dashboard components
│   └── ai/                        # AI chat interface
├── lib/
│   ├── constants.ts               # Arms, statuses, priorities
│   ├── types.ts                   # TypeScript types
│   ├── utils.ts                   # Utility functions
│   ├── data/store.ts             # Sample data store
│   ├── supabase/                  # Supabase client & schema
│   └── integrations/              # API clients for external services
└── package.json
```

## Arms of House Al Nur

| Arm | Description | Color |
|-----|-------------|-------|
| **Nova** | Technology & Hardware | Blue |
| **Janna** | Real Estate & Development | Emerald |
| **Silk** | Luxury E-Commerce | Gold |
| **ATW** | Media & Content | Rose |
| **OBX Music** | Music & Audio | Violet |
| **House** | Holding & Operations | Gold |
| **Maison** | Family Office | Slate |

## API Routes

### Projects
- `GET /api/projects` - List projects (filters: arm_id, status, priority)
- `POST /api/projects` - Create project

### Contacts
- `GET /api/contacts` - List contacts (filters: arm_id, search)
- `POST /api/contacts` - Create contact

### ClickUp Integration
- `GET /api/clickup?action=status` - Check connection status
- `GET /api/clickup?action=workspaces` - List workspaces
- `GET /api/clickup?action=tasks&list_id=X` - Get tasks
- `POST /api/clickup` - Create/update tasks

### AI Chat
- `POST /api/ai/chat` - Send message to AI manager

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint
npm run lint
```

## Roadmap

### Phase 1 (Complete)
- [x] Project setup with Next.js 15
- [x] Dashboard with all arms
- [x] Arm-specific views
- [x] Project management
- [x] Contact management
- [x] Basic AI chat interface
- [x] ClickUp integration structure

### Phase 2 (In Progress)
- [ ] Full Supabase integration
- [ ] Process Street SOP execution
- [ ] Real-time data sync

### Phase 3 (Planned)
- [ ] HubSpot CRM sync
- [ ] Automated daily briefings
- [ ] Advanced AI actions

### Phase 4 (Planned)
- [ ] Full AI Manager with tool execution
- [ ] Scheduled reports
- [ ] Mobile responsiveness

## License

Private - House Al Nur
