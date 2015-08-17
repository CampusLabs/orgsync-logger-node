var _ = require('underscore');
var chalk = require('chalk');
var fs = require('fs');
var os = require('os');
var path = require('path');

var DEFAULT_CONFIG = {
  colors: true,
  metrics: true,
  name: os.hostname()
};

var config = DEFAULT_CONFIG;
var maxIndex = Infinity;
var sync = false;

var LEVELS = ['error', 'info', 'debug'];

var COLORS = {
  error: 'red',
  debug: 'yellow'
};

var CB = function (er) { if (er) throw er; };

var write = function (type, str) {
  str += '\n';
  if (!config.dir) return process.stdout.write(str);
  var target = path.resolve(config.dir, type + '.log');
  if (sync) return fs.appendFileSync(target, str);
  fs.appendFile(target, str, CB);
};

var log = function (level, index, msg) {
  if (index > maxIndex) return;
  var iso = (new Date()).toISOString();
  var name = ' [' + config.name + '] ';
  msg = iso + name + chalk.bold(level.toUpperCase()) + ' ' + msg;
  var color = COLORS[level];
  write(level, color ? chalk[color](msg) : msg);
};

_.each(LEVELS, function (level, index) {
  exports[level] = _.partial(log, level, index);
});

var metric = function (type, name, metric) {
  if (!config.metrics) return;
  write('metrics', JSON.stringify({
    '@timestamp': (new Date()).toISOString(),
    app_name: config.name,
    tags: [type],
    service: name,
    metric: metric
  }));
};

exports.mark = _.partial(metric, 'mark', _, 1);

exports.gauge = _.partial(metric, 'gauge');

exports.duration = _.partial(metric, 'time');

exports.time = function (cb) {
  var start = Date.now();
  cb(function (name) { metric('time', name, Date.now() - start); });
};

exports.sync = function () { sync = true; };

exports.async = function () { sync = false; };

exports.config = function (_config) {
  config = _.extend({}, DEFAULT_CONFIG, _config);
  chalk.enabled = !config.dir && config.colors;
  maxIndex = _.indexOf(LEVELS, config.level);
  if (maxIndex === -1) maxIndex = Infinity;
};

exports.config(config);