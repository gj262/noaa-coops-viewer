import webpack from 'webpack'
import { argv } from 'yargs'
import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const globals = {
  'process.env': {
    NODE_ENV: JSON.stringify(process.env.NODE_ENV)
  },
  NODE_ENV: process.env.NODE_ENV,
  __DEV__: process.env.NODE_ENV === 'development',
  __PROD__: process.env.NODE_ENV === 'production',
  __DEBUG__: process.env.NODE_ENV === 'development' && !argv.no_debug
}

const basePath = __dirname

const webpackConfig = {
  mode: process.env.NODE_ENV,
  name: 'compare',
  target: 'web',
  devtool:
    process.env.NODE_ENV === 'development' ? 'inline-source-map' : 'source-map',
  entry: {
    app: process.env.ENTRY || './src/app.js'
  },
  output: {
    filename: `[name].js`,
    path: path.join(__dirname, 'dist')
  },
  plugins: [
    new webpack.DefinePlugin(globals),
    new HtmlWebpackPlugin({
      template: basePath + '/src/index.html',
      hash: false,
      filename: 'index.html',
      inject: 'body',
      minify: {
        collapseWhitespace: true
      }
    }),
    new MiniCssExtractPlugin(`[name].css`)
  ],
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        enforce: 'pre',
        use: 'eslint-loader'
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {}
          },
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  }
}

export default webpackConfig
