(function() {
  var arrayContains, elemById, elemsByClass, hideElem, nodeListToArray, pipeline, showElem,
    __slice = [].slice;

  elemById = function(id) {
    return document.getElementById(id);
  };

  elemsByClass = function(className) {
    return document.getElementsByClassName(className);
  };

  hideElem = function(elem) {
    return elem.style.display = "none";
  };

  showElem = function(elem) {
    return elem.style.display = "";
  };

  arrayContains = function(xs) {
    return function(x) {
      return xs.indexOf(x) !== -1;
    };
  };

  nodeListToArray = function(nodeList) {
    return Array.prototype.slice.call(nodeList);
  };

  pipeline = function() {
    var functions;
    functions = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return function() {
      var args, f, fs, h, out, _i, _len;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      h = functions[0], fs = 2 <= functions.length ? __slice.call(functions, 1) : [];
      out = h.apply(null, args);
      for (_i = 0, _len = fs.length; _i < _len; _i++) {
        f = fs[_i];
        out = f(out);
      }
      return out;
    };
  };

  window.attachWidgetMenus = function() {
    var menuItemDivs;
    menuItemDivs = pipeline(elemsByClass, nodeListToArray)('netlogo-widget-editor-menu-items');
    menuItemDivs.forEach(function(elem) {
      hideElem(elem);
      return elemById("netlogo-widget-context-menu").appendChild(elem);
    });
  };

  window.setupInterfaceEditor = function(ractive, removeWidgetById) {
    var handleContextMenu, hideContextMenu;
    hideContextMenu = function() {
      return pipeline(elemById, hideElem)("netlogo-widget-context-menu");
    };
    document.addEventListener("click", hideContextMenu);
    document.addEventListener("contextmenu", function(e) {
      var c, classes, elem, elems, hasClass, latestElem, listOfLists;
      latestElem = e.target;
      elems = [];
      while (latestElem != null) {
        elems.push(latestElem);
        latestElem = latestElem.parentElement;
      }
      listOfLists = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = elems.length; _i < _len; _i++) {
          elem = elems[_i];
          _results.push((function() {
            var _j, _len1, _ref, _results1;
            _ref = elem.classList;
            _results1 = [];
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              c = _ref[_j];
              _results1.push(c);
            }
            return _results1;
          })());
        }
        return _results;
      })();
      classes = listOfLists.reduce(function(acc, x) {
        return acc.concat(x);
      });
      hasClass = arrayContains(classes);
      if ((!hasClass("netlogo-widget")) && (!hasClass("netlogo-widget-container"))) {
        return hideContextMenu();
      }
    });
    window.onkeyup = function(e) {
      if (e.keyCode === 27) {
        return hideContextMenu();
      }
    };
    ractive.on('toggleInterfaceLock', function() {
      var applyClassChanges, isEditing, unlockers, widgets;
      isEditing = !this.get('isEditing');
      this.set('isEditing', isEditing);
      applyClassChanges = isEditing ? function(e) {
        return e.classList.add('interface-unlocked');
      } : function(e) {
        return e.classList.remove('interface-unlocked');
      };
      widgets = pipeline(elemsByClass, nodeListToArray)("netlogo-widget");
      unlockers = pipeline(elemsByClass, nodeListToArray)("netlogo-interface-unlocker");
      widgets.concat(unlockers).forEach(applyClassChanges);
    });
    handleContextMenu = function(e, menuItemsID) {
      var child, contextMenu, trueEvent, _i, _len, _ref;
      if (this.get("isEditing")) {
        trueEvent = e.original;
        trueEvent.preventDefault();
        contextMenu = elemById("netlogo-widget-context-menu");
        contextMenu.style.top = "" + trueEvent.pageY + "px";
        contextMenu.style.left = "" + trueEvent.pageX + "px";
        contextMenu.style.display = "block";
        _ref = contextMenu.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          hideElem(child);
        }
        pipeline(elemById, showElem)(menuItemsID);
        return false;
      } else {
        return true;
      }
    };
    ractive.on('showContextMenu', handleContextMenu);
    ractive.on('*.showContextMenu', handleContextMenu);
    ractive.on('*.deleteWidget', function(e, widgetID, contextMenuID, widgetNum) {
      var deleteById;
      deleteById = function(id) {
        var elem;
        elem = elemById(id);
        return elem.parentElement.removeChild(elem);
      };
      deleteById(widgetID);
      deleteById(contextMenuID);
      hideContextMenu();
      removeWidgetById(widgetNum);
      return false;
    });
    return ractive.on('*.hideContextMenu', hideContextMenu);
  };

}).call(this);

//# sourceMappingURL=setupinterfaceeditor.js.map
