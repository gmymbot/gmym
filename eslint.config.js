const js = require("@eslint/js");

module.exports = [
    {
        ignores: ["node_modules/**", "assets/**", ".env"],
    },
    js.configs.recommended,
    {
        files: ["eslint.config.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                module: "readonly",
            },
        },
    },
    {
        files: ["src/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                process: "readonly",
                console: "readonly",
                Buffer: "readonly",
                TextEncoder: "readonly",
                Uint8Array: "readonly",
                fetch: "readonly",
                setInterval: "readonly",
                globalThis: "readonly",
                require: "readonly",
                module: "readonly",
                __dirname: "readonly",
                signale: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-prototype-builtins": "off",
            "no-empty": ["error", { allowEmptyCatch: true }],
        },
    },
];
