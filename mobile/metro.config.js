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

module.exports = withNativeWind(config, { input: './global.css' });
