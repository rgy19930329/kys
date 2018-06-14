#!/usr/bin/env node

var fis = module.exports = require('fis3');
//先把rake加到插件查找中
fis.require.prefixes.unshift('rake');
fis.require.prefixes.unshift('kys');
fis.cli.name = 'kys';
fis.cli.info = require('./package.json');

//文件过滤设置
fis.set('project.ignore', ['node_modules/!**', 'output/!**', 'fis-conf.js']);
//默认设置
fis.set('statics', '../node_modules/.ky-release-webroot');
fis.set('namespace', '');
fis.set('domain', '');

fis.hook('relative');

fis.hook('cmd');

fis.match('**', {
        useMap: true,
        useHash: true,
        relative: true,
        release: false,
        preprocessor: fis.plugin('replacer', {
            ext: '.js',
            from: /(['"])common:(components|widget|static)/g,
            to: '$1as-common:$2'
        })
    })
    // 重要，去掉 seajs-config.js 无法加载
    .match('/static/(**)', {
        isMod: true,
        release: '${statics}/${namespace}/$1'
    })
    //assets处理
    .match('/(assets/**)', {    
        url: '${namespace}/$1',
        release: '${statics}/${namespace}/$1',
        isMod: true,
    })
    //views处理
    .match('/(views/**.html)', {
        url: '${namespace}/$1',
        release: '${statics}/${namespace}/$1',
        isMod: true
    })
    //widget处理
    .match('/(widget/**)', {
        url: '${namespace}/$1',
        release: '${statics}/${namespace}/$1',
        isMod: true
    })
    .match('(**).tmpl', {
        url: '${namespace}/$1',
        release: '${statics}/${namespace}/$1',
        rExt: '.js',
        isMod: true,
        parser: [fis.plugin('bdtmpl', {
            LEFT_DELIMITER: '<%',
            RIGHT_DELIMITER: '%>'
        })]
    })
    .match('/**.js', {
        isMod: true,
        optimizer: fis.plugin('uglify-js'),
        useHash: true,
        postprocessor: fis.plugin('cmdwrap')
    })
    .match('/static/lib/(**)', {
        useHash: false,
        useCompile: false,
        useParser: false,
        usePreprocessor: false,
        useStandard: false,
        usePostprocessor: false,
        isMod: false,
        parser: false
    })
    //供模板使用
    .match('/(manifest.json)', {
        useHash: false,
        release: '${statics}/${namespace}/$1'
    })
    .match('::image', {
        useMap: true
    })
    .match('/**.less', {
        parser: [fis.plugin('less-common'), fis.plugin('less')], //启用fis-parser-less插件
        rExt: '.css'
    })
    .match('/**.{css,less}', {
        optimizer: fis.plugin('clean-css'),
        //autoprefixer 前缀处理
        postprocessor: fis.plugin("autoprefixer", {
            "browsers": ['last 2 versions', '> 5%', 'ie 8'],
            "flexboxfixer": true,
            "gradientfixer": true
        })
    })
;

fis.match('::packager', {
    postpackager: fis.plugin('seajs')
});

// 注意： fis 中的 sea.js 方案，不支持部分打包。
// 所以不要去配置 packTo 了，运行时会报错的。

//本地测试环境
fis.media('debug').match('/**', {
    useHash: false,
    useSprite: false,
    optimizer: null,
    domain: '${domain}',
    deploy: fis.plugin('local-deliver', {
        to: '../'
    })
});

//dev环境 不压缩
fis.media('dev')
    .match('/**', {
        optimizer: null,
        domain: '${domain}',
        deploy: fis.plugin('local-deliver', {
            to: '../'
        })
    });

//prod环境 开启压缩
fis.media('prod')
    .match('/**', {
        domain: '${domain}',
        deploy: fis.plugin('local-deliver', {
            to: '../'
        })
    });
