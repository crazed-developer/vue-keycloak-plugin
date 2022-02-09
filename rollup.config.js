export default {
  input: "./transpiled/index.js",
  output: [
    {
      dir: "dist/",
      entryFileNames: "[name].esm.js",
      chunkFileNames: "[name]-[hash].esm.js",
      format: "es",
      sourcemap: true,
    },
  ],
  external: ["keycloak-js", "vue"],
};
