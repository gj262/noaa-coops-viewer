require('babel-register')

const config = require('../config')
const debug = require('debug')('kit:bin:compile')

debug('Create webpack compiler.')

const webpackConfig = require('../build/webpack')
const compiler = require('webpack')(webpackConfig)

const handler = function (err, stats) {
  const jsonStats = stats.toJson()

  debug('Webpack compile completed.')
  console.log(stats.toString(config.compiler_stats))

  if (err) {
    debug('Webpack compiler encountered a fatal error.', err)
    process.exit(1)
  } else if (jsonStats.errors.length > 0) {
    debug('Webpack compiler encountered errors.')
    process.exit(1)
  } else if (jsonStats.warnings.length > 0) {
    debug('Webpack compiler encountered warnings.')

    if (config.compiler_fail_on_warning) {
      process.exit(1)
    }
  } else {
    debug('No errors / warnings encountered.')
  }
};

if (config.compiler_watch) {
  compiler.watch({}, handler)
} else {
  compiler.run(handler)
}
