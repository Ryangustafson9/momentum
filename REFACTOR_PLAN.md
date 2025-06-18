# 🔧 REFACTOR PLAN - Gym Management SaaS

## PHASE 1: SERVICE LAYER CONSOLIDATION (Week 1)

### Step 1: Implement React Query
```bash
# Already installed, just need to implement
```

### Step 2: Create Unified Service Layer
```
src/
├── services/
│   ├── api/
│   │   ├── members.js      ← Clean API calls
│   │   ├── classes.js      ← Supabase queries
│   │   ├── auth.js         ← Auth operations
│   │   └── settings.js     ← Settings management
│   └── hooks/
│       ├── useMembers.js   ← React Query hooks
│       ├── useClasses.js   ← Data fetching
│       └── useAuth.js      ← Auth state
```

### Step 3: Remove Legacy Services
- ❌ Delete `src/services/dataService.js`
- ❌ Delete `src/lib/dataService.js` 
- ❌ Delete `src/lib/services/` (move to new structure)

## PHASE 2: FOLDER RESTRUCTURE (Week 2)

### Current Issues:
- Duplicate seed data in 2 locations
- Mixed component organization
- Inconsistent naming conventions

### Proposed Structure:
```
src/
├── components/
│   ├── ui/                 ← shadcn components
│   ├── common/             ← Shared components
│   ├── forms/              ← Form components
│   └── charts/             ← Data visualization
├── features/               ← Feature-based organization
│   ├── auth/
│   ├── members/
│   ├── classes/
│   └── billing/
├── services/               ← API layer (new)
├── hooks/                  ← Custom hooks
├── utils/                  ← Utilities
├── types/                  ← TypeScript types
└── data/                   ← Single seed data location
```

## PHASE 3: PERFORMANCE OPTIMIZATION (Week 3)

### React Query Implementation
- Implement caching strategy
- Add optimistic updates
- Background refetching
- Error retry logic

### Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports

### Bundle Optimization
- Remove unused dependencies
- Tree shaking verification
- Bundle analysis

## PHASE 4: SECURITY & SCALE PREP (Week 4)

### Security Enhancements
- RLS policy review
- Input validation
- XSS protection
- CSRF tokens

### Scale Readiness
- Database indexing
- Query optimization
- Caching strategy
- Error monitoring
