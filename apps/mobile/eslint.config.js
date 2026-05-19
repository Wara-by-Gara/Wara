// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// 와라 공통 규칙(@wara/eslint-config)이 flat config 기반이 아직 mobile 호환 미흡 → 인라인 추가.
// 핵심은 루트 CLAUDE.md "Never" 규칙(any 금지·미사용 var 금지)을 mobile에도 강제하는 것.
module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports' },
      ],
    },
    ignores: ['dist/*', '.expo/*'],
  },
]);
