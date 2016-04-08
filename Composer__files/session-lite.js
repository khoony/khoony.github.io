(function() {
  var DEFAULT_REDRAW_DELAY, DEFAULT_UPDATE_DELAY, FAST_UPDATE_EXP, MAX_REDRAW_DELAY, MAX_UPDATE_DELAY, MAX_UPDATE_TIME, REDRAW_EXP, SLOW_UPDATE_EXP, globalEval, now, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DEFAULT_UPDATE_DELAY = 1000 / 60;

  MAX_UPDATE_DELAY = 1000;

  FAST_UPDATE_EXP = 0.5;

  SLOW_UPDATE_EXP = 4;

  MAX_UPDATE_TIME = 100;

  DEFAULT_REDRAW_DELAY = 1000 / 30;

  MAX_REDRAW_DELAY = 1000;

  REDRAW_EXP = 2;

  window.SessionLite = (function() {
    function SessionLite(widgetController, displayError) {
      this.widgetController = widgetController;
      this.displayError = displayError;
      this.promptFilename = __bind(this.promptFilename, this);
      this.eventLoop = __bind(this.eventLoop, this);
      this._eventLoopTimeout = -1;
      this._lastRedraw = 0;
      this._lastUpdate = 0;
      this.widgetController.ractive.on('*.recompile', (function(_this) {
        return function(event) {
          return _this.recompile();
        };
      })(this));
      this.widgetController.ractive.on('exportnlogo', (function(_this) {
        return function(event) {
          return _this.exportnlogo(event);
        };
      })(this));
      this.widgetController.ractive.on('exportHtml', (function(_this) {
        return function(event) {
          return _this.exportHtml(event);
        };
      })(this));
      this.widgetController.ractive.on('console.run', (function(_this) {
        return function(code) {
          return _this.run(code);
        };
      })(this));
      this.drawEveryFrame = false;
    }

    SessionLite.prototype.modelTitle = function() {
      return this.widgetController.ractive.get('modelTitle');
    };

    SessionLite.prototype.startLoop = function() {
      if (procedures.startup != null) {
        procedures.startup();
      }
      this.widgetController.redraw();
      this.widgetController.updateWidgets();
      return requestAnimationFrame(this.eventLoop);
    };

    SessionLite.prototype.updateDelay = function() {
      var speed, speedFactor;
      speed = this.widgetController.speed();
      if (speed > 0) {
        speedFactor = Math.pow(Math.abs(speed), FAST_UPDATE_EXP);
        return DEFAULT_UPDATE_DELAY * (1 - speedFactor);
      } else {
        speedFactor = Math.pow(Math.abs(speed), SLOW_UPDATE_EXP);
        return MAX_UPDATE_DELAY * speedFactor + DEFAULT_UPDATE_DELAY * (1 - speedFactor);
      }
    };

    SessionLite.prototype.redrawDelay = function() {
      var speed, speedFactor;
      speed = this.widgetController.speed();
      if (speed > 0) {
        speedFactor = Math.pow(Math.abs(this.widgetController.speed()), REDRAW_EXP);
        return MAX_REDRAW_DELAY * speedFactor + DEFAULT_REDRAW_DELAY * (1 - speedFactor);
      } else {
        return DEFAULT_REDRAW_DELAY;
      }
    };

    SessionLite.prototype.eventLoop = function(timestamp) {
      var i, maxNumUpdates, updatesDeadline, _i;
      this._eventLoopTimeout = requestAnimationFrame(this.eventLoop);
      updatesDeadline = Math.min(this._lastRedraw + this.redrawDelay(), now() + MAX_UPDATE_TIME);
      maxNumUpdates = this.drawEveryFrame ? 1 : (now() - this._lastUpdate) / this.updateDelay();
      for (i = _i = 1; _i <= maxNumUpdates; i = _i += 1) {
        this._lastUpdate = now();
        this.widgetController.runForevers();
        if (now() >= updatesDeadline) {
          break;
        }
      }
      if (Updater.hasUpdates()) {
        if (i > maxNumUpdates || now() - this._lastRedraw > this.redrawDelay() || this.drawEveryFrame) {
          this._lastRedraw = now();
          this.widgetController.redraw();
        }
      }
      return this.widgetController.updateWidgets();
    };

    SessionLite.prototype.teardown = function() {
      this.widgetController.teardown();
      return cancelAnimationFrame(this._eventLoopTimeout);
    };

    SessionLite.prototype.recompile = function() {
      return Tortoise.startLoading((function(_this) {
        return function() {
          var code;
          world.clearAll();
          _this.widgetController.redraw();
          code = _this.widgetController.code();
          return codeCompile(code, [], [], _this.widgetController.widgets(), function(res) {
            if (res.model.success) {
              globalEval(res.model.result);
              _this.widgetController.ractive.set('isStale', false);
              return _this.widgetController.ractive.set('lastCompiledCode', code);
            } else {
              return _this.alertCompileError(res.model.result);
            }
          }, _this.alertCompileError);
        };
      })(this));
    };

    SessionLite.prototype.getNlogo = function() {
      return (new BrowserCompiler()).exportNlogo({
        info: Tortoise.toNetLogoMarkdown(this.widgetController.ractive.get('info')),
        code: this.widgetController.ractive.get('code'),
        widgets: this.widgetController.widgets(),
        turtleShapes: turtleShapes,
        linkShapes: linkShapes
      });
    };

    SessionLite.prototype.exportnlogo = function() {
      var exportBlob, exportName, exportedNLogo;
      exportName = this.promptFilename(".nlogo");
      if (exportName != null) {
        exportedNLogo = this.getNlogo();
        if (exportedNLogo.success) {
          exportBlob = new Blob([exportedNLogo.result], {
            type: "text/plain:charset=utf-8"
          });
          return saveAs(exportBlob, exportName);
        } else {
          return this.alertCompileError(exportedNLogo.result);
        }
      }
    };

    SessionLite.prototype.promptFilename = function(extension) {
      var suggestion;
      suggestion = this.modelTitle() + extension;
      return window.prompt('Filename:', suggestion);
    };

    SessionLite.prototype.exportHtml = function() {
      var exportName;
      exportName = this.promptFilename(".html");
      if (exportName != null) {
        window.req = new XMLHttpRequest();
        req.open('GET', standaloneURL);
        req.onreadystatechange = (function(_this) {
          return function() {
            var dom, exportBlob, nlogo, nlogoScript, parser, wrapper;
            if (req.readyState === req.DONE) {
              if (req.status === 200) {
                nlogo = _this.getNlogo();
                if (nlogo.success) {
                  parser = new DOMParser();
                  dom = parser.parseFromString(req.responseText, "text/html");
                  nlogoScript = dom.querySelector("#nlogo-code");
                  nlogoScript.textContent = nlogo.result;
                  nlogoScript.dataset.filename = exportName.replace(/\.html$/, ".nlogo");
                  wrapper = document.createElement("div");
                  wrapper.appendChild(dom.documentElement);
                  exportBlob = new Blob([wrapper.innerHTML], {
                    type: "text/html:charset=utf-8"
                  });
                  return saveAs(exportBlob, exportName);
                } else {
                  return _this.alertCompileError(nlogo.result);
                }
              } else {
                return alert("Couldn't get standalone page");
              }
            }
          };
        })(this);
        return req.send("");
      }
    };

    SessionLite.prototype.makeForm = function(method, path, data) {
      var field, form, name, value;
      form = document.createElement('form');
      form.setAttribute('method', method);
      form.setAttribute('action', path);
      for (name in data) {
        value = data[name];
        field = document.createElement('input');
        field.setAttribute('type', 'hidden');
        field.setAttribute('name', name);
        field.setAttribute('value', value);
        form.appendChild(field);
      }
      return form;
    };

    SessionLite.prototype.run = function(code) {
      Tortoise.startLoading();
      return codeCompile(this.widgetController.code(), [code], [], this.widgetController.widgets(), (function(_this) {
        return function(_arg) {
          var commands, ex, modelResult, modelSuccess, result, success, _ref, _ref1;
          commands = _arg.commands, (_ref = _arg.model, modelResult = _ref.result, modelSuccess = _ref.success);
          if (modelSuccess) {
            _ref1 = commands[0], result = _ref1.result, success = _ref1.success;
            if (success) {
              try {
                return window.handlingErrors(new Function(result))();
              } catch (_error) {
                ex = _error;
                if (!(ex instanceof Exception.HaltInterrupt)) {
                  throw ex;
                }
              }
            } else {
              return _this.alertCompileError(result);
            }
          } else {
            return _this.alertCompileError(modelResult);
          }
        };
      })(this), this.alertCompileError);
    };

    SessionLite.prototype.alertCompileError = function(result) {
      var alertText;
      alertText = result.map(function(err) {
        return err.message;
      }).join('\n');
      return this.displayError(alertText);
    };

    return SessionLite;

  })();

  globalEval = eval;

  window.AgentModel = tortoise_require('agentmodel');

  window.codeCompile = function(code, commands, reporters, widgets, onFulfilled, onErrors) {
    var compileParams, ex;
    compileParams = {
      code: code,
      widgets: widgets,
      commands: commands,
      reporters: reporters,
      turtleShapes: typeof turtleShapes !== "undefined" && turtleShapes !== null ? turtleShapes : [],
      linkShapes: typeof linkShapes !== "undefined" && linkShapes !== null ? linkShapes : []
    };
    try {
      return onFulfilled((new BrowserCompiler()).fromModel(compileParams));
    } catch (_error) {
      ex = _error;
      return onErrors([ex]);
    } finally {
      Tortoise.finishLoading();
    }
  };

  window.serverNlogoCompile = function(model, commands, reporters, widgets, onFulfilled) {
    var compileCallback, compileParams;
    compileParams = {
      model: model,
      commands: JSON.stringify(commands),
      reporters: JSON.stringify(reporters)
    };
    compileCallback = function(res) {
      return onFulfilled(JSON.parse(res));
    };
    return ajax('/compile-nlogo', compileParams, compileCallback);
  };

  window.serverCodeCompile = function(code, commands, reporters, widgets, onFulfilled) {
    var compileCallback, compileParams;
    compileParams = {
      code: code,
      widgets: JSON.stringify(widgets),
      commands: JSON.stringify(commands),
      reporters: JSON.stringify(reporters),
      turtleShapes: JSON.stringify(typeof turtleShapes !== "undefined" && turtleShapes !== null ? turtleShapes : []),
      linkShapes: JSON.stringify(typeof linkShapes !== "undefined" && linkShapes !== null ? linkShapes : [])
    };
    compileCallback = function(res) {
      return onFulfilled(JSON.parse(res));
    };
    return ajax('/compile-code', compileParams, compileCallback);
  };

  window.ajax = function(url, params, callback) {
    var key, paramPairs, req, value;
    paramPairs = (function() {
      var _results;
      _results = [];
      for (key in params) {
        value = params[key];
        _results.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      }
      return _results;
    })();
    req = new XMLHttpRequest();
    req.open('POST', url);
    req.onreadystatechange = function() {
      if (req.readyState === req.DONE) {
        return callback(req.responseText);
      }
    };
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    return req.send(paramPairs.join('&'));
  };

  now = (_ref = typeof performance !== "undefined" && performance !== null ? performance.now.bind(performance) : void 0) != null ? _ref : Date.now.bind(Date);

}).call(this);

//# sourceMappingURL=session-lite.js.map
