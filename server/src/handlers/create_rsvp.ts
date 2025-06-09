
import { db } from '../db';
import { rsvpsTable } from '../db/schema';
import { type CreateRsvpInput, type RSVP } from '../schema';

export const createRsvp = async (input: CreateRsvpInput): Promise<RSVP> => {
  try {
    // Insert RSVP record
    const result = await db.insert(rsvpsTable)
      .values({
        user_id: input.user_id,
        meetup_id: input.meetup_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('RSVP creation failed:', error);
    throw error;
  }
};
