import { EnvironmentType } from './environmentType';

export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  jwt?: string;
  clientId: string;
  baseHref: string;
  backend: EnvironmentType;
}

export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://agave.designsafe-ci.org/geo/v2/',
  clientId: 'jHXnvsmQQcmP43qlrG7ATaxFXHQa',
  baseHref: '/',
  backend: EnvironmentType.Production
};
