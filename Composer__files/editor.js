(function() {
  window.RactiveEditorWidget = Ractive.extend({
    data: function() {
      return {
        isStale: false,
        readOnly: void 0
      };
    },
    components: {
      codeEditor: RactiveCodeContainerMultiline
    },
    template: "<div class=\"netlogo-tab-content netlogo-code-container\"\n     intro='grow:{disable:\"code-tab-toggle\"}' outro='shrink:{disable:\"code-tab-toggle\"}'>\n  {{# !readOnly }}\n    <button class=\"netlogo-widget netlogo-ugly-button netlogo-recompilation-button\"\n            on-click=\"recompile\" {{# !isStale }}disabled{{/}} >Recompile Code</button>\n  {{/}}\n  <codeEditor id=\"netlogo-code-tab-editor\" code=\"{{code}}\"\n              injectedConfig=\"{ readOnly: {{readOnly}} }\" isStale=\"{{isStale}}\" />\n</div>"
  });

}).call(this);

//# sourceMappingURL=editor.js.map
