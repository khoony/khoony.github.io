(function() {
  window.RactiveSlider = RactiveWidget.extend({
    data: function() {
      return {
        errorClass: void 0
      };
    },
    isolated: true,
    template: "<label id=\"{{id}}\"\n       on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n       class=\"netlogo-widget netlogo-slider netlogo-input {{errorClass}}\"\n       style=\"{{dims}}\">\n  <input type=\"range\"\n         max=\"{{widget.maxValue}}\" min=\"{{widget.minValue}}\"\n         step=\"{{widget.step}}\" value=\"{{widget.currentValue}}\" />\n  <div class=\"netlogo-slider-label\">\n    <span class=\"netlogo-label\" on-click=\"showErrors\">{{widget.display}}</span>\n    <span class=\"netlogo-slider-value\">\n      <input type=\"number\"\n             style=\"width: {{widget.currentValue.toString().length + 3.0}}ch\"\n             min={{widget.minValue}} max={{widget.maxValue}}\n             value={{widget.currentValue}} step={{widget.step}} />\n      {{#widget.units}}{{widget.units}}{{/}}\n    </span>\n  </div>\n</label>\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>"
  });

}).call(this);

//# sourceMappingURL=slider.js.map
