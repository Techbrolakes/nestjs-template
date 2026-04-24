// Accepts both plain Conventional Commits and an optional emoji prefix:
//   fix(auth): reject expired token
//   🐛 fix(auth): reject expired token
//
// Strips the emoji for linting so all other rules still apply to the
// underlying `type(scope): subject`.
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "docs",
        "refactor",
        "test",
        "perf",
        "style",
        "build",
        "ci",
        "revert",
      ],
    ],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
  parserPreset: {
    parserOpts: {
      // Optional emoji (or any non-whitespace token) prefix, then
      // the standard Conventional Commits header. `\S+` correctly
      // handles multi-codepoint emojis like `♻️` (base + variation
      // selector) and ZWJ sequences without a fragile pictographic
      // regex. The prefix is captured but unused; the rest parses
      // as normal Conventional Commits.
      headerPattern:
        /^(?:(\S+)\s+)?(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/u,
      headerCorrespondence: ["emoji", "type", "scope", "breaking", "subject"],
    },
  },
};
