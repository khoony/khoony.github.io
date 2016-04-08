(function() {
  window.RactiveModelTitle = Ractive.extend({
    data: function() {
      return {
        title: void 0,
        isEditing: void 0
      };
    },
    isolated: true,
    oninit: function() {
      var defaultOnEmpty;
      defaultOnEmpty = function(s) {
        if (s === '') {
          return "Untitled";
        } else {
          return s;
        }
      };
      return this.on('editTitle', function() {
        var newName, oldName, _ref;
        if (this.get('isEditing')) {
          oldName = this.get('title');
          newName = prompt("Enter a new name for your model", oldName);
          this.set('title', (_ref = defaultOnEmpty(newName)) != null ? _ref : oldName);
        }
      });
    },
    template: "<div class=\"netlogo-model-masthead\">\n  <div style=\"display: flex; justify-content: center; height: 30px; line-height: 30px;\">\n    <h2 id=\"netlogo-title\"\n        on-contextmenu=\"showContextMenu:{{'title-context-items'}}\"\n        class=\"netlogo-widget netlogo-model-title\"\n        on-dblclick=\"editTitle\">\n      {{ title }}\n    </h2>\n  </div>\n</div>\n<div id=\"title-context-items\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"editTitle\">Edit</li>\n  </ul>\n</div>"
  });

}).call(this);

//# sourceMappingURL=title.js.map
