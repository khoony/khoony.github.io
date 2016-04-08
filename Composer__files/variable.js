(function() {
  window.RactiveEditFormVariable = Ractive.extend({
    data: function() {
      return {
        id: void 0,
        name: void 0,
        value: void 0
      };
    },
    isolated: true,
    lazy: true,
    template: "<label for=\"{{id}}\">Global variable: </label>\n<input id=\"{{id}}\" class=\"widget-edit-text-size\" name=\"{{name}}\" placeholder=\"(Required)\"\n       type=\"text\" value=\"{{value}}\"\n       autofocus autocomplete=\"off\"\n       pattern=\"[=*!<>:#+/%'&$^.?\\-\\w]+\"\n       title=\"A variable name to be used for the switch's value in your model.\n\nMust contain at least one valid character.  Valid characters are alphanumeric characters and all of the following special characters: $^.?=*!<>:#+/%'&-_\"\n       required />"
  });

}).call(this);

//# sourceMappingURL=variable.js.map
