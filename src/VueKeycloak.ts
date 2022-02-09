import Keycloak from "keycloak-js";
import { OidcReactive } from "./OidcReactive";

interface VueKeycloak {
    keycloak: Keycloak.KeycloakInstance | undefined;
    oidcReactive: OidcReactive;
}

export { VueKeycloak };