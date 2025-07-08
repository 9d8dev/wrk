import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import perfectionist from "eslint-plugin-perfectionist";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    plugins: {
      perfectionist,
    },
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          type: "line-length",
          order: "desc",
          newlinesBetween: "always",
          internalPattern: ["^@/"],
          groups: [
            "type",
            "builtin",
            "external",
            "internal-components",
            "internal-hooks",
            "internal-utils",
            "internal-assets",
            "internal",
            ["parent", "sibling", "index"],
            "object",
            "unknown",
          ],
          customGroups: [
            {
              groupName: "internal-components",
              elementNamePattern: "^@/components",
            },
            {
              groupName: "internal-hooks",
              elementNamePattern: "^@/hooks",
            },
            {
              groupName: "internal-utils",
              elementNamePattern: "^@/lib",
            },
            {
              groupName: "internal-assets",
              elementNamePattern: "^@/public",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
