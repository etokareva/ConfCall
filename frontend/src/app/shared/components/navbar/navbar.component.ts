import { Component, effect, inject, signal } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { MeetingService } from "../../../core/services/meeting.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { IconComponent } from "../icon/icon.component";
import { DropdownComponent } from "../dropdown/dropdown.component";
import { TooltipDirective } from "../tooltip/tooltip.directive";

@Component({
  selector: "ccs-navbar",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    IconComponent,
    DropdownComponent,
    TooltipDirective,
    NgOptimizedImage,
  ],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.scss",
})
export class NavbarComponent {
  auth = inject(AuthService);
  meetings = inject(MeetingService);
  readonly avatarLoadFailed = signal(false);

  constructor() {
    effect(() => {
      const avatar = this.auth.user()?.avatar?.trim() ?? null;
      if (avatar) {
        this.avatarLoadFailed.set(false);
      }
    });
  }

  userAvatar() {
    const avatar = this.auth.user()?.avatar?.trim();
    return avatar ? avatar : null;
  }

  onAvatarLoadError() {
    this.avatarLoadFailed.set(true);
  }

  userInitial() {
    const user = this.auth.user();
    return (user?.name || user?.email || "?")[0].toUpperCase();
  }

  showAvatar() {
    return this.userAvatar() !== null && !this.avatarLoadFailed();
  }
}
