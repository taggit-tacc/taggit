import { EnvironmentType } from './environmentType';

export interface AppEnvironment {
  jwt?: string;
  production: boolean;
  backend: EnvironmentType;
}

export const environment: AppEnvironment = {
  production: true,
  // only used during testing
  backend: EnvironmentType.Production,
};
