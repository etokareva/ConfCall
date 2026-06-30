import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GroupService } from './group.service';
import {
  CreateGroupDto,
  InviteGroupMembersDto,
  UpdateGroupDto,
} from './dto/group.dto';
import { AuthenticatedUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  getMyGroups(@CurrentUser() user: AuthenticatedUser) {
    return this.groupService.getMyGroups(user.id);
  }

  @Post()
  createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupService.createGroup(user.id, dto);
  }

  @Get(':id/users')
  getGroupUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.groupService.getGroupUsers(user.id, Number(id));
  }

  @Post(':id')
  updateGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(user.id, Number(id), dto);
  }

  @Post(':id/invitations')
  inviteMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: InviteGroupMembersDto,
  ) {
    return this.groupService.inviteMembers(user.id, Number(id), dto);
  }

  @Post(':id/invitations/:invitationId/resend')
  resendInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.groupService.resendInvitation(
      user.id,
      Number(id),
      Number(invitationId),
    );
  }

  @Post(':id/members/:memberId/remove')
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupService.removeMember(
      user.id,
      Number(id),
      Number(memberId),
    );
  }

  @Get(':id/invitations')
  listInvitations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.groupService.listInvitations(user.id, Number(id));
  }

  @Get('invites/:token')
  @Public()
  getInvitation(@Param('token') token: string) {
    return this.groupService.getInvitationByToken(token);
  }

  @Post('invites/:token/accept')
  acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ) {
    return this.groupService.acceptInvitation(user.id, token);
  }
}
