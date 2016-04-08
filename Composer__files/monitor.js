(function() {
  window.RactiveMonitor = RactiveWidget.extend({
    data: function() {
      return {
        errorClass: void 0
      };
    },
    isolated: true,
    template: "<div id=\"{{id}}\"\n     on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n     class=\"netlogo-widget netlogo-monitor netlogo-output\"\n     style=\"{{dims}} font-size: {{widget.fontSize}}px;\">\n  <label class=\"netlogo-label {{errorClass}}\" on-click=\"showErrors\">{{widget.display || widget.source}}</label>\n  <output class=\"netlogo-value\">{{widget.currentValue}}</output>\n</div>\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>"
  });

}).call(this);

//# sourceMappingURL=monitor.js.map
