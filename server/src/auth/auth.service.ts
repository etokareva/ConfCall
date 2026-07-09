import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {
  timingSafeEqual,
  randomBytes,
  randomUUID,
  pbkdf2Sync,
} from 'node:crypto';
import { DRIZZLE_TOKEN } from '../db/db.module';
import * as schema from '../../../db/schema';
import {
  LoginWithPasswordDto,
  RegisterDto,
  ResetPasswordDto,
  RequestPasswordResetDto,
  ResendVerificationEmailDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { AuthenticatedUser } from './auth-user.interface';
import { EmailService } from './email.service';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';

const DEV_TOKEN_PREFIX = 'dev-token:';
const DEV_USER = {
  unionId: 'dev-user',
  name: 'Dev User',
  email: 'dev@example.com',
  role: 'admin' as const,
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: MySql2Database<typeof schema>,
    private readonly emailService: EmailService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  async devLogin() {
    const user = await this.ensureDevUser();
    return { token: this.createToken(user.id), user };
  }

  async resendVerificationEmail(dto: ResendVerificationEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.getUserByEmail(email);

    if (!user || user.emailVerifiedAt) {
      return {
        verificationRequired: true as const,
        email,
      };
    }

    const token = await this.createOrReuseVerificationToken(user.id, email);
    await this.emailService.sendVerificationEmail({
      email,
      name: user.name || email,
      verificationUrl: `${this.appUrl()}/verify-email?token=${token}`,
    });

    await this.db
      .update(schema.users)
      .set({ emailVerificationSentAt: new Date() })
      .where(eq(schema.users.id, user.id));

    return {
      verificationRequired: true as const,
      email,
    };
  }

  async loginWithPassword(dto: LoginWithPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.getUserByEmail(email);

    if (!user?.emailVerifiedAt || !user.passwordHash) {
      throw new BadRequestException('Неверный email или пароль');
    }

    if (!this.verifyPassword(dto.password, user.passwordHash)) {
      throw new BadRequestException('Неверный email или пароль');
    }

    const signedInAt = new Date();
    await this.db
      .update(schema.users)
      .set({ lastSignInAt: signedInAt })
      .where(eq(schema.users.id, user.id));

    const currentUser = await this.getUserById(user.id);
    return { token: this.createToken(currentUser.id), user: currentUser };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name?.trim();
    const existingUser = await this.getUserByEmail(email);

    if (existingUser?.emailVerifiedAt) {
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    }

    const passwordHash = this.hashPassword(dto.password);
    const now = new Date();
    let userId = existingUser?.id;

    if (existingUser) {
      await this.db
        .update(schema.users)
        .set({
          name: name || existingUser.name || email,
          passwordHash,
          passwordUpdatedAt: now,
        })
        .where(eq(schema.users.id, existingUser.id));
    } else {
      await this.db.insert(schema.users).values({
        unionId: `email:${email}`,
        email,
        name: name || email,
        role: 'user',
        passwordHash,
        passwordUpdatedAt: now,
      });

      const created = await this.getUserByEmail(email);
      if (!created) {
        throw new InternalServerErrorException(
          'Не удалось создать учётную запись',
        );
      }
      userId = created.id;
    }

    if (!userId) {
      throw new InternalServerErrorException(
        'Не удалось создать учётную запись',
      );
    }

    const token = await this.createOrReuseVerificationToken(userId, email);
    await this.emailService.sendVerificationEmail({
      email,
      name: name || existingUser?.name || email,
      verificationUrl: `${this.appUrl()}/verify-email?token=${token}`,
    });

    await this.db
      .update(schema.users)
      .set({ emailVerificationSentAt: new Date() })
      .where(eq(schema.users.id, userId));

    return {
      verificationRequired: true as const,
      email,
    };
  }

  async registerWithInvite(dto: {
    email: string;
    name?: string;
    inviteToken: string;
    password: string;
  }) {
    const email = dto.email.trim().toLowerCase();
    const inviteToken = dto.inviteToken.trim();
    const invite = await this.getActiveInvitation(inviteToken);

    if (!invite || invite.email.toLowerCase() !== email) {
      throw new BadRequestException(
        'Приглашение недействительно или отправлено на другой email',
      );
    }

    const [existingUser] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        locale: schema.users.locale,
        role: schema.users.role,
        emailVerifiedAt: schema.users.emailVerifiedAt,
        passwordHash: schema.users.passwordHash,
      })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser?.passwordHash) {
      throw new BadRequestException(
        'Пользователь с таким email уже зарегистрирован. Войдите в аккаунт и откройте приглашение снова.',
      );
    }

    const passwordHash = this.hashPassword(dto.password);
    const now = new Date();

    if (existingUser) {
      await this.db
        .update(schema.users)
        .set({
          ...(dto.name?.trim() ? { name: dto.name.trim() } : {}),
          passwordHash,
          passwordUpdatedAt: now,
          emailVerifiedAt: now,
          lastSignInAt: now,
        })
        .where(eq(schema.users.id, existingUser.id));
    } else {
      await this.db.insert(schema.users).values({
        unionId: `invite:${email}`,
        email,
        name: dto.name?.trim() || email,
        role: 'user',
        passwordHash,
        passwordUpdatedAt: now,
        emailVerifiedAt: now,
        lastSignInAt: now,
      });
    }

    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new InternalServerErrorException(
        'Не удалось создать учётную запись',
      );
    }

    await this.addUserToGroup(invite.groupId, user.id);
    await this.db
      .update(schema.groupInvitations)
      .set({
        status: 'accepted',
        invitedUserId: user.id,
        acceptedAt: now,
      })
      .where(eq(schema.groupInvitations.id, invite.id));

    const currentUser = await this.getUserById(user.id);
    return { token: this.createToken(currentUser.id), user: currentUser };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.getUserByEmail(email);

    if (!user) {
      return {
        resetRequired: true as const,
        email,
      };
    }

    const token = randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    await this.db.insert(schema.passwordResetTokens).values({
      userId: user.id,
      email,
      token,
      expiresAt,
    });

    await this.emailService.sendPasswordResetEmail({
      email,
      name: user.name || email,
      resetUrl: `${this.appUrl()}/reset-password?token=${token}`,
    });

    return {
      resetRequired: true as const,
      email,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = dto.token.trim();
    const password = dto.password;

    const [resetToken] = await this.db
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.token, token))
      .limit(1);

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Ссылка сброса пароля недействительна или устарела',
      );
    }

    const passwordHash = this.hashPassword(password);
    const completedAt = new Date();

    await this.db
      .update(schema.users)
      .set({
        passwordHash,
        passwordUpdatedAt: completedAt,
      })
      .where(eq(schema.users.id, resetToken.userId));

    await this.db
      .update(schema.passwordResetTokens)
      .set({ usedAt: completedAt })
      .where(eq(schema.passwordResetTokens.id, resetToken.id));

    const user = await this.getUserById(resetToken.userId);
    return { token: this.createToken(user.id), user };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const token = dto.token.trim();

    const [verification] = await this.db
      .select()
      .from(schema.emailVerificationTokens)
      .where(eq(schema.emailVerificationTokens.token, token))
      .limit(1);

    if (!verification) {
      throw new BadRequestException(
        'Ссылка подтверждения недействительна или устарела',
      );
    }

    if (verification.usedAt) {
      const [user] = await this.db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          avatar: schema.users.avatar,
          locale: schema.users.locale,
          role: schema.users.role,
          emailVerifiedAt: schema.users.emailVerifiedAt,
        })
        .from(schema.users)
        .where(eq(schema.users.id, verification.userId))
        .limit(1);

      if (!user) {
        throw new BadRequestException(
          'Ссылка подтверждения недействительна или устарела',
        );
      }

      return { token: this.createToken(user.id), user };
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Ссылка подтверждения недействительна или устарела',
      );
    }

    const verifiedAt = new Date();

    await this.db
      .update(schema.users)
      .set({ emailVerifiedAt: verifiedAt, lastSignInAt: verifiedAt })
      .where(eq(schema.users.id, verification.userId));

    await this.db
      .update(schema.emailVerificationTokens)
      .set({ usedAt: verifiedAt })
      .where(eq(schema.emailVerificationTokens.id, verification.id));

    const user = await this.getUserById(verification.userId);
    return { token: this.createToken(user.id), user };
  }

  async getMe(userId: number) {
    return this.getUserById(userId);
  }

  async updateMe(userId: number, dto: UpdateProfileDto) {
    const user = await this.getUserById(userId);
    const name = dto.name?.trim();
    const avatar = dto.avatar?.trim();

    await this.db
      .update(schema.users)
      .set({
        ...(name !== undefined ? { name: name || user.email } : {}),
        ...(avatar !== undefined ? { avatar: avatar || null } : {}),
        ...(dto.locale ? { locale: dto.locale } : {}),
      })
      .where(eq(schema.users.id, user.id));

    return this.getUserById(userId);
  }

  async getUserFromAuthHeader(
    authHeader?: string,
  ): Promise<AuthenticatedUser | null> {
    const token = this.extractBearerToken(authHeader);
    const userId = this.parseToken(token);
    if (!userId) {
      return null;
    }

    return this.getUserById(userId);
  }

  private async ensureDevUser() {
    const [existing] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        locale: schema.users.locale,
        role: schema.users.role,
        emailVerifiedAt: schema.users.emailVerifiedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.unionId, DEV_USER.unionId))
      .limit(1);

    if (existing) return existing;

    await this.db.insert(schema.users).values(DEV_USER);

    const [created] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        locale: schema.users.locale,
        role: schema.users.role,
        emailVerifiedAt: schema.users.emailVerifiedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.unionId, DEV_USER.unionId))
      .limit(1);

    return created;
  }

  private async createOrReuseVerificationToken(userId: number, email: string) {
    const [existingToken] = await this.db
      .select()
      .from(schema.emailVerificationTokens)
      .where(
        and(
          eq(schema.emailVerificationTokens.userId, userId),
          isNull(schema.emailVerificationTokens.usedAt),
          eq(schema.emailVerificationTokens.email, email),
        ),
      )
      .orderBy(desc(schema.emailVerificationTokens.createdAt))
      .limit(1);

    if (existingToken && existingToken.expiresAt.getTime() > Date.now()) {
      return existingToken.token;
    }

    const token = randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await this.db.insert(schema.emailVerificationTokens).values({
      userId,
      email,
      token,
      expiresAt,
    });

    return token;
  }

  private async getUserByEmail(email: string) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        locale: schema.users.locale,
        role: schema.users.role,
        emailVerifiedAt: schema.users.emailVerifiedAt,
        passwordHash: schema.users.passwordHash,
      })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return user ?? null;
  }

  private async getActiveInvitation(token: string) {
    const [invite] = await this.db
      .select()
      .from(schema.groupInvitations)
      .where(eq(schema.groupInvitations.token, token))
      .limit(1);

    if (!invite || invite.status !== 'pending') {
      return null;
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      return null;
    }

    return invite;
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const iterations = 120_000;
    const derived = pbkdf2Sync(
      password,
      salt,
      iterations,
      64,
      'sha512',
    ).toString('hex');

    return `pbkdf2$${iterations}$${salt}$${derived}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [algorithm, iterationsValue, salt, digest] = storedHash.split('$');
    if (algorithm !== 'pbkdf2' || !iterationsValue || !salt || !digest) {
      return false;
    }

    const iterations = Number(iterationsValue);
    if (!Number.isInteger(iterations)) {
      return false;
    }

    const derived = pbkdf2Sync(
      password,
      salt,
      iterations,
      digest.length / 2,
      'sha512',
    );
    const expected = Buffer.from(digest, 'hex');
    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  }

  private async getUserById(userId: number) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        locale: schema.users.locale,
        role: schema.users.role,
        emailVerifiedAt: schema.users.emailVerifiedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid auth token');
    }

    return user;
  }

  private extractBearerToken(authHeader?: string) {
    const [type, token] = authHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }

  private createToken(userId: number) {
    return `${DEV_TOKEN_PREFIX}${userId}`;
  }

  private parseToken(token: string | null) {
    if (!token?.startsWith(DEV_TOKEN_PREFIX)) return null;
    const userId = Number(token.slice(DEV_TOKEN_PREFIX.length));
    return Number.isInteger(userId) ? userId : null;
  }

  private async addUserToGroup(groupId: number, userId: number) {
    const [existing] = await this.db
      .select()
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, userId),
        ),
      )
      .limit(1);

    if (existing) return;

    await this.db.insert(schema.groupMembers).values({
      groupId,
      userId,
      role: 'member',
    });
    await this.cacheInvalidation.invalidateIntersections();
  }

  private appUrl() {
    return process.env.APP_PUBLIC_URL || 'http://127.0.0.1:4200';
  }
}
