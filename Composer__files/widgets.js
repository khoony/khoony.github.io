(function() {
  var createPlotOps, fillOutWidgets, isValidValue, partials, reporterOf, showErrors, template,
    __hasProp = {}.hasOwnProperty;

  window.bindWidgets = function(container, widgets, code, info, readOnly, filename) {
    var animateWithClass, clearMouse, controller, dialog, dropNLogoExtension, existsInObj, model, mouse, mousetrap, output, outputWidget, plotOps, ractive, sanitizedMarkdown, updateUICallback, viewController, viewModel, widgetObj, write;
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    controller = null;
    updateUICallback = function() {
      controller.redraw();
      return controller.updateWidgets();
    };
    fillOutWidgets(widgets, updateUICallback);
    sanitizedMarkdown = function(md) {
      return html_sanitize(markdown.toHTML(md), function(url) {
        if (/^https?:\/\//.test(url)) {
          return url;
        } else {
          return void 0;
        }
      }, function(id) {
        return id;
      });
    };
    dropNLogoExtension = function(s) {
      return s.slice(0, -6);
    };
    existsInObj = function(f) {
      return function(obj) {
        var v, _;
        for (_ in obj) {
          v = obj[_];
          if (f(v)) {
            return true;
          }
        }
        return false;
      };
    };
    widgetObj = widgets.reduce((function(acc, widget, index) {
      acc[index] = widget;
      return acc;
    }), {});
    model = {
      widgetObj: widgetObj,
      speed: 0.0,
      ticks: "",
      ticksStarted: false,
      width: 0,
      height: 0,
      code: code,
      info: info,
      readOnly: readOnly,
      lastCompiledCode: code,
      isStale: false,
      exportForm: false,
      modelTitle: dropNLogoExtension(filename),
      consoleOutput: '',
      outputWidgetOutput: '',
      markdown: sanitizedMarkdown,
      hasFocus: false,
      isEditing: false
    };
    animateWithClass = function(klass) {
      return function(t, params) {
        var event, eventNames, listener, _i, _len;
        params = t.processParams(params);
        eventNames = ['animationend', 'webkitAnimationEnd', 'oAnimationEnd', 'msAnimationEnd'];
        listener = function(l) {
          return function(e) {
            var event, _i, _len;
            e.target.classList.remove(klass);
            for (_i = 0, _len = eventNames.length; _i < _len; _i++) {
              event = eventNames[_i];
              e.target.removeEventListener(event, l);
            }
            return t.complete();
          };
        };
        for (_i = 0, _len = eventNames.length; _i < _len; _i++) {
          event = eventNames[_i];
          t.node.addEventListener(event, listener(listener));
        }
        return t.node.classList.add(klass);
      };
    };
    Ractive.transitions.grow = animateWithClass('growing');
    Ractive.transitions.shrink = animateWithClass('shrinking');
    ractive = new Ractive({
      el: container,
      template: template,
      partials: partials,
      components: {
        console: RactiveConsoleWidget,
        editableTitle: RactiveModelTitle,
        editor: RactiveEditorWidget,
        infotab: RactiveInfoTabWidget,
        labelWidget: RactiveLabel,
        switchWidget: RactiveSwitch,
        buttonWidget: RactiveButton,
        sliderWidget: RactiveSlider,
        chooserWidget: RactiveChooser,
        monitorWidget: RactiveMonitor,
        inputWidget: RactiveInput,
        outputWidget: RactiveOutputArea,
        plotWidget: RactivePlot,
        viewWidget: RactiveView
      },
      magic: true,
      data: function() {
        return model;
      },
      oncomplete: attachWidgetMenus
    });
    mousetrap = Mousetrap(container.querySelector('.netlogo-model'));
    mousetrap.bind(['ctrl+shift+alt+i', 'command+shift+alt+i'], (function(_this) {
      return function() {
        return ractive.fire('toggleInterfaceLock');
      };
    })(this));
    viewModel = widgets.filter(function(w) {
      return w.type === 'view';
    })[0];
    viewController = new AgentStreamController(container.querySelector('.netlogo-view-container'), viewModel.fontSize);
    outputWidget = widgets.filter(function(w) {
      return w.type === 'output';
    })[0];
    plotOps = createPlotOps(container, widgets);
    clearMouse = function() {
      viewController.mouseDown = false;
    };
    mouse = {
      peekIsDown: function() {
        return viewController.mouseDown;
      },
      peekIsInside: function() {
        return viewController.mouseInside;
      },
      peekX: viewController.mouseXcor,
      peekY: viewController.mouseYcor
    };
    write = function(str) {
      return model.consoleOutput += str;
    };
    output = {
      write: function(str) {
        return model.outputWidgetOutput += str;
      },
      clear: function() {
        return model.outputWidgetOutput = "";
      }
    };
    dialog = {
      confirm: function(str) {
        clearMouse();
        return window.confirm(str);
      },
      notify: function(str) {
        clearMouse();
        return window.nlwAlerter.display("NetLogo Notification", true, str);
      }
    };
    ractive.observe('widgetObj.*.currentValue', function(newVal, oldVal, keyPath, widgetNum) {
      var widget;
      widget = widgetObj[widgetNum];
      if ((widget.varName != null) && (typeof world !== "undefined" && world !== null) && newVal !== oldVal && isValidValue(widget, newVal)) {
        return world.observer.setGlobal(widget.varName, newVal);
      }
    });
    ractive.observe('widgetObj.*.right', function() {
      var i, w;
      return this.set('width', Math.max.apply(Math, (function() {
        var _ref, _results;
        _ref = this.get('widgetObj');
        _results = [];
        for (i in _ref) {
          if (!__hasProp.call(_ref, i)) continue;
          w = _ref[i];
          if (w.right != null) {
            _results.push(w.right);
          }
        }
        return _results;
      }).call(this)));
    });
    ractive.observe('widgetObj.*.bottom', function() {
      var i, w;
      return this.set('height', Math.max.apply(Math, (function() {
        var _ref, _results;
        _ref = this.get('widgetObj');
        _results = [];
        for (i in _ref) {
          if (!__hasProp.call(_ref, i)) continue;
          w = _ref[i];
          if (w.bottom != null) {
            _results.push(w.bottom);
          }
        }
        return _results;
      }).call(this)));
    });
    ractive.on('checkFocus', function(event) {
      return this.set('hasFocus', document.activeElement === event.node);
    });
    ractive.on('checkActionKeys', function(event) {
      var char, e, w, _, _ref, _results;
      if (this.get('hasFocus')) {
        e = event.original;
        char = String.fromCharCode(e.which != null ? e.which : e.keyCode);
        _ref = this.get('widgetObj');
        _results = [];
        for (_ in _ref) {
          w = _ref[_];
          if (w.type === 'button' && w.actionKey === char) {
            _results.push(w.run());
          }
        }
        return _results;
      }
    });
    ractive.on('*.renameInterfaceGlobal', function(oldName, newName, value) {
      if (!existsInObj(function(_arg) {
        var varName;
        varName = _arg.varName;
        return varName === oldName;
      })(this.get('widgetObj'))) {
        world.observer.setGlobal(oldName, void 0);
      }
      world.observer.setGlobal(newName, value);
      return false;
    });
    controller = new WidgetController(ractive, model, widgetObj, viewController, plotOps, mouse, write, output, dialog);
    setupInterfaceEditor(ractive, controller.removeWidgetById.bind(controller));
    return controller;
  };

  showErrors = function(errors) {
    if (errors.length > 0) {
      if (window.nlwAlerter != null) {
        return window.nlwAlerter.displayError(errors.join('<br/>'));
      } else {
        return alert(errors.join('\n'));
      }
    }
  };

  window.handlingErrors = function(f) {
    return function() {
      var ex, message;
      try {
        return f();
      } catch (_error) {
        ex = _error;
        if (!(ex instanceof Exception.HaltInterrupt)) {
          message = !(ex instanceof TypeError) ? ex.message : "A type error has occurred in the simulation engine.\nMore information about these sorts of errors can be found <a href=\"/info#type-errors\">here</a>.<br><br>\nAdvanced users might find the generated error helpful, which is as follows:<br><br>\n<b>" + ex.message + "</b><br><br>";
          showErrors([message]);
          throw new Exception.HaltInterrupt;
        } else {
          throw ex;
        }
      }
    };
  };

  window.WidgetController = (function() {
    function WidgetController(ractive, model, widgetObj, viewController, plotOps, mouse, write, output, dialog) {
      this.ractive = ractive;
      this.model = model;
      this.widgetObj = widgetObj;
      this.viewController = viewController;
      this.plotOps = plotOps;
      this.mouse = mouse;
      this.write = write;
      this.output = output;
      this.dialog = dialog;
    }

    WidgetController.prototype.runForevers = function() {
      var widget, _i, _len, _ref, _results;
      _ref = this.widgets();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        widget = _ref[_i];
        if (widget.type === 'button' && widget.forever && widget.running) {
          _results.push(widget.run());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    WidgetController.prototype.updateWidgets = function() {
      var chartOps, err, isValidValue, maxValue, minValue, stepValue, value, widget, _, _i, _len, _ref, _ref1;
      _ref = this.plotOps;
      for (_ in _ref) {
        chartOps = _ref[_];
        chartOps.redraw();
      }
      _ref1 = this.widgets();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        widget = _ref1[_i];
        if (widget.currentValue != null) {
          if (widget.varName != null) {
            widget.currentValue = world.observer.getGlobal(widget.varName);
          } else if (widget.reporter != null) {
            try {
              widget.currentValue = widget.reporter();
              value = widget.currentValue;
              isValidValue = (value != null) && ((typeof value !== "number") || isFinite(value));
              if (!isValidValue) {
                widget.currentValue = 'N/A';
              }
            } catch (_error) {
              err = _error;
              widget.currentValue = 'N/A';
            }
          }
          if ((widget.precision != null) && typeof widget.currentValue === 'number' && isFinite(widget.currentValue)) {
            widget.currentValue = NLMath.precision(widget.currentValue, widget.precision);
          }
        }
        if (widget['type'] === 'slider') {
          maxValue = widget.getMax();
          stepValue = widget.getStep();
          minValue = widget.getMin();
          if (widget.maxValue !== maxValue || widget.stepValue !== stepValue || widget.minValue !== minValue) {
            widget.maxValue = maxValue;
            widget.stepValue = stepValue;
            widget.minValue = minValue - 0.000001;
            widget.minValue = minValue;
          }
        }
        if (widget['type'] === 'view') {
          widget.right = widget.left + this.viewController.container.scrollWidth;
          widget.bottom = widget.top + this.viewController.container.scrollHeight;
        }
      }
      if (world.ticker.ticksAreStarted()) {
        this.model.ticks = Math.floor(world.ticker.tickCount());
        return this.model.ticksStarted = true;
      } else {
        this.model.ticks = '';
        return this.model.ticksStarted = false;
      }
    };

    WidgetController.prototype.removeWidgetById = function(id) {
      delete this.widgetObj[id];
    };

    WidgetController.prototype.widgets = function() {
      var v, _, _ref, _results;
      _ref = this.widgetObj;
      _results = [];
      for (_ in _ref) {
        v = _ref[_];
        _results.push(v);
      }
      return _results;
    };

    WidgetController.prototype.speed = function() {
      return this.model.speed;
    };

    WidgetController.prototype.redraw = function() {
      if (Updater.hasUpdates()) {
        return this.viewController.update(Updater.collectUpdates());
      }
    };

    WidgetController.prototype.teardown = function() {
      return this.ractive.teardown();
    };

    WidgetController.prototype.code = function() {
      return this.ractive.get('code');
    };

    return WidgetController;

  })();

  reporterOf = function(str) {
    return new Function("return " + str);
  };

  fillOutWidgets = function(widgets, updateUICallback) {
    var i, widget, _i, _len, _results;
    _results = [];
    for (i = _i = 0, _len = widgets.length; _i < _len; i = ++_i) {
      widget = widgets[i];
      widget.id = i;
      if (widget.varName != null) {
        widget.varName = widget.varName.toLowerCase();
      }
      switch (widget['type']) {
        case "switch":
          _results.push(widget.currentValue = widget.on);
          break;
        case "slider":
          widget.currentValue = widget["default"];
          if (widget.compilation.success) {
            widget.getMin = reporterOf(widget.compiledMin);
            widget.getMax = reporterOf(widget.compiledMax);
            widget.getStep = reporterOf(widget.compiledStep);
          } else {
            widget.getMin = function() {
              return widget["default"];
            };
            widget.getMax = function() {
              return widget["default"];
            };
            widget.getStep = function() {
              return 0;
            };
          }
          widget.minValue = widget["default"];
          widget.maxValue = widget["default"] + 1;
          _results.push(widget.stepValue = 1);
          break;
        case "inputBox":
          _results.push(widget.currentValue = widget.value);
          break;
        case "button":
          if (widget.forever) {
            widget.running = false;
          }
          _results.push((function(widget) {
            var task;
            if (widget.compilation.success) {
              task = window.handlingErrors(new Function(widget.compiledSource));
              return (function(task) {
                var wrappedTask;
                wrappedTask = widget.forever ? function() {
                  var ex, mustStop;
                  mustStop = (function() {
                    try {
                      return task() instanceof Exception.StopInterrupt;
                    } catch (_error) {
                      ex = _error;
                      return ex instanceof Exception.HaltInterrupt;
                    }
                  })();
                  if (mustStop) {
                    widget.running = false;
                    return updateUICallback();
                  }
                } : function() {
                  task();
                  return updateUICallback();
                };
                return (function(wrappedTask) {
                  return widget.run = wrappedTask;
                })(wrappedTask);
              })(task);
            } else {
              return widget.run = function() {
                return showErrors(["Button failed to compile with:\n" + widget.compilation.messages.join('\n')]);
              };
            }
          })(widget));
          break;
        case "chooser":
          _results.push(widget.currentValue = widget.choices[widget.currentChoice]);
          break;
        case "monitor":
          if (widget.compilation.success) {
            widget.reporter = reporterOf(widget.compiledSource);
            _results.push(widget.currentValue = "");
          } else {
            widget.reporter = function() {
              return "N/A";
            };
            _results.push(widget.currentValue = "N/A");
          }
          break;
        default:
          _results.push(void 0);
      }
    }
    return _results;
  };

  createPlotOps = function(container, widgets) {
    var plotOps, widget, _i, _len;
    plotOps = {};
    for (_i = 0, _len = widgets.length; _i < _len; _i++) {
      widget = widgets[_i];
      if (widget.type === "plot") {
        plotOps[widget.display] = new HighchartsOps(container.querySelector("#netlogo-plot-" + widget.id));
      }
    }
    return plotOps;
  };

  isValidValue = function(widget, value) {
    return (value != null) && (function() {
      switch (widget.type) {
        case 'slider':
          return !isNaN(value);
        case 'inputBox':
          return !(widget.boxtype === 'Number' && isNaN(value));
        default:
          return true;
      }
    })();
  };

  template = "<div class=\"netlogo-model\" style=\"min-width: {{width}}px;\"\n     tabindex=\"1\" on-keydown=\"checkActionKeys\" on-focus=\"checkFocus\" on-blur=\"checkFocus\">\n  <div class=\"netlogo-header\">\n    <div class=\"netlogo-subheader\">\n      <div class=\"netlogo-powered-by\">\n        <a href=\"http://ccl.northwestern.edu/netlogo/\">\n          <img style=\"vertical-align: middle;\" alt=\"NetLogo\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAANcSURBVHjarJRdaFxFFMd/M/dj7252uxubKms+bGprVyIVbNMWWqkQqtLUSpQWfSiV+oVFTcE3DeiDgvoiUSiCYLH2oVoLtQ+iaaIWWtE2FKGkkSrkq5svN+sm7ma/7p3x4W42lEbjQw8MM8yc87/nzPnNFVprbqWJXyMyXuMqx1Ni6N3ny3cX8tOHNLoBUMvESoFI2Xbs4zeO1lzREpSrMSNS1zkBDv6uo1/noz1H7mpvS4SjprAl2AZYEqzKbEowBAgBAkjPKX2599JjT7R0bj412D0JYNplPSBD1G2SmR/e6u1ikEHG2vYiGxoJmxAyIGSCI8GpCItKimtvl2JtfGujDNkX6epuAhCjNeAZxM1ocPy2Qh4toGQ5DLU+ysiuA2S3P0KgJkjAgEAlQylAA64CG/jlUk6//ng4cNWmLK0yOPNMnG99Rs9LQINVKrD+wmke7upg55PrWP3eYcwrlykpKCkoelDy/HVegQhoABNAepbACwjOt72gZkJhypX70YDWEEklue+rbnYc2MiGp1upPfYReiJJUUG58gFXu4udch1wHcjFIgy0HyIjb2yvBpT2F6t+6+f+D15lW8c9JDo7iPSdgVIRLUqL2AyHDQAOf9hfbqxvMF98eT3RuTS1avHyl+Stcphe2chP9+4k/t3RbXVl3W+Ws17FY56/w3VcbO/koS/eZLoAqrQMxADZMTYOfwpwoWjL4+bCYcgssMqGOzPD6CIkZ/3SxTJ0ayFIN6/BnBrZb2XdE1JUgkJWkfrUNRJnPyc16zsbgPyXIUJBpvc+y89nk/S8/4nek3NPGeBWMwzGvhUPnP6RubRLwfODlqqx3LSCyee2MnlwMwA2RwgO5qouVcHmksUdJweYyi8hZkrUjgT5t/ejNq0jBsSqNWsKyT9uFtxw7Bs585d3g46KOeT2bWHmtd14KyP+5mzqpsYU3OyioACMhGiqPTMocsrHId9cy9BLDzKxq8X3ctMwlV6yKSHL4fr4dd0DeQBTBUgUkvpE1kVPbqkX117ZzuSaFf4zyfz5n9A4lk0yNU7vyb7jTy1kmFGipejKvh6h9n0W995ZPTu227hqmCz33xXgFV1v9NzI96NfjndWt7XWCB/7BSICFWL+j3lAofpCtfYFb6X9MwCJZ07mUsXRGwAAAABJRU5ErkJggg==\"/>\n          <span style=\"font-size: 16px;\">powered by NetLogo</span>\n        </a>\n      </div>\n    </div>\n    <editableTitle title=\"{{modelTitle}}\" isEditing=\"{{isEditing}}\"/>\n    {{# !readOnly }}\n    <div class=\"netlogo-export-wrapper\">\n      <span style=\"margin-right: 4px;\">Export:</span>\n      <button class=\"netlogo-ugly-button\" on-click=\"exportnlogo\">NetLogo</button>\n      <button class=\"netlogo-ugly-button\" on-click=\"exportHtml\">HTML</button>\n    </div>\n    {{/}}\n  </div>\n\n  <div id=\"netlogo-widget-context-menu\" class=\"widget-context-menu\">\n    <div id='widget-creation-disabled-message' style=\"display: none;\">\n      Widget creation is not yet available.  Check back soon.\n    </div>\n  </div>\n\n  <div class=\"netlogo-interface-unlocker\" style=\"display: none\" on-click=\"toggleInterfaceLock\"></div>\n\n  <label class=\"netlogo-widget netlogo-speed-slider\">\n    <input type=\"range\" min=-1 max=1 step=0.01 value={{speed}} />\n    <span class=\"netlogo-label\">speed</span>\n  </label>\n\n  <div style=\"position: relative; width: {{width}}px; height: {{height}}px\"\n       class=\"netlogo-widget-container\"\n       on-contextmenu=\"showContextMenu:{{'widget-creation-disabled-message'}}\">\n    {{#widgetObj:key}}\n      {{# type === 'view'     }} <viewWidget    id=\"{{>widgetID}}\" dims=\"position: absolute; left: {{left}}; top: {{top}};\" widget={{this}} ticks=\"{{ticks}}\" /> {{/}}\n      {{# type === 'textBox'  }} <labelWidget   id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} /> {{/}}\n      {{# type === 'switch'   }} <switchWidget  id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} /> {{/}}\n      {{# type === 'button'   }} <buttonWidget  id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} errorClass=\"{{>errorClass}}\" ticksStarted=\"{{ticksStarted}}\"/> {{/}}\n      {{# type === 'slider'   }} <sliderWidget  id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} errorClass=\"{{>errorClass}}\" /> {{/}}\n      {{# type === 'chooser'  }} <chooserWidget id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} /> {{/}}\n      {{# type === 'monitor'  }} <monitorWidget id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} errorClass=\"{{>errorClass}}\" /> {{/}}\n      {{# type === 'inputBox' }} <inputWidget   id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} /> {{/}}\n      {{# type === 'plot'     }} <plotWidget    id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} /> {{/}}\n      {{# type === 'output'   }} <outputWidget  id=\"{{>widgetID}}\" dims=\"{{>dimensions}}\" widget={{this}} output=\"{{outputWidgetOutput}}\" /> {{/}}\n    {{/}}\n  </div>\n\n  <div class=\"netlogo-tab-area\">\n    {{# !readOnly }}\n    <label class=\"netlogo-tab{{#showConsole}} netlogo-active{{/}}\">\n      <input id=\"console-toggle\" type=\"checkbox\" checked=\"{{showConsole}}\" />\n      <span class=\"netlogo-tab-text\">Command Center</span>\n    </label>\n    {{#showConsole}}\n      <console output=\"{{consoleOutput}}\"/>\n    {{/}}\n    {{/}}\n    <label class=\"netlogo-tab{{#showCode}} netlogo-active{{/}}\">\n      <input id=\"code-tab-toggle\" type=\"checkbox\" checked=\"{{ showCode }}\" />\n      <span class=\"netlogo-tab-text\">NetLogo Code</span>\n    </label>\n    {{#showCode}}\n      <editor code='{{code}}' readOnly='{{readOnly}}' />\n    {{/}}\n    <label class=\"netlogo-tab{{#showInfo}} netlogo-active{{/}}\">\n      <input id=\"info-toggle\" type=\"checkbox\" checked=\"{{ showInfo }}\" />\n      <span class=\"netlogo-tab-text\">Model Info</span>\n    </label>\n    {{#showInfo}}\n      <infotab rawText='{{info}}' editing='false' />\n    {{/}}\n  </div>\n</div>";

  partials = {
    errorClass: "{{# !compilation.success}}netlogo-widget-error{{/}}",
    dimensions: "position: absolute;\nleft: {{ left }}px; top: {{ top }}px;\nwidth: {{ right - left }}px; height: {{ bottom - top }}px;",
    widgetID: "netlogo-{{type}}-{{id}}"
  };

}).call(this);

//# sourceMappingURL=widgets.js.map
