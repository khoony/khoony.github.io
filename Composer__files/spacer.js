(function() {
  window.RactiveEditFormSpacer = Ractive.extend({
    data: function() {
      return {
        height: void 0
      };
    },
    isolated: true,
    twoway: false,
    template: "<div style=\"height: {{height}};\"></div>"
  });

}).call(this);

//# sourceMappingURL=spacer.js.map
