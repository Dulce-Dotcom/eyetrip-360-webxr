const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  const mode = isProduction ? 'production' : 'development';
  
  return {
    mode,
    entry: './src/js/app.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].[contenthash].js',
      clean: true,
      publicPath: '/'
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[hash][ext]'
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        } : false
      }),
      new CopyWebpackPlugin({
        patterns: [
          // Only copy specific small files, not everything
          { 
            from: 'src/assets/videos/processed/**/info.json',
            to: 'assets/videos/processed/[path][name][ext]',
            noErrorOnMissing: true,
            context: 'src'
          },
          { 
            from: 'src/assets/videos/processed/**/*_preview.mp4',
            to: 'assets/videos/processed/[path][name][ext]',
            noErrorOnMissing: true,
            context: 'src'
          },
          { 
            from: 'src/assets/videos/processed/**/*_720p.mp4',
            to: 'assets/videos/processed/[path][name][ext]',
            noErrorOnMissing: true,
            context: 'src'
          },
          { 
            from: 'src/assets/videos/processed/**/*_thumb.jpg',
            to: 'assets/videos/processed/[path][name][ext]',
            noErrorOnMissing: true,
            context: 'src'
          },
          { 
            from: 'src/assets/thumbnails', 
            to: 'assets/thumbnails',
            noErrorOnMissing: true,
            globOptions: {
              ignore: ['**/.DS_Store']
            }
          },
          { 
            from: 'src/assets/icons', 
            to: 'assets/icons',
            noErrorOnMissing: true 
          },
          {
            from: 'src/css',
            to: 'css',
            noErrorOnMissing: true
          },
          { 
            from: 'src/sw.js', 
            to: 'sw.js',
            noErrorOnMissing: true 
          },
          { 
            from: 'src/manifest.json', 
            to: 'manifest.json',
            noErrorOnMissing: true 
          }
        ]
      }),
      ...(isProduction ? [
        new WorkboxPlugin.GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          exclude: [/\.mp4$/, /\.webm$/, /\.mov$/, /\.ts$/]
        })
      ] : [])
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction
            }
          }
        }),
        new CssMinimizerPlugin()
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          },
          three: {
            test: /[\\/]node_modules[\\/]three/,
            name: 'three',
            priority: 20
          }
        }
      }
    },
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
          publicPath: '/',
          watch: true
        },
        {
          directory: path.join(__dirname, 'src'),
          publicPath: '/',
          watch: {
            ignored: /node_modules|\.mp4$|\.mov$|\.webm$/,
            usePolling: false,
            interval: 1000
          },
          serveIndex: true
        }
      ],
      compress: true,
      port: 8080,
      hot: true,
      server: 'https',
      host: '0.0.0.0',
      headers: {
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
        'Cache-Control': 'no-cache'
      },
      setupMiddlewares: (middlewares, devServer) => {
        // Add custom middleware to set correct MIME types for videos
        devServer.app.use((req, res, next) => {
          if (req.url.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
          } else if (req.url.endsWith('.webm')) {
            res.setHeader('Content-Type', 'video/webm');
          } else if (req.url.endsWith('.ogg') || req.url.endsWith('.ogv')) {
            res.setHeader('Content-Type', 'video/ogg');
          }
          next();
        });
        return middlewares;
      },
      client: {
        logging: 'info',
        overlay: {
          errors: true,
          warnings: false
        },
        progress: true
      },
      allowedHosts: 'all',
      historyApiFallback: true,
      open: false
    },
    performance: {
      hints: false,
      maxAssetSize: 50000000, // 50MB
      maxEntrypointSize: 50000000 // 50MB
    },
    stats: {
      assets: true,
      modules: false,
      errors: true,
      warnings: true,
      colors: true
    },
    watchOptions: {
      ignored: ['**/node_modules', '**/videos/**/*.mp4', '**/videos/**/*.ts', '**/.git'],
      aggregateTimeout: 300,
      poll: false
    },
    ignoreWarnings: [
      {
        message: /File size.*is greater than/
      },
      {
        message: /asset size limit/
      }
    ],
    resolve: {
      extensions: ['.js', '.json', '.css'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  };
};