'use strict';
const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const del = require('del');
const nodemon = require('gulp-nodemon');
const browserSync =  require('browser-sync');

sass.compiler = require('node-sass');

const clean = cb => {
  /* Since del returns a promise, resolve it with additional func */
  del(['dist/**/*']).then(() => cb());
};
const util_sass = cb => {
  gulp.src('./app/sass/*.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist/css/'));
  cb();
};
const util_babel = cb => {
  gulp.src('app/script/*.babel.js')
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(gulp.dest('dist/script/'));
  cb();
};
const util_static = cb => {
  gulp.src('static/**')
    .pipe(gulp.symlink('dist/static'));
  cb();
};
const build_utils = cb => {
  return gulp.series(util_sass, util_babel, util_static);
}

/* Dev */
const watch = cb => {
  gulp.watch('app/script/*.babel.js', util_babel);
  gulp.watch('app/sass/*.sass', util_sass);
  gulp.watch('app/static/*', util_static);
  cb();
};
const task_nodemon = cb => {
  build_utils();
  let started = false;
  return nodemon({
    script: 'server.js',
    watch: ['route.js', 'server.js', 'utils.js', 'app/pug/*'],
    env: { 'NODE_ENV': 'dev' },
    ignore: ['dist/**'],
  }).on('start', () => {
    if(!started) {
      started = true;
      cb();
    }
    started = true;
  });
};
const task_browserSync = cb => {
  const prepro = gulp.parallel(task_nodemon, watch);
  const task = () => {
    browserSync.init(null, {
      proxy: 'http://localhost:9999',
      files: ['dist/script/**', 'dist/css/**', './app/pug/*'],
      browser: ['chrome'],
      port: 5000,
      reloadDelay: 1500,
    });
  };
  gulp.series(prepro, task)();
  cb();
};

exports.dev = task_browserSync;

const defaultTask = cb => {
  const series = gulp.series(clean, gulp.parallel([util_babel, util_sass, util_static]));
  series();
  cb();
};
exports.default = defaultTask;


