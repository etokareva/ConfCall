import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { EMPTY, from } from "rxjs";
import {
  catchError,
  debounceTime,
  finalize,
  filter,
  switchMap,
  tap,
} from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Dialog } from "@angular/cdk/dialog";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { I18nService } from "../../../core/i18n/i18n.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { GroupService } from "../../../core/services/group.service";
import { IconComponent } from "../../../shared/components/icon/icon.component";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import {
  AppLocale,
  GroupInvitation,
  InviteGroupMembersResult,
  GroupMember,
  UserGroup,
} from "../../../core/models/api.model";
import { ModalService } from "../../../core/services/modal.service";
import { ToastService } from "../../../core/services/toast.service";
import { TooltipDirective } from "../../../shared/components/tooltip/tooltip.directive";
import { GroupDialogComponent } from "../components/group-dialog/group-dialog.component";
import {
  GroupDialogData,
  GroupDialogResult,
  GroupInviteDialogResult,
  GroupProfileDialogResult,
} from "../models/group-dialog.model";

type GroupPersonRow =
  | {
      kind: "member";
      id: number;
      name: string | null;
      email: string | null;
      avatar: string | null;
      role: GroupMember["role"];
    }
  | {
      kind: "invitation";
      id: number;
      name: null;
      email: string;
      status: GroupInvitation["status"];
    };

@Component({
  selector: "ccs-settings",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    TooltipDirective,
    TranslatePipe,
    IconComponent,
  ],
  templateUrl: "./settings.page.html",
  styleUrl: "./settings.page.scss",
})
export class SettingsPage {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  groups = inject(GroupService);
  modal = inject(ModalService);
  toast = inject(ToastService);
  router = inject(Router);
  dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly profileForm = new FormGroup({
    name: new FormControl("", { nonNullable: true }),
    avatar: new FormControl("", { nonNullable: true }),
    locale: new FormControl<AppLocale>("ru", { nonNullable: true }),
  });
  profileError = signal<string | null>(null);
  savingProfile = signal(false);
  groupsList = signal<UserGroup[]>([]);
  selectedGroupId = signal<number | null>(null);
  groupsLoading = signal(true);
  groupsError = signal<string | null>(null);
  creatingGroup = signal(false);
  savingGroup = signal(false);
  addingMember = signal(false);
  promoCodes = signal<GroupInvitation[]>([]);
  promoCodesLoading = signal(true);
  promoCodesError = signal<string | null>(null);
  creatingPromo = signal(false);
  resendingInvitationId = signal<number | null>(null);
  readonly groupPeopleRows = computed<GroupPersonRow[]>(() => {
    const group = this.selectedGroup();
    if (!group) return [];

    const memberEmails = new Set(
      group.members
        .map((member) => member.email?.toLowerCase())
        .filter((email): email is string => Boolean(email)),
    );
    const invitationRows = this.promoCodes()
      .filter(
        (invitation) =>
          invitation.status !== "accepted" &&
          !memberEmails.has(invitation.email.toLowerCase()),
      )
      .map<GroupPersonRow>((invitation) => ({
        kind: "invitation",
        id: invitation.id,
        name: null,
        email: invitation.email,
        status: invitation.status,
      }));
    const memberRows = group.members.map<GroupPersonRow>((member) => ({
      kind: "member",
      id: member.id,
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      role: member.role,
    }));

    return [...memberRows, ...invitationRows];
  });

  constructor() {
    this.profileForm.valueChanges
      .pipe(
        debounceTime(250),
        tap(() => this.profileError.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
    this.auth.user$
      .pipe(
        filter(Boolean),
        tap((user) => {
          this.profileForm.patchValue(
            {
              name: user.name ?? "",
              avatar: user.avatar ?? "",
              locale: user.locale ?? "ru",
            },
            { emitEvent: false },
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  isGroupsPage() {
    return this.router.url.startsWith("/groups");
  }

  isProfilePage() {
    return !this.isGroupsPage();
  }

  profilePreviewName() {
    return (
      this.profileForm.controls.name.value.trim() ||
      this.auth.user()?.email ||
      ""
    );
  }

  profilePreviewInitial() {
    return (this.profilePreviewName() || "?")[0].toUpperCase();
  }

  profileLocaleLabel() {
    const locale = this.profileForm.controls.locale.value;
    return (
      this.i18n.languages.find((language) => language.value === locale)
        ?.nativeLabel || locale
    );
  }

  pageTitleKey() {
    if (this.isGroupsPage()) return "nav.groups";
    return "nav.profile";
  }

  selectedGroup() {
    return (
      this.groupsList().find((group) => group.id === this.selectedGroupId()) ??
      null
    );
  }

  selectedGroupInvitationCount() {
    return this.promoCodes().filter(
      (invitation) => invitation.status === "pending",
    ).length;
  }

  selectedGroupRoleLabel() {
    const group = this.selectedGroup();
    if (!group) {
      return "";
    }

    return this.i18n.translate(
      group.role === "owner" ? "common.owner" : "common.member",
    );
  }

  canManageSelectedGroup() {
    return this.selectedGroup()?.role === "owner";
  }

  ownedGroups() {
    return this.groupsList().filter((group) => group.role === "owner");
  }

  memberGroups() {
    return this.groupsList().filter((group) => group.role !== "owner");
  }

  selectGroup(groupId: number) {
    const group = this.groupsList().find((item) => item.id === groupId);
    this.selectedGroupId.set(groupId);
    this.loadPromoCodes();
    if (group) {
      this.toast.info(
        this.i18n.translate("settings.toast.group_selected_title"),
        `${this.i18n.translate("settings.toast.group_selected_message")} «${group.name}».`,
      );
    }
  }

  loadGroups() {
    this.groupsLoading.set(true);
    this.groupsError.set(null);
    this.groups
      .loadGroups()
      .pipe(
        tap((groups) => {
          this.groupsList.set(groups);
          if (groups.length === 0) {
            this.promoCodes.set([]);
            this.selectedGroupId.set(null);
            this.toast.info(
              this.i18n.translate("settings.toast.no_groups_title"),
              this.i18n.translate("settings.toast.no_groups_message"),
            );
            return;
          }

          if (!this.selectedGroupId() && groups.length > 0) {
            this.selectedGroupId.set(groups[0].id);
          }
          this.loadPromoCodes();
        }),
        catchError(() => {
          this.groupsError.set(this.i18n.translate("settings.groups_error"));
          this.toast.error(
            this.i18n.translate("groups.load_error"),
            this.i18n.translate("settings.toast.groups_load_error_message"),
          );
          return EMPTY;
        }),
        finalize(() => this.groupsLoading.set(false)),
      )
      .subscribe();
  }

  createGroup(result: GroupProfileDialogResult) {
    const { name, avatar } = result;
    this.creatingGroup.set(true);
    this.groups
      .createGroup({ name, avatar })
      .pipe(
        tap((group) => {
          this.groupsList.update((groups) => [...groups, group]);
          this.selectedGroupId.set(group.id);
          this.promoCodes.set([]);
          this.toast.success(
            this.i18n.translate("settings.toast.group_created_title"),
            this.i18n.translate("settings.toast.group_created_message"),
          );
        }),
        catchError(() => {
          this.toast.error(
            this.i18n.translate("settings.toast.group_create_error_title"),
            this.i18n.translate("settings.toast.group_create_error_message"),
          );
          return EMPTY;
        }),
        finalize(() => this.creatingGroup.set(false)),
      )
      .subscribe();
  }

  saveSelectedGroup(result: GroupProfileDialogResult) {
    const groupId = this.selectedGroupId();
    if (!groupId || !this.canManageSelectedGroup()) {
      return;
    }

    const { name, avatar } = result;
    this.savingGroup.set(true);
    this.groups
      .updateGroup(groupId, { name, avatar })
      .pipe(
        tap((updated) => {
          this.groupsList.update((groups) =>
            groups.map((group) => (group.id === updated.id ? updated : group)),
          );
          this.toast.success(
            this.i18n.translate("groups.profile_saved_title"),
            this.i18n.translate("groups.profile_saved_message"),
          );
        }),
        catchError(() => {
          this.toast.error(
            this.i18n.translate("groups.profile_save_error_title"),
            this.i18n.translate("common.check_data_retry"),
          );
          return EMPTY;
        }),
        finalize(() => this.savingGroup.set(false)),
      )
      .subscribe();
  }

  sendInvitations(result: GroupInviteDialogResult) {
    const groupId = this.selectedGroupId();
    if (!groupId) {
      this.toast.info(
        this.i18n.translate("settings.toast.email_check_title"),
        this.i18n.translate("settings.toast.email_check_message"),
      );
      return;
    }

    const { emails } = result;
    const parsedEmails = this.parseEmails(emails);
    if (parsedEmails.length === 0) {
      this.toast.info(
        this.i18n.translate("settings.toast.email_check_title"),
        this.i18n.translate("settings.toast.email_check_message"),
      );
      return;
    }

    from(
      this.modal.confirm({
        title: this.i18n.translate("groups.invite_confirm_title"),
        message: this.i18n.translate("groups.invite_confirm_message", {
          emails: parsedEmails.join(", "),
        }),
        confirmText: this.i18n.translate("groups.send_invitations"),
      }),
    )
      .pipe(
        filter(Boolean),
        tap(() => this.addingMember.set(true)),
        switchMap(() =>
          this.groups.inviteMembers(groupId, parsedEmails).pipe(
            tap((result: InviteGroupMembersResult) => {
              const invitations = Array.isArray(result)
                ? result
                : result.invitations;
              const failedEmails = Array.isArray(result)
                ? []
                : result.failedEmails;

              this.promoCodes.update((codes) => [...codes, ...invitations]);
              if (failedEmails.length > 0) {
                this.toast.info(
                  this.i18n.translate("settings.toast.invites_partial_title"),
                  this.i18n.translate(
                    "settings.toast.invites_partial_message",
                    {
                      count: failedEmails.length,
                      emails: failedEmails.join(", "),
                    },
                  ),
                );
                return;
              }

              this.toast.success(
                this.i18n.translate("settings.toast.invites_sent_title"),
                this.i18n.translate("settings.toast.invites_sent_message"),
              );
            }),
            catchError((error) => {
              this.toast.error(
                this.i18n.translate("settings.toast.member_add_error_title"),
                error.message ||
                  this.i18n.translate(
                    "settings.toast.member_add_error_message",
                  ),
              );
              return EMPTY;
            }),
            finalize(() => this.addingMember.set(false)),
          ),
        ),
      )
      .subscribe();
  }

  openCreateGroupDialog() {
    this.openGroupDialog({
      mode: "create",
    })
      .pipe(
        filter(
          (result): result is GroupProfileDialogResult =>
            result?.mode === "create",
        ),
        tap((result) => this.createGroup(result)),
      )
      .subscribe();
  }

  openEditGroupDialog() {
    const group = this.selectedGroup();
    if (!group || !this.canManageSelectedGroup()) return;
    this.openGroupDialog({
      mode: "edit",
      groupName: group.name,
      avatar: group.avatar,
    })
      .pipe(
        filter(
          (result): result is GroupProfileDialogResult =>
            result?.mode === "edit",
        ),
        tap((result) => this.saveSelectedGroup(result)),
      )
      .subscribe();
  }

  openInviteDialog() {
    const group = this.selectedGroup();
    if (!group || !this.canManageSelectedGroup()) return;
    this.openGroupDialog({
      mode: "invite",
      groupName: group.name,
    })
      .pipe(
        filter(
          (result): result is GroupInviteDialogResult =>
            result?.mode === "invite",
        ),
        tap((result) => this.sendInvitations(result)),
      )
      .subscribe();
  }

  resendInvitation(groupId: number, invitation: Pick<GroupInvitation, "id">) {
    if (this.resendingInvitationId() === invitation.id) {
      return;
    }

    this.resendingInvitationId.set(invitation.id);
    this.groups
      .resendInvitation(groupId, invitation.id)
      .pipe(
        tap(() => {
          this.toast.success(
            this.i18n.translate("settings.toast.invitation_resent_title"),
            this.i18n.translate("settings.toast.invitation_resent_message"),
          );
        }),
        catchError((error) => {
          this.toast.error(
            this.i18n.translate("settings.toast.invitation_resend_error_title"),
            this.i18n.translate(
              "settings.toast.invitation_resend_error_message",
            ),
          );
          console.error("Invitation resend failed", error);
          return EMPTY;
        }),
        finalize(() => this.resendingInvitationId.set(null)),
      )
      .subscribe();
  }

  removeMember(
    groupId: number,
    member: Pick<GroupMember, "id" | "role" | "name" | "email">,
  ) {
    if (!this.canManageSelectedGroup() || member.role === "owner") {
      return;
    }

    from(
      this.modal.confirm({
        title: this.i18n.translate("groups.remove_member_confirm_title"),
        message: this.i18n.translate("groups.remove_member_confirm_message", {
          name: member.name ?? member.email ?? "",
        }),
        confirmText: this.i18n.translate("groups.remove_member"),
      }),
    )
      .pipe(
        filter(Boolean),
        switchMap(() => this.groups.removeMember(groupId, member.id)),
        tap((members) => {
          this.groupsList.update((groups) =>
            groups.map((group) =>
              group.id === groupId ? { ...group, members } : group,
            ),
          );
          this.toast.success(
            this.i18n.translate("settings.toast.member_removed_title"),
            this.i18n.translate("settings.toast.member_removed_message"),
          );
        }),
        catchError((error) => {
          this.toast.error(
            this.i18n.translate("settings.toast.member_remove_error_title"),
            error.message ||
              this.i18n.translate("settings.toast.member_remove_error_message"),
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private parseEmails(raw: string) {
    return [
      ...new Set(
        raw.split(/[\s,;]+/).map((value) => value.trim().toLowerCase()),
      ),
    ].filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }

  saveProfile() {
    const { name, avatar, locale } = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.auth
      .updateProfile({
        name,
        avatar,
        locale,
      })
      .pipe(
        tap(() => {
          this.toast.success(
            this.i18n.translate("profile.updated_title"),
            this.i18n.translate("profile.updated_message"),
          );
        }),
        catchError(() => {
          this.profileError.set(
            this.i18n.translate("profile.save_error_title"),
          );
          this.toast.error(
            this.i18n.translate("profile.save_error_title"),
            this.i18n.translate("common.check_data_retry"),
          );
          return EMPTY;
        }),
        finalize(() => this.savingProfile.set(false)),
      )
      .subscribe();
  }

  loadPromoCodes() {
    const groupId = this.selectedGroupId();
    if (!groupId) {
      this.promoCodesLoading.set(false);
      this.promoCodesError.set(null);
      this.promoCodes.set([]);
      return;
    }

    this.promoCodesLoading.set(true);
    this.promoCodesError.set(null);

    this.groups
      .listInvitations(groupId)
      .pipe(
        tap((codes) => this.promoCodes.set(codes)),
        catchError(() => {
          this.promoCodesError.set(
            this.i18n.translate("settings.invites_load_error"),
          );
          return EMPTY;
        }),
        finalize(() => this.promoCodesLoading.set(false)),
      )
      .subscribe();
  }

  ngOnInit() {
    if (this.isGroupsPage()) {
      this.loadGroups();
    }
  }

  private openGroupDialog(data: GroupDialogData) {
    const ref = this.dialog.open<
      GroupDialogResult | undefined,
      GroupDialogData,
      GroupDialogComponent
    >(GroupDialogComponent, {
      data,
      hasBackdrop: true,
      ariaModal: true,
      autoFocus: "first-tabbable",
      restoreFocus: true,
      disableClose: false,
      width: "min(34rem, calc(100vw - 2rem))",
      maxWidth: "calc(100vw - 2rem)",
      backdropClass: "app-dialog-backdrop",
      panelClass: "ccs-dialog-panel",
    });

    return ref.closed;
  }
}
