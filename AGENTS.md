# Agent Guidelines for cloud-clips

## Development Commands
```bash
# Installation
pnpm install     # Install dependencies

# Development
pnpm dev         # Start dev server
pnpm build       # Build for production
pnpm lint        # Run ESLint
pnpm format      # Run Prettier

# Testing
pnpm test                    # Run all tests
pnpm test <test-name>        # Run specific test
pnpm test:watch             # Run tests in watch mode
pnpm test:e2e               # Run end-to-end tests
```

## Project Structure
```
src/
├── app/                # App navigation and entry
├── components/         # Reusable components
├── features/          # Feature-specific code
├── hooks/             # Custom hooks
├── services/          # API and external services
├── store/             # Jotai atoms and utils
├── types/             # TypeScript types
└── utils/             # Helper functions
```

## Code Style & Conventions

### React Native / TypeScript
- Use functional components with hooks
- TypeScript strict mode enabled
- Props interfaces prefixed with 'I' (e.g., IButtonProps)
- Async functions prefixed with 'async'
- Use optional chaining and nullish coalescing

### State Management
- Jotai for local state
- TanStack Query for server state
- Persist important state with MMKV

### Component Rules
- One component per file
- PascalCase for component files and function names
- Props interface in same file unless shared
- Styles at bottom of file using NativeWind

### Import Order
```typescript
// 1. React/React Native imports
import { useState } from 'react'
import { View, Text } from 'react-native'

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query'

// 3. Local imports
import { useAuth } from '@/hooks'
import { Button } from '@/components'
```

### Error Handling
- Use try/catch with Error objects
- Custom error classes for specific cases
- Error boundaries for component errors
- Log errors to monitoring service

### Example Component
```typescript
interface IUserCardProps {
  userId: string;
  onPress?: () => void;
}

export function UserCard({ userId, onPress }: IUserCardProps) {
  const { data: user } = useQuery(['user', userId], () => 
    fetchUser(userId)
  )

  if (!user) return null

  return (
    <Pressable 
      onPress={onPress}
      className="p-4 bg-white rounded-lg shadow-sm"
    >
      <Text className="text-lg font-bold">{user.name}</Text>
    </Pressable>
  )
}
```

## API Integration
- Use TanStack Query for data fetching
- Define query keys in constants
- Implement retry logic for failed requests
- Cache successful responses
- Type all API responses

## Performance Guidelines
- Memoize callbacks with useCallback
- Memoize expensive computations with useMemo
- Use FlatList for long lists
- Lazy load images and components
- Minimize re-renders

## Testing Guidelines
- Jest + React Native Testing Library
- Test files co-located with components
- Follow Arrange-Act-Assert pattern
- Mock external services and API calls
- Test edge cases and error states

## Git Workflow
- Feature branches from main
- Branch naming: feature/*, bugfix/*, hotfix/*
- Rebase before PR
- Squash commits when merging
- Conventional commits

## Backend Decision Status
Two paths are being evaluated:
1. Go + PostgreSQL
2. Supabase

Refer to PROJECT_PLAN.md for detailed comparison

## Current Project Status
- Initial setup completed
- Evaluating backend options
- Basic mobile app structure in place
- Using Expo, NativeWind, TypeScript

## Next Steps
Refer to PROJECT_PLAN.md for detailed timeline and next steps based on backend choice

## Resources
- Project Plan: PROJECT_PLAN.md
- Database Schema: SCHEMA.md
- API Documentation: [Pending backend decision]