import webpack from 'webpack';
import { argv } from 'yargs'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const globals = {
  'process.env'  : {
    'NODE_ENV' : JSON.stringify(process.env.NODE_ENV)
  },
  'NODE_ENV'     : process.env.NODE_ENV,
  '__DEV__'      : process.env.NODE_ENV === 'development',
  '__PROD__'     : process.env.NODE_ENV === 'production',
  '__DEBUG__'    : process.env.NODE_ENV === 'development' && !argv.no_debug
};

const path_base = __dirname;

const webpackConfig = {
  name: 'compare',
  target: 'web',
  devtool: 'inline-source-map',
  entry: {
    app: [
      path_base + '/src/app.js'
    ],
    logging: [
      path_base + '/src/utils/logging.js'
    ],
    vendor: [
      'd3-scale',
      'd3-time-format',
      'history',
      'moment',
      'react',
      'react-redux',
      'react-router',
      'redux',
      'redux-simple-router'
    ]
  },
  output: {
    filename: `[name].js`,
    path: 'dist/',
    publicPath: '/'
  },
  plugins: [
    new webpack.DefinePlugin(globals),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor']
    }),
    new HtmlWebpackPlugin({
      template: path_base + '/src/index.html',
      hash: false,
      filename: 'index.html',
      inject: 'body',
      minify: {
        collapseWhitespace: true
      }
    }),
    new ExtractTextPlugin(`[name].css`)
  ],
  resolve: {
    root: path_base + '/src',
    extensions: ['', '.js', '.jsx']
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      }
    ],
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          cacheDirectory: true,
          plugins: ['transform-runtime'],
          presets: ['es2015', 'react', 'stage-0']
        }
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract(
          'style-loader',
          'css-loader?sourceMap!postcss-loader!sass-loader'
        )
      }
    ]
  },
  sassLoader: {
    includePaths: path_base + '/src/styles'
  }
};

export default webpackConfig
