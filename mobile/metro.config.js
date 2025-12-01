const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

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
