var EventEmitter2, async, message, server, transport;

EventEmitter2 = require('eventemitter2').EventEmitter2;

transport = require('socketstream-transport');

server = exports.server = new EventEmitter2;

message = exports.message = new EventEmitter2;

exports.tmpl = {};

exports.registerApi = function(name, fn) {
  var api;
  api = exports[name];
  if (api) {
    return console.error("SocketStream Error: Unable to register the 'ss." + name + "' responder as this name has already been taken");
  } else {
    return exports[name] = fn;
  }
};

exports.connect = function(fn) {
  return exports.send = transport(server, message).connect();
};

/* ON DEMAND LOADING
*/

async = {
  loaded: {},
  loading: new EventEmitter2
};

exports.load = {
  code: function(nameOrDir, cb) {
    var errorPrefix, onError, onSuccess;
    if (nameOrDir && nameOrDir.substr(0, 1) === '/') {
      nameOrDir = nameOrDir.substr(1);
    }
    errorPrefix = 'SocketStream Error: The ss.load.code() command ';
    if (!jQuery) {
      return console.error(errorPrefix + 'requires jQuery to be present');
    }
    if (!nameOrDir) {
      return console.error(errorPrefix + 'requires a directory to load. Specify it as the first argument. E.g. The ss.load.code(\'/mail\',cb) will load code in /client/code/mail');
    }
    if (!cb) {
      return console.error(errorPrefix + 'requires a callback. Specify it as the last argument');
    }
    if (async.loaded[nameOrDir]) return cb();
    async.loading.once(nameOrDir, cb);
    if (async.loading.listeners(nameOrDir).length === 1) {
      onError = function() {
        console.error('SocketStream Error: Could not asynchronously load ' + nameOrDir);
        return console.log(arguments);
      };
      onSuccess = function() {
        async.loaded[nameOrDir] = true;
        return async.loading.emit(nameOrDir);
      };
      return $.ajax({
        url: "/_serve/code?" + nameOrDir,
        type: 'GET',
        cache: false,
        dataType: 'script',
        success: onSuccess,
        error: onError
      });
    }
  },
  worker: function(name) {
    return new Worker("/_serve/worker?" + name);
  }
};

/* LIVE RELOAD
*/

server.on('__ss:reload', function() {
  return window.location.reload();
});

server.on('__ss:updateCSS', function() {
  var h, tag, _i, _len, _ref;
  _ref = document.getElementsByTagName("link");
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    tag = _ref[_i];
    if (tag.rel.toLowerCase().indexOf("stylesheet") >= 0 && tag.href) {
      h = tag.href.replace(/(&|%5C?)\d+/, "");
      tag.href = h + (h.indexOf("?") >= 0 ? "&" : "?") + (new Date().valueOf());
    }
  }
  return console.log('CSS updated');
});
