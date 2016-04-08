(function() {
  window.RactiveInput = RactiveWidget.extend({
    isolated: true,
    template: "<label id=\"{{id}}\"\n       on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n       class=\"netlogo-widget netlogo-input-box netlogo-input\"\n       style=\"{{dims}}\">\n  <div class=\"netlogo-label\">{{widget.varName}}</div>\n  {{# widget.boxtype === 'Number'}}<input type=\"number\" value=\"{{widget.currentValue}}\" />{{/}}\n  {{# widget.boxtype === 'String'}}\n    {{#if widget.multiline === false}}\n      <input type=\"text\" value=\"{{widget.currentValue}}\" />\n    {{else}}\n      <textarea class=\"netlogo-multiline-input\">{{widget.currentValue}}</textarea>\n    {{/if}}\n  {{/}}\n  {{# widget.boxtype === 'String (reporter)'}}<input type=\"text\" value=\"{{widget.currentValue}}\" />{{/}}\n  {{# widget.boxtype === 'String (commands)'}}<input type=\"text\" value=\"{{widget.currentValue}}\" />{{/}}\n  <!-- TODO: Fix color input. It'd be nice to use html5s color input. -->\n  {{# widget.boxtype === 'Color'}}<input type=\"color\" value=\"{{widget.currentValue}}\" />{{/}}\n</label>\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>"
  });

}).call(this);

//# sourceMappingURL=input.js.map
