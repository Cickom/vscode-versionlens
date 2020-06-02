const fs = require('fs');
const path = require('path');

module.exports = function (env, argv) {

  const logging = env && env.logging == 'true'
  const test = env && env.test == 'true'

  const devConfigFile = './tsconfig.src.json'
  const testConfigFile = '../test/tsconfig.test.json'

  const entry = test ?
    path.resolve(__dirname, '../test/runner.ts') :
    path.resolve(__dirname, './activate.ts');

  const tsconfigFile = path.resolve(
    __dirname,
    test ? testConfigFile : devConfigFile
  );

  console.log("[info] " + tsconfigFile)
  const outputFile = test ? 'extension.test.js' : 'extension.bundle.js'

  return {

    target: 'node',

    node: {
      __dirname: false
    },

    entry,

    externals: generateExternals(),

    resolve: {
      extensions: ['.ts'],
      alias: generateAliases()
    },

    module: {
      rules: [{
        test: /\.ts?$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: tsconfigFile,
            transpileOnly: true
          }
        }]
      }]
    },

    devtool: 'source-map',

    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: outputFile,
      libraryTarget: "commonjs2",
      devtoolModuleFilenameTemplate: "../[resource-path]",
    },

  }

  function generateAliases() {
    log("[debug] Generating aliases")

    let aliases = {
      ...generateAreaAliases(''),
      ...generateAreaAliases('infrastructure.providers')
    }

    log("[debug] Generated aliases", aliases)

    return aliases;
  }

  function generateAreaAliases(relativePath) {
    log("[debug] Generating area aliases for " + relativePath)

    const areaAliases = {}
    const areaPrefix = relativePath.length > 0 ?
      `${relativePath}.` :
      relativePath;

    getDirectories(relativePath)
      .sort()
      .map(areaPath => ({ areaName: path.basename(areaPath), areaPath }))
      .forEach(
        area => {
          const areaFullName = `${areaPrefix}${area.areaName}`;
          const areaFullPath = path.resolve(__dirname, relativePath, area.areaPath);
          const indexTestPath = path.resolve(areaFullPath, 'index.test.ts');

          areaAliases[areaFullName] = areaFullPath;
          if (test && fs.existsSync(indexTestPath)) {
            areaAliases['test.' + areaFullName] = indexTestPath;
          }
        }
      )

    return areaAliases;
  }

  function generateExternals() {
    log("[debug] Generating externals")

    const externals = {
      "vscode": "commonjs vscode",
      "@npmcli/promise-spawn": "commonjs @npmcli/promise-spawn"
    }

    getNodeModulesNames()
      .forEach(
        moduleName => externals[moduleName] = `commonjs ${moduleName}`
      )

    log("[debug] Generated externals", externals)

    return [
      externals,
      /package\.json$/,
    ]
  }

  function getNodeModulesNames() {
    return getDirectories('../node_modules')
  }

  function getDirectories(relativePath) {
    const resolvedPath = path.resolve(__dirname, relativePath)
    log(`[debug] getDirectories ${relativePath}`)
    return fs.readdirSync(resolvedPath).filter(
      function (file) {
        return fs.statSync(resolvedPath + '/' + file).isDirectory();
      }
    );
  }

  function log(message, ...optional) {
    if (logging) console.log(message, ...optional)
  }

}