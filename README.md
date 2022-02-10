# vue-keycloak-plugin

This plugin is ment to ease the use of OIDC with the Keycloak Authentication server from Redhat. In the web framework Vue version 3. It needs to be installed as a plugin, using the use method.

The plugin is not ment to abstract away the official Javascript adapter from Redhat. It's ment to expose you to the keycloak object. While providing some application programming conviniences.

## Add the dependency to your project

```bash
>npm install @nobelium/vue-keycloak-plugin keycloak-js
```

## Installation in your project:

```javascript
let app = createApp(App);

// Define the keycloak configuration
const keycloakConfig: Keycloak.KeycloakConfig = {
  url: "https://path-to-keycloak.dk/auth",
  realm: "realmName",
  clientId: "clientId",
};

// Define the keycloak init options
const keycloakInitOptions: Keycloak.KeycloakInitOptions = {
  onLoad: "login-required",
  checkLoginIframe: false,
  flow: "standard",
  enableLogging: true,
};

// Package Init options into the Vue plugin object
const vueKeycloakConfig: VueKeycloakConfig = {
  keycloakConfig: keycloakConfig,
  keycloakInitOptions: keycloakInitOptions,
  AutoRefreshTokensOnExpiration: true,
};

// Information on the: AutoRefreshTokenOnExpiration property.
// ----------------------------------------------------------
// The official Keycloak adapter has an event handler named onTokenExpired()
// default this is set to undefined. However if you create an eventhandler
// and attaches it to this property. Then the Keycloak adapter will create
// a timeout event that calls this function, when the access token expires.
// if you set AutoRefreshTokenOnExpiration to true. The VueKeycloak plugin
// Will set an event handler that will be called each time the access token
// expires. Where it will update the tokens automatically, and thus keep
// the user session logged in.
//
// For getting a valid access token, you should always use the function:
// useAccessToken();
// or the convinience function:
// setBearerToken();

// Use the plugin, and pass the VueKeycloakConfiguration to the plugin
app.use(keycloakPlugin, vueKeycloakConfig).mount("#app");
```

## The Plugin exposes the following helper functions:

```javascript
/*
Returns an object of type VueKeycloak. Which exposes an instance of the keycloak adapter. as well as an object of type OidsReactive, which contains authentication status + the access token (Access token is not guaranteed to be valid, so will probably be removed in a later version.)
*/
useKeycloak();
```

```javascript
/*
Which returns the promise of an access token, if the current token has expired, or will expire within the next 10 seconds. A new token will be fetched using the refresh token held by the Keycloak adapter. provided that the user is authenticated. Which if not will throw an error.
*/
useAccessToken();
```

```javascript
/*
If you pass your fetch() header object to this function. The function will use the function described above to get a valid access token. On success it will add the token to the header object as an Authorization: bearer (token) header.. If you pass in an undefined / no parameters. It will return a header object with only the header set.
*/
setBearerToken(headerObject: any | undefined).
```

```javascript
/*
Tests if the logged in user has all roles defined by name in the string array roles, on realm level. If he has all roles passed, not just some. And is logged in. It will return true
*/
hasAllRealmRoles(roles: string[]): boolean
```

```javascript
/*
Tests if the logged in user has all roles defined by name in the string array roles, on the client level. If he has all roles passed, not just some. And is logged in. It will return true
*/
hasAllResourceRoles(resourceName: string, roles: string[]): boolean
```

```javascript
/*
Tests if the logged in user has all roles defined by name in the string array roles, on the client level (Client means: A client in the Keycloak Realm). If the user has all roles passed, not just some. And is logged in. It will return true
*/
hasAllResourceRoles(resourceName: string, roles: string[]): boolean
```

```javascript
/*

*/
hasAllResourceRoles(resourceName: string, roles: string[]): boolean
```

## Using the plugin in your application:

```javascript
import { getCurrentInstance, inject, onMounted, ref, watch } from "vue";
import Keycloak from "keycloak-js";
import { setBearerToken, useAccessToken, useKeycloak } from "@nobelium/vue-keycloak-plugin";

// Using object destructureing to get the two properties of the OidsReactive object.
const { oidcReactive, keycloak } = useKeycloak();

// You can also get the Keycloak instance using the inject method:
const injectedKeycloak: Keycloak.KeycloakInstance | undefined = inject < Keycloak.KeycloakInstance > "keycloak";

// Creating a watcher in the isAuthenticated gives you a way to react to changes in Auth status
watch(
  () => oidcReactive.isAuthenticated,
  (n, o) => {
    console.log("isAuthenticated changed: " + o + " -> " + n);
  }
);
```

```html
<template>
  <div v-if="oidcReactive.isAuthenticated">
    <p>Place all ui that should only be shown if authenticated here.</p>
    <p>You can also place more than one isAuthenticated() block however you need.</p>

    <div>
      <p>
        Using the accountManagement() function on the Keycloak object, will redirect the user to the count management on
        the keycloak server.
      </p>
      <div @click="keycloak?.accountManagement()">Manage Account</div>
    </div>
  </div>
</template>
```
