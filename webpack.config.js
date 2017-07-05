var webpack = require("webpack");
var path = require("path");
var glob = require('glob');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
//var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

var srcDir = path.resolve(process.cwd(), 'src');
var distDir = path.join(__dirname, "dist");

//FIXME 直接给出比较结果？实时检测
var isProduction = function () {
    return process.env.NODE_ENV === 'production';
};

var entries = function () {
    var jsDir = path.resolve(srcDir, 'js');
    var entryFiles = glob.sync(jsDir + '/*.js');
    var map = {};

    for (var i = 0; i < entryFiles.length; i++) {
        var filePath = entryFiles[i];
        var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
        map[filename] = filePath;
    }

    //common js
    map['common'] = [ jsDir + '/common/page1',jsDir + '/common/page2'];

    return map;
};

var html_plugins = function () {
    var entryHtml = glob.sync(srcDir + '/*.html');
    var r = [];
    var entriesFiles = entries();
    for (var i = 0; i < entryHtml.length; i++) {
        var filePath = entryHtml[i];
        var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
        var conf = {
            template: filePath,
            filename: filename + '.html'
            /*minify: {
                "removeAttributeQuotes": true,
                "removeComments": true,
                "removeEmptyAttributes": true
            },
            hash: true*/
        };
        //如果和入口js文件同名
        if (filename in entriesFiles) {
            conf.inject = 'body';
            conf.chunks = ['common', filename];
        }
        //跨页面引用，如pageA,pageB 共同引用了common-a-b.js，那么可以在这单独处理
        //if(pageA|pageB.test(filename)) conf.chunks.splice(1,0,'common-a-b')
        r.push(new HtmlWebpackPlugin(conf));
    }
    return r;
};

var extractCSS = new ExtractTextPlugin(isProduction() ?  'css/[name]-[hash:12].css' : 'css/[name].css');//?[contenthash]

var plugins = [extractCSS];

/*plugins.push(new CommonsChunkPlugin({
    name: 'vendor',
    chunks: ['common']
}));*/

plugins.push(new CleanWebpackPlugin(
    [distDir,'build'],
    {
        root: __dirname,
        verbose: true,
        dry: false
    })
);

module.exports = {

    devtool: isProduction() ? false : 'eval-source-map',

    entry: entries(),

    output: {
        path: distDir,
        filename: isProduction() ? "js/[name]-[hash:12].js" : "js/[name].js",
        publicPath: isProduction() ? 'http://localhost:63342/my-webpack/dist/' : '/'  //FIXME 全部用绝对路径？相对路径
    },

    resolve: {
        extensions: ['.js', '.css','.scss']
    },

    module: {
        loaders: [
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract({
                    fallbackLoader: 'style-loader',
                    loader: ['css-loader', 'sass-loader']
                })
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/,
                loader: 'url-loader?limit=1024&name=img/[name].[hash:8].[ext]'
            },
            {
                test: /\.((ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9]))|(ttf|eot)$/,
                loader: 'url-loader?limit=10000&name=fonts/[hash:8].[name].[ext]'
            }
        ]
    },

    plugins: plugins.concat(html_plugins()),

    devServer: {
        contentBase: distDir, //本地服务器所加载的页面所在的目录
        historyApiFallback: false, //跳转
        inline: true, //实时刷新
        port: "8888"
    }
};
