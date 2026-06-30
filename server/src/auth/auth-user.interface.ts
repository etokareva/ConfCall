import type { User } from '../../../db/schema';

export type AuthenticatedUser = Pick<
  User,
  'id' | 'name' | 'email' | 'avatar' | 'locale' | 'role' | 'emailVerifiedAt'
>;
