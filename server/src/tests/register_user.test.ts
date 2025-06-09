
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user', async () => {
    const result = await registerUser(testInput);

    // Validate user data
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.name).toEqual('Test User');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user).not.toHaveProperty('password_hash');

    // Validate token
    expect(result.token).toBeDefined();
    expect(typeof result.token).toEqual('string');
  });

  it('should save user to database', async () => {
    const result = await registerUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await registerUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users[0].password_hash).not.toEqual('password123');
    expect(users[0].password_hash).toBeDefined();
  });

  it('should throw error for duplicate email', async () => {
    await registerUser(testInput);

    expect(registerUser(testInput)).rejects.toThrow(/already exists/i);
  });

  it('should generate valid token', async () => {
    const result = await registerUser(testInput);

    // Token should be base64 encoded and contain user info
    const decoded = Buffer.from(result.token, 'base64').toString();
    expect(decoded).toContain(result.user.id.toString());
    expect(decoded).toContain(result.user.email);
  });
});
