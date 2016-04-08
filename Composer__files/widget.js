(function() {
  window.RactiveWidget = Ractive.extend({
    data: function() {
      return {
        dims: void 0,
        id: void 0,
        widget: void 0
      };
    },
    components: {
      editForm: void 0
    },
    isolated: true,
    oninit: function() {
      var _ref;
      if ((_ref = this.findComponent('editForm')) != null) {
        _ref.fire("activateCloakingDevice");
      }
      this.on('editWidget', function() {
        this.fire('hideContextMenu');
        this.findComponent('editForm').fire("showYourself");
        return false;
      });
      return this.on('*.updateWidgetValue', function(obj) {
        var endName, k, startName, v, widget;
        widget = this.get('widget');
        startName = widget.varName;
        for (k in obj) {
          v = obj[k];
          widget[k] = v;
        }
        endName = widget.varName;
        if (startName !== endName) {
          this.fire('renameInterfaceGlobal', startName, endName, widget.currentValue);
          this.fire('recompile');
        }
        return false;
      });
    }
  });

}).call(this);

//# sourceMappingURL=widget.js.map
