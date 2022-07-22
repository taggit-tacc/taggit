// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { EnvironmentType } from './environmentType';
import { jwt as devJWT } from './jwt';

export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  jwt?: string;
  clientId: string;
  baseHref: string;
  backend: EnvironmentType;
}

export const environment: AppEnvironment = {
  production: false,
  apiUrl: 'https://agave.designsafe-ci.org/geo/v2/',
  clientId: 'vtDnU5adn3ue7MMNPTq__bvxSa8a',
  // apiUrl: 'https://localhost:8888',
  // clientId: 'RMCJHgW9CwJ6mKjhLTDnUYBo9Hka',
  baseHref: '/',
  jwt: devJWT,
  backend: EnvironmentType.Local,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
