
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  registerUserInputSchema, 
  loginUserInputSchema, 
  createMeetupInputSchema, 
  createRsvpInputSchema 
} from './schema';

import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createMeetup } from './handlers/create_meetup';
import { getUpcomingMeetups } from './handlers/get_upcoming_meetups';
import { createRsvp } from './handlers/create_rsvp';
import { getUserRsvps } from './handlers/get_user_rsvps';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Meetup routes
  createMeetup: publicProcedure
    .input(createMeetupInputSchema)
    .mutation(({ input }) => createMeetup(input)),

  getUpcomingMeetups: publicProcedure
    .query(() => getUpcomingMeetups()),

  // RSVP routes
  createRsvp: publicProcedure
    .input(createRsvpInputSchema)
    .mutation(({ input }) => createRsvp(input)),

  getUserRsvps: publicProcedure
    .input(z.number())
    .query(({ input }) => getUserRsvps(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
