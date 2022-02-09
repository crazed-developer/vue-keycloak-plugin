import Keycloak from "keycloak-js";
import { App, Plugin, reactive } from "vue";
import { OidcReactive } from "./OidcReactive";
import { VueKeycloakConfig } from "./VueKeycloakConfig";
import { VueKeycloak } from "./VueKeycloak";

let keycloak: Keycloak.KeycloakInstance | undefined = undefined;

const oidcReactive = reactive<OidcReactive>({
    isAuthenticated: false,
    accessToken: undefined
})

const useKeycloak = (): VueKeycloak => {

    return {
        keycloak: keycloak,
        oidcReactive: oidcReactive,
    }
}

/**
 * Calling this function will return a promise of an access token. If the 
 * token is expired, or will expire within 10 seconds. It will automatically
 * refresh the access token
 * @returns A promise of an access token string
 */
const useAccessToken = async (): Promise<string | undefined> => {
    if (keycloak === null || keycloak === undefined) {
        throw new Error("[VUEKEYCLOAK] Keycloak is not initialized");
    }

    try {
        const refreshed: boolean = await keycloak.updateToken(10);

        if (refreshed) {
            console.log("[VUEKEYCLOAK] Token refreshed");
            oidcReactive.accessToken = keycloak.token;
        } else {
            console.log("[VUEKEYCLOAK] Token not refreshed");
        }

    } catch (error) {
        throw new Error('[VUEKEYCLOAK] Failed to refresh the token, or the session has expired');
    }

    return keycloak.token;
}

/**
 * This is a helper function that will add the Auth header to the request.
 * 
 * You can do this manually using the function `useAccessToken`
 *  
 * Throws an error if keycloak object is not initialized, and if user not authenticated.
 * 
 * @param requestInit The requestInit object that will be passed to the fetch function
 * @returns the requestInit object with the Authorization header
 */
const setBearerToken = async (requestInit?: any | undefined): Promise<RequestInit> => {
    if (keycloak === null || keycloak === undefined) {
        throw new Error("[VUEKEYCLOAK] Keycloak is not initialized");
    }

    if (!keycloak.authenticated) {
        throw new Error("[VUEKEYCLOAK] User is not authenticated");
    }


    const token = await useAccessToken();

    if (requestInit === undefined) {
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    } else if (requestInit.headers === undefined) {

        requestInit.headers = {
            Authorization: `Bearer ${token}`
        }

        return requestInit;



    } else {
        requestInit.headers.Authorization = `Bearer ${token}`;
    };

    return requestInit;
}



/**
 * Check if the user has all the specified REALM roles, not some of them. But ALL.
 * @param roles An array of strings representing the roles that the user must have
 * @returns If user has all roles, it will return true, otherwise false.
 */
const hasAllRealmRoles = (roles: string[]): boolean => {
    if (keycloak === null || keycloak === undefined) {
        throw new Error("[VUEKEYCLOAK] Keycloak is not initialized");
    }

    const realmAccess = keycloak.tokenParsed?.realm_access;

    if (realmAccess !== undefined) {
        return roles.every(role =>
            realmAccess.roles.includes(role)
        );
    } else {
        console.log("[VUEKEYCLOAK] JWT is missing realm_access");
        return false;
    }

}

/**
 * * Check if the user has all the specified CLIENT/RESOURCE roles, not some of them. But ALL.
 * @param resourceName The resource (client name) that the user must have access to
 * @param roles An array of strings representing the roles that the user must have
 * @returns If user has all roles, it will return true, otherwise false.
 */
const hasAllResourceRoles = (resourceName: string, roles: string[]): boolean => {
    if (keycloak === null || keycloak === undefined) {
        throw new Error("[VUEKEYCLOAK] Keycloak is not initialized");
    }

    const resourceAccess = keycloak?.tokenParsed?.resource_access;

    if (resourceAccess !== undefined) {

        const clientRoles: Keycloak.KeycloakRoles = resourceAccess[resourceName];

        if (clientRoles !== undefined) {
            return roles.every(role =>
                clientRoles.roles.includes(role)
            );
        } else {
            console.log("[VUEKEYCLOAK] JWT has resource_access but the client is missing");
            return false;
        }

    } else {
        console.log("[VUEKEYCLOAK] JWT is missing resource_access");
        return false;
    }
}

const keycloakPlugin: Plugin = {
    async install(app: App, options: VueKeycloakConfig) {

        console.log("[VUEKEYCLOAK] Creating Keycloak instance");
        keycloak = Keycloak(options.keycloakConfig);


        // keycloak.onAuthSuccess = () => {
        //     console.log("[VUEKEYCLOAK] Default Auth success callback, override using onAuthSuccess on options object");
        // }

        // keycloak.onAuthError = () => {
        //     console.log("[VUEKEYCLOAK] Default Auth success error, override using onAuthError on options object");
        // }

        // keycloak.onAuthRefreshSuccess = () => {
        //     console.log("[VUEKEYCLOAK] Default Auth refresh success, override using onAuthRefreshSuccess on options object");
        // }

        // keycloak.onAuthRefreshError = () => {
        //     console.log("[VUEKEYCLOAK] Default Auth refresh error, override using onAuthRefreshError on options object");
        // }

        // Internally the keycloak adapter from Redhat sets a timeout, when the access token expires 
        // And calls the onTokenExpired
        if (options.AutoRefreshTokensOnExpiration) {
            console.log("[VUEKEYCLOAK] Auto refresh access token on expiration is enabled");
            keycloak.onTokenExpired = () => {
                useAccessToken();
            }
        }

        // keycloak.onAuthLogout = () => {
        //     console.log("[VUEKEYCLOAK] Default Logout, override using onAuthLogout on options object");
        // }


        // ------------------------------------------------------------------
        // Make the keycloak instance injectable, using the inject function.
        // For example: could be done like this.
        // const kc: Keycloak.KeycloakInstance | undefined = inject<Keycloak.KeycloakInstance>("keycloak");
        // ------------------------------------------------------------------
        app.provide<Keycloak.KeycloakInstance>('keycloak', keycloak);

        app.config.globalProperties.$keycloak = keycloak;


        const authenticated = await keycloak.init(options.keycloakInitOptions);

        console.log("[VUEKEYCLOAK] Setting oidcReactive isAuthenticated status, to: " + authenticated);
        oidcReactive.isAuthenticated = authenticated;

        if (authenticated) {
            console.log("[VUEKEYCLOAK] Setting oidcReactive accessToken status (NOT SHOWN HERE FOR SECURITY REASONS)");
            oidcReactive.accessToken = keycloak.token;
        }
    }
};

export { keycloakPlugin, useKeycloak, useAccessToken, hasAllRealmRoles, hasAllResourceRoles, setBearerToken };