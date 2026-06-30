import { inject } from "@angular/core";
import { CanMatchFn, Router, UrlSegment, UrlTree } from "@angular/router";
import { combineLatest, filter, map, take } from "rxjs";
import { AuthService } from "../services/auth.service";

function buildReturnUrl(segments: UrlSegment[]) {
  const path = segments.map((segment) => segment.path).join("/");
  return path ? `/${path}` : "/dashboard";
}

function waitForUser(auth: AuthService) {
  return combineLatest([auth.authReady$, auth.user$]).pipe(
    filter(([ready]) => ready),
    take(1),
  );
}

export const guestOnlyGuard: CanMatchFn = (_route, _segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return waitForUser(auth).pipe(
    map(([, user]) => (user ? router.createUrlTree(["/dashboard"]) : true)),
  );
};

export const authRequiredGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const returnUrl = buildReturnUrl(segments);

  return waitForUser(auth).pipe(
    map(([, user]): true | UrlTree =>
      user
        ? true
        : router.createUrlTree(["/login"], {
            queryParams: { returnUrl },
          }),
    ),
  );
};
