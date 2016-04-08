(function() {
  var Tortoise, apply, defaultDisplayError, finishLoading, fromNlogo, fromURL, globalEval, handleAjaxLoad, handleCompilation, loadData, loadError, loading, newSession, nlogoCompile, normalizedFileName, openSession, reportAjaxError, reportCompilerError, startLoading, toNetLogoMarkdown, toNetLogoWebMarkdown;

  nlogoCompile = function(commands, reporters, widgets, onFulfilled) {
    return function(model) {
      return onFulfilled((new BrowserCompiler()).fromNlogo(model, commands));
    };
  };

  loadError = function(url) {
    return "Unable to load NetLogo model from " + url + ", please ensure:\n<ul>\n  <li>That you can download the resource <a target=\"_blank\" href=\"" + url + "\">at this link</a></li>\n  <li>That the server containing the resource has\n    <a target=\"_blank\" href=\"https://en.wikipedia.org/wiki/Cross-origin_resource_sharing\">\n      Cross-Origin Resource Sharing\n    </a>\n    configured appropriately</li>\n</ul>\nIf you have followed the above steps and are still seeing this error,\nplease send an email to our <a href=\"mailto:bugs@ccl.northwestern.edu\">\"bugs\" mailing list</a>\nwith the following information:\n<ul>\n  <li>The full URL of this page (copy and paste from address bar)</li>\n  <li>Your operating system and browser version</li>\n</ul>";
  };

  toNetLogoWebMarkdown = function(md) {
    return md.replace(new RegExp('<!---*\\s*((?:[^-]|-+[^->])*)\\s*-*-->', 'g'), function(match, commentText) {
      return "[nlw-comment]: <> (" + (commentText.trim()) + ")";
    });
  };

  toNetLogoMarkdown = function(md) {
    return md.replace(new RegExp('\\[nlw-comment\\]: <> \\(([^\\)]*)\\)', 'g'), function(match, commentText) {
      return "<!-- " + commentText + " -->";
    });
  };

  apply = function(callback, generator) {
    return function(input) {
      return callback(generator(input));
    };
  };

  handleAjaxLoad = (function(_this) {
    return function(url, onSuccess, onFailure) {
      var req;
      req = new XMLHttpRequest();
      req.open('GET', url);
      req.onreadystatechange = function() {
        if (req.readyState === req.DONE) {
          if (req.status === 0 || req.status >= 400) {
            return onFailure(req);
          } else {
            return onSuccess(req.responseText);
          }
        }
      };
      return req.send("");
    };
  })(this);

  handleCompilation = function(onSuccess, onError) {
    return nlogoCompile([], [], [], (function(_this) {
      return function(res) {
        if (res.model.success) {
          return onSuccess(res);
        } else {
          return onError(res);
        }
      };
    })(this));
  };

  newSession = function(container, modelResult, readOnly, filename, onError) {
    var widgetController, widgets;
    if (readOnly == null) {
      readOnly = false;
    }
    if (filename == null) {
      filename = "export";
    }
    if (onError == null) {
      onError = void 0;
    }
    widgets = globalEval(modelResult.widgets);
    widgetController = bindWidgets(container, widgets, modelResult.code, toNetLogoWebMarkdown(modelResult.info), readOnly, filename);
    if (window.modelConfig == null) {
      window.modelConfig = {};
    }
    modelConfig.plotOps = widgetController.plotOps;
    modelConfig.mouse = widgetController.mouse;
    modelConfig.print = {
      write: widgetController.write
    };
    modelConfig.output = widgetController.output;
    modelConfig.dialog = widgetController.dialog;
    globalEval(modelResult.model.result);
    return new SessionLite(widgetController, onError);
  };

  normalizedFileName = function(path) {
    var pathComponents;
    pathComponents = path.split(/\/|\\/);
    return decodeURI(pathComponents[pathComponents.length - 1]);
  };

  loadData = function(container, pathOrURL, loader, onError) {
    return {
      container: container,
      loader: loader,
      onError: onError,
      modelPath: pathOrURL
    };
  };

  openSession = function(load) {
    return function(model) {
      var filename, session;
      filename = normalizedFileName(load.modelPath);
      session = newSession(load.container, model, false, filename, load.onError);
      load.loader.finish();
      return session;
    };
  };

  loading = function(process) {
    var loader;
    document.querySelector("#loading-overlay").style.display = "";
    loader = {
      finish: function() {
        return document.querySelector("#loading-overlay").style.display = "none";
      }
    };
    return setTimeout(process(loader), 20);
  };

  defaultDisplayError = function(container) {
    return function(errors) {
      return container.innerHTML = "<div style='padding: 5px 10px;'>" + errors + "</div>";
    };
  };

  reportCompilerError = function(load) {
    return function(res) {
      var errors;
      errors = res.model.result.map(function(err) {
        var contains, message;
        contains = function(s, x) {
          return s.indexOf(x) > -1;
        };
        message = err.message;
        if (contains(message, "Couldn't find corresponding reader") || contains(message, "Models must have 12 sections")) {
          return "" + message + " (see <a href='/info#model-format-error'>here</a> for more information)";
        } else {
          return message;
        }
      }).join('<br/>');
      load.onError(errors);
      return load.loader.finish();
    };
  };

  reportAjaxError = function(load) {
    return function(req) {
      load.onError(loadError(load.modelPath));
      return load.loader.finish();
    };
  };

  startLoading = function(process) {
    document.querySelector("#loading-overlay").style.display = "";
    if ((process != null)) {
      return setTimeout(process, 20);
    }
  };

  finishLoading = function() {
    return document.querySelector("#loading-overlay").style.display = "none";
  };

  fromNlogo = function(nlogo, container, path, callback, onError) {
    if (onError == null) {
      onError = defaultDisplayError(container);
    }
    return loading(function(loader) {
      var load;
      load = loadData(container, path, loader, onError);
      return handleCompilation(apply(callback, openSession(load)), reportCompilerError(load))(nlogo);
    });
  };

  fromURL = function(url, container, callback, onError) {
    if (onError == null) {
      onError = defaultDisplayError(container);
    }
    return loading(function(loader) {
      var load;
      load = loadData(container, url, loader, onError);
      return handleAjaxLoad(url, handleCompilation(apply(callback, openSession(load)), reportCompilerError(load)), reportAjaxError(load));
    });
  };

  Tortoise = {
    startLoading: startLoading,
    finishLoading: finishLoading,
    fromNlogo: fromNlogo,
    fromURL: fromURL,
    toNetLogoMarkdown: toNetLogoMarkdown,
    toNetLogoWebMarkdown: toNetLogoWebMarkdown
  };

  if (typeof window !== "undefined" && window !== null) {
    window.Tortoise = Tortoise;
  } else {
    exports.Tortoise = Tortoise;
  }

  globalEval = eval;

}).call(this);

//# sourceMappingURL=tortoise.js.map
