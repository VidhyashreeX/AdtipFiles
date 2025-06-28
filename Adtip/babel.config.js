module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['module:@react-native/babel-preset', {jsxImportSource: 'nativewind'}],
      'nativewind/babel',
    ],
    plugins: [
      '@babel/plugin-transform-class-static-block',
    ],
  };
};
