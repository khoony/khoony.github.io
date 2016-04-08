(function() {
  window.RactiveView = RactiveWidget.extend({
    data: function() {
      return {
        ticks: void 0
      };
    },
    isolated: true,
    template: "<div id=\"{{id}}\"\n     on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n     class=\"netlogo-widget netlogo-view-container\"\n     style=\"{{dims}}\">\n  <div class=\"netlogo-widget netlogo-tick-counter\">\n    {{# widget.showTickCounter }}\n      {{widget.tickCounterLabel}}: <span>{{ticks}}</span>\n    {{/}}\n  </div>\n</div>\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  Nothing to see here...\n</div>"
  });

}).call(this);

//# sourceMappingURL=view.js.map
