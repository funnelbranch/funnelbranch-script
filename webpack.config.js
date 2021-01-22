const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'funnelbranch.js',
    path: path.resolve(__dirname, 'build'),
  },
  performance: {
    hints: 'error',
    maxAssetSize: 5 * 1024, // 5kB
  },
};
