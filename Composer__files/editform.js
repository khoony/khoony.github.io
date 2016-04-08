(function() {
  window.EditForm = Ractive.extend({
    container: void 0,
    startX: void 0,
    startY: void 0,
    view: void 0,
    data: function() {
      return {
        idBasis: void 0,
        xLoc: void 0,
        yLoc: void 0
      };
    },
    computed: {
      id: (function() {
        return "" + (this.get('idBasis')) + "-edit-window";
      })
    },
    isolated: true,
    twoway: false,
    lazy: true,
    oninit: function() {
      this.on('submit', function(_arg) {
        var newProps, node;
        node = _arg.node;
        newProps = this.validate(node);
        if (newProps != null) {
          this.fire('updateWidgetValue', newProps);
        }
        this.fire('activateCloakingDevice');
        return false;
      });
      this.on('showYourself', function() {
        var containerMidX, containerMidY, dialogHalfHeight, dialogHalfWidth, elem;
        containerMidX = this.container.offsetWidth / 2;
        containerMidY = this.container.offsetHeight / 2;
        elem = this.getElem();
        elem.classList.remove('hidden');
        dialogHalfWidth = elem.offsetWidth / 2;
        dialogHalfHeight = elem.offsetHeight / 2;
        this.set('xLoc', containerMidX - dialogHalfWidth);
        this.set('yLoc', containerMidY - dialogHalfHeight);
        this.resetPartial('widgetFields', this.partials.widgetFields);
        return false;
      });
      this.on('activateCloakingDevice', function() {
        this.getElem().classList.add('hidden');
        return false;
      });
      this.on('startEditDrag', function(_arg) {
        var clientX, clientY, view, _ref;
        _ref = _arg.original, clientX = _ref.clientX, clientY = _ref.clientY, view = _ref.view;
        this.view = view;
        this.startX = this.get('xLoc') - clientX;
        this.startY = this.get('yLoc') - clientY;
      });
      this.on('stopEditDrag', function() {
        this.view = void 0;
      });
      this.on('dragEditDialog', function(_arg) {
        var clientX, clientY, view, _ref;
        _ref = _arg.original, clientX = _ref.clientX, clientY = _ref.clientY, view = _ref.view;
        if (this.view === view && clientX > 0 && clientY > 0) {
          this.set('xLoc', this.startX + clientX);
          this.set('yLoc', this.startY + clientY);
        }
        return false;
      });
      this.on('cancelEdit', function() {
        this.fire('activateCloakingDevice');
      });
      this.on('handleKey', function(_arg) {
        var keyCode;
        keyCode = _arg.original.keyCode;
        if (keyCode === 27) {
          this.fire('cancelEdit');
          false;
        }
      });
      this.on('blockContextMenu', function(_arg) {
        var original;
        original = _arg.original;
        original.preventDefault();
        return false;
      });
    },
    oncomplete: function() {
      var findParentByClass;
      findParentByClass = function(clss) {
        return function(_arg) {
          var parent;
          parent = _arg.parentElement;
          if (parent != null) {
            if (parent.classList.contains(clss)) {
              return parent;
            } else {
              return findParentByClass(clss)(parent);
            }
          } else {
            return void 0;
          }
        };
      };
      return this.container = findParentByClass('netlogo-widget-container')(this.getElem());
    },
    getElem: function() {
      return this.find("#" + (this.get('id')));
    },
    template: "<div id=\"{{id}}\"\n     class=\"widget-edit-popup widget-edit-text-size hidden\"\n     style=\"top: {{yLoc}}px; left: {{xLoc}}px;\"\n     on-contextmenu=\"blockContextMenu\" on-keydown=\"handleKey\"\n     on-drag=\"dragEditDialog\" on-dragstart=\"startEditDrag\"\n     on-dragend=\"stopEditDrag\"\n     tabindex=\"0\">\n  <div id=\"{{id}}-closer\" class=\"widget-edit-closer\" on-click=\"cancelEdit\">X</div>\n  <form class=\"widget-edit-form\" on-submit=\"submit\">\n    <div class=\"widget-edit-form-title\">{{>title}}</div>\n    {{>widgetFields}}\n    <div class=\"widget-edit-form-button-container\">\n      <input class=\"widget-edit-text-size\" type=\"submit\" value=\"OK\" />\n      <input class=\"widget-edit-text-size\" type=\"button\" on-click=\"cancelEdit\" value=\"Cancel\" />\n    </div>\n  </form>\n</div>",
    partials: {
      widgetFields: void 0
    }
  });

}).call(this);

//# sourceMappingURL=editform.js.map
