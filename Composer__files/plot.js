(function() {
  window.RactivePlot = RactiveWidget.extend({
    isolated: true,
    template: "<div id=\"{{id}}\"\n     on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n     class=\"netlogo-widget netlogo-plot\"\n     style=\"{{dims}}\"></div>\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>"
  });

}).call(this);

//# sourceMappingURL=plot.js.map
