let path = require('path');
let gulp = require('gulp'),
    cleanCss = require('gulp-clean-css'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpClean = require('gulp-clean'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    inject = require('gulp-inject'),
    license = require('gulp-header-license'),
    browserSync = require('browser-sync').create(),
    injectString = require('gulp-inject-string'),
    rename = require('gulp-rename'),
    reload = browserSync.reload,
    cached = require('gulp-cached'),
    sequence = require('gulp-sequence'),
    fs = require('fs');
let { i18n, style, getThirdparty } = require('./gulp/tasks');
let config = require('./gulp/config.json');
let argv = require('./gulp/resolve_argv.js');

/*
clean
1st:i18n style3rd js3rd
2nd:style js assets
3rd:inject
*/

gulp.task('clean', function () {
    return gulp.src('./dist', {
        read: false
    })
        .pipe(gulpClean({ force: true }));
});

gulp.task('style3rd', function () {
    return gulp.src(getThirdparty('style'))
        .pipe(style())
        .pipe(cleanCss())
        .pipe(gulp.dest('./dist/css/'))
        .pipe(reload({
            stream: true
        }));
    //no sms needed for 3rdparty plugins.
});

gulp.task('style', function () {
    return gulp.src([
        './src/less/**/*.less',
        './src/css/**/*.css',
    ])
        .pipe(cached('style'))
        .pipe(sourcemaps.init())
        .pipe(style())
        .pipe(cleanCss())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/css/'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('assets:img', function () {
    return gulp.src('./src/images/**/*')
        .pipe(gulp.dest('./dist/images/'));
});
gulp.task('assets:fa', function () {
    return gulp.src('./node_modules/font-awesome/fonts/*')
        .pipe(gulp.dest('./dist/fonts/'));
});
gulp.task('assets:fonts', function () {
    return gulp.src('./src/fonts/**/*')
        .pipe(gulp.dest('./dist/fonts/'));
});
gulp.task('assets', sequence(['assets:img', 'assets:fa', 'assets:fonts']));

gulp.task('i18n', function () {
    return gulp.src('./src/i18n/*.txt')
        .pipe(i18n())
        .pipe(gulp.dest('./dist/js/'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('js3rd', function () {
    return gulp.src(getThirdparty('js'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./dist/js/'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('js', function () {
    return gulp.src('./src/js/**/*.js')
        .pipe(cached('js'))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(license(fs.readFileSync('misc/license-head.txt','utf-8')))
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/js/'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('directcopy', function () {
    return gulp.src('./src/directcopy/**/*')
    .pipe(gulp.dest('./dist/'));
})

gulp.task('inject', function () {
    let presetOpts = Object.assign({
        isRelease: !!argv.release,
        apiRoot: argv['api-root'] || '/api/v0',
        misc: JSON.parse(argv['preset-misc'] || '{}')
    }, config);
    return gulp.src('./src/index.html')
        .pipe(
            inject(
                gulp.src(['./dist/js/**/*.js',
                    './dist/css/**/*.css'], { read: false }),
                {
                    ignorePath: '/dist',
                    removeTags: true
                }
            )
        )
        .pipe(
            injectString.replace(
                '<!-- intron:1 -->', 
                `<script>window.diaryPresetOpts = ${JSON.stringify(presetOpts)};</script>`
            )
        )
        .pipe(gulp.dest('./dist/'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('sync', function () {
    return gulp.src(config.sync)
    .pipe(gulp.dest('./src/directcopy'));
});

//This should work and looks pretty good:
gulp.task('default', sequence(
    ['i18n', 'style3rd', 'js3rd'],
    ['style', 'js', 'assets'],
    'directcopy',
    'inject'
));

gulp.task('serve', ['default'], function () {
    browserSync.init({
        server: './dist'
    });

    gulp.watch('./src/js/**/*.js', ['js']);
    gulp.watch('./src/images/**/*', ['assets']);
    gulp.watch('./src/fonts/**/*', ['assets']);
    gulp.watch('./src/css/**/*', ['style']);
    gulp.watch('./src/less/**/*', ['style']);
    gulp.watch('./src/*.html', ['inject']);
});
