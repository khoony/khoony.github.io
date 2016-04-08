(function() {
  window.RactiveChooser = RactiveWidget.extend({
    isolated: true,
    template: "<label id=\"{{id}}\"\n       on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n       class=\"netlogo-widget netlogo-chooser netlogo-input\"\n       style=\"{{dims}}\">\n  <span class=\"netlogo-label\">{{widget.display}}</span>\n  <select class=\"netlogo-chooser-select\" value=\"{{widget.currentValue}}\">\n  {{#widget.choices}}\n    <option class=\"netlogo-chooser-option\" value=\"{{.}}\">{{>literal}}</option>\n  {{/}}\n  </select>\n</label>\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>",
    partials: {
      literal: "{{# typeof . === \"string\"}}{{.}}{{/}}\n{{# typeof . === \"number\"}}{{.}}{{/}}\n{{# typeof . === \"object\"}}\n  [{{#.}}\n    {{>literal}}\n  {{/}}]\n{{/}}"
    }
  });

}).call(this);

//# sourceMappingURL=chooser.js.map
