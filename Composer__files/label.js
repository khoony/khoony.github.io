(function() {
  var LabelEditForm;

  LabelEditForm = EditForm.extend({
    data: function() {
      return {
        color: void 0,
        fontSize: void 0,
        text: void 0,
        transparent: void 0
      };
    },
    isolated: true,
    twoway: false,
    components: {
      formCheckbox: RactiveEditFormCheckbox,
      formFontSize: RactiveEditFormFontSize,
      spacer: RactiveEditFormSpacer
    },
    validate: function(form) {
      var color;
      color = window.hexStringToNetlogoColor(form.color.value);
      return {
        color: color,
        display: form.text.value,
        fontSize: form.fontSize.value,
        transparent: form.transparent.checked
      };
    },
    partials: {
      title: "Note",
      widgetFields: "<label for=\"{{id}}-text\">Text</label><br>\n<textarea id=\"{{id}}-text\" class=\"widget-edit-textbox\"\n          name=\"text\" placeholder=\"Enter note text here...\"\n          autofocus>{{text}}</textarea>\n\n<spacer height=\"20px\" />\n\n<formFontSize id=\"{{id}}-font-size\" name=\"fontSize\" value=\"{{fontSize}}\"/>\n\n<spacer height=\"15px\" />\n\n<formCheckbox id=\"{{id}}-transparent-checkbox\" isChecked={{transparent}} labelText=\"Transparent background\" name=\"transparent\" />\n\n<spacer height=\"15px\" />\n\n<label for=\"{{id}}-text-color\">Text color:</label>\n<input id=\"{{id}}-text-color\" class=\"widget-edit-color-picker\" name=\"color\"\n       type=\"color\" value=\"{{color}}\" />"
    }
  });

  window.RactiveLabel = RactiveWidget.extend({
    data: function() {
      return {
        convertColor: netlogoColorToCSS
      };
    },
    isolated: true,
    components: {
      editForm: LabelEditForm
    },
    computed: {
      hexColor: function() {
        return window.netlogoColorToHexString(this.get('widget').color);
      }
    },
    template: "<pre id=\"{{id}}\"\n     on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n     class=\"netlogo-widget netlogo-text-box\"\n     style=\"{{dims}} font-size: {{widget.fontSize}}px; color: {{ convertColor(widget.color) }}; {{# widget.transparent}}background: transparent;{{/}}\"\n     >{{ widget.display }}</pre>\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"editWidget\">Edit</li>\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>\n<editForm idBasis=\"{{id}}\" color=\"{{hexColor}}\"\n          fontSize=\"{{widget.fontSize}}\" text=\"{{widget.display}}\"\n          transparent=\"{{widget.transparent}}\" />"
  });

}).call(this);

//# sourceMappingURL=label.js.map
