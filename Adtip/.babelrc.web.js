module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { browsers: ['last 2 versions'] },
      modules: false 
    }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-class-static-block',
  ],
};