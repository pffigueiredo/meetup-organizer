
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUserData = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

const testLoginInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid credentials', async () => {
    // Create a test user first
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: hashedPassword,
        name: testUserData.name
      })
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify user data (without password hash)
    expect(result.user.email).toEqual(testUserData.email);
    expect(result.user.name).toEqual(testUserData.name);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect((result.user as any).password_hash).toBeUndefined();

    // Verify token exists
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create a test user
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: hashedPassword,
        name: testUserData.name
      })
      .execute();

    const invalidInput: LoginUserInput = {
      email: testUserData.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should generate valid token', async () => {
    // Create a test user
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: hashedPassword,
        name: testUserData.name
      })
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify token can be decoded
    const payload = JSON.parse(atob(result.token));
    expect(payload.userId).toBeDefined();
    expect(payload.email).toEqual(testUserData.email);
    expect(payload.exp).toBeDefined(); // expiration time
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000)); // should be in future
  });
});
