
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, meetupsTable, rsvpsTable } from '../db/schema';
import { getUserRsvps } from '../handlers/get_user_rsvps';

describe('getUserRsvps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return meetups for user RSVPs', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test organizer
    const organizers = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashedpassword',
        name: 'Organizer'
      })
      .returning()
      .execute();
    const organizerId = organizers[0].id;

    // Create test meetups
    const meetups = await db.insert(meetupsTable)
      .values([
        {
          title: 'Test Meetup 1',
          description: 'First test meetup',
          date: new Date('2024-12-31'),
          time: '18:00',
          location: 'Location 1',
          organizer_id: organizerId
        },
        {
          title: 'Test Meetup 2',
          description: 'Second test meetup',
          date: new Date('2024-12-25'),
          time: '19:00',
          location: 'Location 2',
          organizer_id: organizerId
        }
      ])
      .returning()
      .execute();

    // Create RSVPs for first meetup only
    await db.insert(rsvpsTable)
      .values({
        user_id: userId,
        meetup_id: meetups[0].id
      })
      .execute();

    const result = await getUserRsvps(userId);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Meetup 1');
    expect(result[0].description).toEqual('First test meetup');
    expect(result[0].time).toEqual('18:00');
    expect(result[0].location).toEqual('Location 1');
    expect(result[0].organizer_id).toEqual(organizerId);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for user with no RSVPs', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    const result = await getUserRsvps(userId);

    expect(result).toHaveLength(0);
  });

  it('should return multiple meetups for user with multiple RSVPs', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test organizer
    const organizers = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashedpassword',
        name: 'Organizer'
      })
      .returning()
      .execute();
    const organizerId = organizers[0].id;

    // Create test meetups
    const meetups = await db.insert(meetupsTable)
      .values([
        {
          title: 'First Meetup',
          description: 'First meetup description',
          date: new Date('2024-12-31'),
          time: '18:00',
          location: 'First Location',
          organizer_id: organizerId
        },
        {
          title: 'Second Meetup',
          description: 'Second meetup description',
          date: new Date('2024-12-25'),
          time: '19:00',
          location: 'Second Location',
          organizer_id: organizerId
        }
      ])
      .returning()
      .execute();

    // Create RSVPs for both meetups
    await db.insert(rsvpsTable)
      .values([
        {
          user_id: userId,
          meetup_id: meetups[0].id
        },
        {
          user_id: userId,
          meetup_id: meetups[1].id
        }
      ])
      .execute();

    const result = await getUserRsvps(userId);

    expect(result).toHaveLength(2);
    
    const titles = result.map(meetup => meetup.title);
    expect(titles).toContain('First Meetup');
    expect(titles).toContain('Second Meetup');
    
    result.forEach(meetup => {
      expect(meetup.organizer_id).toEqual(organizerId);
      expect(meetup.date).toBeInstanceOf(Date);
      expect(meetup.created_at).toBeInstanceOf(Date);
    });
  });
});
