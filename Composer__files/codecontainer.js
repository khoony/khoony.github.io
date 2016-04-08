(function() {
  var RactiveCodeContainerBase;

  RactiveCodeContainerBase = Ractive.extend({
    data: function() {
      return {
        code: void 0,
        extraAttrs: void 0,
        extraClasses: void 0,
        extraConfig: void 0,
        injectedClasses: void 0,
        injectedConfig: void 0,
        id: void 0,
        isStale: void 0,
        lastCompiledCode: void 0
      };
    },
    oncomplete: function() {
      return this._setupCodeMirror();
    },
    isolated: true,
    twoway: false,
    _setupCodeMirror: function() {
      var baseConfig, config, editor, _ref, _ref1;
      baseConfig = {
        mode: 'netlogo',
        theme: 'netlogo-default'
      };
      config = Object.assign({}, baseConfig, (_ref = this.get('extraConfig')) != null ? _ref : {}, (_ref1 = this.get('injectedConfig')) != null ? _ref1 : {});
      editor = CodeMirror.fromTextArea(this.find("#" + (this.get('id'))), config);
      editor.getDoc().setValue(this.get('code'));
      editor.on('change', (function(_this) {
        return function() {
          var newCode;
          newCode = editor.getValue();
          _this.set('isStale', _this.get('lastCompiledCode') !== newCode);
          return _this.set('code', newCode);
        };
      })(this));
      return this.on('teardown', function() {
        console.log("derp");
        return editor.toTextArea();
      });
    },
    template: "<textarea id=\"{{id}}\" class=\"{{extraClasses}} {{injectedClasses}}\" {{extraAttrs}}></textarea>"
  });

  window.RactiveCodeContainerMultiline = RactiveCodeContainerBase.extend({
    data: function() {
      return {
        extraConfig: {
          tabSize: 2,
          extraKeys: {
            "Ctrl-F": "findPersistent",
            "Cmd-F": "findPersistent"
          }
        }
      };
    },
    isolated: true
  });

}).call(this);

//# sourceMappingURL=codecontainer.js.map
