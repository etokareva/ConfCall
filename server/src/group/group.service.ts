import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE_TOKEN } from '../db/db.module';
import * as schema from '../../../db/schema';
import {
  CreateGroupDto,
  InviteGroupMembersDto,
  UpdateGroupDto,
} from './dto/group.dto';
import { EmailService } from '../auth/email.service';

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: MySql2Database<typeof schema>,
    private readonly emailService: EmailService,
  ) {}

  async getMyGroups(userId: number) {
    const memberships = await this.db
      .select({
        groupId: schema.groupMembers.groupId,
        role: schema.groupMembers.role,
        name: schema.groups.name,
        avatar: schema.groups.avatar,
        createdByUserId: schema.groups.createdByUserId,
        createdAt: schema.groups.createdAt,
      })
      .from(schema.groupMembers)
      .innerJoin(
        schema.groups,
        eq(schema.groups.id, schema.groupMembers.groupId),
      )
      .where(eq(schema.groupMembers.userId, userId))
      .orderBy(schema.groups.createdAt);

    return Promise.all(
      memberships.map(
        async ({ groupId, role, name, avatar, createdByUserId, createdAt }) => {
          const members = await this.getGroupMembers(userId, groupId);
          return {
            id: groupId,
            name,
            avatar,
            createdByUserId,
            createdAt,
            role,
            members,
          };
        },
      ),
    );
  }

  async createGroup(userId: number, dto: CreateGroupDto) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Укажите название группы');

    const [inserted] = await this.db.insert(schema.groups).values({
      name,
      avatar: dto.avatar?.trim() || null,
      createdByUserId: userId,
    });
    const groupId = Number(inserted.insertId);
    await this.db.insert(schema.groupMembers).values({
      groupId,
      userId,
      role: 'owner',
    });

    const groups = await this.getMyGroups(userId);
    const group = groups.find((item) => item.id === groupId);
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async updateGroup(userId: number, groupId: number, dto: UpdateGroupDto) {
    await this.requireGroupOwner(userId, groupId);
    const update: Partial<schema.InsertGroup> = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Укажите название группы');
      update.name = name;
    }
    if (dto.avatar !== undefined) {
      update.avatar = dto.avatar.trim() || null;
    }

    if (Object.keys(update).length > 0) {
      await this.db
        .update(schema.groups)
        .set(update)
        .where(eq(schema.groups.id, groupId));
    }

    const groups = await this.getMyGroups(userId);
    const group = groups.find((item) => item.id === groupId);
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async inviteMembers(
    userId: number,
    groupId: number,
    dto: InviteGroupMembersDto,
  ) {
    await this.requireGroupOwner(userId, groupId);
    const emails = this.normalizeEmails(dto.emails);
    if (emails.length === 0) {
      throw new BadRequestException('Укажите хотя бы один email');
    }

    const [group] = await this.db
      .select({
        id: schema.groups.id,
        name: schema.groups.name,
      })
      .from(schema.groups)
      .where(eq(schema.groups.id, groupId))
      .limit(1);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitations = [];
    const failedEmails: string[] = [];

    for (const email of emails) {
      const token = randomBytes(16).toString('hex');
      await this.db.insert(schema.groupInvitations).values({
        groupId,
        invitedByUserId: userId,
        email,
        token,
        expiresAt,
      });

      const [created] = await this.db
        .select({
          id: schema.groupInvitations.id,
          groupId: schema.groupInvitations.groupId,
          invitedByUserId: schema.groupInvitations.invitedByUserId,
          email: schema.groupInvitations.email,
          token: schema.groupInvitations.token,
          status: schema.groupInvitations.status,
          invitedUserId: schema.groupInvitations.invitedUserId,
          acceptedAt: schema.groupInvitations.acceptedAt,
          expiresAt: schema.groupInvitations.expiresAt,
          createdAt: schema.groupInvitations.createdAt,
          updatedAt: schema.groupInvitations.updatedAt,
        })
        .from(schema.groupInvitations)
        .where(eq(schema.groupInvitations.token, token))
        .limit(1);

      if (created) {
        invitations.push(created);
      }

      try {
        const inviteUrl = `${this.appUrl()}/invite?token=${token}`;
        await this.emailService.sendGroupInvitationEmail({
          email,
          groupName: group.name,
          inviteUrl,
        });
      } catch (error) {
        failedEmails.push(email);
        this.logger.warn(
          `Failed to send group invitation email to ${email}: ${this.describeError(error)}`,
        );
      }
    }

    return { invitations, failedEmails };
  }

  async listInvitations(userId: number, groupId: number) {
    await this.requireGroupMember(userId, groupId);
    return this.db
      .select({
        id: schema.groupInvitations.id,
        groupId: schema.groupInvitations.groupId,
        invitedByUserId: schema.groupInvitations.invitedByUserId,
        email: schema.groupInvitations.email,
        token: schema.groupInvitations.token,
        status: schema.groupInvitations.status,
        invitedUserId: schema.groupInvitations.invitedUserId,
        acceptedAt: schema.groupInvitations.acceptedAt,
        expiresAt: schema.groupInvitations.expiresAt,
        createdAt: schema.groupInvitations.createdAt,
        updatedAt: schema.groupInvitations.updatedAt,
      })
      .from(schema.groupInvitations)
      .where(eq(schema.groupInvitations.groupId, groupId))
      .orderBy(desc(schema.groupInvitations.createdAt));
  }

  async resendInvitation(
    userId: number,
    groupId: number,
    invitationId: number,
  ) {
    await this.requireGroupOwner(userId, groupId);

    const [group] = await this.db
      .select({
        id: schema.groups.id,
        name: schema.groups.name,
      })
      .from(schema.groups)
      .where(eq(schema.groups.id, groupId))
      .limit(1);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const [invitation] = await this.db
      .select({
        id: schema.groupInvitations.id,
        groupId: schema.groupInvitations.groupId,
        invitedByUserId: schema.groupInvitations.invitedByUserId,
        email: schema.groupInvitations.email,
        token: schema.groupInvitations.token,
        status: schema.groupInvitations.status,
        invitedUserId: schema.groupInvitations.invitedUserId,
        acceptedAt: schema.groupInvitations.acceptedAt,
        expiresAt: schema.groupInvitations.expiresAt,
        createdAt: schema.groupInvitations.createdAt,
        updatedAt: schema.groupInvitations.updatedAt,
      })
      .from(schema.groupInvitations)
      .where(
        and(
          eq(schema.groupInvitations.id, invitationId),
          eq(schema.groupInvitations.groupId, groupId),
        ),
      )
      .limit(1);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException({
        messageKey: 'group.invitation_already_handled',
      });
    }

    try {
      const inviteUrl = `${this.appUrl()}/invite?token=${invitation.token}`;
      await this.emailService.sendGroupInvitationEmail({
        email: invitation.email,
        groupName: group.name,
        inviteUrl,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to resend group invitation email to ${invitation.email}: ${this.describeError(error)}`,
      );
      throw new BadRequestException({
        messageKey: 'group.invitation_resend_failed',
      });
    }

    return invitation;
  }

  async removeMember(userId: number, groupId: number, memberId: number) {
    await this.requireGroupOwner(userId, groupId);

    const [member] = await this.db
      .select({
        id: schema.groupMembers.id,
        userId: schema.groupMembers.userId,
        role: schema.groupMembers.role,
      })
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, memberId),
        ),
      )
      .limit(1);

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      throw new BadRequestException({
        messageKey: 'group.owner_cannot_be_removed',
      });
    }

    await this.db
      .delete(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, memberId),
        ),
      );

    return this.getGroupMembers(userId, groupId);
  }

  async getInvitationByToken(token: string) {
    const [invitation] = await this.db
      .select({
        id: schema.groupInvitations.id,
        groupId: schema.groupInvitations.groupId,
        invitedByUserId: schema.groupInvitations.invitedByUserId,
        email: schema.groupInvitations.email,
        token: schema.groupInvitations.token,
        status: schema.groupInvitations.status,
        invitedUserId: schema.groupInvitations.invitedUserId,
        acceptedAt: schema.groupInvitations.acceptedAt,
        expiresAt: schema.groupInvitations.expiresAt,
        createdAt: schema.groupInvitations.createdAt,
        updatedAt: schema.groupInvitations.updatedAt,
        groupName: schema.groups.name,
      })
      .from(schema.groupInvitations)
      .innerJoin(
        schema.groups,
        eq(schema.groups.id, schema.groupInvitations.groupId),
      )
      .where(eq(schema.groupInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return null;
    }

    return invitation;
  }

  async acceptInvitation(userId: number, token: string) {
    const invitation = await this.requireInvitation(token);
    const [user] = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'Приглашение можно принять только с указанного email',
      );
    }

    await this.addUserToGroup(invitation.groupId, userId, 'member');
    await this.db
      .update(schema.groupInvitations)
      .set({
        status: 'accepted',
        invitedUserId: userId,
        acceptedAt: new Date(),
      })
      .where(eq(schema.groupInvitations.id, invitation.id));

    return this.getGroupMembers(userId, invitation.groupId);
  }

  async getGroupUsers(userId: number, groupId: number) {
    return this.getGroupMembers(userId, groupId);
  }

  private async getGroupMembers(currentUserId: number, groupId: number) {
    await this.requireGroupMember(currentUserId, groupId);
    return this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        role: schema.groupMembers.role,
      })
      .from(schema.groupMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.groupMembers.userId))
      .where(eq(schema.groupMembers.groupId, groupId))
      .orderBy(schema.users.name, schema.users.email);
  }

  private async requireGroupOwner(userId: number, groupId: number) {
    const [membership] = await this.db
      .select()
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, userId),
          eq(schema.groupMembers.role, 'owner'),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException(
        'Управлять участниками может владелец группы',
      );
    }
  }

  private async requireGroupMember(userId: number, groupId: number) {
    const [membership] = await this.db
      .select()
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException('Доступна только участникам группы');
    }
  }

  private async addUserToGroup(
    groupId: number,
    userId: number,
    role: 'owner' | 'member',
  ) {
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

    if (existing) return existing;

    await this.db.insert(schema.groupMembers).values({ groupId, userId, role });
  }

  private normalizeEmails(emails: string[]) {
    return [
      ...new Set(emails.map((email) => email.trim().toLowerCase())),
    ].filter(
      (email) => Boolean(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    );
  }

  private async requireInvitation(token: string) {
    const [invitation] = await this.db
      .select()
      .from(schema.groupInvitations)
      .where(eq(schema.groupInvitations.token, token))
      .limit(1);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (
      invitation.status !== 'pending' ||
      invitation.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Ссылка приглашения недействительна');
    }

    return invitation;
  }

  private appUrl() {
    return (
      process.env.APP_PUBLIC_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:4200'
    );
  }

  private describeError(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
