import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import {
  GroupInvitation,
  GroupMember,
  InviteGroupMembersResult,
  UserGroup,
  UserWithAvailability,
} from "../models/api.model";
import { ApiClientService } from "./api-client.service";

@Injectable({ providedIn: "root" })
export class GroupService {
  private readonly groupsSubject = new BehaviorSubject<UserGroup[]>([]);
  readonly groups$ = this.groupsSubject.asObservable();

  constructor(private readonly client: ApiClientService) {}

  loadGroups(): Observable<UserGroup[]> {
    return this.client
      .get<UserGroup[]>("/groups")
      .pipe(tap((groups) => this.groupsSubject.next(groups)));
  }

  createGroup(data: { name: string; avatar?: string }): Observable<UserGroup> {
    return this.client
      .post<UserGroup>("/groups", data)
      .pipe(
        tap((group) =>
          this.groupsSubject.next([...this.groupsSubject.value, group]),
        ),
      );
  }

  updateGroup(
    groupId: number,
    data: { name?: string; avatar?: string },
  ): Observable<UserGroup> {
    return this.client.post<UserGroup>(`/groups/${groupId}`, data).pipe(
      tap((updated) => {
        this.groupsSubject.next(
          this.groupsSubject.value.map((group) =>
            group.id === updated.id ? updated : group,
          ),
        );
      }),
    );
  }

  inviteMembers(
    groupId: number,
    emails: string[],
  ): Observable<InviteGroupMembersResult> {
    return this.client.post<InviteGroupMembersResult>(
      `/groups/${groupId}/invitations`,
      { emails },
    );
  }

  resendInvitation(
    groupId: number,
    invitationId: number,
  ): Observable<GroupInvitation> {
    return this.client.post<GroupInvitation>(
      `/groups/${groupId}/invitations/${invitationId}/resend`,
      {},
    );
  }

  removeMember(groupId: number, memberId: number): Observable<GroupMember[]> {
    return this.client.postEmpty<GroupMember[]>(
      `/groups/${groupId}/members/${memberId}/remove`,
    );
  }

  listInvitations(groupId: number): Observable<GroupInvitation[]> {
    return this.client.get<GroupInvitation[]>(`/groups/${groupId}/invitations`);
  }

  getInvitation(token: string): Observable<GroupInvitation> {
    return this.client.get<GroupInvitation>(`/groups/invites/${token}`);
  }

  acceptInvitation(token: string): Observable<GroupMember[]> {
    return this.client.post<GroupMember[]>(
      `/groups/invites/${token}/accept`,
      {},
    );
  }

  getGroupUsers(groupId: number): Observable<UserWithAvailability[]> {
    return this.client.get<UserWithAvailability[]>(
      `/availability/users?groupId=${groupId}`,
    );
  }
}
