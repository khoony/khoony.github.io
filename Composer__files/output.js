(function() {
  var OutputEditForm;

  OutputEditForm = EditForm.extend({
    data: function() {
      return {
        fontSize: void 0
      };
    },
    isolated: true,
    components: {
      formFontSize: RactiveEditFormFontSize
    },
    validate: function(form) {
      return {
        fontSize: form.fontSize.value
      };
    },
    partials: {
      title: "Output",
      widgetFields: "<formFontSize id=\"{{id}}-font-size\" name=\"fontSize\" value=\"{{fontSize}}\"/>"
    }
  });

  window.RactiveOutputArea = RactiveWidget.extend({
    data: function() {
      return {
        output: void 0
      };
    },
    isolated: true,
    components: {
      editForm: OutputEditForm,
      printArea: RactivePrintArea
    },
    template: "<div id=\"{{id}}\"\n     on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n     class=\"netlogo-widget netlogo-output netlogo-output-widget\" style=\"{{dims}}\">\n  <printArea id=\"{{id}}-print-area\" fontSize=\"{{widget.fontSize}}\" output=\"{{output}}\" />\n</div>\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"editWidget\">Edit</li>\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>\n<editForm idBasis=\"{{id}}\" fontSize=\"{{widget.fontSize}}\" twoway=\"false\"/>"
  });

}).call(this);

//# sourceMappingURL=output.js.map
