import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    ignores: ["convex/_generated/**"],
    rules: {
      "no-case-declarations": "warn",
      "react/no-unescaped-entities": "off",
      "react-hooks/rules-of-hooks": "warn",
    },
  },
];
