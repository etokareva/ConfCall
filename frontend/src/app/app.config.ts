import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { OverlayModule } from "@angular/cdk/overlay";
import { DialogModule } from "@angular/cdk/dialog";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(OverlayModule),
    importProvidersFrom(DialogModule),
  ],
};
