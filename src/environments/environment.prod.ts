export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  jwt?: string;
  clientId: string;
  baseHref: string;
}

export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://agave.designsafe-ci.org/geo/v2/',
  clientId: 'jHXnvsmQQcmP43qlrG7ATaxFXHQa',
  baseHref: '/'
};
