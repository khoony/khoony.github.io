(function() {
  window.RactiveEditFormCheckbox = Ractive.extend({
    data: function() {
      return {
        id: void 0,
        isChecked: void 0,
        labelText: void 0,
        name: void 0
      };
    },
    isolated: true,
    twoway: false,
    template: "<input id=\"{{id}}\" class=\"widget-edit-checkbox\" style=\"height: 13px;\"\n       name=\"{{name}}\" type=\"checkbox\"{{#isChecked}} checked{{/}} />\n<label for=\"{{id}}\">{{labelText}}</label>"
  });

}).call(this);

//# sourceMappingURL=checkbox.js.map
