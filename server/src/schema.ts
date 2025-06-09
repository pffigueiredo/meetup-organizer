
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// User registration input
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// User login input
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Meetup schema
export const meetupSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  time: z.string(),
  location: z.string(),
  organizer_id: z.number(),
  created_at: z.coerce.date()
});

export type Meetup = z.infer<typeof meetupSchema>;

// Create meetup input
export const createMeetupInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().refine((date) => new Date(date) > new Date(), {
    message: "Date must be in the future"
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Time must be in HH:MM format"
  }),
  location: z.string().min(1),
  organizer_id: z.number()
});

export type CreateMeetupInput = z.infer<typeof createMeetupInputSchema>;

// RSVP schema
export const rsvpSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  meetup_id: z.number(),
  created_at: z.coerce.date()
});

export type RSVP = z.infer<typeof rsvpSchema>;

// Create RSVP input
export const createRsvpInputSchema = z.object({
  user_id: z.number(),
  meetup_id: z.number()
});

export type CreateRsvpInput = z.infer<typeof createRsvpInputSchema>;

// Auth response
export const authResponseSchema = z.object({
  user: userSchema.omit({ password_hash: true }),
  token: z.string()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Meetup with RSVP count
export const meetupWithRsvpCountSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  time: z.string(),
  location: z.string(),
  organizer_id: z.number(),
  created_at: z.coerce.date(),
  rsvp_count: z.number()
});

export type MeetupWithRsvpCount = z.infer<typeof meetupWithRsvpCountSchema>;
