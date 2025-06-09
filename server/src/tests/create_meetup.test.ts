
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetupsTable, usersTable } from '../db/schema';
import { type CreateMeetupInput } from '../schema';
import { createMeetup } from '../handlers/create_meetup';
import { eq } from 'drizzle-orm';

describe('createMeetup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test user first
  let testUserId: number;

  beforeEach(async () => {
    // Create a test user to use as organizer
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashedpassword',
        name: 'Test Organizer'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  const testInput: CreateMeetupInput = {
    title: 'Test Meetup',
    description: 'A meetup for testing purposes',
    date: '2024-12-31',
    time: '14:30',
    location: 'Test Location',
    organizer_id: 0 // Will be set dynamically in tests
  };

  it('should create a meetup', async () => {
    const input = { ...testInput, organizer_id: testUserId };
    const result = await createMeetup(input);

    // Basic field validation
    expect(result.title).toEqual('Test Meetup');
    expect(result.description).toEqual('A meetup for testing purposes');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-12-31');
    expect(result.time).toEqual('14:30');
    expect(result.location).toEqual('Test Location');
    expect(result.organizer_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save meetup to database', async () => {
    const input = { ...testInput, organizer_id: testUserId };
    const result = await createMeetup(input);

    // Query database to verify
    const meetups = await db.select()
      .from(meetupsTable)
      .where(eq(meetupsTable.id, result.id))
      .execute();

    expect(meetups).toHaveLength(1);
    expect(meetups[0].title).toEqual('Test Meetup');
    expect(meetups[0].description).toEqual('A meetup for testing purposes');
    expect(meetups[0].date).toBeInstanceOf(Date);
    expect(meetups[0].time).toEqual('14:30');
    expect(meetups[0].location).toEqual('Test Location');
    expect(meetups[0].organizer_id).toEqual(testUserId);
    expect(meetups[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint violation', async () => {
    const input = { ...testInput, organizer_id: 999 }; // Non-existent user

    await expect(createMeetup(input)).rejects.toThrow(/foreign key constraint/i);
  });
});
