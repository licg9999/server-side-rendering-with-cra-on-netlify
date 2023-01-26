const glob = require('glob');
const { set } = require('lodash');
const TranspilePlugin = require('transpile-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const envInQuestion = process.env.NODE_ENV ?? 'development';
const shouldPrintConfig = Boolean(process.env.PRINT_CONFIG);

process.env.NODE_ENV = envInQuestion;
process.env.FAST_REFRESH = 'false';
const webpackConfig = require('react-scripts/config/webpack.config')(envInQuestion);

webpackConfig.entry = () => glob.sync('src/server/**/*', { nodir: true, absolute: true });
webpackConfig.target = 'node';
webpackConfig.externals = [nodeExternals()];

removeAssetsEmitting();
removeUnusedPluginsAndOptimizers();

webpackConfig.plugins.push(
  new TranspilePlugin({
    extentionMapping: { '.ts': '.js', '.tsx': '.js' },
  })
);

if (shouldPrintConfig) {
  console.dir(webpackConfig, { depth: Infinity });
}

function removeAssetsEmitting() {
  webpackConfig.module.rules.forEach(({ oneOf }) => {
    oneOf?.forEach((rule) => {
      if (rule.type?.startsWith('asset')) {
        set(rule, 'generator.emit', false);
      }

      const fileLoaderUseItem = rule.use?.find(({ loader }) => loader?.includes('file-loader'));
      if (fileLoaderUseItem) {
        set(fileLoaderUseItem, 'options.emitFile', false);
      }

      const cssLoaderUseItemIndex = rule.use?.findIndex(({ loader }) =>
        loader?.includes('css-loader')
      );
      if (cssLoaderUseItemIndex >= 0) {
        const cssLoaderOptionModules = rule.use[cssLoaderUseItemIndex].options?.modules;
        if (cssLoaderOptionModules) {
          cssLoaderOptionModules.exportOnlyLocals = true;
        }
        rule.use = rule.use.slice(cssLoaderUseItemIndex);
      }
    });
  });
}

function removeUnusedPluginsAndOptimizers() {
  webpackConfig.plugins = webpackConfig.plugins.filter((p) => {
    const ctorName = p.constructor.name;
    if (ctorName.includes('Html')) return false;
    if (ctorName.includes('Css')) return false;
    if (ctorName === 'WebpackManifestPlugin') return false;
    if (ctorName === 'DefinePlugin') return false;
    return true;
  });

  webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter((m) => {
    const ctorName = m.constructor.name;
    if (ctorName.includes('Css')) return false;
    return true;
  });
}

module.exports = webpackConfig;
