import { JwtPayload } from './jwt-payload.type';
import type { Participant } from '../../../drizzle/schema';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      participant?: Participant;
    }
  }
}
