const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ---------------------------------------------------------------------------
// Bundle size analysis
// ---------------------------------------------------------------------------
// To visualize the bundle, run:
//   EXPO_PUBLIC_ANALYZE=1 bun run dev
// or pipe the Metro bundle to source-map-explorer:
//   npx react-native bundle --entry-file index.ts --bundle-output /tmp/bundle.js --sourcemap-output /tmp/bundle.js.map
//   npx source-map-explorer /tmp/bundle.js /tmp/bundle.js.map
//
// To check tree-shaking, enable Hermes bytecode output and compare sizes.
//
// Metro does NOT have a built-in bundle analyser like webpack-bundle-analyzer.
// The recommended approach for Expo is `@expo/metro-config` with `unstable_enablePackageExports`
// and using the `metro-bundle-size` or `source-map-explorer` CLI tools (see README).
// ---------------------------------------------------------------------------

// Enable package.json exports field for better tree-shaking of ESM packages
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'default'];

// Watch the backend/convex directory for generated API types
const backendDir = path.resolve(__dirname, '../backend');
config.watchFolders = [backendDir];

// Ensure node_modules resolution works from the backend directory
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(backendDir, 'node_modules'),
];

// Add support for additional asset types
config.resolver.assetExts.push(
  // Fonts
  'ttf',
  'otf',
  // Audio
  'mp3',
  'wav',
  'm4a',
  // Video
  'mp4',
  'mov',
  // Documents
  'pdf'
);

module.exports = withNativeWind(config, { input: './global.css' });
