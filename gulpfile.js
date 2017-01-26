var gulp = require('gulp');
var ts = require('gulp-typescript');
var createTemplateCache = require('gulp-angular-templatecache');
var concat = require('gulp-concat');
var less = require('gulp-less');
var streamqueue = require('streamqueue');

gulp.task('default', ['build']);

gulp.task('watch', function() {
  return gulp.watch('src/**', ['build'])
});

gulp.task('build', ['compile', 'less']);

gulp.task('compile', function () {
  streamqueue({ objectMode: true }, compile(), templateCache())
    .pipe(concat('tileview.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('less', function() {
  return gulp.src('src/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('dist'));
});

function compile() {
  return gulp.src('src/**/*.ts')
    .pipe(ts({
      //noImplicitAny: true
    }));
}

function templateCache() {
  return gulp.src('src/**/*.tpl.html')
    .pipe(createTemplateCache({
      module: 'td.tileview'
    }));
}
