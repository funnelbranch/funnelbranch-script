const path = require('path');
const { DefinePlugin } = require('webpack');
const { execSync } = require('child_process');

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
  plugins: [
    new DefinePlugin({
      BUILD_COMMIT_HASH: JSON.stringify(commitHash()),
    }),
  ],
};

function commitHash() {
  let hash = process.env.BUILD_COMMIT_HASH;
  if (!hash) {
    hash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).toString();
  }
  return hash.substring(0, 7);
}
