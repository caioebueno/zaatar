const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Same fix as driver-app: Metro walks up the tree into the monorepo root and
// can find a second copy of React there, causing two React instances at runtime.
// Pin every require('react*') to this app's own node_modules.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(__dirname, 'node_modules/react'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

module.exports = config;
