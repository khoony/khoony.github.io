(function() {
  window.RactiveInfoTabEditor = Ractive.extend({
    onrender: function() {
      var infoTabEditor;
      infoTabEditor = CodeMirror(this.find('.netlogo-info-editor'), {
        value: this.get('rawText'),
        tabsize: 2,
        mode: 'markdown',
        theme: 'netlogo-default',
        editing: this.get('editing'),
        lineWrapping: true
      });
      return infoTabEditor.on('change', (function(_this) {
        return function() {
          _this.set('rawText', infoTabEditor.getValue());
          return _this.set('info', infoTabEditor.getValue());
        };
      })(this));
    },
    template: "<div class='netlogo-info-editor'></div>"
  });

  window.RactiveInfoTabWidget = Ractive.extend({
    components: {
      infoeditor: RactiveInfoTabEditor
    },
    template: "<div class='netlogo-tab-content netlogo-info'\n     intro='grow:{disable:\"info-toggle\"}' outro='shrink:{disable:\"info-toggle\"}'>\n  <label class='netlogo-toggle-edit-mode'>\n    <input type='checkbox' checked='{{editing}}'>\n    Edit Mode\n  </label>\n  {{# !editing }}\n    <div class='netlogo-info-markdown'>{{{markdown(rawText)}}}</div>\n  {{ else }}\n    <infoeditor rawText='{{rawText}}' />\n  {{ / }}\n</div>"
  });

}).call(this);

//# sourceMappingURL=info.js.map
