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

// Expo SDK 54+ 권장: 패키지의 package.json `exports` 필드를 metro가 인식하도록.
config.resolver.unstable_enablePackageExports = true;

// pnpm monorepo: .pnpm 내부 패키지가 transitive dep(@expo/metro-runtime 등)를
// resolve하려면 hierarchical lookup이 필요. (root .npmrc의 public-hoist-pattern으로
// root node_modules에 hoist된 패키지를 metro가 .pnpm 내부에서도 찾을 수 있음.)

module.exports = config;
