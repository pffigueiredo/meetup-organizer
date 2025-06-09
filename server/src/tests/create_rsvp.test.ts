
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, meetupsTable, rsvpsTable } from '../db/schema';
import { type CreateRsvpInput } from '../schema';
import { createRsvp } from '../handlers/create_rsvp';
import { eq, and } from 'drizzle-orm';

describe('createRsvp', () => {
  let testUserId: number;
  let testMeetupId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test meetup
    const meetupResult = await db.insert(meetupsTable)
      .values({
        title: 'Test Meetup',
        description: 'A meetup for testing',
        date: new Date('2024-12-31T10:00:00Z'),
        time: '10:00',
        location: 'Test Location',
        organizer_id: testUserId
      })
      .returning()
      .execute();
    testMeetupId = meetupResult[0].id;
  });

  afterEach(resetDB);

  it('should create an RSVP', async () => {
    const testInput: CreateRsvpInput = {
      user_id: testUserId,
      meetup_id: testMeetupId
    };

    const result = await createRsvp(testInput);

    // Basic field validation
    expect(result.user_id).toBe(testUserId);
    expect(result.meetup_id).toBe(testMeetupId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save RSVP to database', async () => {
    const testInput: CreateRsvpInput = {
      user_id: testUserId,
      meetup_id: testMeetupId
    };

    const result = await createRsvp(testInput);

    // Query database to verify RSVP was saved
    const rsvps = await db.select()
      .from(rsvpsTable)
      .where(eq(rsvpsTable.id, result.id))
      .execute();

    expect(rsvps).toHaveLength(1);
    expect(rsvps[0].user_id).toBe(testUserId);
    expect(rsvps[0].meetup_id).toBe(testMeetupId);
    expect(rsvps[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate RSVPs for same user and meetup', async () => {
    const testInput: CreateRsvpInput = {
      user_id: testUserId,
      meetup_id: testMeetupId
    };

    // Create first RSVP
    await createRsvp(testInput);

    // Attempt to create duplicate RSVP should fail
    await expect(createRsvp(testInput)).rejects.toThrow();
  });

  it('should allow same user to RSVP to different meetups', async () => {
    // Create second meetup
    const secondMeetupResult = await db.insert(meetupsTable)
      .values({
        title: 'Second Test Meetup',
        description: 'Another meetup for testing',
        date: new Date('2024-12-31T14:00:00Z'),
        time: '14:00',
        location: 'Another Test Location',
        organizer_id: testUserId
      })
      .returning()
      .execute();

    const firstRsvpInput: CreateRsvpInput = {
      user_id: testUserId,
      meetup_id: testMeetupId
    };

    const secondRsvpInput: CreateRsvpInput = {
      user_id: testUserId,
      meetup_id: secondMeetupResult[0].id
    };

    // Both RSVPs should succeed
    const firstRsvp = await createRsvp(firstRsvpInput);
    const secondRsvp = await createRsvp(secondRsvpInput);

    expect(firstRsvp.user_id).toBe(testUserId);
    expect(firstRsvp.meetup_id).toBe(testMeetupId);
    expect(secondRsvp.user_id).toBe(testUserId);
    expect(secondRsvp.meetup_id).toBe(secondMeetupResult[0].id);
  });

  it('should allow different users to RSVP to same meetup', async () => {
    // Create second user
    const secondUserResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        password_hash: 'hashed_password2',
        name: 'Test User 2'
      })
      .returning()
      .execute();

    const firstRsvpInput: CreateRsvpInput = {
      user_id: testUserId,
      meetup_id: testMeetupId
    };

    const secondRsvpInput: CreateRsvpInput = {
      user_id: secondUserResult[0].id,
      meetup_id: testMeetupId
    };

    // Both RSVPs should succeed
    const firstRsvp = await createRsvp(firstRsvpInput);
    const secondRsvp = await createRsvp(secondRsvpInput);

    expect(firstRsvp.user_id).toBe(testUserId);
    expect(firstRsvp.meetup_id).toBe(testMeetupId);
    expect(secondRsvp.user_id).toBe(secondUserResult[0].id);
    expect(secondRsvp.meetup_id).toBe(testMeetupId);
  });
});
