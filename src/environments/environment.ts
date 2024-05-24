// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { EnvironmentType } from './environmentType';
import { jwt as devJWT } from './jwt';

export interface AppEnvironment {
  jwt?: string;
  backend: EnvironmentType;
  production: boolean;
}

export const environment: AppEnvironment = {
  backend: EnvironmentType.Experimental,
  jwt: devJWT,
  production: false,
};
