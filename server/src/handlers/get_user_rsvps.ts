
import { db } from '../db';
import { rsvpsTable, meetupsTable } from '../db/schema';
import { type Meetup } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserRsvps = async (userId: number): Promise<Meetup[]> => {
  try {
    // Join RSVPs with meetups to get meetup details for user's RSVPs
    const results = await db.select({
      id: meetupsTable.id,
      title: meetupsTable.title,
      description: meetupsTable.description,
      date: meetupsTable.date,
      time: meetupsTable.time,
      location: meetupsTable.location,
      organizer_id: meetupsTable.organizer_id,
      created_at: meetupsTable.created_at
    })
      .from(rsvpsTable)
      .innerJoin(meetupsTable, eq(rsvpsTable.meetup_id, meetupsTable.id))
      .where(eq(rsvpsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user RSVPs:', error);
    throw error;
  }
};
