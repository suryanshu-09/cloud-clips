import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/utils/validation/authSchemas';

describe('Email Schema', () => {
  it('should validate correct email', () => {
    expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
  });

  it('should reject empty email', () => {
    expect(() => emailSchema.parse('')).toThrow('Email is required');
  });

  it('should reject invalid email format', () => {
    expect(() => emailSchema.parse('invalid-email')).toThrow('Invalid email address');
  });
});

describe('Password Schema', () => {
  it('should validate strong password', () => {
    const validPassword = 'Test123!@#';
    expect(passwordSchema.parse(validPassword)).toBe(validPassword);
  });

  it('should reject short password', () => {
    expect(() => passwordSchema.parse('Test1!')).toThrow('Password must be at least 8 characters');
  });

  it('should reject password without uppercase', () => {
    expect(() => passwordSchema.parse('test123!@#')).toThrow(
      'Password must contain at least one uppercase letter'
    );
  });

  it('should reject password without lowercase', () => {
    expect(() => passwordSchema.parse('TEST123!@#')).toThrow(
      'Password must contain at least one lowercase letter'
    );
  });

  it('should reject password without number', () => {
    expect(() => passwordSchema.parse('TestTest!@#')).toThrow(
      'Password must contain at least one number'
    );
  });

  it('should reject password without special character', () => {
    expect(() => passwordSchema.parse('Test12345')).toThrow(
      'Password must contain at least one special character'
    );
  });
});

describe('Phone Schema', () => {
  it('should validate phone number with country code', () => {
    expect(phoneSchema.parse('+1234567890')).toBe('+1234567890');
  });

  it('should validate phone number without plus', () => {
    expect(phoneSchema.parse('1234567890')).toBe('1234567890');
  });

  it('should reject empty phone number', () => {
    expect(() => phoneSchema.parse('')).toThrow('Phone number is required');
  });

  it('should reject invalid phone format', () => {
    expect(() => phoneSchema.parse('abc123')).toThrow('Invalid phone number format');
  });

  it('should reject phone starting with 0', () => {
    expect(() => phoneSchema.parse('0123456789')).toThrow('Invalid phone number format');
  });
});

describe('Name Schema', () => {
  it('should validate valid name', () => {
    expect(nameSchema.parse('John Doe')).toBe('John Doe');
  });

  it('should reject name with less than 2 characters', () => {
    expect(() => nameSchema.parse('J')).toThrow('Name must be at least 2 characters');
  });

  it('should reject name longer than 50 characters', () => {
    const longName = 'a'.repeat(51);
    expect(() => nameSchema.parse(longName)).toThrow('Name must not exceed 50 characters');
  });

  it('should reject name with numbers', () => {
    expect(() => nameSchema.parse('John123')).toThrow('Name can only contain letters and spaces');
  });

  it('should reject name with special characters', () => {
    expect(() => nameSchema.parse('John@Doe')).toThrow('Name can only contain letters and spaces');
  });
});

describe('Login Schema', () => {
  it('should validate correct login data', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };
    expect(loginSchema.parse(loginData)).toEqual(loginData);
  });

  it('should reject missing email', () => {
    expect(() =>
      loginSchema.parse({
        email: '',
        password: 'password123',
      })
    ).toThrow();
  });

  it('should reject missing password', () => {
    expect(() =>
      loginSchema.parse({
        email: 'test@example.com',
        password: '',
      })
    ).toThrow('Password is required');
  });
});

describe('Register Schema', () => {
  const validRegisterData = {
    name: 'John Doe',
    email: 'test@example.com',
    phone: '+1234567890',
    password: 'Test123!@#',
    confirmPassword: 'Test123!@#',
    role: 'client' as const,
  };

  it('should validate correct registration data', () => {
    expect(registerSchema.parse(validRegisterData)).toEqual(validRegisterData);
  });

  it('should reject mismatched passwords', () => {
    expect(() =>
      registerSchema.parse({
        ...validRegisterData,
        confirmPassword: 'DifferentPassword123!',
      })
    ).toThrow("Passwords don't match");
  });

  it('should reject invalid role', () => {
    expect(() =>
      registerSchema.parse({
        ...validRegisterData,
        // @ts-ignore - Testing invalid input
        role: 'invalid-role',
      })
    ).toThrow();
  });

  it('should accept barber role', () => {
    const barberData = { ...validRegisterData, role: 'barber' as const };
    expect(registerSchema.parse(barberData)).toEqual(barberData);
  });
});

describe('Forgot Password Schema', () => {
  it('should validate correct email', () => {
    const data = { email: 'test@example.com' };
    expect(forgotPasswordSchema.parse(data)).toEqual(data);
  });

  it('should reject invalid email', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'invalid' })).toThrow();
  });
});

describe('Reset Password Schema', () => {
  it('should validate matching passwords', () => {
    const data = {
      password: 'NewPass123!@#',
      confirmPassword: 'NewPass123!@#',
    };
    expect(resetPasswordSchema.parse(data)).toEqual(data);
  });

  it('should reject mismatched passwords', () => {
    expect(() =>
      resetPasswordSchema.parse({
        password: 'NewPass123!@#',
        confirmPassword: 'DifferentPass123!',
      })
    ).toThrow("Passwords don't match");
  });

  it('should reject weak password', () => {
    expect(() =>
      resetPasswordSchema.parse({
        password: 'weak',
        confirmPassword: 'weak',
      })
    ).toThrow();
  });
});
