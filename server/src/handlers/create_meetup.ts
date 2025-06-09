
import { db } from '../db';
import { meetupsTable } from '../db/schema';
import { type CreateMeetupInput, type Meetup } from '../schema';

export const createMeetup = async (input: CreateMeetupInput): Promise<Meetup> => {
  try {
    // Insert meetup record
    const result = await db.insert(meetupsTable)
      .values({
        title: input.title,
        description: input.description,
        date: new Date(input.date), // Convert string to Date
        time: input.time,
        location: input.location,
        organizer_id: input.organizer_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Meetup creation failed:', error);
    throw error;
  }
};
