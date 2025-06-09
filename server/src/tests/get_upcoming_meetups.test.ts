
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, meetupsTable, rsvpsTable } from '../db/schema';
import { getUpcomingMeetups } from '../handlers/get_upcoming_meetups';

describe('getUpcomingMeetups', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no upcoming meetups exist', async () => {
    const result = await getUpcomingMeetups();
    expect(result).toEqual([]);
  });

  it('should return upcoming meetups with RSVP counts', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashedpassword',
        name: 'Test Organizer'
      })
      .returning()
      .execute();
    
    const organizerId = userResult[0].id;

    // Create future meetup
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const meetupResult = await db.insert(meetupsTable)
      .values({
        title: 'Future Meetup',
        description: 'A meetup in the future',
        date: tomorrow,
        time: '18:00',
        location: 'Test Location',
        organizer_id: organizerId
      })
      .returning()
      .execute();

    const meetupId = meetupResult[0].id;

    // Create RSVP user
    const rsvpUserResult = await db.insert(usersTable)
      .values({
        email: 'rsvp@test.com',
        password_hash: 'hashedpassword',
        name: 'RSVP User'
      })
      .returning()
      .execute();

    // Create RSVP
    await db.insert(rsvpsTable)
      .values({
        user_id: rsvpUserResult[0].id,
        meetup_id: meetupId
      })
      .execute();

    const result = await getUpcomingMeetups();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Future Meetup');
    expect(result[0].description).toEqual('A meetup in the future');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].time).toEqual('18:00');
    expect(result[0].location).toEqual('Test Location');
    expect(result[0].organizer_id).toEqual(organizerId);
    expect(result[0].rsvp_count).toEqual(1);
    expect(typeof result[0].rsvp_count).toEqual('number');
  });

  it('should not include past meetups', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashedpassword',
        name: 'Test Organizer'
      })
      .returning()
      .execute();
    
    const organizerId = userResult[0].id;

    // Create past meetup
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await db.insert(meetupsTable)
      .values({
        title: 'Past Meetup',
        description: 'A meetup in the past',
        date: yesterday,
        time: '18:00',
        location: 'Test Location',
        organizer_id: organizerId
      })
      .execute();

    const result = await getUpcomingMeetups();
    expect(result).toHaveLength(0);
  });

  it('should return meetups ordered by date', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashedpassword',
        name: 'Test Organizer'
      })
      .returning()
      .execute();
    
    const organizerId = userResult[0].id;

    // Create meetups with different dates
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 1);
    
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 5);

    await db.insert(meetupsTable)
      .values([
        {
          title: 'Far Future Meetup',
          description: 'Later meetup',
          date: farFuture,
          time: '18:00',
          location: 'Test Location',
          organizer_id: organizerId
        },
        {
          title: 'Near Future Meetup',
          description: 'Earlier meetup',
          date: nearFuture,
          time: '18:00',
          location: 'Test Location',
          organizer_id: organizerId
        }
      ])
      .execute();

    const result = await getUpcomingMeetups();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Near Future Meetup');
    expect(result[1].title).toEqual('Far Future Meetup');
    expect(result[0].date < result[1].date).toBe(true);
  });

  it('should return zero RSVP count for meetups without RSVPs', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashedpassword',
        name: 'Test Organizer'
      })
      .returning()
      .execute();
    
    const organizerId = userResult[0].id;

    // Create future meetup without RSVPs
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await db.insert(meetupsTable)
      .values({
        title: 'No RSVP Meetup',
        description: 'A meetup without RSVPs',
        date: tomorrow,
        time: '18:00',
        location: 'Test Location',
        organizer_id: organizerId
      })
      .execute();

    const result = await getUpcomingMeetups();

    expect(result).toHaveLength(1);
    expect(result[0].rsvp_count).toEqual(0);
    expect(typeof result[0].rsvp_count).toEqual('number');
  });
});
