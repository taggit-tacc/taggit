// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { EnvironmentType } from './environmentType';

export interface AppEnvironment {
  backend: EnvironmentType;
  production: boolean;
}

export const environment: AppEnvironment = {
  backend: EnvironmentType.Local,
  production: false,
};
