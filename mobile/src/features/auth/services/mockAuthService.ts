import type { ILoginCredentials, IRegisterData, IAuthResponse, IAuthUser } from '../types';

/**
 * Mock auth service for development without Firebase
 * Provides dummy profiles for testing
 */

// Dummy user profiles
const MOCK_USERS: Record<string, { password: string; user: IAuthUser }> = {
  // Client users
  'client1@test.com': {
    password: 'password123',
    user: {
      id: 'client-1',
      email: 'client1@test.com',
      name: 'John Doe',
      phone: '+1234567890',
      role: 'client',
      profileImage: 'https://i.pravatar.cc/150?u=client1',
    },
  },
  'client2@test.com': {
    password: 'password123',
    user: {
      id: 'client-2',
      email: 'client2@test.com',
      name: 'Jane Smith',
      phone: '+1234567891',
      role: 'client',
      profileImage: 'https://i.pravatar.cc/150?u=client2',
    },
  },

  // Barber users
  'barber1@test.com': {
    password: 'password123',
    user: {
      id: 'barber-1',
      email: 'barber1@test.com',
      name: 'Mike Johnson',
      phone: '+1234567892',
      role: 'barber',
      profileImage: 'https://i.pravatar.cc/150?u=barber1',
    },
  },
  'barber2@test.com': {
    password: 'password123',
    user: {
      id: 'barber-2',
      email: 'barber2@test.com',
      name: 'Sarah Williams',
      phone: '+1234567893',
      role: 'barber',
      profileImage: 'https://i.pravatar.cc/150?u=barber2',
    },
  },
};

// Mock token generator
const generateMockToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};

// Current logged in user (simulated session)
let currentMockUser: IAuthUser | null = null;

export const mockAuthService = {
  /**
   * Login with email and password
   */
  login: async (credentials: ILoginCredentials): Promise<IAuthResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS[credentials.email];

    if (!mockUser) {
      throw new Error(
        'User not found. Available test accounts:\n' +
          'Clients: client1@test.com, client2@test.com\n' +
          'Barbers: barber1@test.com, barber2@test.com\n' +
          'Password: password123'
      );
    }

    if (mockUser.password !== credentials.password) {
      throw new Error('Invalid password. Use: password123');
    }

    currentMockUser = mockUser.user;

    return {
      user: mockUser.user,
      token: generateMockToken(mockUser.user.id),
      refreshToken: generateMockToken(mockUser.user.id),
    };
  },

  /**
   * Register a new user
   */
  register: async (data: IRegisterData): Promise<IAuthResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check if user already exists
    if (MOCK_USERS[data.email]) {
      throw new Error('User already exists');
    }

    // Create new mock user
    const newUser: IAuthUser = {
      id: `${data.role}-${Date.now()}`,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role,
      profileImage: `https://i.pravatar.cc/150?u=${data.email}`,
    };

    // Store in mock database
    MOCK_USERS[data.email] = {
      password: data.password,
      user: newUser,
    };

    currentMockUser = newUser;

    return {
      user: newUser,
      token: generateMockToken(newUser.id),
      refreshToken: generateMockToken(newUser.id),
    };
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    currentMockUser = null;
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (email: string): Promise<void> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!MOCK_USERS[email]) {
      throw new Error('User not found');
    }

    console.log(`[MOCK] Password reset email sent to: ${email}`);
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<IAuthUser> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!currentMockUser) {
      throw new Error('No user logged in');
    }

    return currentMockUser;
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (): Promise<string> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!currentMockUser) {
      throw new Error('No user logged in');
    }

    return generateMockToken(currentMockUser.id);
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: Partial<IAuthUser>): Promise<IAuthUser> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!currentMockUser) {
      throw new Error('No user logged in');
    }

    // Update current user
    currentMockUser = {
      ...currentMockUser,
      ...updates,
      id: currentMockUser.id, // Preserve ID
      role: currentMockUser.role, // Preserve role
    };

    // Update in mock database
    const mockUser = MOCK_USERS[currentMockUser.email];
    if (mockUser) {
      mockUser.user = currentMockUser;
    }

    return currentMockUser;
  },

  /**
   * Delete user account
   */
  deleteAccount: async (): Promise<void> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!currentMockUser) {
      throw new Error('No user logged in');
    }

    // Remove from mock database
    delete MOCK_USERS[currentMockUser.email];
    currentMockUser = null;
  },

  /**
   * Get all available mock users (for dev UI)
   */
  getMockUsers: () => {
    return Object.entries(MOCK_USERS).map(([email, data]) => ({
      email,
      password: data.password,
      name: data.user.name,
      role: data.user.role,
    }));
  },
};

export default mockAuthService;
