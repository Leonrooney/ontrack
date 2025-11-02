# OnTrack - Fitness Tracking & Goal Management

A modern Next.js application for tracking fitness activities, managing goals, viewing forecasts, and accessing helpful FAQs.

## Features

- 📊 **Dashboard** - Comprehensive KPIs, trends, and personalized recommendations
- 🏃 **Activity Tracking** - Log and visualize steps, calories, distance, heart rate, and workouts
- 🎯 **Goals Management** - Set and track fitness goals with progress bars and streaks
- 📈 **Forecasting** - 14/30 day predictions using Moving Average and Exponential Smoothing
- ❓ **FAQ** - Searchable knowledge base with tag filtering
- 🔐 **Authentication** - Secure login/logout with NextAuth
- 🎨 **Dark Mode** - System-aware theme with manual toggle
- 📱 **Responsive** - Mobile-friendly design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Material UI (MUI)
- **Data Fetching**: TanStack React Query
- **Charts**: Recharts
- **Validation**: Zod & Yup
- **Forms**: Formik

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or cloud)
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/Leonrooney/ontrack.git
cd ontrack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Set up database
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

# Start development server
npm run dev
```

Visit http://localhost:3000

### Demo Credentials

- Email: `demo@ontrack.app`
- Password: `Passw0rd!`

## Deployment

### Render.com Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

Quick summary:
1. Create PostgreSQL database on Render
2. Create Web Service
3. Add environment variables
4. Deploy and seed database

## Project Structure

```
ontrack/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Seed data
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── activity/      # Activity page
│   │   ├── dashboard/     # Dashboard page
│   │   ├── goals/         # Goals page
│   │   ├── forecast/      # Forecast page
│   │   ├── faq/           # FAQ page
│   │   └── login/         # Login page
│   ├── components/        # Reusable components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── README.md
├── DEPLOYMENT.md
└── package.json
```

## API Routes

- `GET /api/health` - Health check
- `GET/POST /api/activity` - Activity CRUD
- `GET/PATCH/DELETE /api/activity/:id` - Activity operations
- `GET/POST /api/goals` - Goals CRUD
- `GET/PATCH/DELETE /api/goals/:id` - Goal operations
- `GET /api/dashboard` - Dashboard data
- `GET /api/forecast` - Forecast predictions
- `GET /api/faq` - FAQ search

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Deployment readiness
- [READY_TO_DEPLOY.md](READY_TO_DEPLOY.md) - Quick deploy guide
- [RENDER_CHECKLIST.md](RENDER_CHECKLIST.md) - Step-by-step checklist

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a PR.

