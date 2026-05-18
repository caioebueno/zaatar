const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// After the npm workspace install hoisted react-native to the monorepo root,
// react-native's renderer and expo-router ended up using different React
// instances. Force every require('react') to the root copy so there is
// exactly one ReactSharedInternals dispatcher at runtime.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(__dirname, '../node_modules/react'),
  'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
};

module.exports = config;
