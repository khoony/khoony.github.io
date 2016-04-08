(function() {
  window.RactiveEditFormFontSize = Ractive.extend({
    data: function() {
      return {
        id: void 0,
        name: void 0,
        value: void 0
      };
    },
    isolated: true,
    twoway: false,
    template: "<label for=\"{{id}}\">Font size: </label>\n<input id=\"{{id}}\" class=\"widget-edit-text-size\" name=\"{{name}}\" placeholder=\"(Required)\"\n       type=\"number\" value=\"{{value}}\" autofocus min=1 max=128 required />"
  });

}).call(this);

//# sourceMappingURL=fontsize.js.map
