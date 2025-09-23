/** @type {import("prettier").Config} */

module.exports = {
  // --- core Prettier style ---
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  tabWidth: 2,
  printWidth: 100,

  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: [
    "<THIRD_PARTY_MODULES>",
    "^react$",
    "^@/?(component|components|slices|store|utils|types|context|src|config|assets|view)(?:/.*)?$",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ["typescript", "jsx"],
};
