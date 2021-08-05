/* eslint-disable */
const path = require("path");

// const resolve = dir => {
//   return path.join(__dirname, dir);
// };
// 项目部署基础
// 默认情况下，我们假设你的应用将被部署在域的根目录下,
// 例如：https://www.my-app.com/
// 默认：'/'
// 如果您的应用程序部署在子路径中，则需要在这指定子路径
// 例如：https://www.foobar.com/my-app/
// 需要将它改为'/my-app/'
const BASE_URL = process.env.NODE_ENV === "production" ? "./" : "./";
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  // Project deployment base
  // By default we assume your app will be deployed at the root of a domain,
  // e.g. https://www.my-app.com/
  // If your app is deployed at a sub-path, you will need to specify that
  // sub-path here. For example, if your app is deployed at
  // https://www.foobar.com/my-app/
  // then change this to '/my-app/'
  publicPath: BASE_URL,
  // 静态资源存放的文件夹(相对于ouputDir)
  assetsDir: "static",
  // tweak internal webpack configuration.
  // see https://github.com/vuejs/vue-cli/blob/dev/docs/webpack.md
  // 如果你不需要使用eslint，把lintOnSave设为false即可
  lintOnSave: true,
  css: {
    loaderOptions: {
      // 向 CSS 相关的 loader 传递选项
      less: { javascriptEnabled: true }
      // postcss: {
      // plugins: () => [
      //   require("@njleonzhang/postcss-px-to-rem")({
      //     unitToConvert: "px",
      //     widthOfDesignLayout: 136.6,
      //     unitPrecision: 3,
      //     selectorBlackList: [/^body$/, /^html$/],
      //     minPixelValue: 1,
      //     mediaQuery: false
      //   })
      // ]
      // }
    }
  },
  configureWebpack: config => {
    if (process.env.NODE_ENV === "production") {
      config.plugins.push(
        new TerserPlugin({
          terserOptions: {
            ecma: undefined,
            warnings: false,
            parse: {},
            compress: {
              drop_console: true,
              drop_debugger: false,
              pure_funcs: ["console.log"] // 移除console
            }
          }
        })
      );
    }
  },
  // false打包时不生成.map文件
  productionSourceMap: false,
  pluginOptions: {
    "style-resources-loader": {
      preProcessor: "less",
      patterns: [
        path.resolve(__dirname, "./src/assets/styles/iview-color.less")
      ]
    }
  },
  // 这里写调用接口的基础路径，来解决跨域，如果设置了代理，那你本地开发环境的axios的baseUrl要写为 '' ，即空字符串
  devServer: {
    proxy: {
      "/apicc": {
        // target: "http://iotdev.kalerm.com:8787",
        target: "http://127.0.0.1:8000",
        // target: 'https://iotcloud.kalerm.com',
        ws: true,
        changeOrigin: true
      }
    }
  }
};
