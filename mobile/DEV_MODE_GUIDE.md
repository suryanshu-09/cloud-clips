# Development Mode Setup Guide

This guide explains how to use the development mode to bypass Firebase authentication and test the app with mock data.

## Quick Start

1. **Enable Dev Mode**: Update your `.env` file:
   ```bash
   EXPO_PUBLIC_DEV_MODE=true
   ```

2. **Start the app**:
   ```bash
   cd mobile
   bun dev
   ```

3. **Use test accounts**: The login screen will show a "Dev Mode: Quick Login" section with pre-configured test accounts.

## Available Test Accounts

### Client Accounts
- **Email**: `client1@test.com`
  - **Password**: `password123`
  - **Name**: John Doe
  - **Role**: Client

- **Email**: `client2@test.com`
  - **Password**: `password123`
  - **Name**: Jane Smith
  - **Role**: Client

### Barber Accounts
- **Email**: `barber1@test.com`
  - **Password**: `password123`
  - **Name**: Mike Johnson
  - **Role**: Barber

- **Email**: `barber2@test.com`
  - **Password**: `password123`
  - **Name**: Sarah Williams
  - **Role**: Barber

## Features

### Mock Authentication Service
- No Firebase configuration required
- Simulated network delays (300-800ms)
- Full auth flow support (login, register, logout)
- Persistent session management
- Profile updates

### DevLoginHelper Component
- Appears only in dev mode
- Collapsible UI on login screen
- One-tap account selection
- Auto-fills email and password

### What Works in Dev Mode
- ✅ Login with pre-configured accounts
- ✅ Register new accounts (stored in memory)
- ✅ Logout
- ✅ Get current user
- ✅ Update user profile
- ✅ Password reset simulation
- ✅ Token refresh
- ✅ Account deletion

### What's Mocked
- Firebase Auth calls
- Backend API authentication endpoints
- Network delays and responses
- User sessions

## Switching to Production

To disable dev mode and use real Firebase auth:

1. Update `.env`:
   ```bash
   EXPO_PUBLIC_DEV_MODE=false
   ```

2. Configure Firebase credentials in `.env`:
   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   # ... other Firebase config
   ```

3. Restart the app

## Technical Details

### File Structure
```
mobile/src/
├── features/auth/services/
│   ├── authService.ts        # Main auth service (production + dev)
│   └── mockAuthService.ts    # Mock implementation
├── components/auth/
│   └── DevLoginHelper.tsx    # Dev UI component
└── services/firebase/
    └── auth.ts               # Firebase auth wrapper
```

### How It Works

1. `authService.ts` checks `EXPO_PUBLIC_DEV_MODE` environment variable
2. If true, routes all auth calls to `mockAuthService.ts`
3. If false, uses Firebase authentication
4. Console logs indicate which mode is active

### Console Output

When dev mode is enabled, you'll see:
```
[AUTH] Running in DEVELOPMENT mode
[AUTH] Using mock authentication service
[AUTH] Available test accounts:
  Clients: client1@test.com, client2@test.com
  Barbers: barber1@test.com, barber2@test.com
  Password: password123
```

## Customizing Mock Data

To add more test accounts, edit `mobile/src/features/auth/services/mockAuthService.ts`:

```typescript
const MOCK_USERS: Record<string, { password: string; user: IAuthUser }> = {
  'newuser@test.com': {
    password: 'password123',
    user: {
      id: 'user-123',
      email: 'newuser@test.com',
      name: 'New User',
      phone: '+1234567899',
      role: 'client',
      profileImage: 'https://i.pravatar.cc/150?u=newuser',
    },
  },
  // ... add more accounts
};
```

## Troubleshooting

### Dev mode not working
- Check `.env` file has `EXPO_PUBLIC_DEV_MODE=true`
- Restart the dev server: `bun dev`
- Clear Metro cache: `bun start --clear`

### DevLoginHelper not showing
- Ensure dev mode is enabled
- Component only shows when `EXPO_PUBLIC_DEV_MODE=true`
- Check console for auth mode logs

### Firebase errors
- If you see Firebase errors in dev mode, Firebase config might be invalid
- Dev mode should bypass Firebase completely
- Check `authService.ts` is correctly checking DEV_MODE flag

## Best Practices

1. **Never commit `.env`**: Keep your actual Firebase credentials secure
2. **Use dev mode for rapid testing**: No need to create real accounts
3. **Test both roles**: Use client and barber accounts to test different flows
4. **Register flow testing**: Test registration with new emails
5. **Switch to production**: Test with real Firebase before deployment

## Notes

- Mock data is stored in memory and resets on app restart
- New registrations in dev mode persist only for current session
- Backend API calls are still bypassed in dev mode
- Profile images use placeholder service (pravatar.cc)
