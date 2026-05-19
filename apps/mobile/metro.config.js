const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// pnpm monorepo: workspace root watch + 두 단계 node_modules 해석.
// 참고: https://docs.expo.dev/guides/monorepos/
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// pnpm symlink 충돌 회피: 상위 디렉터리로 자동 fallback 금지
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
