module.exports = {
  displayName: "NgrxIDB",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/ngrx-idb",

  setupFilesAfterEnv: ["<rootDir>/test-setup.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
      stringifyContentPathRegex: "\\.(html|svg)$",
    },
  },
  transform: { "^.+\\.(ts|js|html)$": "jest-preset-angular" },
};
