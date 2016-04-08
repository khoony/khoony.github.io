(function() {
  var SwitchEditForm;

  SwitchEditForm = EditForm.extend({
    data: function() {
      return {
        display: void 0
      };
    },
    isolated: true,
    components: {
      formVariable: RactiveEditFormVariable
    },
    validate: function(form) {
      var varName;
      varName = form.varName.value;
      return {
        display: varName,
        varName: varName.toLowerCase()
      };
    },
    partials: {
      title: "Switch",
      widgetFields: "<formVariable id=\"{{id}}-varname\" name=\"varName\" value=\"{{display}}\"/>"
    }
  });

  window.RactiveSwitch = RactiveWidget.extend({
    isolated: true,
    oninit: function() {
      this._super();
      return Object.defineProperty(this.get('widget'), "on", {
        get: function() {
          return this.currentValue;
        },
        set: function(x) {
          return this.currentValue = x;
        }
      });
    },
    components: {
      editForm: SwitchEditForm
    },
    template: "{{>switch}}\n{{>contextMenu}}\n<editForm idBasis=\"{{id}}\" display=\"{{widget.display}}\" twoway=\"false\"/>",
    partials: {
      "switch": "<label id=\"{{id}}\"\n       on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n       class=\"netlogo-widget netlogo-switcher netlogo-input\"\n       style=\"{{dims}}\">\n  <input type=\"checkbox\" checked={{ widget.currentValue }} />\n  <span class=\"netlogo-label\">{{ widget.display }}</span>\n</label>",
      contextMenu: "<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"editWidget\">Edit</li>\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>"
    }
  });

}).call(this);

//# sourceMappingURL=switch.js.map
