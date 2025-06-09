
import { db } from '../db';
import { meetupsTable, rsvpsTable } from '../db/schema';
import { type MeetupWithRsvpCount } from '../schema';
import { gte, count, sql } from 'drizzle-orm';

export const getUpcomingMeetups = async (): Promise<MeetupWithRsvpCount[]> => {
  try {
    const now = new Date();
    
    const results = await db
      .select({
        id: meetupsTable.id,
        title: meetupsTable.title,
        description: meetupsTable.description,
        date: meetupsTable.date,
        time: meetupsTable.time,
        location: meetupsTable.location,
        organizer_id: meetupsTable.organizer_id,
        created_at: meetupsTable.created_at,
        rsvp_count: sql<number>`COALESCE(COUNT(${rsvpsTable.id}), 0)`.as('rsvp_count')
      })
      .from(meetupsTable)
      .leftJoin(rsvpsTable, sql`${meetupsTable.id} = ${rsvpsTable.meetup_id}`)
      .where(gte(meetupsTable.date, now))
      .groupBy(
        meetupsTable.id,
        meetupsTable.title,
        meetupsTable.description,
        meetupsTable.date,
        meetupsTable.time,
        meetupsTable.location,
        meetupsTable.organizer_id,
        meetupsTable.created_at
      )
      .orderBy(meetupsTable.date)
      .execute();

    return results.map(result => ({
      ...result,
      rsvp_count: Number(result.rsvp_count)
    }));
  } catch (error) {
    console.error('Failed to get upcoming meetups:', error);
    throw error;
  }
};
