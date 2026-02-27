const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

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

// Bundle size analysis:
// Run `bun bundle:analyze` (or `npx react-native bundle --platform android --dev false
//   --entry-file index.ts --bundle-output /tmp/bundle.js --sourcemap-output /tmp/bundle.map`)
// then open the map file with source-map-explorer:
//   npx source-map-explorer /tmp/bundle.js /tmp/bundle.map
//
// Alternatively use the Metro built-in visualiser:
//   EXPO_BUNDLE_VISUALIZE=1 npx expo export
//
// Key modules to watch for bundle bloat:
//   - firebase (only messaging/auth needed - tree-shake aggressively)
//   - @sentry/react-native (loads eagerly - consider async init)
//   - expo-camera / expo-av (lazy load; only needed in AR/chat)

module.exports = withNativeWind(config, { input: './global.css' });
