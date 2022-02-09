type VueKeycloakConfig = {
    keycloakConfig: Keycloak.KeycloakConfig;
    keycloakInitOptions: Keycloak.KeycloakInitOptions;
    AutoRefreshTokensOnExpiration: boolean;
}

export type { VueKeycloakConfig }