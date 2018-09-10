'use strict';

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = (env, argv) => {
  return {
    context: __dirname, // to automatically find tsconfig.json
    devtool: 'source-map',
    entry: './src/text-decorator.ts',
    mode: 'development',
    output: {
      filename: 'text-decorator.js',
      // the name of the exported library
      library: 'TextDecorator',
      libraryTarget: 'umd',
    },
    performance: { hints: false },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          enforce: 'pre',
          use: [
            {
              loader: 'tslint-loader',
              options: {}
            }
          ]
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true // IMPORTANT! use transpileOnly mode to speed-up compilation
          }
        },
        {
          // Explicitly specify parse5 library, as it it's written in ES6 syntax and doesn't
          // provide any ES5-compatible version. We could use babel, but TypeScript loader
          // is already being used and configured correctly to target ES5. There's no need to
          // add yet another NPM package and a separate config.
          test: /parse5/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true // IMPORTANT! use transpileOnly mode to speed-up compilation
          }
        }
      ]
    },
    resolve: {
      extensions: [ '.ts', '.tsx', '.js' ]
    },
    stats: {
      // suppress "export not found" warnings about re-exported types
      warningsFilter: /export .* was not found in/
    },
    externals: {
      'react': 'React',
      'react-dom': 'ReactDOM'
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin()
    ]
  };
};
