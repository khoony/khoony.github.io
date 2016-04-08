tortoise_require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"agentmodel":[function(require,module,exports){
(function() {
  var AgentModel;

  module.exports = AgentModel = (function() {
    var mergeObjectInto;

    function AgentModel() {
      this.turtles = {};
      this.patches = {};
      this.links = {};
      this.observer = {};
      this.world = {};
      this.drawingEvents = [];
    }

    AgentModel.prototype.updates = function(modelUpdates) {
      var i, len, u;
      for (i = 0, len = modelUpdates.length; i < len; i++) {
        u = modelUpdates[i];
        this.update(u);
      }
    };

    AgentModel.prototype.update = function(arg) {
      var coll, drawingEvents, i, id, len, linkBundle, links, observer, patchBundle, patches, ref, ref1, turtleBundle, turtles, typeCanDie, updates, varUpdates, world;
      links = arg.links, observer = arg.observer, patches = arg.patches, turtles = arg.turtles, world = arg.world, drawingEvents = arg.drawingEvents;
      turtleBundle = {
        updates: turtles,
        coll: this.turtles,
        typeCanDie: true
      };
      patchBundle = {
        updates: patches,
        coll: this.patches,
        typeCanDie: false
      };
      linkBundle = {
        updates: links,
        coll: this.links,
        typeCanDie: true
      };
      ref = [turtleBundle, patchBundle, linkBundle];
      for (i = 0, len = ref.length; i < len; i++) {
        ref1 = ref[i], coll = ref1.coll, typeCanDie = ref1.typeCanDie, updates = ref1.updates;
        for (id in updates) {
          varUpdates = updates[id];
          if (varUpdates != null) {
            if (typeCanDie && varUpdates.WHO === -1) {
              delete coll[id];
            } else {
              mergeObjectInto(varUpdates, this._itemById(coll, id));
            }
          }
        }
      }
      if ((observer != null ? observer[0] : void 0) != null) {
        mergeObjectInto(observer[0], this.observer);
      }
      if ((world != null ? world[0] : void 0) != null) {
        mergeObjectInto(world[0], this.world);
      }
      if (drawingEvents != null) {
        this.drawingEvents = this.drawingEvents.concat(drawingEvents);
      }
    };

    AgentModel.prototype._itemById = function(coll, id) {
      if (coll[id] == null) {
        coll[id] = {};
      }
      return coll[id];
    };

    mergeObjectInto = function(updatedObject, targetObject) {
      var value, variable;
      for (variable in updatedObject) {
        value = updatedObject[variable];
        targetObject[variable.toLowerCase()] = value;
      }
    };

    return AgentModel;

  })();

}).call(this);

},{}],"bootstrap":[function(require,module,exports){

/*
  `Workspace` is needed to do anything.  If you want the core of Tortoise, do `require('engine/workspace')`.
  If you want the peripheral stuff (i.e. because you're a compiler or test infrastructure),
  the other things you might want ought to get initialized by RequireJS here. --JAB (5/7/14)
 */

(function() {
  require('./agentmodel');

  require('./engine/workspace');

  require('./engine/prim/prims');

  require('./engine/prim/tasks');

  require('./util/notimplemented');

  module.exports = function() {};

}).call(this);

},{"./agentmodel":"agentmodel","./engine/prim/prims":"engine/prim/prims","./engine/prim/tasks":"engine/prim/tasks","./engine/workspace":"engine/workspace","./util/notimplemented":"util/notimplemented"}],"engine/core/abstractagentset":[function(require,module,exports){
(function() {
  var AbstractAgentSet, Death, NLType, Nobody, Seq, Shufflerator, _, projectionSort, stableSort,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('lodash');

  Nobody = require('./nobody');

  projectionSort = require('./projectionsort');

  NLType = require('./typechecker');

  Seq = require('util/seq');

  Shufflerator = require('util/shufflerator');

  stableSort = require('util/stablesort');

  Death = require('util/exception').DeathInterrupt;

  module.exports = AbstractAgentSet = (function(superClass) {
    extend(AbstractAgentSet, superClass);

    AbstractAgentSet._nextInt = void 0;

    AbstractAgentSet._selfManager = void 0;

    AbstractAgentSet._world = void 0;

    function AbstractAgentSet(agents, _agentTypeName, _specialName) {
      this._agentTypeName = _agentTypeName;
      this._specialName = _specialName;
      AbstractAgentSet.__super__.constructor.call(this, agents);
    }

    AbstractAgentSet.prototype.agentFilter = function(f) {
      return this.filter(this._lazyGetSelfManager().askAgent(f));
    };

    AbstractAgentSet.prototype.agentAll = function(f) {
      return this.every(this._lazyGetSelfManager().askAgent(f));
    };

    AbstractAgentSet.prototype.ask = function(f, shouldShuffle) {
      var base, iter, selfManager;
      iter = shouldShuffle ? this.shufflerator() : this.iterator();
      selfManager = this._lazyGetSelfManager();
      iter.forEach(selfManager.askAgent(f));
      if (typeof (base = selfManager.self()).isDead === "function" ? base.isDead() : void 0) {
        throw new Death;
      }
    };

    AbstractAgentSet.prototype.atPoints = function(points) {
      var getPatchAt, getSelf;
      getSelf = (function(_this) {
        return function() {
          return _this._lazyGetSelfManager().self();
        };
      })(this);
      getPatchAt = (function(_this) {
        return function(x, y) {
          return _this._lazyGetWorld().getPatchAt(x, y);
        };
      })(this);
      return require('./agentset/atpoints')(getSelf, getPatchAt).call(this, points);
    };

    AbstractAgentSet.prototype.copyWithNewAgents = function(agents) {
      return this._generateFrom(agents);
    };

    AbstractAgentSet.prototype.getSpecialName = function() {
      return this._specialName;
    };

    AbstractAgentSet.prototype.maxesBy = function(f) {
      return this.copyWithNewAgents(this._findMaxesBy(f));
    };

    AbstractAgentSet.prototype.maxNOf = function(n, f) {
      if (n > this.size()) {
        throw new Error("Requested " + n + " random agents from a set of only " + (this.size()) + " agents.");
      }
      if (n < 0) {
        throw new Error("First input to MAX-N-OF can't be negative.");
      }
      return this._findBestNOf(n, f, function(x, y) {
        if (x === y) {
          return 0;
        } else if (x > y) {
          return -1;
        } else {
          return 1;
        }
      });
    };

    AbstractAgentSet.prototype.maxOneOf = function(f) {
      return this._randomOneOf(this._findMaxesBy(f));
    };

    AbstractAgentSet.prototype.minNOf = function(n, f) {
      if (n > this.size()) {
        throw new Error("Requested " + n + " random agents from a set of only " + (this.size()) + " agents.");
      }
      if (n < 0) {
        throw new Error("First input to MIN-N-OF can't be negative.");
      }
      return this._findBestNOf(n, f, function(x, y) {
        if (x === y) {
          return 0;
        } else if (x < y) {
          return -1;
        } else {
          return 1;
        }
      });
    };

    AbstractAgentSet.prototype.minOneOf = function(f) {
      return this._randomOneOf(this._findMinsBy(f));
    };

    AbstractAgentSet.prototype.minsBy = function(f) {
      return this.copyWithNewAgents(this._findMinsBy(f));
    };

    AbstractAgentSet.prototype.projectionBy = function(f) {
      return this.shufflerator().map(this._lazyGetSelfManager().askAgent(f));
    };

    AbstractAgentSet.prototype.shuffled = function() {
      return this.copyWithNewAgents(this.shufflerator().toArray());
    };

    AbstractAgentSet.prototype.shufflerator = function() {
      return new Shufflerator(this.toArray(), (function(agent) {
        return (agent != null ? agent.id : void 0) >= 0;
      }), this._lazyGetNextIntFunc());
    };

    AbstractAgentSet.prototype.sort = function() {
      if (this.isEmpty()) {
        return this.toArray();
      } else {
        return stableSort(this.toArray())(function(x, y) {
          return x.compare(y).toInt;
        });
      }
    };

    AbstractAgentSet.prototype.sortOn = function(f) {
      return projectionSort(this.shufflerator().toArray())(f);
    };

    AbstractAgentSet.prototype.toArray = function() {
      this._items = this.iterator().toArray();
      return this._items.slice(0);
    };

    AbstractAgentSet.prototype.toString = function() {
      var ref, ref1;
      return (ref = (ref1 = this._specialName) != null ? ref1.toLowerCase() : void 0) != null ? ref : "(agentset, " + (this.size()) + " " + this._agentTypeName + ")";
    };

    AbstractAgentSet.prototype._findBestNOf = function(n, f, cStyleComparator) {
      var agentLists, appendAgent, ask, best, collectWinners, groupByValue, ref, valueToAgentsMap;
      ask = this._lazyGetSelfManager().askAgent(f);
      groupByValue = function(acc, agent) {
        var entry, result;
        result = ask(agent);
        if (NLType(result).isNumber()) {
          entry = acc[result];
          if (entry != null) {
            entry.push(agent);
          } else {
            acc[result] = [agent];
          }
        }
        return acc;
      };
      appendAgent = function(arg, agent) {
        var numAdded, winners;
        winners = arg[0], numAdded = arg[1];
        if (numAdded < n) {
          winners.push(agent);
          return [winners, numAdded + 1];
        } else {
          return [winners, numAdded];
        }
      };
      collectWinners = function(arg, agents) {
        var numAdded, winners;
        winners = arg[0], numAdded = arg[1];
        if (numAdded < n) {
          return _(agents).foldl(appendAgent, [winners, numAdded]);
        } else {
          return [winners, numAdded];
        }
      };
      valueToAgentsMap = this.shufflerator().toArray().reduce(groupByValue, {});
      agentLists = _(valueToAgentsMap).keys().map(parseFloat).value().sort(cStyleComparator).map(function(value) {
        return valueToAgentsMap[value];
      });
      ref = _(agentLists).foldl(collectWinners, [[], 0]), best = ref[0], ref[1];
      return this._generateFrom(best);
    };

    AbstractAgentSet.prototype._randomOneOf = function(agents) {
      if (agents.length === 0) {
        return Nobody;
      } else {
        return agents[this._lazyGetNextIntFunc()(agents.length)];
      }
    };

    AbstractAgentSet.prototype._findBestOf = function(worstPossible, findIsBetter, f) {
      var foldFunc, ref, winners;
      foldFunc = (function(_this) {
        return function(arg, agent) {
          var currentBest, currentWinners, result;
          currentBest = arg[0], currentWinners = arg[1];
          result = _this._lazyGetSelfManager().askAgent(f)(agent);
          if (result === currentBest) {
            currentWinners.push(agent);
            return [currentBest, currentWinners];
          } else if (NLType(result).isNumber() && findIsBetter(result, currentBest)) {
            return [result, [agent]];
          } else {
            return [currentBest, currentWinners];
          }
        };
      })(this);
      ref = this.foldl(foldFunc, [worstPossible, []]), ref[0], winners = ref[1];
      return winners;
    };

    AbstractAgentSet.prototype._findMaxesBy = function(f) {
      return this._findBestOf(-Infinity, (function(result, currentBest) {
        return result > currentBest;
      }), f);
    };

    AbstractAgentSet.prototype._findMinsBy = function(f) {
      return this._findBestOf(Infinity, (function(result, currentBest) {
        return result < currentBest;
      }), f);
    };

    AbstractAgentSet.prototype._generateFrom = function(newAgentArr) {
      return new this.constructor(newAgentArr);
    };

    AbstractAgentSet.prototype._lazyGetNextIntFunc = function() {
      if (this._nextInt != null) {
        return this._nextInt;
      } else if (this._lazyGetWorld() != null) {
        this._nextInt = this._lazyGetWorld().rng.nextInt;
        return this._nextInt;
      } else {
        return function() {
          throw new Error("How are you calling the RNG in an empty agentset?");
        };
      }
    };

    AbstractAgentSet.prototype._lazyGetSelfManager = function() {
      if (this._selfManager != null) {
        return this._selfManager;
      } else if (this._lazyGetWorld() != null) {
        this._selfManager = this._lazyGetWorld().selfManager;
        return this._selfManager;
      } else {
        return {
          askAgent: function() {
            return function() {
              return void 0;
            };
          },
          self: function() {
            return {
              id: void 0
            };
          }
        };
      }
    };

    AbstractAgentSet.prototype._lazyGetWorld = function() {
      if (this._world != null) {
        return this._world;
      } else if (this._items[0] != null) {
        this._world = this._items[0].world;
        return this._world;
      } else {
        return void 0;
      }
    };

    return AbstractAgentSet;

  })(Seq);

}).call(this);

},{"./agentset/atpoints":"engine/core/agentset/atpoints","./nobody":"engine/core/nobody","./projectionsort":"engine/core/projectionsort","./typechecker":"engine/core/typechecker","lodash":"lodash","util/exception":"util/exception","util/seq":"util/seq","util/shufflerator":"util/shufflerator","util/stablesort":"util/stablesort"}],"engine/core/agentset/atpoints":[function(require,module,exports){
(function() {
  var Dumper, NLType, Nobody, _, genPatchGrabber, getPatchesAtPoints;

  _ = require('lodash');

  Dumper = require('../../dump');

  Nobody = require('../nobody');

  NLType = require('../typechecker');

  genPatchGrabber = function(self, worldPatchAt) {
    if (self === 0) {
      return worldPatchAt;
    } else if (NLType(self).isTurtle() || NLType(self).isPatch()) {
      return self.patchAt;
    } else {
      return function() {
        return Nobody;
      };
    }
  };

  getPatchesAtPoints = function(patchAt, points) {
    var f;
    f = function(point) {
      if (NLType(point).isList() && point.length === 2 && NLType(point[0]).isNumber() && NLType(point[1]).isNumber()) {
        return patchAt.apply(null, point);
      } else {
        throw new Error("Invalid list of points: " + (Dumper(points)));
      }
    };
    return _(points).map(f).reject(function(x) {
      return x === Nobody;
    }).value();
  };

  module.exports = function(getSelf, getPatchAt) {
    return function(points) {
      var breedName, contains, newAgents, patchAt, patches, turtlesOnPatches, upperBreedName;
      contains = (function(_this) {
        return function(x) {
          return _this.contains(x);
        };
      })(this);
      breedName = this.getSpecialName();
      patchAt = genPatchGrabber(getSelf(), getPatchAt);
      patches = getPatchesAtPoints(patchAt, points);
      newAgents = NLType(this).isPatchSet() ? breedName === "patches" ? _(patches) : _(patches).filter(contains) : NLType(this).isTurtleSet() ? (turtlesOnPatches = _(patches).map(function(p) {
        return p.turtlesHere().toArray();
      }).flatten().uniq(), breedName === "turtles" ? turtlesOnPatches : breedName != null ? (upperBreedName = breedName.toUpperCase(), turtlesOnPatches.filter(function(x) {
        return upperBreedName === x.getBreedName();
      })) : turtlesOnPatches.filter(contains)) : [];
      return this.copyWithNewAgents(newAgents.uniq().value());
    };
  };

}).call(this);

},{"../../dump":"engine/dump","../nobody":"engine/core/nobody","../typechecker":"engine/core/typechecker","lodash":"lodash"}],"engine/core/agenttoint":[function(require,module,exports){
(function() {
  var NLType;

  NLType = require('./typechecker');

  module.exports = function(agent) {
    var type;
    type = NLType(agent);
    if (type.isTurtle()) {
      return 1;
    } else if (type.isPatch()) {
      return 2;
    } else if (type.isLink()) {
      return 3;
    } else {
      return 0;
    }
  };

}).call(this);

},{"./typechecker":"engine/core/typechecker"}],"engine/core/breedmanager":[function(require,module,exports){
(function() {
  var Breed, BreedManager, _, count, getNextOrdinal;

  _ = require('lodash');

  count = 0;

  getNextOrdinal = function() {
    return count++;
  };

  Breed = (function() {
    Breed.prototype.ordinal = void 0;

    function Breed(name1, singular, _manager, varNames, _isDirectedLinkBreed, _shape, members) {
      this.name = name1;
      this.singular = singular;
      this._manager = _manager;
      this.varNames = varNames != null ? varNames : [];
      this._isDirectedLinkBreed = _isDirectedLinkBreed;
      this._shape = _shape != null ? _shape : void 0;
      this.members = members != null ? members : [];
      this.ordinal = getNextOrdinal();
    }

    Breed.prototype.getShape = function() {
      var ref;
      return (ref = this._shape) != null ? ref : (this.isLinky() ? this._manager.links()._shape : this._manager.turtles()._shape);
    };

    Breed.prototype.setShape = function(newShape) {
      this._shape = newShape;
    };

    Breed.prototype.add = function(newAgent) {
      var howManyToThrowOut, whatToInsert;
      if (_(this.members).isEmpty() || _(this.members).last().id < newAgent.id) {
        this.members.push(newAgent);
      } else {
        this.members.splice(this._getAgentIndex(newAgent), howManyToThrowOut = 0, whatToInsert = newAgent);
      }
    };

    Breed.prototype.remove = function(agent) {
      var howManyToThrowOut;
      this.members.splice(this._getAgentIndex(agent), howManyToThrowOut = 1);
    };

    Breed.prototype.isLinky = function() {
      return this._isDirectedLinkBreed != null;
    };

    Breed.prototype.isUndirected = function() {
      return this._isDirectedLinkBreed === false;
    };

    Breed.prototype.isDirected = function() {
      return this._isDirectedLinkBreed === true;
    };

    Breed.prototype._getAgentIndex = function(agent) {
      return _(this.members).sortedIndex(agent, function(a) {
        return a.id;
      });
    };

    return Breed;

  })();

  module.exports = BreedManager = (function() {
    BreedManager.prototype._breeds = void 0;

    function BreedManager(breedObjs, turtlesOwns, linksOwns) {
      var defaultBreeds;
      if (turtlesOwns == null) {
        turtlesOwns = [];
      }
      if (linksOwns == null) {
        linksOwns = [];
      }
      defaultBreeds = {
        TURTLES: new Breed("TURTLES", "turtle", this, turtlesOwns, void 0, "default"),
        LINKS: new Breed("LINKS", "link", this, linksOwns, false, "default")
      };
      this._breeds = _(breedObjs).foldl((function(_this) {
        return function(acc, breedObj) {
          var ref, trueName, trueSingular, trueVarNames;
          trueName = breedObj.name.toUpperCase();
          trueSingular = breedObj.singular.toLowerCase();
          trueVarNames = (ref = breedObj.varNames) != null ? ref : [];
          acc[trueName] = new Breed(trueName, trueSingular, _this, trueVarNames, breedObj.isDirected);
          return acc;
        };
      })(this), defaultBreeds);
    }

    BreedManager.prototype.get = function(name) {
      return this._breeds[name.toUpperCase()];
    };

    BreedManager.prototype.setDefaultShape = function(breedName, shape) {
      this.get(breedName).setShape(shape.toLowerCase());
    };

    BreedManager.prototype.setUnbreededLinksUndirected = function() {
      this.links()._isDirectedLinkBreed = false;
    };

    BreedManager.prototype.setUnbreededLinksDirected = function() {
      this.links()._isDirectedLinkBreed = true;
    };

    BreedManager.prototype.turtles = function() {
      return this.get("TURTLES");
    };

    BreedManager.prototype.links = function() {
      return this.get("LINKS");
    };

    return BreedManager;

  })();

}).call(this);

},{"lodash":"lodash"}],"engine/core/colormodel":[function(require,module,exports){
(function() {
  var BaseColors, BaseRGBs, ColorMax, JSType, NLMath, NamesToIndicesMap, RGBCache, RGBMap, StrictMath, _, attenuate, attenuateRGB, componentsToKey, keyToComponents, ref;

  _ = require('lodash');

  NLMath = require('util/nlmath');

  JSType = require('util/typechecker');

  StrictMath = require('shim/strictmath');

  attenuate = function(lowerBound, upperBound) {
    return function(x) {
      if (x < lowerBound) {
        return lowerBound;
      } else if (x > upperBound) {
        return upperBound;
      } else {
        return x;
      }
    };
  };

  attenuateRGB = attenuate(0, 255);

  componentsToKey = function(r, g, b) {
    return r + "_" + g + "_" + b;
  };

  keyToComponents = function(key) {
    return key.split('_').map(parseFloat);
  };

  ColorMax = 140;

  BaseColors = _(0).range(ColorMax / 10).map(function(n) {
    return (n * 10) + 5;
  }).value();

  NamesToIndicesMap = (function() {
    var color, i, j, len, ref, temp;
    temp = {};
    ref = ['gray', 'red', 'orange', 'brown', 'yellow', 'green', 'lime', 'turqoise', 'cyan', 'sky', 'blue', 'violet', 'magenta', 'pink', 'black', 'white'];
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      color = ref[i];
      temp[color] = i;
    }
    return temp;
  })();

  BaseRGBs = [[140, 140, 140], [215, 48, 39], [241, 105, 19], [156, 109, 70], [237, 237, 47], [87, 176, 58], [42, 209, 57], [27, 158, 119], [82, 196, 196], [43, 140, 190], [50, 92, 168], [123, 78, 163], [166, 25, 105], [224, 126, 149], [0, 0, 0], [255, 255, 255]];

  ref = (function() {
    var baseIndex, clamp, colorTimesTen, finalRGB, rgb, rgbCache, rgbMap, step;
    rgbMap = {};
    rgbCache = (function() {
      var j, ref, results;
      results = [];
      for (colorTimesTen = j = 0, ref = ColorMax * 10; 0 <= ref ? j < ref : j > ref; colorTimesTen = 0 <= ref ? ++j : --j) {
        finalRGB = colorTimesTen === 0 ? [0, 0, 0] : colorTimesTen === 99 ? [255, 255, 255] : (baseIndex = StrictMath.floor(colorTimesTen / 100), rgb = BaseRGBs[baseIndex], step = (colorTimesTen % 100 - 50) / 50.48 + 0.012, clamp = step <= 0 ? function(x) {
          return x;
        } : function(x) {
          return 0xFF - x;
        }, rgb.map(function(x) {
          return x + StrictMath.truncate(clamp(x) * step);
        }));
        rgbMap[componentsToKey.apply(null, finalRGB)] = colorTimesTen / 10;
        results.push(finalRGB);
      }
      return results;
    })();
    return [rgbCache, rgbMap];
  })(), RGBCache = ref[0], RGBMap = ref[1];

  module.exports = {
    COLOR_MAX: ColorMax,
    BASE_COLORS: BaseColors,
    areRelatedByShade: function(color1, color2) {
      return this._colorIntegral(color1) === this._colorIntegral(color2);
    },
    colorToRGB: function(color) {
      var type;
      type = JSType(color);
      if (type.isNumber()) {
        return RGBCache[StrictMath.floor(color * 10)];
      } else if (type.isArray()) {
        return color.map(StrictMath.round);
      } else if (type.isString()) {
        return this._nameToRGB(color);
      } else {
        throw new Error("Unrecognized color format: " + color);
      }
    },
    colorToHSB: function(color) {
      var b, g, r, ref1;
      ref1 = this.colorToRGB(color), r = ref1[0], g = ref1[1], b = ref1[2];
      return this.rgbToHSB(r, g, b);
    },
    genRGBFromComponents: function(r, g, b) {
      return [r, g, b].map(attenuateRGB);
    },
    hsbToRGB: function(rawH, rawS, rawB) {
      var b, f, h, i, p, q, rgb, s, t;
      h = attenuate(0, 360)(rawH) / 360;
      s = attenuate(0, 100)(rawS) / 100;
      b = attenuate(0, 100)(rawB) / 100;
      i = StrictMath.floor(h * 6);
      f = h * 6 - i;
      p = b * (1 - s);
      q = b * (1 - f * s);
      t = b * (1 - (1 - f) * s);
      rgb = (function() {
        switch (i % 6) {
          case 0:
            return [b, t, p];
          case 1:
            return [q, b, p];
          case 2:
            return [p, b, t];
          case 3:
            return [p, q, b];
          case 4:
            return [t, p, b];
          case 5:
            return [b, p, q];
        }
      })();
      return rgb.map(function(x) {
        return StrictMath.round(x * 255);
      });
    },
    nearestColorNumberOfHSB: function(h, s, b) {
      return this.nearestColorNumberOfRGB.apply(this, this.hsbToRGB(h, s, b));
    },
    nearestColorNumberOfRGB: function(r, g, b) {
      var blue, colorNumber, green, red, ref1;
      red = attenuateRGB(r);
      green = attenuateRGB(g);
      blue = attenuateRGB(b);
      colorNumber = (ref1 = RGBMap[componentsToKey(red, green, blue)]) != null ? ref1 : this._estimateColorNumber(red, green, blue);
      return NLMath.validateNumber(colorNumber);
    },
    nthColor: function(n) {
      var index;
      index = n % BaseColors.length;
      return BaseColors[index];
    },
    randomColor: function(nextInt) {
      var index;
      index = nextInt(BaseColors.length);
      return BaseColors[index];
    },
    rgbToHSB: function(rawR, rawG, rawB) {
      var b, brightness, difference, g, hue, max, min, r, saturation;
      r = attenuateRGB(rawR);
      g = attenuateRGB(rawG);
      b = attenuateRGB(rawB);
      max = NLMath.max(r, g, b);
      min = NLMath.min(r, g, b);
      difference = max - min;
      hue = (function() {
        switch (max) {
          case min:
            return 0;
          case r:
            return ((g - b) + difference * (g < b ? 6 : 0)) / (6 * difference);
          case g:
            return ((b - r) + difference * 2) / (6 * difference);
          case b:
            return ((r - g) + difference * 4) / (6 * difference);
        }
      })();
      saturation = max === 0 ? 0 : difference / max;
      brightness = max / 255;
      return [hue * 360, saturation * 100, brightness * 100];
    },
    wrapColor: function(color) {
      var modColor;
      if (JSType(color).isArray()) {
        return color;
      } else {
        modColor = color % ColorMax;
        if (modColor >= 0) {
          return modColor;
        } else {
          return ColorMax + modColor;
        }
      }
    },
    scaleColor: function(color, number, min, max) {
      var finalPercent, percent, percent10, tempmax, tempval;
      percent = min > max ? number < max ? 1.0 : number > min ? 0.0 : (tempval = min - number, tempmax = min - max, tempval / tempmax) : number > max ? 1.0 : number < min ? 0.0 : (tempval = number - min, tempmax = max - min, tempval / tempmax);
      percent10 = percent * 10;
      finalPercent = percent10 >= 9.9999 ? 9.9999 : percent10 < 0 ? 0 : percent10;
      return this._colorIntegral(color) * 10 + finalPercent;
    },
    _colorIntegral: function(color) {
      return StrictMath.floor(color / 10);
    },
    _nameToRGB: function(name) {
      return BaseRGBs[NamesToIndicesMap[name]];
    },
    _estimateColorNumber: function(r, g, b) {
      var f;
      f = (function(_this) {
        return function(acc, arg) {
          var cb, cg, cr, dist, k, ref1, v;
          k = arg[0], v = arg[1];
          ref1 = keyToComponents(k), cr = ref1[0], cg = ref1[1], cb = ref1[2];
          dist = _this._colorDistance(r, g, b, cr, cg, cb);
          if (dist < acc[1]) {
            return [v, dist];
          } else {
            return acc;
          }
        };
      })(this);
      return _(RGBMap).pairs().foldl(f, [0, Number.MAX_VALUE])[0];
    },
    _colorDistance: function(r1, g1, b1, r2, g2, b2) {
      var bDiff, gDiff, rDiff, rMean;
      rMean = r1 + r2 / 2;
      rDiff = r1 - r2;
      gDiff = g1 - g2;
      bDiff = b1 - b2;
      return (((512 + rMean) * rDiff * rDiff) >> 8) + 4 * gDiff * gDiff + (((767 - rMean) * bDiff * bDiff) >> 8);
    }
  };

}).call(this);

},{"lodash":"lodash","shim/strictmath":"shim/strictmath","util/nlmath":"util/nlmath","util/typechecker":"util/typechecker"}],"engine/core/link/linkvariables":[function(require,module,exports){
(function() {
  var ColorModel, ImmutableVariableSpec, MutableVariableSpec, NLType, Setters, VariableSpecs, ref, setBreed, setColor, setEnd1, setEnd2, setIsHidden, setLabel, setLabelColor, setShape, setThickness, setTieMode;

  ColorModel = require('engine/core/colormodel');

  NLType = require('../typechecker');

  ref = require('../structure/variablespec'), ImmutableVariableSpec = ref.ImmutableVariableSpec, MutableVariableSpec = ref.MutableVariableSpec;

  setShape = function(shape) {
    this._shape = shape.toLowerCase();
    this._genVarUpdate("shape");
  };

  setBreed = function(breed) {
    var newNames, oldNames, ref1, specialName, trueBreed, type;
    type = NLType(breed);
    trueBreed = (function() {
      if (type.isString()) {
        return this.world.breedManager.get(breed);
      } else if (type.isAgentSet()) {
        specialName = breed.getSpecialName();
        if (specialName != null) {
          return this.world.breedManager.get(specialName);
        } else {
          throw new Error("You can't set BREED to a non-breed agentset.");
        }
      } else {
        return breed;
      }
    }).call(this);
    if (this._breed !== trueBreed) {
      trueBreed.add(this);
      if ((ref1 = this._breed) != null) {
        ref1.remove(this);
      }
      newNames = this._varNamesForBreed(trueBreed);
      oldNames = this._varNamesForBreed(this._breed);
      this._varManager.refineBy(oldNames, newNames);
    }
    this._breed = trueBreed;
    this._genVarUpdate("breed");
    setShape.call(this, trueBreed.getShape());
    if (trueBreed !== this.world.breedManager.links()) {
      this.world.breedManager.links().add(this);
    }
  };

  setColor = function(color) {
    this._color = ColorModel.wrapColor(color);
    this._genVarUpdate("color");
  };

  setEnd1 = function(turtle) {
    this.end1 = turtle;
    this._genVarUpdate("end1");
  };

  setEnd2 = function(turtle) {
    this.end2 = turtle;
    this._genVarUpdate("end2");
  };

  setIsHidden = function(isHidden) {
    this._isHidden = isHidden;
    this._genVarUpdate("hidden?");
  };

  setLabel = function(label) {
    this._label = label;
    this._genVarUpdate("label");
  };

  setLabelColor = function(color) {
    this._labelcolor = ColorModel.wrapColor(color);
    this._genVarUpdate("label-color");
  };

  setThickness = function(thickness) {
    this._thickness = thickness;
    this._genVarUpdate("thickness");
  };

  setTieMode = function(mode) {
    this.tiemode = mode;
    this._genVarUpdate("tie-mode");
  };

  Setters = {
    setBreed: setBreed,
    setColor: setColor,
    setEnd1: setEnd1,
    setEnd2: setEnd2,
    setIsHidden: setIsHidden,
    setLabel: setLabel,
    setLabelColor: setLabelColor,
    setShape: setShape,
    setThickness: setThickness,
    setTieMode: setTieMode
  };

  VariableSpecs = [
    new MutableVariableSpec('breed', (function() {
      return this._getLinksByBreedName(this._breed.name);
    }), setBreed), new MutableVariableSpec('color', (function() {
      return this._color;
    }), setColor), new MutableVariableSpec('end1', (function() {
      return this.end1;
    }), setEnd1), new MutableVariableSpec('end2', (function() {
      return this.end2;
    }), setEnd2), new MutableVariableSpec('hidden?', (function() {
      return this._isHidden;
    }), setIsHidden), new MutableVariableSpec('label', (function() {
      return this._label;
    }), setLabel), new MutableVariableSpec('label-color', (function() {
      return this._labelcolor;
    }), setLabelColor), new MutableVariableSpec('shape', (function() {
      return this._shape;
    }), setShape), new MutableVariableSpec('thickness', (function() {
      return this._thickness;
    }), setThickness), new MutableVariableSpec('tie-mode', (function() {
      return this.tiemode;
    }), setTieMode)
  ];

  module.exports = {
    Setters: Setters,
    VariableSpecs: VariableSpecs
  };

}).call(this);

},{"../structure/variablespec":"engine/core/structure/variablespec","../typechecker":"engine/core/typechecker","engine/core/colormodel":"engine/core/colormodel"}],"engine/core/linkset":[function(require,module,exports){
(function() {
  var AbstractAgentSet, DeadSkippingIterator, JSType, LinkSet,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  AbstractAgentSet = require('./abstractagentset');

  DeadSkippingIterator = require('./structure/deadskippingiterator');

  JSType = require('util/typechecker');

  module.exports = LinkSet = (function(superClass) {
    extend(LinkSet, superClass);

    function LinkSet(_agents, specialName) {
      this._agents = _agents;
      LinkSet.__super__.constructor.call(this, this._unwrap(this._agents), "links", specialName);
    }

    LinkSet.prototype.iterator = function() {
      return new DeadSkippingIterator(this._unwrap(this._agents));
    };

    LinkSet.prototype._unwrap = function(agents) {
      if (JSType(agents).isFunction()) {
        return agents();
      } else {
        return agents.slice(0);
      }
    };

    return LinkSet;

  })(AbstractAgentSet);

}).call(this);

},{"./abstractagentset":"engine/core/abstractagentset","./structure/deadskippingiterator":"engine/core/structure/deadskippingiterator","util/typechecker":"util/typechecker"}],"engine/core/link":[function(require,module,exports){
(function() {
  var AbstractAgentSet, AgentException, ColorModel, Death, EQ, ExtraVariableSpec, GT, LT, Link, Setters, Stamp, StampErase, StampMode, TurtleSet, VariableManager, VariableSpecs, _, linkCompare, ref, ref1, ref2;

  _ = require('lodash');

  AbstractAgentSet = require('./abstractagentset');

  ColorModel = require('./colormodel');

  linkCompare = require('./structure/linkcompare');

  VariableManager = require('./structure/variablemanager');

  TurtleSet = require('./turtleset');

  ref = require('util/comparator'), EQ = ref.EQUALS, GT = ref.GREATER_THAN, LT = ref.LESS_THAN;

  ref1 = require('util/exception'), AgentException = ref1.AgentException, Death = ref1.DeathInterrupt;

  ref2 = require('./link/linkvariables'), Setters = ref2.Setters, VariableSpecs = ref2.VariableSpecs;

  ExtraVariableSpec = require('./structure/variablespec').ExtraVariableSpec;

  StampMode = (function() {
    function StampMode(name1) {
      this.name = name1;
    }

    return StampMode;

  })();

  Stamp = new StampMode("normal");

  StampErase = new StampMode("erase");

  module.exports = Link = (function() {
    Link.prototype._breed = void 0;

    Link.prototype._updateVarsByName = void 0;

    Link.prototype._varManager = void 0;

    function Link(id, isDirected, end1, end2, world, genUpdate, _registerDeath, _registerRemoval, _registerLinkStamp, _getLinksByBreedName, breed, _color, _isHidden, _label, _labelcolor, _shape, _thickness, tiemode) {
      var varNames;
      this.id = id;
      this.isDirected = isDirected;
      this.end1 = end1;
      this.end2 = end2;
      this.world = world;
      this._registerDeath = _registerDeath;
      this._registerRemoval = _registerRemoval;
      this._registerLinkStamp = _registerLinkStamp;
      this._getLinksByBreedName = _getLinksByBreedName;
      if (breed == null) {
        breed = this.world.breedManager.links();
      }
      this._color = _color != null ? _color : 5;
      this._isHidden = _isHidden != null ? _isHidden : false;
      this._label = _label != null ? _label : "";
      this._labelcolor = _labelcolor != null ? _labelcolor : 9.9;
      this._shape = _shape != null ? _shape : "default";
      this._thickness = _thickness != null ? _thickness : 0;
      this.tiemode = tiemode != null ? tiemode : "none";
      this._updateVarsByName = genUpdate(this);
      varNames = this._varNamesForBreed(breed);
      this._varManager = this._genVarManager(varNames);
      Setters.setBreed.call(this, breed);
      this.end1.linkManager.add(this);
      this.end2.linkManager.add(this);
      this.updateEndRelatedVars();
      this._updateVarsByName("directed?");
    }

    Link.prototype.getBreedName = function() {
      return this._breed.name;
    };

    Link.prototype.getBreedOrdinal = function() {
      return this._breed.ordinal;
    };

    Link.prototype.getVariable = function(varName) {
      return this._varManager[varName];
    };

    Link.prototype.setVariable = function(varName, value) {
      this._varManager[varName] = value;
    };

    Link.prototype.die = function() {
      this._breed.remove(this);
      if (!this.isDead()) {
        this.end1.linkManager.remove(this);
        this.end2.linkManager.remove(this);
        this._registerRemoval(this);
        this._seppuku();
        this.id = -1;
      }
      throw new Death("Call only from inside an askAgent block");
    };

    Link.prototype.stamp = function() {
      this._drawStamp(Stamp);
    };

    Link.prototype.stampErase = function() {
      this._drawStamp(StampErase);
    };

    Link.prototype.bothEnds = function() {
      return new TurtleSet([this.end1, this.end2]);
    };

    Link.prototype.otherEnd = function() {
      if (this.end1 === this.world.selfManager.myself()) {
        return this.end2;
      } else {
        return this.end1;
      }
    };

    Link.prototype.tie = function() {
      Setters.setTieMode.call(this, "fixed");
    };

    Link.prototype.untie = function() {
      Setters.setTieMode.call(this, "none");
    };

    Link.prototype.updateEndRelatedVars = function() {
      this._updateVarsByName("heading", "size", "midpointx", "midpointy");
    };

    Link.prototype.toString = function() {
      if (!this.isDead()) {
        return "(" + this._breed.singular + " " + this.end1.id + " " + this.end2.id + ")";
      } else {
        return "nobody";
      }
    };

    Link.prototype.getHeading = function() {
      var error, error1;
      try {
        return this.world.topology.towards(this.end1.xcor, this.end1.ycor, this.end2.xcor, this.end2.ycor);
      } catch (error1) {
        error = error1;
        if (error instanceof AgentException) {
          throw new Error("there is no heading of a link whose endpoints are in the same position");
        } else {
          throw error;
        }
      }
    };

    Link.prototype.getMidpointX = function() {
      return this.world.topology.midpointx(this.end1.xcor, this.end2.xcor);
    };

    Link.prototype.getMidpointY = function() {
      return this.world.topology.midpointy(this.end1.ycor, this.end2.ycor);
    };

    Link.prototype.getSize = function() {
      return this.world.topology.distanceXY(this.end1.xcor, this.end1.ycor, this.end2.xcor, this.end2.ycor);
    };

    Link.prototype.isDead = function() {
      return this.id === -1;
    };

    Link.prototype.ask = function(f) {
      var base;
      this.world.selfManager.askAgent(f)(this);
      if (typeof (base = this.world.selfManager.self()).isDead === "function" ? base.isDead() : void 0) {
        throw new Death;
      }
    };

    Link.prototype.projectionBy = function(f) {
      if (!this.isDead()) {
        return this.world.selfManager.askAgent(f)(this);
      } else {
        throw new Error("That " + this._breed.singular + " is dead.");
      }
    };

    Link.prototype.compare = function(x) {
      switch (linkCompare(this, x)) {
        case -1:
          return LT;
        case 0:
          return EQ;
        case 1:
          return GT;
        default:
          throw new Error("Comparison should only yield an integer within the interval [-1,1]");
      }
    };

    Link.prototype.varNames = function() {
      return this._varManager.names();
    };

    Link.prototype._drawStamp = function(mode) {
      var color, e1x, e1y, e2x, e2y, error, midX, midY, ref3, ref4, stampHeading;
      ref3 = this.end1, e1x = ref3.xcor, e1y = ref3.ycor;
      ref4 = this.end2, e2x = ref4.xcor, e2y = ref4.ycor;
      stampHeading = (function() {
        var error1;
        try {
          return this.world.topology.towards(e1x, e1y, e2x, e2y);
        } catch (error1) {
          error = error1;
          if (error instanceof AgentException) {
            return 0;
          } else {
            throw error;
          }
        }
      }).call(this);
      color = ColorModel.colorToRGB(this._color);
      midX = this.getMidpointX();
      midY = this.getMidpointY();
      this._registerLinkStamp(e1x, e1y, e2x, e2y, midX, midY, stampHeading, color, this._shape, this._thickness, this.isDirected, this.getSize(), this._isHidden, mode.name);
    };

    Link.prototype._varNamesForBreed = function(breed) {
      var linksBreed;
      linksBreed = this.world.breedManager.links();
      if (breed === linksBreed || (breed == null)) {
        return linksBreed.varNames;
      } else {
        return linksBreed.varNames.concat(breed.varNames);
      }
    };

    Link.prototype._seppuku = function() {
      this._registerDeath(this.id);
    };

    Link.prototype._genVarManager = function(extraVarNames) {
      var allSpecs, extraSpecs;
      extraSpecs = extraVarNames.map(function(name) {
        return new ExtraVariableSpec(name);
      });
      allSpecs = VariableSpecs.concat(extraSpecs);
      return new VariableManager(this, allSpecs);
    };

    Link.prototype._genVarUpdate = function(varName) {
      this._updateVarsByName(varName);
    };

    return Link;

  })();

}).call(this);

},{"./abstractagentset":"engine/core/abstractagentset","./colormodel":"engine/core/colormodel","./link/linkvariables":"engine/core/link/linkvariables","./structure/linkcompare":"engine/core/structure/linkcompare","./structure/variablemanager":"engine/core/structure/variablemanager","./structure/variablespec":"engine/core/structure/variablespec","./turtleset":"engine/core/turtleset","lodash":"lodash","util/comparator":"util/comparator","util/exception":"util/exception"}],"engine/core/nobody":[function(require,module,exports){

/*
  Inclusion of `ask` is inspired by the fact that, since a primitive like `create-link-with` can
  return `nobody`, and it can also take an initialization block for the to-be-created thing, either
  the init block must be branched against or `nobody` must ignore it  --JAB (7/18/14)
 */

(function() {
  module.exports = {
    ask: function() {},
    id: -1,
    isDead: function() {
      return true;
    },
    toString: function() {
      return "nobody";
    }
  };

}).call(this);

},{}],"engine/core/observer":[function(require,module,exports){
(function() {
  var ExtraVariableSpec, Follow, NLType, Nobody, Observe, Observer, Ride, VariableManager, Watch, _, agentToInt;

  Observe = {
    toInt: 0
  };

  Ride = {
    toInt: 1
  };

  Follow = {
    toInt: 2
  };

  Watch = {
    toInt: 3
  };

  _ = require('lodash');

  agentToInt = require('./agenttoint');

  Nobody = require('./nobody');

  NLType = require('./typechecker');

  VariableManager = require('./structure/variablemanager');

  ExtraVariableSpec = require('./structure/variablespec').ExtraVariableSpec;

  module.exports = Observer = (function() {
    Observer.prototype.id = 0;

    Observer.prototype._varManager = void 0;

    Observer.prototype._perspective = void 0;

    Observer.prototype._targetAgent = void 0;

    Observer.prototype._codeGlobalNames = void 0;

    Observer.prototype._updateVarsByName = void 0;

    function Observer(genUpdate, _globalNames, _interfaceGlobalNames) {
      var globalSpecs;
      this._globalNames = _globalNames;
      this._interfaceGlobalNames = _interfaceGlobalNames;
      this._updateVarsByName = genUpdate(this);
      this.resetPerspective();
      globalSpecs = this._globalNames.map(function(name) {
        return new ExtraVariableSpec(name);
      });
      this._varManager = new VariableManager(this, globalSpecs);
      this._codeGlobalNames = _(this._globalNames).difference(this._interfaceGlobalNames).value();
    }

    Observer.prototype.clearCodeGlobals = function() {
      _(this._codeGlobalNames).forEach((function(_this) {
        return function(name) {
          _this._varManager[name] = 0;
        };
      })(this)).value();
    };

    Observer.prototype.follow = function(turtle) {
      this._perspective = Follow;
      this._targetAgent = turtle;
      this._updatePerspective();
    };

    Observer.prototype.getGlobal = function(varName) {
      return this._varManager[varName];
    };

    Observer.prototype.resetPerspective = function() {
      this._perspective = Observe;
      this._targetAgent = null;
      this._updatePerspective();
    };

    Observer.prototype.ride = function(turtle) {
      this._perspective = Ride;
      this._targetAgent = turtle;
      this._updatePerspective();
    };

    Observer.prototype.setGlobal = function(varName, value) {
      this._varManager[varName] = value;
    };

    Observer.prototype.subject = function() {
      var ref;
      return (ref = this._targetAgent) != null ? ref : Nobody;
    };

    Observer.prototype.unfocus = function(turtle) {
      if (this._targetAgent === turtle) {
        this.resetPerspective();
      }
    };

    Observer.prototype.varNames = function() {
      return this._varManager.names();
    };

    Observer.prototype.watch = function(agent) {
      var type;
      type = NLType(agent);
      this._perspective = Watch;
      this._targetAgent = type.isTurtle() || type.isPatch() ? agent : Nobody;
      this._updatePerspective();
    };

    Observer.prototype._updatePerspective = function() {
      this._updateVarsByName("perspective", "targetAgent");
    };

    Observer.prototype._getTargetAgentUpdate = function() {
      if (this._targetAgent != null) {
        return [agentToInt(this._targetAgent), this._targetAgent.id];
      } else {
        return null;
      }
    };

    return Observer;

  })();

}).call(this);

},{"./agenttoint":"engine/core/agenttoint","./nobody":"engine/core/nobody","./structure/variablemanager":"engine/core/structure/variablemanager","./structure/variablespec":"engine/core/structure/variablespec","./typechecker":"engine/core/typechecker","lodash":"lodash"}],"engine/core/patch/patchvariables":[function(require,module,exports){
(function() {
  var ColorModel, ImmutableVariableSpec, MutableVariableSpec, Setters, VariableSpecs, ref, setPcolor, setPlabel, setPlabelColor;

  ColorModel = require('engine/core/colormodel');

  ref = require('../structure/variablespec'), ImmutableVariableSpec = ref.ImmutableVariableSpec, MutableVariableSpec = ref.MutableVariableSpec;

  setPcolor = function(color) {
    var wrappedColor;
    wrappedColor = ColorModel.wrapColor(color);
    if (this._pcolor !== wrappedColor) {
      this._pcolor = wrappedColor;
      this._genVarUpdate("pcolor");
      if (wrappedColor !== 0) {
        this._declareNonBlackPatch();
      }
    }
  };

  setPlabel = function(label) {
    var isEmpty, wasEmpty;
    wasEmpty = this._plabel === "";
    isEmpty = label === "";
    this._plabel = label;
    this._genVarUpdate("plabel");
    if (isEmpty && !wasEmpty) {
      this._decrementPatchLabelCount();
    } else if (!isEmpty && wasEmpty) {
      this._incrementPatchLabelCount();
    }
  };

  setPlabelColor = function(color) {
    this._plabelcolor = ColorModel.wrapColor(color);
    this._genVarUpdate("plabel-color");
  };

  Setters = {
    setPcolor: setPcolor,
    setPlabel: setPlabel,
    setPlabelColor: setPlabelColor
  };

  VariableSpecs = [
    new ImmutableVariableSpec('pxcor', function() {
      return this.pxcor;
    }), new ImmutableVariableSpec('pycor', function() {
      return this.pycor;
    }), new MutableVariableSpec('pcolor', (function() {
      return this._pcolor;
    }), setPcolor), new MutableVariableSpec('plabel', (function() {
      return this._plabel;
    }), setPlabel), new MutableVariableSpec('plabel-color', (function() {
      return this._plabelcolor;
    }), setPlabelColor)
  ];

  module.exports = {
    Setters: Setters,
    VariableSpecs: VariableSpecs
  };

}).call(this);

},{"../structure/variablespec":"engine/core/structure/variablespec","engine/core/colormodel":"engine/core/colormodel"}],"engine/core/patchset":[function(require,module,exports){
(function() {
  var AbstractAgentSet, Iterator, PatchSet,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  AbstractAgentSet = require('./abstractagentset');

  Iterator = require('util/iterator');

  module.exports = PatchSet = (function(superClass) {
    extend(PatchSet, superClass);

    function PatchSet(agents, specialName) {
      PatchSet.__super__.constructor.call(this, agents, "patches", specialName);
    }

    return PatchSet;

  })(AbstractAgentSet);

}).call(this);

},{"./abstractagentset":"engine/core/abstractagentset","util/iterator":"util/iterator"}],"engine/core/patch":[function(require,module,exports){
(function() {
  var Comparator, Death, ExtraVariableSpec, Nobody, Patch, Setters, TopologyInterrupt, TurtleSet, VariableManager, VariableSpecs, _, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('lodash');

  Nobody = require('./nobody');

  TurtleSet = require('./turtleset');

  VariableManager = require('./structure/variablemanager');

  Comparator = require('util/comparator');

  ref = require('util/exception'), Death = ref.DeathInterrupt, TopologyInterrupt = ref.TopologyInterrupt;

  ref1 = require('./patch/patchvariables'), Setters = ref1.Setters, VariableSpecs = ref1.VariableSpecs;

  ExtraVariableSpec = require('./structure/variablespec').ExtraVariableSpec;

  module.exports = Patch = (function() {
    Patch.prototype._varManager = void 0;

    Patch.prototype._turtles = void 0;

    function Patch(id, pxcor, pycor, world, _genUpdate, _declareNonBlackPatch, _decrementPatchLabelCount, _incrementPatchLabelCount, _pcolor, _plabel, _plabelcolor) {
      this.id = id;
      this.pxcor = pxcor;
      this.pycor = pycor;
      this.world = world;
      this._genUpdate = _genUpdate;
      this._declareNonBlackPatch = _declareNonBlackPatch;
      this._decrementPatchLabelCount = _decrementPatchLabelCount;
      this._incrementPatchLabelCount = _incrementPatchLabelCount;
      this._pcolor = _pcolor != null ? _pcolor : 0.0;
      this._plabel = _plabel != null ? _plabel : "";
      this._plabelcolor = _plabelcolor != null ? _plabelcolor : 9.9;
      this.patchAt = bind(this.patchAt, this);
      this._turtles = [];
      this._varManager = this._genVarManager(this.world.patchesOwnNames);
    }

    Patch.prototype.getVariable = function(varName) {
      return this._varManager[varName];
    };

    Patch.prototype.setVariable = function(varName, value) {
      this._varManager[varName] = value;
    };

    Patch.prototype.getPatchVariable = function(varName) {
      return this._varManager[varName];
    };

    Patch.prototype.setPatchVariable = function(varName, value) {
      this._varManager[varName] = value;
    };

    Patch.prototype.untrackTurtle = function(turtle) {
      this._turtles.splice(this._turtles.indexOf(turtle, 0), 1);
    };

    Patch.prototype.trackTurtle = function(turtle) {
      this._turtles.push(turtle);
    };

    Patch.prototype.getCoords = function() {
      return [this.pxcor, this.pycor];
    };

    Patch.prototype.distance = function(agent) {
      return this.world.topology.distance(this.pxcor, this.pycor, agent);
    };

    Patch.prototype.distanceXY = function(x, y) {
      return this.world.topology.distanceXY(this.pxcor, this.pycor, x, y);
    };

    Patch.prototype.towardsXY = function(x, y) {
      return this.world.topology.towards(this.pxcor, this.pycor, x, y);
    };

    Patch.prototype.turtlesHere = function() {
      return new TurtleSet(this._turtles.slice(0));
    };

    Patch.prototype.ask = function(f) {
      var base;
      this.world.selfManager.askAgent(f)(this);
      if (typeof (base = this.world.selfManager.self()).isDead === "function" ? base.isDead() : void 0) {
        throw new Death;
      }
    };

    Patch.prototype.projectionBy = function(f) {
      return this.world.selfManager.askAgent(f)(this);
    };

    Patch.prototype.getNeighbors = function() {
      return this.world.getNeighbors(this.pxcor, this.pycor);
    };

    Patch.prototype.getNeighbors4 = function() {
      return this.world.getNeighbors4(this.pxcor, this.pycor);
    };

    Patch.prototype.sprout = function(n, breedName) {
      return this.world.turtleManager.createTurtles(n, breedName, this.pxcor, this.pycor);
    };

    Patch.prototype.breedHere = function(breedName) {
      return new TurtleSet(this.breedHereArray(breedName));
    };

    Patch.prototype.breedHereArray = function(breedName) {
      return _(this._turtles).filter(function(turtle) {
        return turtle.getBreedName() === breedName;
      }).value();
    };

    Patch.prototype.turtlesAt = function(dx, dy) {
      return this.patchAt(dx, dy).turtlesHere();
    };

    Patch.prototype.breedAt = function(breedName, dx, dy) {
      return this.patchAt(dx, dy).breedHere(breedName);
    };

    Patch.prototype.patchAt = function(dx, dy) {
      return this.patchAtCoords(this.pxcor + dx, this.pycor + dy);
    };

    Patch.prototype.patchAtCoords = function(x, y) {
      return this.world.patchAtCoords(x, y);
    };

    Patch.prototype.patchAtHeadingAndDistance = function(angle, distance) {
      return this.world.patchAtHeadingAndDistanceFrom(angle, distance, this.pxcor, this.pycor);
    };

    Patch.prototype.watchMe = function() {
      this.world.observer.watch(this);
    };

    Patch.prototype.inRadius = function(agents, radius) {
      return this.world.topology.inRadius(this.pxcor, this.pycor, agents, radius);
    };

    Patch.prototype.compare = function(x) {
      return Comparator.numericCompare(this.id, x.id);
    };

    Patch.prototype.toString = function() {
      return "(patch " + this.pxcor + " " + this.pycor + ")";
    };

    Patch.prototype.reset = function() {
      this._varManager = this._genVarManager(this.world.patchesOwnNames);
      Setters.setPcolor.call(this, 0);
      Setters.setPlabel.call(this, '');
      Setters.setPlabelColor.call(this, 9.9);
    };

    Patch.prototype.varNames = function() {
      return this._varManager.names();
    };

    Patch.prototype._genVarManager = function(extraVarNames) {
      var allSpecs, extraSpecs;
      extraSpecs = extraVarNames.map(function(name) {
        return new ExtraVariableSpec(name);
      });
      allSpecs = VariableSpecs.concat(extraSpecs);
      return new VariableManager(this, allSpecs);
    };

    Patch.prototype._genVarUpdate = function(varName) {
      this._genUpdate(this)(varName);
    };

    return Patch;

  })();

}).call(this);

},{"./nobody":"engine/core/nobody","./patch/patchvariables":"engine/core/patch/patchvariables","./structure/variablemanager":"engine/core/structure/variablemanager","./structure/variablespec":"engine/core/structure/variablespec","./turtleset":"engine/core/turtleset","lodash":"lodash","util/comparator":"util/comparator","util/exception":"util/exception"}],"engine/core/projectionsort":[function(require,module,exports){
(function() {
  var AgentKey, Comparator, NLType, NumberKey, OtherKey, StringKey, _, initializeDictionary, stableSort;

  _ = require('lodash');

  NLType = require('./typechecker');

  Comparator = require('util/comparator');

  stableSort = require('util/stablesort');

  NumberKey = "number";

  StringKey = "string";

  AgentKey = "agent";

  OtherKey = "other";

  initializeDictionary = function(keys, generator) {
    var f;
    f = function(acc, key) {
      acc[key] = generator(key);
      return acc;
    };
    return _(keys).foldl(f, {});
  };

  module.exports = function(agents) {
    return function(f) {
      var baseAcc, mapBuildFunc, pairs, ref, sortingFunc, typeName, typeNameToPairsMap, typesInMap;
      if (agents.length < 2) {
        return agents;
      } else {
        mapBuildFunc = function(acc, agent) {
          var key, pair, type, value;
          value = agent.projectionBy(f);
          pair = [agent, value];
          type = NLType(value);
          key = type.isNumber() ? NumberKey : type.isString() ? StringKey : type.isAgent() ? AgentKey : OtherKey;
          acc[key].push(pair);
          return acc;
        };
        baseAcc = initializeDictionary([NumberKey, StringKey, AgentKey, OtherKey], function() {
          return [];
        });
        typeNameToPairsMap = _(agents).foldl(mapBuildFunc, baseAcc);
        typesInMap = _(typeNameToPairsMap).omit(_.isEmpty).keys().value();
        ref = (function() {
          switch (typesInMap.join(" ")) {
            case NumberKey:
              return [
                NumberKey, function(arg, arg1) {
                  var n1, n2;
                  arg[0], n1 = arg[1];
                  arg1[0], n2 = arg1[1];
                  return Comparator.numericCompare(n1, n2).toInt;
                }
              ];
            case StringKey:
              return [
                StringKey, function(arg, arg1) {
                  var s1, s2;
                  arg[0], s1 = arg[1];
                  arg1[0], s2 = arg1[1];
                  return Comparator.stringCompare(s1, s2).toInt;
                }
              ];
            case AgentKey:
              return [
                AgentKey, function(arg, arg1) {
                  var a1, a2;
                  arg[0], a1 = arg[1];
                  arg1[0], a2 = arg1[1];
                  return a1.compare(a2).toInt;
                }
              ];
            default:
              throw new Error("SORT-ON works on numbers, strings, or agents of the same type.");
          }
        })(), typeName = ref[0], sortingFunc = ref[1];
        pairs = typeNameToPairsMap[typeName];
        return stableSort(pairs)(sortingFunc).map(function(arg) {
          var x;
          x = arg[0], arg[1];
          return x;
        });
      }
    };
  };

}).call(this);

},{"./typechecker":"engine/core/typechecker","lodash":"lodash","util/comparator":"util/comparator","util/stablesort":"util/stablesort"}],"engine/core/structure/builtins":[function(require,module,exports){
(function() {
  module.exports = {
    turtleBuiltins: ["id", "color", "heading", "xcor", "ycor", "shape", "label", "label-color", "breed", "hidden?", "size", "pen-size", "pen-mode"],
    patchBuiltins: ["pxcor", "pycor", "pcolor", "plabel", "plabel-color"],
    linkBuiltins: ["end1", "end2", "lcolor", "llabel", "llabelcolor", "lhidden", "lbreed", "thickness", "lshape", "tie-mode"],
    linkExtras: ["color", "heading", "shape", "label", "label-color", "breed", "hidden?", "size", "midpointx", "midpointy"]
  };

}).call(this);

},{}],"engine/core/structure/deadskippingiterator":[function(require,module,exports){
(function() {
  var DeadSkippingIterator, Iterator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Iterator = require('util/iterator');

  module.exports = DeadSkippingIterator = (function(superClass) {
    extend(DeadSkippingIterator, superClass);

    DeadSkippingIterator.prototype._i = void 0;

    function DeadSkippingIterator(items) {
      DeadSkippingIterator.__super__.constructor.call(this, items);
      this._i = 0;
    }

    DeadSkippingIterator.prototype.map = function(f) {
      var acc;
      acc = [];
      while (this._hasNext()) {
        acc.push(f(this._next()));
      }
      return acc;
    };

    DeadSkippingIterator.prototype.forEach = function(f) {
      while (this._hasNext()) {
        f(this._next());
      }
    };

    DeadSkippingIterator.prototype.toArray = function() {
      var acc;
      acc = [];
      while (this._hasNext()) {
        acc.push(this._next());
      }
      return acc;
    };

    DeadSkippingIterator.prototype._hasNext = function() {
      this._skipToNext();
      return this._isntEmpty();
    };

    DeadSkippingIterator.prototype._next = function() {
      this._skipToNext();
      return this._items[this._i++];
    };

    DeadSkippingIterator.prototype._skipToNext = function() {
      while (this._isntEmpty() && this._items[this._i].isDead()) {
        this._i++;
      }
    };

    DeadSkippingIterator.prototype._isntEmpty = function() {
      return this._i < this._items.length;
    };

    return DeadSkippingIterator;

  })(Iterator);

}).call(this);

},{"util/iterator":"util/iterator"}],"engine/core/structure/linkcompare":[function(require,module,exports){
(function() {
  module.exports = function(a, b) {
    if (a === b) {
      return 0;
    } else if (a.isDead() && b.isDead()) {
      return 0;
    } else if (a.end1.id < b.end1.id) {
      return -1;
    } else if (a.end1.id > b.end1.id) {
      return 1;
    } else if (a.end2.id < b.end2.id) {
      return -1;
    } else if (a.end2.id > b.end2.id) {
      return 1;
    } else if (a.getBreedName() === b.getBreedName()) {
      return 0;
    } else if (a.getBreedName() === "LINKS") {
      return -1;
    } else if (b.getBreedName() === "LINKS") {
      return 1;
    } else if (a.getBreedOrdinal() < b.getBreedOrdinal()) {
      return -1;
    } else if (a.getBreedOrdinal() > b.getBreedOrdinal()) {
      return 1;
    } else {
      return 0;
    }
  };

}).call(this);

},{}],"engine/core/structure/penmanager":[function(require,module,exports){
(function() {
  var Down, Erase, PenManager, PenStatus, Up;

  PenStatus = (function() {
    function PenStatus(_name) {
      this._name = _name;
    }

    PenStatus.prototype.toString = function() {
      return this._name;
    };

    return PenStatus;

  })();

  Up = new PenStatus("up");

  Down = new PenStatus("down");

  Erase = new PenStatus("erase");

  PenManager = (function() {
    function PenManager(_updateFunc, _size, _status) {
      this._updateFunc = _updateFunc;
      this._size = _size != null ? _size : 1.0;
      this._status = _status != null ? _status : Up;
    }

    PenManager.prototype.getSize = function() {
      return this._size;
    };

    PenManager.prototype.getMode = function() {
      return this._status;
    };

    PenManager.prototype.setPenMode = function(position) {
      if (position === Up.toString()) {
        this.raisePen();
      } else if (position === Erase.toString()) {
        this.useEraser();
      } else {
        this.lowerPen();
      }
    };

    PenManager.prototype.raisePen = function() {
      this._updateStatus(Up);
    };

    PenManager.prototype.lowerPen = function() {
      this._updateStatus(Down);
    };

    PenManager.prototype.useEraser = function() {
      this._updateStatus(Erase);
    };

    PenManager.prototype.setSize = function(size) {
      this._updateSize(size);
    };

    PenManager.prototype.clone = function(updateFunc) {
      return new PenManager(updateFunc, this._size, this._status);
    };

    PenManager.prototype._updateSize = function(newSize) {
      this._size = newSize;
      this._updateFunc("pen-size");
    };

    PenManager.prototype._updateStatus = function(newStatus) {
      this._status = newStatus;
      this._updateFunc("pen-mode");
    };

    return PenManager;

  })();

  module.exports = {
    PenManager: PenManager,
    PenStatus: {
      Up: Up,
      Down: Down,
      Erase: Erase
    }
  };

}).call(this);

},{}],"engine/core/structure/selfmanager":[function(require,module,exports){
(function() {
  var DeathInterrupt, SelfManager, ignoring, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('util/exception'), DeathInterrupt = ref.DeathInterrupt, ignoring = ref.ignoring;

  module.exports = SelfManager = (function() {
    SelfManager.prototype._self = void 0;

    SelfManager.prototype._myself = void 0;

    function SelfManager() {
      this.askAgent = bind(this.askAgent, this);
      this.self = bind(this.self, this);
      this._self = 0;
      this._myself = 0;
    }

    SelfManager.prototype.self = function() {
      return this._self;
    };

    SelfManager.prototype.myself = function() {
      if (this._myself !== 0) {
        return this._myself;
      } else {
        throw new Error("There is no agent for MYSELF to refer to.");
      }
    };

    SelfManager.prototype.askAgent = function(f) {
      return (function(_this) {
        return function(agent) {
          var oldAgent, oldMyself, res;
          oldMyself = _this._myself;
          oldAgent = _this._self;
          _this._myself = _this._self;
          _this._self = agent;
          res = ignoring(DeathInterrupt)(f);
          _this._self = oldAgent;
          _this._myself = oldMyself;
          return res;
        };
      })(this);
    };

    return SelfManager;

  })();

}).call(this);

},{"util/exception":"util/exception"}],"engine/core/structure/variablemanager":[function(require,module,exports){
(function() {
  var ExtraVariableSpec, ImmutableVariableSpec, MutableVariableSpec, VariableManager, _, ref;

  _ = require('lodash');

  ref = require('./variablespec'), ExtraVariableSpec = ref.ExtraVariableSpec, ImmutableVariableSpec = ref.ImmutableVariableSpec, MutableVariableSpec = ref.MutableVariableSpec;

  module.exports = VariableManager = (function() {
    VariableManager.prototype._names = void 0;

    function VariableManager(agent, varSpecs) {
      var name;
      this.agent = agent;
      this._addVarsBySpec(varSpecs);
      this._names = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = varSpecs.length; i < len; i++) {
          name = varSpecs[i].name;
          results.push(name);
        }
        return results;
      })();
    }

    VariableManager.prototype.names = function() {
      return this._names;
    };

    VariableManager.prototype.refineBy = function(oldNames, newNames) {
      var freshNames, i, invalidatedSetter, len, name, obsoletedNames, specs;
      invalidatedSetter = function(name) {
        return function(value) {
          throw new Error(name + " is no longer a valid variable.");
        };
      };
      obsoletedNames = _(oldNames).difference(newNames).value();
      freshNames = _(newNames).difference(oldNames).value();
      specs = freshNames.map(function(name) {
        return new ExtraVariableSpec(name);
      });
      for (i = 0, len = obsoletedNames.length; i < len; i++) {
        name = obsoletedNames[i];
        this._defineProperty(name, {
          get: void 0,
          set: invalidatedSetter(name),
          configurable: true
        });
      }
      this._addVarsBySpec(specs);
      this._names = _(this._names).difference(obsoletedNames).value().concat(freshNames);
    };

    VariableManager.prototype._addVarsBySpec = function(varSpecs) {
      var get, i, len, obj, set, spec;
      for (i = 0, len = varSpecs.length; i < len; i++) {
        spec = varSpecs[i];
        obj = (function() {
          if (spec instanceof ExtraVariableSpec) {
            return {
              configurable: true,
              value: 0,
              writable: true
            };
          } else if (spec instanceof MutableVariableSpec) {
            get = (function(spec) {
              return function() {
                return spec.get.call(this.agent);
              };
            })(spec);
            set = (function(spec) {
              return function(x) {
                return spec.set.call(this.agent, x);
              };
            })(spec);
            return {
              configurable: true,
              get: get,
              set: set
            };
          } else if (spec instanceof ImmutableVariableSpec) {
            return {
              value: spec.get.call(this.agent),
              writable: false
            };
          } else {
            throw new Error("Non-exhaustive spec type match: " + (typeof spec) + "!");
          }
        }).call(this);
        this._defineProperty(spec.name, obj);
      }
    };

    VariableManager.prototype._defineProperty = function(propName, config) {
      Object.defineProperty(this, propName, config);
    };

    return VariableManager;

  })();

}).call(this);

},{"./variablespec":"engine/core/structure/variablespec","lodash":"lodash"}],"engine/core/structure/variablespec":[function(require,module,exports){
(function() {
  var ExtraVariableSpec, ImmutableVariableSpec, MutableVariableSpec, VariableSpec,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  VariableSpec = (function() {
    function VariableSpec(name1) {
      this.name = name1;
    }

    return VariableSpec;

  })();

  ExtraVariableSpec = (function(superClass) {
    extend(ExtraVariableSpec, superClass);

    function ExtraVariableSpec() {
      return ExtraVariableSpec.__super__.constructor.apply(this, arguments);
    }

    return ExtraVariableSpec;

  })(VariableSpec);

  ImmutableVariableSpec = (function(superClass) {
    extend(ImmutableVariableSpec, superClass);

    function ImmutableVariableSpec(name, get) {
      this.get = get;
      ImmutableVariableSpec.__super__.constructor.call(this, name);
    }

    return ImmutableVariableSpec;

  })(VariableSpec);

  MutableVariableSpec = (function(superClass) {
    extend(MutableVariableSpec, superClass);

    function MutableVariableSpec(name, get, set) {
      this.get = get;
      this.set = set;
      MutableVariableSpec.__super__.constructor.call(this, name);
    }

    return MutableVariableSpec;

  })(VariableSpec);

  module.exports = {
    ExtraVariableSpec: ExtraVariableSpec,
    ImmutableVariableSpec: ImmutableVariableSpec,
    MutableVariableSpec: MutableVariableSpec,
    VariableSpec: VariableSpec
  };

}).call(this);

},{}],"engine/core/topology/box":[function(require,module,exports){
(function() {
  var Box, Topology,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Topology = require('./topology');

  module.exports = Box = (function(superClass) {
    extend(Box, superClass);

    function Box() {
      this._shortestY = bind(this._shortestY, this);
      this._shortestX = bind(this._shortestX, this);
      return Box.__super__.constructor.apply(this, arguments);
    }

    Box.prototype._wrapInX = false;

    Box.prototype._wrapInY = false;

    Box.prototype.wrapX = function(pos) {
      return this._wrapXCautiously(pos);
    };

    Box.prototype.wrapY = function(pos) {
      return this._wrapYCautiously(pos);
    };

    Box.prototype._getPatchNorth = function(pxcor, pycor) {
      return (pycor !== this.maxPycor) && this._getPatchAt(pxcor, pycor + 1);
    };

    Box.prototype._getPatchSouth = function(pxcor, pycor) {
      return (pycor !== this.minPycor) && this._getPatchAt(pxcor, pycor - 1);
    };

    Box.prototype._getPatchEast = function(pxcor, pycor) {
      return (pxcor !== this.maxPxcor) && this._getPatchAt(pxcor + 1, pycor);
    };

    Box.prototype._getPatchWest = function(pxcor, pycor) {
      return (pxcor !== this.minPxcor) && this._getPatchAt(pxcor - 1, pycor);
    };

    Box.prototype._getPatchNorthWest = function(pxcor, pycor) {
      return (pycor !== this.maxPycor) && (pxcor !== this.minPxcor) && this._getPatchAt(pxcor - 1, pycor + 1);
    };

    Box.prototype._getPatchSouthWest = function(pxcor, pycor) {
      return (pycor !== this.minPycor) && (pxcor !== this.minPxcor) && this._getPatchAt(pxcor - 1, pycor - 1);
    };

    Box.prototype._getPatchSouthEast = function(pxcor, pycor) {
      return (pycor !== this.minPycor) && (pxcor !== this.maxPxcor) && this._getPatchAt(pxcor + 1, pycor - 1);
    };

    Box.prototype._getPatchNorthEast = function(pxcor, pycor) {
      return (pycor !== this.maxPycor) && (pxcor !== this.maxPxcor) && this._getPatchAt(pxcor + 1, pycor + 1);
    };

    Box.prototype._refineScratchPads = function(yy, xx, scratch, scratch2, coefficient) {
      var diffuseVal, i, j, ref, ref1, x, y;
      for (y = i = 0, ref = yy; 0 <= ref ? i < ref : i > ref; y = 0 <= ref ? ++i : --i) {
        for (x = j = 0, ref1 = xx; 0 <= ref1 ? j < ref1 : j > ref1; x = 0 <= ref1 ? ++j : --j) {
          diffuseVal = (scratch[x][y] / 8) * coefficient;
          if ((0 < y && y < yy - 1) && (0 < x && x < xx - 1)) {
            scratch2[x][y] += scratch[x][y] - (8 * diffuseVal);
            scratch2[x - 1][y - 1] += diffuseVal;
            scratch2[x - 1][y] += diffuseVal;
            scratch2[x - 1][y + 1] += diffuseVal;
            scratch2[x][y + 1] += diffuseVal;
            scratch2[x][y - 1] += diffuseVal;
            scratch2[x + 1][y - 1] += diffuseVal;
            scratch2[x + 1][y] += diffuseVal;
            scratch2[x + 1][y + 1] += diffuseVal;
          } else if ((0 < y && y < yy - 1)) {
            if (x === 0) {
              scratch2[x][y] += scratch[x][y] - (5 * diffuseVal);
              scratch2[x][y + 1] += diffuseVal;
              scratch2[x][y - 1] += diffuseVal;
              scratch2[x + 1][y - 1] += diffuseVal;
              scratch2[x + 1][y] += diffuseVal;
              scratch2[x + 1][y + 1] += diffuseVal;
            } else {
              scratch2[x][y] += scratch[x][y] - (5 * diffuseVal);
              scratch2[x][y + 1] += diffuseVal;
              scratch2[x][y - 1] += diffuseVal;
              scratch2[x - 1][y - 1] += diffuseVal;
              scratch2[x - 1][y] += diffuseVal;
              scratch2[x - 1][y + 1] += diffuseVal;
            }
          } else if ((0 < x && x < xx - 1)) {
            if (y === 0) {
              scratch2[x][y] += scratch[x][y] - (5 * diffuseVal);
              scratch2[x - 1][y] += diffuseVal;
              scratch2[x - 1][y + 1] += diffuseVal;
              scratch2[x][y + 1] += diffuseVal;
              scratch2[x + 1][y] += diffuseVal;
              scratch2[x + 1][y + 1] += diffuseVal;
            } else {
              scratch2[x][y] += scratch[x][y] - (5 * diffuseVal);
              scratch2[x - 1][y] += diffuseVal;
              scratch2[x - 1][y - 1] += diffuseVal;
              scratch2[x][y - 1] += diffuseVal;
              scratch2[x + 1][y] += diffuseVal;
              scratch2[x + 1][y - 1] += diffuseVal;
            }
          } else if (x === 0) {
            if (y === 0) {
              scratch2[x][y] += scratch[x][y] - (3 * diffuseVal);
              scratch2[x][y + 1] += diffuseVal;
              scratch2[x + 1][y] += diffuseVal;
              scratch2[x + 1][y + 1] += diffuseVal;
            } else {
              scratch2[x][y] += scratch[x][y] - (3 * diffuseVal);
              scratch2[x][y - 1] += diffuseVal;
              scratch2[x + 1][y] += diffuseVal;
              scratch2[x + 1][y - 1] += diffuseVal;
            }
          } else if (y === 0) {
            scratch2[x][y] += scratch[x][y] - (3 * diffuseVal);
            scratch2[x][y + 1] += diffuseVal;
            scratch2[x - 1][y] += diffuseVal;
            scratch2[x - 1][y + 1] += diffuseVal;
          } else {
            scratch2[x][y] += scratch[x][y] - (3 * diffuseVal);
            scratch2[x][y - 1] += diffuseVal;
            scratch2[x - 1][y] += diffuseVal;
            scratch2[x - 1][y - 1] += diffuseVal;
          }
        }
      }
    };

    Box.prototype._shortestX = function(x1, x2) {
      return this._shortestNotWrapped(x1, x2);
    };

    Box.prototype._shortestY = function(y1, y2) {
      return this._shortestNotWrapped(y1, y2);
    };

    return Box;

  })(Topology);

}).call(this);

},{"./topology":"engine/core/topology/topology"}],"engine/core/topology/factory":[function(require,module,exports){
(function() {
  var Box, HorizCylinder, Torus, VertCylinder;

  Box = require('./box');

  HorizCylinder = require('./horizcylinder');

  Torus = require('./torus');

  VertCylinder = require('./vertcylinder');

  module.exports = function(wrapsInX, wrapsInY, minX, maxX, minY, maxY, getPatchesFunc, getPatchAtFunc) {
    var TopoClass;
    TopoClass = wrapsInX && wrapsInY ? Torus : wrapsInX ? VertCylinder : wrapsInY ? HorizCylinder : Box;
    return new TopoClass(minX, maxX, minY, maxY, getPatchesFunc, getPatchAtFunc);
  };

}).call(this);

},{"./box":"engine/core/topology/box","./horizcylinder":"engine/core/topology/horizcylinder","./torus":"engine/core/topology/torus","./vertcylinder":"engine/core/topology/vertcylinder"}],"engine/core/topology/horizcylinder":[function(require,module,exports){
(function() {
  var HorizCylinder, Topology,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Topology = require('./topology');

  module.exports = HorizCylinder = (function(superClass) {
    extend(HorizCylinder, superClass);

    function HorizCylinder() {
      this._shortestY = bind(this._shortestY, this);
      this._shortestX = bind(this._shortestX, this);
      return HorizCylinder.__super__.constructor.apply(this, arguments);
    }

    HorizCylinder.prototype._wrapInX = false;

    HorizCylinder.prototype._wrapInY = true;

    HorizCylinder.prototype.wrapX = function(pos) {
      return this._wrapXCautiously(pos);
    };

    HorizCylinder.prototype.wrapY = function(pos) {
      return this._wrapYLeniently(pos);
    };

    HorizCylinder.prototype._getPatchEast = function(pxcor, pycor) {
      return (pxcor !== this.maxPxcor) && this._getPatchAt(pxcor + 1, pycor);
    };

    HorizCylinder.prototype._getPatchWest = function(pxcor, pycor) {
      return (pxcor !== this.minPxcor) && this._getPatchAt(pxcor - 1, pycor);
    };

    HorizCylinder.prototype._getPatchNorth = function(pxcor, pycor) {
      if (pycor === this.maxPycor) {
        return this._getPatchAt(pxcor, this.minPycor);
      } else {
        return this._getPatchAt(pxcor, pycor + 1);
      }
    };

    HorizCylinder.prototype._getPatchSouth = function(pxcor, pycor) {
      if (pycor === this.minPycor) {
        return this._getPatchAt(pxcor, this.maxPycor);
      } else {
        return this._getPatchAt(pxcor, pycor - 1);
      }
    };

    HorizCylinder.prototype._getPatchNorthWest = function(pxcor, pycor) {
      if (pxcor === this.minPxcor) {
        return false;
      } else if (pycor === this.maxPycor) {
        return this._getPatchAt(pxcor - 1, this.minPycor);
      } else {
        return this._getPatchAt(pxcor - 1, pycor + 1);
      }
    };

    HorizCylinder.prototype._getPatchSouthWest = function(pxcor, pycor) {
      if (pxcor === this.minPxcor) {
        return false;
      } else if (pycor === this.minPycor) {
        return this._getPatchAt(pxcor - 1, this.maxPycor);
      } else {
        return this._getPatchAt(pxcor - 1, pycor - 1);
      }
    };

    HorizCylinder.prototype._getPatchSouthEast = function(pxcor, pycor) {
      if (pxcor === this.maxPxcor) {
        return false;
      } else if (pycor === this.minPycor) {
        return this._getPatchAt(pxcor + 1, this.maxPycor);
      } else {
        return this._getPatchAt(pxcor + 1, pycor - 1);
      }
    };

    HorizCylinder.prototype._getPatchNorthEast = function(pxcor, pycor) {
      if (pxcor === this.maxPxcor) {
        return false;
      } else if (pycor === this.maxPycor) {
        return this._getPatchAt(pxcor + 1, this.minPycor);
      } else {
        return this._getPatchAt(pxcor + 1, pycor + 1);
      }
    };

    HorizCylinder.prototype._refineScratchPads = function(yy, xx, scratch, scratch2, coefficient) {
      var diffuseVal, i, j, ref, ref1, ref2, ref3, x, y;
      for (y = i = ref = yy, ref1 = yy * 2; ref <= ref1 ? i < ref1 : i > ref1; y = ref <= ref1 ? ++i : --i) {
        for (x = j = ref2 = xx, ref3 = xx * 2; ref2 <= ref3 ? j < ref3 : j > ref3; x = ref2 <= ref3 ? ++j : --j) {
          diffuseVal = (scratch[x - xx][y - yy] / 8) * coefficient;
          if ((xx < x && x < (xx * 2) - 1)) {
            scratch2[x - xx][y - yy] += scratch[x - xx][y - yy] - (8 * diffuseVal);
            scratch2[(x - 1) % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x - 1) % xx][y % yy] += diffuseVal;
            scratch2[(x - 1) % xx][(y + 1) % yy] += diffuseVal;
            scratch2[x % xx][(y + 1) % yy] += diffuseVal;
            scratch2[x % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x + 1) % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x + 1) % xx][y % yy] += diffuseVal;
            scratch2[(x + 1) % xx][(y + 1) % yy] += diffuseVal;
          } else if (x === xx) {
            scratch2[x - xx][y - yy] += scratch[x - xx][y - yy] - (5 * diffuseVal);
            scratch2[x % xx][(y + 1) % yy] += diffuseVal;
            scratch2[x % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x + 1) % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x + 1) % xx][y % yy] += diffuseVal;
            scratch2[(x + 1) % xx][(y + 1) % yy] += diffuseVal;
          } else {
            scratch2[x - xx][y - yy] += scratch[x - xx][y - yy] - (5 * diffuseVal);
            scratch2[x % xx][(y + 1) % yy] += diffuseVal;
            scratch2[x % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x - 1) % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x - 1) % xx][y % yy] += diffuseVal;
            scratch2[(x - 1) % xx][(y + 1) % yy] += diffuseVal;
          }
        }
      }
    };

    HorizCylinder.prototype._shortestX = function(x1, x2) {
      return this._shortestNotWrapped(x1, x2);
    };

    HorizCylinder.prototype._shortestY = function(y1, y2) {
      return this._shortestYWrapped(y1, y2);
    };

    return HorizCylinder;

  })(Topology);

}).call(this);

},{"./topology":"engine/core/topology/topology"}],"engine/core/topology/incone":[function(require,module,exports){
(function() {
  var NLMath, NLType, findCircleBounds;

  NLMath = require('util/nlmath');

  NLType = require('../typechecker');

  findCircleBounds = function(wrapsInDim, worldSpan, distance, minDim, maxDim, currentDim) {
    var diff, dist, halfSpan, max, min;
    dist = NLMath.ceil(distance);
    if (wrapsInDim) {
      halfSpan = worldSpan / 2;
      if (dist < halfSpan) {
        return [-dist, dist];
      } else {
        return [-NLMath.ceil(halfSpan - 1), NLMath.floor(halfSpan)];
      }
    } else {
      diff = minDim - currentDim;
      min = NLMath.abs(diff) < dist ? diff : -dist;
      max = NLMath.min(maxDim - currentDim, dist);
      return [min, max];
    }
  };

  module.exports = function(x, y, turtleHeading, agents, distance, angle) {
    var dx, dxMax, dxMin, dy, dyMax, dyMin, findWrapCount, goodTurtles, i, isInSector, isInWrappableSector, isPatchSet, isTurtleSet, j, patch, patchIsGood, patchIsGood_, pxcor, pycor, ref, ref1, ref2, ref3, ref4, ref5, ref6, result, turtleIsGood, turtleIsGood_, wrapCountInX, wrapCountInY;
    findWrapCount = function(wrapsInDim, dimSize) {
      if (wrapsInDim) {
        return NLMath.ceil(distance / dimSize);
      } else {
        return 0;
      }
    };
    isInSector = (function(_this) {
      return function(ax, ay, cx, cy, radius, heading) {
        var isTheSameSpot, isWithinArc, isWithinRange;
        isWithinArc = function() {
          var diff, half, theta;
          theta = _this._towardsNotWrapped(cx, cy, ax, ay);
          diff = NLMath.abs(theta - heading);
          half = angle / 2;
          return (diff <= half) || ((360 - diff) <= half);
        };
        isWithinRange = function() {
          return NLMath.distance4_2D(cx, cy, ax, ay) <= radius;
        };
        isTheSameSpot = ax === cx && ay === cy;
        return isTheSameSpot || (isWithinRange() && isWithinArc());
      };
    })(this);
    isInWrappableSector = (function(_this) {
      return function(agentX, agentY, xBound, yBound) {
        var i, j, ref, ref1, ref2, ref3, xWrapCoefficient, yWrapCoefficient;
        for (xWrapCoefficient = i = ref = -xBound, ref1 = xBound; ref <= ref1 ? i <= ref1 : i >= ref1; xWrapCoefficient = ref <= ref1 ? ++i : --i) {
          for (yWrapCoefficient = j = ref2 = -yBound, ref3 = yBound; ref2 <= ref3 ? j <= ref3 : j >= ref3; yWrapCoefficient = ref2 <= ref3 ? ++j : --j) {
            if (isInSector(agentX + _this.width * xWrapCoefficient, agentY + _this.height * yWrapCoefficient, x, y, distance, turtleHeading)) {
              return true;
            }
          }
        }
        return false;
      };
    })(this);
    patchIsGood = (function(_this) {
      return function(wrapCountInX, wrapCountInY) {
        return function(patch) {
          var isPlausible;
          isPlausible = agents.getSpecialName() === "patches" || agents.contains(patch);
          return isPlausible && isInWrappableSector(patch.pxcor, patch.pycor, wrapCountInX, wrapCountInY);
        };
      };
    })(this);
    turtleIsGood = (function(_this) {
      return function(wrapCountInX, wrapCountInY) {
        return function(turtle) {
          var breedName, isPlausible;
          breedName = agents.getSpecialName();
          isPlausible = breedName === "turtles" || ((breedName != null) && breedName === turtle.getBreedName()) || ((breedName == null) && agents.contains(turtle));
          return isPlausible && isInWrappableSector(turtle.xcor, turtle.ycor, wrapCountInX, wrapCountInY);
        };
      };
    })(this);
    ref = this._getPatchAt(x, y), pxcor = ref.pxcor, pycor = ref.pycor;
    wrapCountInX = findWrapCount(this._wrapInX, this.width);
    wrapCountInY = findWrapCount(this._wrapInY, this.height);
    patchIsGood_ = patchIsGood(wrapCountInX, wrapCountInY);
    turtleIsGood_ = turtleIsGood(wrapCountInX, wrapCountInY);
    ref1 = findCircleBounds(this._wrapInX, this.width, distance, this.minPxcor, this.maxPxcor, pxcor), dxMin = ref1[0], dxMax = ref1[1];
    ref2 = findCircleBounds(this._wrapInY, this.height, distance, this.minPycor, this.maxPycor, pycor), dyMin = ref2[0], dyMax = ref2[1];
    isPatchSet = NLType(agents).isPatchSet();
    isTurtleSet = NLType(agents).isTurtleSet();
    result = [];
    for (dy = i = ref3 = dyMin, ref4 = dyMax; ref3 <= ref4 ? i <= ref4 : i >= ref4; dy = ref3 <= ref4 ? ++i : --i) {
      for (dx = j = ref5 = dxMin, ref6 = dxMax; ref5 <= ref6 ? j <= ref6 : j >= ref6; dx = ref5 <= ref6 ? ++j : --j) {
        patch = this._getPatchAt(pxcor + dx, pycor + dy);
        if (!NLType(patch).isNobody()) {
          if (isPatchSet && patchIsGood_(patch)) {
            result.push(patch);
          } else if (isTurtleSet && NLMath.distance2_2D(dx, dy) <= distance + 1.415) {
            goodTurtles = patch.turtlesHere().toArray().filter((function(_this) {
              return function(turtle) {
                return turtleIsGood_(turtle);
              };
            })(this));
            result = result.concat(goodTurtles);
          }
        }
      }
    }
    return agents.copyWithNewAgents(result);
  };

}).call(this);

},{"../typechecker":"engine/core/typechecker","util/nlmath":"util/nlmath"}],"engine/core/topology/topology":[function(require,module,exports){
(function() {
  var AgentException, StrictMath, Topology, TopologyInterrupt, _, abstractMethod, inCone, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('lodash');

  inCone = require('./incone');

  Topology = require('./topology');

  StrictMath = require('shim/strictmath');

  abstractMethod = require('util/abstractmethoderror');

  ref = require('util/exception'), AgentException = ref.AgentException, TopologyInterrupt = ref.TopologyInterrupt;

  module.exports = Topology = (function() {
    Topology.prototype._wrapInX = void 0;

    Topology.prototype._wrapInY = void 0;

    Topology.prototype.height = void 0;

    Topology.prototype.width = void 0;

    Topology.prototype._neighborCache = void 0;

    Topology.prototype._neighbor4Cache = void 0;

    function Topology(minPxcor, maxPxcor, minPycor, maxPycor, _getPatches, _getPatchAt) {
      this.minPxcor = minPxcor;
      this.maxPxcor = maxPxcor;
      this.minPycor = minPycor;
      this.maxPycor = maxPycor;
      this._getPatches = _getPatches;
      this._getPatchAt = _getPatchAt;
      this._shortestY = bind(this._shortestY, this);
      this._shortestX = bind(this._shortestX, this);
      this.height = 1 + this.maxPycor - this.minPycor;
      this.width = 1 + this.maxPxcor - this.minPxcor;
      this._neighborCache = {};
      this._neighbor4Cache = {};
    }

    Topology.prototype.diffuse = function(varName, coefficient) {
      this._sloppyDiffuse(varName, coefficient);
    };

    Topology.prototype.getNeighbors = function(pxcor, pycor) {
      var key;
      key = "(" + pxcor + ", " + pycor + ")";
      if (this._neighborCache.hasOwnProperty(key)) {
        return this._neighborCache[key];
      } else {
        return this._neighborCache[key] = this._filterNeighbors(this._getNeighbors(pxcor, pycor));
      }
    };

    Topology.prototype.getNeighbors4 = function(pxcor, pycor) {
      var key;
      key = "(" + pxcor + ", " + pycor + ")";
      if (this._neighbor4Cache.hasOwnProperty(key)) {
        return this._neighbor4Cache[key];
      } else {
        return this._neighbor4Cache[key] = this._filterNeighbors(this._getNeighbors4(pxcor, pycor));
      }
    };

    Topology.prototype._filterNeighbors = function(neighbors) {
      return _(neighbors).filter(function(patch) {
        return patch !== false;
      }).uniq().value();
    };

    Topology.prototype.distanceXY = function(x1, y1, x2, y2) {
      var a2, b2;
      a2 = StrictMath.pow(this._shortestX(x1, x2), 2);
      b2 = StrictMath.pow(this._shortestY(y1, y2), 2);
      return StrictMath.sqrt(a2 + b2);
    };

    Topology.prototype.distance = function(x1, y1, agent) {
      var ref1, x2, y2;
      ref1 = agent.getCoords(), x2 = ref1[0], y2 = ref1[1];
      return this.distanceXY(x1, y1, x2, y2);
    };

    Topology.prototype.towards = function(x1, y1, x2, y2) {
      return this._towards(x1, y1, x2, y2, this._shortestX, this._shortestY);
    };

    Topology.prototype.midpointx = function(x1, x2) {
      var pos;
      pos = (x1 + (x1 + this._shortestX(x1, x2))) / 2;
      return this._wrap(pos, this.minPxcor - 0.5, this.maxPxcor + 0.5);
    };

    Topology.prototype.midpointy = function(y1, y2) {
      var pos;
      pos = (y1 + (y1 + this._shortestY(y1, y2))) / 2;
      return this._wrap(pos, this.minPycor - 0.5, this.maxPycor + 0.5);
    };

    Topology.prototype.inCone = function(x, y, heading, agents, distance, angle) {
      return inCone.call(this, x, y, heading, agents, distance, angle);
    };

    Topology.prototype.inRadius = function(x, y, agents, radius) {
      return agents.filter((function(_this) {
        return function(agent) {
          var ref1, xcor, ycor;
          ref1 = agent.getCoords(), xcor = ref1[0], ycor = ref1[1];
          return _this.distanceXY(xcor, ycor, x, y) <= radius;
        };
      })(this));
    };

    Topology.prototype._getNeighbors = function(pxcor, pycor) {
      if (pxcor === this.maxPxcor && pxcor === this.minPxcor) {
        if (pycor === this.maxPycor && pycor === this.minPycor) {
          return [];
        } else {
          return [this._getPatchNorth(pxcor, pycor), this._getPatchSouth(pxcor, pycor)];
        }
      } else if (pycor === this.maxPycor && pycor === this.minPycor) {
        return [this._getPatchEast(pxcor, pycor), this._getPatchWest(pxcor, pycor)];
      } else {
        return [this._getPatchNorth(pxcor, pycor), this._getPatchEast(pxcor, pycor), this._getPatchSouth(pxcor, pycor), this._getPatchWest(pxcor, pycor), this._getPatchNorthEast(pxcor, pycor), this._getPatchSouthEast(pxcor, pycor), this._getPatchSouthWest(pxcor, pycor), this._getPatchNorthWest(pxcor, pycor)];
      }
    };

    Topology.prototype._getNeighbors4 = function(pxcor, pycor) {
      if (pxcor === this.maxPxcor && pxcor === this.minPxcor) {
        if (pycor === this.maxPycor && pycor === this.minPycor) {
          return [];
        } else {
          return [this._getPatchNorth(pxcor, pycor), this._getPatchSouth(pxcor, pycor)];
        }
      } else if (pycor === this.maxPycor && pycor === this.minPycor) {
        return [this._getPatchEast(pxcor, pycor), this._getPatchWest(pxcor, pycor)];
      } else {
        return [this._getPatchNorth(pxcor, pycor), this._getPatchEast(pxcor, pycor), this._getPatchSouth(pxcor, pycor), this._getPatchWest(pxcor, pycor)];
      }
    };

    Topology.prototype._refineScratchPads = function(yy, xx, scratch, scratch2, coefficient) {};

    Topology.prototype._shortestNotWrapped = function(cor1, cor2) {
      return StrictMath.abs(cor1 - cor2) * (cor1 > cor2 ? -1 : 1);
    };

    Topology.prototype._shortestWrapped = function(cor1, cor2, limit) {
      var absDist;
      absDist = StrictMath.abs(cor1 - cor2);
      if (absDist > limit / 2) {
        return (limit - absDist) * (cor2 > cor1 ? -1 : 1);
      } else {
        return this._shortestNotWrapped(cor1, cor2);
      }
    };

    Topology.prototype._shortestXWrapped = function(cor1, cor2) {
      return this._shortestWrapped(cor1, cor2, this.width);
    };

    Topology.prototype._shortestYWrapped = function(cor1, cor2) {
      return this._shortestWrapped(cor1, cor2, this.height);
    };

    Topology.prototype._sloppyDiffuse = function(varName, coefficient) {
      var mapAll, scratch, scratch2, xx, yy;
      yy = this.height;
      xx = this.width;
      mapAll = function(f) {
        var i, ref1, results, x, y;
        results = [];
        for (x = i = 0, ref1 = xx; 0 <= ref1 ? i < ref1 : i > ref1; x = 0 <= ref1 ? ++i : --i) {
          results.push((function() {
            var j, ref2, results1;
            results1 = [];
            for (y = j = 0, ref2 = yy; 0 <= ref2 ? j < ref2 : j > ref2; y = 0 <= ref2 ? ++j : --j) {
              results1.push(f(x, y));
            }
            return results1;
          })());
        }
        return results;
      };
      scratch = mapAll((function(_this) {
        return function(x, y) {
          return _this._getPatchAt(x + _this.minPxcor, y + _this.minPycor).getVariable(varName);
        };
      })(this));
      scratch2 = mapAll(function() {
        return 0;
      });
      this._refineScratchPads(yy, xx, scratch, scratch2, coefficient);
      mapAll((function(_this) {
        return function(x, y) {
          return _this._getPatchAt(x + _this.minPxcor, y + _this.minPycor).setVariable(varName, scratch2[x][y]);
        };
      })(this));
    };

    Topology.prototype._towards = function(x1, y1, x2, y2, findXDist, findYDist) {
      var dx, dy;
      if ((x1 !== x2) || (y1 !== y2)) {
        dx = findXDist(x1, x2);
        dy = findYDist(y1, y2);
        if (dx === 0) {
          if (dy >= 0) {
            return 0;
          } else {
            return 180;
          }
        } else if (dy === 0) {
          if (dx >= 0) {
            return 90;
          } else {
            return 270;
          }
        } else {
          return (270 + StrictMath.toDegrees(StrictMath.PI() + StrictMath.atan2(-dy, dx))) % 360;
        }
      } else {
        throw new AgentException("No heading is defined from a point (" + x1 + "," + x2 + ") to that same point.");
      }
    };

    Topology.prototype._towardsNotWrapped = function(x1, y1, x2, y2) {
      return this._towards(x1, y1, x2, y2, this._shortestNotWrapped, this._shortestNotWrapped);
    };

    Topology.prototype._wrap = function(pos, min, max) {
      var result;
      if (pos >= max) {
        return min + ((pos - max) % (max - min));
      } else if (pos < min) {
        result = max - ((min - pos) % (max - min));
        if (result < max) {
          return result;
        } else {
          return min;
        }
      } else {
        return pos;
      }
    };

    Topology.prototype._wrapXCautiously = function(pos) {
      return this._wrapCautiously(this.minPxcor, this.maxPxcor, pos);
    };

    Topology.prototype._wrapXLeniently = function(pos) {
      return this._wrapLeniently(this.minPxcor, this.maxPxcor, pos);
    };

    Topology.prototype._wrapYCautiously = function(pos) {
      return this._wrapCautiously(this.minPycor, this.maxPycor, pos);
    };

    Topology.prototype._wrapYLeniently = function(pos) {
      return this._wrapLeniently(this.minPycor, this.maxPycor, pos);
    };

    Topology.prototype._wrapCautiously = function(minCor, maxCor, pos) {
      var max, min;
      min = minCor - 0.5;
      max = maxCor + 0.5;
      if ((min <= pos && pos < max)) {
        return pos;
      } else {
        throw new TopologyInterrupt("Cannot move turtle beyond the world's edge.");
      }
    };

    Topology.prototype._wrapLeniently = function(minCor, maxCor, pos) {
      return this._wrap(pos, minCor - 0.5, maxCor + 0.5);
    };

    Topology.prototype.wrapX = function(pos) {
      return abstractMethod('Topology.wrapX');
    };

    Topology.prototype.wrapY = function(pos) {
      return abstractMethod('Topology.wrapY');
    };

    Topology.prototype._shortestX = function(x1, x2) {
      return abstractMethod('Topology._shortestX');
    };

    Topology.prototype._shortestY = function(y1, y2) {
      return abstractMethod('Topology._shortestY');
    };

    Topology.prototype._getPatchNorth = function(x, y) {
      return abstractMethod('Topology._getPatchNorth');
    };

    Topology.prototype._getPatchEast = function(x, y) {
      return abstractMethod('Topology._getPatchEast');
    };

    Topology.prototype._getPatchSouth = function(x, y) {
      return abstractMethod('Topology._getPatchSouth');
    };

    Topology.prototype._getPatchWest = function(x, y) {
      return abstractMethod('Topology._getPatchWest');
    };

    Topology.prototype._getPatchNorthEast = function(x, y) {
      return abstractMethod('Topology._getPatchNorthEast');
    };

    Topology.prototype._getPatchSouthEast = function(x, y) {
      return abstractMethod('Topology._getPatchSouthEast');
    };

    Topology.prototype._getPatchSouthWest = function(x, y) {
      return abstractMethod('Topology._getPatchSouthWest');
    };

    Topology.prototype._getPatchNorthWest = function(x, y) {
      return abstractMethod('Topology._getPatchNorthWest');
    };

    return Topology;

  })();

}).call(this);

},{"./incone":"engine/core/topology/incone","./topology":"engine/core/topology/topology","lodash":"lodash","shim/strictmath":"shim/strictmath","util/abstractmethoderror":"util/abstractmethoderror","util/exception":"util/exception"}],"engine/core/topology/torus":[function(require,module,exports){
(function() {
  var Topology, Torus, _,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('lodash');

  Topology = require('./topology');

  module.exports = Torus = (function(superClass) {
    extend(Torus, superClass);

    function Torus() {
      this._shortestY = bind(this._shortestY, this);
      this._shortestX = bind(this._shortestX, this);
      return Torus.__super__.constructor.apply(this, arguments);
    }

    Torus.prototype._wrapInX = true;

    Torus.prototype._wrapInY = true;

    Torus.prototype.wrapX = function(pos) {
      return this._wrapXLeniently(pos);
    };

    Torus.prototype.wrapY = function(pos) {
      return this._wrapYLeniently(pos);
    };

    Torus.prototype.diffuse = function(varName, coefficient) {
      var scratch;
      scratch = _(0).range(this.width).map(function() {
        return [];
      }).value();
      this._getPatches().forEach((function(_this) {
        return function(patch) {
          scratch[patch.pxcor - _this.minPxcor][patch.pycor - _this.minPycor] = patch.getVariable(varName);
        };
      })(this));
      this._getPatches().forEach((function(_this) {
        return function(patch) {
          var diffusalSum, orderedNeighbors, pxcor, pycor;
          pxcor = patch.pxcor;
          pycor = patch.pycor;
          orderedNeighbors = [_this._getPatchSouthWest(pxcor, pycor), _this._getPatchWest(pxcor, pycor), _this._getPatchNorthWest(pxcor, pycor), _this._getPatchSouth(pxcor, pycor), _this._getPatchNorth(pxcor, pycor), _this._getPatchSouthEast(pxcor, pycor), _this._getPatchEast(pxcor, pycor), _this._getPatchNorthEast(pxcor, pycor)];
          diffusalSum = _(orderedNeighbors).map(function(nb) {
            return scratch[nb.pxcor - _this.minPxcor][nb.pycor - _this.minPycor];
          }).reduce(function(acc, x) {
            return acc + x;
          });
          patch.setVariable(varName, patch.getVariable(varName) * (1.0 - coefficient) + (diffusalSum / 8) * coefficient);
        };
      })(this));
    };

    Torus.prototype._getPatchNorth = function(pxcor, pycor) {
      if (pycor === this.maxPycor) {
        return this._getPatchAt(pxcor, this.minPycor);
      } else {
        return this._getPatchAt(pxcor, pycor + 1);
      }
    };

    Torus.prototype._getPatchSouth = function(pxcor, pycor) {
      if (pycor === this.minPycor) {
        return this._getPatchAt(pxcor, this.maxPycor);
      } else {
        return this._getPatchAt(pxcor, pycor - 1);
      }
    };

    Torus.prototype._getPatchEast = function(pxcor, pycor) {
      if (pxcor === this.maxPxcor) {
        return this._getPatchAt(this.minPxcor, pycor);
      } else {
        return this._getPatchAt(pxcor + 1, pycor);
      }
    };

    Torus.prototype._getPatchWest = function(pxcor, pycor) {
      if (pxcor === this.minPxcor) {
        return this._getPatchAt(this.maxPxcor, pycor);
      } else {
        return this._getPatchAt(pxcor - 1, pycor);
      }
    };

    Torus.prototype._getPatchNorthWest = function(pxcor, pycor) {
      if (pycor === this.maxPycor) {
        if (pxcor === this.minPxcor) {
          return this._getPatchAt(this.maxPxcor, this.minPycor);
        } else {
          return this._getPatchAt(pxcor - 1, this.minPycor);
        }
      } else if (pxcor === this.minPxcor) {
        return this._getPatchAt(this.maxPxcor, pycor + 1);
      } else {
        return this._getPatchAt(pxcor - 1, pycor + 1);
      }
    };

    Torus.prototype._getPatchSouthWest = function(pxcor, pycor) {
      if (pycor === this.minPycor) {
        if (pxcor === this.minPxcor) {
          return this._getPatchAt(this.maxPxcor, this.maxPycor);
        } else {
          return this._getPatchAt(pxcor - 1, this.maxPycor);
        }
      } else if (pxcor === this.minPxcor) {
        return this._getPatchAt(this.maxPxcor, pycor - 1);
      } else {
        return this._getPatchAt(pxcor - 1, pycor - 1);
      }
    };

    Torus.prototype._getPatchSouthEast = function(pxcor, pycor) {
      if (pycor === this.minPycor) {
        if (pxcor === this.maxPxcor) {
          return this._getPatchAt(this.minPxcor, this.maxPycor);
        } else {
          return this._getPatchAt(pxcor + 1, this.maxPycor);
        }
      } else if (pxcor === this.maxPxcor) {
        return this._getPatchAt(this.minPxcor, pycor - 1);
      } else {
        return this._getPatchAt(pxcor + 1, pycor - 1);
      }
    };

    Torus.prototype._getPatchNorthEast = function(pxcor, pycor) {
      if (pycor === this.maxPycor) {
        if (pxcor === this.maxPxcor) {
          return this._getPatchAt(this.minPxcor, this.minPycor);
        } else {
          return this._getPatchAt(pxcor + 1, this.minPycor);
        }
      } else if (pxcor === this.maxPxcor) {
        return this._getPatchAt(this.minPxcor, pycor + 1);
      } else {
        return this._getPatchAt(pxcor + 1, pycor + 1);
      }
    };

    Torus.prototype._shortestX = function(x1, x2) {
      return this._shortestXWrapped(x1, x2);
    };

    Torus.prototype._shortestY = function(y1, y2) {
      return this._shortestYWrapped(y1, y2);
    };

    return Torus;

  })(Topology);

}).call(this);

},{"./topology":"engine/core/topology/topology","lodash":"lodash"}],"engine/core/topology/vertcylinder":[function(require,module,exports){
(function() {
  var Topology, VertCylinder,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Topology = require('./topology');

  module.exports = VertCylinder = (function(superClass) {
    extend(VertCylinder, superClass);

    function VertCylinder() {
      this._shortestY = bind(this._shortestY, this);
      this._shortestX = bind(this._shortestX, this);
      return VertCylinder.__super__.constructor.apply(this, arguments);
    }

    VertCylinder.prototype._wrapInX = true;

    VertCylinder.prototype._wrapInY = false;

    VertCylinder.prototype.wrapX = function(pos) {
      return this._wrapXLeniently(pos);
    };

    VertCylinder.prototype.wrapY = function(pos) {
      return this._wrapYCautiously(pos);
    };

    VertCylinder.prototype._getPatchNorth = function(pxcor, pycor) {
      return (pycor !== this.maxPycor) && this._getPatchAt(pxcor, pycor + 1);
    };

    VertCylinder.prototype._getPatchSouth = function(pxcor, pycor) {
      return (pycor !== this.minPycor) && this._getPatchAt(pxcor, pycor - 1);
    };

    VertCylinder.prototype._getPatchEast = function(pxcor, pycor) {
      if (pxcor === this.maxPxcor) {
        return this._getPatchAt(this.minPxcor, pycor);
      } else {
        return this._getPatchAt(pxcor + 1, pycor);
      }
    };

    VertCylinder.prototype._getPatchWest = function(pxcor, pycor) {
      if (pxcor === this.minPxcor) {
        return this._getPatchAt(this.maxPxcor, pycor);
      } else {
        return this._getPatchAt(pxcor - 1, pycor);
      }
    };

    VertCylinder.prototype._getPatchNorthWest = function(pxcor, pycor) {
      if (pycor === this.maxPycor) {
        return false;
      } else if (pxcor === this.minPxcor) {
        return this._getPatchAt(this.maxPxcor, pycor + 1);
      } else {
        return this._getPatchAt(pxcor - 1, pycor + 1);
      }
    };

    VertCylinder.prototype._getPatchSouthWest = function(pxcor, pycor) {
      if (pycor === this.minPycor) {
        return false;
      } else if (pxcor === this.minPxcor) {
        return this._getPatchAt(this.maxPxcor, pycor - 1);
      } else {
        return this._getPatchAt(pxcor - 1, pycor - 1);
      }
    };

    VertCylinder.prototype._getPatchSouthEast = function(pxcor, pycor) {
      if (pycor === this.minPycor) {
        return false;
      } else if (pxcor === this.maxPxcor) {
        return this._getPatchAt(this.minPxcor, pycor - 1);
      } else {
        return this._getPatchAt(pxcor + 1, pycor - 1);
      }
    };

    VertCylinder.prototype._getPatchNorthEast = function(pxcor, pycor) {
      if (pycor === this.maxPycor) {
        return false;
      } else if (pxcor === this.maxPxcor) {
        return this._getPatchAt(this.minPxcor, pycor + 1);
      } else {
        return this._getPatchAt(pxcor + 1, pycor + 1);
      }
    };

    VertCylinder.prototype._refineScratchPads = function(yy, xx, scratch, scratch2, coefficient) {
      var diffuseVal, i, j, ref, ref1, ref2, ref3, x, y;
      for (y = i = ref = yy, ref1 = yy * 2; ref <= ref1 ? i < ref1 : i > ref1; y = ref <= ref1 ? ++i : --i) {
        for (x = j = ref2 = xx, ref3 = xx * 2; ref2 <= ref3 ? j < ref3 : j > ref3; x = ref2 <= ref3 ? ++j : --j) {
          diffuseVal = (scratch[x - xx][y - yy] / 8) * coefficient;
          if ((yy < y && y < (yy * 2) - 1)) {
            scratch2[x - xx][y - yy] += scratch[x - xx][y - yy] - (8 * diffuseVal);
            scratch2[(x - 1) % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x - 1) % xx][y % yy] += diffuseVal;
            scratch2[(x - 1) % xx][(y + 1) % yy] += diffuseVal;
            scratch2[x % xx][(y + 1) % yy] += diffuseVal;
            scratch2[x % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x + 1) % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x + 1) % xx][y % yy] += diffuseVal;
            scratch2[(x + 1) % xx][(y + 1) % yy] += diffuseVal;
          } else if (y === yy) {
            scratch2[x - xx][y - yy] += scratch[x - xx][y - yy] - (5 * diffuseVal);
            scratch2[(x - 1) % xx][y % yy] += diffuseVal;
            scratch2[(x - 1) % xx][(y + 1) % yy] += diffuseVal;
            scratch2[x % xx][(y + 1) % yy] += diffuseVal;
            scratch2[(x + 1) % xx][y % yy] += diffuseVal;
            scratch2[(x + 1) % xx][(y + 1) % yy] += diffuseVal;
          } else {
            scratch2[x - xx][y - yy] += scratch[x - xx][y - yy] - (5 * diffuseVal);
            scratch2[(x - 1) % xx][y % yy] += diffuseVal;
            scratch2[(x - 1) % xx][(y - 1) % yy] += diffuseVal;
            scratch2[x % xx][(y - 1) % yy] += diffuseVal;
            scratch2[(x + 1) % xx][y % yy] += diffuseVal;
            scratch2[(x + 1) % xx][(y - 1) % yy] += diffuseVal;
          }
        }
      }
    };

    VertCylinder.prototype._shortestX = function(x1, x2) {
      return this._shortestXWrapped(x1, x2);
    };

    VertCylinder.prototype._shortestY = function(y1, y2) {
      return this._shortestNotWrapped(y1, y2);
    };

    return VertCylinder;

  })(Topology);

}).call(this);

},{"./topology":"engine/core/topology/topology"}],"engine/core/turtle/makepenlines":[function(require,module,exports){
(function() {
  var NLMath, Trail, _, distanceFromLegs, lazyWrapValue, makePenLines, makePenLinesHelper, makeTrails;

  _ = require('lodash');

  NLMath = require('util/nlmath');

  Trail = (function() {
    function Trail(x1, y1, x2, y2, dist) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.dist = dist;
    }

    return Trail;

  })();

  lazyWrapValue = function(min, max) {
    return function(value) {
      if (value <= min) {
        return max;
      } else if (value >= max) {
        return min;
      } else {
        return value;
      }
    };
  };

  distanceFromLegs = function(l1, l2) {
    var square;
    square = function(x) {
      return NLMath.pow(x, 2);
    };
    return NLMath.sqrt(square(l1) + square(l2));
  };

  makeTrails = function(heading, minX, maxX, minY, maxY) {
    return function(x, y, jumpDist) {
      var baseTrails, dx, dy, interceptX, interceptY, makeTrailComponent, rawX, rawY, tan, xInterceptTrails, xcomp, yInterceptTrails, ycomp;
      xcomp = NLMath.squash(NLMath.sin(heading));
      ycomp = NLMath.squash(NLMath.cos(heading));
      tan = NLMath.squash(NLMath.tan(heading));
      rawX = x + xcomp * jumpDist;
      rawY = y + ycomp * jumpDist;
      baseTrails = [new Trail(x, y, rawX, rawY, jumpDist)];
      makeTrailComponent = function(endX, endY, dx, dy) {
        return [new Trail(x, y, endX, endY, distanceFromLegs(dx, dy))];
      };
      yInterceptTrails = rawX > maxX ? (dx = maxX - x, dy = dx / tan, interceptY = y + dy, makeTrailComponent(maxX, interceptY, dx, dy)) : rawX < minX ? (dx = x - minX, dy = dx / tan, interceptY = y - dy, makeTrailComponent(minX, interceptY, dx, dy)) : [];
      xInterceptTrails = rawY > maxY ? (dy = maxY - y, dx = dy * tan, interceptX = x + dx, makeTrailComponent(interceptX, maxY, dx, dy)) : rawY < minY ? (dy = y - minY, dx = dy * tan, interceptX = x - dx, makeTrailComponent(interceptX, minY, dx, dy)) : [];
      return baseTrails.concat(xInterceptTrails, yInterceptTrails);
    };
  };

  makePenLines = function(x, y, heading, jumpDist, minX, maxX, minY, maxY) {
    var lazyWrapX, lazyWrapY, makeTrailsBy;
    if (jumpDist <= 0) {
      return [];
    } else {
      makeTrailsBy = makeTrails(heading, minX, maxX, minY, maxY);
      lazyWrapX = lazyWrapValue(minX, maxX);
      lazyWrapY = lazyWrapValue(minY, maxY);
      return makePenLinesHelper(makeTrailsBy, lazyWrapX, lazyWrapY)(x, y, jumpDist, []);
    }
  };

  makePenLinesHelper = function(makeTrailsBy, lazyWrapX, lazyWrapY) {
    var inner;
    inner = function(x, y, jumpDist, acc) {
      var newAcc, newX, newY, nextJumpDist, trail, trails;
      trails = makeTrailsBy(x, y, jumpDist);
      trail = trails.sort(function(arg, arg1) {
        var distA, distB;
        distA = arg.dist;
        distB = arg1.dist;
        if (distA < distB) {
          return -1;
        } else if (distA === distB) {
          return 0;
        } else {
          return 1;
        }
      })[0];
      newAcc = acc.concat([trail]);
      nextJumpDist = jumpDist - trail.dist;
      if (nextJumpDist <= 0) {
        return newAcc;
      } else {
        newX = lazyWrapX(trail.x2);
        newY = lazyWrapY(trail.y2);
        return inner(newX, newY, nextJumpDist, newAcc);
      }
    };
    return inner;
  };

  module.exports = makePenLines;

}).call(this);

},{"lodash":"lodash","util/nlmath":"util/nlmath"}],"engine/core/turtle/turtlevariables":[function(require,module,exports){
(function() {
  var ColorModel, ImmutableVariableSpec, MutableVariableSpec, NLMath, NLType, Setters, StrictMath, TopologyInterrupt, VariableSpecs, _, _handleTiesForHeadingChange, getBreed, ignorantly, ignoring, ref, ref1, setBreed, setBreedShape, setColor, setHeading, setIsHidden, setLabel, setLabelColor, setShape, setSize, setXcor, setYcor;

  _ = require('lodash');

  ColorModel = require('engine/core/colormodel');

  NLType = require('../typechecker');

  StrictMath = require('shim/strictmath');

  NLMath = require('util/nlmath');

  ref = require('../structure/variablespec'), ImmutableVariableSpec = ref.ImmutableVariableSpec, MutableVariableSpec = ref.MutableVariableSpec;

  ref1 = require('util/exception'), ignoring = ref1.ignoring, TopologyInterrupt = ref1.TopologyInterrupt;


  /*
   "Jason, this is craziness!", you say.  "Not quite," I say.  It _is_ kind of lame, but changing turtle members
   needs to be controlled, so that all changes cause updates to be triggered.  And since the `VariableManager` needs
   to know how to set all of the variables, we may as well declare the code for that in a place where it can be
   easily reused. --JAB (6/2/14, 8/28/15)
   */

  ignorantly = ignoring(TopologyInterrupt);

  setXcor = function(newX, seenTurtlesSet) {
    var dx, f, oldX, originPatch;
    if (seenTurtlesSet == null) {
      seenTurtlesSet = {};
    }
    originPatch = this.getPatchHere();
    oldX = this.xcor;
    this.xcor = this.world.topology.wrapX(newX);
    this._updateVarsByName("xcor");
    this._drawLine(oldX, this.ycor, newX, this.ycor);
    if (originPatch !== this.getPatchHere()) {
      originPatch.untrackTurtle(this);
      this.getPatchHere().trackTurtle(this);
    }
    this.linkManager._refresh();
    dx = newX - oldX;
    f = (function(_this) {
      return function(seenTurtles) {
        return function(turtle) {
          return ignorantly(function() {
            return setXcor.call(turtle, turtle.xcor + dx, seenTurtles);
          });
        };
      };
    })(this);
    this._withEachTiedTurtle(f, seenTurtlesSet);
  };

  setYcor = function(newY, seenTurtlesSet) {
    var dy, f, oldY, originPatch;
    if (seenTurtlesSet == null) {
      seenTurtlesSet = {};
    }
    originPatch = this.getPatchHere();
    oldY = this.ycor;
    this.ycor = this.world.topology.wrapY(newY);
    this._updateVarsByName("ycor");
    this._drawLine(this.xcor, oldY, this.xcor, newY);
    if (originPatch !== this.getPatchHere()) {
      originPatch.untrackTurtle(this);
      this.getPatchHere().trackTurtle(this);
    }
    this.linkManager._refresh();
    dy = newY - oldY;
    f = (function(_this) {
      return function(seenTurtles) {
        return function(turtle) {
          return ignorantly(function() {
            return setYcor.call(turtle, turtle.ycor + dy, seenTurtles);
          });
        };
      };
    })(this);
    this._withEachTiedTurtle(f, seenTurtlesSet);
  };

  setBreedShape = function(shape) {
    this._breedShape = shape.toLowerCase();
    if (this._givenShape == null) {
      this._genVarUpdate("shape");
    }
  };

  setBreed = function(breed) {
    var newNames, oldNames, ref2, specialName, trueBreed, type;
    type = NLType(breed);
    trueBreed = (function() {
      if (type.isString()) {
        return this.world.breedManager.get(breed);
      } else if (type.isAgentSet()) {
        specialName = breed.getSpecialName();
        if (specialName != null) {
          return this.world.breedManager.get(specialName);
        } else {
          throw new Error("You can't set BREED to a non-breed agentset.");
        }
      } else {
        return breed;
      }
    }).call(this);
    if ((this._breed != null) && this._breed !== trueBreed) {
      this._givenShape = void 0;
    }
    if (this._breed !== trueBreed) {
      trueBreed.add(this);
      if ((ref2 = this._breed) != null) {
        ref2.remove(this);
      }
      newNames = this._varNamesForBreed(trueBreed);
      oldNames = this._varNamesForBreed(this._breed);
      this._varManager.refineBy(oldNames, newNames);
    }
    this._breed = trueBreed;
    this._genVarUpdate("breed");
    setBreedShape.call(this, trueBreed.getShape());
    if (trueBreed !== this.world.breedManager.turtles()) {
      this.world.breedManager.turtles().add(this);
    }
  };

  setColor = function(color) {
    this._color = ColorModel.wrapColor(color);
    this._genVarUpdate("color");
  };

  setHeading = function(heading, seenTurtlesSet) {
    var dh, oldHeading;
    if (seenTurtlesSet == null) {
      seenTurtlesSet = {};
    }
    oldHeading = this._heading;
    this._heading = NLMath.normalizeHeading(heading);
    this._genVarUpdate("heading");
    dh = NLMath.subtractHeadings(this._heading, oldHeading);
    _handleTiesForHeadingChange.call(this, seenTurtlesSet, dh);
  };

  setIsHidden = function(isHidden) {
    this._hidden = isHidden;
    this._genVarUpdate("hidden?");
  };

  setLabel = function(label) {
    this._label = label;
    this._genVarUpdate("label");
  };

  setLabelColor = function(color) {
    this._labelcolor = ColorModel.wrapColor(color);
    this._genVarUpdate("label-color");
  };

  setShape = function(shape) {
    this._givenShape = shape.toLowerCase();
    this._genVarUpdate("shape");
  };

  setSize = function(size) {
    this._size = size;
    this._genVarUpdate("size");
  };

  _handleTiesForHeadingChange = function(seenTurtlesSet, dh) {
    var filteredPairs, ref2, turtleModePairs, x, y;
    ref2 = this.getCoords(), x = ref2[0], y = ref2[1];
    turtleModePairs = this.linkManager.tieLinks().map((function(_this) {
      return function(arg) {
        var end1, end2, tiemode;
        end1 = arg.end1, end2 = arg.end2, tiemode = arg.tiemode;
        return [(end1 === _this ? end2 : end1), tiemode];
      };
    })(this));
    seenTurtlesSet[this.id] = true;
    filteredPairs = turtleModePairs.filter(function(arg) {
      var id, mode, ref3, result;
      (ref3 = arg[0], id = ref3.id), mode = arg[1];
      result = (seenTurtlesSet[id] == null) && mode !== "none";
      seenTurtlesSet[id] = true;
      return result;
    });
    filteredPairs.forEach((function(_this) {
      return function(arg) {
        var ex, mode, newX, newY, r, theta, turtle, wentBoom;
        turtle = arg[0], mode = arg[1];
        wentBoom = (function() {
          var error;
          try {
            r = this.distance(turtle);
            if (r !== 0) {
              theta = this.towards(turtle) + dh;
              newX = x + r * NLMath.squash(NLMath.sin(theta));
              newY = y + r * NLMath.squash(NLMath.cos(theta));
              turtle.setXY(newX, newY, _.clone(seenTurtlesSet));
            }
            return false;
          } catch (error) {
            ex = error;
            if (ex instanceof TopologyInterrupt) {
              return true;
            } else {
              throw ex;
            }
          }
        }).call(_this);
        if (mode === "fixed" && !wentBoom) {
          return turtle.right(dh, _.clone(seenTurtlesSet));
        }
      };
    })(this));
  };

  Setters = {
    setXcor: setXcor,
    setYcor: setYcor,
    setBreed: setBreed,
    setColor: setColor,
    setHeading: setHeading,
    setIsHidden: setIsHidden,
    setLabel: setLabel,
    setLabelColor: setLabelColor,
    setShape: setShape,
    setSize: setSize
  };

  getBreed = (function() {
    return this.world.turtleManager.turtlesOfBreed(this._breed.name);
  });

  VariableSpecs = [
    new ImmutableVariableSpec('who', function() {
      return this.id;
    }), new MutableVariableSpec('breed', getBreed, setBreed), new MutableVariableSpec('color', (function() {
      return this._color;
    }), setColor), new MutableVariableSpec('heading', (function() {
      return this._heading;
    }), setHeading), new MutableVariableSpec('hidden?', (function() {
      return this._hidden;
    }), setIsHidden), new MutableVariableSpec('label', (function() {
      return this._label;
    }), setLabel), new MutableVariableSpec('label-color', (function() {
      return this._labelcolor;
    }), setLabelColor), new MutableVariableSpec('pen-mode', (function() {
      return this.penManager.getMode().toString();
    }), (function(x) {
      return this.penManager.setPenMode(x);
    })), new MutableVariableSpec('pen-size', (function() {
      return this.penManager.getSize();
    }), (function(x) {
      return this.penManager.setSize(x);
    })), new MutableVariableSpec('shape', (function() {
      return this._getShape();
    }), setShape), new MutableVariableSpec('size', (function() {
      return this._size;
    }), setSize), new MutableVariableSpec('xcor', (function() {
      return this.xcor;
    }), setXcor), new MutableVariableSpec('ycor', (function() {
      return this.ycor;
    }), setYcor)
  ];

  module.exports = {
    Setters: Setters,
    VariableSpecs: VariableSpecs
  };

}).call(this);

},{"../structure/variablespec":"engine/core/structure/variablespec","../typechecker":"engine/core/typechecker","engine/core/colormodel":"engine/core/colormodel","lodash":"lodash","shim/strictmath":"shim/strictmath","util/exception":"util/exception","util/nlmath":"util/nlmath"}],"engine/core/turtlelinkmanager":[function(require,module,exports){
(function() {
  var DeathInterrupt, LinkManager, LinkSet, Nobody, TurtleSet, _, ignoring, linkBreedMatches, linkSetOf, mustNotBeDirected, mustNotBeUndirected, ref, turtleSetOf, uniqueLinks, uniqueTurtles, uniques;

  _ = require('lodash');

  LinkSet = require('./linkset');

  Nobody = require('./nobody');

  TurtleSet = require('./turtleset');

  ref = require('util/exception'), DeathInterrupt = ref.DeathInterrupt, ignoring = ref.ignoring;

  mustNotBeDirected = function(breed) {
    if (breed.isDirected()) {
      return breed.name + " is a directed breed.";
    } else {
      return void 0;
    }
  };

  mustNotBeUndirected = function(breed) {
    if (breed.isUndirected()) {
      return breed + " is an undirected breed.";
    } else {
      return void 0;
    }
  };

  uniques = function(ls) {
    return _(ls).unique().value();
  };

  uniqueLinks = uniques;

  uniqueTurtles = uniques;

  linkSetOf = function(links) {
    return new LinkSet(uniqueLinks(links));
  };

  turtleSetOf = function(turtles) {
    return new TurtleSet(uniqueTurtles(turtles));
  };

  linkBreedMatches = function(breedName) {
    return function(link) {
      return breedName === "LINKS" || breedName === link.getBreedName();
    };
  };

  module.exports = LinkManager = (function() {
    LinkManager._linksOut = void 0;

    LinkManager._linksIn = void 0;

    function LinkManager(_ownerID, _breedManager) {
      this._ownerID = _ownerID;
      this._breedManager = _breedManager;
      this._clear();
    }

    LinkManager.prototype.add = function(link) {
      var arr;
      arr = link.end1.id === this._ownerID ? this._linksOut : this._linksIn;
      arr.push(link);
    };

    LinkManager.prototype.inLinkFrom = function(breedName, otherTurtle) {
      var ref1;
      return (ref1 = _(this._linksIn).find(function(l) {
        return l.end1 === otherTurtle && linkBreedMatches(breedName)(l);
      })) != null ? ref1 : Nobody;
    };

    LinkManager.prototype.inLinkNeighbors = function(breedName) {
      return turtleSetOf(this._neighborsIn(breedName, true));
    };

    LinkManager.prototype.isInLinkNeighbor = function(breedName, turtle) {
      return this.inLinkFrom(breedName, turtle) !== Nobody;
    };

    LinkManager.prototype.isLinkNeighbor = function(breedName, turtle) {
      return this.isOutLinkNeighbor(breedName, turtle) || this.isInLinkNeighbor(breedName, turtle);
    };

    LinkManager.prototype.isOutLinkNeighbor = function(breedName, turtle) {
      return this.outLinkTo(breedName, turtle) !== Nobody;
    };

    LinkManager.prototype.linkWith = function(breedName, otherTurtle) {
      var outLink;
      outLink = this.outLinkTo(breedName, otherTurtle);
      if (outLink !== Nobody) {
        return outLink;
      } else {
        return this.inLinkFrom(breedName, otherTurtle);
      }
    };

    LinkManager.prototype.linkNeighbors = function(breedName) {
      return turtleSetOf(this._neighborsIn(breedName, false).concat(this._neighborsOut(breedName, false)));
    };

    LinkManager.prototype.myInLinks = function(breedName) {
      return new LinkSet(this._linksIn.filter(linkBreedMatches(breedName)));
    };

    LinkManager.prototype.myLinks = function(breedName) {
      return linkSetOf(this._linksIn.filter(linkBreedMatches(breedName)).concat(this._linksOut.filter(linkBreedMatches(breedName))));
    };

    LinkManager.prototype.myOutLinks = function(breedName) {
      return new LinkSet(this._linksOut.filter(linkBreedMatches(breedName)));
    };

    LinkManager.prototype.outLinkNeighbors = function(breedName) {
      return turtleSetOf(this._neighborsOut(breedName, true));
    };

    LinkManager.prototype.outLinkTo = function(breedName, otherTurtle) {
      var ref1;
      return (ref1 = _(this._linksOut).find(function(l) {
        return l.end2 === otherTurtle && linkBreedMatches(breedName)(l);
      })) != null ? ref1 : Nobody;
    };

    LinkManager.prototype.remove = function(link) {
      var arr;
      arr = link.end1.id === this._ownerID ? this._linksOut : this._linksIn;
      arr.splice(arr.indexOf(link), 1);
    };

    LinkManager.prototype.tieLinks = function() {
      return this._linksIn.filter(function(link) {
        return !link.isDirected;
      }).concat(this._linksOut);
    };

    LinkManager.prototype._clear = function() {
      var oldLinks;
      oldLinks = (this._linksOut != null) && (this._linksIn != null) ? this._linksIn.concat(this._linksOut) : [];
      this._linksOut = [];
      this._linksIn = [];
      oldLinks.forEach(function(link) {
        return ignoring(DeathInterrupt)((function(_this) {
          return function() {
            return link.die();
          };
        })(this));
      });
    };

    LinkManager.prototype._refresh = function() {
      this._linksIn.concat(this._linksOut).forEach(function(link) {
        link.updateEndRelatedVars();
      });
    };

    LinkManager.prototype._neighborsOut = function(breedName, isDirected) {
      return this._filterNeighbors(this._linksOut, breedName, isDirected).map(function(l) {
        return l.end2;
      });
    };

    LinkManager.prototype._neighborsIn = function(breedName, isDirected) {
      return this._filterNeighbors(this._linksIn, breedName, isDirected).map(function(l) {
        return l.end1;
      });
    };

    LinkManager.prototype._filterNeighbors = function(neighborArr, breedName, isDirected) {
      return neighborArr.filter((function(_this) {
        return function(link) {
          return linkBreedMatches(breedName)(link) && _this._isCorrectlyDirected(link, isDirected);
        };
      })(this));
    };

    LinkManager.prototype._isCorrectlyDirected = function(link, isDirected) {
      return isDirected === this._breedManager.get(link.getBreedName()).isDirected();
    };

    return LinkManager;

  })();

}).call(this);

},{"./linkset":"engine/core/linkset","./nobody":"engine/core/nobody","./turtleset":"engine/core/turtleset","lodash":"lodash","util/exception":"util/exception"}],"engine/core/turtleset":[function(require,module,exports){
(function() {
  var AbstractAgentSet, DeadSkippingIterator, TurtleSet,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  AbstractAgentSet = require('./abstractagentset');

  DeadSkippingIterator = require('./structure/deadskippingiterator');

  module.exports = TurtleSet = (function(superClass) {
    extend(TurtleSet, superClass);

    function TurtleSet(_agents, specialName) {
      this._agents = _agents;
      TurtleSet.__super__.constructor.call(this, this._agents, "turtles", specialName);
    }

    TurtleSet.prototype.iterator = function() {
      return new DeadSkippingIterator(this._agents);
    };

    return TurtleSet;

  })(AbstractAgentSet);

}).call(this);

},{"./abstractagentset":"engine/core/abstractagentset","./structure/deadskippingiterator":"engine/core/structure/deadskippingiterator"}],"engine/core/turtle":[function(require,module,exports){
(function() {
  var AbstractAgentSet, ColorModel, Comparator, Death, Down, Erase, ExtraVariableSpec, NLMath, NLType, Nobody, PenManager, Setters, Stamp, StampErase, StampMode, TopologyInterrupt, Turtle, TurtleLinkManager, TurtleSet, VariableManager, VariableSpecs, _, ignorantly, ignoring, makePenLines, ref, ref1, ref2, ref3,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('lodash');

  AbstractAgentSet = require('./abstractagentset');

  ColorModel = require('engine/core/colormodel');

  Nobody = require('./nobody');

  TurtleLinkManager = require('./turtlelinkmanager');

  TurtleSet = require('./turtleset');

  NLType = require('./typechecker');

  VariableManager = require('./structure/variablemanager');

  makePenLines = require('./turtle/makepenlines');

  Comparator = require('util/comparator');

  NLMath = require('util/nlmath');

  ref = require('./structure/penmanager'), PenManager = ref.PenManager, (ref1 = ref.PenStatus, Down = ref1.Down, Erase = ref1.Erase);

  ExtraVariableSpec = require('./structure/variablespec').ExtraVariableSpec;

  ref2 = require('util/exception'), Death = ref2.DeathInterrupt, ignoring = ref2.ignoring, TopologyInterrupt = ref2.TopologyInterrupt;

  ref3 = require('./turtle/turtlevariables'), Setters = ref3.Setters, VariableSpecs = ref3.VariableSpecs;

  ignorantly = ignoring(TopologyInterrupt);

  StampMode = (function() {
    function StampMode(name1) {
      this.name = name1;
    }

    return StampMode;

  })();

  Stamp = new StampMode("normal");

  StampErase = new StampMode("erase");

  module.exports = Turtle = (function() {
    Turtle.prototype._breed = void 0;

    Turtle.prototype._breedShape = void 0;

    Turtle.prototype._updateVarsByName = void 0;

    Turtle.prototype._varManager = void 0;

    Turtle.prototype.linkManager = void 0;

    function Turtle(world, id1, _genUpdate, _registerLineDraw, _registerTurtleStamp, _registerDeath, _createTurtle, _removeTurtle, _color, _heading, xcor, ycor, breed, _label, _labelcolor, _hidden, _size, _givenShape, genPenManager) {
      var varNames;
      this.world = world;
      this.id = id1;
      this._genUpdate = _genUpdate;
      this._registerLineDraw = _registerLineDraw;
      this._registerTurtleStamp = _registerTurtleStamp;
      this._registerDeath = _registerDeath;
      this._createTurtle = _createTurtle;
      this._removeTurtle = _removeTurtle;
      this._color = _color != null ? _color : 0;
      this._heading = _heading != null ? _heading : 0;
      this.xcor = xcor != null ? xcor : 0;
      this.ycor = ycor != null ? ycor : 0;
      if (breed == null) {
        breed = this.world.breedManager.turtles();
      }
      this._label = _label != null ? _label : "";
      this._labelcolor = _labelcolor != null ? _labelcolor : 9.9;
      this._hidden = _hidden != null ? _hidden : false;
      this._size = _size != null ? _size : 1.0;
      this._givenShape = _givenShape;
      if (genPenManager == null) {
        genPenManager = (function(_this) {
          return function(self) {
            return new PenManager(_this._genUpdate(self));
          };
        })(this);
      }
      this.patchAt = bind(this.patchAt, this);
      this._updateVarsByName = this._genUpdate(this);
      this.penManager = genPenManager(this);
      this.linkManager = new TurtleLinkManager(this.id, this.world.breedManager);
      varNames = this._varNamesForBreed(breed);
      this._varManager = this._genVarManager(varNames);
      Setters.setBreed.call(this, breed);
      if (this._givenShape != null) {
        Setters.setShape.call(this, this._givenShape);
      }
      this.getPatchHere().trackTurtle(this);
    }

    Turtle.prototype.getBreedName = function() {
      return this._breed.name;
    };

    Turtle.prototype.canMove = function(distance) {
      return this.patchAhead(distance) !== Nobody;
    };

    Turtle.prototype.distance = function(agent) {
      return this.world.topology.distance(this.xcor, this.ycor, agent);
    };

    Turtle.prototype.distanceXY = function(x, y) {
      return this.world.topology.distanceXY(this.xcor, this.ycor, x, y);
    };

    Turtle.prototype.getCoords = function() {
      return [this.xcor, this.ycor];
    };

    Turtle.prototype.towards = function(agent) {
      var ref4, x, y;
      ref4 = agent.getCoords(), x = ref4[0], y = ref4[1];
      return this.towardsXY(x, y);
    };

    Turtle.prototype.towardsXY = function(x, y) {
      return this.world.topology.towards(this.xcor, this.ycor, x, y);
    };

    Turtle.prototype.faceXY = function(x, y) {
      if (x !== this.xcor || y !== this.ycor) {
        Setters.setHeading.call(this, this.world.topology.towards(this.xcor, this.ycor, x, y));
      }
    };

    Turtle.prototype.face = function(agent) {
      var ref4, x, y;
      ref4 = agent.getCoords(), x = ref4[0], y = ref4[1];
      this.faceXY(x, y);
    };

    Turtle.prototype.inCone = function(agents, distance, angle) {
      if (distance < 0) {
        throw new Error("IN-CONE cannot take a negative radius.");
      } else if (angle < 0) {
        throw new Error("IN-CONE cannot take a negative angle.");
      } else if (angle > 360) {
        throw new Error("IN-CONE cannot take an angle greater than 360.");
      } else {
        return this.world.topology.inCone(this.xcor, this.ycor, NLMath.normalizeHeading(this._heading), agents, distance, angle);
      }
    };

    Turtle.prototype.inRadius = function(agents, radius) {
      return this.world.topology.inRadius(this.xcor, this.ycor, agents, radius);
    };

    Turtle.prototype.patchAt = function(dx, dy) {
      return this.world.patchAtCoords(this.xcor + dx, this.ycor + dy);
    };

    Turtle.prototype.turtlesAt = function(dx, dy) {
      return this.getPatchHere().turtlesAt(dx, dy);
    };

    Turtle.prototype.breedAt = function(breedName, dx, dy) {
      return this.getPatchHere().breedAt(breedName, dx, dy);
    };

    Turtle.prototype.otherEnd = function() {
      if (this === this.world.selfManager.myself().end1) {
        return this.world.selfManager.myself().end2;
      } else {
        return this.world.selfManager.myself().end1;
      }
    };

    Turtle.prototype.patchAtHeadingAndDistance = function(angle, distance) {
      return this.world.patchAtHeadingAndDistanceFrom(angle, distance, this.xcor, this.ycor);
    };

    Turtle.prototype.patchRightAndAhead = function(angle, distance) {
      return this.patchAtHeadingAndDistance(this._heading + angle, distance);
    };

    Turtle.prototype.patchLeftAndAhead = function(angle, distance) {
      return this.patchRightAndAhead(-angle, distance);
    };

    Turtle.prototype.patchAhead = function(distance) {
      return this.patchRightAndAhead(0, distance);
    };

    Turtle.prototype.ask = function(f) {
      var base;
      this.world.selfManager.askAgent(f)(this);
      if (typeof (base = this.world.selfManager.self()).isDead === "function" ? base.isDead() : void 0) {
        throw new Death;
      }
    };

    Turtle.prototype.projectionBy = function(f) {
      if (!this.isDead()) {
        return this.world.selfManager.askAgent(f)(this);
      } else {
        throw new Error("That " + this._breed.singular + " is dead.");
      }
    };

    Turtle.prototype.fd = function(distance) {
      var increment, remaining;
      increment = distance > 0 ? 1 : -1;
      remaining = distance;
      if (distance > 0) {
        while (remaining >= increment && this.jumpIfAble(increment)) {
          remaining -= increment;
        }
      } else if (distance < 0) {
        while (remaining <= increment && this.jumpIfAble(increment)) {
          remaining -= increment;
        }
      }
      this.jumpIfAble(remaining);
    };

    Turtle.prototype.jumpIfAble = function(distance) {
      var canMove;
      canMove = this.canMove(distance);
      if (canMove) {
        this._jump(distance);
      }
      return canMove;
    };

    Turtle.prototype._jump = function(distance) {
      this._drawJumpLine(this.xcor, this.ycor, distance);
      this._setXandY(this.xcor + distance * this.dx(), this.ycor + distance * this.dy());
    };

    Turtle.prototype.dx = function() {
      return NLMath.squash(NLMath.sin(this._heading));
    };

    Turtle.prototype.dy = function() {
      return NLMath.squash(NLMath.cos(this._heading));
    };

    Turtle.prototype.right = function(angle, seenTurtlesSet) {
      var newHeading;
      if (seenTurtlesSet == null) {
        seenTurtlesSet = {};
      }
      newHeading = this._heading + angle;
      Setters.setHeading.call(this, newHeading, seenTurtlesSet);
    };

    Turtle.prototype.setXY = function(x, y, seenTurtlesSet) {
      var error, error1, origXcor, origYcor;
      if (seenTurtlesSet == null) {
        seenTurtlesSet = {};
      }
      origXcor = this.xcor;
      origYcor = this.ycor;
      try {
        this._setXandY(x, y, seenTurtlesSet);
        this._drawLine(origXcor, origYcor, x, y);
      } catch (error1) {
        error = error1;
        this._setXandY(origXcor, origYcor, seenTurtlesSet);
        if (error instanceof TopologyInterrupt) {
          throw new TopologyInterrupt("The point [ " + x + " , " + y + " ] is outside of the boundaries of the world and wrapping is not permitted in one or both directions.");
        } else {
          throw error;
        }
      }
    };

    Turtle.prototype.goHome = function() {
      this.setXY(0, 0);
    };

    Turtle.prototype.hideTurtle = function(shouldHide) {
      Setters.setIsHidden.call(this, shouldHide);
    };

    Turtle.prototype.isBreed = function(breedName) {
      return this._breed.name.toUpperCase() === breedName.toUpperCase();
    };

    Turtle.prototype.isDead = function() {
      return this.id === -1;
    };

    Turtle.prototype.die = function() {
      this._breed.remove(this);
      if (!this.isDead()) {
        this._removeTurtle(this.id);
        this._seppuku();
        this.linkManager._clear();
        this.id = -1;
        this.getPatchHere().untrackTurtle(this);
        this.world.observer.unfocus(this);
      }
      throw new Death("Call only from inside an askAgent block");
    };

    Turtle.prototype.getVariable = function(varName) {
      return this._varManager[varName];
    };

    Turtle.prototype.setVariable = function(varName, value) {
      this._varManager[varName] = value;
    };

    Turtle.prototype.getPatchHere = function() {
      return this.world.getPatchAt(this.xcor, this.ycor);
    };

    Turtle.prototype.getPatchVariable = function(varName) {
      return this.getPatchHere().getVariable(varName);
    };

    Turtle.prototype.setPatchVariable = function(varName, value) {
      this.getPatchHere().setVariable(varName, value);
    };

    Turtle.prototype.getNeighbors = function() {
      return this.getPatchHere().getNeighbors();
    };

    Turtle.prototype.getNeighbors4 = function() {
      return this.getPatchHere().getNeighbors4();
    };

    Turtle.prototype.turtlesHere = function() {
      return this.getPatchHere().turtlesHere();
    };

    Turtle.prototype.breedHere = function(breedName) {
      return this.getPatchHere().breedHere(breedName);
    };

    Turtle.prototype.hatch = function(n, breedName) {
      var breed, isNameValid, newTurtles;
      isNameValid = (breedName != null) && !_(breedName).isEmpty();
      breed = isNameValid ? this.world.breedManager.get(breedName) : this._breed;
      newTurtles = _(0).range(n).map((function(_this) {
        return function() {
          return _this._makeTurtleCopy(breed);
        };
      })(this)).value();
      return new TurtleSet(newTurtles);
    };

    Turtle.prototype._makeTurtleCopy = function(breed) {
      var shape, turtle, varNames;
      shape = breed === this._breed ? this._givenShape : void 0;
      turtle = this._createTurtle(this._color, this._heading, this.xcor, this.ycor, breed, this._label, this._labelcolor, this._hidden, this._size, shape, (function(_this) {
        return function(self) {
          return _this.penManager.clone(_this._genUpdate(self));
        };
      })(this));
      varNames = this._varNamesForBreed(breed);
      _(varNames).forEach((function(_this) {
        return function(varName) {
          turtle.setVariable(varName, _this.getVariable(varName));
        };
      })(this)).value();
      return turtle;
    };

    Turtle.prototype._varNamesForBreed = function(breed) {
      var turtlesBreed;
      turtlesBreed = this.world.breedManager.turtles();
      if (breed === turtlesBreed || (breed == null)) {
        return turtlesBreed.varNames;
      } else {
        return turtlesBreed.varNames.concat(breed.varNames);
      }
    };

    Turtle.prototype.moveTo = function(agent) {
      var ref4, x, y;
      ref4 = agent.getCoords(), x = ref4[0], y = ref4[1];
      this.setXY(x, y);
    };

    Turtle.prototype.followMe = function() {
      this.world.observer.follow(this);
    };

    Turtle.prototype.rideMe = function() {
      this.world.observer.ride(this);
    };

    Turtle.prototype.watchMe = function() {
      this.world.observer.watch(this);
    };

    Turtle.prototype.stamp = function() {
      this._drawStamp(Stamp);
    };

    Turtle.prototype.stampErase = function() {
      this._drawStamp(StampErase);
    };

    Turtle.prototype.compare = function(x) {
      if (NLType(x).isTurtle()) {
        return Comparator.numericCompare(this.id, x.id);
      } else {
        return Comparator.NOT_EQUALS;
      }
    };

    Turtle.prototype.toString = function() {
      if (!this.isDead()) {
        return "(" + this._breed.singular + " " + this.id + ")";
      } else {
        return "nobody";
      }
    };

    Turtle.prototype.varNames = function() {
      return this._varManager.names();
    };

    Turtle.prototype._drawStamp = function(mode) {
      this._registerTurtleStamp(this.xcor, this.ycor, this._size, this._heading, ColorModel.colorToRGB(this._color), this._getShape(), mode.name);
    };

    Turtle.prototype._drawLine = function(oldX, oldY, newX, newY) {
      var penMode, wrappedX, wrappedY;
      penMode = this.penManager.getMode();
      if ((penMode === Down || penMode === Erase) && (oldX !== newX || oldY !== newY)) {
        wrappedX = this.world.topology.wrapX(newX);
        wrappedY = this.world.topology.wrapY(newY);
        this._registerLineDraw(oldX, oldY, wrappedX, wrappedY, ColorModel.colorToRGB(this._color), this.penManager.getSize(), this.penManager.getMode().toString());
      }
    };

    Turtle.prototype._drawJumpLine = function(x, y, dist) {
      var color, lines, maxPxcor, maxPycor, minPxcor, minPycor, mode, penMode, ref4, size;
      penMode = this.penManager.getMode();
      if (penMode === Down || penMode === Erase) {
        color = ColorModel.colorToRGB(this._color);
        size = this.penManager.getSize();
        mode = this.penManager.getMode().toString();
        ref4 = this.world.topology, minPxcor = ref4.minPxcor, maxPxcor = ref4.maxPxcor, minPycor = ref4.minPycor, maxPycor = ref4.maxPycor;
        lines = makePenLines(x, y, NLMath.normalizeHeading(this._heading), dist, minPxcor - 0.5, maxPxcor + 0.5, minPycor - 0.5, maxPycor + 0.5);
        _(lines).forEach((function(_this) {
          return function(arg) {
            var x1, x2, y1, y2;
            x1 = arg.x1, y1 = arg.y1, x2 = arg.x2, y2 = arg.y2;
            _this._registerLineDraw(x1, y1, x2, y2, color, size, mode);
          };
        })(this)).value();
      }
    };

    Turtle.prototype._getShape = function() {
      var ref4;
      return (ref4 = this._givenShape) != null ? ref4 : this._breedShape;
    };

    Turtle.prototype._linkBreedMatches = function(breedName) {
      return function(link) {
        return breedName === "LINKS" || breedName === link.getBreedName();
      };
    };

    Turtle.prototype._seppuku = function() {
      this._registerDeath(this.id);
    };

    Turtle.prototype._tiedTurtlesRaw = function() {
      var f, fixeds, links, others, ref4;
      links = this.linkManager.tieLinks().filter(function(l) {
        return l.tiemode !== "none";
      });
      f = (function(_this) {
        return function(arg, arg1) {
          var end1, end2, fixeds, others, tiemode, turtle;
          fixeds = arg[0], others = arg[1];
          end1 = arg1.end1, end2 = arg1.end2, tiemode = arg1.tiemode;
          turtle = end1 === _this ? end2 : end1;
          if (tiemode === "fixed") {
            return [fixeds.concat([turtle]), others];
          } else {
            return [fixeds, others.concat([turtle])];
          }
        };
      })(this);
      ref4 = _(links).foldl(f, [[], []]), fixeds = ref4[0], others = ref4[1];
      return {
        fixeds: fixeds,
        others: others
      };
    };

    Turtle.prototype._tiedTurtles = function() {
      var fixeds, others, ref4;
      ref4 = this._tiedTurtlesRaw(), fixeds = ref4.fixeds, others = ref4.others;
      return _(fixeds.concat(others)).unique(false, function(x) {
        return x.id;
      }).value();
    };

    Turtle.prototype._fixedTiedTurtles = function() {
      return _(this._tiedTurtlesRaw().fixeds).unique(false, function(x) {
        return x.id;
      }).value();
    };

    Turtle.prototype._genVarManager = function(extraVarNames) {
      var allSpecs, extraSpecs;
      extraSpecs = extraVarNames.map(function(name) {
        return new ExtraVariableSpec(name);
      });
      allSpecs = VariableSpecs.concat(extraSpecs);
      return new VariableManager(this, allSpecs);
    };

    Turtle.prototype._genVarUpdate = function(varName) {
      this._updateVarsByName(varName);
    };

    Turtle.prototype._setXandY = function(newX, newY, seenTurtlesSet) {
      var dx, dy, f, oldX, oldY, originPatch;
      if (seenTurtlesSet == null) {
        seenTurtlesSet = {};
      }
      originPatch = this.getPatchHere();
      oldX = this.xcor;
      oldY = this.ycor;
      this.xcor = this.world.topology.wrapX(newX);
      this.ycor = this.world.topology.wrapY(newY);
      this._updateVarsByName("xcor", "ycor");
      if (originPatch !== this.getPatchHere()) {
        originPatch.untrackTurtle(this);
        this.getPatchHere().trackTurtle(this);
      }
      this.linkManager._refresh();
      dx = newX - oldX;
      dy = newY - oldY;
      f = (function(_this) {
        return function(seenTurtles) {
          return function(turtle) {
            return ignorantly(function() {
              return turtle._setXandY(turtle.xcor + dx, turtle.ycor + dy, seenTurtles);
            });
          };
        };
      })(this);
      this._withEachTiedTurtle(f, seenTurtlesSet);
    };

    Turtle.prototype._withEachTiedTurtle = function(f, seenTurtlesSet) {
      var turtles;
      seenTurtlesSet[this.id] = true;
      turtles = this._tiedTurtles().filter(function(arg) {
        var id;
        id = arg.id;
        return seenTurtlesSet[id] == null;
      });
      turtles.forEach(function(arg) {
        var id;
        id = arg.id;
        return seenTurtlesSet[id] = true;
      });
      turtles.forEach(f(seenTurtlesSet));
    };

    return Turtle;

  })();

}).call(this);

},{"./abstractagentset":"engine/core/abstractagentset","./nobody":"engine/core/nobody","./structure/penmanager":"engine/core/structure/penmanager","./structure/variablemanager":"engine/core/structure/variablemanager","./structure/variablespec":"engine/core/structure/variablespec","./turtle/makepenlines":"engine/core/turtle/makepenlines","./turtle/turtlevariables":"engine/core/turtle/turtlevariables","./turtlelinkmanager":"engine/core/turtlelinkmanager","./turtleset":"engine/core/turtleset","./typechecker":"engine/core/typechecker","engine/core/colormodel":"engine/core/colormodel","lodash":"lodash","util/comparator":"util/comparator","util/exception":"util/exception","util/nlmath":"util/nlmath"}],"engine/core/typechecker":[function(require,module,exports){
(function() {
  var AbstractAgentSet, JSType, Link, LinkSet, NLType, Nobody, Patch, PatchSet, Turtle, TurtleSet;

  NLType = (function() {
    function NLType(_x) {
      this._x = _x;
    }

    return NLType;

  })();

  module.exports = function(x) {
    return new NLType(x);
  };

  AbstractAgentSet = require('./abstractagentset');

  Link = require('./link');

  LinkSet = require('./linkset');

  Nobody = require('./nobody');

  Patch = require('./patch');

  PatchSet = require('./patchset');

  Turtle = require('./turtle');

  TurtleSet = require('./turtleset');

  JSType = require('util/typechecker');

  NLType.prototype.isAgent = function() {
    return this.isTurtle() || this.isPatch() || this.isLink();
  };

  NLType.prototype.isAgentSet = function() {
    return this._x instanceof AbstractAgentSet;
  };

  NLType.prototype.isBoolean = function() {
    return JSType(this._x).isBoolean();
  };

  NLType.prototype.isBreed = function(breedName) {
    var base, base1;
    return !(typeof (base = this._x).isDead === "function" ? base.isDead() : void 0) && (typeof (base1 = this._x).isBreed === "function" ? base1.isBreed(breedName) : void 0) === true;
  };

  NLType.prototype.isBreedSet = function(breedName) {
    return this.isAgentSet() && (this._x.getSpecialName() != null) && this._x.getSpecialName() === breedName;
  };

  NLType.prototype.isCommandTask = function() {
    return JSType(this._x).isFunction() && !this._x.isReporter;
  };

  NLType.prototype.isDirectedLink = function() {
    return this.isLink() && this._x.isDirected;
  };

  NLType.prototype.isLinkSet = function() {
    return this._x instanceof LinkSet;
  };

  NLType.prototype.isLink = function() {
    return this._x instanceof Link;
  };

  NLType.prototype.isList = function() {
    return JSType(this._x).isArray();
  };

  NLType.prototype.isNobody = function() {
    return this._x === Nobody;
  };

  NLType.prototype.isNumber = function() {
    return JSType(this._x).isNumber();
  };

  NLType.prototype.isPatchSet = function() {
    return this._x instanceof PatchSet;
  };

  NLType.prototype.isPatch = function() {
    return this._x instanceof Patch;
  };

  NLType.prototype.isReporterTask = function() {
    return JSType(this._x).isFunction() && this._x.isReporter;
  };

  NLType.prototype.isString = function() {
    return JSType(this._x).isString();
  };

  NLType.prototype.isTurtleSet = function() {
    return this._x instanceof TurtleSet;
  };

  NLType.prototype.isTurtle = function() {
    return this._x instanceof Turtle;
  };

  NLType.prototype.isUndirectedLink = function() {
    return this.isLink() && !this._x.isDirected;
  };

  NLType.prototype.isValidAgent = function() {
    return this.isValidTurtle() || this.isPatch() || this.isValidLink();
  };

  NLType.prototype.isValidDirectedLink = function() {
    return this.isDirectedLink() && !this._x.isDead();
  };

  NLType.prototype.isValidLink = function() {
    return this.isLink() && !this._x.isDead();
  };

  NLType.prototype.isValidTurtle = function() {
    return this.isTurtle() && !this._x.isDead();
  };

  NLType.prototype.isValidUndirectedLink = function() {
    return this.isUndirectedLink() && !this._x.isDead();
  };

}).call(this);

},{"./abstractagentset":"engine/core/abstractagentset","./link":"engine/core/link","./linkset":"engine/core/linkset","./nobody":"engine/core/nobody","./patch":"engine/core/patch","./patchset":"engine/core/patchset","./turtle":"engine/core/turtle","./turtleset":"engine/core/turtleset","util/typechecker":"util/typechecker"}],"engine/core/world/idmanager":[function(require,module,exports){
(function() {
  var IDManager;

  module.exports = IDManager = (function() {
    IDManager.prototype._count = void 0;

    function IDManager() {
      this.reset();
    }

    IDManager.prototype.reset = function() {
      this._count = 0;
    };

    IDManager.prototype.next = function() {
      return this._count++;
    };

    IDManager.prototype.suspendDuring = function(f) {
      var oldCount;
      oldCount = this._count;
      f();
      this._count = oldCount;
    };

    return IDManager;

  })();

}).call(this);

},{}],"engine/core/world/linkmanager":[function(require,module,exports){
(function() {
  var Builtins, IDManager, Link, LinkManager, LinkSet, Nobody, SortedLinks, _, stableSort,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('lodash');

  Link = require('../link');

  LinkSet = require('../linkset');

  Nobody = require('../nobody');

  Builtins = require('../structure/builtins');

  IDManager = require('./idmanager');

  SortedLinks = require('./sortedlinks');

  stableSort = require('util/stablesort');

  module.exports = LinkManager = (function() {
    LinkManager.prototype._linkArrCache = void 0;

    LinkManager.prototype._links = void 0;

    LinkManager.prototype._linksFrom = void 0;

    LinkManager.prototype._idManager = void 0;

    LinkManager.prototype._linksTo = void 0;

    function LinkManager(_world, _breedManager, _updater, _notifyIsDirected, _notifyIsUndirected) {
      this._world = _world;
      this._breedManager = _breedManager;
      this._updater = _updater;
      this._notifyIsDirected = _notifyIsDirected;
      this._notifyIsUndirected = _notifyIsUndirected;
      this._removeLink = bind(this._removeLink, this);
      this.linksOfBreed = bind(this.linksOfBreed, this);
      this.clear();
    }

    LinkManager.prototype.clear = function() {
      this._linkArrCache = void 0;
      this._links = new SortedLinks;
      this._linksFrom = {};
      this._idManager = new IDManager;
      return this._linksTo = {};
    };

    LinkManager.prototype.createDirectedLink = function(from, to, breedName) {
      if (breedName.toUpperCase() === "LINKS") {
        this._notifyIsDirected();
      }
      return this._createLink(true, from, to, breedName);
    };

    LinkManager.prototype.createDirectedLinks = function(source, others, breedName) {
      if (breedName.toUpperCase() === "LINKS") {
        this._notifyIsDirected();
      }
      return this._createLinksBy((function(_this) {
        return function(turtle) {
          return _this._createLink(true, source, turtle, breedName);
        };
      })(this))(others);
    };

    LinkManager.prototype.createReverseDirectedLinks = function(source, others, breedName) {
      if (breedName.toUpperCase() === "LINKS") {
        this._notifyIsDirected();
      }
      return this._createLinksBy((function(_this) {
        return function(turtle) {
          return _this._createLink(true, turtle, source, breedName);
        };
      })(this))(others);
    };

    LinkManager.prototype.createUndirectedLink = function(source, other, breedName) {
      return this._createLink(false, source, other, breedName);
    };

    LinkManager.prototype.createUndirectedLinks = function(source, others, breedName) {
      return this._createLinksBy((function(_this) {
        return function(turtle) {
          return _this._createLink(false, source, turtle, breedName);
        };
      })(this))(others);
    };

    LinkManager.prototype.getLink = function(fromId, toId, breedName) {
      var findFunc, isDirected, ref;
      if (breedName == null) {
        breedName = "LINKS";
      }
      isDirected = this._breedManager.get(breedName).isDirected();
      findFunc = function(link) {
        return link.getBreedName().toLowerCase() === breedName.toLowerCase() && (link.end1.id === fromId && link.end2.id === toId) || (!isDirected && link.end1.id === toId && link.end2.id === fromId);
      };
      return (ref = this._links.find(findFunc)) != null ? ref : Nobody;
    };

    LinkManager.prototype.links = function() {
      var thunk;
      thunk = ((function(_this) {
        return function() {
          return _this._linkArray();
        };
      })(this));
      return new LinkSet(thunk, "links");
    };

    LinkManager.prototype.linksOfBreed = function(breedName) {
      var thunk;
      thunk = ((function(_this) {
        return function() {
          return stableSort(_this._breedManager.get(breedName).members)(function(x, y) {
            return x.compare(y).toInt;
          });
        };
      })(this));
      return new LinkSet(thunk, breedName);
    };

    LinkManager.prototype._linkArray = function() {
      if (this._linkArrCache == null) {
        this._linkArrCache = this._links.toArray();
      }
      return this._linkArrCache;
    };

    LinkManager.prototype._removeLink = function(link) {
      var l, remove;
      l = this._links.find(function(arg) {
        var id;
        id = arg.id;
        return id === link.id;
      });
      this._links = this._links.remove(l);
      this._linkArrCache = void 0;
      if (this._links.isEmpty()) {
        this._notifyIsUndirected();
      }
      remove = function(set, id1, id2) {
        if (set != null) {
          return set[id1] = _(set[id1]).without(id2).value();
        }
      };
      remove(this._linksFrom[link.getBreedName()], link.end1.id, link.end2.id);
      if (!link.isDirected) {
        remove(this._linksTo[link.getBreedName()], link.end2.id, link.end1.id);
      }
    };

    LinkManager.prototype._createLink = function(isDirected, from, to, breedName) {
      var breed, end1, end2, link, ref;
      ref = from.id < to.id || isDirected ? [from, to] : [to, from], end1 = ref[0], end2 = ref[1];
      if (!this._linkExists(end1.id, end2.id, isDirected, breedName)) {
        breed = this._breedManager.get(breedName);
        link = new Link(this._idManager.next(), isDirected, end1, end2, this._world, this._updater.updated, this._updater.registerDeadLink, this._removeLink, this._updater.registerLinkStamp, this.linksOfBreed, breed);
        this._updater.updated(link).apply(null, Builtins.linkBuiltins);
        this._updater.updated(link).apply(null, Builtins.linkExtras);
        this._links.insert(link);
        this._linkArrCache = void 0;
        this._insertIntoSets(end1.id, end2.id, isDirected, breedName);
        return link;
      } else {
        return Nobody;
      }
    };

    LinkManager.prototype._createLinksBy = function(mkLink) {
      return function(turtles) {
        var isLink, links;
        isLink = function(other) {
          return other !== Nobody;
        };
        links = turtles.toArray().map(mkLink).filter(isLink);
        return new LinkSet(links);
      };
    };

    LinkManager.prototype._insertIntoSets = function(fromID, toID, isDirected, breedName) {
      var insertIntoSet;
      insertIntoSet = function(set, id1, id2) {
        var neighbors;
        if (set[breedName] == null) {
          set[breedName] = {};
        }
        neighbors = set[breedName][id1];
        if (neighbors != null) {
          return neighbors.push(id2);
        } else {
          return set[breedName][id1] = [id2];
        }
      };
      insertIntoSet(this._linksFrom, fromID, toID);
      if (!isDirected) {
        insertIntoSet(this._linksTo, toID, fromID);
      }
    };

    LinkManager.prototype._linkExists = function(id1, id2, isDirected, breedName) {
      var ref, ref1;
      return _((ref = this._linksFrom[breedName]) != null ? ref[id1] : void 0).contains(id2) || (!isDirected && _((ref1 = this._linksTo[breedName]) != null ? ref1[id1] : void 0).contains(id2));
    };

    return LinkManager;

  })();

}).call(this);

},{"../link":"engine/core/link","../linkset":"engine/core/linkset","../nobody":"engine/core/nobody","../structure/builtins":"engine/core/structure/builtins","./idmanager":"engine/core/world/idmanager","./sortedlinks":"engine/core/world/sortedlinks","lodash":"lodash","util/stablesort":"util/stablesort"}],"engine/core/world/sortedlinks":[function(require,module,exports){
(function() {
  var Mori, SortedLinks, linkCompare;

  linkCompare = require('../structure/linkcompare');

  Mori = require('mori');

  module.exports = SortedLinks = (function() {
    SortedLinks._links = void 0;

    function SortedLinks() {
      this._links = Mori.sortedSetBy(linkCompare);
    }

    SortedLinks.prototype.insert = function(link) {
      this._links = Mori.conj(this._links, link);
      return this;
    };

    SortedLinks.prototype.remove = function(link) {
      this._links = Mori.disj(this._links, link);
      return this;
    };

    SortedLinks.prototype.find = function(pred) {
      return Mori.first(Mori.filter(pred, this._links));
    };

    SortedLinks.prototype.isEmpty = function() {
      return Mori.isEmpty(this._links);
    };

    SortedLinks.prototype.toArray = function() {
      return Mori.toJs(this._links);
    };

    return SortedLinks;

  })();

}).call(this);

},{"../structure/linkcompare":"engine/core/structure/linkcompare","mori":"mori"}],"engine/core/world/ticker":[function(require,module,exports){
(function() {
  var EvilSentinel, Exception, Ticker;

  Exception = require('util/exception');

  EvilSentinel = -1;

  module.exports = Ticker = (function() {
    Ticker.prototype._count = void 0;

    function Ticker(_onReset, _onTick, _updateFunc) {
      this._onReset = _onReset;
      this._onTick = _onTick;
      this._updateFunc = _updateFunc;
      this._count = EvilSentinel;
    }

    Ticker.prototype.reset = function() {
      this._updateTicks(function() {
        return 0;
      });
      this._onReset();
      this._onTick();
    };

    Ticker.prototype.clear = function() {
      this._updateTicks(function() {
        return EvilSentinel;
      });
    };

    Ticker.prototype.tick = function() {
      if (this.ticksAreStarted()) {
        this._updateTicks(function(counter) {
          return counter + 1;
        });
      } else {
        throw new Error("The tick counter has not been started yet. Use RESET-TICKS.");
      }
      this._onTick();
    };

    Ticker.prototype.tickAdvance = function(n) {
      if (n < 0) {
        throw new Error("Cannot advance the tick counter by a negative amount.");
      } else if (this.ticksAreStarted()) {
        return this._updateTicks(function(counter) {
          return counter + n;
        });
      } else {
        throw new Error("The tick counter has not been started yet. Use RESET-TICKS.");
      }
    };

    Ticker.prototype.ticksAreStarted = function() {
      return this._count !== EvilSentinel;
    };

    Ticker.prototype.tickCount = function() {
      if (this.ticksAreStarted()) {
        return this._count;
      } else {
        throw new Error("The tick counter has not been started yet. Use RESET-TICKS.");
      }
    };

    Ticker.prototype._updateTicks = function(updateCountFunc) {
      this._count = updateCountFunc(this._count);
      this._updateFunc("ticks");
    };

    return Ticker;

  })();

}).call(this);

},{"util/exception":"util/exception"}],"engine/core/world/turtlemanager":[function(require,module,exports){
(function() {
  var Builtins, ColorModel, DeathInterrupt, IDManager, Nobody, Turtle, TurtleManager, TurtleSet, _, ignoring, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('lodash');

  ColorModel = require('engine/core/colormodel');

  Nobody = require('../nobody');

  Turtle = require('../turtle');

  TurtleSet = require('../turtleset');

  Builtins = require('../structure/builtins');

  IDManager = require('./idmanager');

  ref = require('util/exception'), DeathInterrupt = ref.DeathInterrupt, ignoring = ref.ignoring;

  module.exports = TurtleManager = (function() {
    TurtleManager.prototype._idManager = void 0;

    TurtleManager.prototype._turtles = void 0;

    TurtleManager.prototype._turtlesById = void 0;

    function TurtleManager(_world, _breedManager, _updater, _nextInt) {
      this._world = _world;
      this._breedManager = _breedManager;
      this._updater = _updater;
      this._nextInt = _nextInt;
      this._removeTurtle = bind(this._removeTurtle, this);
      this._createTurtle = bind(this._createTurtle, this);
      this.turtlesOfBreed = bind(this.turtlesOfBreed, this);
      this._idManager = new IDManager;
      this._turtles = [];
      this._turtlesById = {};
    }

    TurtleManager.prototype.clearTurtles = function() {
      this.turtles().forEach(function(turtle) {
        return ignoring(DeathInterrupt)((function(_this) {
          return function() {
            return turtle.die();
          };
        })(this));
      });
      this._idManager.reset();
    };

    TurtleManager.prototype.createOrderedTurtles = function(n, breedName) {
      var turtles;
      turtles = _(0).range(n).map((function(_this) {
        return function(num) {
          var color, heading;
          color = ColorModel.nthColor(num);
          heading = (360 * num) / n;
          return _this._createTurtle(color, heading, 0, 0, _this._breedManager.get(breedName));
        };
      })(this)).value();
      return new TurtleSet(turtles);
    };

    TurtleManager.prototype.createTurtles = function(n, breedName, xcor, ycor) {
      var turtles;
      if (xcor == null) {
        xcor = 0;
      }
      if (ycor == null) {
        ycor = 0;
      }
      turtles = _(0).range(n).map((function(_this) {
        return function() {
          var color, heading;
          color = ColorModel.randomColor(_this._nextInt);
          heading = _this._nextInt(360);
          return _this._createTurtle(color, heading, xcor, ycor, _this._breedManager.get(breedName));
        };
      })(this)).value();
      return new TurtleSet(turtles);
    };

    TurtleManager.prototype.getTurtle = function(id) {
      var ref1;
      return (ref1 = this._turtlesById[id]) != null ? ref1 : Nobody;
    };

    TurtleManager.prototype.getTurtleOfBreed = function(breedName, id) {
      var turtle;
      turtle = this.getTurtle(id);
      if (turtle.getBreedName().toUpperCase() === breedName.toUpperCase()) {
        return turtle;
      } else {
        return Nobody;
      }
    };

    TurtleManager.prototype.turtles = function() {
      return new TurtleSet(this._turtles, "turtles");
    };

    TurtleManager.prototype.turtlesOfBreed = function(breedName) {
      var breed;
      breed = this._breedManager.get(breedName);
      return new TurtleSet(breed.members, breedName);
    };

    TurtleManager.prototype._clearTurtlesSuspended = function() {
      this._idManager.suspendDuring((function(_this) {
        return function() {
          return _this.clearTurtles();
        };
      })(this));
    };

    TurtleManager.prototype._createTurtle = function(color, heading, xcor, ycor, breed, label, lcolor, isHidden, size, shape, genPenManager) {
      var id, turtle;
      id = this._idManager.next();
      turtle = new Turtle(this._world, id, this._updater.updated, this._updater.registerPenTrail, this._updater.registerTurtleStamp, this._updater.registerDeadTurtle, this._createTurtle, this._removeTurtle, color, heading, xcor, ycor, breed, label, lcolor, isHidden, size, shape, genPenManager);
      this._updater.updated(turtle).apply(null, Builtins.turtleBuiltins);
      this._turtles.push(turtle);
      this._turtlesById[id] = turtle;
      return turtle;
    };

    TurtleManager.prototype._removeTurtle = function(id) {
      var turtle;
      turtle = this._turtlesById[id];
      this._turtles.splice(this._turtles.indexOf(turtle), 1);
      delete this._turtlesById[id];
    };

    return TurtleManager;

  })();

}).call(this);

},{"../nobody":"engine/core/nobody","../structure/builtins":"engine/core/structure/builtins","../turtle":"engine/core/turtle","../turtleset":"engine/core/turtleset","./idmanager":"engine/core/world/idmanager","engine/core/colormodel":"engine/core/colormodel","lodash":"lodash","util/exception":"util/exception"}],"engine/core/world":[function(require,module,exports){
(function() {
  var LinkManager, NLMath, Nobody, Observer, Patch, PatchSet, StrictMath, Ticker, TopologyInterrupt, TurtleManager, World, topologyFactory,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Nobody = require('./nobody');

  Observer = require('./observer');

  Patch = require('./patch');

  PatchSet = require('./patchset');

  topologyFactory = require('./topology/factory');

  LinkManager = require('./world/linkmanager');

  Ticker = require('./world/ticker');

  TurtleManager = require('./world/turtlemanager');

  StrictMath = require('shim/strictmath');

  NLMath = require('util/nlmath');

  TopologyInterrupt = require('util/exception').TopologyInterrupt;

  module.exports = World = (function() {
    World.prototype.id = 0;

    World.prototype.breedManager = void 0;

    World.prototype.linkManager = void 0;

    World.prototype.observer = void 0;

    World.prototype.rng = void 0;

    World.prototype.selfManager = void 0;

    World.prototype.ticker = void 0;

    World.prototype.topology = void 0;

    World.prototype.turtleManager = void 0;

    World.prototype._patches = void 0;

    World.prototype._plotManager = void 0;

    World.prototype._updater = void 0;

    World.prototype._patchesAllBlack = void 0;

    World.prototype._patchesWithLabels = void 0;

    function World(miniWorkspace, globalNames, interfaceGlobalNames, patchesOwnNames, minPxcor, maxPxcor, minPycor, maxPycor, patchSize, wrappingAllowedInX, wrappingAllowedInY, turtleShapeMap, linkShapeMap, onTickFunction) {
      var onTick;
      this.patchesOwnNames = patchesOwnNames;
      this.patchSize = patchSize;
      this.turtleShapeMap = turtleShapeMap;
      this._declarePatchesNotAllBlack = bind(this._declarePatchesNotAllBlack, this);
      this._setUnbreededLinksUndirected = bind(this._setUnbreededLinksUndirected, this);
      this._setUnbreededLinksDirected = bind(this._setUnbreededLinksDirected, this);
      this._decrementPatchLabelCount = bind(this._decrementPatchLabelCount, this);
      this._incrementPatchLabelCount = bind(this._incrementPatchLabelCount, this);
      this.getPatchAt = bind(this.getPatchAt, this);
      this.patches = bind(this.patches, this);
      this.selfManager = miniWorkspace.selfManager, this._updater = miniWorkspace.updater, this.rng = miniWorkspace.rng, this.breedManager = miniWorkspace.breedManager, this._plotManager = miniWorkspace.plotManager;
      this._updater.collectUpdates();
      this._updater.registerWorldState({
        worldWidth: maxPxcor - minPxcor + 1,
        worldHeight: maxPycor - minPycor + 1,
        minPxcor: minPxcor,
        minPycor: minPycor,
        maxPxcor: maxPxcor,
        maxPycor: maxPycor,
        linkBreeds: "XXX IMPLEMENT ME",
        linkShapeList: linkShapeMap,
        patchSize: this.patchSize,
        patchesAllBlack: this._patchesAllBlack,
        patchesWithLabels: this._patchesWithLabels,
        ticks: -1,
        turtleBreeds: "XXX IMPLEMENT ME",
        turtleShapeList: this.turtleShapeMap,
        unbreededLinksAreDirected: false,
        wrappingAllowedInX: wrappingAllowedInX,
        wrappingAllowedInY: wrappingAllowedInY
      });
      onTick = (function(_this) {
        return function() {
          _this.rng.withAux(onTickFunction);
          return _this._plotManager.updatePlots();
        };
      })(this);
      this.linkManager = new LinkManager(this, this.breedManager, this._updater, this._setUnbreededLinksDirected, this._setUnbreededLinksUndirected);
      this.observer = new Observer(this._updater.updated, globalNames, interfaceGlobalNames);
      this.ticker = new Ticker(this._plotManager.setupPlots, onTick, this._updater.updated(this));
      this.topology = null;
      this.turtleManager = new TurtleManager(this, this.breedManager, this._updater, this.rng.nextInt);
      this._patches = [];
      this._patchesAllBlack = true;
      this._patchesWithLabels = 0;
      this._resizeHelper(minPxcor, maxPxcor, minPycor, maxPycor, wrappingAllowedInX, wrappingAllowedInY);
    }

    World.prototype.links = function() {
      return this.linkManager.links();
    };

    World.prototype.turtles = function() {
      return this.turtleManager.turtles();
    };

    World.prototype.patches = function() {
      return new PatchSet(this._patches, "patches");
    };

    World.prototype.resize = function(minPxcor, maxPxcor, minPycor, maxPycor, wrapsInX, wrapsInY) {
      if (wrapsInX == null) {
        wrapsInX = this.topology._wrapInX;
      }
      if (wrapsInY == null) {
        wrapsInY = this.topology._wrapInY;
      }
      this._resizeHelper(minPxcor, maxPxcor, minPycor, maxPycor, wrapsInX, wrapsInY);
      return this.clearDrawing();
    };

    World.prototype._resizeHelper = function(minPxcor, maxPxcor, minPycor, maxPycor, wrapsInX, wrapsInY) {
      if (wrapsInX == null) {
        wrapsInX = this.topology._wrapInX;
      }
      if (wrapsInY == null) {
        wrapsInY = this.topology._wrapInY;
      }
      if (!((minPxcor <= 0 && 0 <= maxPxcor) && (minPycor <= 0 && 0 <= maxPycor))) {
        throw new Error("You must include the point (0, 0) in the world.");
      }
      this.turtleManager._clearTurtlesSuspended();
      this.changeTopology(wrapsInX, wrapsInY, minPxcor, maxPxcor, minPycor, maxPycor);
      this._createPatches();
      this._declarePatchesAllBlack();
      this._resetPatchLabelCount();
      this._updater.updated(this)("width", "height", "minPxcor", "minPycor", "maxPxcor", "maxPycor");
    };

    World.prototype.changeTopology = function(wrapsInX, wrapsInY, minX, maxX, minY, maxY) {
      if (minX == null) {
        minX = this.topology.minPxcor;
      }
      if (maxX == null) {
        maxX = this.topology.maxPxcor;
      }
      if (minY == null) {
        minY = this.topology.minPycor;
      }
      if (maxY == null) {
        maxY = this.topology.maxPycor;
      }
      this.topology = topologyFactory(wrapsInX, wrapsInY, minX, maxX, minY, maxY, this.patches, this.getPatchAt);
      this._updater.updated(this)("wrappingAllowedInX", "wrappingAllowedInY");
    };

    World.prototype.getPatchAt = function(x, y) {
      var error, error1, index, roundedX, roundedY;
      try {
        roundedX = this._roundXCor(x);
        roundedY = this._roundYCor(y);
        index = (this.topology.maxPycor - roundedY) * this.topology.width + (roundedX - this.topology.minPxcor);
        return this._patches[index];
      } catch (error1) {
        error = error1;
        if (error instanceof TopologyInterrupt) {
          return Nobody;
        } else {
          throw error;
        }
      }
    };

    World.prototype.patchAtCoords = function(x, y) {
      var error, error1, newX, newY;
      try {
        newX = this.topology.wrapX(x);
        newY = this.topology.wrapY(y);
        return this.getPatchAt(newX, newY);
      } catch (error1) {
        error = error1;
        if (error instanceof TopologyInterrupt) {
          return Nobody;
        } else {
          throw error;
        }
      }
    };

    World.prototype.patchAtHeadingAndDistanceFrom = function(angle, distance, x, y) {
      var heading, targetX, targetY;
      heading = NLMath.normalizeHeading(angle);
      targetX = x + distance * NLMath.squash(NLMath.sin(heading));
      targetY = y + distance * NLMath.squash(NLMath.cos(heading));
      return this.patchAtCoords(targetX, targetY);
    };

    World.prototype.setPatchSize = function(patchSize) {
      this.patchSize = patchSize;
      this._updater.updated(this)("patchSize");
    };

    World.prototype.clearAll = function() {
      this.observer.clearCodeGlobals();
      this.observer.resetPerspective();
      this.turtleManager.clearTurtles();
      this.clearPatches();
      this.linkManager.clear();
      this._declarePatchesAllBlack();
      this._resetPatchLabelCount();
      this.ticker.clear();
      this._plotManager.clearAllPlots();
      this.clearDrawing();
    };

    World.prototype.clearDrawing = function() {
      return this._updater.clearDrawing();
    };

    World.prototype.clearPatches = function() {
      this.patches().forEach(function(patch) {
        patch.reset();
      });
      this._declarePatchesAllBlack();
      this._resetPatchLabelCount();
    };

    World.prototype.getNeighbors = function(pxcor, pycor) {
      return new PatchSet(this.topology.getNeighbors(pxcor, pycor));
    };

    World.prototype.getNeighbors4 = function(pxcor, pycor) {
      return new PatchSet(this.topology.getNeighbors4(pxcor, pycor));
    };

    World.prototype._roundXCor = function(x) {
      return this._roundCoordinate(x, (function(_this) {
        return function(s) {
          return _this.topology.wrapX(s);
        };
      })(this));
    };

    World.prototype._roundYCor = function(y) {
      return this._roundCoordinate(y, (function(_this) {
        return function(s) {
          return _this.topology.wrapY(s);
        };
      })(this));
    };

    World.prototype._roundCoordinate = function(c, wrapFunc) {
      var error, fractional, integral, trueError, wrappedC;
      wrappedC = (function() {
        var error1;
        try {
          return wrapFunc(c);
        } catch (error1) {
          error = error1;
          trueError = error instanceof TopologyInterrupt ? new TopologyInterrupt("Cannot access patches beyond the limits of current world.") : error;
          throw trueError;
        }
      })();
      if (wrappedC > 0) {
        return (wrappedC + 0.5) | 0;
      } else {
        integral = wrappedC | 0;
        fractional = integral - wrappedC;
        if (fractional > 0.5) {
          return integral - 1;
        } else {
          return integral;
        }
      }
    };

    World.prototype._createPatches = function() {
      var i, id, len, nested, patch, ref, ref1, x, y;
      nested = (function() {
        var i, ref, ref1, results;
        results = [];
        for (y = i = ref = this.topology.maxPycor, ref1 = this.topology.minPycor; ref <= ref1 ? i <= ref1 : i >= ref1; y = ref <= ref1 ? ++i : --i) {
          results.push((function() {
            var j, ref2, ref3, results1;
            results1 = [];
            for (x = j = ref2 = this.topology.minPxcor, ref3 = this.topology.maxPxcor; ref2 <= ref3 ? j <= ref3 : j >= ref3; x = ref2 <= ref3 ? ++j : --j) {
              id = (this.topology.width * (this.topology.maxPycor - y)) + x - this.topology.minPxcor;
              results1.push(new Patch(id, x, y, this, this._updater.updated, this._declarePatchesNotAllBlack, this._decrementPatchLabelCount, this._incrementPatchLabelCount));
            }
            return results1;
          }).call(this));
        }
        return results;
      }).call(this);
      this._patches = (ref = []).concat.apply(ref, nested);
      ref1 = this._patches;
      for (i = 0, len = ref1.length; i < len; i++) {
        patch = ref1[i];
        this._updater.updated(patch)("pxcor", "pycor", "pcolor", "plabel", "plabel-color");
      }
    };

    World.prototype._incrementPatchLabelCount = function() {
      this._setPatchLabelCount(function(count) {
        return count + 1;
      });
    };

    World.prototype._decrementPatchLabelCount = function() {
      this._setPatchLabelCount(function(count) {
        return count - 1;
      });
    };

    World.prototype._resetPatchLabelCount = function() {
      this._setPatchLabelCount(function() {
        return 0;
      });
    };

    World.prototype._setPatchLabelCount = function(updateCountFunc) {
      this._patchesWithLabels = updateCountFunc(this._patchesWithLabels);
      this._updater.updated(this)("patchesWithLabels");
    };

    World.prototype._setUnbreededLinksDirected = function() {
      this.breedManager.setUnbreededLinksDirected();
      this._updater.updated(this)("unbreededLinksAreDirected");
    };

    World.prototype._setUnbreededLinksUndirected = function() {
      this.breedManager.setUnbreededLinksUndirected();
      this._updater.updated(this)("unbreededLinksAreDirected");
    };

    World.prototype._declarePatchesAllBlack = function() {
      this._patchesAllBlack = true;
      this._updater.updated(this)("patchesAllBlack");
    };

    World.prototype._declarePatchesNotAllBlack = function() {
      this._patchesAllBlack = false;
      this._updater.updated(this)("patchesAllBlack");
    };

    return World;

  })();

}).call(this);

},{"./nobody":"engine/core/nobody","./observer":"engine/core/observer","./patch":"engine/core/patch","./patchset":"engine/core/patchset","./topology/factory":"engine/core/topology/factory","./world/linkmanager":"engine/core/world/linkmanager","./world/ticker":"engine/core/world/ticker","./world/turtlemanager":"engine/core/world/turtlemanager","shim/strictmath":"shim/strictmath","util/exception":"util/exception","util/nlmath":"util/nlmath"}],"engine/dump":[function(require,module,exports){
(function() {
  var Dump, NLType, Tasks, _;

  _ = require('lodash');

  NLType = require('./core/typechecker');

  Tasks = require('./prim/tasks');

  Dump = function(x, isReadable) {
    var itemStr, type;
    if (isReadable == null) {
      isReadable = false;
    }
    type = NLType(x);
    if (type.isList()) {
      itemStr = _(x).map(function(y) {
        return Dump(y, isReadable);
      }).value().join(" ");
      return "[" + itemStr + "]";
    } else if (type.isReporterTask()) {
      return "(reporter task)";
    } else if (type.isCommandTask()) {
      return "(command task)";
    } else if (type.isString()) {
      if (isReadable) {
        return '"' + x + '"';
      } else {
        return x;
      }
    } else {
      return String(x);
    }
  };

  module.exports = Dump;

}).call(this);

},{"./core/typechecker":"engine/core/typechecker","./prim/tasks":"engine/prim/tasks","lodash":"lodash"}],"engine/hasher":[function(require,module,exports){
(function() {
  var AbstractAgentSet, Hasher, Link, NLType, Nobody, Turtle, _;

  _ = require('lodash');

  AbstractAgentSet = require('./core/abstractagentset');

  Link = require('./core/link');

  Nobody = require('./core/nobody');

  Turtle = require('./core/turtle');

  NLType = require('./core/typechecker');

  Hasher = function(x) {
    var f, type;
    type = NLType(x);
    if (type.isTurtle() || type.isLink()) {
      return x.constructor.name + " | " + x.id;
    } else if (x === Nobody) {
      return "nobody: -1";
    } else if (type.isList()) {
      f = function(acc, x) {
        return "31 *" + acc + (x != null ? Hasher(x) : "0");
      };
      return _(x).foldl(f, 1).toString();
    } else if (type.isAgentSet()) {
      return (x.toString()) + " | " + (Hasher(x.toArray()));
    } else {
      return x.toString();
    }
  };

  module.exports = Hasher;

}).call(this);

},{"./core/abstractagentset":"engine/core/abstractagentset","./core/link":"engine/core/link","./core/nobody":"engine/core/nobody","./core/turtle":"engine/core/turtle","./core/typechecker":"engine/core/typechecker","lodash":"lodash"}],"engine/plot/pen":[function(require,module,exports){
(function() {
  var Bar, Counter, Down, JSType, Line, Pen, PlotPoint, Point, State, StrictMath, Up, _;

  _ = require('lodash');

  StrictMath = require('shim/strictmath');

  JSType = require('util/typechecker');

  Up = {};

  Down = {};

  module.exports.PenMode = {
    Up: Up,
    Down: Down
  };

  Line = {};

  Bar = {};

  Point = {};

  module.exports.DisplayMode = {
    Line: Line,
    Bar: Bar,
    Point: Point
  };

  PlotPoint = (function() {
    function PlotPoint(x1, y1, penMode, color1) {
      this.x = x1;
      this.y = y1;
      this.penMode = penMode;
      this.color = color1;
    }

    return PlotPoint;

  })();

  Counter = (function() {
    function Counter(_count, _atFirst) {
      this._count = _count != null ? _count : 0;
      this._atFirst = _atFirst != null ? _atFirst : true;
    }

    Counter.prototype.next = function(interval) {
      if (this._atFirst) {
        this._atFirst = false;
        return 0;
      } else {
        return this._count += interval;
      }
    };

    return Counter;

  })();

  module.exports.State = State = (function() {
    State.prototype._counter = void 0;

    function State(color1, interval1, displayMode, mode) {
      this.color = color1 != null ? color1 : 0;
      this.interval = interval1 != null ? interval1 : 1;
      this.displayMode = displayMode != null ? displayMode : Line;
      this.mode = mode != null ? mode : Down;
      this.resetCounter();
    }

    State.prototype.clone = function() {
      return new State(this.color, this.interval, this.displayMode, this.mode);
    };

    State.prototype.leapCounterTo = function(x) {
      this._counter = new Counter(x, false);
    };

    State.prototype.nextX = function() {
      return this._counter.next(this.interval);
    };

    State.prototype.partiallyReset = function() {
      return new State(this.color, this.interval, this.displayMode, Down);
    };

    State.prototype.resetCounter = function() {
      this._counter = new Counter();
    };

    return State;

  })();

  module.exports.Pen = Pen = (function() {
    Pen.prototype._bounds = void 0;

    Pen.prototype._ops = void 0;

    Pen.prototype._points = void 0;

    Pen.prototype._state = void 0;

    function Pen(name, genOps, isTemp, _defaultState, _setupThis, _updateThis) {
      this.name = name;
      this.isTemp = isTemp != null ? isTemp : false;
      this._defaultState = _defaultState != null ? _defaultState : new State();
      this._setupThis = _setupThis != null ? _setupThis : (function() {});
      this._updateThis = _updateThis != null ? _updateThis : (function() {});
      this._ops = genOps(this);
      this.reset();
    }

    Pen.prototype.addValue = function(y) {
      this._addPoint(this._state.nextX(), y);
    };

    Pen.prototype.addXY = function(x, y) {
      this._addPoint(x, y);
      this._state.leapCounterTo(x);
    };

    Pen.prototype.bounds = function() {
      return this._bounds;
    };

    Pen.prototype.drawHistogramFrom = function(ys, xMin, xMax) {
      var buckets, bucketsToCounts, determineBucket, interval, numbers, validBuckets;
      this.reset(true);
      interval = this.getInterval();
      determineBucket = function(x) {
        return StrictMath.round((x / interval) * (1 + 3.2e-15));
      };
      numbers = _(ys).filter(function(y) {
        return JSType(y).isNumber();
      });
      buckets = numbers.map(determineBucket);
      validBuckets = buckets.filter((function(_this) {
        return function(x) {
          return ((xMin / interval) <= x && x <= (xMax / interval));
        };
      })(this));
      bucketsToCounts = validBuckets.countBy();
      bucketsToCounts.forEach((function(_this) {
        return function(count, bucketNum) {
          _this.addXY(Number(bucketNum) * interval, count);
        };
      })(this)).value();
    };

    Pen.prototype.getColor = function() {
      return this._state.color;
    };

    Pen.prototype.getDisplayMode = function() {
      return this._state.displayMode;
    };

    Pen.prototype.getInterval = function() {
      return this._state.interval;
    };

    Pen.prototype.getPoints = function() {
      return this._points;
    };

    Pen.prototype.lower = function() {
      this._state.mode = Down;
    };

    Pen.prototype.raise = function() {
      this._state.mode = Up;
    };

    Pen.prototype.reset = function(isSoftResetting) {
      if (isSoftResetting == null) {
        isSoftResetting = false;
      }
      this._bounds = void 0;
      this._state = (this._state != null) && (isSoftResetting || this.isTemp) ? this._state.partiallyReset() : this._defaultState.clone();
      this._points = [];
      this._ops.reset();
      this._ops.updateMode(this._state.displayMode);
    };

    Pen.prototype.setColor = function(color) {
      this._state.color = color;
      this._ops.updateColor(color);
    };

    Pen.prototype.setInterval = function(interval) {
      this._state.interval = interval;
    };

    Pen.prototype.setup = function() {
      this._setupThis();
    };

    Pen.prototype.update = function() {
      this._updateThis();
    };

    Pen.prototype.useBarMode = function() {
      this._updateDisplayMode(Bar);
    };

    Pen.prototype.useLineMode = function() {
      this._updateDisplayMode(Line);
    };

    Pen.prototype.usePointMode = function() {
      this._updateDisplayMode(Point);
    };

    Pen.prototype._addPoint = function(x, y) {
      this._points.push(new PlotPoint(x, y, this._state.mode, this._state.color));
      this._updateBounds(x, y);
      this._ops.addPoint(x, y);
    };

    Pen.prototype._updateBounds = function(x, y) {
      var maxX, maxY, minX, minY, ref;
      return this._bounds = this._bounds != null ? ((ref = this._bounds, minX = ref[0], maxX = ref[1], minY = ref[2], maxY = ref[3], ref), [Math.min(minX, x), Math.max(maxX, x), Math.min(minY, y), Math.max(maxY, y)]) : [x, x, y, y];
    };

    Pen.prototype._updateDisplayMode = function(newMode) {
      this._state.displayMode = newMode;
      this._ops.updateMode(newMode);
    };

    return Pen;

  })();

}).call(this);

},{"lodash":"lodash","shim/strictmath":"shim/strictmath","util/typechecker":"util/typechecker"}],"engine/plot/plotmanager":[function(require,module,exports){
(function() {
  var JSType, PlotManager, _,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('lodash');

  JSType = require('util/typechecker');

  module.exports = PlotManager = (function() {
    PlotManager.prototype._currentPlot = void 0;

    PlotManager.prototype._plotMap = void 0;

    function PlotManager(plots) {
      this.updatePlots = bind(this.updatePlots, this);
      this.setupPlots = bind(this.setupPlots, this);
      this._currentPlot = plots[plots.length - 1];
      this._plotMap = _(plots.map(function(p) {
        return p.name.toUpperCase();
      })).zipObject(plots).value();
    }

    PlotManager.prototype.clearAllPlots = function() {
      _(this._plotMap).forEach(function(plot) {
        plot.clear();
      }).value();
    };

    PlotManager.prototype.clearPlot = function() {
      this._withPlot(function(plot) {
        return plot.clear();
      });
    };

    PlotManager.prototype.createTemporaryPen = function(name) {
      this._withPlot(function(plot) {
        return plot.createTemporaryPen(name);
      });
    };

    PlotManager.prototype.disableAutoplotting = function() {
      this._withPlot(function(plot) {
        return plot.disableAutoplotting();
      });
    };

    PlotManager.prototype.drawHistogramFrom = function(list) {
      this._withPlot(function(plot) {
        var numbers;
        numbers = _(list).filter(function(x) {
          return JSType(x).isNumber();
        }).value();
        return plot.drawHistogramFrom(numbers);
      });
    };

    PlotManager.prototype.enableAutoplotting = function() {
      this._withPlot(function(plot) {
        return plot.enableAutoplotting();
      });
    };

    PlotManager.prototype.getPlotName = function() {
      return this._withPlot(function(plot) {
        return plot.name;
      });
    };

    PlotManager.prototype.getPlotXMax = function() {
      return this._withPlot(function(plot) {
        return plot.xMax;
      });
    };

    PlotManager.prototype.getPlotXMin = function() {
      return this._withPlot(function(plot) {
        return plot.xMin;
      });
    };

    PlotManager.prototype.getPlotYMax = function() {
      return this._withPlot(function(plot) {
        return plot.yMax;
      });
    };

    PlotManager.prototype.getPlotYMin = function() {
      return this._withPlot(function(plot) {
        return plot.yMin;
      });
    };

    PlotManager.prototype.hasPenWithName = function(name) {
      return this._withPlot(function(plot) {
        return plot.hasPenWithName(name);
      });
    };

    PlotManager.prototype.isAutoplotting = function() {
      return this._withPlot(function(plot) {
        return plot.isAutoplotting;
      });
    };

    PlotManager.prototype.lowerPen = function() {
      this._withPlot(function(plot) {
        return plot.lowerPen();
      });
    };

    PlotManager.prototype.plotPoint = function(x, y) {
      this._withPlot(function(plot) {
        return plot.plotPoint(x, y);
      });
    };

    PlotManager.prototype.plotValue = function(value) {
      this._withPlot(function(plot) {
        return plot.plotValue(value);
      });
    };

    PlotManager.prototype.raisePen = function() {
      this._withPlot(function(plot) {
        return plot.raisePen();
      });
    };

    PlotManager.prototype.resetPen = function() {
      this._withPlot(function(plot) {
        return plot.resetPen();
      });
    };

    PlotManager.prototype.setCurrentPen = function(name) {
      this._withPlot(function(plot) {
        return plot.setCurrentPen(name);
      });
    };

    PlotManager.prototype.setCurrentPlot = function(name) {
      var plot;
      plot = this._plotMap[name.toUpperCase()];
      if (plot != null) {
        this._currentPlot = plot;
      } else {
        throw new Error("no such plot: \"" + name + "\"");
      }
    };

    PlotManager.prototype.setHistogramBarCount = function(num) {
      if (num > 0) {
        this._withPlot(function(plot) {
          return plot.setHistogramBarCount(num);
        });
      } else {
        throw new Error("You cannot make a histogram with " + num + " bars.");
      }
    };

    PlotManager.prototype.setPenColor = function(color) {
      this._withPlot(function(plot) {
        return plot.setPenColor(color);
      });
    };

    PlotManager.prototype.setPenInterval = function(color) {
      this._withPlot(function(plot) {
        return plot.setPenInterval(color);
      });
    };

    PlotManager.prototype.setPenMode = function(num) {
      this._withPlot(function(plot) {
        switch (num) {
          case 0:
            return plot.useLinePenMode();
          case 1:
            return plot.useBarPenMode();
          case 2:
            return plot.usePointPenMode();
          default:
            throw new Error(num + " is not a valid plot pen mode (valid modes are 0, 1, and 2)");
        }
      });
    };

    PlotManager.prototype.setupPlots = function() {
      _(this._plotMap).forEach(function(plot) {
        plot.setup();
      }).value();
    };

    PlotManager.prototype.setXRange = function(min, max) {
      this._withPlot(function(plot) {
        return plot.setXRange(min, max);
      });
    };

    PlotManager.prototype.setYRange = function(min, max) {
      this._withPlot(function(plot) {
        return plot.setYRange(min, max);
      });
    };

    PlotManager.prototype.updatePlots = function() {
      _(this._plotMap).forEach(function(plot) {
        plot.update();
      }).value();
    };

    PlotManager.prototype.withTemporaryContext = function(plotName, penName) {
      return (function(_this) {
        return function(f) {
          var oldPlot, tempPlot;
          oldPlot = _this._currentPlot;
          tempPlot = _this._plotMap[plotName.toUpperCase()];
          _this._currentPlot = tempPlot;
          if (penName != null) {
            tempPlot.withTemporaryContext(penName)(f);
          } else {
            f();
          }
          _this._currentPlot = oldPlot;
        };
      })(this);
    };

    PlotManager.prototype._withPlot = function(f) {
      if (this._currentPlot != null) {
        return f(this._currentPlot);
      } else {
        throw new Error("There is no current plot. Please select a current plot using the set-current-plot command.");
      }
    };

    return PlotManager;

  })();

}).call(this);

},{"lodash":"lodash","util/typechecker":"util/typechecker"}],"engine/plot/plotops":[function(require,module,exports){
(function() {
  var ColorModel, PenOps, PlottingOps,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ColorModel = require('../core/colormodel');

  PenOps = (function() {
    PenOps.prototype.addPoint = void 0;

    PenOps.prototype.reset = void 0;

    PenOps.prototype.updateMode = void 0;

    PenOps.prototype.updateColor = void 0;

    function PenOps(plottingOps, pen) {
      this.addPoint = plottingOps.addPoint(pen);
      this.reset = plottingOps.resetPen(pen);
      this.updateMode = plottingOps.updatePenMode(pen);
      this.updateColor = plottingOps.updatePenColor(pen);
    }

    return PenOps;

  })();

  module.exports = PlottingOps = (function() {
    function PlottingOps(resize, reset, registerPen, resetPen, addPoint, updatePenMode, updatePenColor) {
      this.resize = resize;
      this.reset = reset;
      this.registerPen = registerPen;
      this.resetPen = resetPen;
      this.addPoint = addPoint;
      this.updatePenMode = updatePenMode;
      this.updatePenColor = updatePenColor;
      this.makePenOps = bind(this.makePenOps, this);
    }

    PlottingOps.prototype.colorToRGBString = function(color) {
      var b, g, r, ref;
      ref = ColorModel.colorToRGB(color), r = ref[0], g = ref[1], b = ref[2];
      return "rgb(" + r + ", " + g + ", " + b + ")";
    };

    PlottingOps.prototype.makePenOps = function(pen) {
      return new PenOps(this, pen);
    };

    return PlottingOps;

  })();

}).call(this);

},{"../core/colormodel":"engine/core/colormodel"}],"engine/plot/plot":[function(require,module,exports){
(function() {
  var Pen, Plot, Stop, StrictMath, _;

  _ = require('lodash');

  Pen = require('./pen').Pen;

  StrictMath = require('shim/strictmath');

  Stop = require('util/exception').StopInterrupt;

  module.exports = Plot = (function() {
    Plot.prototype._currentPen = void 0;

    Plot.prototype._originalBounds = void 0;

    Plot.prototype._penMap = void 0;

    Plot.prototype.name = void 0;

    function Plot(name1, pens, _ops, xLabel, yLabel, isLegendEnabled, isAutoplotting, xMin, xMax, yMin, yMax, _setupThis, _updateThis) {
      this.name = name1;
      if (pens == null) {
        pens = [];
      }
      this._ops = _ops;
      this.xLabel = xLabel;
      this.yLabel = yLabel;
      this.isLegendEnabled = isLegendEnabled != null ? isLegendEnabled : true;
      this.isAutoplotting = isAutoplotting != null ? isAutoplotting : true;
      this.xMin = xMin != null ? xMin : 0;
      this.xMax = xMax != null ? xMax : 10;
      this.yMin = yMin != null ? yMin : 0;
      this.yMax = yMax != null ? yMax : 10;
      this._setupThis = _setupThis != null ? _setupThis : (function() {});
      this._updateThis = _updateThis != null ? _updateThis : (function() {});
      this._currentPen = pens[0];
      this._originalBounds = [this.xMin, this.xMax, this.yMin, this.yMax];
      this._penMap = _(pens).map(function(p) {
        return p.name.toUpperCase();
      }).zipObject(pens).value();
      this.clear();
    }

    Plot.prototype.clear = function() {
      var ref, ref1;
      ref = this._originalBounds, this.xMin = ref[0], this.xMax = ref[1], this.yMin = ref[2], this.yMax = ref[3];
      this._ops.reset(this);
      this._resize();
      _(this._penMap).filter(function(x) {
        return x.isTemp;
      }).forEach((function(_this) {
        return function(x) {
          delete _this._penMap[x.name.toUpperCase()];
        };
      })(this)).value();
      _(this._penMap).forEach((function(_this) {
        return function(pen) {
          pen.reset();
          _this._ops.registerPen(pen);
        };
      })(this)).value();
      if ((ref1 = this._currentPen) != null ? ref1.isTemp : void 0) {
        this._currentPen = _(this._penMap).size() === 0 ? (this._penMap.DEFAULT = new Pen("DEFAULT", this._ops.makePenOps), this._penMap.DEFAULT) : _(this._penMap).toArray().value()[0];
      }
    };

    Plot.prototype.createTemporaryPen = function(name) {
      var existingPen, pen;
      existingPen = this._getPenByName(name);
      this._currentPen = existingPen != null ? existingPen : (pen = new Pen(name, this._ops.makePenOps, true), this._penMap[pen.name.toUpperCase()] = pen, this._ops.registerPen(pen), pen);
    };

    Plot.prototype.disableAutoplotting = function() {
      this.isAutoplotting = false;
    };

    Plot.prototype.drawHistogramFrom = function(list) {
      this._withPen((function(_this) {
        return function(pen) {
          if (pen.getInterval() > 0) {
            pen.drawHistogramFrom(list, _this.xMin, _this.xMax);
            return _this._verifyHistogramSize(pen);
          } else {
            throw new Error("You cannot histogram with a plot-pen-interval of " + pen.interval + ".");
          }
        };
      })(this));
    };

    Plot.prototype.enableAutoplotting = function() {
      this.isAutoplotting = true;
    };

    Plot.prototype.hasPenWithName = function(name) {
      return this._getPenByName(name) != null;
    };

    Plot.prototype.lowerPen = function() {
      this._withPen(function(pen) {
        return pen.lower();
      });
    };

    Plot.prototype.plotPoint = function(x, y) {
      this._withPen((function(_this) {
        return function(pen) {
          pen.addXY(x, y);
          return _this._verifySize(pen);
        };
      })(this));
    };

    Plot.prototype.plotValue = function(value) {
      this._withPen((function(_this) {
        return function(pen) {
          pen.addValue(value);
          return _this._verifySize(pen);
        };
      })(this));
    };

    Plot.prototype.raisePen = function() {
      this._withPen(function(pen) {
        return pen.raise();
      });
    };

    Plot.prototype.resetPen = function() {
      this._withPen((function(_this) {
        return function(pen) {
          return pen.reset();
        };
      })(this));
    };

    Plot.prototype.setCurrentPen = function(name) {
      var pen;
      pen = this._getPenByName(name);
      if (pen != null) {
        this._currentPen = pen;
      } else {
        throw new Error("There is no pen named \"" + name + "\" in the current plot");
      }
    };

    Plot.prototype.setHistogramBarCount = function(num) {
      this._withPen((function(_this) {
        return function(pen) {
          var interval;
          if (num >= 1) {
            interval = (_this.xMax - _this.xMin) / num;
            return pen.setInterval(interval);
          } else {
            throw new Error("You cannot make a histogram with " + num + " bars.");
          }
        };
      })(this));
    };

    Plot.prototype.setPenColor = function(color) {
      this._withPen(function(pen) {
        return pen.setColor(color);
      });
    };

    Plot.prototype.setPenInterval = function(num) {
      this._withPen(function(pen) {
        return pen.setInterval(num);
      });
    };

    Plot.prototype.setup = function() {
      var setupResult;
      setupResult = this._setupThis();
      if (!(setupResult instanceof Stop)) {
        _(this._penMap).forEach(function(pen) {
          pen.setup();
        }).value();
      }
    };

    Plot.prototype.setXRange = function(min, max) {
      if (min >= max) {
        throw new Error("the minimum must be less than the maximum, but " + min + " is greater than or equal to " + max);
      }
      this.xMin = min;
      this.xMax = max;
      this._resize();
    };

    Plot.prototype.setYRange = function(min, max) {
      if (min >= max) {
        throw new Error("the minimum must be less than the maximum, but " + min + " is greater than or equal to " + max);
      }
      this.yMin = min;
      this.yMax = max;
      this._resize();
    };

    Plot.prototype.update = function() {
      var updateResult;
      updateResult = this._updateThis();
      if (!(updateResult instanceof Stop)) {
        _(this._penMap).forEach(function(pen) {
          pen.update();
        }).value();
      }
    };

    Plot.prototype.useBarPenMode = function() {
      this._withPen((function(_this) {
        return function(pen) {
          return pen.useBarMode();
        };
      })(this));
    };

    Plot.prototype.useLinePenMode = function() {
      this._withPen((function(_this) {
        return function(pen) {
          return pen.useLineMode();
        };
      })(this));
    };

    Plot.prototype.usePointPenMode = function() {
      this._withPen((function(_this) {
        return function(pen) {
          return pen.usePointMode();
        };
      })(this));
    };

    Plot.prototype.withTemporaryContext = function(penName) {
      return (function(_this) {
        return function(f) {
          var oldPen;
          oldPen = _this._currentPen;
          _this._currentPen = _this._getPenByName(penName);
          f();
          _this._currentPlot = oldPen;
        };
      })(this);
    };

    Plot.prototype._getPenByName = function(name) {
      return this._penMap[name.toUpperCase()];
    };

    Plot.prototype._resize = function() {
      return this._ops.resize(this.xMin, this.xMax, this.yMin, this.yMax);
    };

    Plot.prototype._verifyHistogramSize = function(pen) {
      var penYMax;
      penYMax = _(pen.getPoints()).filter((function(_this) {
        return function(arg) {
          var x;
          x = arg.x;
          return x >= _this.xMin && x <= _this.xMax;
        };
      })(this)).max(function(p) {
        return p.y;
      }).y;
      if (penYMax > this.yMax && this.isAutoplotting) {
        this.yMax = penYMax;
      }
      this._resize();
    };

    Plot.prototype._verifySize = function(pen) {
      var bounds, bumpMax, bumpMin, currentBounds, maxXs, maxYs, minXs, minYs, newXMax, newXMin, newYMax, newYMin, ref, ref1;
      if (pen.bounds() != null) {
        bounds = pen.bounds();
        currentBounds = [this.xMin, this.xMax, this.yMin, this.yMax];
        ref = _(bounds).zip(currentBounds).value(), minXs = ref[0], maxXs = ref[1], minYs = ref[2], maxYs = ref[3];
        bumpMin = function(arg, currentMax) {
          var currentMin, expandedRange, newMin, newValue, range;
          newMin = arg[0], currentMin = arg[1];
          if (newMin < currentMin) {
            range = currentMax - newMin;
            expandedRange = range * 1.2;
            newValue = currentMax - expandedRange;
            return StrictMath.floor(newValue);
          } else {
            return currentMin;
          }
        };
        bumpMax = function(arg, currentMin) {
          var currentMax, expandedRange, newMax, newValue, range;
          newMax = arg[0], currentMax = arg[1];
          if (newMax > currentMax) {
            range = newMax - currentMin;
            expandedRange = range * 1.2;
            newValue = currentMin + expandedRange;
            return StrictMath.ceil(newValue);
          } else {
            return currentMax;
          }
        };
        ref1 = [bumpMin(minXs, this.xMax), bumpMax(maxXs, this.xMin), bumpMin(minYs, this.yMax), bumpMax(maxYs, this.yMin)], newXMin = ref1[0], newXMax = ref1[1], newYMin = ref1[2], newYMax = ref1[3];
        if (newXMin !== this.xMin || newXMax !== this.xMax || newYMin !== this.yMin || newYMax !== this.yMax) {
          if (this.isAutoplotting) {
            this.xMin = newXMin;
            this.xMax = newXMax;
            this.yMin = newYMin;
            this.yMax = newYMax;
          }
          this._resize();
        }
      }
    };

    Plot.prototype._withPen = function(f) {
      if (this._currentPen != null) {
        return f(this._currentPen);
      } else {
        throw new Error("Plot '" + this.name + "' has no pens!");
      }
    };

    return Plot;

  })();

}).call(this);

},{"./pen":"engine/plot/pen","lodash":"lodash","shim/strictmath":"shim/strictmath","util/exception":"util/exception"}],"engine/prim/displayprims":[function(require,module,exports){
(function() {
  var DisplayConfig, DisplayPrims;

  module.exports.Config = DisplayConfig = (function() {
    function DisplayConfig(refresh) {
      this.refresh = refresh != null ? refresh : (function() {});
    }

    return DisplayConfig;

  })();

  module.exports.Prims = DisplayPrims = (function() {
    function DisplayPrims(arg) {
      this.refresh = arg.refresh;
    }

    return DisplayPrims;

  })();

}).call(this);

},{}],"engine/prim/display":[function(require,module,exports){
arguments[4]["engine/prim/displayprims"][0].apply(exports,arguments)
},{"dup":"engine/prim/displayprims"}],"engine/prim/evalconfig":[function(require,module,exports){
(function() {
  var EvalConfig, defaultEval;

  defaultEval = (function() {
    throw new Error("Evaluation function not supplied");
  });

  module.exports = EvalConfig = (function() {
    function EvalConfig(evalCommand, evalReporter) {
      this.evalCommand = evalCommand != null ? evalCommand : defaultEval;
      this.evalReporter = evalReporter != null ? evalReporter : defaultEval;
    }

    return EvalConfig;

  })();

}).call(this);

},{}],"engine/prim/layoutmanager":[function(require,module,exports){
(function() {
  var LayoutManager, NLMath, _;

  _ = require('lodash');

  NLMath = require('util/nlmath');

  module.exports = LayoutManager = (function() {
    function LayoutManager(_world, _nextDouble) {
      this._world = _world;
      this._nextDouble = _nextDouble;
    }

    LayoutManager.prototype.layoutSpring = function(nodeSet, linkSet, spr, len, rep) {
      var agt, ax, ay, degCounts, nodeCount, ref, tMap;
      if (!nodeSet.isEmpty()) {
        ref = this._initialize(nodeSet), ax = ref[0], ay = ref[1], tMap = ref[2], agt = ref[3];
        nodeCount = nodeSet.size();
        degCounts = this._calcDegreeCounts(linkSet, tMap, nodeCount);
        this._updateXYArraysForNeighbors(ax, ay, linkSet, tMap, degCounts, spr, len);
        this._updateXYArraysForAll(ax, ay, agt, degCounts, nodeCount, rep);
        this._moveTurtles(ax, ay, agt, nodeCount);
      }
    };

    LayoutManager.prototype._initialize = function(nodeSet) {
      var agt, ax, ay, tMap, turtles;
      ax = [];
      ay = [];
      tMap = [];
      agt = [];
      turtles = nodeSet.shuffled().toArray();
      _(0).range(turtles.length).forEach(function(i) {
        var turtle;
        turtle = turtles[i];
        agt[i] = turtle;
        tMap[turtle.id] = i;
        ax[i] = 0.0;
        ay[i] = 0.0;
      }).value();
      return [ax, ay, tMap, agt];
    };

    LayoutManager.prototype._calcDegreeCounts = function(links, idToIndexMap, nodeCount) {
      var baseCounts;
      baseCounts = _(0).range(nodeCount).map(function() {
        return 0;
      }).value();
      links.forEach(function(arg) {
        var f, t1, t2;
        t1 = arg.end1, t2 = arg.end2;
        f = function(turtle) {
          var index;
          index = idToIndexMap[turtle.id];
          if (index != null) {
            return baseCounts[index]++;
          }
        };
        f(t1);
        f(t2);
      });
      return baseCounts;
    };

    LayoutManager.prototype._updateXYArraysForNeighbors = function(ax, ay, links, idToIndexMap, degCounts, spr, len) {
      var indexAndCountOf;
      indexAndCountOf = function(turtle) {
        var index;
        index = idToIndexMap[turtle.id];
        if (index != null) {
          return [index, degCounts[index]];
        } else {
          return [-1, 0];
        }
      };
      links.forEach(function(arg) {
        var degCount1, degCount2, dist, div, dx, dy, f, newDX, newDY, ref, ref1, ref2, t1, t1Index, t2, t2Index;
        t1 = arg.end1, t2 = arg.end2;
        ref = indexAndCountOf(t1), t1Index = ref[0], degCount1 = ref[1];
        ref1 = indexAndCountOf(t2), t2Index = ref1[0], degCount2 = ref1[1];
        dist = t1.distance(t2);
        div = Math.max((degCount1 + degCount2) / 2.0, 1.0);
        ref2 = dist === 0 ? [(spr * len) / div, 0] : (f = spr * (dist - len) / div, newDX = f * (t2.xcor - t1.xcor) / dist, newDY = f * (t2.ycor - t1.ycor) / dist, [newDX, newDY]), dx = ref2[0], dy = ref2[1];
        if (t1Index !== -1) {
          ax[t1Index] += dx;
          ay[t1Index] += dy;
        }
        if (t2Index !== -1) {
          ax[t2Index] -= dx;
          ay[t2Index] -= dy;
        }
      });
    };

    LayoutManager.prototype._updateXYArraysForAll = function(ax, ay, agents, degCounts, nodeCount, rep) {
      var ang, dist, div, dx, dy, f, i, j, k, l, newDX, newDY, ref, ref1, ref2, ref3, t1, t2;
      for (i = k = 0, ref = nodeCount; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        t1 = agents[i];
        for (j = l = ref1 = i + 1, ref2 = nodeCount; ref1 <= ref2 ? l < ref2 : l > ref2; j = ref1 <= ref2 ? ++l : --l) {
          t2 = agents[j];
          div = Math.max((degCounts[i] + degCounts[j]) / 2.0, 1.0);
          ref3 = t2.xcor === t1.xcor && t2.ycor === t1.ycor ? (ang = 360 * this._nextDouble(), newDX = -(rep / div * NLMath.squash(NLMath.sin(ang))), newDY = -(rep / div * NLMath.squash(NLMath.cos(ang))), [newDX, newDY]) : (dist = t1.distance(t2), f = rep / (dist * dist) / div, newDX = -(f * (t2.xcor - t1.xcor) / dist), newDY = -(f * (t2.ycor - t1.ycor) / dist), [newDX, newDY]), dx = ref3[0], dy = ref3[1];
          ax[i] += dx;
          ay[i] += dy;
          ax[j] -= dx;
          ay[j] -= dy;
        }
      }
    };

    LayoutManager.prototype._moveTurtles = function(ax, ay, agt, nodeCount) {
      var bounded, calculateLimit, calculateXCor, calculateYCor, height, limit, maxX, maxY, minX, minY, perturbment, width;
      maxX = this._world.topology.maxPxcor;
      minX = this._world.topology.minPxcor;
      maxY = this._world.topology.maxPycor;
      minY = this._world.topology.minPycor;
      height = this._world.topology.height;
      width = this._world.topology.width;
      if (nodeCount > 1) {
        perturbment = (width + height) / 1.0e10;
        ax[0] += this._nextDouble() * perturbment - perturbment / 2.0;
        ay[0] += this._nextDouble() * perturbment - perturbment / 2.0;
      }
      limit = (width + height) / 50.0;
      bounded = function(min, max) {
        return function(x) {
          if (x < min) {
            return min;
          } else if (x > max) {
            return max;
          } else {
            return x;
          }
        };
      };
      calculateLimit = bounded(-limit, limit);
      calculateXCor = bounded(minX, maxX);
      calculateYCor = bounded(minY, maxY);
      _(0).range(nodeCount).forEach(function(i) {
        var newX, newY, turtle;
        turtle = agt[i];
        newX = calculateXCor(turtle.xcor + calculateLimit(ax[i]));
        newY = calculateYCor(turtle.ycor + calculateLimit(ay[i]));
        turtle.setXY(newX, newY);
      }).value();
    };

    return LayoutManager;

  })();

}).call(this);

},{"lodash":"lodash","util/nlmath":"util/nlmath"}],"engine/prim/linkprims":[function(require,module,exports){
(function() {
  var LinkPrims;

  module.exports = LinkPrims = (function() {
    LinkPrims._linkManager = void 0;

    LinkPrims._self = void 0;

    function LinkPrims(arg) {
      var linkManager, selfManager;
      linkManager = arg.linkManager, selfManager = arg.selfManager;
      this._linkManager = linkManager;
      this._self = selfManager.self;
    }

    LinkPrims.prototype.createLinkFrom = function(otherTurtle, breedName) {
      return this._linkManager.createDirectedLink(otherTurtle, this._self(), breedName);
    };

    LinkPrims.prototype.createLinksFrom = function(otherTurtles, breedName) {
      return this._linkManager.createReverseDirectedLinks(this._self(), otherTurtles.shuffled(), breedName);
    };

    LinkPrims.prototype.createLinkTo = function(otherTurtle, breedName) {
      return this._linkManager.createDirectedLink(this._self(), otherTurtle, breedName);
    };

    LinkPrims.prototype.createLinksTo = function(otherTurtles, breedName) {
      return this._linkManager.createDirectedLinks(this._self(), otherTurtles.shuffled(), breedName);
    };

    LinkPrims.prototype.createLinkWith = function(otherTurtle, breedName) {
      return this._linkManager.createUndirectedLink(this._self(), otherTurtle, breedName);
    };

    LinkPrims.prototype.createLinksWith = function(otherTurtles, breedName) {
      return this._linkManager.createUndirectedLinks(this._self(), otherTurtles.shuffled(), breedName);
    };

    LinkPrims.prototype.isInLinkNeighbor = function(breedName, otherTurtle) {
      return this._self().linkManager.isInLinkNeighbor(breedName, otherTurtle);
    };

    LinkPrims.prototype.isLinkNeighbor = function(breedName, otherTurtle) {
      return this._self().linkManager.isLinkNeighbor(breedName, otherTurtle);
    };

    LinkPrims.prototype.isOutLinkNeighbor = function(breedName, otherTurtle) {
      return this._self().linkManager.isOutLinkNeighbor(breedName, otherTurtle);
    };

    LinkPrims.prototype.inLinkFrom = function(breedName, otherTurtle) {
      return this._self().linkManager.inLinkFrom(breedName, otherTurtle);
    };

    LinkPrims.prototype.linkWith = function(breedName, otherTurtle) {
      return this._self().linkManager.linkWith(breedName, otherTurtle);
    };

    LinkPrims.prototype.outLinkTo = function(breedName, otherTurtle) {
      return this._self().linkManager.outLinkTo(breedName, otherTurtle);
    };

    LinkPrims.prototype.inLinkNeighbors = function(breedName) {
      return this._self().linkManager.inLinkNeighbors(breedName);
    };

    LinkPrims.prototype.linkNeighbors = function(breedName) {
      return this._self().linkManager.linkNeighbors(breedName);
    };

    LinkPrims.prototype.outLinkNeighbors = function(breedName) {
      return this._self().linkManager.outLinkNeighbors(breedName);
    };

    LinkPrims.prototype.myInLinks = function(breedName) {
      return this._self().linkManager.myInLinks(breedName);
    };

    LinkPrims.prototype.myLinks = function(breedName) {
      return this._self().linkManager.myLinks(breedName);
    };

    LinkPrims.prototype.myOutLinks = function(breedName) {
      return this._self().linkManager.myOutLinks(breedName);
    };

    return LinkPrims;

  })();

}).call(this);

},{}],"engine/prim/listprims":[function(require,module,exports){
(function() {
  var AbstractAgentSet, Comparator, Dump, Exception, Link, ListPrims, NLMath, NLType, Nobody, Patch, StrictMath, Turtle, _, stableSort,
    slice = [].slice;

  _ = require('lodash');

  Dump = require('../dump');

  AbstractAgentSet = require('../core/abstractagentset');

  Link = require('../core/link');

  Nobody = require('../core/nobody');

  Patch = require('../core/patch');

  Turtle = require('../core/turtle');

  NLType = require('../core/typechecker');

  StrictMath = require('shim/strictmath');

  Comparator = require('util/comparator');

  Exception = require('util/exception');

  NLMath = require('util/nlmath');

  stableSort = require('util/stablesort');

  module.exports = ListPrims = (function() {
    function ListPrims(_hasher, _equality, _nextInt) {
      this._hasher = _hasher;
      this._equality = _equality;
      this._nextInt = _nextInt;
    }

    ListPrims.prototype.butFirst = function(xs) {
      return xs.slice(1);
    };

    ListPrims.prototype.butLast = function(xs) {
      return xs.slice(0, xs.length - 1);
    };

    ListPrims.prototype.empty = function(xs) {
      return xs.length === 0;
    };

    ListPrims.prototype.first = function(xs) {
      return xs[0];
    };

    ListPrims.prototype.fput = function(x, xs) {
      return [x].concat(xs);
    };

    ListPrims.prototype.item = function(n, xs) {
      return xs[n];
    };

    ListPrims.prototype.last = function(xs) {
      return xs[xs.length - 1];
    };

    ListPrims.prototype.length = function(xs) {
      return xs.length;
    };

    ListPrims.prototype.list = function() {
      var xs;
      xs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return xs;
    };

    ListPrims.prototype.lput = function(x, xs) {
      var result;
      result = xs.slice(0);
      result.push(x);
      return result;
    };

    ListPrims.prototype.max = function(xs) {
      return Math.max.apply(Math, xs);
    };

    ListPrims.prototype.mean = function(xs) {
      return this.sum(xs) / xs.length;
    };

    ListPrims.prototype.median = function(xs) {
      var length, middleIndex, middleNum, nums, subMiddleNum;
      nums = _(xs).filter(function(x) {
        return NLType(x).isNumber();
      }).sortBy().value();
      length = nums.length;
      if (length !== 0) {
        middleIndex = StrictMath.floor(length / 2);
        middleNum = nums[middleIndex];
        if (length % 2 === 1) {
          return middleNum;
        } else {
          subMiddleNum = nums[middleIndex - 1];
          return NLMath.validateNumber((middleNum + subMiddleNum) / 2);
        }
      } else {
        throw new Error("Can't find the median of a list with no numbers: " + (Dump(xs)) + ".");
      }
    };

    ListPrims.prototype.member = function(x, xs) {
      var type;
      type = NLType(xs);
      if (type.isList()) {
        return _(xs).some((function(_this) {
          return function(y) {
            return _this._equality(x, y);
          };
        })(this));
      } else if (type.isString()) {
        return xs.indexOf(x) !== -1;
      } else {
        return xs.exists(function(a) {
          return x === a;
        });
      }
    };

    ListPrims.prototype.min = function(xs) {
      return Math.min.apply(Math, xs);
    };

    ListPrims.prototype.modes = function(items) {
      var calculateModes, genItemCountPairs, ref, result;
      genItemCountPairs = (function(_this) {
        return function(xs) {
          var k, len, pair, pairs, x;
          pairs = [];
          for (k = 0, len = xs.length; k < len; k++) {
            x = xs[k];
            pair = _(pairs).find(function(arg) {
              var c, item;
              item = arg[0], c = arg[1];
              return _this._equality(item, x);
            });
            if (pair != null) {
              pair[1] += 1;
            } else {
              pairs.push([x, 1]);
            }
          }
          return pairs;
        };
      })(this);
      calculateModes = function(xsToCounts) {
        var f;
        f = function(arg, arg1) {
          var bestCount, bests, count, item;
          bests = arg[0], bestCount = arg[1];
          item = arg1[0], count = arg1[1];
          if (count > bestCount) {
            return [[item], count];
          } else if (count < bestCount) {
            return [bests, bestCount];
          } else {
            return [bests.concat([item]), bestCount];
          }
        };
        return _(xsToCounts).foldl(f, [[], 0]);
      };
      ref = calculateModes(genItemCountPairs(items)), result = ref[0], ref[1];
      return result;
    };

    ListPrims.prototype.nOf = function(n, agentsOrList) {
      var items, newItems, type;
      type = NLType(agentsOrList);
      if (type.isList()) {
        return this._nOfArray(n, agentsOrList);
      } else if (type.isAgentSet()) {
        items = agentsOrList.iterator().toArray();
        newItems = this._nOfArray(n, items);
        return agentsOrList.copyWithNewAgents(newItems);
      } else {
        throw new Error("N-OF expected input to be a list or agentset but got " + (Dump(agentsOrList)) + " instead.");
      }
    };

    ListPrims.prototype.oneOf = function(agentsOrList) {
      var arr, type;
      type = NLType(agentsOrList);
      arr = type.isAgentSet() ? agentsOrList.iterator().toArray() : agentsOrList;
      if (arr.length === 0) {
        return Nobody;
      } else {
        return arr[this._nextInt(arr.length)];
      }
    };

    ListPrims.prototype.position = function(x, xs) {
      var index, type;
      type = NLType(xs);
      index = type.isList() ? _(xs).findIndex((function(_this) {
        return function(y) {
          return _this._equality(x, y);
        };
      })(this)) : xs.indexOf(x);
      if (index !== -1) {
        return index;
      } else {
        return false;
      }
    };

    ListPrims.prototype.remove = function(x, xs) {
      var type;
      type = NLType(xs);
      if (type.isList()) {
        return _(xs).filter((function(_this) {
          return function(y) {
            return !_this._equality(x, y);
          };
        })(this)).value();
      } else {
        return xs.replace(new RegExp(x, "g"), "");
      }
    };

    ListPrims.prototype.removeDuplicates = function(xs) {
      var f, out, ref;
      if (xs.length < 2) {
        return xs;
      } else {
        f = (function(_this) {
          return function(arg, x) {
            var accArr, accSet, hash, values;
            accArr = arg[0], accSet = arg[1];
            hash = _this._hasher(x);
            values = accSet[hash];
            if (values != null) {
              if (!_(values).some(function(y) {
                return _this._equality(x, y);
              })) {
                accArr.push(x);
                values.push(x);
              }
            } else {
              accArr.push(x);
              accSet[hash] = [x];
            }
            return [accArr, accSet];
          };
        })(this);
        ref = xs.reduce(f, [[], {}]), out = ref[0], ref[1];
        return out;
      }
    };

    ListPrims.prototype.removeItem = function(n, xs) {
      var post, pre, temp, type;
      type = NLType(xs);
      if (type.isList()) {
        temp = xs.slice(0);
        temp.splice(n, 1);
        return temp;
      } else {
        pre = xs.slice(0, n);
        post = xs.slice(n + 1);
        return pre + post;
      }
    };

    ListPrims.prototype.replaceItem = function(n, xs, x) {
      var post, pre, temp, type;
      type = NLType(xs);
      if (type.isList()) {
        temp = xs.slice(0);
        temp.splice(n, 1, x);
        return temp;
      } else {
        pre = xs.slice(0, n);
        post = xs.slice(n + 1);
        return pre + x + post;
      }
    };

    ListPrims.prototype.reverse = function(xs) {
      var type;
      type = NLType(xs);
      if (type.isList()) {
        return xs.slice(0).reverse();
      } else if (type.isString()) {
        return xs.split("").reverse().join("");
      } else {
        throw new Error("can only reverse lists and strings");
      }
    };

    ListPrims.prototype.sentence = function() {
      var f, xs;
      xs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      f = function(acc, x) {
        if (NLType(x).isList()) {
          return acc.concat(x);
        } else {
          acc.push(x);
          return acc;
        }
      };
      return _(xs).foldl(f, []);
    };

    ListPrims.prototype.shuffle = function(xs) {
      var i, out, swap;
      swap = function(arr, i, j) {
        var tmp;
        tmp = arr[i];
        arr[i] = arr[j];
        return arr[j] = tmp;
      };
      out = xs.slice(0);
      i = out.length;
      while (i > 1) {
        swap(out, i - 1, this._nextInt(i));
        i--;
      }
      return out;
    };

    ListPrims.prototype.sort = function(xs) {
      var agentClasses, filtered, findIsSortable, forAll, type;
      type = NLType(xs);
      if (type.isList()) {
        agentClasses = [Turtle, Patch, Link];
        findIsSortable = function(x) {
          return NLType(x).isNumber() || NLType(x).isString() || (_(agentClasses).some(function(aClass) {
            return x instanceof aClass;
          }) && x.id !== -1);
        };
        filtered = _.filter(xs, findIsSortable);
        forAll = function(f) {
          return _.all(filtered, f);
        };
        if (_(filtered).isEmpty()) {
          return filtered;
        } else if (forAll(function(x) {
          return NLType(x).isNumber();
        })) {
          return filtered.sort(function(x, y) {
            return Comparator.numericCompare(x, y).toInt;
          });
        } else if (forAll(function(x) {
          return NLType(x).isString();
        })) {
          return filtered.sort();
        } else if (_(agentClasses).some(function(agentClass) {
          return forAll(function(x) {
            return x instanceof agentClass;
          });
        })) {
          return stableSort(filtered)(function(x, y) {
            return x.compare(y).toInt;
          });
        } else {
          throw new Error("We don't know how to sort your kind here!");
        }
      } else if (type.isAgentSet()) {
        return xs.sort();
      } else {
        throw new Error("can only sort lists and agentsets");
      }
    };

    ListPrims.prototype.sortBy = function(task, xs) {
      var arr, f, taskIsTrue, type;
      type = NLType(xs);
      arr = (function() {
        if (type.isList()) {
          return xs;
        } else if (type.isAgentSet()) {
          return xs.shufflerator().toArray();
        } else {
          throw new Error("can only sort lists and agentsets");
        }
      })();
      taskIsTrue = function(a, b) {
        var value;
        value = task(a, b);
        if (value === true || value === false) {
          return value;
        } else {
          throw new Error("SORT-BY expected input to be a TRUE/FALSE but got " + value + " instead.");
        }
      };
      f = function(x, y) {
        if (taskIsTrue(x, y)) {
          return -1;
        } else if (taskIsTrue(y, x)) {
          return 1;
        } else {
          return 0;
        }
      };
      return stableSort(arr)(f);
    };

    ListPrims.prototype.standardDeviation = function(xs) {
      var mean, nums, squareDiff, stdDev;
      nums = xs.filter(function(x) {
        return NLType(x).isNumber();
      });
      if (nums.length > 1) {
        mean = this.sum(xs) / xs.length;
        squareDiff = _(xs).foldl((function(acc, x) {
          return acc + StrictMath.pow(x - mean, 2);
        }), 0);
        stdDev = StrictMath.sqrt(squareDiff / (nums.length - 1));
        return NLMath.validateNumber(stdDev);
      } else {
        throw new Error("Can't find the standard deviation of a list without at least two numbers: " + (Dump(xs)));
      }
    };

    ListPrims.prototype.sublist = function(xs, n1, n2) {
      return xs.slice(n1, n2);
    };

    ListPrims.prototype.substring = function(xs, n1, n2) {
      return xs.substr(n1, n2 - n1);
    };

    ListPrims.prototype.sum = function(xs) {
      return xs.reduce((function(a, b) {
        return a + b;
      }), 0);
    };

    ListPrims.prototype.variance = function(xs) {
      var count, mean, numbers, squareOfDifference, sum;
      numbers = _(xs).filter(function(x) {
        return NLType(x).isNumber();
      });
      count = numbers.size();
      if (count < 2) {
        throw new Error("Can't find the variance of a list without at least two numbers");
      }
      sum = numbers.foldl((function(acc, x) {
        return acc + x;
      }), 0);
      mean = sum / count;
      squareOfDifference = numbers.foldl((function(acc, x) {
        return acc + StrictMath.pow(x - mean, 2);
      }), 0);
      return squareOfDifference / (count - 1);
    };

    ListPrims.prototype._nOfArray = function(n, items) {
      var i, index1, index2, j, newIndex1, newIndex2, ref, result;
      switch (n) {
        case 0:
          return [];
        case 1:
          return [items[this._nextInt(items.length)]];
        case 2:
          index1 = this._nextInt(items.length);
          index2 = this._nextInt(items.length - 1);
          ref = index2 >= index1 ? [index1, index2 + 1] : [index2, index1], newIndex1 = ref[0], newIndex2 = ref[1];
          return [items[newIndex1], items[newIndex2]];
        default:
          i = 0;
          j = 0;
          result = [];
          while (j < n) {
            if (this._nextInt(items.length - i) < n - j) {
              result.push(items[i]);
              j += 1;
            }
            i += 1;
          }
          return result;
      }
    };

    return ListPrims;

  })();

}).call(this);

},{"../core/abstractagentset":"engine/core/abstractagentset","../core/link":"engine/core/link","../core/nobody":"engine/core/nobody","../core/patch":"engine/core/patch","../core/turtle":"engine/core/turtle","../core/typechecker":"engine/core/typechecker","../dump":"engine/dump","lodash":"lodash","shim/strictmath":"shim/strictmath","util/comparator":"util/comparator","util/exception":"util/exception","util/nlmath":"util/nlmath","util/stablesort":"util/stablesort"}],"engine/prim/middle":[function(require,module,exports){
(function() {
  var PrimsMiddle, en_us_Errors;

  en_us_Errors = {
    ListTypeName: "list",
    StringTypeName: "string",
    "atan is undefined when both inputs are zero": function() {
      return "atan is undefined when both inputs are zero.";
    },
    "cant find element _ of the _ _ which is only of length _": function(n, list, typeName, length) {
      return "Can't find element " + n + " of the " + typeName + " " + list + ", which is only of length " + length + ".";
    },
    "cant find the maximum of a list with no numbers _": function(list) {
      return "Can't find the maximum of a list with no numbers: " + list;
    },
    "cant find the minimum of a list with no numbers _": function(list) {
      return "Can't find the minimum of a list with no numbers: " + list;
    },
    "cant find the variance of a list without at least two numbers _": function(list) {
      return "Can't find the variance of a list without at least two numbers: " + list + ".";
    },
    "first input to n-of cant be negative": function() {
      return "First input to N-OF can't be negative.";
    },
    "_ is greater than the length of the input list (_)": function(n, length) {
      return n + " is greater than the length of the input list (" + length + ").";
    },
    "_ is less than _": function(n, m) {
      return n + " is less than " + m + ".";
    },
    "_ is less than zero": function(n) {
      return n + " is less than zero.";
    },
    "_ isnt a valid base for a logarithm": function(x) {
      return x + " isn't a valid base for a logarithm.";
    },
    "_ isnt greater than or equal to zero": function(n) {
      return n + " isn't greater than or equal to zero.";
    },
    "list is empty": function() {
      return "List is empty.";
    },
    "requested _ random agents from a set of only _ agents": function(gotNum, maxNum) {
      return "Requested " + gotNum + " random agents from a set of only " + maxNum + " agents.";
    },
    "that _ is dead": function(breedName) {
      return "That " + breedName + " is dead.";
    },
    "the list argument to reduce must not be empty": function() {
      return "The list argument to reduce must not be empty.";
    },
    "the square root of _ is an imaginary number": function(x) {
      return "The square root of " + x + " is an imaginary number.";
    },
    "you cant set breed to a non-breed agentset": function() {
      return "You can't set BREED to a non-breed agentset.";
    },
    "you cant set breed to a non-link-breed agentset": function() {
      return "You can't set BREED to a non-link-breed agentset.";
    }
  };

  module.exports = PrimsMiddle = (function() {
    PrimsMiddle._i18nBundle = void 0;

    function PrimsMiddle(_dumper, _listPrims) {
      this._dumper = _dumper;
      this._listPrims = _listPrims;
      (function(preferredBundle) {
        if (preferredBundle == null) {
          preferredBundle = en_us_Errors;
        }
        return this._i18nBundle = Object.assign({}, en_us_Errors, preferredBundle);
      });
    }

    PrimsMiddle.prototype.ask_agent_command_boolean = function(agent, block, shouldShuffle) {
      if (NLType(agent).isTurtle() && agent.isDead()) {
        throw new Error(this._i18nBundle['that _ is dead'](agent._finalBreedName));
      } else {
        return agent.ask(block, shouldShuffle);
      }
    };

    PrimsMiddle.prototype.atan_number_number = function(x, y) {
      if (x === 0 && y === 0) {
        throw new Error(this._i18nBundle['atan is undefined when both inputs are zero']());
      } else {
        return NLMath.atan(x, y);
      }
    };

    PrimsMiddle.prototype.first_list = function(xs) {
      if (xs.length <= 0) {
        throw new Error(this._i18nBundle['list is empty']());
      } else {
        return this._listPrims.first(xs);
      }
    };

    PrimsMiddle.prototype.item_number_list = function(n, xs) {
      if (n < 0) {
        throw new Error(this._i18nBundle['_ isnt greater than or equal to zero'](n));
      } else if (n <= xs.length) {
        throw new Error(this._i18nBundle['cant find element _ of the _ _ which is only of length _'](n, this._dumper(xs), xs.length));
      } else {
        return this._listPrims.item(n, xs);
      }
    };

    PrimsMiddle.prototype.last_list = function(xs) {
      if (xs.length <= 0) {
        throw new Error(this._i18nBundle['list is empty']());
      } else {
        return this._listPrims.last(xs);
      }
    };

    PrimsMiddle.prototype.log_number_number = function(x, base) {
      if (base <= 0) {
        throw new Error(this._i18nBundle['_ isnt a valid base for a logarithm'](base));
      } else {
        return NLMath.log(x, base);
      }
    };

    PrimsMiddle.prototype.max_list = function(xs) {
      var numbers;
      numbers = xs.filter(function(x) {
        return NLType(x).isNumber();
      });
      if (numbers.length <= 0) {
        throw new Error(this._i18nBundle['cant find the maximum of a list with no numbers _'](xs));
      } else {
        return this._listPrims.max(xs);
      }
    };

    PrimsMiddle.prototype.mean_list = function(xs) {
      if (xs.length <= 0) {
        throw new Error(this._i18nBundle['list is empty']());
      } else {
        return this._listPrims.mean(xs);
      }
    };

    PrimsMiddle.prototype.min_list = function(xs) {
      var numbers;
      numbers = xs.filter(function(x) {
        return NLType(x).isNumber();
      });
      if (numbers.length <= 0) {
        throw new Error(this._i18nBundle['cant find the minimum of a list with no numbers _'](xs));
      } else {
        return this._listPrims.min(xs);
      }
    };

    PrimsMiddle.prototype.nOf_number_agentset = function(n, agents) {
      var size;
      size = agents.size();
      if (n < 0) {
        throw new Error(this._i18nBundle['first input to n-of cant be negative']());
      } else if (n <= size) {
        throw new Error(this._i18nBundle['request _ random agents from a set of only _ agents'](n, size));
      } else {
        return this._listPrims.nOf_number_agentset(n, agents);
      }
    };

    PrimsMiddle.prototype.nOf_wildcard_wildcard = function(n, agentsOrList) {
      var type;
      type = NLType(agentsOrList);
      if (type.isList()) {
        return this._listPrims.nOf_number_list(n, agentsOrList);
      } else if (type.isAgentSet()) {
        return this.nOf_number_agentset(n, agentsOrList);
      } else {
        throw new Error("N-OF expected input to be a list or agentset but got " + (Dump(agentsOrList)) + " instead.");
      }
    };

    PrimsMiddle.prototype.of_agent_reporter = function(agent, f) {
      if (NLType(agent).isTurtle() && agent.isDead()) {
        throw new Error(this._i18nBundle['that _ is dead'](agent._finalBreedName));
      } else {
        return agent.projectionBy(f);
      }
    };

    PrimsMiddle.prototype.reduce_reportertask_list = function(task, xs) {
      if (xs.length === 0) {
        throw new Error(this._i18nBundle['the list argument to reduce must not be empty']());
      } else {
        return this._listPrims.reduce(task, xs);
      }
    };

    PrimsMiddle.prototype.removeItem_number_list = function(n, xs) {
      if (n < 0) {
        throw new Error(this._i18nBundle['isnt greater than or equal to zero'](n));
      } else if (n <= xs.length) {
        throw new Error(this._i18nBundle['cant find element _ of the'](n, this._dumper(xs), this._i18nBundle.ListTypeName, xs.length));
      } else {
        return this._listPrims.removeItem_number_list(n, xs);
      }
    };

    PrimsMiddle.prototype.removeItem_number_string = function(n, str) {
      if (n < 0) {
        throw new Error(this._i18nBundle['isnt greater than or equal to zero'](n));
      } else if (n <= xs.length) {
        throw new Error(this._i18nBundle['cant find element _ of the _ _ which is only of length _'](n, this._dumper(str), this._i18nBundle.StringTypeName, str.length));
      } else {
        return this._listPrims.removeItem_number_string(n, str);
      }
    };

    PrimsMiddle.prototype.replaceItem_number_list_any = function(n, xs, x) {
      if (n < 0) {
        throw new Error(this._i18nBundle['isnt greater than or equal to zero'](n));
      } else if (n <= xs.length) {
        throw new Error(this._i18nBundle['cant find element _ of the _ _ which is only of length _'](n, this._dumper(xs), xs.length));
      } else {
        return this._listPrims.replaceItem(n, xs, x);
      }
    };

    PrimsMiddle.prototype.setVariable_string_any = function(name, value) {
      var self, selfType, valueType;
      self = SelfManager.self();
      selfType = NLType(self);
      valueType = NLType(value);
      if (name === "breed" && (selfType.isTurtle() && (!valueType.isTurtleSet()))) {
        throw new Error(this._i18nBundle['you cant set breed to a non-breed agentset']());
      }
      if (name === "breed" && (selfType.isLink() && (!valueType.isLinkSet()))) {
        throw new Error(this._i18nBundle['you cant set breed to a non-link-breed agentset']());
      } else {
        self.setVariable(name, value);
      }
    };

    PrimsMiddle.prototype.sqrt_number = function(x) {
      if (x < 0) {
        throw new Error(this._i18nBundle['the square root of is an imaginary number'](x));
      } else {
        return NLMath.sqrt(x);
      }
    };

    PrimsMiddle.prototype.sublist_list_number_number = function(xs, start, end) {
      if (start < 0) {
        throw new Error(this._i18nBundle['_ is less than zero'](start));
      } else if (end < start) {
        throw new Error(this._i18nBundle['_ is less than _'](end, start));
      } else if (end > xs.length) {
        throw new Error(this._i18nBundle['_ is greater than the length of the input list (_)'](end, xs.length));
      } else {
        return this._listPrims.sublist(xs, start, end);
      }
    };

    PrimsMiddle.prototype.variance = function(xs) {
      var numbers;
      numbers = xs.filter(function(x) {
        return NLType(x).isNumber();
      });
      if (numbers.length < 2) {
        throw new Error(this._i18nBundle['cant find the variance of a list without at least two numbers _'](this._dumper(xs)));
      } else {
        return this._listPrims.variance(numbers);
      }
    };

    return PrimsMiddle;

  })();

}).call(this);

},{}],"engine/prim/mouseprims":[function(require,module,exports){
(function() {
  var MouseConfig, MousePrims;

  module.exports.Config = MouseConfig = (function() {
    function MouseConfig(peekIsDown, peekIsInside, peekX, peekY) {
      this.peekIsDown = peekIsDown != null ? peekIsDown : (function() {
        return false;
      });
      this.peekIsInside = peekIsInside != null ? peekIsInside : (function() {
        return false;
      });
      this.peekX = peekX != null ? peekX : (function() {
        return 0;
      });
      this.peekY = peekY != null ? peekY : (function() {
        return 0;
      });
    }

    return MouseConfig;

  })();

  module.exports.Prims = MousePrims = (function() {
    function MousePrims(arg) {
      this.isDown = arg.peekIsDown, this.isInside = arg.peekIsInside, this.getX = arg.peekX, this.getY = arg.peekY;
    }

    return MousePrims;

  })();

}).call(this);

},{}],"engine/prim/outputprims":[function(require,module,exports){
(function() {
  var OutputConfig, OutputPrims, genPrintBundle;

  genPrintBundle = require('./printbundle');

  module.exports.Config = OutputConfig = (function() {
    function OutputConfig(clear, write1) {
      this.clear = clear != null ? clear : (function() {});
      this.write = write1 != null ? write1 : (function() {});
    }

    return OutputConfig;

  })();

  module.exports.Prims = OutputPrims = (function() {
    OutputPrims.prototype.clear = void 0;

    OutputPrims.prototype.print = void 0;

    OutputPrims.prototype.show = void 0;

    OutputPrims.prototype.type = void 0;

    OutputPrims.prototype.write = void 0;

    function OutputPrims(arg, dump) {
      var ref, write;
      this.clear = arg.clear, write = arg.write;
      ref = genPrintBundle(write, dump), this.print = ref.print, this.show = ref.show, this.type = ref.type, this.write = ref.write;
    }

    return OutputPrims;

  })();

}).call(this);

},{"./printbundle":"engine/prim/printbundle"}],"engine/prim/prims":[function(require,module,exports){
(function() {
  var AbstractAgentSet, EQ, Exception, GT, LT, Link, LinkSet, MersenneTwisterFast, NLMath, NLType, Nobody, Patch, PatchSet, Prims, StrictMath, Timer, Turtle, TurtleSet, _, ref,
    slice = [].slice;

  _ = require('lodash');

  AbstractAgentSet = require('../core/abstractagentset');

  Link = require('../core/link');

  LinkSet = require('../core/linkset');

  Nobody = require('../core/nobody');

  Patch = require('../core/patch');

  PatchSet = require('../core/patchset');

  Turtle = require('../core/turtle');

  TurtleSet = require('../core/turtleset');

  NLType = require('../core/typechecker');

  StrictMath = require('shim/strictmath');

  Exception = require('util/exception');

  NLMath = require('util/nlmath');

  Timer = require('util/timer');

  MersenneTwisterFast = require('shim/engine-scala').MersenneTwisterFast;

  ref = require('util/comparator'), EQ = ref.EQUALS, GT = ref.GREATER_THAN, LT = ref.LESS_THAN;

  module.exports = Prims = (function() {
    Prims.prototype._everyMap = void 0;

    function Prims(_dumper, _hasher, _rng) {
      this._dumper = _dumper;
      this._hasher = _hasher;
      this._rng = _rng;
      this._everyMap = {};
    }

    Prims.prototype.boom = function() {
      throw new Error("boom!");
    };

    Prims.prototype.breedOn = function(breedName, x) {
      var patches, turtles, type;
      type = NLType(x);
      patches = (function() {
        if (type.isPatch()) {
          return [x];
        } else if (type.isTurtle()) {
          return [x.getPatchHere()];
        } else if (type.isPatchSet()) {
          return x.toArray();
        } else if (type.isTurtleSet()) {
          return _(x.iterator().toArray()).map(function(t) {
            return t.getPatchHere();
          }).value();
        } else {
          throw new Error("`breed-on` unsupported for class '" + (typeof x) + "'");
        }
      })();
      turtles = _(patches).map(function(p) {
        return p.breedHereArray(breedName);
      }).flatten().value();
      return new TurtleSet(turtles);
    };

    Prims.prototype.div = function(a, b) {
      if (b !== 0) {
        return a / b;
      } else {
        throw new Error("Division by zero.");
      }
    };

    Prims.prototype.equality = function(a, b) {
      var subsumes, typeA, typeB;
      if ((a != null) && (b != null)) {
        typeA = NLType(a);
        typeB = NLType(b);
        return (a === b) || typeA.isBreedSet(typeof b.getSpecialName === "function" ? b.getSpecialName() : void 0) || typeB.isBreedSet(typeof a.getSpecialName === "function" ? a.getSpecialName() : void 0) || (a === Nobody && (typeof b.isDead === "function" ? b.isDead() : void 0)) || (b === Nobody && (typeof a.isDead === "function" ? a.isDead() : void 0)) || ((typeA.isTurtle() || (typeA.isLink() && b !== Nobody)) && a.compare(b) === EQ) || (typeA.isList() && typeB.isList() && a.length === b.length && a.every((function(_this) {
          return function(elem, i) {
            return _this.equality(elem, b[i]);
          };
        })(this))) || (typeA.isAgentSet() && typeB.isAgentSet() && a.size() === b.size() && Object.getPrototypeOf(a) === Object.getPrototypeOf(b) && (subsumes = (function(_this) {
          return function(xs, ys) {
            var index, j, len, x;
            for (index = j = 0, len = xs.length; j < len; index = ++j) {
              x = xs[index];
              if (!_this.equality(ys[index], x)) {
                return false;
              }
            }
            return true;
          };
        })(this), subsumes(a.sort(), b.sort())));
      } else {
        throw new Error("Checking equality on undefined is an invalid condition");
      }
    };

    Prims.prototype.dateAndTime = function() {
      var amOrPM, calendarComponent, clockTime, d, date, hours, hoursNum, millis, minutes, modHours, month, numberToMonth, seconds, withThreeDigits, withTwoDigits, year;
      withTwoDigits = function(x) {
        return (x < 10 ? "0" : "") + x;
      };
      withThreeDigits = function(x) {
        return (x < 10 ? "00" : x < 100 ? "0" : "") + x;
      };
      numberToMonth = {
        1: "Jan",
        2: "Feb",
        3: "Mar",
        4: "Apr",
        5: "May",
        6: "Jun",
        7: "Jul",
        8: "Aug",
        9: "Sep",
        10: "Oct",
        11: "Nov",
        12: "Dec"
      };
      d = new Date;
      hoursNum = d.getHours();
      modHours = hoursNum === 0 || hoursNum === 12 ? 12 : hoursNum % 12;
      hours = withTwoDigits(modHours);
      minutes = withTwoDigits(d.getMinutes());
      seconds = withTwoDigits(d.getSeconds());
      clockTime = hours + ":" + minutes + ":" + seconds;
      millis = withThreeDigits(d.getMilliseconds());
      amOrPM = hoursNum >= 12 ? "PM" : "AM";
      date = withTwoDigits(d.getDate());
      month = numberToMonth[d.getMonth() + 1];
      year = d.getFullYear();
      calendarComponent = date + "-" + month + "-" + year;
      return clockTime + "." + millis + " " + amOrPM + " " + calendarComponent;
    };

    Prims.prototype.isThrottleTimeElapsed = function(commandID, agent, timeLimit) {
      var entry;
      entry = this._everyMap[this._genEveryKey(commandID, agent)];
      return (entry == null) || entry.elapsed() >= timeLimit;
    };

    Prims.prototype.resetThrottleTimerFor = function(commandID, agent) {
      return this._everyMap[this._genEveryKey(commandID, agent)] = new Timer();
    };

    Prims.prototype.generateNewSeed = (function() {
      var helper, lastSeed;
      lastSeed = 0;
      helper = function() {
        var seed;
        seed = (new MersenneTwisterFast).nextInt();
        if (seed !== lastSeed) {
          lastSeed = seed;
          return seed;
        } else {
          return helper();
        }
      };
      return helper;
    })();

    Prims.prototype.gt = function(a, b) {
      var typeA, typeB;
      typeA = NLType(a);
      typeB = NLType(b);
      if ((typeA.isString() && typeB.isString()) || (typeA.isNumber() && typeB.isNumber())) {
        return a > b;
      } else if (typeof a === typeof b && (a.compare != null) && (b.compare != null)) {
        return a.compare(b) === GT;
      } else {
        throw new Error("Invalid operands to `gt`");
      }
    };

    Prims.prototype.gte = function(a, b) {
      return this.gt(a, b) || this.equality(a, b);
    };

    Prims.prototype.linkSet = function() {
      var inputs;
      inputs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this._createAgentSet(inputs, Link, LinkSet);
    };

    Prims.prototype.lt = function(a, b) {
      var typeA, typeB;
      typeA = NLType(a);
      typeB = NLType(b);
      if ((typeA.isString() && typeB.isString()) || (typeA.isNumber() && typeB.isNumber())) {
        return a < b;
      } else if (typeof a === typeof b && (a.compare != null) && (b.compare != null)) {
        return a.compare(b) === LT;
      } else {
        throw new Error("Invalid operands to `lt`");
      }
    };

    Prims.prototype.lte = function(a, b) {
      return this.lt(a, b) || this.equality(a, b);
    };

    Prims.prototype.nanoTime = function() {
      var nanos;
      nanos = (typeof performance !== "undefined" && performance !== null ? performance.now : void 0) != null ? performance.now() * 1e3 : Date.now() * 1e6;
      return nanos | 0;
    };

    Prims.prototype.patchSet = function() {
      var inputs;
      inputs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this._createAgentSet(inputs, Patch, PatchSet);
    };

    Prims.prototype.random = function(n) {
      var truncated;
      truncated = n >= 0 ? StrictMath.ceil(n) : StrictMath.floor(n);
      if (truncated === 0) {
        return 0;
      } else if (truncated > 0) {
        return this._rng.nextLong(truncated);
      } else {
        return -this._rng.nextLong(-truncated);
      }
    };

    Prims.prototype.randomCoord = function(min, max) {
      return min - 0.5 + this._rng.nextDouble() * (max - min + 1);
    };

    Prims.prototype.randomFloat = function(n) {
      return n * this._rng.nextDouble();
    };

    Prims.prototype.randomNormal = function(mean, stdDev) {
      if (stdDev >= 0) {
        return NLMath.validateNumber(mean + stdDev * this._rng.nextGaussian());
      } else {
        throw new Error("random-normal's second input can't be negative.");
      }
    };

    Prims.prototype.randomExponential = function(mean) {
      return NLMath.validateNumber(-mean * StrictMath.log(this._rng.nextDouble()));
    };

    Prims.prototype.randomPatchCoord = function(min, max) {
      return min + this._rng.nextInt(max - min + 1);
    };

    Prims.prototype.randomPoisson = function(mean) {
      var q, sum;
      q = 0;
      sum = -StrictMath.log(1 - this._rng.nextDouble());
      while (sum <= mean) {
        q += 1;
        sum -= StrictMath.log(1 - this._rng.nextDouble());
      }
      return q;
    };

    Prims.prototype.turtleSet = function() {
      var inputs;
      inputs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this._createAgentSet(inputs, Turtle, TurtleSet);
    };

    Prims.prototype.turtlesOn = function(agentsOrAgent) {
      var turtles, type;
      type = NLType(agentsOrAgent);
      if (type.isAgentSet()) {
        turtles = _(agentsOrAgent.iterator().toArray()).map(function(agent) {
          return agent.turtlesHere().toArray();
        }).flatten().value();
        return new TurtleSet(turtles);
      } else {
        return agentsOrAgent.turtlesHere();
      }
    };

    Prims.prototype._genEveryKey = function(commandID, agent) {
      var agentID;
      agentID = agent === 0 ? "observer" : this._dumper(agent);
      return commandID + "__" + agentID;
    };

    Prims.prototype._createAgentSet = function(inputs, tClass, outClass) {
      var addT, buildFromAgentSet, buildItems, flattened, hashIt, hashSet, head, result;
      flattened = _(inputs).flattenDeep().value();
      if (_(flattened).isEmpty()) {
        return new outClass([]);
      } else if (flattened.length === 1) {
        head = flattened[0];
        if (head instanceof outClass) {
          return head;
        } else if (head instanceof tClass) {
          return new outClass([head]);
        } else {
          return new outClass([]);
        }
      } else {
        result = [];
        hashSet = {};
        hashIt = this._hasher;
        addT = function(p) {
          var hash;
          hash = hashIt(p);
          if (!hashSet.hasOwnProperty(hash)) {
            result.push(p);
            hashSet[hash] = true;
          }
        };
        buildFromAgentSet = function(agentSet) {
          return agentSet.forEach(addT);
        };
        buildItems = (function(_this) {
          return function(inputs) {
            var input, j, len, results;
            results = [];
            for (j = 0, len = inputs.length; j < len; j++) {
              input = inputs[j];
              if (NLType(input).isList()) {
                results.push(buildItems(input));
              } else if (input instanceof tClass) {
                results.push(addT(input));
              } else if (input !== Nobody) {
                results.push(buildFromAgentSet(input));
              } else {
                results.push(void 0);
              }
            }
            return results;
          };
        })(this);
        buildItems(flattened);
        return new outClass(result);
      }
    };

    return Prims;

  })();

}).call(this);

},{"../core/abstractagentset":"engine/core/abstractagentset","../core/link":"engine/core/link","../core/linkset":"engine/core/linkset","../core/nobody":"engine/core/nobody","../core/patch":"engine/core/patch","../core/patchset":"engine/core/patchset","../core/turtle":"engine/core/turtle","../core/turtleset":"engine/core/turtleset","../core/typechecker":"engine/core/typechecker","lodash":"lodash","shim/engine-scala":"shim/engine-scala","shim/strictmath":"shim/strictmath","util/comparator":"util/comparator","util/exception":"util/exception","util/nlmath":"util/nlmath","util/timer":"util/timer"}],"engine/prim/printbundle":[function(require,module,exports){
(function() {
  var PrintBundle, _,
    slice = [].slice;

  _ = require('lodash');

  PrintBundle = (function() {
    function PrintBundle(print1, type1, write1, show1) {
      this.print = print1;
      this.type = type1;
      this.write = write1;
      this.show = show1;
    }

    return PrintBundle;

  })();

  module.exports = function(printFunc, dump) {
    var dumpWrapped, newLine, preSpace, prependAgent, print, show, type, write, writeAfter;
    preSpace = function(s) {
      return " " + s;
    };
    newLine = function(s) {
      return s + "\n";
    };
    dumpWrapped = function(s) {
      return dump(s, true);
    };
    prependAgent = function(thunk) {
      return function(s) {
        var agentOrZero, agentStr;
        agentOrZero = thunk();
        agentStr = agentOrZero === 0 ? "observer" : dump(agentOrZero);
        return agentStr + ": " + s;
      };
    };
    writeAfter = function() {
      var fs;
      fs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return _.flow.apply(_, slice.call(fs).concat([printFunc]));
    };
    print = writeAfter(dump, newLine);
    type = writeAfter(dump);
    write = writeAfter(dumpWrapped, preSpace);
    show = function(agentThunk) {
      return writeAfter(dumpWrapped, prependAgent(agentThunk), newLine);
    };
    return new PrintBundle(print, type, write, show);
  };

}).call(this);

},{"lodash":"lodash"}],"engine/prim/printprims":[function(require,module,exports){
(function() {
  var PrintConfig, PrintPrims, genPrintBundle;

  genPrintBundle = require('./printbundle');

  module.exports.Config = PrintConfig = (function() {
    function PrintConfig(write1) {
      this.write = write1 != null ? write1 : (function() {});
    }

    return PrintConfig;

  })();

  module.exports.Prims = PrintPrims = (function() {
    PrintPrims.prototype.print = void 0;

    PrintPrims.prototype.show = void 0;

    PrintPrims.prototype.type = void 0;

    PrintPrims.prototype.write = void 0;

    function PrintPrims(arg, dump) {
      var ref, write;
      write = arg.write;
      ref = genPrintBundle(write, dump), this.print = ref.print, this.show = ref.show, this.type = ref.type, this.write = ref.write;
    }

    return PrintPrims;

  })();

}).call(this);

},{"./printbundle":"engine/prim/printbundle"}],"engine/prim/selfprims":[function(require,module,exports){
(function() {
  var SelfPrims, TypeSet, linkType, mempty, observerType, patchType, turtleType;

  TypeSet = (function() {
    function TypeSet(link1, observer1, patch1, turtle1) {
      this.link = link1;
      this.observer = observer1;
      this.patch = patch1;
      this.turtle = turtle1;
    }

    TypeSet.prototype.mergeWith = function(arg) {
      var link, observer, patch, turtle;
      link = arg.link, observer = arg.observer, patch = arg.patch, turtle = arg.turtle;
      return new TypeSet(this.link || link, this.observer || observer, this.patch || patch, this.turtle || turtle);
    };

    TypeSet.prototype.mappend = function(ts) {
      return this.mergeWith(ts);
    };

    return TypeSet;

  })();

  mempty = new TypeSet(false, false, false, false);

  linkType = new TypeSet(true, false, false, false);

  observerType = new TypeSet(false, true, false, false);

  patchType = new TypeSet(false, false, true, false);

  turtleType = new TypeSet(false, false, false, true);

  module.exports = SelfPrims = (function() {
    function SelfPrims(_getSelf) {
      this._getSelf = _getSelf;
    }

    SelfPrims.prototype.other = function(agentSet) {
      var self;
      self = this._getSelf();
      return agentSet.filter((function(_this) {
        return function(agent) {
          return agent !== self;
        };
      })(this));
    };

    SelfPrims.prototype.linkHeading = function() {
      return this._getSelfSafe(linkType).getHeading();
    };

    SelfPrims.prototype.linkLength = function() {
      return this._getSelfSafe(linkType).getSize();
    };

    SelfPrims.prototype._getSelfSafe = function(typeSet) {
      var agentStr, allowsL, allowsP, allowsT, part1, part2, self, type, typeStr;
      allowsL = typeSet.link, allowsP = typeSet.patch, allowsT = typeSet.turtle;
      self = this._getSelf();
      type = NLType(self);
      if ((type.isTurtle() && allowsT) || (type.isPatch() && allowsP) || (type.isLink() && allowsL)) {
        return self;
      } else {
        typeStr = this._nlTypeToString(type);
        part1 = "this code can't be run by " + typeStr;
        agentStr = this._typeSetToAgentString(typeSet);
        part2 = agentStr.length !== 0 ? ", only " + agentStr : "";
        throw new Error(part1 + part2);
      }
    };

    SelfPrims.prototype._nlTypeToString = function(nlType) {
      if (nlType.isTurtle()) {
        return "a turtle";
      } else if (nlType.isPatch()) {
        return "a patch";
      } else if (nlType.isLink()) {
        return "a link";
      } else {
        return "";
      }
    };

    SelfPrims.prototype._typeSetToAgentString = function(typeSet) {
      if (typeSet.turtle) {
        return "a turtle";
      } else if (typeSet.patch) {
        return "a patch";
      } else if (typeSet.link) {
        return "a link";
      } else {
        return "";
      }
    };

    return SelfPrims;

  })();

}).call(this);

},{}],"engine/prim/tasks":[function(require,module,exports){
(function() {
  var Exception, _,
    slice = [].slice;

  _ = require('lodash');

  Exception = require('util/exception');

  module.exports = {
    commandTask: function(fn) {
      fn.isReporter = false;
      return fn;
    },
    reporterTask: function(fn) {
      fn.isReporter = true;
      return fn;
    },
    map: function() {
      var fn, lists;
      fn = arguments[0], lists = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return this._processLists(fn, lists, "map");
    },
    nValues: function(n, fn) {
      return _(0).range(n).map(fn).value();
    },
    forEach: function() {
      var fn, lists;
      fn = arguments[0], lists = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      this._processLists(fn, lists, "foreach");
    },
    _processLists: function(fn, lists, primName) {
      var head, numLists;
      numLists = lists.length;
      head = lists[0];
      if (numLists === 1) {
        return head.map(fn);
      } else if (_(lists).all(function(l) {
        return l.length === head.length;
      })) {
        return _.zip.apply(_, lists).map(function(tuple) {
          return fn.apply(null, tuple);
        });
      } else {
        throw new Error("All the list arguments to " + (primName.toUpperCase()) + " must be the same length.");
      }
    }
  };

}).call(this);

},{"lodash":"lodash","util/exception":"util/exception"}],"engine/prim/userdialogprims":[function(require,module,exports){
(function() {
  var HaltInterrupt, UserDialogConfig, UserDialogPrims;

  HaltInterrupt = require('util/exception').HaltInterrupt;

  module.exports.Config = UserDialogConfig = (function() {
    function UserDialogConfig(notify, confirm) {
      this.notify = notify != null ? notify : (function() {});
      this.confirm = confirm != null ? confirm : (function() {
        return true;
      });
    }

    return UserDialogConfig;

  })();

  module.exports.Prims = UserDialogPrims = (function() {
    function UserDialogPrims(arg) {
      this._confirm = arg.confirm;
    }

    UserDialogPrims.prototype.confirm = function(msg) {
      if (!this._confirm(msg)) {
        throw new HaltInterrupt;
      }
    };

    return UserDialogPrims;

  })();

}).call(this);

},{"util/exception":"util/exception"}],"engine/updater":[function(require,module,exports){
(function() {
  var Dump, Exception, Link, Observer, Patch, Turtle, Update, Updater, World, ignored,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  Dump = require('./dump');

  Link = require('./core/link');

  Observer = require('./core/observer');

  Patch = require('./core/patch');

  Turtle = require('./core/turtle');

  World = require('./core/world');

  Exception = require('util/exception');

  ignored = ["", ""];

  Update = (function() {
    function Update(turtles, patches, links, observer1, world1, drawingEvents) {
      this.turtles = turtles != null ? turtles : {};
      this.patches = patches != null ? patches : {};
      this.links = links != null ? links : {};
      this.observer = observer1 != null ? observer1 : {};
      this.world = world1 != null ? world1 : {};
      this.drawingEvents = drawingEvents != null ? drawingEvents : [];
    }

    return Update;

  })();

  module.exports = Updater = (function() {
    Updater.prototype._hasUpdates = void 0;

    Updater.prototype._updates = void 0;

    function Updater() {
      this.updated = bind(this.updated, this);
      this.registerLinkStamp = bind(this.registerLinkStamp, this);
      this.registerTurtleStamp = bind(this.registerTurtleStamp, this);
      this.registerPenTrail = bind(this.registerPenTrail, this);
      this.registerDeadTurtle = bind(this.registerDeadTurtle, this);
      this.registerDeadLink = bind(this.registerDeadLink, this);
      this._flushUpdates();
    }

    Updater.prototype.clearDrawing = function() {
      this._reportDrawingEvent({
        type: "clear-drawing"
      });
    };

    Updater.prototype.collectUpdates = function() {
      var temp;
      temp = this._updates;
      this._flushUpdates();
      return temp;
    };

    Updater.prototype.hasUpdates = function() {
      return this._hasUpdates;
    };

    Updater.prototype.registerDeadLink = function(id) {
      this._update("links", id, {
        WHO: -1
      });
    };

    Updater.prototype.registerDeadTurtle = function(id) {
      this._update("turtles", id, {
        WHO: -1
      });
    };

    Updater.prototype.registerPenTrail = function(fromX, fromY, toX, toY, rgb, size, penMode) {
      this._reportDrawingEvent({
        type: "line",
        fromX: fromX,
        fromY: fromY,
        toX: toX,
        toY: toY,
        rgb: rgb,
        size: size,
        penMode: penMode
      });
    };

    Updater.prototype.registerTurtleStamp = function(x, y, size, heading, color, shapeName, stampMode) {
      this._reportDrawingEvent({
        type: "stamp-image",
        agentType: "turtle",
        stamp: {
          x: x,
          y: y,
          size: size,
          heading: heading,
          color: color,
          shapeName: shapeName,
          stampMode: stampMode
        }
      });
    };

    Updater.prototype.registerLinkStamp = function(x1, y1, x2, y2, midpointX, midpointY, heading, color, shapeName, thickness, isDirected, size, isHidden, stampMode) {
      this._reportDrawingEvent({
        type: "stamp-image",
        agentType: "link",
        stamp: {
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2,
          midpointX: midpointX,
          midpointY: midpointY,
          heading: heading,
          color: color,
          shapeName: shapeName,
          thickness: thickness,
          'directed?': isDirected,
          size: size,
          'hidden?': isHidden,
          stampMode: stampMode
        }
      });
    };

    Updater.prototype.registerWorldState = function(state, id) {
      if (id == null) {
        id = 0;
      }
      this._update("world", id, state);
    };

    Updater.prototype.updated = function(obj) {
      return (function(_this) {
        return function() {
          var entry, entryUpdate, i, len, mapping, objMap, ref, ref1, update, v, value, varName, vars;
          vars = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          _this._hasUpdates = true;
          update = _this._updates[0];
          ref = (function() {
            if (obj instanceof Turtle) {
              return [update.turtles, this._turtleMap(obj)];
            } else if (obj instanceof Patch) {
              return [update.patches, this._patchMap(obj)];
            } else if (obj instanceof Link) {
              return [update.links, this._linkMap(obj)];
            } else if (obj instanceof World) {
              return [update.world, this._worldMap(obj)];
            } else if (obj instanceof Observer) {
              return [update.observer, this._observerMap(obj)];
            } else {
              throw new Error("Unrecognized update type");
            }
          }).call(_this), entry = ref[0], objMap = ref[1];
          entryUpdate = (ref1 = entry[obj.id]) != null ? ref1 : {};
          if (entryUpdate['WHO'] < 0) {
            delete entryUpdate['WHO'];
          }
          for (i = 0, len = vars.length; i < len; i++) {
            v = vars[i];
            mapping = objMap[v];
            if (mapping != null) {
              if (mapping !== ignored) {
                varName = mapping[0], value = mapping[1];
                entryUpdate[varName] = value;
                entry[obj.id] = entryUpdate;
              }
            } else {
              throw new Error("Unknown " + obj.constructor.name + " variable for update: " + v);
            }
          }
        };
      })(this);
    };

    Updater.prototype._turtleMap = function(turtle) {
      return {
        breed: ["BREED", turtle.getBreedName()],
        color: ["COLOR", turtle._color],
        heading: ["HEADING", turtle._heading],
        id: ["WHO", turtle.id],
        'label-color': ["LABEL-COLOR", turtle._labelcolor],
        'hidden?': ["HIDDEN?", turtle._hidden],
        label: ["LABEL", Dump(turtle._label)],
        'pen-size': ["PEN-SIZE", turtle.penManager.getSize()],
        'pen-mode': ["PEN-MODE", turtle.penManager.getMode().toString()],
        shape: ["SHAPE", turtle._getShape()],
        size: ["SIZE", turtle._size],
        xcor: ["XCOR", turtle.xcor],
        ycor: ["YCOR", turtle.ycor]
      };
    };

    Updater.prototype._patchMap = function(patch) {
      return {
        id: ["WHO", patch.id],
        pcolor: ["PCOLOR", patch._pcolor],
        plabel: ["PLABEL", Dump(patch._plabel)],
        'plabel-color': ["PLABEL-COLOR", patch._plabelcolor],
        pxcor: ["PXCOR", patch.pxcor],
        pycor: ["PYCOR", patch.pycor]
      };
    };

    Updater.prototype._linkMap = function(link) {
      return {
        breed: ["BREED", link.getBreedName()],
        color: ["COLOR", link._color],
        end1: ["END1", link.end1.id],
        end2: ["END2", link.end2.id],
        heading: ["HEADING", this._withDefault(link.getHeading.bind(link))(0)],
        'hidden?': ["HIDDEN?", link._isHidden],
        id: ["ID", link.id],
        'directed?': ["DIRECTED?", link.isDirected],
        label: ["LABEL", Dump(link._label)],
        'label-color': ["LABEL-COLOR", link._labelcolor],
        midpointx: ["MIDPOINTX", link.getMidpointX()],
        midpointy: ["MIDPOINTY", link.getMidpointY()],
        shape: ["SHAPE", link._shape],
        size: ["SIZE", link.getSize()],
        thickness: ["THICKNESS", link._thickness],
        'tie-mode': ["TIE-MODE", link.tiemode],
        lcolor: ignored,
        llabel: ignored,
        llabelcolor: ignored,
        lhidden: ignored,
        lbreed: ignored,
        lshape: ignored
      };
    };

    Updater.prototype._worldMap = function(world) {
      return {
        height: ["worldHeight", world.topology.height],
        id: ["WHO", world.id],
        patchesAllBlack: ["patchesAllBlack", world._patchesAllBlack],
        patchesWithLabels: ["patchesWithLabels", world._patchesWithLabels],
        maxPxcor: ["MAXPXCOR", world.topology.maxPxcor],
        maxPycor: ["MAXPYCOR", world.topology.maxPycor],
        minPxcor: ["MINPXCOR", world.topology.minPxcor],
        minPycor: ["MINPYCOR", world.topology.minPycor],
        patchSize: ["patchSize", world.patchSize],
        ticks: ["ticks", world.ticker._count],
        unbreededLinksAreDirected: ["unbreededLinksAreDirected", world.breedManager.links().isDirected()],
        width: ["worldWidth", world.topology.width],
        wrappingAllowedInX: ["wrappingAllowedInX", world.topology._wrapInX],
        wrappingAllowedInY: ["wrappingAllowedInY", world.topology._wrapInY]
      };
    };

    Updater.prototype._observerMap = function(observer) {
      return {
        id: ["WHO", observer.id],
        perspective: ["perspective", observer._perspective.toInt],
        targetAgent: ["targetAgent", observer._getTargetAgentUpdate()]
      };
    };

    Updater.prototype._update = function(agentType, id, newAgent) {
      this._hasUpdates = true;
      this._updates[0][agentType][id] = newAgent;
    };

    Updater.prototype._reportDrawingEvent = function(event) {
      this._updates[0].drawingEvents.push(event);
    };

    Updater.prototype._flushUpdates = function() {
      this._hasUpdates = false;
      this._updates = [new Update()];
    };

    Updater.prototype._withDefault = function(thunk) {
      return function(defaultValue) {
        var error, ex;
        try {
          return thunk();
        } catch (error) {
          ex = error;
          return defaultValue;
        }
      };
    };

    return Updater;

  })();

}).call(this);

},{"./core/link":"engine/core/link","./core/observer":"engine/core/observer","./core/patch":"engine/core/patch","./core/turtle":"engine/core/turtle","./core/world":"engine/core/world","./dump":"engine/dump","util/exception":"util/exception"}],"engine/workspace":[function(require,module,exports){
(function() {
  var BreedManager, Dump, Hasher, LayoutManager, LinkPrims, ListPrims, MiniWorkspace, MouseConfig, MousePrims, OutputConfig, OutputPrims, PlotManager, Prims, PrintConfig, PrintPrims, RNG, SelfManager, SelfPrims, Timer, Updater, UserDialogConfig, UserDialogPrims, World, ref, ref1, ref2, ref3,
    slice = [].slice;

  Dump = require('./dump');

  Hasher = require('./hasher');

  Updater = require('./updater');

  BreedManager = require('./core/breedmanager');

  World = require('./core/world');

  SelfManager = require('./core/structure/selfmanager');

  PlotManager = require('./plot/plotmanager');

  LayoutManager = require('./prim/layoutmanager');

  LinkPrims = require('./prim/linkprims');

  ListPrims = require('./prim/listprims');

  Prims = require('./prim/prims');

  SelfPrims = require('./prim/selfprims');

  RNG = require('util/rng');

  Timer = require('util/timer');

  ref = require('./prim/mouseprims'), MouseConfig = ref.Config, MousePrims = ref.Prims;

  ref1 = require('./prim/outputprims'), OutputConfig = ref1.Config, OutputPrims = ref1.Prims;

  ref2 = require('./prim/printprims'), PrintConfig = ref2.Config, PrintPrims = ref2.Prims;

  ref3 = require('./prim/userdialogprims'), UserDialogConfig = ref3.Config, UserDialogPrims = ref3.Prims;

  MiniWorkspace = (function() {
    function MiniWorkspace(selfManager1, updater1, breedManager1, rng1, plotManager1) {
      this.selfManager = selfManager1;
      this.updater = updater1;
      this.breedManager = breedManager1;
      this.rng = rng1;
      this.plotManager = plotManager1;
    }

    return MiniWorkspace;

  })();

  module.exports = function(modelConfig) {
    return function(breedObjs) {
      return function(turtlesOwns, linksOwns) {
        return function() {
          var breedManager, dialogConfig, layoutManager, linkPrims, listPrims, mouseConfig, mousePrims, outputConfig, outputPrims, plotManager, plots, prims, printConfig, printPrims, ref4, ref5, ref6, ref7, ref8, rng, selfManager, selfPrims, timer, updater, userDialogPrims, world, worldArgs;
          worldArgs = arguments;
          dialogConfig = (ref4 = modelConfig != null ? modelConfig.dialog : void 0) != null ? ref4 : new UserDialogConfig;
          mouseConfig = (ref5 = modelConfig != null ? modelConfig.mouse : void 0) != null ? ref5 : new MouseConfig;
          outputConfig = (ref6 = modelConfig != null ? modelConfig.output : void 0) != null ? ref6 : new OutputConfig;
          plots = (ref7 = modelConfig != null ? modelConfig.plots : void 0) != null ? ref7 : [];
          printConfig = (ref8 = modelConfig != null ? modelConfig.print : void 0) != null ? ref8 : new PrintConfig;
          rng = new RNG;
          selfManager = new SelfManager;
          breedManager = new BreedManager(breedObjs, turtlesOwns, linksOwns);
          plotManager = new PlotManager(plots);
          prims = new Prims(Dump, Hasher, rng);
          selfPrims = new SelfPrims(selfManager.self);
          timer = new Timer;
          updater = new Updater;
          world = (function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return Object(result) === result ? result : child;
          })(World, [new MiniWorkspace(selfManager, updater, breedManager, rng, plotManager)].concat(slice.call(worldArgs)), function(){});
          layoutManager = new LayoutManager(world, rng.nextDouble);
          linkPrims = new LinkPrims(world);
          listPrims = new ListPrims(Hasher, prims.equality.bind(prims), rng.nextInt);
          mousePrims = new MousePrims(mouseConfig);
          outputPrims = new OutputPrims(outputConfig, Dump);
          printPrims = new PrintPrims(printConfig, Dump);
          userDialogPrims = new UserDialogPrims(dialogConfig);
          return {
            selfManager: selfManager,
            breedManager: breedManager,
            layoutManager: layoutManager,
            linkPrims: linkPrims,
            listPrims: listPrims,
            mousePrims: mousePrims,
            outputPrims: outputPrims,
            plotManager: plotManager,
            prims: prims,
            printPrims: printPrims,
            rng: rng,
            selfPrims: selfPrims,
            timer: timer,
            updater: updater,
            userDialogPrims: userDialogPrims,
            world: world
          };
        };
      };
    };
  };

}).call(this);

},{"./core/breedmanager":"engine/core/breedmanager","./core/structure/selfmanager":"engine/core/structure/selfmanager","./core/world":"engine/core/world","./dump":"engine/dump","./hasher":"engine/hasher","./plot/plotmanager":"engine/plot/plotmanager","./prim/layoutmanager":"engine/prim/layoutmanager","./prim/linkprims":"engine/prim/linkprims","./prim/listprims":"engine/prim/listprims","./prim/mouseprims":"engine/prim/mouseprims","./prim/outputprims":"engine/prim/outputprims","./prim/prims":"engine/prim/prims","./prim/printprims":"engine/prim/printprims","./prim/selfprims":"engine/prim/selfprims","./prim/userdialogprims":"engine/prim/userdialogprims","./updater":"engine/updater","util/rng":"util/rng","util/timer":"util/timer"}],"lodash":[function(require,module,exports){
(function (global){
/**
 * @license
 * lodash 3.10.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern -d -o ./index.js`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
  var undefined;

  /** Used as the semantic version number. */
  var VERSION = '3.10.1';

  /** Used to compose bitmasks for wrapper metadata. */
  var BIND_FLAG = 1,
      BIND_KEY_FLAG = 2,
      CURRY_BOUND_FLAG = 4,
      CURRY_FLAG = 8,
      CURRY_RIGHT_FLAG = 16,
      PARTIAL_FLAG = 32,
      PARTIAL_RIGHT_FLAG = 64,
      ARY_FLAG = 128,
      REARG_FLAG = 256;

  /** Used as default options for `_.trunc`. */
  var DEFAULT_TRUNC_LENGTH = 30,
      DEFAULT_TRUNC_OMISSION = '...';

  /** Used to detect when a function becomes hot. */
  var HOT_COUNT = 150,
      HOT_SPAN = 16;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Used to indicate the type of lazy iteratees. */
  var LAZY_FILTER_FLAG = 1,
      LAZY_MAP_FLAG = 2;

  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /** Used as the internal argument placeholder. */
  var PLACEHOLDER = '__lodash_placeholder__';

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to match empty string literals in compiled template source. */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match HTML entities and HTML characters. */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g,
      reUnescapedHtml = /[&<>"'`]/g,
      reHasEscapedHtml = RegExp(reEscapedHtml.source),
      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

  /** Used to match template delimiters. */
  var reEscape = /<%-([\s\S]+?)%>/g,
      reEvaluate = /<%([\s\S]+?)%>/g,
      reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

  /**
   * Used to match `RegExp` [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns)
   * and those outlined by [`EscapeRegExpPattern`](http://ecma-international.org/ecma-262/6.0/#sec-escaperegexppattern).
   */
  var reRegExpChars = /^[:!,]|[\\^$.*+?()[\]{}|\/]|(^[0-9a-fA-Fnrtuvx])|([\n\r\u2028\u2029])/g,
      reHasRegExpChars = RegExp(reRegExpChars.source);

  /** Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks). */
  var reComboMark = /[\u0300-\u036f\ufe20-\ufe23]/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /** Used to match [ES template delimiters](http://ecma-international.org/ecma-262/6.0/#sec-template-literal-lexical-components). */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /** Used to detect hexadecimal string values. */
  var reHasHexPrefix = /^0[xX]/;

  /** Used to detect host constructors (Safari > 5). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^\d+$/;

  /** Used to match latin-1 supplementary letters (excluding mathematical operators). */
  var reLatin1 = /[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g;

  /** Used to ensure capturing order of template delimiters. */
  var reNoMatch = /($^)/;

  /** Used to match unescaped characters in compiled string literals. */
  var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

  /** Used to match words to create compound words. */
  var reWords = (function() {
    var upper = '[A-Z\\xc0-\\xd6\\xd8-\\xde]',
        lower = '[a-z\\xdf-\\xf6\\xf8-\\xff]+';

    return RegExp(upper + '+(?=' + upper + lower + ')|' + upper + '?' + lower + '|' + upper + '+|[0-9]+', 'g');
  }());

  /** Used to assign default `context` object properties. */
  var contextProps = [
    'Array', 'ArrayBuffer', 'Date', 'Error', 'Float32Array', 'Float64Array',
    'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Math', 'Number',
    'Object', 'RegExp', 'Set', 'String', '_', 'clearTimeout', 'isFinite',
    'parseFloat', 'parseInt', 'setTimeout', 'TypeError', 'Uint8Array',
    'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap'
  ];

  /** Used to make template sourceURLs easier to identify. */
  var templateCounter = -1;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dateTag] = typedArrayTags[errorTag] =
  typedArrayTags[funcTag] = typedArrayTags[mapTag] =
  typedArrayTags[numberTag] = typedArrayTags[objectTag] =
  typedArrayTags[regexpTag] = typedArrayTags[setTag] =
  typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] =
  cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
  cloneableTags[dateTag] = cloneableTags[float32Tag] =
  cloneableTags[float64Tag] = cloneableTags[int8Tag] =
  cloneableTags[int16Tag] = cloneableTags[int32Tag] =
  cloneableTags[numberTag] = cloneableTags[objectTag] =
  cloneableTags[regexpTag] = cloneableTags[stringTag] =
  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] =
  cloneableTags[mapTag] = cloneableTags[setTag] =
  cloneableTags[weakMapTag] = false;

  /** Used to map latin-1 supplementary letters to basic latin letters. */
  var deburredLetters = {
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcC': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xeC': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss'
  };

  /** Used to map characters to HTML entities. */
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
  };

  /** Used to map HTML entities to characters. */
  var htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#96;': '`'
  };

  /** Used to determine if values are of the language type `Object`. */
  var objectTypes = {
    'function': true,
    'object': true
  };

  /** Used to escape characters for inclusion in compiled regexes. */
  var regexpEscapes = {
    '0': 'x30', '1': 'x31', '2': 'x32', '3': 'x33', '4': 'x34',
    '5': 'x35', '6': 'x36', '7': 'x37', '8': 'x38', '9': 'x39',
    'A': 'x41', 'B': 'x42', 'C': 'x43', 'D': 'x44', 'E': 'x45', 'F': 'x46',
    'a': 'x61', 'b': 'x62', 'c': 'x63', 'd': 'x64', 'e': 'x65', 'f': 'x66',
    'n': 'x6e', 'r': 'x72', 't': 'x74', 'u': 'x75', 'v': 'x76', 'x': 'x78'
  };

  /** Used to escape characters for inclusion in compiled string literals. */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Detect free variable `exports`. */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global && global.Object && global;

  /** Detect free variable `self`. */
  var freeSelf = objectTypes[typeof self] && self && self.Object && self;

  /** Detect free variable `window`. */
  var freeWindow = objectTypes[typeof window] && window && window.Object && window;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /**
   * Used as a reference to the global object.
   *
   * The `this` value is used if it's the global object to avoid Greasemonkey's
   * restricted `window` object, otherwise the `window` object is used.
   */
  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || freeSelf || this;

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `compareAscending` which compares values and
   * sorts them in ascending order without guaranteeing a stable sort.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {number} Returns the sort order indicator for `value`.
   */
  function baseCompareAscending(value, other) {
    if (value !== other) {
      var valIsNull = value === null,
          valIsUndef = value === undefined,
          valIsReflexive = value === value;

      var othIsNull = other === null,
          othIsUndef = other === undefined,
          othIsReflexive = other === other;

      if ((value > other && !othIsNull) || !valIsReflexive ||
          (valIsNull && !othIsUndef && othIsReflexive) ||
          (valIsUndef && othIsReflexive)) {
        return 1;
      }
      if ((value < other && !valIsNull) || !othIsReflexive ||
          (othIsNull && !valIsUndef && valIsReflexive) ||
          (othIsUndef && valIsReflexive)) {
        return -1;
      }
    }
    return 0;
  }

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for callback shorthands and `this` binding.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {Function} predicate The function invoked per iteration.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromRight) {
    var length = array.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.indexOf` without support for binary searches.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    if (value !== value) {
      return indexOfNaN(array, fromIndex);
    }
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.isFunction` without support for environments
   * with incorrect `typeof` results.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   */
  function baseIsFunction(value) {
    // Avoid a Chakra JIT bug in compatibility modes of IE 11.
    // See https://github.com/jashkenas/underscore/issues/1621 for more details.
    return typeof value == 'function' || false;
  }

  /**
   * Converts `value` to a string if it's not one. An empty string is returned
   * for `null` or `undefined` values.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    return value == null ? '' : (value + '');
  }

  /**
   * Used by `_.trim` and `_.trimLeft` to get the index of the first character
   * of `string` that is not found in `chars`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @param {string} chars The characters to find.
   * @returns {number} Returns the index of the first character not found in `chars`.
   */
  function charsLeftIndex(string, chars) {
    var index = -1,
        length = string.length;

    while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimRight` to get the index of the last character
   * of `string` that is not found in `chars`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @param {string} chars The characters to find.
   * @returns {number} Returns the index of the last character not found in `chars`.
   */
  function charsRightIndex(string, chars) {
    var index = string.length;

    while (index-- && chars.indexOf(string.charAt(index)) > -1) {}
    return index;
  }

  /**
   * Used by `_.sortBy` to compare transformed elements of a collection and stable
   * sort them in ascending order.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareAscending(object, other) {
    return baseCompareAscending(object.criteria, other.criteria) || (object.index - other.index);
  }

  /**
   * Used by `_.sortByOrder` to compare multiple properties of a value to another
   * and stable sort them.
   *
   * If `orders` is unspecified, all valuess are sorted in ascending order. Otherwise,
   * a value is sorted in ascending order if its corresponding order is "asc", and
   * descending if "desc".
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {boolean[]} orders The order to sort by for each property.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareMultiple(object, other, orders) {
    var index = -1,
        objCriteria = object.criteria,
        othCriteria = other.criteria,
        length = objCriteria.length,
        ordersLength = orders.length;

    while (++index < length) {
      var result = baseCompareAscending(objCriteria[index], othCriteria[index]);
      if (result) {
        if (index >= ordersLength) {
          return result;
        }
        var order = orders[index];
        return result * ((order === 'asc' || order === true) ? 1 : -1);
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to provide the same value for
    // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
    // for more details.
    //
    // This also ensures a stable sort in V8 and other engines.
    // See https://code.google.com/p/v8/issues/detail?id=90 for more details.
    return object.index - other.index;
  }

  /**
   * Used by `_.deburr` to convert latin-1 supplementary letters to basic latin letters.
   *
   * @private
   * @param {string} letter The matched letter to deburr.
   * @returns {string} Returns the deburred letter.
   */
  function deburrLetter(letter) {
    return deburredLetters[letter];
  }

  /**
   * Used by `_.escape` to convert characters to HTML entities.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeHtmlChar(chr) {
    return htmlEscapes[chr];
  }

  /**
   * Used by `_.escapeRegExp` to escape characters for inclusion in compiled regexes.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @param {string} leadingChar The capture group for a leading character.
   * @param {string} whitespaceChar The capture group for a whitespace character.
   * @returns {string} Returns the escaped character.
   */
  function escapeRegExpChar(chr, leadingChar, whitespaceChar) {
    if (leadingChar) {
      chr = regexpEscapes[chr];
    } else if (whitespaceChar) {
      chr = stringEscapes[chr];
    }
    return '\\' + chr;
  }

  /**
   * Used by `_.template` to escape characters for inclusion in compiled string literals.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(chr) {
    return '\\' + stringEscapes[chr];
  }

  /**
   * Gets the index at which the first occurrence of `NaN` is found in `array`.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched `NaN`, else `-1`.
   */
  function indexOfNaN(array, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 0 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      var other = array[index];
      if (other !== other) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Checks if `value` is object-like.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  /**
   * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a
   * character code is whitespace.
   *
   * @private
   * @param {number} charCode The character code to inspect.
   * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.
   */
  function isSpace(charCode) {
    return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
      (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
  }

  /**
   * Replaces all `placeholder` elements in `array` with an internal placeholder
   * and returns an array of their indexes.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {*} placeholder The placeholder to replace.
   * @returns {Array} Returns the new array of placeholder indexes.
   */
  function replaceHolders(array, placeholder) {
    var index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      if (array[index] === placeholder) {
        array[index] = PLACEHOLDER;
        result[++resIndex] = index;
      }
    }
    return result;
  }

  /**
   * An implementation of `_.uniq` optimized for sorted arrays without support
   * for callback shorthands and `this` binding.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} [iteratee] The function invoked per iteration.
   * @returns {Array} Returns the new duplicate-value-free array.
   */
  function sortedUniq(array, iteratee) {
    var seen,
        index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      var value = array[index],
          computed = iteratee ? iteratee(value, index, array) : value;

      if (!index || seen !== computed) {
        seen = computed;
        result[++resIndex] = value;
      }
    }
    return result;
  }

  /**
   * Used by `_.trim` and `_.trimLeft` to get the index of the first non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the first non-whitespace character.
   */
  function trimmedLeftIndex(string) {
    var index = -1,
        length = string.length;

    while (++index < length && isSpace(string.charCodeAt(index))) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimRight` to get the index of the last non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the last non-whitespace character.
   */
  function trimmedRightIndex(string) {
    var index = string.length;

    while (index-- && isSpace(string.charCodeAt(index))) {}
    return index;
  }

  /**
   * Used by `_.unescape` to convert HTML entities to characters.
   *
   * @private
   * @param {string} chr The matched character to unescape.
   * @returns {string} Returns the unescaped character.
   */
  function unescapeHtmlChar(chr) {
    return htmlUnescapes[chr];
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new pristine `lodash` function using the given `context` object.
   *
   * @static
   * @memberOf _
   * @category Utility
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns a new `lodash` function.
   * @example
   *
   * _.mixin({ 'foo': _.constant('foo') });
   *
   * var lodash = _.runInContext();
   * lodash.mixin({ 'bar': lodash.constant('bar') });
   *
   * _.isFunction(_.foo);
   * // => true
   * _.isFunction(_.bar);
   * // => false
   *
   * lodash.isFunction(lodash.foo);
   * // => false
   * lodash.isFunction(lodash.bar);
   * // => true
   *
   * // using `context` to mock `Date#getTime` use in `_.now`
   * var mock = _.runInContext({
   *   'Date': function() {
   *     return { 'getTime': getTimeMock };
   *   }
   * });
   *
   * // or creating a suped-up `defer` in Node.js
   * var defer = _.runInContext({ 'setTimeout': setImmediate }).defer;
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See https://es5.github.io/#x11.1.5 for more details.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references. */
    var Array = context.Array,
        Date = context.Date,
        Error = context.Error,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /** Used for native method references. */
    var arrayProto = Array.prototype,
        objectProto = Object.prototype,
        stringProto = String.prototype;

    /** Used to resolve the decompiled source of functions. */
    var fnToString = Function.prototype.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to generate unique IDs. */
    var idCounter = 0;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objToString = objectProto.toString;

    /** Used to restore the original `_` reference in `_.noConflict`. */
    var oldDash = root._;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Native method references. */
    var ArrayBuffer = context.ArrayBuffer,
        clearTimeout = context.clearTimeout,
        parseFloat = context.parseFloat,
        pow = Math.pow,
        propertyIsEnumerable = objectProto.propertyIsEnumerable,
        Set = getNative(context, 'Set'),
        setTimeout = context.setTimeout,
        splice = arrayProto.splice,
        Uint8Array = context.Uint8Array,
        WeakMap = getNative(context, 'WeakMap');

    /* Native method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil,
        nativeCreate = getNative(Object, 'create'),
        nativeFloor = Math.floor,
        nativeIsArray = getNative(Array, 'isArray'),
        nativeIsFinite = context.isFinite,
        nativeKeys = getNative(Object, 'keys'),
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeNow = getNative(Date, 'now'),
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used as references for `-Infinity` and `Infinity`. */
    var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY,
        POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

    /** Used as references for the maximum length and index of an array. */
    var MAX_ARRAY_LENGTH = 4294967295,
        MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1,
        HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

    /**
     * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
     * of an array-like value.
     */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /** Used to store function metadata. */
    var metaMap = WeakMap && new WeakMap;

    /** Used to lookup unminified function names. */
    var realNames = {};

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps `value` to enable implicit chaining.
     * Methods that operate on and return arrays, collections, and functions can
     * be chained together. Methods that retrieve a single value or may return a
     * primitive value will automatically end the chain returning the unwrapped
     * value. Explicit chaining may be enabled using `_.chain`. The execution of
     * chained methods is lazy, that is, execution is deferred until `_#value`
     * is implicitly or explicitly called.
     *
     * Lazy evaluation allows several methods to support shortcut fusion. Shortcut
     * fusion is an optimization strategy which merge iteratee calls; this can help
     * to avoid the creation of intermediate data structures and greatly reduce the
     * number of iteratee executions.
     *
     * Chaining is supported in custom builds as long as the `_#value` method is
     * directly or indirectly included in the build.
     *
     * In addition to lodash methods, wrappers have `Array` and `String` methods.
     *
     * The wrapper `Array` methods are:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`,
     * `splice`, and `unshift`
     *
     * The wrapper `String` methods are:
     * `replace` and `split`
     *
     * The wrapper methods that support shortcut fusion are:
     * `compact`, `drop`, `dropRight`, `dropRightWhile`, `dropWhile`, `filter`,
     * `first`, `initial`, `last`, `map`, `pluck`, `reject`, `rest`, `reverse`,
     * `slice`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, `toArray`,
     * and `where`
     *
     * The chainable wrapper methods are:
     * `after`, `ary`, `assign`, `at`, `before`, `bind`, `bindAll`, `bindKey`,
     * `callback`, `chain`, `chunk`, `commit`, `compact`, `concat`, `constant`,
     * `countBy`, `create`, `curry`, `debounce`, `defaults`, `defaultsDeep`,
     * `defer`, `delay`, `difference`, `drop`, `dropRight`, `dropRightWhile`,
     * `dropWhile`, `fill`, `filter`, `flatten`, `flattenDeep`, `flow`, `flowRight`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`,
     * `matchesProperty`, `memoize`, `merge`, `method`, `methodOf`, `mixin`,
     * `modArgs`, `negate`, `omit`, `once`, `pairs`, `partial`, `partialRight`,
     * `partition`, `pick`, `plant`, `pluck`, `property`, `propertyOf`, `pull`,
     * `pullAt`, `push`, `range`, `rearg`, `reject`, `remove`, `rest`, `restParam`,
     * `reverse`, `set`, `shuffle`, `slice`, `sort`, `sortBy`, `sortByAll`,
     * `sortByOrder`, `splice`, `spread`, `take`, `takeRight`, `takeRightWhile`,
     * `takeWhile`, `tap`, `throttle`, `thru`, `times`, `toArray`, `toPlainObject`,
     * `transform`, `union`, `uniq`, `unshift`, `unzip`, `unzipWith`, `values`,
     * `valuesIn`, `where`, `without`, `wrap`, `xor`, `zip`, `zipObject`, `zipWith`
     *
     * The wrapper methods that are **not** chainable by default are:
     * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clone`, `cloneDeep`,
     * `deburr`, `endsWith`, `escape`, `escapeRegExp`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `findWhere`, `first`,
     * `floor`, `get`, `gt`, `gte`, `has`, `identity`, `includes`, `indexOf`,
     * `inRange`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isError`, `isFinite` `isFunction`, `isMatch`,
     * `isNative`, `isNaN`, `isNull`, `isNumber`, `isObject`, `isPlainObject`,
     * `isRegExp`, `isString`, `isUndefined`, `isTypedArray`, `join`, `kebabCase`,
     * `last`, `lastIndexOf`, `lt`, `lte`, `max`, `min`, `noConflict`, `noop`,
     * `now`, `pad`, `padLeft`, `padRight`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `repeat`, `result`, `round`, `runInContext`, `shift`, `size`,
     * `snakeCase`, `some`, `sortedIndex`, `sortedLastIndex`, `startCase`,
     * `startsWith`, `sum`, `template`, `trim`, `trimLeft`, `trimRight`, `trunc`,
     * `unescape`, `uniqueId`, `value`, and `words`
     *
     * The wrapper method `sample` will return a wrapped value when `n` is provided,
     * otherwise an unwrapped value is returned.
     *
     * @name _
     * @constructor
     * @category Chain
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(total, n) {
     *   return total + n;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(n) {
     *   return n * n;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
        if (value instanceof LodashWrapper) {
          return value;
        }
        if (hasOwnProperty.call(value, '__chain__') && hasOwnProperty.call(value, '__wrapped__')) {
          return wrapperClone(value);
        }
      }
      return new LodashWrapper(value);
    }

    /**
     * The function whose prototype all chaining wrappers inherit from.
     *
     * @private
     */
    function baseLodash() {
      // No operation performed.
    }

    /**
     * The base constructor for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap.
     * @param {boolean} [chainAll] Enable chaining for all wrapper methods.
     * @param {Array} [actions=[]] Actions to peform to resolve the unwrapped value.
     */
    function LodashWrapper(value, chainAll, actions) {
      this.__wrapped__ = value;
      this.__actions__ = actions || [];
      this.__chain__ = !!chainAll;
    }

    /**
     * An object environment feature flags.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * By default, the template delimiters used by lodash are like those in
     * embedded Ruby (ERB). Change the following template settings to use
     * alternative delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': reEscape,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': reEvaluate,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*------------------------------------------------------------------------*/

    /**
     * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
     *
     * @private
     * @param {*} value The value to wrap.
     */
    function LazyWrapper(value) {
      this.__wrapped__ = value;
      this.__actions__ = [];
      this.__dir__ = 1;
      this.__filtered__ = false;
      this.__iteratees__ = [];
      this.__takeCount__ = POSITIVE_INFINITY;
      this.__views__ = [];
    }

    /**
     * Creates a clone of the lazy wrapper object.
     *
     * @private
     * @name clone
     * @memberOf LazyWrapper
     * @returns {Object} Returns the cloned `LazyWrapper` object.
     */
    function lazyClone() {
      var result = new LazyWrapper(this.__wrapped__);
      result.__actions__ = arrayCopy(this.__actions__);
      result.__dir__ = this.__dir__;
      result.__filtered__ = this.__filtered__;
      result.__iteratees__ = arrayCopy(this.__iteratees__);
      result.__takeCount__ = this.__takeCount__;
      result.__views__ = arrayCopy(this.__views__);
      return result;
    }

    /**
     * Reverses the direction of lazy iteration.
     *
     * @private
     * @name reverse
     * @memberOf LazyWrapper
     * @returns {Object} Returns the new reversed `LazyWrapper` object.
     */
    function lazyReverse() {
      if (this.__filtered__) {
        var result = new LazyWrapper(this);
        result.__dir__ = -1;
        result.__filtered__ = true;
      } else {
        result = this.clone();
        result.__dir__ *= -1;
      }
      return result;
    }

    /**
     * Extracts the unwrapped value from its lazy wrapper.
     *
     * @private
     * @name value
     * @memberOf LazyWrapper
     * @returns {*} Returns the unwrapped value.
     */
    function lazyValue() {
      var array = this.__wrapped__.value(),
          dir = this.__dir__,
          isArr = isArray(array),
          isRight = dir < 0,
          arrLength = isArr ? array.length : 0,
          view = getView(0, arrLength, this.__views__),
          start = view.start,
          end = view.end,
          length = end - start,
          index = isRight ? end : (start - 1),
          iteratees = this.__iteratees__,
          iterLength = iteratees.length,
          resIndex = 0,
          takeCount = nativeMin(length, this.__takeCount__);

      if (!isArr || arrLength < LARGE_ARRAY_SIZE || (arrLength == length && takeCount == length)) {
        return baseWrapperValue((isRight && isArr) ? array.reverse() : array, this.__actions__);
      }
      var result = [];

      outer:
      while (length-- && resIndex < takeCount) {
        index += dir;

        var iterIndex = -1,
            value = array[index];

        while (++iterIndex < iterLength) {
          var data = iteratees[iterIndex],
              iteratee = data.iteratee,
              type = data.type,
              computed = iteratee(value);

          if (type == LAZY_MAP_FLAG) {
            value = computed;
          } else if (!computed) {
            if (type == LAZY_FILTER_FLAG) {
              continue outer;
            } else {
              break outer;
            }
          }
        }
        result[resIndex++] = value;
      }
      return result;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a cache object to store key/value pairs.
     *
     * @private
     * @static
     * @name Cache
     * @memberOf _.memoize
     */
    function MapCache() {
      this.__data__ = {};
    }

    /**
     * Removes `key` and its value from the cache.
     *
     * @private
     * @name delete
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed successfully, else `false`.
     */
    function mapDelete(key) {
      return this.has(key) && delete this.__data__[key];
    }

    /**
     * Gets the cached value for `key`.
     *
     * @private
     * @name get
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the cached value.
     */
    function mapGet(key) {
      return key == '__proto__' ? undefined : this.__data__[key];
    }

    /**
     * Checks if a cached value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapHas(key) {
      return key != '__proto__' && hasOwnProperty.call(this.__data__, key);
    }

    /**
     * Sets `value` to `key` of the cache.
     *
     * @private
     * @name set
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to cache.
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache object.
     */
    function mapSet(key, value) {
      if (key != '__proto__') {
        this.__data__[key] = value;
      }
      return this;
    }

    /*------------------------------------------------------------------------*/

    /**
     *
     * Creates a cache object to store unique values.
     *
     * @private
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var length = values ? values.length : 0;

      this.data = { 'hash': nativeCreate(null), 'set': new Set };
      while (length--) {
        this.push(values[length]);
      }
    }

    /**
     * Checks if `value` is in `cache` mimicking the return signature of
     * `_.indexOf` by returning `0` if the value is found, else `-1`.
     *
     * @private
     * @param {Object} cache The cache to search.
     * @param {*} value The value to search for.
     * @returns {number} Returns `0` if `value` is found, else `-1`.
     */
    function cacheIndexOf(cache, value) {
      var data = cache.data,
          result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

      return result ? 0 : -1;
    }

    /**
     * Adds `value` to the cache.
     *
     * @private
     * @name push
     * @memberOf SetCache
     * @param {*} value The value to cache.
     */
    function cachePush(value) {
      var data = this.data;
      if (typeof value == 'string' || isObject(value)) {
        data.set.add(value);
      } else {
        data.hash[value] = true;
      }
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a new array joining `array` with `other`.
     *
     * @private
     * @param {Array} array The array to join.
     * @param {Array} other The other array to join.
     * @returns {Array} Returns the new concatenated array.
     */
    function arrayConcat(array, other) {
      var index = -1,
          length = array.length,
          othIndex = -1,
          othLength = other.length,
          result = Array(length + othLength);

      while (++index < length) {
        result[index] = array[index];
      }
      while (++othIndex < othLength) {
        result[index++] = other[othIndex];
      }
      return result;
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function arrayCopy(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.forEach` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * A specialized version of `_.forEachRight` for arrays without support for
     * callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEachRight(array, iteratee) {
      var length = array.length;

      while (length--) {
        if (iteratee(array[length], length, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * A specialized version of `_.every` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     */
    function arrayEvery(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (!predicate(array[index], index, array)) {
          return false;
        }
      }
      return true;
    }

    /**
     * A specialized version of `baseExtremum` for arrays which invokes `iteratee`
     * with one argument: (value).
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {*} Returns the extremum value.
     */
    function arrayExtremum(array, iteratee, comparator, exValue) {
      var index = -1,
          length = array.length,
          computed = exValue,
          result = computed;

      while (++index < length) {
        var value = array[index],
            current = +iteratee(value);

        if (comparator(current, computed)) {
          computed = current;
          result = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.filter` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function arrayFilter(array, predicate) {
      var index = -1,
          length = array.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.map` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array.length,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
          length = values.length,
          offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.reduce` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initFromArray] Specify using the first element of `array`
     *  as the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduce(array, iteratee, accumulator, initFromArray) {
      var index = -1,
          length = array.length;

      if (initFromArray && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }

    /**
     * A specialized version of `_.reduceRight` for arrays without support for
     * callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initFromArray] Specify using the last element of `array`
     *  as the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduceRight(array, iteratee, accumulator, initFromArray) {
      var length = array.length;
      if (initFromArray && length) {
        accumulator = array[--length];
      }
      while (length--) {
        accumulator = iteratee(accumulator, array[length], length, array);
      }
      return accumulator;
    }

    /**
     * A specialized version of `_.some` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    /**
     * A specialized version of `_.sum` for arrays without support for callback
     * shorthands and `this` binding..
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {number} Returns the sum.
     */
    function arraySum(array, iteratee) {
      var length = array.length,
          result = 0;

      while (length--) {
        result += +iteratee(array[length]) || 0;
      }
      return result;
    }

    /**
     * Used by `_.defaults` to customize its `_.assign` use.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function assignDefaults(objectValue, sourceValue) {
      return objectValue === undefined ? sourceValue : objectValue;
    }

    /**
     * Used by `_.template` to customize its `_.assign` use.
     *
     * **Note:** This function is like `assignDefaults` except that it ignores
     * inherited property values when checking if a property is `undefined`.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @param {string} key The key associated with the object and source values.
     * @param {Object} object The destination object.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function assignOwnDefaults(objectValue, sourceValue, key, object) {
      return (objectValue === undefined || !hasOwnProperty.call(object, key))
        ? sourceValue
        : objectValue;
    }

    /**
     * A specialized version of `_.assign` for customizing assigned values without
     * support for argument juggling, multiple sources, and `this` binding `customizer`
     * functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} customizer The function to customize assigned values.
     * @returns {Object} Returns `object`.
     */
    function assignWith(object, source, customizer) {
      var index = -1,
          props = keys(source),
          length = props.length;

      while (++index < length) {
        var key = props[index],
            value = object[key],
            result = customizer(value, source[key], key, object, source);

        if ((result === result ? (result !== value) : (value === value)) ||
            (value === undefined && !(key in object))) {
          object[key] = result;
        }
      }
      return object;
    }

    /**
     * The base implementation of `_.assign` without support for argument juggling,
     * multiple sources, and `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return source == null
        ? object
        : baseCopy(source, keys(source), object);
    }

    /**
     * The base implementation of `_.at` without support for string collections
     * and individual key arguments.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {number[]|string[]} props The property names or indexes of elements to pick.
     * @returns {Array} Returns the new array of picked elements.
     */
    function baseAt(collection, props) {
      var index = -1,
          isNil = collection == null,
          isArr = !isNil && isArrayLike(collection),
          length = isArr ? collection.length : 0,
          propsLength = props.length,
          result = Array(propsLength);

      while(++index < propsLength) {
        var key = props[index];
        if (isArr) {
          result[index] = isIndex(key, length) ? collection[key] : undefined;
        } else {
          result[index] = isNil ? undefined : collection[key];
        }
      }
      return result;
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property names to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @returns {Object} Returns `object`.
     */
    function baseCopy(source, props, object) {
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];
        object[key] = source[key];
      }
      return object;
    }

    /**
     * The base implementation of `_.callback` which supports specifying the
     * number of arguments to provide to `func`.
     *
     * @private
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function baseCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (type == 'function') {
        return thisArg === undefined
          ? func
          : bindCallback(func, thisArg, argCount);
      }
      if (func == null) {
        return identity;
      }
      if (type == 'object') {
        return baseMatches(func);
      }
      return thisArg === undefined
        ? property(func)
        : baseMatchesProperty(func, thisArg);
    }

    /**
     * The base implementation of `_.clone` without support for argument juggling
     * and `this` binding `customizer` functions.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The object `value` belongs to.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
      var result;
      if (customizer) {
        result = object ? customizer(value, key, object) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return arrayCopy(value, result);
        }
      } else {
        var tag = objToString.call(value),
            isFunc = tag == funcTag;

        if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
          result = initCloneObject(isFunc ? {} : value);
          if (!isDeep) {
            return baseAssign(result, value);
          }
        } else {
          return cloneableTags[tag]
            ? initCloneByTag(value, tag, isDeep)
            : (object ? value : {});
        }
      }
      // Check for circular references and return its corresponding clone.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == value) {
          return stackB[length];
        }
      }
      // Add the source value to the stack of traversed objects and associate it with its clone.
      stackA.push(value);
      stackB.push(result);

      // Recursively populate clone (susceptible to call stack limits).
      (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
        result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
      });
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(prototype) {
        if (isObject(prototype)) {
          object.prototype = prototype;
          var result = new object;
          object.prototype = undefined;
        }
        return result || {};
      };
    }());

    /**
     * The base implementation of `_.delay` and `_.defer` which accepts an index
     * of where to slice the arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {Object} args The arguments provide to `func`.
     * @returns {number} Returns the timer id.
     */
    function baseDelay(func, wait, args) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * The base implementation of `_.difference` which accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Array} values The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     */
    function baseDifference(array, values) {
      var length = array ? array.length : 0,
          result = [];

      if (!length) {
        return result;
      }
      var index = -1,
          indexOf = getIndexOf(),
          isCommon = indexOf == baseIndexOf,
          cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
          valuesLength = values.length;

      if (cache) {
        indexOf = cacheIndexOf;
        isCommon = false;
        values = cache;
      }
      outer:
      while (++index < length) {
        var value = array[index];

        if (isCommon && value === value) {
          var valuesIndex = valuesLength;
          while (valuesIndex--) {
            if (values[valuesIndex] === value) {
              continue outer;
            }
          }
          result.push(value);
        }
        else if (indexOf(values, value, 0) < 0) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.forEach` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEach = createBaseEach(baseForOwn);

    /**
     * The base implementation of `_.forEachRight` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEachRight = createBaseEach(baseForOwnRight, true);

    /**
     * The base implementation of `_.every` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`
     */
    function baseEvery(collection, predicate) {
      var result = true;
      baseEach(collection, function(value, index, collection) {
        result = !!predicate(value, index, collection);
        return result;
      });
      return result;
    }

    /**
     * Gets the extremum value of `collection` invoking `iteratee` for each value
     * in `collection` to generate the criterion by which the value is ranked.
     * The `iteratee` is invoked with three arguments: (value, index|key, collection).
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {*} Returns the extremum value.
     */
    function baseExtremum(collection, iteratee, comparator, exValue) {
      var computed = exValue,
          result = computed;

      baseEach(collection, function(value, index, collection) {
        var current = +iteratee(value, index, collection);
        if (comparator(current, computed) || (current === exValue && current === result)) {
          computed = current;
          result = value;
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.fill` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     */
    function baseFill(array, value, start, end) {
      var length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : (end >>> 0);
      start >>>= 0;

      while (start < length) {
        array[start++] = value;
      }
      return array;
    }

    /**
     * The base implementation of `_.filter` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function baseFilter(collection, predicate) {
      var result = [];
      baseEach(collection, function(value, index, collection) {
        if (predicate(value, index, collection)) {
          result.push(value);
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
     * without support for callback shorthands and `this` binding, which iterates
     * over `collection` using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function} predicate The function invoked per iteration.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @param {boolean} [retKey] Specify returning the key of the found element
     *  instead of the element itself.
     * @returns {*} Returns the found element or its key, else `undefined`.
     */
    function baseFind(collection, predicate, eachFunc, retKey) {
      var result;
      eachFunc(collection, function(value, key, collection) {
        if (predicate(value, key, collection)) {
          result = retKey ? key : value;
          return false;
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.flatten` with added support for restricting
     * flattening and specifying the start index.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isDeep] Specify a deep flatten.
     * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
     * @param {Array} [result=[]] The initial result value.
     * @returns {Array} Returns the new flattened array.
     */
    function baseFlatten(array, isDeep, isStrict, result) {
      result || (result = []);

      var index = -1,
          length = array.length;

      while (++index < length) {
        var value = array[index];
        if (isObjectLike(value) && isArrayLike(value) &&
            (isStrict || isArray(value) || isArguments(value))) {
          if (isDeep) {
            // Recursively flatten arrays (susceptible to call stack limits).
            baseFlatten(value, isDeep, isStrict, result);
          } else {
            arrayPush(result, value);
          }
        } else if (!isStrict) {
          result[result.length] = value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `baseForIn` and `baseForOwn` which iterates
     * over `object` properties returned by `keysFunc` invoking `iteratee` for
     * each property. Iteratee functions may exit iteration early by explicitly
     * returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * This function is like `baseFor` except that it iterates over properties
     * in the opposite order.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseForRight = createBaseFor(true);

    /**
     * The base implementation of `_.forIn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForIn(object, iteratee) {
      return baseFor(object, iteratee, keysIn);
    }

    /**
     * The base implementation of `_.forOwn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return baseFor(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.forOwnRight` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwnRight(object, iteratee) {
      return baseForRight(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.functions` which creates an array of
     * `object` function property names filtered from those provided.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} props The property names to filter.
     * @returns {Array} Returns the new array of filtered property names.
     */
    function baseFunctions(object, props) {
      var index = -1,
          length = props.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var key = props[index];
        if (isFunction(object[key])) {
          result[++resIndex] = key;
        }
      }
      return result;
    }

    /**
     * The base implementation of `get` without support for string paths
     * and default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} path The path of the property to get.
     * @param {string} [pathKey] The key representation of path.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path, pathKey) {
      if (object == null) {
        return;
      }
      if (pathKey !== undefined && pathKey in toObject(object)) {
        path = [pathKey];
      }
      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[path[index++]];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * The base implementation of `_.isEqual` without support for `this` binding
     * `customizer` functions.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
    }

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `value` objects.
     * @param {Array} [stackB=[]] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = arrayTag,
          othTag = arrayTag;

      if (!objIsArr) {
        objTag = objToString.call(object);
        if (objTag == argsTag) {
          objTag = objectTag;
        } else if (objTag != objectTag) {
          objIsArr = isTypedArray(object);
        }
      }
      if (!othIsArr) {
        othTag = objToString.call(other);
        if (othTag == argsTag) {
          othTag = objectTag;
        } else if (othTag != objectTag) {
          othIsArr = isTypedArray(other);
        }
      }
      var objIsObj = objTag == objectTag,
          othIsObj = othTag == objectTag,
          isSameTag = objTag == othTag;

      if (isSameTag && !(objIsArr || objIsObj)) {
        return equalByTag(object, other, objTag);
      }
      if (!isLoose) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
        }
      }
      if (!isSameTag) {
        return false;
      }
      // Assume cyclic values are equal.
      // For more information on detecting circular references see https://es5.github.io/#JO.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == object) {
          return stackB[length] == other;
        }
      }
      // Add `object` and `other` to the stack of traversed objects.
      stackA.push(object);
      stackB.push(other);

      var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

      stackA.pop();
      stackB.pop();

      return result;
    }

    /**
     * The base implementation of `_.isMatch` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} matchData The propery names, values, and compare flags to match.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, matchData, customizer) {
      var index = matchData.length,
          length = index,
          noCustomizer = !customizer;

      if (object == null) {
        return !length;
      }
      object = toObject(object);
      while (index--) {
        var data = matchData[index];
        if ((noCustomizer && data[2])
              ? data[1] !== object[data[0]]
              : !(data[0] in object)
            ) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
          if (objValue === undefined && !(key in object)) {
            return false;
          }
        } else {
          var result = customizer ? customizer(objValue, srcValue, key) : undefined;
          if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.map` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function baseMap(collection, iteratee) {
      var index = -1,
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value, key, collection) {
        result[++index] = iteratee(value, key, collection);
      });
      return result;
    }

    /**
     * The base implementation of `_.matches` which does not clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     */
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        var key = matchData[0][0],
            value = matchData[0][1];

        return function(object) {
          if (object == null) {
            return false;
          }
          return object[key] === value && (value !== undefined || (key in toObject(object)));
        };
      }
      return function(object) {
        return baseIsMatch(object, matchData);
      };
    }

    /**
     * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} srcValue The value to compare.
     * @returns {Function} Returns the new function.
     */
    function baseMatchesProperty(path, srcValue) {
      var isArr = isArray(path),
          isCommon = isKey(path) && isStrictComparable(srcValue),
          pathKey = (path + '');

      path = toPath(path);
      return function(object) {
        if (object == null) {
          return false;
        }
        var key = pathKey;
        object = toObject(object);
        if ((isArr || !isCommon) && !(key in object)) {
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          if (object == null) {
            return false;
          }
          key = last(path);
          object = toObject(object);
        }
        return object[key] === srcValue
          ? (srcValue !== undefined || (key in object))
          : baseIsEqual(srcValue, object[key], undefined, true);
      };
    }

    /**
     * The base implementation of `_.merge` without support for argument juggling,
     * multiple sources, and `this` binding `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {Object} Returns `object`.
     */
    function baseMerge(object, source, customizer, stackA, stackB) {
      if (!isObject(object)) {
        return object;
      }
      var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
          props = isSrcArr ? undefined : keys(source);

      arrayEach(props || source, function(srcValue, key) {
        if (props) {
          key = srcValue;
          srcValue = source[key];
        }
        if (isObjectLike(srcValue)) {
          stackA || (stackA = []);
          stackB || (stackB = []);
          baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
        }
        else {
          var value = object[key],
              result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
              isCommon = result === undefined;

          if (isCommon) {
            result = srcValue;
          }
          if ((result !== undefined || (isSrcArr && !(key in object))) &&
              (isCommon || (result === result ? (result !== value) : (value === value)))) {
            object[key] = result;
          }
        }
      });
      return object;
    }

    /**
     * A specialized version of `baseMerge` for arrays and objects which performs
     * deep merges and tracks traversed objects enabling objects with circular
     * references to be merged.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {string} key The key of the value to merge.
     * @param {Function} mergeFunc The function to merge values.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
      var length = stackA.length,
          srcValue = source[key];

      while (length--) {
        if (stackA[length] == srcValue) {
          object[key] = stackB[length];
          return;
        }
      }
      var value = object[key],
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
          isCommon = result === undefined;

      if (isCommon) {
        result = srcValue;
        if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
          result = isArray(value)
            ? value
            : (isArrayLike(value) ? arrayCopy(value) : []);
        }
        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          result = isArguments(value)
            ? toPlainObject(value)
            : (isPlainObject(value) ? value : {});
        }
        else {
          isCommon = false;
        }
      }
      // Add the source value to the stack of traversed objects and associate
      // it with its merged value.
      stackA.push(srcValue);
      stackB.push(result);

      if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
      } else if (result === result ? (result !== value) : (value === value)) {
        object[key] = result;
      }
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new function.
     */
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     */
    function basePropertyDeep(path) {
      var pathKey = (path + '');
      path = toPath(path);
      return function(object) {
        return baseGet(object, path, pathKey);
      };
    }

    /**
     * The base implementation of `_.pullAt` without support for individual
     * index arguments and capturing the removed elements.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {number[]} indexes The indexes of elements to remove.
     * @returns {Array} Returns `array`.
     */
    function basePullAt(array, indexes) {
      var length = array ? indexes.length : 0;
      while (length--) {
        var index = indexes[length];
        if (index != previous && isIndex(index)) {
          var previous = index;
          splice.call(array, index, 1);
        }
      }
      return array;
    }

    /**
     * The base implementation of `_.random` without support for argument juggling
     * and returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns the random number.
     */
    function baseRandom(min, max) {
      return min + nativeFloor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.reduce` and `_.reduceRight` without support
     * for callback shorthands and `this` binding, which iterates over `collection`
     * using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} accumulator The initial value.
     * @param {boolean} initFromCollection Specify using the first or last element
     *  of `collection` as the initial value.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @returns {*} Returns the accumulated value.
     */
    function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
      eachFunc(collection, function(value, index, collection) {
        accumulator = initFromCollection
          ? (initFromCollection = false, value)
          : iteratee(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The base implementation of `setData` without support for hot loop detection.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var baseSetData = !metaMap ? identity : function(func, data) {
      metaMap.set(func, data);
      return func;
    };

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * The base implementation of `_.some` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function baseSome(collection, predicate) {
      var result;

      baseEach(collection, function(value, index, collection) {
        result = predicate(value, index, collection);
        return !result;
      });
      return !!result;
    }

    /**
     * The base implementation of `_.sortBy` which uses `comparer` to define
     * the sort order of `array` and replaces criteria objects with their
     * corresponding values.
     *
     * @private
     * @param {Array} array The array to sort.
     * @param {Function} comparer The function to define sort order.
     * @returns {Array} Returns `array`.
     */
    function baseSortBy(array, comparer) {
      var length = array.length;

      array.sort(comparer);
      while (length--) {
        array[length] = array[length].value;
      }
      return array;
    }

    /**
     * The base implementation of `_.sortByOrder` without param guards.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {boolean[]} orders The sort orders of `iteratees`.
     * @returns {Array} Returns the new sorted array.
     */
    function baseSortByOrder(collection, iteratees, orders) {
      var callback = getCallback(),
          index = -1;

      iteratees = arrayMap(iteratees, function(iteratee) { return callback(iteratee); });

      var result = baseMap(collection, function(value) {
        var criteria = arrayMap(iteratees, function(iteratee) { return iteratee(value); });
        return { 'criteria': criteria, 'index': ++index, 'value': value };
      });

      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }

    /**
     * The base implementation of `_.sum` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {number} Returns the sum.
     */
    function baseSum(collection, iteratee) {
      var result = 0;
      baseEach(collection, function(value, index, collection) {
        result += +iteratee(value, index, collection) || 0;
      });
      return result;
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The function invoked per iteration.
     * @returns {Array} Returns the new duplicate-value-free array.
     */
    function baseUniq(array, iteratee) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array.length,
          isCommon = indexOf == baseIndexOf,
          isLarge = isCommon && length >= LARGE_ARRAY_SIZE,
          seen = isLarge ? createCache() : null,
          result = [];

      if (seen) {
        indexOf = cacheIndexOf;
        isCommon = false;
      } else {
        isLarge = false;
        seen = iteratee ? [] : result;
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value, index, array) : value;

        if (isCommon && value === value) {
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === computed) {
              continue outer;
            }
          }
          if (iteratee) {
            seen.push(computed);
          }
          result.push(value);
        }
        else if (indexOf(seen, computed, 0) < 0) {
          if (iteratee || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.values` and `_.valuesIn` which creates an
     * array of `object` property values corresponding to the property names
     * of `props`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} props The property names to get values for.
     * @returns {Object} Returns the array of property values.
     */
    function baseValues(object, props) {
      var index = -1,
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /**
     * The base implementation of `_.dropRightWhile`, `_.dropWhile`, `_.takeRightWhile`,
     * and `_.takeWhile` without support for callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {Function} predicate The function invoked per iteration.
     * @param {boolean} [isDrop] Specify dropping elements instead of taking them.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseWhile(array, predicate, isDrop, fromRight) {
      var length = array.length,
          index = fromRight ? length : -1;

      while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {}
      return isDrop
        ? baseSlice(array, (fromRight ? 0 : index), (fromRight ? index + 1 : length))
        : baseSlice(array, (fromRight ? index + 1 : 0), (fromRight ? length : index));
    }

    /**
     * The base implementation of `wrapperValue` which returns the result of
     * performing a sequence of actions on the unwrapped `value`, where each
     * successive action is supplied the return value of the previous.
     *
     * @private
     * @param {*} value The unwrapped value.
     * @param {Array} actions Actions to peform to resolve the unwrapped value.
     * @returns {*} Returns the resolved value.
     */
    function baseWrapperValue(value, actions) {
      var result = value;
      if (result instanceof LazyWrapper) {
        result = result.value();
      }
      var index = -1,
          length = actions.length;

      while (++index < length) {
        var action = actions[index];
        result = action.func.apply(action.thisArg, arrayPush([result], action.args));
      }
      return result;
    }

    /**
     * Performs a binary search of `array` to determine the index at which `value`
     * should be inserted into `array` in order to maintain its sort order.
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function binaryIndex(array, value, retHighest) {
      var low = 0,
          high = array ? array.length : low;

      if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
        while (low < high) {
          var mid = (low + high) >>> 1,
              computed = array[mid];

          if ((retHighest ? (computed <= value) : (computed < value)) && computed !== null) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return high;
      }
      return binaryIndexBy(array, value, identity, retHighest);
    }

    /**
     * This function is like `binaryIndex` except that it invokes `iteratee` for
     * `value` and each element of `array` to compute their sort ranking. The
     * iteratee is invoked with one argument; (value).
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function binaryIndexBy(array, value, iteratee, retHighest) {
      value = iteratee(value);

      var low = 0,
          high = array ? array.length : 0,
          valIsNaN = value !== value,
          valIsNull = value === null,
          valIsUndef = value === undefined;

      while (low < high) {
        var mid = nativeFloor((low + high) / 2),
            computed = iteratee(array[mid]),
            isDef = computed !== undefined,
            isReflexive = computed === computed;

        if (valIsNaN) {
          var setLow = isReflexive || retHighest;
        } else if (valIsNull) {
          setLow = isReflexive && isDef && (retHighest || computed != null);
        } else if (valIsUndef) {
          setLow = isReflexive && (retHighest || isDef);
        } else if (computed == null) {
          setLow = false;
        } else {
          setLow = retHighest ? (computed <= value) : (computed < value);
        }
        if (setLow) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return nativeMin(high, MAX_ARRAY_INDEX);
    }

    /**
     * A specialized version of `baseCallback` which only supports `this` binding
     * and specifying the number of arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function bindCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      if (thisArg === undefined) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
        case 5: return function(value, other, key, object, source) {
          return func.call(thisArg, value, other, key, object, source);
        };
      }
      return function() {
        return func.apply(thisArg, arguments);
      };
    }

    /**
     * Creates a clone of the given array buffer.
     *
     * @private
     * @param {ArrayBuffer} buffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function bufferClone(buffer) {
      var result = new ArrayBuffer(buffer.byteLength),
          view = new Uint8Array(result);

      view.set(new Uint8Array(buffer));
      return result;
    }

    /**
     * Creates an array that is the composition of partially applied arguments,
     * placeholders, and provided arguments into a single array of arguments.
     *
     * @private
     * @param {Array|Object} args The provided arguments.
     * @param {Array} partials The arguments to prepend to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgs(args, partials, holders) {
      var holdersLength = holders.length,
          argsIndex = -1,
          argsLength = nativeMax(args.length - holdersLength, 0),
          leftIndex = -1,
          leftLength = partials.length,
          result = Array(leftLength + argsLength);

      while (++leftIndex < leftLength) {
        result[leftIndex] = partials[leftIndex];
      }
      while (++argsIndex < holdersLength) {
        result[holders[argsIndex]] = args[argsIndex];
      }
      while (argsLength--) {
        result[leftIndex++] = args[argsIndex++];
      }
      return result;
    }

    /**
     * This function is like `composeArgs` except that the arguments composition
     * is tailored for `_.partialRight`.
     *
     * @private
     * @param {Array|Object} args The provided arguments.
     * @param {Array} partials The arguments to append to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgsRight(args, partials, holders) {
      var holdersIndex = -1,
          holdersLength = holders.length,
          argsIndex = -1,
          argsLength = nativeMax(args.length - holdersLength, 0),
          rightIndex = -1,
          rightLength = partials.length,
          result = Array(argsLength + rightLength);

      while (++argsIndex < argsLength) {
        result[argsIndex] = args[argsIndex];
      }
      var offset = argsIndex;
      while (++rightIndex < rightLength) {
        result[offset + rightIndex] = partials[rightIndex];
      }
      while (++holdersIndex < holdersLength) {
        result[offset + holders[holdersIndex]] = args[argsIndex++];
      }
      return result;
    }

    /**
     * Creates a `_.countBy`, `_.groupBy`, `_.indexBy`, or `_.partition` function.
     *
     * @private
     * @param {Function} setter The function to set keys and values of the accumulator object.
     * @param {Function} [initializer] The function to initialize the accumulator object.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter, initializer) {
      return function(collection, iteratee, thisArg) {
        var result = initializer ? initializer() : {};
        iteratee = getCallback(iteratee, thisArg, 3);

        if (isArray(collection)) {
          var index = -1,
              length = collection.length;

          while (++index < length) {
            var value = collection[index];
            setter(result, value, iteratee(value, index, collection), collection);
          }
        } else {
          baseEach(collection, function(value, key, collection) {
            setter(result, value, iteratee(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @returns {Function} Returns the new assigner function.
     */
    function createAssigner(assigner) {
      return restParam(function(object, sources) {
        var index = -1,
            length = object == null ? 0 : sources.length,
            customizer = length > 2 ? sources[length - 2] : undefined,
            guard = length > 2 ? sources[2] : undefined,
            thisArg = length > 1 ? sources[length - 1] : undefined;

        if (typeof customizer == 'function') {
          customizer = bindCallback(customizer, thisArg, 5);
          length -= 2;
        } else {
          customizer = typeof thisArg == 'function' ? thisArg : undefined;
          length -= (customizer ? 1 : 0);
        }
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? undefined : customizer;
          length = 1;
        }
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, customizer);
          }
        }
        return object;
      });
    }

    /**
     * Creates a `baseEach` or `baseEachRight` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        var length = collection ? getLength(collection) : 0;
        if (!isLength(length)) {
          return eachFunc(collection, iteratee);
        }
        var index = fromRight ? length : -1,
            iterable = toObject(collection);

        while ((fromRight ? index-- : ++index < length)) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }

    /**
     * Creates a base function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var iterable = toObject(object),
            props = keysFunc(object),
            length = props.length,
            index = fromRight ? length : -1;

        while ((fromRight ? index-- : ++index < length)) {
          var key = props[index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * Creates a function that wraps `func` and invokes it with the `this`
     * binding of `thisArg`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @returns {Function} Returns the new bound function.
     */
    function createBindWrapper(func, thisArg) {
      var Ctor = createCtorWrapper(func);

      function wrapper() {
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(thisArg, arguments);
      }
      return wrapper;
    }

    /**
     * Creates a `Set` cache object to optimize linear searches of large arrays.
     *
     * @private
     * @param {Array} [values] The values to cache.
     * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
     */
    function createCache(values) {
      return (nativeCreate && Set) ? new SetCache(values) : null;
    }

    /**
     * Creates a function that produces compound words out of the words in a
     * given string.
     *
     * @private
     * @param {Function} callback The function to combine each word.
     * @returns {Function} Returns the new compounder function.
     */
    function createCompounder(callback) {
      return function(string) {
        var index = -1,
            array = words(deburr(string)),
            length = array.length,
            result = '';

        while (++index < length) {
          result = callback(result, array[index], index);
        }
        return result;
      };
    }

    /**
     * Creates a function that produces an instance of `Ctor` regardless of
     * whether it was invoked as part of a `new` expression or by `call` or `apply`.
     *
     * @private
     * @param {Function} Ctor The constructor to wrap.
     * @returns {Function} Returns the new wrapped function.
     */
    function createCtorWrapper(Ctor) {
      return function() {
        // Use a `switch` statement to work with class constructors.
        // See http://ecma-international.org/ecma-262/6.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
        // for more details.
        var args = arguments;
        switch (args.length) {
          case 0: return new Ctor;
          case 1: return new Ctor(args[0]);
          case 2: return new Ctor(args[0], args[1]);
          case 3: return new Ctor(args[0], args[1], args[2]);
          case 4: return new Ctor(args[0], args[1], args[2], args[3]);
          case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
          case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
          case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        }
        var thisBinding = baseCreate(Ctor.prototype),
            result = Ctor.apply(thisBinding, args);

        // Mimic the constructor's `return` behavior.
        // See https://es5.github.io/#x13.2.2 for more details.
        return isObject(result) ? result : thisBinding;
      };
    }

    /**
     * Creates a `_.curry` or `_.curryRight` function.
     *
     * @private
     * @param {boolean} flag The curry bit flag.
     * @returns {Function} Returns the new curry function.
     */
    function createCurry(flag) {
      function curryFunc(func, arity, guard) {
        if (guard && isIterateeCall(func, arity, guard)) {
          arity = undefined;
        }
        var result = createWrapper(func, flag, undefined, undefined, undefined, undefined, undefined, arity);
        result.placeholder = curryFunc.placeholder;
        return result;
      }
      return curryFunc;
    }

    /**
     * Creates a `_.defaults` or `_.defaultsDeep` function.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @param {Function} customizer The function to customize assigned values.
     * @returns {Function} Returns the new defaults function.
     */
    function createDefaults(assigner, customizer) {
      return restParam(function(args) {
        var object = args[0];
        if (object == null) {
          return object;
        }
        args.push(customizer);
        return assigner.apply(undefined, args);
      });
    }

    /**
     * Creates a `_.max` or `_.min` function.
     *
     * @private
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {Function} Returns the new extremum function.
     */
    function createExtremum(comparator, exValue) {
      return function(collection, iteratee, thisArg) {
        if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
          iteratee = undefined;
        }
        iteratee = getCallback(iteratee, thisArg, 3);
        if (iteratee.length == 1) {
          collection = isArray(collection) ? collection : toIterable(collection);
          var result = arrayExtremum(collection, iteratee, comparator, exValue);
          if (!(collection.length && result === exValue)) {
            return result;
          }
        }
        return baseExtremum(collection, iteratee, comparator, exValue);
      };
    }

    /**
     * Creates a `_.find` or `_.findLast` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFind(eachFunc, fromRight) {
      return function(collection, predicate, thisArg) {
        predicate = getCallback(predicate, thisArg, 3);
        if (isArray(collection)) {
          var index = baseFindIndex(collection, predicate, fromRight);
          return index > -1 ? collection[index] : undefined;
        }
        return baseFind(collection, predicate, eachFunc);
      };
    }

    /**
     * Creates a `_.findIndex` or `_.findLastIndex` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFindIndex(fromRight) {
      return function(array, predicate, thisArg) {
        if (!(array && array.length)) {
          return -1;
        }
        predicate = getCallback(predicate, thisArg, 3);
        return baseFindIndex(array, predicate, fromRight);
      };
    }

    /**
     * Creates a `_.findKey` or `_.findLastKey` function.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new find function.
     */
    function createFindKey(objectFunc) {
      return function(object, predicate, thisArg) {
        predicate = getCallback(predicate, thisArg, 3);
        return baseFind(object, predicate, objectFunc, true);
      };
    }

    /**
     * Creates a `_.flow` or `_.flowRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new flow function.
     */
    function createFlow(fromRight) {
      return function() {
        var wrapper,
            length = arguments.length,
            index = fromRight ? length : -1,
            leftIndex = 0,
            funcs = Array(length);

        while ((fromRight ? index-- : ++index < length)) {
          var func = funcs[leftIndex++] = arguments[index];
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          if (!wrapper && LodashWrapper.prototype.thru && getFuncName(func) == 'wrapper') {
            wrapper = new LodashWrapper([], true);
          }
        }
        index = wrapper ? -1 : length;
        while (++index < length) {
          func = funcs[index];

          var funcName = getFuncName(func),
              data = funcName == 'wrapper' ? getData(func) : undefined;

          if (data && isLaziable(data[0]) && data[1] == (ARY_FLAG | CURRY_FLAG | PARTIAL_FLAG | REARG_FLAG) && !data[4].length && data[9] == 1) {
            wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
          } else {
            wrapper = (func.length == 1 && isLaziable(func)) ? wrapper[funcName]() : wrapper.thru(func);
          }
        }
        return function() {
          var args = arguments,
              value = args[0];

          if (wrapper && args.length == 1 && isArray(value) && value.length >= LARGE_ARRAY_SIZE) {
            return wrapper.plant(value).value();
          }
          var index = 0,
              result = length ? funcs[index].apply(this, args) : value;

          while (++index < length) {
            result = funcs[index].call(this, result);
          }
          return result;
        };
      };
    }

    /**
     * Creates a function for `_.forEach` or `_.forEachRight`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over an array.
     * @param {Function} eachFunc The function to iterate over a collection.
     * @returns {Function} Returns the new each function.
     */
    function createForEach(arrayFunc, eachFunc) {
      return function(collection, iteratee, thisArg) {
        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
          ? arrayFunc(collection, iteratee)
          : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
      };
    }

    /**
     * Creates a function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new each function.
     */
    function createForIn(objectFunc) {
      return function(object, iteratee, thisArg) {
        if (typeof iteratee != 'function' || thisArg !== undefined) {
          iteratee = bindCallback(iteratee, thisArg, 3);
        }
        return objectFunc(object, iteratee, keysIn);
      };
    }

    /**
     * Creates a function for `_.forOwn` or `_.forOwnRight`.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new each function.
     */
    function createForOwn(objectFunc) {
      return function(object, iteratee, thisArg) {
        if (typeof iteratee != 'function' || thisArg !== undefined) {
          iteratee = bindCallback(iteratee, thisArg, 3);
        }
        return objectFunc(object, iteratee);
      };
    }

    /**
     * Creates a function for `_.mapKeys` or `_.mapValues`.
     *
     * @private
     * @param {boolean} [isMapKeys] Specify mapping keys instead of values.
     * @returns {Function} Returns the new map function.
     */
    function createObjectMapper(isMapKeys) {
      return function(object, iteratee, thisArg) {
        var result = {};
        iteratee = getCallback(iteratee, thisArg, 3);

        baseForOwn(object, function(value, key, object) {
          var mapped = iteratee(value, key, object);
          key = isMapKeys ? mapped : key;
          value = isMapKeys ? value : mapped;
          result[key] = value;
        });
        return result;
      };
    }

    /**
     * Creates a function for `_.padLeft` or `_.padRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify padding from the right.
     * @returns {Function} Returns the new pad function.
     */
    function createPadDir(fromRight) {
      return function(string, length, chars) {
        string = baseToString(string);
        return (fromRight ? string : '') + createPadding(string, length, chars) + (fromRight ? '' : string);
      };
    }

    /**
     * Creates a `_.partial` or `_.partialRight` function.
     *
     * @private
     * @param {boolean} flag The partial bit flag.
     * @returns {Function} Returns the new partial function.
     */
    function createPartial(flag) {
      var partialFunc = restParam(function(func, partials) {
        var holders = replaceHolders(partials, partialFunc.placeholder);
        return createWrapper(func, flag, undefined, partials, holders);
      });
      return partialFunc;
    }

    /**
     * Creates a function for `_.reduce` or `_.reduceRight`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over an array.
     * @param {Function} eachFunc The function to iterate over a collection.
     * @returns {Function} Returns the new each function.
     */
    function createReduce(arrayFunc, eachFunc) {
      return function(collection, iteratee, accumulator, thisArg) {
        var initFromArray = arguments.length < 3;
        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
          ? arrayFunc(collection, iteratee, accumulator, initFromArray)
          : baseReduce(collection, getCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
      };
    }

    /**
     * Creates a function that wraps `func` and invokes it with optional `this`
     * binding of, partial application, and currying.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to prepend to those provided to the new function.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [partialsRight] The arguments to append to those provided to the new function.
     * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createHybridWrapper(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
      var isAry = bitmask & ARY_FLAG,
          isBind = bitmask & BIND_FLAG,
          isBindKey = bitmask & BIND_KEY_FLAG,
          isCurry = bitmask & CURRY_FLAG,
          isCurryBound = bitmask & CURRY_BOUND_FLAG,
          isCurryRight = bitmask & CURRY_RIGHT_FLAG,
          Ctor = isBindKey ? undefined : createCtorWrapper(func);

      function wrapper() {
        // Avoid `arguments` object use disqualifying optimizations by
        // converting it to an array before providing it to other functions.
        var length = arguments.length,
            index = length,
            args = Array(length);

        while (index--) {
          args[index] = arguments[index];
        }
        if (partials) {
          args = composeArgs(args, partials, holders);
        }
        if (partialsRight) {
          args = composeArgsRight(args, partialsRight, holdersRight);
        }
        if (isCurry || isCurryRight) {
          var placeholder = wrapper.placeholder,
              argsHolders = replaceHolders(args, placeholder);

          length -= argsHolders.length;
          if (length < arity) {
            var newArgPos = argPos ? arrayCopy(argPos) : undefined,
                newArity = nativeMax(arity - length, 0),
                newsHolders = isCurry ? argsHolders : undefined,
                newHoldersRight = isCurry ? undefined : argsHolders,
                newPartials = isCurry ? args : undefined,
                newPartialsRight = isCurry ? undefined : args;

            bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);
            bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);

            if (!isCurryBound) {
              bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);
            }
            var newData = [func, bitmask, thisArg, newPartials, newsHolders, newPartialsRight, newHoldersRight, newArgPos, ary, newArity],
                result = createHybridWrapper.apply(undefined, newData);

            if (isLaziable(func)) {
              setData(result, newData);
            }
            result.placeholder = placeholder;
            return result;
          }
        }
        var thisBinding = isBind ? thisArg : this,
            fn = isBindKey ? thisBinding[func] : func;

        if (argPos) {
          args = reorder(args, argPos);
        }
        if (isAry && ary < args.length) {
          args.length = ary;
        }
        if (this && this !== root && this instanceof wrapper) {
          fn = Ctor || createCtorWrapper(func);
        }
        return fn.apply(thisBinding, args);
      }
      return wrapper;
    }

    /**
     * Creates the padding required for `string` based on the given `length`.
     * The `chars` string is truncated if the number of characters exceeds `length`.
     *
     * @private
     * @param {string} string The string to create padding for.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the pad for `string`.
     */
    function createPadding(string, length, chars) {
      var strLength = string.length;
      length = +length;

      if (strLength >= length || !nativeIsFinite(length)) {
        return '';
      }
      var padLength = length - strLength;
      chars = chars == null ? ' ' : (chars + '');
      return repeat(chars, nativeCeil(padLength / chars.length)).slice(0, padLength);
    }

    /**
     * Creates a function that wraps `func` and invokes it with the optional `this`
     * binding of `thisArg` and the `partials` prepended to those provided to
     * the wrapper.
     *
     * @private
     * @param {Function} func The function to partially apply arguments to.
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} partials The arguments to prepend to those provided to the new function.
     * @returns {Function} Returns the new bound function.
     */
    function createPartialWrapper(func, bitmask, thisArg, partials) {
      var isBind = bitmask & BIND_FLAG,
          Ctor = createCtorWrapper(func);

      function wrapper() {
        // Avoid `arguments` object use disqualifying optimizations by
        // converting it to an array before providing it `func`.
        var argsIndex = -1,
            argsLength = arguments.length,
            leftIndex = -1,
            leftLength = partials.length,
            args = Array(leftLength + argsLength);

        while (++leftIndex < leftLength) {
          args[leftIndex] = partials[leftIndex];
        }
        while (argsLength--) {
          args[leftIndex++] = arguments[++argsIndex];
        }
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(isBind ? thisArg : this, args);
      }
      return wrapper;
    }

    /**
     * Creates a `_.ceil`, `_.floor`, or `_.round` function.
     *
     * @private
     * @param {string} methodName The name of the `Math` method to use when rounding.
     * @returns {Function} Returns the new round function.
     */
    function createRound(methodName) {
      var func = Math[methodName];
      return function(number, precision) {
        precision = precision === undefined ? 0 : (+precision || 0);
        if (precision) {
          precision = pow(10, precision);
          return func(number * precision) / precision;
        }
        return func(number);
      };
    }

    /**
     * Creates a `_.sortedIndex` or `_.sortedLastIndex` function.
     *
     * @private
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {Function} Returns the new index function.
     */
    function createSortedIndex(retHighest) {
      return function(array, value, iteratee, thisArg) {
        var callback = getCallback(iteratee);
        return (iteratee == null && callback === baseCallback)
          ? binaryIndex(array, value, retHighest)
          : binaryIndexBy(array, value, callback(iteratee, thisArg, 1), retHighest);
      };
    }

    /**
     * Creates a function that either curries or invokes `func` with optional
     * `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of flags.
     *  The bitmask may be composed of the following flags:
     *     1 - `_.bind`
     *     2 - `_.bindKey`
     *     4 - `_.curry` or `_.curryRight` of a bound function
     *     8 - `_.curry`
     *    16 - `_.curryRight`
     *    32 - `_.partial`
     *    64 - `_.partialRight`
     *   128 - `_.rearg`
     *   256 - `_.ary`
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to be partially applied.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createWrapper(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
      var isBindKey = bitmask & BIND_KEY_FLAG;
      if (!isBindKey && typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = partials ? partials.length : 0;
      if (!length) {
        bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);
        partials = holders = undefined;
      }
      length -= (holders ? holders.length : 0);
      if (bitmask & PARTIAL_RIGHT_FLAG) {
        var partialsRight = partials,
            holdersRight = holders;

        partials = holders = undefined;
      }
      var data = isBindKey ? undefined : getData(func),
          newData = [func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity];

      if (data) {
        mergeData(newData, data);
        bitmask = newData[1];
        arity = newData[9];
      }
      newData[9] = arity == null
        ? (isBindKey ? 0 : func.length)
        : (nativeMax(arity - length, 0) || 0);

      if (bitmask == BIND_FLAG) {
        var result = createBindWrapper(newData[0], newData[2]);
      } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !newData[4].length) {
        result = createPartialWrapper.apply(undefined, newData);
      } else {
        result = createHybridWrapper.apply(undefined, newData);
      }
      var setter = data ? baseSetData : setData;
      return setter(result, newData);
    }

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing arrays.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var index = -1,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
        return false;
      }
      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index],
            result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

        if (result !== undefined) {
          if (result) {
            continue;
          }
          return false;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (isLoose) {
          if (!arraySome(other, function(othValue) {
                return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
              })) {
            return false;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
          return false;
        }
      }
      return true;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag) {
      switch (tag) {
        case boolTag:
        case dateTag:
          // Coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
          return +object == +other;

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case numberTag:
          // Treat `NaN` vs. `NaN` as equal.
          return (object != +object)
            ? other != +other
            : object == +other;

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings primitives and string
          // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
          return object == (other + '');
      }
      return false;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objProps = keys(object),
          objLength = objProps.length,
          othProps = keys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isLoose) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      var skipCtor = isLoose;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key],
            result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

        // Recursively compare objects (susceptible to call stack limits).
        if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
          return false;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (!skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Gets the appropriate "callback" function. If the `_.callback` method is
     * customized this function returns the custom method, otherwise it returns
     * the `baseCallback` function. If arguments are provided the chosen function
     * is invoked with them and its result is returned.
     *
     * @private
     * @returns {Function} Returns the chosen function or its result.
     */
    function getCallback(func, thisArg, argCount) {
      var result = lodash.callback || callback;
      result = result === callback ? baseCallback : result;
      return argCount ? result(func, thisArg, argCount) : result;
    }

    /**
     * Gets metadata for `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {*} Returns the metadata for `func`.
     */
    var getData = !metaMap ? noop : function(func) {
      return metaMap.get(func);
    };

    /**
     * Gets the name of `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {string} Returns the function name.
     */
    function getFuncName(func) {
      var result = func.name,
          array = realNames[result],
          length = array ? array.length : 0;

      while (length--) {
        var data = array[length],
            otherFunc = data.func;
        if (otherFunc == null || otherFunc == func) {
          return data.name;
        }
      }
      return result;
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized this function returns the custom method, otherwise it returns
     * the `baseIndexOf` function. If arguments are provided the chosen function
     * is invoked with them and its result is returned.
     *
     * @private
     * @returns {Function|number} Returns the chosen function or its result.
     */
    function getIndexOf(collection, target, fromIndex) {
      var result = lodash.indexOf || indexOf;
      result = result === indexOf ? baseIndexOf : result;
      return collection ? result(collection, target, fromIndex) : result;
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
     * that affects Safari on at least iOS 8.1-8.3 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength = baseProperty('length');

    /**
     * Gets the propery names, values, and compare flags of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the match data of `object`.
     */
    function getMatchData(object) {
      var result = pairs(object),
          length = result.length;

      while (length--) {
        result[length][2] = isStrictComparable(result[length][1]);
      }
      return result;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = object == null ? undefined : object[key];
      return isNative(value) ? value : undefined;
    }

    /**
     * Gets the view, applying any `transforms` to the `start` and `end` positions.
     *
     * @private
     * @param {number} start The start of the view.
     * @param {number} end The end of the view.
     * @param {Array} transforms The transformations to apply to the view.
     * @returns {Object} Returns an object containing the `start` and `end`
     *  positions of the view.
     */
    function getView(start, end, transforms) {
      var index = -1,
          length = transforms.length;

      while (++index < length) {
        var data = transforms[index],
            size = data.size;

        switch (data.type) {
          case 'drop':      start += size; break;
          case 'dropRight': end -= size; break;
          case 'take':      end = nativeMin(end, start + size); break;
          case 'takeRight': start = nativeMax(start, end - size); break;
        }
      }
      return { 'start': start, 'end': end };
    }

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add array properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      var Ctor = object.constructor;
      if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
        Ctor = Object;
      }
      return new Ctor;
    }

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag:
          return bufferClone(object);

        case boolTag:
        case dateTag:
          return new Ctor(+object);

        case float32Tag: case float64Tag:
        case int8Tag: case int16Tag: case int32Tag:
        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
          var buffer = object.buffer;
          return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

        case numberTag:
        case stringTag:
          return new Ctor(object);

        case regexpTag:
          var result = new Ctor(object.source, reFlags.exec(object));
          result.lastIndex = object.lastIndex;
      }
      return result;
    }

    /**
     * Invokes the method at `path` on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the method to invoke.
     * @param {Array} args The arguments to invoke the method with.
     * @returns {*} Returns the result of the invoked method.
     */
    function invokePath(object, path, args) {
      if (object != null && !isKey(path, object)) {
        path = toPath(path);
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        path = last(path);
      }
      var func = object == null ? object : object[path];
      return func == null ? undefined : func.apply(object, args);
    }

    /**
     * Checks if `value` is array-like.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     */
    function isArrayLike(value) {
      return value != null && isLength(getLength(value));
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return value > -1 && value % 1 == 0 && value < length;
    }

    /**
     * Checks if the provided arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
          ? (isArrayLike(object) && isIndex(index, object.length))
          : (type == 'string' && index in object)) {
        var other = object[index];
        return value === value ? (value === other) : (other !== other);
      }
      return false;
    }

    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      var type = typeof value;
      if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
        return true;
      }
      if (isArray(value)) {
        return false;
      }
      var result = !reIsDeepProp.test(value);
      return result || (object != null && value in toObject(object));
    }

    /**
     * Checks if `func` has a lazy counterpart.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` has a lazy counterpart, else `false`.
     */
    function isLaziable(func) {
      var funcName = getFuncName(func);
      if (!(funcName in LazyWrapper.prototype)) {
        return false;
      }
      var other = lodash[funcName];
      if (func === other) {
        return true;
      }
      var data = getData(other);
      return !!data && func === data[0];
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     */
    function isLength(value) {
      return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }

    /**
     * Merges the function metadata of `source` into `data`.
     *
     * Merging metadata reduces the number of wrappers required to invoke a function.
     * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
     * may be applied regardless of execution order. Methods like `_.ary` and `_.rearg`
     * augment function arguments, making the order in which they are executed important,
     * preventing the merging of metadata. However, we make an exception for a safe
     * common case where curried functions have `_.ary` and or `_.rearg` applied.
     *
     * @private
     * @param {Array} data The destination metadata.
     * @param {Array} source The source metadata.
     * @returns {Array} Returns `data`.
     */
    function mergeData(data, source) {
      var bitmask = data[1],
          srcBitmask = source[1],
          newBitmask = bitmask | srcBitmask,
          isCommon = newBitmask < ARY_FLAG;

      var isCombo =
        (srcBitmask == ARY_FLAG && bitmask == CURRY_FLAG) ||
        (srcBitmask == ARY_FLAG && bitmask == REARG_FLAG && data[7].length <= source[8]) ||
        (srcBitmask == (ARY_FLAG | REARG_FLAG) && bitmask == CURRY_FLAG);

      // Exit early if metadata can't be merged.
      if (!(isCommon || isCombo)) {
        return data;
      }
      // Use source `thisArg` if available.
      if (srcBitmask & BIND_FLAG) {
        data[2] = source[2];
        // Set when currying a bound function.
        newBitmask |= (bitmask & BIND_FLAG) ? 0 : CURRY_BOUND_FLAG;
      }
      // Compose partial arguments.
      var value = source[3];
      if (value) {
        var partials = data[3];
        data[3] = partials ? composeArgs(partials, value, source[4]) : arrayCopy(value);
        data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : arrayCopy(source[4]);
      }
      // Compose partial right arguments.
      value = source[5];
      if (value) {
        partials = data[5];
        data[5] = partials ? composeArgsRight(partials, value, source[6]) : arrayCopy(value);
        data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : arrayCopy(source[6]);
      }
      // Use source `argPos` if available.
      value = source[7];
      if (value) {
        data[7] = arrayCopy(value);
      }
      // Use source `ary` if it's smaller.
      if (srcBitmask & ARY_FLAG) {
        data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
      }
      // Use source `arity` if one is not provided.
      if (data[9] == null) {
        data[9] = source[9];
      }
      // Use source `func` and merge bitmasks.
      data[0] = source[0];
      data[1] = newBitmask;

      return data;
    }

    /**
     * Used by `_.defaultsDeep` to customize its `_.merge` use.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function mergeDefaults(objectValue, sourceValue) {
      return objectValue === undefined ? sourceValue : merge(objectValue, sourceValue, mergeDefaults);
    }

    /**
     * A specialized version of `_.pick` which picks `object` properties specified
     * by `props`.
     *
     * @private
     * @param {Object} object The source object.
     * @param {string[]} props The property names to pick.
     * @returns {Object} Returns the new object.
     */
    function pickByArray(object, props) {
      object = toObject(object);

      var index = -1,
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        if (key in object) {
          result[key] = object[key];
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.pick` which picks `object` properties `predicate`
     * returns truthy for.
     *
     * @private
     * @param {Object} object The source object.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Object} Returns the new object.
     */
    function pickByCallback(object, predicate) {
      var result = {};
      baseForIn(object, function(value, key, object) {
        if (predicate(value, key, object)) {
          result[key] = value;
        }
      });
      return result;
    }

    /**
     * Reorder `array` according to the specified indexes where the element at
     * the first index is assigned as the first element, the element at
     * the second index is assigned as the second element, and so on.
     *
     * @private
     * @param {Array} array The array to reorder.
     * @param {Array} indexes The arranged array indexes.
     * @returns {Array} Returns `array`.
     */
    function reorder(array, indexes) {
      var arrLength = array.length,
          length = nativeMin(indexes.length, arrLength),
          oldArray = arrayCopy(array);

      while (length--) {
        var index = indexes[length];
        array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
      }
      return array;
    }

    /**
     * Sets metadata for `func`.
     *
     * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
     * period of time, it will trip its breaker and transition to an identity function
     * to avoid garbage collection pauses in V8. See [V8 issue 2070](https://code.google.com/p/v8/issues/detail?id=2070)
     * for more details.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var setData = (function() {
      var count = 0,
          lastCalled = 0;

      return function(key, value) {
        var stamp = now(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return key;
          }
        } else {
          count = 0;
        }
        return baseSetData(key, value);
      };
    }());

    /**
     * A fallback implementation of `Object.keys` which creates an array of the
     * own enumerable property names of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function shimKeys(object) {
      var props = keysIn(object),
          propsLength = props.length,
          length = propsLength && object.length;

      var allowIndexes = !!length && isLength(length) &&
        (isArray(object) || isArguments(object));

      var index = -1,
          result = [];

      while (++index < propsLength) {
        var key = props[index];
        if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Converts `value` to an array-like object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array|Object} Returns the array-like object.
     */
    function toIterable(value) {
      if (value == null) {
        return [];
      }
      if (!isArrayLike(value)) {
        return values(value);
      }
      return isObject(value) ? value : Object(value);
    }

    /**
     * Converts `value` to an object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Object} Returns the object.
     */
    function toObject(value) {
      return isObject(value) ? value : Object(value);
    }

    /**
     * Converts `value` to property path array if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array} Returns the property path array.
     */
    function toPath(value) {
      if (isArray(value)) {
        return value;
      }
      var result = [];
      baseToString(value).replace(rePropName, function(match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    }

    /**
     * Creates a clone of `wrapper`.
     *
     * @private
     * @param {Object} wrapper The wrapper to clone.
     * @returns {Object} Returns the cloned wrapper.
     */
    function wrapperClone(wrapper) {
      return wrapper instanceof LazyWrapper
        ? wrapper.clone()
        : new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__, arrayCopy(wrapper.__actions__));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements split into groups the length of `size`.
     * If `collection` can't be split evenly, the final chunk will be the remaining
     * elements.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to process.
     * @param {number} [size=1] The length of each chunk.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the new array containing chunks.
     * @example
     *
     * _.chunk(['a', 'b', 'c', 'd'], 2);
     * // => [['a', 'b'], ['c', 'd']]
     *
     * _.chunk(['a', 'b', 'c', 'd'], 3);
     * // => [['a', 'b', 'c'], ['d']]
     */
    function chunk(array, size, guard) {
      if (guard ? isIterateeCall(array, size, guard) : size == null) {
        size = 1;
      } else {
        size = nativeMax(nativeFloor(size) || 1, 1);
      }
      var index = 0,
          length = array ? array.length : 0,
          resIndex = -1,
          result = Array(nativeCeil(length / size));

      while (index < length) {
        result[++resIndex] = baseSlice(array, index, (index += size));
      }
      return result;
    }

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are falsey.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to compact.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * Creates an array of unique `array` values not included in the other
     * provided arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3], [4, 2]);
     * // => [1, 3]
     */
    var difference = restParam(function(array, values) {
      return (isObjectLike(array) && isArrayLike(array))
        ? baseDifference(array, baseFlatten(values, false, true))
        : [];
    });

    /**
     * Creates a slice of `array` with `n` elements dropped from the beginning.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.drop([1, 2, 3]);
     * // => [2, 3]
     *
     * _.drop([1, 2, 3], 2);
     * // => [3]
     *
     * _.drop([1, 2, 3], 5);
     * // => []
     *
     * _.drop([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function drop(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      return baseSlice(array, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements dropped from the end.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRight([1, 2, 3]);
     * // => [1, 2]
     *
     * _.dropRight([1, 2, 3], 2);
     * // => [1]
     *
     * _.dropRight([1, 2, 3], 5);
     * // => []
     *
     * _.dropRight([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function dropRight(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      n = length - (+n || 0);
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the end.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that match the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRightWhile([1, 2, 3], function(n) {
     *   return n > 1;
     * });
     * // => [1]
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.dropRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
     * // => ['barney', 'fred']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.dropRightWhile(users, 'active', false), 'user');
     * // => ['barney']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.dropRightWhile(users, 'active'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function dropRightWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), true, true)
        : [];
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the beginning.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropWhile([1, 2, 3], function(n) {
     *   return n < 3;
     * });
     * // => [3]
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.dropWhile(users, { 'user': 'barney', 'active': false }), 'user');
     * // => ['fred', 'pebbles']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.dropWhile(users, 'active', false), 'user');
     * // => ['pebbles']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.dropWhile(users, 'active'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function dropWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), true)
        : [];
    }

    /**
     * Fills elements of `array` with `value` from `start` up to, but not
     * including, `end`.
     *
     * **Note:** This method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _.fill(array, 'a');
     * console.log(array);
     * // => ['a', 'a', 'a']
     *
     * _.fill(Array(3), 2);
     * // => [2, 2, 2]
     *
     * _.fill([4, 6, 8], '*', 1, 2);
     * // => [4, '*', 8]
     */
    function fill(array, value, start, end) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (start && typeof start != 'number' && isIterateeCall(array, value, start)) {
        start = 0;
        end = length;
      }
      return baseFill(array, value, start, end);
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.findIndex(users, function(chr) {
     *   return chr.user == 'barney';
     * });
     * // => 0
     *
     * // using the `_.matches` callback shorthand
     * _.findIndex(users, { 'user': 'fred', 'active': false });
     * // => 1
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findIndex(users, 'active', false);
     * // => 0
     *
     * // using the `_.property` callback shorthand
     * _.findIndex(users, 'active');
     * // => 2
     */
    var findIndex = createFindIndex();

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of `collection` from right to left.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.findLastIndex(users, function(chr) {
     *   return chr.user == 'pebbles';
     * });
     * // => 2
     *
     * // using the `_.matches` callback shorthand
     * _.findLastIndex(users, { 'user': 'barney', 'active': true });
     * // => 0
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findLastIndex(users, 'active', false);
     * // => 2
     *
     * // using the `_.property` callback shorthand
     * _.findLastIndex(users, 'active');
     * // => 0
     */
    var findLastIndex = createFindIndex(true);

    /**
     * Gets the first element of `array`.
     *
     * @static
     * @memberOf _
     * @alias head
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the first element of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([]);
     * // => undefined
     */
    function first(array) {
      return array ? array[0] : undefined;
    }

    /**
     * Flattens a nested array. If `isDeep` is `true` the array is recursively
     * flattened, otherwise it is only flattened a single level.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to flatten.
     * @param {boolean} [isDeep] Specify a deep flatten.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flatten([1, [2, 3, [4]]]);
     * // => [1, 2, 3, [4]]
     *
     * // using `isDeep`
     * _.flatten([1, [2, 3, [4]]], true);
     * // => [1, 2, 3, 4]
     */
    function flatten(array, isDeep, guard) {
      var length = array ? array.length : 0;
      if (guard && isIterateeCall(array, isDeep, guard)) {
        isDeep = false;
      }
      return length ? baseFlatten(array, isDeep) : [];
    }

    /**
     * Recursively flattens a nested array.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to recursively flatten.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flattenDeep([1, [2, 3, [4]]]);
     * // => [1, 2, 3, 4]
     */
    function flattenDeep(array) {
      var length = array ? array.length : 0;
      return length ? baseFlatten(array, true) : [];
    }

    /**
     * Gets the index at which the first occurrence of `value` is found in `array`
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons. If `fromIndex` is negative, it is used as the offset
     * from the end of `array`. If `array` is sorted providing `true` for `fromIndex`
     * performs a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.indexOf([1, 2, 1, 2], 2);
     * // => 1
     *
     * // using `fromIndex`
     * _.indexOf([1, 2, 1, 2], 2, 2);
     * // => 3
     *
     * // performing a binary search
     * _.indexOf([1, 1, 2, 2], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      var length = array ? array.length : 0;
      if (!length) {
        return -1;
      }
      if (typeof fromIndex == 'number') {
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : fromIndex;
      } else if (fromIndex) {
        var index = binaryIndex(array, value);
        if (index < length &&
            (value === value ? (value === array[index]) : (array[index] !== array[index]))) {
          return index;
        }
        return -1;
      }
      return baseIndexOf(array, value, fromIndex || 0);
    }

    /**
     * Gets all but the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     */
    function initial(array) {
      return dropRight(array, 1);
    }

    /**
     * Creates an array of unique values that are included in all of the provided
     * arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of shared values.
     * @example
     * _.intersection([1, 2], [4, 2], [2, 1]);
     * // => [2]
     */
    var intersection = restParam(function(arrays) {
      var othLength = arrays.length,
          othIndex = othLength,
          caches = Array(length),
          indexOf = getIndexOf(),
          isCommon = indexOf == baseIndexOf,
          result = [];

      while (othIndex--) {
        var value = arrays[othIndex] = isArrayLike(value = arrays[othIndex]) ? value : [];
        caches[othIndex] = (isCommon && value.length >= 120) ? createCache(othIndex && value) : null;
      }
      var array = arrays[0],
          index = -1,
          length = array ? array.length : 0,
          seen = caches[0];

      outer:
      while (++index < length) {
        value = array[index];
        if ((seen ? cacheIndexOf(seen, value) : indexOf(result, value, 0)) < 0) {
          var othIndex = othLength;
          while (--othIndex) {
            var cache = caches[othIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(arrays[othIndex], value, 0)) < 0) {
              continue outer;
            }
          }
          if (seen) {
            seen.push(value);
          }
          result.push(value);
        }
      }
      return result;
    });

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array ? array.length : 0;
      return length ? array[length - 1] : undefined;
    }

    /**
     * This method is like `_.indexOf` except that it iterates over elements of
     * `array` from right to left.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=array.length-1] The index to search from
     *  or `true` to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 1, 2], 2);
     * // => 3
     *
     * // using `fromIndex`
     * _.lastIndexOf([1, 2, 1, 2], 2, 2);
     * // => 1
     *
     * // performing a binary search
     * _.lastIndexOf([1, 1, 2, 2], 2, true);
     * // => 3
     */
    function lastIndexOf(array, value, fromIndex) {
      var length = array ? array.length : 0;
      if (!length) {
        return -1;
      }
      var index = length;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(length + fromIndex, 0) : nativeMin(fromIndex || 0, length - 1)) + 1;
      } else if (fromIndex) {
        index = binaryIndex(array, value, true) - 1;
        var other = array[index];
        if (value === value ? (value === other) : (other !== other)) {
          return index;
        }
        return -1;
      }
      if (value !== value) {
        return indexOfNaN(array, index, true);
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from `array` using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * **Note:** Unlike `_.without`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...*} [values] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     *
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull() {
      var args = arguments,
          array = args[0];

      if (!(array && array.length)) {
        return array;
      }
      var index = 0,
          indexOf = getIndexOf(),
          length = args.length;

      while (++index < length) {
        var fromIndex = 0,
            value = args[index];

        while ((fromIndex = indexOf(array, value, fromIndex)) > -1) {
          splice.call(array, fromIndex, 1);
        }
      }
      return array;
    }

    /**
     * Removes elements from `array` corresponding to the given indexes and returns
     * an array of the removed elements. Indexes may be specified as an array of
     * indexes or as individual arguments.
     *
     * **Note:** Unlike `_.at`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...(number|number[])} [indexes] The indexes of elements to remove,
     *  specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [5, 10, 15, 20];
     * var evens = _.pullAt(array, 1, 3);
     *
     * console.log(array);
     * // => [5, 15]
     *
     * console.log(evens);
     * // => [10, 20]
     */
    var pullAt = restParam(function(array, indexes) {
      indexes = baseFlatten(indexes);

      var result = baseAt(array, indexes);
      basePullAt(array, indexes.sort(baseCompareAscending));
      return result;
    });

    /**
     * Removes all elements from `array` that `predicate` returns truthy for
     * and returns an array of the removed elements. The predicate is bound to
     * `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * **Note:** Unlike `_.filter`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4];
     * var evens = _.remove(array, function(n) {
     *   return n % 2 == 0;
     * });
     *
     * console.log(array);
     * // => [1, 3]
     *
     * console.log(evens);
     * // => [2, 4]
     */
    function remove(array, predicate, thisArg) {
      var result = [];
      if (!(array && array.length)) {
        return result;
      }
      var index = -1,
          indexes = [],
          length = array.length;

      predicate = getCallback(predicate, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result.push(value);
          indexes.push(index);
        }
      }
      basePullAt(array, indexes);
      return result;
    }

    /**
     * Gets all but the first element of `array`.
     *
     * @static
     * @memberOf _
     * @alias tail
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     */
    function rest(array) {
      return drop(array, 1);
    }

    /**
     * Creates a slice of `array` from `start` up to, but not including, `end`.
     *
     * **Note:** This method is used instead of `Array#slice` to support node
     * lists in IE < 9 and to ensure dense arrays are returned.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function slice(array, start, end) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
        start = 0;
        end = length;
      }
      return baseSlice(array, start, end);
    }

    /**
     * Uses a binary search to determine the lowest index at which `value` should
     * be inserted into `array` in order to maintain its sort order. If an iteratee
     * function is provided it is invoked for `value` and each element of `array`
     * to compute their sort ranking. The iteratee is bound to `thisArg` and
     * invoked with one argument; (value).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([30, 50], 40);
     * // => 1
     *
     * _.sortedIndex([4, 4, 5, 5], 5);
     * // => 2
     *
     * var dict = { 'data': { 'thirty': 30, 'forty': 40, 'fifty': 50 } };
     *
     * // using an iteratee function
     * _.sortedIndex(['thirty', 'fifty'], 'forty', function(word) {
     *   return this.data[word];
     * }, dict);
     * // => 1
     *
     * // using the `_.property` callback shorthand
     * _.sortedIndex([{ 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 1
     */
    var sortedIndex = createSortedIndex();

    /**
     * This method is like `_.sortedIndex` except that it returns the highest
     * index at which `value` should be inserted into `array` in order to
     * maintain its sort order.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedLastIndex([4, 4, 5, 5], 5);
     * // => 4
     */
    var sortedLastIndex = createSortedIndex(true);

    /**
     * Creates a slice of `array` with `n` elements taken from the beginning.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.take([1, 2, 3]);
     * // => [1]
     *
     * _.take([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.take([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.take([1, 2, 3], 0);
     * // => []
     */
    function take(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements taken from the end.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRight([1, 2, 3]);
     * // => [3]
     *
     * _.takeRight([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.takeRight([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.takeRight([1, 2, 3], 0);
     * // => []
     */
    function takeRight(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      n = length - (+n || 0);
      return baseSlice(array, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with elements taken from the end. Elements are
     * taken until `predicate` returns falsey. The predicate is bound to `thisArg`
     * and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRightWhile([1, 2, 3], function(n) {
     *   return n > 1;
     * });
     * // => [2, 3]
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.takeRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
     * // => ['pebbles']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.takeRightWhile(users, 'active', false), 'user');
     * // => ['fred', 'pebbles']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.takeRightWhile(users, 'active'), 'user');
     * // => []
     */
    function takeRightWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), false, true)
        : [];
    }

    /**
     * Creates a slice of `array` with elements taken from the beginning. Elements
     * are taken until `predicate` returns falsey. The predicate is bound to
     * `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeWhile([1, 2, 3], function(n) {
     *   return n < 3;
     * });
     * // => [1, 2]
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false},
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.takeWhile(users, { 'user': 'barney', 'active': false }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.takeWhile(users, 'active', false), 'user');
     * // => ['barney', 'fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.takeWhile(users, 'active'), 'user');
     * // => []
     */
    function takeWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3))
        : [];
    }

    /**
     * Creates an array of unique values, in order, from all of the provided arrays
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * _.union([1, 2], [4, 2], [2, 1]);
     * // => [1, 2, 4]
     */
    var union = restParam(function(arrays) {
      return baseUniq(baseFlatten(arrays, false, true));
    });

    /**
     * Creates a duplicate-free version of an array, using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons, in which only the first occurence of each element
     * is kept. Providing `true` for `isSorted` performs a faster search algorithm
     * for sorted arrays. If an iteratee function is provided it is invoked for
     * each element in the array to generate the criterion by which uniqueness
     * is computed. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, array).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {boolean} [isSorted] Specify the array is sorted.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new duplicate-value-free array.
     * @example
     *
     * _.uniq([2, 1, 2]);
     * // => [2, 1]
     *
     * // using `isSorted`
     * _.uniq([1, 1, 2], true);
     * // => [1, 2]
     *
     * // using an iteratee function
     * _.uniq([1, 2.5, 1.5, 2], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => [1, 2.5]
     *
     * // using the `_.property` callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, iteratee, thisArg) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (isSorted != null && typeof isSorted != 'boolean') {
        thisArg = iteratee;
        iteratee = isIterateeCall(array, isSorted, thisArg) ? undefined : isSorted;
        isSorted = false;
      }
      var callback = getCallback();
      if (!(iteratee == null && callback === baseCallback)) {
        iteratee = callback(iteratee, thisArg, 3);
      }
      return (isSorted && getIndexOf() == baseIndexOf)
        ? sortedUniq(array, iteratee)
        : baseUniq(array, iteratee);
    }

    /**
     * This method is like `_.zip` except that it accepts an array of grouped
     * elements and creates an array regrouping the elements to their pre-zip
     * configuration.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     *
     * _.unzip(zipped);
     * // => [['fred', 'barney'], [30, 40], [true, false]]
     */
    function unzip(array) {
      if (!(array && array.length)) {
        return [];
      }
      var index = -1,
          length = 0;

      array = arrayFilter(array, function(group) {
        if (isArrayLike(group)) {
          length = nativeMax(group.length, length);
          return true;
        }
      });
      var result = Array(length);
      while (++index < length) {
        result[index] = arrayMap(array, baseProperty(index));
      }
      return result;
    }

    /**
     * This method is like `_.unzip` except that it accepts an iteratee to specify
     * how regrouped values should be combined. The `iteratee` is bound to `thisArg`
     * and invoked with four arguments: (accumulator, value, index, group).
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @param {Function} [iteratee] The function to combine regrouped values.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip([1, 2], [10, 20], [100, 200]);
     * // => [[1, 10, 100], [2, 20, 200]]
     *
     * _.unzipWith(zipped, _.add);
     * // => [3, 30, 300]
     */
    function unzipWith(array, iteratee, thisArg) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      var result = unzip(array);
      if (iteratee == null) {
        return result;
      }
      iteratee = bindCallback(iteratee, thisArg, 4);
      return arrayMap(result, function(group) {
        return arrayReduce(group, iteratee, undefined, true);
      });
    }

    /**
     * Creates an array excluding all provided values using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to filter.
     * @param {...*} [values] The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 3], 1, 2);
     * // => [3]
     */
    var without = restParam(function(array, values) {
      return isArrayLike(array)
        ? baseDifference(array, values)
        : [];
    });

    /**
     * Creates an array of unique values that is the [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference)
     * of the provided arrays.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of values.
     * @example
     *
     * _.xor([1, 2], [4, 2]);
     * // => [1, 4]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArrayLike(array)) {
          var result = result
            ? arrayPush(baseDifference(result, array), baseDifference(array, result))
            : array;
        }
      }
      return result ? baseUniq(result) : [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second elements
     * of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    var zip = restParam(unzip);

    /**
     * The inverse of `_.pairs`; this method returns an object composed from arrays
     * of property names and values. Provide either a single two dimensional array,
     * e.g. `[[key1, value1], [key2, value2]]` or two arrays, one of property names
     * and one of corresponding values.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Array
     * @param {Array} props The property names.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObject([['fred', 30], ['barney', 40]]);
     * // => { 'fred': 30, 'barney': 40 }
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(props, values) {
      var index = -1,
          length = props ? props.length : 0,
          result = {};

      if (length && !values && !isArray(props[0])) {
        values = [];
      }
      while (++index < length) {
        var key = props[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /**
     * This method is like `_.zip` except that it accepts an iteratee to specify
     * how grouped values should be combined. The `iteratee` is bound to `thisArg`
     * and invoked with four arguments: (accumulator, value, index, group).
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @param {Function} [iteratee] The function to combine grouped values.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zipWith([1, 2], [10, 20], [100, 200], _.add);
     * // => [111, 222]
     */
    var zipWith = restParam(function(arrays) {
      var length = arrays.length,
          iteratee = length > 2 ? arrays[length - 2] : undefined,
          thisArg = length > 1 ? arrays[length - 1] : undefined;

      if (length > 2 && typeof iteratee == 'function') {
        length -= 2;
      } else {
        iteratee = (length > 1 && typeof thisArg == 'function') ? (--length, thisArg) : undefined;
        thisArg = undefined;
      }
      arrays.length = length;
      return unzipWith(arrays, iteratee, thisArg);
    });

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps `value` with explicit method
     * chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36 },
     *   { 'user': 'fred',    'age': 40 },
     *   { 'user': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(users)
     *   .sortBy('age')
     *   .map(function(chr) {
     *     return chr.user + ' is ' + chr.age;
     *   })
     *   .first()
     *   .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      var result = lodash(value);
      result.__chain__ = true;
      return result;
    }

    /**
     * This method invokes `interceptor` and returns `value`. The interceptor is
     * bound to `thisArg` and invoked with one argument; (value). The purpose of
     * this method is to "tap into" a method chain in order to perform operations
     * on intermediate results within the chain.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @param {*} [thisArg] The `this` binding of `interceptor`.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3])
     *  .tap(function(array) {
     *    array.pop();
     *  })
     *  .reverse()
     *  .value();
     * // => [2, 1]
     */
    function tap(value, interceptor, thisArg) {
      interceptor.call(thisArg, value);
      return value;
    }

    /**
     * This method is like `_.tap` except that it returns the result of `interceptor`.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @param {*} [thisArg] The `this` binding of `interceptor`.
     * @returns {*} Returns the result of `interceptor`.
     * @example
     *
     * _('  abc  ')
     *  .chain()
     *  .trim()
     *  .thru(function(value) {
     *    return [value];
     *  })
     *  .value();
     * // => ['abc']
     */
    function thru(value, interceptor, thisArg) {
      return interceptor.call(thisArg, value);
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(users).first();
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(users).chain()
     *   .first()
     *   .pick('user')
     *   .value();
     * // => { 'user': 'barney' }
     */
    function wrapperChain() {
      return chain(this);
    }

    /**
     * Executes the chained sequence and returns the wrapped result.
     *
     * @name commit
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapped = _(array).push(3);
     *
     * console.log(array);
     * // => [1, 2]
     *
     * wrapped = wrapped.commit();
     * console.log(array);
     * // => [1, 2, 3]
     *
     * wrapped.last();
     * // => 3
     *
     * console.log(array);
     * // => [1, 2, 3]
     */
    function wrapperCommit() {
      return new LodashWrapper(this.value(), this.__chain__);
    }

    /**
     * Creates a new array joining a wrapped array with any additional arrays
     * and/or values.
     *
     * @name concat
     * @memberOf _
     * @category Chain
     * @param {...*} [values] The values to concatenate.
     * @returns {Array} Returns the new concatenated array.
     * @example
     *
     * var array = [1];
     * var wrapped = _(array).concat(2, [3], [[4]]);
     *
     * console.log(wrapped.value());
     * // => [1, 2, 3, [4]]
     *
     * console.log(array);
     * // => [1]
     */
    var wrapperConcat = restParam(function(values) {
      values = baseFlatten(values);
      return this.thru(function(array) {
        return arrayConcat(isArray(array) ? array : [toObject(array)], values);
      });
    });

    /**
     * Creates a clone of the chained sequence planting `value` as the wrapped value.
     *
     * @name plant
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapped = _(array).map(function(value) {
     *   return Math.pow(value, 2);
     * });
     *
     * var other = [3, 4];
     * var otherWrapped = wrapped.plant(other);
     *
     * otherWrapped.value();
     * // => [9, 16]
     *
     * wrapped.value();
     * // => [1, 4]
     */
    function wrapperPlant(value) {
      var result,
          parent = this;

      while (parent instanceof baseLodash) {
        var clone = wrapperClone(parent);
        if (result) {
          previous.__wrapped__ = clone;
        } else {
          result = clone;
        }
        var previous = clone;
        parent = parent.__wrapped__;
      }
      previous.__wrapped__ = value;
      return result;
    }

    /**
     * Reverses the wrapped array so the first element becomes the last, the
     * second element becomes the second to last, and so on.
     *
     * **Note:** This method mutates the wrapped array.
     *
     * @name reverse
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new reversed `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _(array).reverse().value()
     * // => [3, 2, 1]
     *
     * console.log(array);
     * // => [3, 2, 1]
     */
    function wrapperReverse() {
      var value = this.__wrapped__;

      var interceptor = function(value) {
        return (wrapped && wrapped.__dir__ < 0) ? value : value.reverse();
      };
      if (value instanceof LazyWrapper) {
        var wrapped = value;
        if (this.__actions__.length) {
          wrapped = new LazyWrapper(this);
        }
        wrapped = wrapped.reverse();
        wrapped.__actions__.push({ 'func': thru, 'args': [interceptor], 'thisArg': undefined });
        return new LodashWrapper(wrapped, this.__chain__);
      }
      return this.thru(interceptor);
    }

    /**
     * Produces the result of coercing the unwrapped value to a string.
     *
     * @name toString
     * @memberOf _
     * @category Chain
     * @returns {string} Returns the coerced string value.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return (this.value() + '');
    }

    /**
     * Executes the chained sequence to extract the unwrapped value.
     *
     * @name value
     * @memberOf _
     * @alias run, toJSON, valueOf
     * @category Chain
     * @returns {*} Returns the resolved unwrapped value.
     * @example
     *
     * _([1, 2, 3]).value();
     * // => [1, 2, 3]
     */
    function wrapperValue() {
      return baseWrapperValue(this.__wrapped__, this.__actions__);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements corresponding to the given keys, or indexes,
     * of `collection`. Keys may be specified as individual arguments or as arrays
     * of keys.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [props] The property names
     *  or indexes of elements to pick, specified individually or in arrays.
     * @returns {Array} Returns the new array of picked elements.
     * @example
     *
     * _.at(['a', 'b', 'c'], [0, 2]);
     * // => ['a', 'c']
     *
     * _.at(['barney', 'fred', 'pebbles'], 0, 2);
     * // => ['barney', 'pebbles']
     */
    var at = restParam(function(collection, props) {
      return baseAt(collection, baseFlatten(props));
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is the number of times the key was returned by `iteratee`.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(n) {
     *   return Math.floor(n);
     * });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      hasOwnProperty.call(result, key) ? ++result[key] : (result[key] = 1);
    });

    /**
     * Checks if `predicate` returns truthy for **all** elements of `collection`.
     * The predicate is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * // => false
     *
     * var users = [
     *   { 'user': 'barney', 'active': false },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.every(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.every(users, 'active', false);
     * // => true
     *
     * // using the `_.property` callback shorthand
     * _.every(users, 'active');
     * // => false
     */
    function every(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayEvery : baseEvery;
      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
        predicate = undefined;
      }
      if (typeof predicate != 'function' || thisArg !== undefined) {
        predicate = getCallback(predicate, thisArg, 3);
      }
      return func(collection, predicate);
    }

    /**
     * Iterates over elements of `collection`, returning an array of all elements
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * _.filter([4, 5, 6], function(n) {
     *   return n % 2 == 0;
     * });
     * // => [4, 6]
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.filter(users, { 'age': 36, 'active': true }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.filter(users, 'active', false), 'user');
     * // => ['fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.filter(users, 'active'), 'user');
     * // => ['barney']
     */
    function filter(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      predicate = getCallback(predicate, thisArg, 3);
      return func(collection, predicate);
    }

    /**
     * Iterates over elements of `collection`, returning the first element
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': true },
     *   { 'user': 'fred',    'age': 40, 'active': false },
     *   { 'user': 'pebbles', 'age': 1,  'active': true }
     * ];
     *
     * _.result(_.find(users, function(chr) {
     *   return chr.age < 40;
     * }), 'user');
     * // => 'barney'
     *
     * // using the `_.matches` callback shorthand
     * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.result(_.find(users, 'active', false), 'user');
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.result(_.find(users, 'active'), 'user');
     * // => 'barney'
     */
    var find = createFind(baseEach);

    /**
     * This method is like `_.find` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(n) {
     *   return n % 2 == 1;
     * });
     * // => 3
     */
    var findLast = createFind(baseEachRight, true);

    /**
     * Performs a deep comparison between each element in `collection` and the
     * source object, returning the first element that has equivalent property
     * values.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Object} source The object of property values to match.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.result(_.findWhere(users, { 'age': 36, 'active': true }), 'user');
     * // => 'barney'
     *
     * _.result(_.findWhere(users, { 'age': 40, 'active': false }), 'user');
     * // => 'fred'
     */
    function findWhere(collection, source) {
      return find(collection, baseMatches(source));
    }

    /**
     * Iterates over elements of `collection` invoking `iteratee` for each element.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection). Iteratee functions may exit iteration early
     * by explicitly returning `false`.
     *
     * **Note:** As with other "Collections" methods, objects with a "length" property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEach(function(n) {
     *   console.log(n);
     * }).value();
     * // => logs each value from left to right and returns the array
     *
     * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
     *   console.log(n, key);
     * });
     * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
     */
    var forEach = createForEach(arrayEach, baseEach);

    /**
     * This method is like `_.forEach` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEachRight(function(n) {
     *   console.log(n);
     * }).value();
     * // => logs each value from right to left and returns the array
     */
    var forEachRight = createForEach(arrayEachRight, baseEachRight);

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(n) {
     *   return Math.floor(n);
     * });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using the `_.property` callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        result[key].push(value);
      } else {
        result[key] = [value];
      }
    });

    /**
     * Checks if `value` is in `collection` using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons. If `fromIndex` is negative, it is used as the offset
     * from the end of `collection`.
     *
     * @static
     * @memberOf _
     * @alias contains, include
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {*} target The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
     * @returns {boolean} Returns `true` if a matching element is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'user': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.includes('pebbles', 'eb');
     * // => true
     */
    function includes(collection, target, fromIndex, guard) {
      var length = collection ? getLength(collection) : 0;
      if (!isLength(length)) {
        collection = values(collection);
        length = collection.length;
      }
      if (typeof fromIndex != 'number' || (guard && isIterateeCall(target, fromIndex, guard))) {
        fromIndex = 0;
      } else {
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);
      }
      return (typeof collection == 'string' || !isArray(collection) && isString(collection))
        ? (fromIndex <= length && collection.indexOf(target, fromIndex) > -1)
        : (!!length && getIndexOf(collection, target, fromIndex) > -1);
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is the last element responsible for generating the key. The
     * iteratee function is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keyData = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keyData, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keyData, function(object) {
     *   return String.fromCharCode(object.code);
     * });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keyData, function(object) {
     *   return this.fromCharCode(object.code);
     * }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method at `path` of each element in `collection`, returning
     * an array of the results of each invoked method. Any additional arguments
     * are provided to each invoked method. If `methodName` is a function it is
     * invoked for, and `this` bound to, each element in `collection`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|string} path The path of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    var invoke = restParam(function(collection, path, args) {
      var index = -1,
          isFunc = typeof path == 'function',
          isProp = isKey(path),
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value) {
        var func = isFunc ? path : ((isProp && value != null) ? value[path] : undefined);
        result[++index] = func ? func.apply(value, args) : invokePath(value, path, args);
      });
      return result;
    });

    /**
     * Creates an array of values by running each element in `collection` through
     * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
     *
     * The guarded methods are:
     * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
     * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
     * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
     * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
     * `sum`, `uniq`, and `words`
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new mapped array.
     * @example
     *
     * function timesThree(n) {
     *   return n * 3;
     * }
     *
     * _.map([1, 2], timesThree);
     * // => [3, 6]
     *
     * _.map({ 'a': 1, 'b': 2 }, timesThree);
     * // => [3, 6] (iteration order is not guaranteed)
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * // using the `_.property` callback shorthand
     * _.map(users, 'user');
     * // => ['barney', 'fred']
     */
    function map(collection, iteratee, thisArg) {
      var func = isArray(collection) ? arrayMap : baseMap;
      iteratee = getCallback(iteratee, thisArg, 3);
      return func(collection, iteratee);
    }

    /**
     * Creates an array of elements split into two groups, the first of which
     * contains elements `predicate` returns truthy for, while the second of which
     * contains elements `predicate` returns falsey for. The predicate is bound
     * to `thisArg` and invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the array of grouped elements.
     * @example
     *
     * _.partition([1, 2, 3], function(n) {
     *   return n % 2;
     * });
     * // => [[1, 3], [2]]
     *
     * _.partition([1.2, 2.3, 3.4], function(n) {
     *   return this.floor(n) % 2;
     * }, Math);
     * // => [[1.2, 3.4], [2.3]]
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': false },
     *   { 'user': 'fred',    'age': 40, 'active': true },
     *   { 'user': 'pebbles', 'age': 1,  'active': false }
     * ];
     *
     * var mapper = function(array) {
     *   return _.pluck(array, 'user');
     * };
     *
     * // using the `_.matches` callback shorthand
     * _.map(_.partition(users, { 'age': 1, 'active': false }), mapper);
     * // => [['pebbles'], ['barney', 'fred']]
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.map(_.partition(users, 'active', false), mapper);
     * // => [['barney', 'pebbles'], ['fred']]
     *
     * // using the `_.property` callback shorthand
     * _.map(_.partition(users, 'active'), mapper);
     * // => [['fred'], ['barney', 'pebbles']]
     */
    var partition = createAggregator(function(result, value, key) {
      result[key ? 0 : 1].push(value);
    }, function() { return [[], []]; });

    /**
     * Gets the property value of `path` from all elements in `collection`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|string} path The path of the property to pluck.
     * @returns {Array} Returns the property values.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(users, 'user');
     * // => ['barney', 'fred']
     *
     * var userIndex = _.indexBy(users, 'user');
     * _.pluck(userIndex, 'age');
     * // => [36, 40] (iteration order is not guaranteed)
     */
    function pluck(collection, path) {
      return map(collection, property(path));
    }

    /**
     * Reduces `collection` to a value which is the accumulated result of running
     * each element in `collection` through `iteratee`, where each successive
     * invocation is supplied the return value of the previous. If `accumulator`
     * is not provided the first element of `collection` is used as the initial
     * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
     * (accumulator, value, index|key, collection).
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.reduce`, `_.reduceRight`, and `_.transform`.
     *
     * The guarded methods are:
     * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `sortByAll`,
     * and `sortByOrder`
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.reduce([1, 2], function(total, n) {
     *   return total + n;
     * });
     * // => 3
     *
     * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
     *   result[key] = n * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
     */
    var reduce = createReduce(arrayReduce, baseEach);

    /**
     * This method is like `_.reduce` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var array = [[0, 1], [2, 3], [4, 5]];
     *
     * _.reduceRight(array, function(flattened, other) {
     *   return flattened.concat(other);
     * }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    var reduceRight = createReduce(arrayReduceRight, baseEachRight);

    /**
     * The opposite of `_.filter`; this method returns the elements of `collection`
     * that `predicate` does **not** return truthy for.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * _.reject([1, 2, 3, 4], function(n) {
     *   return n % 2 == 0;
     * });
     * // => [1, 3]
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false },
     *   { 'user': 'fred',   'age': 40, 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.reject(users, { 'age': 40, 'active': true }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.reject(users, 'active', false), 'user');
     * // => ['fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.reject(users, 'active'), 'user');
     * // => ['barney']
     */
    function reject(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      predicate = getCallback(predicate, thisArg, 3);
      return func(collection, function(value, index, collection) {
        return !predicate(value, index, collection);
      });
    }

    /**
     * Gets a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {*} Returns the random sample(s).
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (guard ? isIterateeCall(collection, n, guard) : n == null) {
        collection = toIterable(collection);
        var length = collection.length;
        return length > 0 ? collection[baseRandom(0, length - 1)] : undefined;
      }
      var index = -1,
          result = toArray(collection),
          length = result.length,
          lastIndex = length - 1;

      n = nativeMin(n < 0 ? 0 : (+n || 0), length);
      while (++index < n) {
        var rand = baseRandom(index, lastIndex),
            value = result[rand];

        result[rand] = result[index];
        result[index] = value;
      }
      result.length = n;
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the
     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     * @example
     *
     * _.shuffle([1, 2, 3, 4]);
     * // => [4, 1, 3, 2]
     */
    function shuffle(collection) {
      return sample(collection, POSITIVE_INFINITY);
    }

    /**
     * Gets the size of `collection` by returning its length for array-like
     * values or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns the size of `collection`.
     * @example
     *
     * _.size([1, 2, 3]);
     * // => 3
     *
     * _.size({ 'a': 1, 'b': 2 });
     * // => 2
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? getLength(collection) : 0;
      return isLength(length) ? length : keys(collection).length;
    }

    /**
     * Checks if `predicate` returns truthy for **any** element of `collection`.
     * The function returns as soon as it finds a passing value and does not iterate
     * over the entire collection. The predicate is bound to `thisArg` and invoked
     * with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var users = [
     *   { 'user': 'barney', 'active': true },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.some(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.some(users, 'active', false);
     * // => true
     *
     * // using the `_.property` callback shorthand
     * _.some(users, 'active');
     * // => true
     */
    function some(collection, predicate, thisArg) {
      var func = isArray(collection) ? arraySome : baseSome;
      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
        predicate = undefined;
      }
      if (typeof predicate != 'function' || thisArg !== undefined) {
        predicate = getCallback(predicate, thisArg, 3);
      }
      return func(collection, predicate);
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through `iteratee`. This method performs
     * a stable sort, that is, it preserves the original sort order of equal elements.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * _.sortBy([1, 2, 3], function(n) {
     *   return Math.sin(n);
     * });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(n) {
     *   return this.sin(n);
     * }, Math);
     * // => [3, 1, 2]
     *
     * var users = [
     *   { 'user': 'fred' },
     *   { 'user': 'pebbles' },
     *   { 'user': 'barney' }
     * ];
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.sortBy(users, 'user'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function sortBy(collection, iteratee, thisArg) {
      if (collection == null) {
        return [];
      }
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
        iteratee = undefined;
      }
      var index = -1;
      iteratee = getCallback(iteratee, thisArg, 3);

      var result = baseMap(collection, function(value, key, collection) {
        return { 'criteria': iteratee(value, key, collection), 'index': ++index, 'value': value };
      });
      return baseSortBy(result, compareAscending);
    }

    /**
     * This method is like `_.sortBy` except that it can sort by multiple iteratees
     * or property names.
     *
     * If a property name is provided for an iteratee the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If an object is provided for an iteratee the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(Function|Function[]|Object|Object[]|string|string[])} iteratees
     *  The iteratees to sort by, specified as individual values or arrays of values.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 42 },
     *   { 'user': 'barney', 'age': 34 }
     * ];
     *
     * _.map(_.sortByAll(users, ['user', 'age']), _.values);
     * // => [['barney', 34], ['barney', 36], ['fred', 42], ['fred', 48]]
     *
     * _.map(_.sortByAll(users, 'user', function(chr) {
     *   return Math.floor(chr.age / 10);
     * }), _.values);
     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
     */
    var sortByAll = restParam(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var guard = iteratees[2];
      if (guard && isIterateeCall(iteratees[0], iteratees[1], guard)) {
        iteratees.length = 1;
      }
      return baseSortByOrder(collection, baseFlatten(iteratees), []);
    });

    /**
     * This method is like `_.sortByAll` except that it allows specifying the
     * sort orders of the iteratees to sort by. If `orders` is unspecified, all
     * values are sorted in ascending order. Otherwise, a value is sorted in
     * ascending order if its corresponding order is "asc", and descending if "desc".
     *
     * If a property name is provided for an iteratee the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If an object is provided for an iteratee the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {boolean[]} [orders] The sort orders of `iteratees`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 34 },
     *   { 'user': 'fred',   'age': 42 },
     *   { 'user': 'barney', 'age': 36 }
     * ];
     *
     * // sort by `user` in ascending order and by `age` in descending order
     * _.map(_.sortByOrder(users, ['user', 'age'], ['asc', 'desc']), _.values);
     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
     */
    function sortByOrder(collection, iteratees, orders, guard) {
      if (collection == null) {
        return [];
      }
      if (guard && isIterateeCall(iteratees, orders, guard)) {
        orders = undefined;
      }
      if (!isArray(iteratees)) {
        iteratees = iteratees == null ? [] : [iteratees];
      }
      if (!isArray(orders)) {
        orders = orders == null ? [] : [orders];
      }
      return baseSortByOrder(collection, iteratees, orders);
    }

    /**
     * Performs a deep comparison between each element in `collection` and the
     * source object, returning an array of all elements that have equivalent
     * property values.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Object} source The object of property values to match.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false, 'pets': ['hoppy'] },
     *   { 'user': 'fred',   'age': 40, 'active': true, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.pluck(_.where(users, { 'age': 36, 'active': false }), 'user');
     * // => ['barney']
     *
     * _.pluck(_.where(users, { 'pets': ['dino'] }), 'user');
     * // => ['fred']
     */
    function where(collection, source) {
      return filter(collection, baseMatches(source));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Date
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => logs the number of milliseconds it took for the deferred function to be invoked
     */
    var now = nativeNow || function() {
      return new Date().getTime();
    };

    /*------------------------------------------------------------------------*/

    /**
     * The opposite of `_.before`; this method creates a function that invokes
     * `func` once it is called `n` or more times.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {number} n The number of calls before `func` is invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'done saving!' after the two async saves have completed
     */
    function after(n, func) {
      if (typeof func != 'function') {
        if (typeof n == 'function') {
          var temp = n;
          n = func;
          func = temp;
        } else {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
      }
      n = nativeIsFinite(n = +n) ? n : 0;
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that accepts up to `n` arguments ignoring any
     * additional arguments.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to cap arguments for.
     * @param {number} [n=func.length] The arity cap.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new function.
     * @example
     *
     * _.map(['6', '8', '10'], _.ary(parseInt, 1));
     * // => [6, 8, 10]
     */
    function ary(func, n, guard) {
      if (guard && isIterateeCall(func, n, guard)) {
        n = undefined;
      }
      n = (func && n == null) ? func.length : nativeMax(+n || 0, 0);
      return createWrapper(func, ARY_FLAG, undefined, undefined, undefined, undefined, n);
    }

    /**
     * Creates a function that invokes `func`, with the `this` binding and arguments
     * of the created function, while it is called less than `n` times. Subsequent
     * calls to the created function return the result of the last `func` invocation.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {number} n The number of calls at which `func` is no longer invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * jQuery('#add').on('click', _.before(5, addContactToList));
     * // => allows adding up to 4 contacts to the list
     */
    function before(n, func) {
      var result;
      if (typeof func != 'function') {
        if (typeof n == 'function') {
          var temp = n;
          n = func;
          func = temp;
        } else {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
      }
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = undefined;
        }
        return result;
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and prepends any additional `_.bind` arguments to those provided to the
     * bound function.
     *
     * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for partially applied arguments.
     *
     * **Note:** Unlike native `Function#bind` this method does not set the "length"
     * property of bound functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var greet = function(greeting, punctuation) {
     *   return greeting + ' ' + this.user + punctuation;
     * };
     *
     * var object = { 'user': 'fred' };
     *
     * var bound = _.bind(greet, object, 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * // using placeholders
     * var bound = _.bind(greet, object, _, '!');
     * bound('hi');
     * // => 'hi fred!'
     */
    var bind = restParam(function(func, thisArg, partials) {
      var bitmask = BIND_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, bind.placeholder);
        bitmask |= PARTIAL_FLAG;
      }
      return createWrapper(func, bitmask, thisArg, partials, holders);
    });

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all enumerable function
     * properties, own and inherited, of `object` are bound.
     *
     * **Note:** This method does not set the "length" property of bound functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...(string|string[])} [methodNames] The object method names to bind,
     *  specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() {
     *     console.log('clicked ' + this.label);
     *   }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs' when the element is clicked
     */
    var bindAll = restParam(function(object, methodNames) {
      methodNames = methodNames.length ? baseFlatten(methodNames) : functions(object);

      var index = -1,
          length = methodNames.length;

      while (++index < length) {
        var key = methodNames[index];
        object[key] = createWrapper(object[key], BIND_FLAG, object);
      }
      return object;
    });

    /**
     * Creates a function that invokes the method at `object[key]` and prepends
     * any additional `_.bindKey` arguments to those provided to the bound function.
     *
     * This method differs from `_.bind` by allowing bound functions to reference
     * methods that may be redefined or don't yet exist.
     * See [Peter Michaux's article](http://peter.michaux.ca/articles/lazy-function-definition-pattern)
     * for more details.
     *
     * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'user': 'fred',
     *   'greet': function(greeting, punctuation) {
     *     return greeting + ' ' + this.user + punctuation;
     *   }
     * };
     *
     * var bound = _.bindKey(object, 'greet', 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * object.greet = function(greeting, punctuation) {
     *   return greeting + 'ya ' + this.user + punctuation;
     * };
     *
     * bound('!');
     * // => 'hiya fred!'
     *
     * // using placeholders
     * var bound = _.bindKey(object, 'greet', _, '!');
     * bound('hi');
     * // => 'hiya fred!'
     */
    var bindKey = restParam(function(object, key, partials) {
      var bitmask = BIND_FLAG | BIND_KEY_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, bindKey.placeholder);
        bitmask |= PARTIAL_FLAG;
      }
      return createWrapper(key, bitmask, object, partials, holders);
    });

    /**
     * Creates a function that accepts one or more arguments of `func` that when
     * called either invokes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` may be specified
     * if `func.length` is not sufficient.
     *
     * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for provided arguments.
     *
     * **Note:** This method does not set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curry(abc);
     *
     * curried(1)(2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // using placeholders
     * curried(1)(_, 3)(2);
     * // => [1, 2, 3]
     */
    var curry = createCurry(CURRY_FLAG);

    /**
     * This method is like `_.curry` except that arguments are applied to `func`
     * in the manner of `_.partialRight` instead of `_.partial`.
     *
     * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for provided arguments.
     *
     * **Note:** This method does not set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curryRight(abc);
     *
     * curried(3)(2)(1);
     * // => [1, 2, 3]
     *
     * curried(2, 3)(1);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // using placeholders
     * curried(3)(1, _)(2);
     * // => [1, 2, 3]
     */
    var curryRight = createCurry(CURRY_RIGHT_FLAG);

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed invocations. Provide an options object to indicate that `func`
     * should be invoked on the leading and/or trailing edge of the `wait` timeout.
     * Subsequent calls to the debounced function return the result of the last
     * `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify invoking on the leading
     *  edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be
     *  delayed before it is invoked.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // ensure `batchLog` is invoked once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }));
     *
     * // cancel a debounced call
     * var todoChanges = _.debounce(batchLog, 1000);
     * Object.observe(models.todo, todoChanges);
     *
     * Object.observe(models, function(changes) {
     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
     *     todoChanges.cancel();
     *   }
     * }, ['delete']);
     *
     * // ...at some point `models.todo` is changed
     * models.todo.completed = true;
     *
     * // ...before 1 second has passed `models.todo` is deleted
     * // which cancels the debounced `todoChanges` call
     * delete models.todo;
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = wait < 0 ? 0 : (+wait || 0);
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = !!options.leading;
        maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function cancel() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        lastCalled = 0;
        maxTimeoutId = timeoutId = trailingCall = undefined;
      }

      function complete(isCalled, id) {
        if (id) {
          clearTimeout(id);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (isCalled) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = undefined;
          }
        }
      }

      function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0 || remaining > wait) {
          complete(trailingCall, maxTimeoutId);
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      }

      function maxDelayed() {
        complete(trailing, timeoutId);
      }

      function debounced() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0 || remaining > maxWait;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
        return result;
      }
      debounced.cancel = cancel;
      return debounced;
    }

    /**
     * Defers invoking the `func` until the current call stack has cleared. Any
     * additional arguments are provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to defer.
     * @param {...*} [args] The arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) {
     *   console.log(text);
     * }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    var defer = restParam(function(func, args) {
      return baseDelay(func, 1, args);
    });

    /**
     * Invokes `func` after `wait` milliseconds. Any additional arguments are
     * provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {...*} [args] The arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) {
     *   console.log(text);
     * }, 1000, 'later');
     * // => logs 'later' after one second
     */
    var delay = restParam(function(func, wait, args) {
      return baseDelay(func, wait, args);
    });

    /**
     * Creates a function that returns the result of invoking the provided
     * functions with the `this` binding of the created function, where each
     * successive invocation is supplied the return value of the previous.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {...Function} [funcs] Functions to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flow(_.add, square);
     * addSquare(1, 2);
     * // => 9
     */
    var flow = createFlow();

    /**
     * This method is like `_.flow` except that it creates a function that
     * invokes the provided functions from right to left.
     *
     * @static
     * @memberOf _
     * @alias backflow, compose
     * @category Function
     * @param {...Function} [funcs] Functions to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flowRight(square, _.add);
     * addSquare(1, 2);
     * // => 9
     */
    var flowRight = createFlow(true);

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is coerced to a string and used as the
     * cache key. The `func` is invoked with the `this` binding of the memoized
     * function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
     * method interface of `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var upperCase = _.memoize(function(string) {
     *   return string.toUpperCase();
     * });
     *
     * upperCase('fred');
     * // => 'FRED'
     *
     * // modifying the result cache
     * upperCase.cache.set('fred', 'BARNEY');
     * upperCase('fred');
     * // => 'BARNEY'
     *
     * // replacing `_.memoize.Cache`
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'barney' };
     * var identity = _.memoize(_.identity);
     *
     * identity(object);
     * // => { 'user': 'fred' }
     * identity(other);
     * // => { 'user': 'fred' }
     *
     * _.memoize.Cache = WeakMap;
     * var identity = _.memoize(_.identity);
     *
     * identity(object);
     * // => { 'user': 'fred' }
     * identity(other);
     * // => { 'user': 'barney' }
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result);
        return result;
      };
      memoized.cache = new memoize.Cache;
      return memoized;
    }

    /**
     * Creates a function that runs each argument through a corresponding
     * transform function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to wrap.
     * @param {...(Function|Function[])} [transforms] The functions to transform
     * arguments, specified as individual functions or arrays of functions.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function doubled(n) {
     *   return n * 2;
     * }
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var modded = _.modArgs(function(x, y) {
     *   return [x, y];
     * }, square, doubled);
     *
     * modded(1, 2);
     * // => [1, 4]
     *
     * modded(5, 10);
     * // => [25, 20]
     */
    var modArgs = restParam(function(func, transforms) {
      transforms = baseFlatten(transforms);
      if (typeof func != 'function' || !arrayEvery(transforms, baseIsFunction)) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = transforms.length;
      return restParam(function(args) {
        var index = nativeMin(args.length, length);
        while (index--) {
          args[index] = transforms[index](args[index]);
        }
        return func.apply(this, args);
      });
    });

    /**
     * Creates a function that negates the result of the predicate `func`. The
     * `func` predicate is invoked with the `this` binding and arguments of the
     * created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} predicate The predicate to negate.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function isEven(n) {
     *   return n % 2 == 0;
     * }
     *
     * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
     * // => [1, 3, 5]
     */
    function negate(predicate) {
      if (typeof predicate != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function() {
        return !predicate.apply(this, arguments);
      };
    }

    /**
     * Creates a function that is restricted to invoking `func` once. Repeat calls
     * to the function return the value of the first call. The `func` is invoked
     * with the `this` binding and arguments of the created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` invokes `createApplication` once
     */
    function once(func) {
      return before(2, func);
    }

    /**
     * Creates a function that invokes `func` with `partial` arguments prepended
     * to those provided to the new function. This method is like `_.bind` except
     * it does **not** alter the `this` binding.
     *
     * The `_.partial.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method does not set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) {
     *   return greeting + ' ' + name;
     * };
     *
     * var sayHelloTo = _.partial(greet, 'hello');
     * sayHelloTo('fred');
     * // => 'hello fred'
     *
     * // using placeholders
     * var greetFred = _.partial(greet, _, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     */
    var partial = createPartial(PARTIAL_FLAG);

    /**
     * This method is like `_.partial` except that partially applied arguments
     * are appended to those provided to the new function.
     *
     * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method does not set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) {
     *   return greeting + ' ' + name;
     * };
     *
     * var greetFred = _.partialRight(greet, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     *
     * // using placeholders
     * var sayHelloTo = _.partialRight(greet, 'hello', _);
     * sayHelloTo('fred');
     * // => 'hello fred'
     */
    var partialRight = createPartial(PARTIAL_RIGHT_FLAG);

    /**
     * Creates a function that invokes `func` with arguments arranged according
     * to the specified indexes where the argument value at the first index is
     * provided as the first argument, the argument value at the second index is
     * provided as the second argument, and so on.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to rearrange arguments for.
     * @param {...(number|number[])} indexes The arranged argument indexes,
     *  specified as individual indexes or arrays of indexes.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var rearged = _.rearg(function(a, b, c) {
     *   return [a, b, c];
     * }, 2, 0, 1);
     *
     * rearged('b', 'c', 'a')
     * // => ['a', 'b', 'c']
     *
     * var map = _.rearg(_.map, [1, 0]);
     * map(function(n) {
     *   return n * 3;
     * }, [1, 2, 3]);
     * // => [3, 6, 9]
     */
    var rearg = restParam(function(func, indexes) {
      return createWrapper(func, REARG_FLAG, undefined, undefined, undefined, baseFlatten(indexes));
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * created function and arguments from `start` and beyond provided as an array.
     *
     * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.restParam(function(what, names) {
     *   return what + ' ' + _.initial(names).join(', ') +
     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
     * });
     *
     * say('hello', 'fred', 'barney', 'pebbles');
     * // => 'hello fred, barney, & pebbles'
     */
    function restParam(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            rest = Array(length);

        while (++index < length) {
          rest[index] = args[start + index];
        }
        switch (start) {
          case 0: return func.call(this, rest);
          case 1: return func.call(this, args[0], rest);
          case 2: return func.call(this, args[0], args[1], rest);
        }
        var otherArgs = Array(start + 1);
        index = -1;
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = rest;
        return func.apply(this, otherArgs);
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of the created
     * function and an array of arguments much like [`Function#apply`](https://es5.github.io/#x15.3.4.3).
     *
     * **Note:** This method is based on the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator).
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to spread arguments over.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.spread(function(who, what) {
     *   return who + ' says ' + what;
     * });
     *
     * say(['fred', 'hello']);
     * // => 'fred says hello'
     *
     * // with a Promise
     * var numbers = Promise.all([
     *   Promise.resolve(40),
     *   Promise.resolve(36)
     * ]);
     *
     * numbers.then(_.spread(function(x, y) {
     *   return x + y;
     * }));
     * // => a Promise of 76
     */
    function spread(func) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function(array) {
        return func.apply(this, array);
      };
    }

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed invocations. Provide an options object to indicate
     * that `func` should be invoked on the leading and/or trailing edge of the
     * `wait` timeout. Subsequent calls to the throttled function return the
     * result of the last `func` call.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify invoking on the leading
     *  edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     *
     * // cancel a trailing throttled call
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce(func, wait, { 'leading': leading, 'maxWait': +wait, 'trailing': trailing });
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Any additional arguments provided to the function are
     * appended to those provided to the wrapper function. The wrapper is invoked
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('fred, barney, & pebbles');
     * // => '<p>fred, barney, &amp; pebbles</p>'
     */
    function wrap(value, wrapper) {
      wrapper = wrapper == null ? identity : wrapper;
      return createWrapper(wrapper, PARTIAL_FLAG, undefined, [value], []);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
     * otherwise they are assigned by reference. If `customizer` is provided it is
     * invoked to produce the cloned values. If `customizer` returns `undefined`
     * cloning is handled by the method instead. The `customizer` is bound to
     * `thisArg` and invoked with two argument; (value [, index|key, object]).
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
     * The enumerable properties of `arguments` objects and objects created by
     * constructors other than `Object` are cloned to plain `Object` objects. An
     * empty object is returned for uncloneable values such as functions, DOM nodes,
     * Maps, Sets, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * var shallow = _.clone(users);
     * shallow[0] === users[0];
     * // => true
     *
     * var deep = _.clone(users, true);
     * deep[0] === users[0];
     * // => false
     *
     * // using a customizer callback
     * var el = _.clone(document.body, function(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(false);
     *   }
     * });
     *
     * el === document.body
     * // => false
     * el.nodeName
     * // => BODY
     * el.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, customizer, thisArg) {
      if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
        isDeep = false;
      }
      else if (typeof isDeep == 'function') {
        thisArg = customizer;
        customizer = isDeep;
        isDeep = false;
      }
      return typeof customizer == 'function'
        ? baseClone(value, isDeep, bindCallback(customizer, thisArg, 1))
        : baseClone(value, isDeep);
    }

    /**
     * Creates a deep clone of `value`. If `customizer` is provided it is invoked
     * to produce the cloned values. If `customizer` returns `undefined` cloning
     * is handled by the method instead. The `customizer` is bound to `thisArg`
     * and invoked with two argument; (value [, index|key, object]).
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
     * The enumerable properties of `arguments` objects and objects created by
     * constructors other than `Object` are cloned to plain `Object` objects. An
     * empty object is returned for uncloneable values such as functions, DOM nodes,
     * Maps, Sets, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * var deep = _.cloneDeep(users);
     * deep[0] === users[0];
     * // => false
     *
     * // using a customizer callback
     * var el = _.cloneDeep(document.body, function(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(true);
     *   }
     * });
     *
     * el === document.body
     * // => false
     * el.nodeName
     * // => BODY
     * el.childNodes.length;
     * // => 20
     */
    function cloneDeep(value, customizer, thisArg) {
      return typeof customizer == 'function'
        ? baseClone(value, true, bindCallback(customizer, thisArg, 1))
        : baseClone(value, true);
    }

    /**
     * Checks if `value` is greater than `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than `other`, else `false`.
     * @example
     *
     * _.gt(3, 1);
     * // => true
     *
     * _.gt(3, 3);
     * // => false
     *
     * _.gt(1, 3);
     * // => false
     */
    function gt(value, other) {
      return value > other;
    }

    /**
     * Checks if `value` is greater than or equal to `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than or equal to `other`, else `false`.
     * @example
     *
     * _.gte(3, 1);
     * // => true
     *
     * _.gte(3, 3);
     * // => true
     *
     * _.gte(1, 3);
     * // => false
     */
    function gte(value, other) {
      return value >= other;
    }

    /**
     * Checks if `value` is classified as an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return isObjectLike(value) && isArrayLike(value) &&
        hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(function() { return arguments; }());
     * // => false
     */
    var isArray = nativeIsArray || function(value) {
      return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
    };

    /**
     * Checks if `value` is classified as a boolean primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isBoolean(false);
     * // => true
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false || (isObjectLike(value) && objToString.call(value) == boolTag);
    }

    /**
     * Checks if `value` is classified as a `Date` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     *
     * _.isDate('Mon April 23 2012');
     * // => false
     */
    function isDate(value) {
      return isObjectLike(value) && objToString.call(value) == dateTag;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     *
     * _.isElement('<body>');
     * // => false
     */
    function isElement(value) {
      return !!value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value);
    }

    /**
     * Checks if `value` is empty. A value is considered empty unless it is an
     * `arguments` object, array, string, or jQuery-like collection with a length
     * greater than `0` or an object with own enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty(null);
     * // => true
     *
     * _.isEmpty(true);
     * // => true
     *
     * _.isEmpty(1);
     * // => true
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({ 'a': 1 });
     * // => false
     */
    function isEmpty(value) {
      if (value == null) {
        return true;
      }
      if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) ||
          (isObjectLike(value) && isFunction(value.splice)))) {
        return !value.length;
      }
      return !keys(value).length;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent. If `customizer` is provided it is invoked to compare values.
     * If `customizer` returns `undefined` comparisons are handled by the method
     * instead. The `customizer` is bound to `thisArg` and invoked with three
     * arguments: (value, other [, index|key]).
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. Functions and DOM nodes
     * are **not** supported. Provide a customizer function to extend support
     * for comparing other values.
     *
     * @static
     * @memberOf _
     * @alias eq
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize value comparisons.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'fred' };
     *
     * object == other;
     * // => false
     *
     * _.isEqual(object, other);
     * // => true
     *
     * // using a customizer callback
     * var array = ['hello', 'goodbye'];
     * var other = ['hi', 'goodbye'];
     *
     * _.isEqual(array, other, function(value, other) {
     *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
     *     return true;
     *   }
     * });
     * // => true
     */
    function isEqual(value, other, customizer, thisArg) {
      customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
      var result = customizer ? customizer(value, other) : undefined;
      return  result === undefined ? baseIsEqual(value, other, customizer) : !!result;
    }

    /**
     * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
     * `SyntaxError`, `TypeError`, or `URIError` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
     * @example
     *
     * _.isError(new Error);
     * // => true
     *
     * _.isError(Error);
     * // => false
     */
    function isError(value) {
      return isObjectLike(value) && typeof value.message == 'string' && objToString.call(value) == errorTag;
    }

    /**
     * Checks if `value` is a finite primitive number.
     *
     * **Note:** This method is based on [`Number.isFinite`](http://ecma-international.org/ecma-262/6.0/#sec-number.isfinite).
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
     * @example
     *
     * _.isFinite(10);
     * // => true
     *
     * _.isFinite('10');
     * // => false
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite(Object(10));
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return typeof value == 'number' && nativeIsFinite(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in older versions of Chrome and Safari which return 'function' for regexes
      // and Safari 8 equivalents which return 'object' for typed array constructors.
      return isObject(value) && objToString.call(value) == funcTag;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Performs a deep comparison between `object` and `source` to determine if
     * `object` contains equivalent property values. If `customizer` is provided
     * it is invoked to compare values. If `customizer` returns `undefined`
     * comparisons are handled by the method instead. The `customizer` is bound
     * to `thisArg` and invoked with three arguments: (value, other, index|key).
     *
     * **Note:** This method supports comparing properties of arrays, booleans,
     * `Date` objects, numbers, `Object` objects, regexes, and strings. Functions
     * and DOM nodes are **not** supported. Provide a customizer function to extend
     * support for comparing other values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Function} [customizer] The function to customize value comparisons.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.isMatch(object, { 'age': 40 });
     * // => true
     *
     * _.isMatch(object, { 'age': 36 });
     * // => false
     *
     * // using a customizer callback
     * var object = { 'greeting': 'hello' };
     * var source = { 'greeting': 'hi' };
     *
     * _.isMatch(object, source, function(value, other) {
     *   return _.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/) || undefined;
     * });
     * // => true
     */
    function isMatch(object, source, customizer, thisArg) {
      customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
      return baseIsMatch(object, getMatchData(source), customizer);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * **Note:** This method is not the same as [`isNaN`](https://es5.github.io/#x15.1.2.4)
     * which returns `true` for `undefined` and other non-numeric values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // An `NaN` primitive is the only value that is not equal to itself.
      // Perform the `toStringTag` check first to avoid errors with some host objects in IE.
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
     * @example
     *
     * _.isNative(Array.prototype.push);
     * // => true
     *
     * _.isNative(_);
     * // => false
     */
    function isNative(value) {
      if (value == null) {
        return false;
      }
      if (isFunction(value)) {
        return reIsNative.test(fnToString.call(value));
      }
      return isObjectLike(value) && reIsHostCtor.test(value);
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(void 0);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is classified as a `Number` primitive or object.
     *
     * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
     * as numbers, use the `_.isFinite` method.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isNumber(8.4);
     * // => true
     *
     * _.isNumber(NaN);
     * // => true
     *
     * _.isNumber('8.4');
     * // => false
     */
    function isNumber(value) {
      return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
    }

    /**
     * Checks if `value` is a plain object, that is, an object created by the
     * `Object` constructor or one with a `[[Prototype]]` of `null`.
     *
     * **Note:** This method assumes objects created by the `Object` constructor
     * have no inherited enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * _.isPlainObject(new Foo);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     *
     * _.isPlainObject(Object.create(null));
     * // => true
     */
    function isPlainObject(value) {
      var Ctor;

      // Exit early for non `Object` objects.
      if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
          (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
        return false;
      }
      // IE < 9 iterates inherited properties before own properties. If the first
      // iterated property is an object's own property then there are no inherited
      // enumerable properties.
      var result;
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      baseForIn(value, function(subValue, key) {
        result = key;
      });
      return result === undefined || hasOwnProperty.call(value, result);
    }

    /**
     * Checks if `value` is classified as a `RegExp` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isRegExp(/abc/);
     * // => true
     *
     * _.isRegExp('/abc/');
     * // => false
     */
    function isRegExp(value) {
      return isObject(value) && objToString.call(value) == regexpTag;
    }

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
    }

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    function isTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     *
     * _.isUndefined(null);
     * // => false
     */
    function isUndefined(value) {
      return value === undefined;
    }

    /**
     * Checks if `value` is less than `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than `other`, else `false`.
     * @example
     *
     * _.lt(1, 3);
     * // => true
     *
     * _.lt(3, 3);
     * // => false
     *
     * _.lt(3, 1);
     * // => false
     */
    function lt(value, other) {
      return value < other;
    }

    /**
     * Checks if `value` is less than or equal to `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than or equal to `other`, else `false`.
     * @example
     *
     * _.lte(1, 3);
     * // => true
     *
     * _.lte(3, 3);
     * // => true
     *
     * _.lte(3, 1);
     * // => false
     */
    function lte(value, other) {
      return value <= other;
    }

    /**
     * Converts `value` to an array.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Array} Returns the converted array.
     * @example
     *
     * (function() {
     *   return _.toArray(arguments).slice(1);
     * }(1, 2, 3));
     * // => [2, 3]
     */
    function toArray(value) {
      var length = value ? getLength(value) : 0;
      if (!isLength(length)) {
        return values(value);
      }
      if (!length) {
        return [];
      }
      return arrayCopy(value);
    }

    /**
     * Converts `value` to a plain object flattening inherited enumerable
     * properties of `value` to own properties of the plain object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Object} Returns the converted plain object.
     * @example
     *
     * function Foo() {
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.assign({ 'a': 1 }, new Foo);
     * // => { 'a': 1, 'b': 2 }
     *
     * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
     * // => { 'a': 1, 'b': 2, 'c': 3 }
     */
    function toPlainObject(value) {
      return baseCopy(value, keysIn(value));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * overwrite property assignments of previous sources. If `customizer` is
     * provided it is invoked to produce the merged values of the destination and
     * source properties. If `customizer` returns `undefined` merging is handled
     * by the method instead. The `customizer` is bound to `thisArg` and invoked
     * with five arguments: (objectValue, sourceValue, key, object, source).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var users = {
     *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
     * };
     *
     * var ages = {
     *   'data': [{ 'age': 36 }, { 'age': 40 }]
     * };
     *
     * _.merge(users, ages);
     * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
     *
     * // using a customizer callback
     * var object = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var other = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(object, other, function(a, b) {
     *   if (_.isArray(a)) {
     *     return a.concat(b);
     *   }
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
     */
    var merge = createAssigner(baseMerge);

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources overwrite property assignments of previous sources.
     * If `customizer` is provided it is invoked to produce the assigned values.
     * The `customizer` is bound to `thisArg` and invoked with five arguments:
     * (objectValue, sourceValue, key, object, source).
     *
     * **Note:** This method mutates `object` and is based on
     * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
     *
     * @static
     * @memberOf _
     * @alias extend
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
     * // => { 'user': 'fred', 'age': 40 }
     *
     * // using a customizer callback
     * var defaults = _.partialRight(_.assign, function(value, other) {
     *   return _.isUndefined(value) ? other : value;
     * });
     *
     * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
     * // => { 'user': 'barney', 'age': 36 }
     */
    var assign = createAssigner(function(object, source, customizer) {
      return customizer
        ? assignWith(object, source, customizer)
        : baseAssign(object, source);
    });

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, {
     *   'constructor': Circle
     * });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties, guard) {
      var result = baseCreate(prototype);
      if (guard && isIterateeCall(prototype, properties, guard)) {
        properties = undefined;
      }
      return properties ? baseAssign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional values of the same property are ignored.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
     * // => { 'user': 'barney', 'age': 36 }
     */
    var defaults = createDefaults(assign, assignDefaults);

    /**
     * This method is like `_.defaults` except that it recursively assigns
     * default properties.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.defaultsDeep({ 'user': { 'name': 'barney' } }, { 'user': { 'name': 'fred', 'age': 36 } });
     * // => { 'user': { 'name': 'barney', 'age': 36 } }
     *
     */
    var defaultsDeep = createDefaults(merge, mergeDefaults);

    /**
     * This method is like `_.find` except that it returns the key of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findKey(users, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (iteration order is not guaranteed)
     *
     * // using the `_.matches` callback shorthand
     * _.findKey(users, { 'age': 1, 'active': true });
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findKey(users, 'active', false);
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.findKey(users, 'active');
     * // => 'barney'
     */
    var findKey = createFindKey(baseForOwn);

    /**
     * This method is like `_.findKey` except that it iterates over elements of
     * a collection in the opposite order.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findLastKey(users, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles` assuming `_.findKey` returns `barney`
     *
     * // using the `_.matches` callback shorthand
     * _.findLastKey(users, { 'age': 36, 'active': true });
     * // => 'barney'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findLastKey(users, 'active', false);
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.findLastKey(users, 'active');
     * // => 'pebbles'
     */
    var findLastKey = createFindKey(baseForOwnRight);

    /**
     * Iterates over own and inherited enumerable properties of an object invoking
     * `iteratee` for each property. The `iteratee` is bound to `thisArg` and invoked
     * with three arguments: (value, key, object). Iteratee functions may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forIn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'a', 'b', and 'c' (iteration order is not guaranteed)
     */
    var forIn = createForIn(baseFor);

    /**
     * This method is like `_.forIn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forInRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'c', 'b', and 'a' assuming `_.forIn ` logs 'a', 'b', and 'c'
     */
    var forInRight = createForIn(baseForRight);

    /**
     * Iterates over own enumerable properties of an object invoking `iteratee`
     * for each property. The `iteratee` is bound to `thisArg` and invoked with
     * three arguments: (value, key, object). Iteratee functions may exit iteration
     * early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'a' and 'b' (iteration order is not guaranteed)
     */
    var forOwn = createForOwn(baseForOwn);

    /**
     * This method is like `_.forOwn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwnRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'b' and 'a' assuming `_.forOwn` logs 'a' and 'b'
     */
    var forOwnRight = createForOwn(baseForOwnRight);

    /**
     * Creates an array of function property names from all enumerable properties,
     * own and inherited, of `object`.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Object
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns the new array of property names.
     * @example
     *
     * _.functions(_);
     * // => ['after', 'ary', 'assign', ...]
     */
    function functions(object) {
      return baseFunctions(object, keysIn(object));
    }

    /**
     * Gets the property value at `path` of `object`. If the resolved value is
     * `undefined` the `defaultValue` is used in its place.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.get(object, 'a[0].b.c');
     * // => 3
     *
     * _.get(object, ['a', '0', 'b', 'c']);
     * // => 3
     *
     * _.get(object, 'a.b.c', 'default');
     * // => 'default'
     */
    function get(object, path, defaultValue) {
      var result = object == null ? undefined : baseGet(object, toPath(path), path + '');
      return result === undefined ? defaultValue : result;
    }

    /**
     * Checks if `path` is a direct property.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` is a direct property, else `false`.
     * @example
     *
     * var object = { 'a': { 'b': { 'c': 3 } } };
     *
     * _.has(object, 'a');
     * // => true
     *
     * _.has(object, 'a.b.c');
     * // => true
     *
     * _.has(object, ['a', 'b', 'c']);
     * // => true
     */
    function has(object, path) {
      if (object == null) {
        return false;
      }
      var result = hasOwnProperty.call(object, path);
      if (!result && !isKey(path)) {
        path = toPath(path);
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        if (object == null) {
          return false;
        }
        path = last(path);
        result = hasOwnProperty.call(object, path);
      }
      return result || (isLength(object.length) && isIndex(path, object.length) &&
        (isArray(object) || isArguments(object)));
    }

    /**
     * Creates an object composed of the inverted keys and values of `object`.
     * If `object` contains duplicate values, subsequent values overwrite property
     * assignments of previous values unless `multiValue` is `true`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to invert.
     * @param {boolean} [multiValue] Allow multiple values per key.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Object} Returns the new inverted object.
     * @example
     *
     * var object = { 'a': 1, 'b': 2, 'c': 1 };
     *
     * _.invert(object);
     * // => { '1': 'c', '2': 'b' }
     *
     * // with `multiValue`
     * _.invert(object, true);
     * // => { '1': ['a', 'c'], '2': ['b'] }
     */
    function invert(object, multiValue, guard) {
      if (guard && isIterateeCall(object, multiValue, guard)) {
        multiValue = undefined;
      }
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index],
            value = object[key];

        if (multiValue) {
          if (hasOwnProperty.call(result, value)) {
            result[value].push(key);
          } else {
            result[value] = [key];
          }
        }
        else {
          result[value] = key;
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      var Ctor = object == null ? undefined : object.constructor;
      if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
          (typeof object != 'function' && isArrayLike(object))) {
        return shimKeys(object);
      }
      return isObject(object) ? nativeKeys(object) : [];
    };

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      if (object == null) {
        return [];
      }
      if (!isObject(object)) {
        object = Object(object);
      }
      var length = object.length;
      length = (length && isLength(length) &&
        (isArray(object) || isArguments(object)) && length) || 0;

      var Ctor = object.constructor,
          index = -1,
          isProto = typeof Ctor == 'function' && Ctor.prototype === object,
          result = Array(length),
          skipIndexes = length > 0;

      while (++index < length) {
        result[index] = (index + '');
      }
      for (var key in object) {
        if (!(skipIndexes && isIndex(key, length)) &&
            !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The opposite of `_.mapValues`; this method creates an object with the
     * same values as `object` and keys generated by running each own enumerable
     * property of `object` through `iteratee`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the new mapped object.
     * @example
     *
     * _.mapKeys({ 'a': 1, 'b': 2 }, function(value, key) {
     *   return key + value;
     * });
     * // => { 'a1': 1, 'b2': 2 }
     */
    var mapKeys = createObjectMapper(true);

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through `iteratee`. The
     * iteratee function is bound to `thisArg` and invoked with three arguments:
     * (value, key, object).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the new mapped object.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2 }, function(n) {
     *   return n * 3;
     * });
     * // => { 'a': 3, 'b': 6 }
     *
     * var users = {
     *   'fred':    { 'user': 'fred',    'age': 40 },
     *   'pebbles': { 'user': 'pebbles', 'age': 1 }
     * };
     *
     * // using the `_.property` callback shorthand
     * _.mapValues(users, 'age');
     * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
     */
    var mapValues = createObjectMapper();

    /**
     * The opposite of `_.pick`; this method creates an object composed of the
     * own and inherited enumerable properties of `object` that are not omitted.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {Function|...(string|string[])} [predicate] The function invoked per
     *  iteration or property names to omit, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.omit(object, 'age');
     * // => { 'user': 'fred' }
     *
     * _.omit(object, _.isNumber);
     * // => { 'user': 'fred' }
     */
    var omit = restParam(function(object, props) {
      if (object == null) {
        return {};
      }
      if (typeof props[0] != 'function') {
        var props = arrayMap(baseFlatten(props), String);
        return pickByArray(object, baseDifference(keysIn(object), props));
      }
      var predicate = bindCallback(props[0], props[1], 3);
      return pickByCallback(object, function(value, key, object) {
        return !predicate(value, key, object);
      });
    });

    /**
     * Creates a two dimensional array of the key-value pairs for `object`,
     * e.g. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
     */
    function pairs(object) {
      object = toObject(object);

      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates an object composed of the picked `object` properties. Property
     * names may be specified as individual arguments or as arrays of property
     * names. If `predicate` is provided it is invoked for each property of `object`
     * picking the properties `predicate` returns truthy for. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {Function|...(string|string[])} [predicate] The function invoked per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.pick(object, 'user');
     * // => { 'user': 'fred' }
     *
     * _.pick(object, _.isString);
     * // => { 'user': 'fred' }
     */
    var pick = restParam(function(object, props) {
      if (object == null) {
        return {};
      }
      return typeof props[0] == 'function'
        ? pickByCallback(object, bindCallback(props[0], props[1], 3))
        : pickByArray(object, baseFlatten(props));
    });

    /**
     * This method is like `_.get` except that if the resolved value is a function
     * it is invoked with the `this` binding of its parent object and its result
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to resolve.
     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
     *
     * _.result(object, 'a[0].b.c1');
     * // => 3
     *
     * _.result(object, 'a[0].b.c2');
     * // => 4
     *
     * _.result(object, 'a.b.c', 'default');
     * // => 'default'
     *
     * _.result(object, 'a.b.c', _.constant('default'));
     * // => 'default'
     */
    function result(object, path, defaultValue) {
      var result = object == null ? undefined : object[path];
      if (result === undefined) {
        if (object != null && !isKey(path, object)) {
          path = toPath(path);
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          result = object == null ? undefined : object[last(path)];
        }
        result = result === undefined ? defaultValue : result;
      }
      return isFunction(result) ? result.call(object) : result;
    }

    /**
     * Sets the property value of `path` on `object`. If a portion of `path`
     * does not exist it is created.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to augment.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.set(object, 'a[0].b.c', 4);
     * console.log(object.a[0].b.c);
     * // => 4
     *
     * _.set(object, 'x[0].y.z', 5);
     * console.log(object.x[0].y.z);
     * // => 5
     */
    function set(object, path, value) {
      if (object == null) {
        return object;
      }
      var pathKey = (path + '');
      path = (object[pathKey] != null || isKey(path, object)) ? [pathKey] : toPath(path);

      var index = -1,
          length = path.length,
          lastIndex = length - 1,
          nested = object;

      while (nested != null && ++index < length) {
        var key = path[index];
        if (isObject(nested)) {
          if (index == lastIndex) {
            nested[key] = value;
          } else if (nested[key] == null) {
            nested[key] = isIndex(path[index + 1]) ? [] : {};
          }
        }
        nested = nested[key];
      }
      return object;
    }

    /**
     * An alternative to `_.reduce`; this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own enumerable
     * properties through `iteratee`, with each invocation potentially mutating
     * the `accumulator` object. The `iteratee` is bound to `thisArg` and invoked
     * with four arguments: (accumulator, value, key, object). Iteratee functions
     * may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.transform([2, 3, 4], function(result, n) {
     *   result.push(n *= n);
     *   return n % 2 == 0;
     * });
     * // => [4, 9]
     *
     * _.transform({ 'a': 1, 'b': 2 }, function(result, n, key) {
     *   result[key] = n * 3;
     * });
     * // => { 'a': 3, 'b': 6 }
     */
    function transform(object, iteratee, accumulator, thisArg) {
      var isArr = isArray(object) || isTypedArray(object);
      iteratee = getCallback(iteratee, thisArg, 4);

      if (accumulator == null) {
        if (isArr || isObject(object)) {
          var Ctor = object.constructor;
          if (isArr) {
            accumulator = isArray(object) ? new Ctor : [];
          } else {
            accumulator = baseCreate(isFunction(Ctor) ? Ctor.prototype : undefined);
          }
        } else {
          accumulator = {};
        }
      }
      (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
        return iteratee(accumulator, value, index, object);
      });
      return accumulator;
    }

    /**
     * Creates an array of the own enumerable property values of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.values(new Foo);
     * // => [1, 2] (iteration order is not guaranteed)
     *
     * _.values('hi');
     * // => ['h', 'i']
     */
    function values(object) {
      return baseValues(object, keys(object));
    }

    /**
     * Creates an array of the own and inherited enumerable property values
     * of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.valuesIn(new Foo);
     * // => [1, 2, 3] (iteration order is not guaranteed)
     */
    function valuesIn(object) {
      return baseValues(object, keysIn(object));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Checks if `n` is between `start` and up to but not including, `end`. If
     * `end` is not specified it is set to `start` with `start` then set to `0`.
     *
     * @static
     * @memberOf _
     * @category Number
     * @param {number} n The number to check.
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @returns {boolean} Returns `true` if `n` is in the range, else `false`.
     * @example
     *
     * _.inRange(3, 2, 4);
     * // => true
     *
     * _.inRange(4, 8);
     * // => true
     *
     * _.inRange(4, 2);
     * // => false
     *
     * _.inRange(2, 2);
     * // => false
     *
     * _.inRange(1.2, 2);
     * // => true
     *
     * _.inRange(5.2, 4);
     * // => false
     */
    function inRange(value, start, end) {
      start = +start || 0;
      if (end === undefined) {
        end = start;
        start = 0;
      } else {
        end = +end || 0;
      }
      return value >= nativeMin(start, end) && value < nativeMax(start, end);
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number is returned.
     * If `floating` is `true`, or either `min` or `max` are floats, a floating-point
     * number is returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Number
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating] Specify returning a floating-point number.
     * @returns {number} Returns the random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      if (floating && isIterateeCall(min, max, floating)) {
        max = floating = undefined;
      }
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (noMax && typeof min == 'boolean') {
          floating = min;
          min = 1;
        }
        else if (typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
        noMax = false;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand + '').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the camel cased string.
     * @example
     *
     * _.camelCase('Foo Bar');
     * // => 'fooBar'
     *
     * _.camelCase('--foo-bar');
     * // => 'fooBar'
     *
     * _.camelCase('__foo_bar__');
     * // => 'fooBar'
     */
    var camelCase = createCompounder(function(result, word, index) {
      word = word.toLowerCase();
      return result + (index ? (word.charAt(0).toUpperCase() + word.slice(1)) : word);
    });

    /**
     * Capitalizes the first character of `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to capitalize.
     * @returns {string} Returns the capitalized string.
     * @example
     *
     * _.capitalize('fred');
     * // => 'Fred'
     */
    function capitalize(string) {
      string = baseToString(string);
      return string && (string.charAt(0).toUpperCase() + string.slice(1));
    }

    /**
     * Deburrs `string` by converting [latin-1 supplementary letters](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
     * to basic latin letters and removing [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to deburr.
     * @returns {string} Returns the deburred string.
     * @example
     *
     * _.deburr('déjà vu');
     * // => 'deja vu'
     */
    function deburr(string) {
      string = baseToString(string);
      return string && string.replace(reLatin1, deburrLetter).replace(reComboMark, '');
    }

    /**
     * Checks if `string` ends with the given target string.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to search.
     * @param {string} [target] The string to search for.
     * @param {number} [position=string.length] The position to search from.
     * @returns {boolean} Returns `true` if `string` ends with `target`, else `false`.
     * @example
     *
     * _.endsWith('abc', 'c');
     * // => true
     *
     * _.endsWith('abc', 'b');
     * // => false
     *
     * _.endsWith('abc', 'b', 2);
     * // => true
     */
    function endsWith(string, target, position) {
      string = baseToString(string);
      target = (target + '');

      var length = string.length;
      position = position === undefined
        ? length
        : nativeMin(position < 0 ? 0 : (+position || 0), length);

      position -= target.length;
      return position >= 0 && string.indexOf(target, position) == position;
    }

    /**
     * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
     * their corresponding HTML entities.
     *
     * **Note:** No other characters are escaped. To escape additional characters
     * use a third-party library like [_he_](https://mths.be/he).
     *
     * Though the ">" character is escaped for symmetry, characters like
     * ">" and "/" don't need escaping in HTML and have no special meaning
     * unless they're part of a tag or unquoted attribute value.
     * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
     * (under "semi-related fun fact") for more details.
     *
     * Backticks are escaped because in Internet Explorer < 9, they can break out
     * of attribute values or HTML comments. See [#59](https://html5sec.org/#59),
     * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
     * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
     * for more details.
     *
     * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
     * to reduce XSS vectors.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('fred, barney, & pebbles');
     * // => 'fred, barney, &amp; pebbles'
     */
    function escape(string) {
      // Reset `lastIndex` because in IE < 9 `String#replace` does not.
      string = baseToString(string);
      return (string && reHasUnescapedHtml.test(string))
        ? string.replace(reUnescapedHtml, escapeHtmlChar)
        : string;
    }

    /**
     * Escapes the `RegExp` special characters "\", "/", "^", "$", ".", "|", "?",
     * "*", "+", "(", ")", "[", "]", "{" and "}" in `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escapeRegExp('[lodash](https://lodash.com/)');
     * // => '\[lodash\]\(https:\/\/lodash\.com\/\)'
     */
    function escapeRegExp(string) {
      string = baseToString(string);
      return (string && reHasRegExpChars.test(string))
        ? string.replace(reRegExpChars, escapeRegExpChar)
        : (string || '(?:)');
    }

    /**
     * Converts `string` to [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the kebab cased string.
     * @example
     *
     * _.kebabCase('Foo Bar');
     * // => 'foo-bar'
     *
     * _.kebabCase('fooBar');
     * // => 'foo-bar'
     *
     * _.kebabCase('__foo_bar__');
     * // => 'foo-bar'
     */
    var kebabCase = createCompounder(function(result, word, index) {
      return result + (index ? '-' : '') + word.toLowerCase();
    });

    /**
     * Pads `string` on the left and right sides if it's shorter than `length`.
     * Padding characters are truncated if they can't be evenly divided by `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.pad('abc', 8);
     * // => '  abc   '
     *
     * _.pad('abc', 8, '_-');
     * // => '_-abc_-_'
     *
     * _.pad('abc', 3);
     * // => 'abc'
     */
    function pad(string, length, chars) {
      string = baseToString(string);
      length = +length;

      var strLength = string.length;
      if (strLength >= length || !nativeIsFinite(length)) {
        return string;
      }
      var mid = (length - strLength) / 2,
          leftLength = nativeFloor(mid),
          rightLength = nativeCeil(mid);

      chars = createPadding('', rightLength, chars);
      return chars.slice(0, leftLength) + string + chars;
    }

    /**
     * Pads `string` on the left side if it's shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padLeft('abc', 6);
     * // => '   abc'
     *
     * _.padLeft('abc', 6, '_-');
     * // => '_-_abc'
     *
     * _.padLeft('abc', 3);
     * // => 'abc'
     */
    var padLeft = createPadDir();

    /**
     * Pads `string` on the right side if it's shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padRight('abc', 6);
     * // => 'abc   '
     *
     * _.padRight('abc', 6, '_-');
     * // => 'abc_-_'
     *
     * _.padRight('abc', 3);
     * // => 'abc'
     */
    var padRight = createPadDir(true);

    /**
     * Converts `string` to an integer of the specified radix. If `radix` is
     * `undefined` or `0`, a `radix` of `10` is used unless `value` is a hexadecimal,
     * in which case a `radix` of `16` is used.
     *
     * **Note:** This method aligns with the [ES5 implementation](https://es5.github.io/#E)
     * of `parseInt`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} string The string to convert.
     * @param {number} [radix] The radix to interpret `value` by.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     *
     * _.map(['6', '08', '10'], _.parseInt);
     * // => [6, 8, 10]
     */
    function parseInt(string, radix, guard) {
      // Firefox < 21 and Opera < 15 follow ES3 for `parseInt`.
      // Chrome fails to trim leading <BOM> whitespace characters.
      // See https://code.google.com/p/v8/issues/detail?id=3109 for more details.
      if (guard ? isIterateeCall(string, radix, guard) : radix == null) {
        radix = 0;
      } else if (radix) {
        radix = +radix;
      }
      string = trim(string);
      return nativeParseInt(string, radix || (reHasHexPrefix.test(string) ? 16 : 10));
    }

    /**
     * Repeats the given string `n` times.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to repeat.
     * @param {number} [n=0] The number of times to repeat the string.
     * @returns {string} Returns the repeated string.
     * @example
     *
     * _.repeat('*', 3);
     * // => '***'
     *
     * _.repeat('abc', 2);
     * // => 'abcabc'
     *
     * _.repeat('abc', 0);
     * // => ''
     */
    function repeat(string, n) {
      var result = '';
      string = baseToString(string);
      n = +n;
      if (n < 1 || !string || !nativeIsFinite(n)) {
        return result;
      }
      // Leverage the exponentiation by squaring algorithm for a faster repeat.
      // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
      do {
        if (n % 2) {
          result += string;
        }
        n = nativeFloor(n / 2);
        string += string;
      } while (n);

      return result;
    }

    /**
     * Converts `string` to [snake case](https://en.wikipedia.org/wiki/Snake_case).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the snake cased string.
     * @example
     *
     * _.snakeCase('Foo Bar');
     * // => 'foo_bar'
     *
     * _.snakeCase('fooBar');
     * // => 'foo_bar'
     *
     * _.snakeCase('--foo-bar');
     * // => 'foo_bar'
     */
    var snakeCase = createCompounder(function(result, word, index) {
      return result + (index ? '_' : '') + word.toLowerCase();
    });

    /**
     * Converts `string` to [start case](https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the start cased string.
     * @example
     *
     * _.startCase('--foo-bar');
     * // => 'Foo Bar'
     *
     * _.startCase('fooBar');
     * // => 'Foo Bar'
     *
     * _.startCase('__foo_bar__');
     * // => 'Foo Bar'
     */
    var startCase = createCompounder(function(result, word, index) {
      return result + (index ? ' ' : '') + (word.charAt(0).toUpperCase() + word.slice(1));
    });

    /**
     * Checks if `string` starts with the given target string.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to search.
     * @param {string} [target] The string to search for.
     * @param {number} [position=0] The position to search from.
     * @returns {boolean} Returns `true` if `string` starts with `target`, else `false`.
     * @example
     *
     * _.startsWith('abc', 'a');
     * // => true
     *
     * _.startsWith('abc', 'b');
     * // => false
     *
     * _.startsWith('abc', 'b', 1);
     * // => true
     */
    function startsWith(string, target, position) {
      string = baseToString(string);
      position = position == null
        ? 0
        : nativeMin(position < 0 ? 0 : (+position || 0), string.length);

      return string.lastIndexOf(target, position) == position;
    }

    /**
     * Creates a compiled template function that can interpolate data properties
     * in "interpolate" delimiters, HTML-escape interpolated data properties in
     * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
     * properties may be accessed as free variables in the template. If a setting
     * object is provided it takes precedence over `_.templateSettings` values.
     *
     * **Note:** In the development build `_.template` utilizes
     * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
     * for easier debugging.
     *
     * For more information on precompiling templates see
     * [lodash's custom builds documentation](https://lodash.com/custom-builds).
     *
     * For more information on Chrome extension sandboxes see
     * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The template string.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The HTML "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as free variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [options.variable] The data object variable name.
     * @param- {Object} [otherOptions] Enables the legacy `options` param signature.
     * @returns {Function} Returns the compiled template function.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= user %>!');
     * compiled({ 'user': 'fred' });
     * // => 'hello fred!'
     *
     * // using the HTML "escape" delimiter to escape data property values
     * var compiled = _.template('<b><%- value %></b>');
     * compiled({ 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to execute JavaScript and generate HTML
     * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * var compiled = _.template('<% print("hello " + user); %>!');
     * compiled({ 'user': 'barney' });
     * // => 'hello barney!'
     *
     * // using the ES delimiter as an alternative to the default "interpolate" delimiter
     * var compiled = _.template('hello ${ user }!');
     * compiled({ 'user': 'pebbles' });
     * // => 'hello pebbles!'
     *
     * // using custom template delimiters
     * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
     * var compiled = _.template('hello {{ user }}!');
     * compiled({ 'user': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using backslashes to treat delimiters as plain text
     * var compiled = _.template('<%= "\\<%- value %\\>" %>');
     * compiled({ 'value': 'ignored' });
     * // => '<%- value %>'
     *
     * // using the `imports` option to import `jQuery` as `jq`
     * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
     * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     * //   var __t, __p = '';
     * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
     * //   return __p;
     * // }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(string, options, otherOptions) {
      // Based on John Resig's `tmpl` implementation (http://ejohn.org/blog/javascript-micro-templating/)
      // and Laura Doktorova's doT.js (https://github.com/olado/doT).
      var settings = lodash.templateSettings;

      if (otherOptions && isIterateeCall(string, options, otherOptions)) {
        options = otherOptions = undefined;
      }
      string = baseToString(string);
      options = assignWith(baseAssign({}, otherOptions || options), settings, assignOwnDefaults);

      var imports = assignWith(baseAssign({}, options.imports), settings.imports, assignOwnDefaults),
          importsKeys = keys(imports),
          importsValues = baseValues(imports, importsKeys);

      var isEscaping,
          isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // Compile the regexp to match each delimiter.
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      // Use a sourceURL for easier debugging.
      var sourceURL = '//# sourceURL=' +
        ('sourceURL' in options
          ? options.sourceURL
          : ('lodash.templateSources[' + (++templateCounter) + ']')
        ) + '\n';

      string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // Escape characters that can't be included in string literals.
        source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // Replace delimiters with snippets.
        if (escapeValue) {
          isEscaping = true;
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // The JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value.
        return match;
      });

      source += "';\n";

      // If `variable` is not specified wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain.
      var variable = options.variable;
      if (!variable) {
        source = 'with (obj) {\n' + source + '\n}\n';
      }
      // Cleanup code by stripping empty strings.
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // Frame code as the function body.
      source = 'function(' + (variable || 'obj') + ') {\n' +
        (variable
          ? ''
          : 'obj || (obj = {});\n'
        ) +
        "var __t, __p = ''" +
        (isEscaping
           ? ', __e = _.escape'
           : ''
        ) +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      var result = attempt(function() {
        return Function(importsKeys, sourceURL + 'return ' + source).apply(undefined, importsValues);
      });

      // Provide the compiled function's source by its `toString` method or
      // the `source` property as a convenience for inlining compiled templates.
      result.source = source;
      if (isError(result)) {
        throw result;
      }
      return result;
    }

    /**
     * Removes leading and trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trim('  abc  ');
     * // => 'abc'
     *
     * _.trim('-_-abc-_-', '_-');
     * // => 'abc'
     *
     * _.map(['  foo  ', '  bar  '], _.trim);
     * // => ['foo', 'bar']
     */
    function trim(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);
      }
      chars = (chars + '');
      return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);
    }

    /**
     * Removes leading whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimLeft('  abc  ');
     * // => 'abc  '
     *
     * _.trimLeft('-_-abc-_-', '_-');
     * // => 'abc-_-'
     */
    function trimLeft(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(trimmedLeftIndex(string));
      }
      return string.slice(charsLeftIndex(string, (chars + '')));
    }

    /**
     * Removes trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimRight('  abc  ');
     * // => '  abc'
     *
     * _.trimRight('-_-abc-_-', '_-');
     * // => '-_-abc'
     */
    function trimRight(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(0, trimmedRightIndex(string) + 1);
      }
      return string.slice(0, charsRightIndex(string, (chars + '')) + 1);
    }

    /**
     * Truncates `string` if it's longer than the given maximum string length.
     * The last characters of the truncated string are replaced with the omission
     * string which defaults to "...".
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to truncate.
     * @param {Object|number} [options] The options object or maximum string length.
     * @param {number} [options.length=30] The maximum string length.
     * @param {string} [options.omission='...'] The string to indicate text is omitted.
     * @param {RegExp|string} [options.separator] The separator pattern to truncate to.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the truncated string.
     * @example
     *
     * _.trunc('hi-diddly-ho there, neighborino');
     * // => 'hi-diddly-ho there, neighbo...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', 24);
     * // => 'hi-diddly-ho there, n...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': ' '
     * });
     * // => 'hi-diddly-ho there,...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': /,? +/
     * });
     * // => 'hi-diddly-ho there...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'omission': ' [...]'
     * });
     * // => 'hi-diddly-ho there, neig [...]'
     */
    function trunc(string, options, guard) {
      if (guard && isIterateeCall(string, options, guard)) {
        options = undefined;
      }
      var length = DEFAULT_TRUNC_LENGTH,
          omission = DEFAULT_TRUNC_OMISSION;

      if (options != null) {
        if (isObject(options)) {
          var separator = 'separator' in options ? options.separator : separator;
          length = 'length' in options ? (+options.length || 0) : length;
          omission = 'omission' in options ? baseToString(options.omission) : omission;
        } else {
          length = +options || 0;
        }
      }
      string = baseToString(string);
      if (length >= string.length) {
        return string;
      }
      var end = length - omission.length;
      if (end < 1) {
        return omission;
      }
      var result = string.slice(0, end);
      if (separator == null) {
        return result + omission;
      }
      if (isRegExp(separator)) {
        if (string.slice(end).search(separator)) {
          var match,
              newEnd,
              substring = string.slice(0, end);

          if (!separator.global) {
            separator = RegExp(separator.source, (reFlags.exec(separator) || '') + 'g');
          }
          separator.lastIndex = 0;
          while ((match = separator.exec(substring))) {
            newEnd = match.index;
          }
          result = result.slice(0, newEnd == null ? end : newEnd);
        }
      } else if (string.indexOf(separator, end) != end) {
        var index = result.lastIndexOf(separator);
        if (index > -1) {
          result = result.slice(0, index);
        }
      }
      return result + omission;
    }

    /**
     * The inverse of `_.escape`; this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, and `&#96;` in `string` to their
     * corresponding characters.
     *
     * **Note:** No other HTML entities are unescaped. To unescape additional HTML
     * entities use a third-party library like [_he_](https://mths.be/he).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('fred, barney, &amp; pebbles');
     * // => 'fred, barney, & pebbles'
     */
    function unescape(string) {
      string = baseToString(string);
      return (string && reHasEscapedHtml.test(string))
        ? string.replace(reEscapedHtml, unescapeHtmlChar)
        : string;
    }

    /**
     * Splits `string` into an array of its words.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to inspect.
     * @param {RegExp|string} [pattern] The pattern to match words.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the words of `string`.
     * @example
     *
     * _.words('fred, barney, & pebbles');
     * // => ['fred', 'barney', 'pebbles']
     *
     * _.words('fred, barney, & pebbles', /[^, ]+/g);
     * // => ['fred', 'barney', '&', 'pebbles']
     */
    function words(string, pattern, guard) {
      if (guard && isIterateeCall(string, pattern, guard)) {
        pattern = undefined;
      }
      string = baseToString(string);
      return string.match(pattern || reWords) || [];
    }

    /*------------------------------------------------------------------------*/

    /**
     * Attempts to invoke `func`, returning either the result or the caught error
     * object. Any additional arguments are provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Function} func The function to attempt.
     * @returns {*} Returns the `func` result or error object.
     * @example
     *
     * // avoid throwing errors for invalid selectors
     * var elements = _.attempt(function(selector) {
     *   return document.querySelectorAll(selector);
     * }, '>_>');
     *
     * if (_.isError(elements)) {
     *   elements = [];
     * }
     */
    var attempt = restParam(function(func, args) {
      try {
        return func.apply(undefined, args);
      } catch(e) {
        return isError(e) ? e : new Error(e);
      }
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and arguments of the created function. If `func` is a property name the
     * created callback returns the property value for a given element. If `func`
     * is an object the created callback returns `true` for elements that contain
     * the equivalent object properties, otherwise it returns `false`.
     *
     * @static
     * @memberOf _
     * @alias iteratee
     * @category Utility
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the callback.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.callback = _.wrap(_.callback, function(callback, func, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(func);
     *   if (!match) {
     *     return callback(func, thisArg);
     *   }
     *   return function(object) {
     *     return match[2] == 'gt'
     *       ? object[match[1]] > match[3]
     *       : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(users, 'age__gt36');
     * // => [{ 'user': 'fred', 'age': 40 }]
     */
    function callback(func, thisArg, guard) {
      if (guard && isIterateeCall(func, thisArg, guard)) {
        thisArg = undefined;
      }
      return isObjectLike(func)
        ? matches(func)
        : baseCallback(func, thisArg);
    }

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var getter = _.constant(object);
     *
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Creates a function that performs a deep comparison between a given object
     * and `source`, returning `true` if the given object has equivalent property
     * values, else `false`.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.filter(users, _.matches({ 'age': 40, 'active': false }));
     * // => [{ 'user': 'fred', 'age': 40, 'active': false }]
     */
    function matches(source) {
      return baseMatches(baseClone(source, true));
    }

    /**
     * Creates a function that compares the property value of `path` on a given
     * object to `value`.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * _.find(users, _.matchesProperty('user', 'fred'));
     * // => { 'user': 'fred' }
     */
    function matchesProperty(path, srcValue) {
      return baseMatchesProperty(path, baseClone(srcValue, true));
    }

    /**
     * Creates a function that invokes the method at `path` on a given object.
     * Any additional arguments are provided to the invoked method.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the method to invoke.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': _.constant(2) } } },
     *   { 'a': { 'b': { 'c': _.constant(1) } } }
     * ];
     *
     * _.map(objects, _.method('a.b.c'));
     * // => [2, 1]
     *
     * _.invoke(_.sortBy(objects, _.method(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    var method = restParam(function(path, args) {
      return function(object) {
        return invokePath(object, path, args);
      };
    });

    /**
     * The opposite of `_.method`; this method creates a function that invokes
     * the method at a given path on `object`. Any additional arguments are
     * provided to the invoked method.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} object The object to query.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var array = _.times(3, _.constant),
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.methodOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.methodOf(object));
     * // => [2, 0]
     */
    var methodOf = restParam(function(object, args) {
      return function(path) {
        return invokePath(object, path, args);
      };
    });

    /**
     * Adds all own enumerable function properties of a source object to the
     * destination object. If `object` is a function then methods are added to
     * its prototype as well.
     *
     * **Note:** Use `_.runInContext` to create a pristine `lodash` function to
     * avoid conflicts caused by modifying the original.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Function|Object} [object=lodash] The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added
     *  are chainable.
     * @returns {Function|Object} Returns `object`.
     * @example
     *
     * function vowels(string) {
     *   return _.filter(string, function(v) {
     *     return /[aeiou]/i.test(v);
     *   });
     * }
     *
     * _.mixin({ 'vowels': vowels });
     * _.vowels('fred');
     * // => ['e']
     *
     * _('fred').vowels().value();
     * // => ['e']
     *
     * _.mixin({ 'vowels': vowels }, { 'chain': false });
     * _('fred').vowels();
     * // => ['e']
     */
    function mixin(object, source, options) {
      if (options == null) {
        var isObj = isObject(source),
            props = isObj ? keys(source) : undefined,
            methodNames = (props && props.length) ? baseFunctions(source, props) : undefined;

        if (!(methodNames ? methodNames.length : isObj)) {
          methodNames = false;
          options = source;
          source = object;
          object = this;
        }
      }
      if (!methodNames) {
        methodNames = baseFunctions(source, keys(source));
      }
      var chain = true,
          index = -1,
          isFunc = isFunction(object),
          length = methodNames.length;

      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      while (++index < length) {
        var methodName = methodNames[index],
            func = source[methodName];

        object[methodName] = func;
        if (isFunc) {
          object.prototype[methodName] = (function(func) {
            return function() {
              var chainAll = this.__chain__;
              if (chain || chainAll) {
                var result = object(this.__wrapped__),
                    actions = result.__actions__ = arrayCopy(this.__actions__);

                actions.push({ 'func': func, 'args': arguments, 'thisArg': object });
                result.__chain__ = chainAll;
                return result;
              }
              return func.apply(object, arrayPush([this.value()], arguments));
            };
          }(func));
        }
      }
      return object;
    }

    /**
     * Reverts the `_` variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      root._ = oldDash;
      return this;
    }

    /**
     * A no-operation function that returns `undefined` regardless of the
     * arguments it receives.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // No operation performed.
    }

    /**
     * Creates a function that returns the property value at `path` on a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': 2 } } },
     *   { 'a': { 'b': { 'c': 1 } } }
     * ];
     *
     * _.map(objects, _.property('a.b.c'));
     * // => [2, 1]
     *
     * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    function property(path) {
      return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
    }

    /**
     * The opposite of `_.property`; this method creates a function that returns
     * the property value at a given path on `object`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} object The object to query.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var array = [0, 1, 2],
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.propertyOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.propertyOf(object));
     * // => [2, 0]
     */
    function propertyOf(object) {
      return function(path) {
        return baseGet(object, toPath(path), path + '');
      };
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to, but not including, `end`. If `end` is not specified it is
     * set to `start` with `start` then set to `0`. If `end` is less than `start`
     * a zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns the new array of numbers.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      if (step && isIterateeCall(start, end, step)) {
        end = step = undefined;
      }
      start = +start || 0;
      step = step == null ? 1 : (+step || 0);

      if (end == null) {
        end = start;
        start = 0;
      } else {
        end = +end || 0;
      }
      // Use `Array(length)` so engines like Chakra and V8 avoid slower modes.
      // See https://youtu.be/XAqIpGU8ZZk#t=17m25s for more details.
      var index = -1,
          length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Invokes the iteratee function `n` times, returning an array of the results
     * of each invocation. The `iteratee` is bound to `thisArg` and invoked with
     * one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6, false));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) {
     *   mage.castSpell(n);
     * });
     * // => invokes `mage.castSpell(n)` three times with `n` of `0`, `1`, and `2`
     *
     * _.times(3, function(n) {
     *   this.cast(n);
     * }, mage);
     * // => also invokes `mage.castSpell(n)` three times
     */
    function times(n, iteratee, thisArg) {
      n = nativeFloor(n);

      // Exit early to avoid a JSC JIT bug in Safari 8
      // where `Array(0)` is treated as `Array(1)`.
      if (n < 1 || !nativeIsFinite(n)) {
        return [];
      }
      var index = -1,
          result = Array(nativeMin(n, MAX_ARRAY_LENGTH));

      iteratee = bindCallback(iteratee, thisArg, 1);
      while (++index < n) {
        if (index < MAX_ARRAY_LENGTH) {
          result[index] = iteratee(index);
        } else {
          iteratee(index);
        }
      }
      return result;
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID is appended to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return baseToString(prefix) + id;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Adds two numbers.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} augend The first number to add.
     * @param {number} addend The second number to add.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.add(6, 4);
     * // => 10
     */
    function add(augend, addend) {
      return (+augend || 0) + (+addend || 0);
    }

    /**
     * Calculates `n` rounded up to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round up.
     * @param {number} [precision=0] The precision to round up to.
     * @returns {number} Returns the rounded up number.
     * @example
     *
     * _.ceil(4.006);
     * // => 5
     *
     * _.ceil(6.004, 2);
     * // => 6.01
     *
     * _.ceil(6040, -2);
     * // => 6100
     */
    var ceil = createRound('ceil');

    /**
     * Calculates `n` rounded down to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round down.
     * @param {number} [precision=0] The precision to round down to.
     * @returns {number} Returns the rounded down number.
     * @example
     *
     * _.floor(4.006);
     * // => 4
     *
     * _.floor(0.046, 2);
     * // => 0.04
     *
     * _.floor(4060, -2);
     * // => 4000
     */
    var floor = createRound('floor');

    /**
     * Gets the maximum value of `collection`. If `collection` is empty or falsey
     * `-Infinity` is returned. If an iteratee function is provided it is invoked
     * for each value in `collection` to generate the criterion by which the value
     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * _.max([]);
     * // => -Infinity
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.max(users, function(chr) {
     *   return chr.age;
     * });
     * // => { 'user': 'fred', 'age': 40 }
     *
     * // using the `_.property` callback shorthand
     * _.max(users, 'age');
     * // => { 'user': 'fred', 'age': 40 }
     */
    var max = createExtremum(gt, NEGATIVE_INFINITY);

    /**
     * Gets the minimum value of `collection`. If `collection` is empty or falsey
     * `Infinity` is returned. If an iteratee function is provided it is invoked
     * for each value in `collection` to generate the criterion by which the value
     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * _.min([]);
     * // => Infinity
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.min(users, function(chr) {
     *   return chr.age;
     * });
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // using the `_.property` callback shorthand
     * _.min(users, 'age');
     * // => { 'user': 'barney', 'age': 36 }
     */
    var min = createExtremum(lt, POSITIVE_INFINITY);

    /**
     * Calculates `n` rounded to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round.
     * @param {number} [precision=0] The precision to round to.
     * @returns {number} Returns the rounded number.
     * @example
     *
     * _.round(4.006);
     * // => 4
     *
     * _.round(4.006, 2);
     * // => 4.01
     *
     * _.round(4060, -2);
     * // => 4100
     */
    var round = createRound('round');

    /**
     * Gets the sum of the values in `collection`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.sum([4, 6]);
     * // => 10
     *
     * _.sum({ 'a': 4, 'b': 6 });
     * // => 10
     *
     * var objects = [
     *   { 'n': 4 },
     *   { 'n': 6 }
     * ];
     *
     * _.sum(objects, function(object) {
     *   return object.n;
     * });
     * // => 10
     *
     * // using the `_.property` callback shorthand
     * _.sum(objects, 'n');
     * // => 10
     */
    function sum(collection, iteratee, thisArg) {
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
        iteratee = undefined;
      }
      iteratee = getCallback(iteratee, thisArg, 3);
      return iteratee.length == 1
        ? arraySum(isArray(collection) ? collection : toIterable(collection), iteratee)
        : baseSum(collection, iteratee);
    }

    /*------------------------------------------------------------------------*/

    // Ensure wrappers are instances of `baseLodash`.
    lodash.prototype = baseLodash.prototype;

    LodashWrapper.prototype = baseCreate(baseLodash.prototype);
    LodashWrapper.prototype.constructor = LodashWrapper;

    LazyWrapper.prototype = baseCreate(baseLodash.prototype);
    LazyWrapper.prototype.constructor = LazyWrapper;

    // Add functions to the `Map` cache.
    MapCache.prototype['delete'] = mapDelete;
    MapCache.prototype.get = mapGet;
    MapCache.prototype.has = mapHas;
    MapCache.prototype.set = mapSet;

    // Add functions to the `Set` cache.
    SetCache.prototype.push = cachePush;

    // Assign cache to `_.memoize`.
    memoize.Cache = MapCache;

    // Add functions that return wrapped values when chaining.
    lodash.after = after;
    lodash.ary = ary;
    lodash.assign = assign;
    lodash.at = at;
    lodash.before = before;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.callback = callback;
    lodash.chain = chain;
    lodash.chunk = chunk;
    lodash.compact = compact;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.curry = curry;
    lodash.curryRight = curryRight;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defaultsDeep = defaultsDeep;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.drop = drop;
    lodash.dropRight = dropRight;
    lodash.dropRightWhile = dropRightWhile;
    lodash.dropWhile = dropWhile;
    lodash.fill = fill;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.flattenDeep = flattenDeep;
    lodash.flow = flow;
    lodash.flowRight = flowRight;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.keysIn = keysIn;
    lodash.map = map;
    lodash.mapKeys = mapKeys;
    lodash.mapValues = mapValues;
    lodash.matches = matches;
    lodash.matchesProperty = matchesProperty;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.method = method;
    lodash.methodOf = methodOf;
    lodash.mixin = mixin;
    lodash.modArgs = modArgs;
    lodash.negate = negate;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.partition = partition;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.propertyOf = propertyOf;
    lodash.pull = pull;
    lodash.pullAt = pullAt;
    lodash.range = range;
    lodash.rearg = rearg;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.restParam = restParam;
    lodash.set = set;
    lodash.shuffle = shuffle;
    lodash.slice = slice;
    lodash.sortBy = sortBy;
    lodash.sortByAll = sortByAll;
    lodash.sortByOrder = sortByOrder;
    lodash.spread = spread;
    lodash.take = take;
    lodash.takeRight = takeRight;
    lodash.takeRightWhile = takeRightWhile;
    lodash.takeWhile = takeWhile;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.thru = thru;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.toPlainObject = toPlainObject;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.unzip = unzip;
    lodash.unzipWith = unzipWith;
    lodash.values = values;
    lodash.valuesIn = valuesIn;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;
    lodash.zipWith = zipWith;

    // Add aliases.
    lodash.backflow = flowRight;
    lodash.collect = map;
    lodash.compose = flowRight;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.iteratee = callback;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;

    // Add functions to `lodash.prototype`.
    mixin(lodash, lodash);

    /*------------------------------------------------------------------------*/

    // Add functions that return unwrapped values when chaining.
    lodash.add = add;
    lodash.attempt = attempt;
    lodash.camelCase = camelCase;
    lodash.capitalize = capitalize;
    lodash.ceil = ceil;
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.deburr = deburr;
    lodash.endsWith = endsWith;
    lodash.escape = escape;
    lodash.escapeRegExp = escapeRegExp;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.findWhere = findWhere;
    lodash.first = first;
    lodash.floor = floor;
    lodash.get = get;
    lodash.gt = gt;
    lodash.gte = gte;
    lodash.has = has;
    lodash.identity = identity;
    lodash.includes = includes;
    lodash.indexOf = indexOf;
    lodash.inRange = inRange;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isError = isError;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isMatch = isMatch;
    lodash.isNaN = isNaN;
    lodash.isNative = isNative;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isTypedArray = isTypedArray;
    lodash.isUndefined = isUndefined;
    lodash.kebabCase = kebabCase;
    lodash.last = last;
    lodash.lastIndexOf = lastIndexOf;
    lodash.lt = lt;
    lodash.lte = lte;
    lodash.max = max;
    lodash.min = min;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.pad = pad;
    lodash.padLeft = padLeft;
    lodash.padRight = padRight;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.repeat = repeat;
    lodash.result = result;
    lodash.round = round;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.snakeCase = snakeCase;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.sortedLastIndex = sortedLastIndex;
    lodash.startCase = startCase;
    lodash.startsWith = startsWith;
    lodash.sum = sum;
    lodash.template = template;
    lodash.trim = trim;
    lodash.trimLeft = trimLeft;
    lodash.trimRight = trimRight;
    lodash.trunc = trunc;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;
    lodash.words = words;

    // Add aliases.
    lodash.all = every;
    lodash.any = some;
    lodash.contains = includes;
    lodash.eq = isEqual;
    lodash.detect = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.head = first;
    lodash.include = includes;
    lodash.inject = reduce;

    mixin(lodash, (function() {
      var source = {};
      baseForOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }()), false);

    /*------------------------------------------------------------------------*/

    // Add functions capable of returning wrapped and unwrapped values when chaining.
    lodash.sample = sample;

    lodash.prototype.sample = function(n) {
      if (!this.__chain__ && n == null) {
        return sample(this.value());
      }
      return this.thru(function(value) {
        return sample(value, n);
      });
    };

    /*------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = VERSION;

    // Assign default placeholders.
    arrayEach(['bind', 'bindKey', 'curry', 'curryRight', 'partial', 'partialRight'], function(methodName) {
      lodash[methodName].placeholder = lodash;
    });

    // Add `LazyWrapper` methods for `_.drop` and `_.take` variants.
    arrayEach(['drop', 'take'], function(methodName, index) {
      LazyWrapper.prototype[methodName] = function(n) {
        var filtered = this.__filtered__;
        if (filtered && !index) {
          return new LazyWrapper(this);
        }
        n = n == null ? 1 : nativeMax(nativeFloor(n) || 0, 0);

        var result = this.clone();
        if (filtered) {
          result.__takeCount__ = nativeMin(result.__takeCount__, n);
        } else {
          result.__views__.push({ 'size': n, 'type': methodName + (result.__dir__ < 0 ? 'Right' : '') });
        }
        return result;
      };

      LazyWrapper.prototype[methodName + 'Right'] = function(n) {
        return this.reverse()[methodName](n).reverse();
      };
    });

    // Add `LazyWrapper` methods that accept an `iteratee` value.
    arrayEach(['filter', 'map', 'takeWhile'], function(methodName, index) {
      var type = index + 1,
          isFilter = type != LAZY_MAP_FLAG;

      LazyWrapper.prototype[methodName] = function(iteratee, thisArg) {
        var result = this.clone();
        result.__iteratees__.push({ 'iteratee': getCallback(iteratee, thisArg, 1), 'type': type });
        result.__filtered__ = result.__filtered__ || isFilter;
        return result;
      };
    });

    // Add `LazyWrapper` methods for `_.first` and `_.last`.
    arrayEach(['first', 'last'], function(methodName, index) {
      var takeName = 'take' + (index ? 'Right' : '');

      LazyWrapper.prototype[methodName] = function() {
        return this[takeName](1).value()[0];
      };
    });

    // Add `LazyWrapper` methods for `_.initial` and `_.rest`.
    arrayEach(['initial', 'rest'], function(methodName, index) {
      var dropName = 'drop' + (index ? '' : 'Right');

      LazyWrapper.prototype[methodName] = function() {
        return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
      };
    });

    // Add `LazyWrapper` methods for `_.pluck` and `_.where`.
    arrayEach(['pluck', 'where'], function(methodName, index) {
      var operationName = index ? 'filter' : 'map',
          createCallback = index ? baseMatches : property;

      LazyWrapper.prototype[methodName] = function(value) {
        return this[operationName](createCallback(value));
      };
    });

    LazyWrapper.prototype.compact = function() {
      return this.filter(identity);
    };

    LazyWrapper.prototype.reject = function(predicate, thisArg) {
      predicate = getCallback(predicate, thisArg, 1);
      return this.filter(function(value) {
        return !predicate(value);
      });
    };

    LazyWrapper.prototype.slice = function(start, end) {
      start = start == null ? 0 : (+start || 0);

      var result = this;
      if (result.__filtered__ && (start > 0 || end < 0)) {
        return new LazyWrapper(result);
      }
      if (start < 0) {
        result = result.takeRight(-start);
      } else if (start) {
        result = result.drop(start);
      }
      if (end !== undefined) {
        end = (+end || 0);
        result = end < 0 ? result.dropRight(-end) : result.take(end - start);
      }
      return result;
    };

    LazyWrapper.prototype.takeRightWhile = function(predicate, thisArg) {
      return this.reverse().takeWhile(predicate, thisArg).reverse();
    };

    LazyWrapper.prototype.toArray = function() {
      return this.take(POSITIVE_INFINITY);
    };

    // Add `LazyWrapper` methods to `lodash.prototype`.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var checkIteratee = /^(?:filter|map|reject)|While$/.test(methodName),
          retUnwrapped = /^(?:first|last)$/.test(methodName),
          lodashFunc = lodash[retUnwrapped ? ('take' + (methodName == 'last' ? 'Right' : '')) : methodName];

      if (!lodashFunc) {
        return;
      }
      lodash.prototype[methodName] = function() {
        var args = retUnwrapped ? [1] : arguments,
            chainAll = this.__chain__,
            value = this.__wrapped__,
            isHybrid = !!this.__actions__.length,
            isLazy = value instanceof LazyWrapper,
            iteratee = args[0],
            useLazy = isLazy || isArray(value);

        if (useLazy && checkIteratee && typeof iteratee == 'function' && iteratee.length != 1) {
          // Avoid lazy use if the iteratee has a "length" value other than `1`.
          isLazy = useLazy = false;
        }
        var interceptor = function(value) {
          return (retUnwrapped && chainAll)
            ? lodashFunc(value, 1)[0]
            : lodashFunc.apply(undefined, arrayPush([value], args));
        };

        var action = { 'func': thru, 'args': [interceptor], 'thisArg': undefined },
            onlyLazy = isLazy && !isHybrid;

        if (retUnwrapped && !chainAll) {
          if (onlyLazy) {
            value = value.clone();
            value.__actions__.push(action);
            return func.call(value);
          }
          return lodashFunc.call(undefined, this.value())[0];
        }
        if (!retUnwrapped && useLazy) {
          value = onlyLazy ? value : new LazyWrapper(this);
          var result = func.apply(value, args);
          result.__actions__.push(action);
          return new LodashWrapper(result, chainAll);
        }
        return this.thru(interceptor);
      };
    });

    // Add `Array` and `String` methods to `lodash.prototype`.
    arrayEach(['join', 'pop', 'push', 'replace', 'shift', 'sort', 'splice', 'split', 'unshift'], function(methodName) {
      var func = (/^(?:replace|split)$/.test(methodName) ? stringProto : arrayProto)[methodName],
          chainName = /^(?:push|sort|unshift)$/.test(methodName) ? 'tap' : 'thru',
          retUnwrapped = /^(?:join|pop|replace|shift)$/.test(methodName);

      lodash.prototype[methodName] = function() {
        var args = arguments;
        if (retUnwrapped && !this.__chain__) {
          return func.apply(this.value(), args);
        }
        return this[chainName](function(value) {
          return func.apply(value, args);
        });
      };
    });

    // Map minified function names to their real names.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var lodashFunc = lodash[methodName];
      if (lodashFunc) {
        var key = lodashFunc.name,
            names = realNames[key] || (realNames[key] = []);

        names.push({ 'name': methodName, 'func': lodashFunc });
      }
    });

    realNames[createHybridWrapper(undefined, BIND_KEY_FLAG).name] = [{ 'name': 'wrapper', 'func': undefined }];

    // Add functions to the lazy wrapper.
    LazyWrapper.prototype.clone = lazyClone;
    LazyWrapper.prototype.reverse = lazyReverse;
    LazyWrapper.prototype.value = lazyValue;

    // Add chaining functions to the `lodash` wrapper.
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.commit = wrapperCommit;
    lodash.prototype.concat = wrapperConcat;
    lodash.prototype.plant = wrapperPlant;
    lodash.prototype.reverse = wrapperReverse;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.run = lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;

    // Add function aliases to the `lodash` wrapper.
    lodash.prototype.collect = lodash.prototype.map;
    lodash.prototype.head = lodash.prototype.first;
    lodash.prototype.select = lodash.prototype.filter;
    lodash.prototype.tail = lodash.prototype.rest;

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // Export lodash.
  var _ = runInContext();

  // Some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose lodash to the global object when an AMD loader is present to avoid
    // errors in cases where lodash is loaded by a script tag and not intended
    // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
    // more details.
    root._ = _;

    // Define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module.
    define(function() {
      return _;
    });
  }
  // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
  else if (freeExports && freeModule) {
    // Export for Node.js or RingoJS.
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // Export for Rhino with CommonJS support.
    else {
      freeExports._ = _;
    }
  }
  else {
    // Export for a browser or Rhino.
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"meta":[function(require,module,exports){
(function() {
  module.exports = {
    isApplet: false,
    isWeb: true,
    version: "0.1"
  };

}).call(this);

},{}],"mori":[function(require,module,exports){
(function(definition){if(typeof exports==="object"){module.exports=definition();}else if(typeof define==="function"&&define.amd){define(definition);}else{mori=definition();}})(function(){return function(){
if(typeof Math.imul == "undefined" || (Math.imul(0xffffffff,5) == 0)) {
    Math.imul = function (a, b) {
        var ah  = (a >>> 16) & 0xffff;
        var al = a & 0xffff;
        var bh  = (b >>> 16) & 0xffff;
        var bl = b & 0xffff;
        // the shift by 0 fixes the sign on the high part
        // the final |0 converts the unsigned value into a signed value
        return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
    }
}

var k,aa=this;
function n(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";else if("function"==
b&&"undefined"==typeof a.call)return"object";return b}var ba="closure_uid_"+(1E9*Math.random()>>>0),ca=0;function r(a,b){var c=a.split("."),d=aa;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)c.length||void 0===b?d=d[e]?d[e]:d[e]={}:d[e]=b};function da(a){return Array.prototype.join.call(arguments,"")};function ea(a,b){for(var c in a)b.call(void 0,a[c],c,a)};function fa(a,b){null!=a&&this.append.apply(this,arguments)}fa.prototype.Za="";fa.prototype.append=function(a,b,c){this.Za+=a;if(null!=b)for(var d=1;d<arguments.length;d++)this.Za+=arguments[d];return this};fa.prototype.clear=function(){this.Za=""};fa.prototype.toString=function(){return this.Za};function ga(a,b){a.sort(b||ha)}function ia(a,b){for(var c=0;c<a.length;c++)a[c]={index:c,value:a[c]};var d=b||ha;ga(a,function(a,b){return d(a.value,b.value)||a.index-b.index});for(c=0;c<a.length;c++)a[c]=a[c].value}function ha(a,b){return a>b?1:a<b?-1:0};var ja;if("undefined"===typeof ka)var ka=function(){throw Error("No *print-fn* fn set for evaluation environment");};var la=null,ma=null;if("undefined"===typeof na)var na=null;function oa(){return new pa(null,5,[sa,!0,ua,!0,wa,!1,ya,!1,za,la],null)}function t(a){return null!=a&&!1!==a}function Aa(a){return t(a)?!1:!0}function w(a,b){return a[n(null==b?null:b)]?!0:a._?!0:!1}function Ba(a){return null==a?null:a.constructor}
function x(a,b){var c=Ba(b),c=t(t(c)?c.Yb:c)?c.Xb:n(b);return Error(["No protocol method ",a," defined for type ",c,": ",b].join(""))}function Da(a){var b=a.Xb;return t(b)?b:""+z(a)}var Ea="undefined"!==typeof Symbol&&"function"===n(Symbol)?Symbol.Cc:"@@iterator";function Fa(a){for(var b=a.length,c=Array(b),d=0;;)if(d<b)c[d]=a[d],d+=1;else break;return c}function Ha(a){for(var b=Array(arguments.length),c=0;;)if(c<b.length)b[c]=arguments[c],c+=1;else return b}
var Ia=function(){function a(a,b){function c(a,b){a.push(b);return a}var g=[];return A.c?A.c(c,g,b):A.call(null,c,g,b)}function b(a){return c.a(null,a)}var c=null,c=function(d,c){switch(arguments.length){case 1:return b.call(this,d);case 2:return a.call(this,0,c)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Ja={},La={};function Ma(a){if(a?a.L:a)return a.L(a);var b;b=Ma[n(null==a?null:a)];if(!b&&(b=Ma._,!b))throw x("ICounted.-count",a);return b.call(null,a)}
function Na(a){if(a?a.J:a)return a.J(a);var b;b=Na[n(null==a?null:a)];if(!b&&(b=Na._,!b))throw x("IEmptyableCollection.-empty",a);return b.call(null,a)}var Qa={};function Ra(a,b){if(a?a.G:a)return a.G(a,b);var c;c=Ra[n(null==a?null:a)];if(!c&&(c=Ra._,!c))throw x("ICollection.-conj",a);return c.call(null,a,b)}
var Ta={},C=function(){function a(a,b,c){if(a?a.$:a)return a.$(a,b,c);var g;g=C[n(null==a?null:a)];if(!g&&(g=C._,!g))throw x("IIndexed.-nth",a);return g.call(null,a,b,c)}function b(a,b){if(a?a.Q:a)return a.Q(a,b);var c;c=C[n(null==a?null:a)];if(!c&&(c=C._,!c))throw x("IIndexed.-nth",a);return c.call(null,a,b)}var c=null,c=function(d,c,f){switch(arguments.length){case 2:return b.call(this,d,c);case 3:return a.call(this,d,c,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),
Ua={};function Va(a){if(a?a.N:a)return a.N(a);var b;b=Va[n(null==a?null:a)];if(!b&&(b=Va._,!b))throw x("ISeq.-first",a);return b.call(null,a)}function Wa(a){if(a?a.S:a)return a.S(a);var b;b=Wa[n(null==a?null:a)];if(!b&&(b=Wa._,!b))throw x("ISeq.-rest",a);return b.call(null,a)}
var Xa={},Za={},$a=function(){function a(a,b,c){if(a?a.s:a)return a.s(a,b,c);var g;g=$a[n(null==a?null:a)];if(!g&&(g=$a._,!g))throw x("ILookup.-lookup",a);return g.call(null,a,b,c)}function b(a,b){if(a?a.t:a)return a.t(a,b);var c;c=$a[n(null==a?null:a)];if(!c&&(c=$a._,!c))throw x("ILookup.-lookup",a);return c.call(null,a,b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=
a;return c}(),ab={};function bb(a,b){if(a?a.rb:a)return a.rb(a,b);var c;c=bb[n(null==a?null:a)];if(!c&&(c=bb._,!c))throw x("IAssociative.-contains-key?",a);return c.call(null,a,b)}function cb(a,b,c){if(a?a.Ka:a)return a.Ka(a,b,c);var d;d=cb[n(null==a?null:a)];if(!d&&(d=cb._,!d))throw x("IAssociative.-assoc",a);return d.call(null,a,b,c)}var db={};function eb(a,b){if(a?a.wb:a)return a.wb(a,b);var c;c=eb[n(null==a?null:a)];if(!c&&(c=eb._,!c))throw x("IMap.-dissoc",a);return c.call(null,a,b)}var fb={};
function hb(a){if(a?a.hb:a)return a.hb(a);var b;b=hb[n(null==a?null:a)];if(!b&&(b=hb._,!b))throw x("IMapEntry.-key",a);return b.call(null,a)}function ib(a){if(a?a.ib:a)return a.ib(a);var b;b=ib[n(null==a?null:a)];if(!b&&(b=ib._,!b))throw x("IMapEntry.-val",a);return b.call(null,a)}var jb={};function kb(a,b){if(a?a.Eb:a)return a.Eb(a,b);var c;c=kb[n(null==a?null:a)];if(!c&&(c=kb._,!c))throw x("ISet.-disjoin",a);return c.call(null,a,b)}
function lb(a){if(a?a.La:a)return a.La(a);var b;b=lb[n(null==a?null:a)];if(!b&&(b=lb._,!b))throw x("IStack.-peek",a);return b.call(null,a)}function mb(a){if(a?a.Ma:a)return a.Ma(a);var b;b=mb[n(null==a?null:a)];if(!b&&(b=mb._,!b))throw x("IStack.-pop",a);return b.call(null,a)}var nb={};function pb(a,b,c){if(a?a.Ua:a)return a.Ua(a,b,c);var d;d=pb[n(null==a?null:a)];if(!d&&(d=pb._,!d))throw x("IVector.-assoc-n",a);return d.call(null,a,b,c)}
function qb(a){if(a?a.Ra:a)return a.Ra(a);var b;b=qb[n(null==a?null:a)];if(!b&&(b=qb._,!b))throw x("IDeref.-deref",a);return b.call(null,a)}var rb={};function sb(a){if(a?a.H:a)return a.H(a);var b;b=sb[n(null==a?null:a)];if(!b&&(b=sb._,!b))throw x("IMeta.-meta",a);return b.call(null,a)}var tb={};function ub(a,b){if(a?a.F:a)return a.F(a,b);var c;c=ub[n(null==a?null:a)];if(!c&&(c=ub._,!c))throw x("IWithMeta.-with-meta",a);return c.call(null,a,b)}
var vb={},wb=function(){function a(a,b,c){if(a?a.O:a)return a.O(a,b,c);var g;g=wb[n(null==a?null:a)];if(!g&&(g=wb._,!g))throw x("IReduce.-reduce",a);return g.call(null,a,b,c)}function b(a,b){if(a?a.R:a)return a.R(a,b);var c;c=wb[n(null==a?null:a)];if(!c&&(c=wb._,!c))throw x("IReduce.-reduce",a);return c.call(null,a,b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();
function xb(a,b,c){if(a?a.gb:a)return a.gb(a,b,c);var d;d=xb[n(null==a?null:a)];if(!d&&(d=xb._,!d))throw x("IKVReduce.-kv-reduce",a);return d.call(null,a,b,c)}function yb(a,b){if(a?a.A:a)return a.A(a,b);var c;c=yb[n(null==a?null:a)];if(!c&&(c=yb._,!c))throw x("IEquiv.-equiv",a);return c.call(null,a,b)}function zb(a){if(a?a.B:a)return a.B(a);var b;b=zb[n(null==a?null:a)];if(!b&&(b=zb._,!b))throw x("IHash.-hash",a);return b.call(null,a)}var Bb={};
function Cb(a){if(a?a.D:a)return a.D(a);var b;b=Cb[n(null==a?null:a)];if(!b&&(b=Cb._,!b))throw x("ISeqable.-seq",a);return b.call(null,a)}var Db={},Eb={},Fb={};function Gb(a){if(a?a.ab:a)return a.ab(a);var b;b=Gb[n(null==a?null:a)];if(!b&&(b=Gb._,!b))throw x("IReversible.-rseq",a);return b.call(null,a)}function Hb(a,b){if(a?a.Hb:a)return a.Hb(a,b);var c;c=Hb[n(null==a?null:a)];if(!c&&(c=Hb._,!c))throw x("ISorted.-sorted-seq",a);return c.call(null,a,b)}
function Ib(a,b,c){if(a?a.Ib:a)return a.Ib(a,b,c);var d;d=Ib[n(null==a?null:a)];if(!d&&(d=Ib._,!d))throw x("ISorted.-sorted-seq-from",a);return d.call(null,a,b,c)}function Jb(a,b){if(a?a.Gb:a)return a.Gb(a,b);var c;c=Jb[n(null==a?null:a)];if(!c&&(c=Jb._,!c))throw x("ISorted.-entry-key",a);return c.call(null,a,b)}function Kb(a){if(a?a.Fb:a)return a.Fb(a);var b;b=Kb[n(null==a?null:a)];if(!b&&(b=Kb._,!b))throw x("ISorted.-comparator",a);return b.call(null,a)}
function Lb(a,b){if(a?a.Wb:a)return a.Wb(0,b);var c;c=Lb[n(null==a?null:a)];if(!c&&(c=Lb._,!c))throw x("IWriter.-write",a);return c.call(null,a,b)}var Mb={};function Nb(a,b,c){if(a?a.v:a)return a.v(a,b,c);var d;d=Nb[n(null==a?null:a)];if(!d&&(d=Nb._,!d))throw x("IPrintWithWriter.-pr-writer",a);return d.call(null,a,b,c)}function Ob(a){if(a?a.$a:a)return a.$a(a);var b;b=Ob[n(null==a?null:a)];if(!b&&(b=Ob._,!b))throw x("IEditableCollection.-as-transient",a);return b.call(null,a)}
function Pb(a,b){if(a?a.Sa:a)return a.Sa(a,b);var c;c=Pb[n(null==a?null:a)];if(!c&&(c=Pb._,!c))throw x("ITransientCollection.-conj!",a);return c.call(null,a,b)}function Qb(a){if(a?a.Ta:a)return a.Ta(a);var b;b=Qb[n(null==a?null:a)];if(!b&&(b=Qb._,!b))throw x("ITransientCollection.-persistent!",a);return b.call(null,a)}function Rb(a,b,c){if(a?a.kb:a)return a.kb(a,b,c);var d;d=Rb[n(null==a?null:a)];if(!d&&(d=Rb._,!d))throw x("ITransientAssociative.-assoc!",a);return d.call(null,a,b,c)}
function Sb(a,b){if(a?a.Jb:a)return a.Jb(a,b);var c;c=Sb[n(null==a?null:a)];if(!c&&(c=Sb._,!c))throw x("ITransientMap.-dissoc!",a);return c.call(null,a,b)}function Tb(a,b,c){if(a?a.Ub:a)return a.Ub(0,b,c);var d;d=Tb[n(null==a?null:a)];if(!d&&(d=Tb._,!d))throw x("ITransientVector.-assoc-n!",a);return d.call(null,a,b,c)}function Ub(a){if(a?a.Vb:a)return a.Vb();var b;b=Ub[n(null==a?null:a)];if(!b&&(b=Ub._,!b))throw x("ITransientVector.-pop!",a);return b.call(null,a)}
function Vb(a,b){if(a?a.Tb:a)return a.Tb(0,b);var c;c=Vb[n(null==a?null:a)];if(!c&&(c=Vb._,!c))throw x("ITransientSet.-disjoin!",a);return c.call(null,a,b)}function Xb(a){if(a?a.Pb:a)return a.Pb();var b;b=Xb[n(null==a?null:a)];if(!b&&(b=Xb._,!b))throw x("IChunk.-drop-first",a);return b.call(null,a)}function Yb(a){if(a?a.Cb:a)return a.Cb(a);var b;b=Yb[n(null==a?null:a)];if(!b&&(b=Yb._,!b))throw x("IChunkedSeq.-chunked-first",a);return b.call(null,a)}
function Zb(a){if(a?a.Db:a)return a.Db(a);var b;b=Zb[n(null==a?null:a)];if(!b&&(b=Zb._,!b))throw x("IChunkedSeq.-chunked-rest",a);return b.call(null,a)}function $b(a){if(a?a.Bb:a)return a.Bb(a);var b;b=$b[n(null==a?null:a)];if(!b&&(b=$b._,!b))throw x("IChunkedNext.-chunked-next",a);return b.call(null,a)}function ac(a,b){if(a?a.bb:a)return a.bb(0,b);var c;c=ac[n(null==a?null:a)];if(!c&&(c=ac._,!c))throw x("IVolatile.-vreset!",a);return c.call(null,a,b)}var bc={};
function cc(a){if(a?a.fb:a)return a.fb(a);var b;b=cc[n(null==a?null:a)];if(!b&&(b=cc._,!b))throw x("IIterable.-iterator",a);return b.call(null,a)}function dc(a){this.qc=a;this.q=0;this.j=1073741824}dc.prototype.Wb=function(a,b){return this.qc.append(b)};function ec(a){var b=new fa;a.v(null,new dc(b),oa());return""+z(b)}
var fc="undefined"!==typeof Math.imul&&0!==(Math.imul.a?Math.imul.a(4294967295,5):Math.imul.call(null,4294967295,5))?function(a,b){return Math.imul.a?Math.imul.a(a,b):Math.imul.call(null,a,b)}:function(a,b){var c=a&65535,d=b&65535;return c*d+((a>>>16&65535)*d+c*(b>>>16&65535)<<16>>>0)|0};function gc(a){a=fc(a,3432918353);return fc(a<<15|a>>>-15,461845907)}function hc(a,b){var c=a^b;return fc(c<<13|c>>>-13,5)+3864292196}
function ic(a,b){var c=a^b,c=fc(c^c>>>16,2246822507),c=fc(c^c>>>13,3266489909);return c^c>>>16}var kc={},lc=0;function mc(a){255<lc&&(kc={},lc=0);var b=kc[a];if("number"!==typeof b){a:if(null!=a)if(b=a.length,0<b){for(var c=0,d=0;;)if(c<b)var e=c+1,d=fc(31,d)+a.charCodeAt(c),c=e;else{b=d;break a}b=void 0}else b=0;else b=0;kc[a]=b;lc+=1}return a=b}
function nc(a){a&&(a.j&4194304||a.vc)?a=a.B(null):"number"===typeof a?a=(Math.floor.b?Math.floor.b(a):Math.floor.call(null,a))%2147483647:!0===a?a=1:!1===a?a=0:"string"===typeof a?(a=mc(a),0!==a&&(a=gc(a),a=hc(0,a),a=ic(a,4))):a=a instanceof Date?a.valueOf():null==a?0:zb(a);return a}
function oc(a){var b;b=a.name;var c;a:{c=1;for(var d=0;;)if(c<b.length){var e=c+2,d=hc(d,gc(b.charCodeAt(c-1)|b.charCodeAt(c)<<16));c=e}else{c=d;break a}c=void 0}c=1===(b.length&1)?c^gc(b.charCodeAt(b.length-1)):c;b=ic(c,fc(2,b.length));a=mc(a.ba);return b^a+2654435769+(b<<6)+(b>>2)}function pc(a,b){if(a.ta===b.ta)return 0;var c=Aa(a.ba);if(t(c?b.ba:c))return-1;if(t(a.ba)){if(Aa(b.ba))return 1;c=ha(a.ba,b.ba);return 0===c?ha(a.name,b.name):c}return ha(a.name,b.name)}
function qc(a,b,c,d,e){this.ba=a;this.name=b;this.ta=c;this.Ya=d;this.Z=e;this.j=2154168321;this.q=4096}k=qc.prototype;k.v=function(a,b){return Lb(b,this.ta)};k.B=function(){var a=this.Ya;return null!=a?a:this.Ya=a=oc(this)};k.F=function(a,b){return new qc(this.ba,this.name,this.ta,this.Ya,b)};k.H=function(){return this.Z};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return $a.c(c,this,null);case 3:return $a.c(c,this,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return $a.c(c,this,null)};a.c=function(a,c,d){return $a.c(c,this,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return $a.c(a,this,null)};k.a=function(a,b){return $a.c(a,this,b)};k.A=function(a,b){return b instanceof qc?this.ta===b.ta:!1};
k.toString=function(){return this.ta};var rc=function(){function a(a,b){var c=null!=a?[z(a),z("/"),z(b)].join(""):b;return new qc(a,b,c,null,null)}function b(a){return a instanceof qc?a:c.a(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();
function D(a){if(null==a)return null;if(a&&(a.j&8388608||a.mc))return a.D(null);if(a instanceof Array||"string"===typeof a)return 0===a.length?null:new F(a,0);if(w(Bb,a))return Cb(a);throw Error([z(a),z(" is not ISeqable")].join(""));}function G(a){if(null==a)return null;if(a&&(a.j&64||a.jb))return a.N(null);a=D(a);return null==a?null:Va(a)}function H(a){return null!=a?a&&(a.j&64||a.jb)?a.S(null):(a=D(a))?Wa(a):J:J}function K(a){return null==a?null:a&&(a.j&128||a.xb)?a.T(null):D(H(a))}
var sc=function(){function a(a,b){return null==a?null==b:a===b||yb(a,b)}var b=null,c=function(){function a(b,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return c.call(this,b,d,l)}function c(a,d,e){for(;;)if(b.a(a,d))if(K(e))a=d,d=G(e),e=K(e);else return b.a(d,G(e));else return!1}a.i=2;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=H(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return!0;
case 2:return a.call(this,b,e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.b=function(){return!0};b.a=a;b.d=c.d;return b}();function tc(a){this.C=a}tc.prototype.next=function(){if(null!=this.C){var a=G(this.C);this.C=K(this.C);return{done:!1,value:a}}return{done:!0,value:null}};function uc(a){return new tc(D(a))}
function vc(a,b){var c=gc(a),c=hc(0,c);return ic(c,b)}function wc(a){var b=0,c=1;for(a=D(a);;)if(null!=a)b+=1,c=fc(31,c)+nc(G(a))|0,a=K(a);else return vc(c,b)}function xc(a){var b=0,c=0;for(a=D(a);;)if(null!=a)b+=1,c=c+nc(G(a))|0,a=K(a);else return vc(c,b)}La["null"]=!0;Ma["null"]=function(){return 0};Date.prototype.A=function(a,b){return b instanceof Date&&this.toString()===b.toString()};yb.number=function(a,b){return a===b};rb["function"]=!0;sb["function"]=function(){return null};
Ja["function"]=!0;zb._=function(a){return a[ba]||(a[ba]=++ca)};function yc(a){this.o=a;this.q=0;this.j=32768}yc.prototype.Ra=function(){return this.o};function Ac(a){return a instanceof yc}function Bc(a){return Ac(a)?L.b?L.b(a):L.call(null,a):a}function L(a){return qb(a)}
var Cc=function(){function a(a,b,c,d){for(var l=Ma(a);;)if(d<l){var m=C.a(a,d);c=b.a?b.a(c,m):b.call(null,c,m);if(Ac(c))return qb(c);d+=1}else return c}function b(a,b,c){var d=Ma(a),l=c;for(c=0;;)if(c<d){var m=C.a(a,c),l=b.a?b.a(l,m):b.call(null,l,m);if(Ac(l))return qb(l);c+=1}else return l}function c(a,b){var c=Ma(a);if(0===c)return b.l?b.l():b.call(null);for(var d=C.a(a,0),l=1;;)if(l<c){var m=C.a(a,l),d=b.a?b.a(d,m):b.call(null,d,m);if(Ac(d))return qb(d);l+=1}else return d}var d=null,d=function(d,
f,g,h){switch(arguments.length){case 2:return c.call(this,d,f);case 3:return b.call(this,d,f,g);case 4:return a.call(this,d,f,g,h)}throw Error("Invalid arity: "+arguments.length);};d.a=c;d.c=b;d.n=a;return d}(),Dc=function(){function a(a,b,c,d){for(var l=a.length;;)if(d<l){var m=a[d];c=b.a?b.a(c,m):b.call(null,c,m);if(Ac(c))return qb(c);d+=1}else return c}function b(a,b,c){var d=a.length,l=c;for(c=0;;)if(c<d){var m=a[c],l=b.a?b.a(l,m):b.call(null,l,m);if(Ac(l))return qb(l);c+=1}else return l}function c(a,
b){var c=a.length;if(0===a.length)return b.l?b.l():b.call(null);for(var d=a[0],l=1;;)if(l<c){var m=a[l],d=b.a?b.a(d,m):b.call(null,d,m);if(Ac(d))return qb(d);l+=1}else return d}var d=null,d=function(d,f,g,h){switch(arguments.length){case 2:return c.call(this,d,f);case 3:return b.call(this,d,f,g);case 4:return a.call(this,d,f,g,h)}throw Error("Invalid arity: "+arguments.length);};d.a=c;d.c=b;d.n=a;return d}();function Ec(a){return a?a.j&2||a.cc?!0:a.j?!1:w(La,a):w(La,a)}
function Fc(a){return a?a.j&16||a.Qb?!0:a.j?!1:w(Ta,a):w(Ta,a)}function Gc(a,b){this.e=a;this.m=b}Gc.prototype.ga=function(){return this.m<this.e.length};Gc.prototype.next=function(){var a=this.e[this.m];this.m+=1;return a};function F(a,b){this.e=a;this.m=b;this.j=166199550;this.q=8192}k=F.prototype;k.toString=function(){return ec(this)};k.Q=function(a,b){var c=b+this.m;return c<this.e.length?this.e[c]:null};k.$=function(a,b,c){a=b+this.m;return a<this.e.length?this.e[a]:c};k.vb=!0;
k.fb=function(){return new Gc(this.e,this.m)};k.T=function(){return this.m+1<this.e.length?new F(this.e,this.m+1):null};k.L=function(){return this.e.length-this.m};k.ab=function(){var a=Ma(this);return 0<a?new Hc(this,a-1,null):null};k.B=function(){return wc(this)};k.A=function(a,b){return Ic.a?Ic.a(this,b):Ic.call(null,this,b)};k.J=function(){return J};k.R=function(a,b){return Dc.n(this.e,b,this.e[this.m],this.m+1)};k.O=function(a,b,c){return Dc.n(this.e,b,c,this.m)};k.N=function(){return this.e[this.m]};
k.S=function(){return this.m+1<this.e.length?new F(this.e,this.m+1):J};k.D=function(){return this};k.G=function(a,b){return M.a?M.a(b,this):M.call(null,b,this)};F.prototype[Ea]=function(){return uc(this)};
var Jc=function(){function a(a,b){return b<a.length?new F(a,b):null}function b(a){return c.a(a,0)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Kc=function(){function a(a,b){return Jc.a(a,b)}function b(a){return Jc.a(a,0)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+
arguments.length);};c.b=b;c.a=a;return c}();function Hc(a,b,c){this.qb=a;this.m=b;this.k=c;this.j=32374990;this.q=8192}k=Hc.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};k.T=function(){return 0<this.m?new Hc(this.qb,this.m-1,null):null};k.L=function(){return this.m+1};k.B=function(){return wc(this)};k.A=function(a,b){return Ic.a?Ic.a(this,b):Ic.call(null,this,b)};k.J=function(){var a=this.k;return O.a?O.a(J,a):O.call(null,J,a)};
k.R=function(a,b){return P.a?P.a(b,this):P.call(null,b,this)};k.O=function(a,b,c){return P.c?P.c(b,c,this):P.call(null,b,c,this)};k.N=function(){return C.a(this.qb,this.m)};k.S=function(){return 0<this.m?new Hc(this.qb,this.m-1,null):J};k.D=function(){return this};k.F=function(a,b){return new Hc(this.qb,this.m,b)};k.G=function(a,b){return M.a?M.a(b,this):M.call(null,b,this)};Hc.prototype[Ea]=function(){return uc(this)};function Lc(a){return G(K(a))}yb._=function(a,b){return a===b};
var Nc=function(){function a(a,b){return null!=a?Ra(a,b):Ra(J,b)}var b=null,c=function(){function a(b,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return c.call(this,b,d,l)}function c(a,d,e){for(;;)if(t(e))a=b.a(a,d),d=G(e),e=K(e);else return b.a(a,d)}a.i=2;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=H(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 0:return Mc;case 1:return b;
case 2:return a.call(this,b,e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.l=function(){return Mc};b.b=function(a){return a};b.a=a;b.d=c.d;return b}();function Oc(a){return null==a?null:Na(a)}
function Q(a){if(null!=a)if(a&&(a.j&2||a.cc))a=a.L(null);else if(a instanceof Array)a=a.length;else if("string"===typeof a)a=a.length;else if(w(La,a))a=Ma(a);else a:{a=D(a);for(var b=0;;){if(Ec(a)){a=b+Ma(a);break a}a=K(a);b+=1}a=void 0}else a=0;return a}
var Pc=function(){function a(a,b,c){for(;;){if(null==a)return c;if(0===b)return D(a)?G(a):c;if(Fc(a))return C.c(a,b,c);if(D(a))a=K(a),b-=1;else return c}}function b(a,b){for(;;){if(null==a)throw Error("Index out of bounds");if(0===b){if(D(a))return G(a);throw Error("Index out of bounds");}if(Fc(a))return C.a(a,b);if(D(a)){var c=K(a),g=b-1;a=c;b=g}else throw Error("Index out of bounds");}}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),R=function(){function a(a,b,c){if("number"!==typeof b)throw Error("index argument to nth must be a number.");if(null==a)return c;if(a&&(a.j&16||a.Qb))return a.$(null,b,c);if(a instanceof Array||"string"===typeof a)return b<a.length?a[b]:c;if(w(Ta,a))return C.a(a,b);if(a?a.j&64||a.jb||(a.j?0:w(Ua,a)):w(Ua,a))return Pc.c(a,b,c);throw Error([z("nth not supported on this type "),z(Da(Ba(a)))].join(""));}function b(a,b){if("number"!==
typeof b)throw Error("index argument to nth must be a number");if(null==a)return a;if(a&&(a.j&16||a.Qb))return a.Q(null,b);if(a instanceof Array||"string"===typeof a)return b<a.length?a[b]:null;if(w(Ta,a))return C.a(a,b);if(a?a.j&64||a.jb||(a.j?0:w(Ua,a)):w(Ua,a))return Pc.a(a,b);throw Error([z("nth not supported on this type "),z(Da(Ba(a)))].join(""));}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+
arguments.length);};c.a=b;c.c=a;return c}(),S=function(){function a(a,b,c){return null!=a?a&&(a.j&256||a.Rb)?a.s(null,b,c):a instanceof Array?b<a.length?a[b]:c:"string"===typeof a?b<a.length?a[b]:c:w(Za,a)?$a.c(a,b,c):c:c}function b(a,b){return null==a?null:a&&(a.j&256||a.Rb)?a.t(null,b):a instanceof Array?b<a.length?a[b]:null:"string"===typeof a?b<a.length?a[b]:null:w(Za,a)?$a.a(a,b):null}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),Rc=function(){function a(a,b,c){if(null!=a)a=cb(a,b,c);else a:{a=[b];c=[c];b=a.length;for(var g=0,h=Ob(Qc);;)if(g<b)var l=g+1,h=h.kb(null,a[g],c[g]),g=l;else{a=Qb(h);break a}a=void 0}return a}var b=null,c=function(){function a(b,d,h,l){var m=null;if(3<arguments.length){for(var m=0,p=Array(arguments.length-3);m<p.length;)p[m]=arguments[m+3],++m;m=new F(p,0)}return c.call(this,b,d,h,m)}function c(a,d,e,l){for(;;)if(a=b.c(a,
d,e),t(l))d=G(l),e=Lc(l),l=K(K(l));else return a}a.i=3;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=K(a);var l=G(a);a=H(a);return c(b,d,l,a)};a.d=c;return a}(),b=function(b,e,f,g){switch(arguments.length){case 3:return a.call(this,b,e,f);default:var h=null;if(3<arguments.length){for(var h=0,l=Array(arguments.length-3);h<l.length;)l[h]=arguments[h+3],++h;h=new F(l,0)}return c.d(b,e,f,h)}throw Error("Invalid arity: "+arguments.length);};b.i=3;b.f=c.f;b.c=a;b.d=c.d;return b}(),Sc=function(){function a(a,
b){return null==a?null:eb(a,b)}var b=null,c=function(){function a(b,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return c.call(this,b,d,l)}function c(a,d,e){for(;;){if(null==a)return null;a=b.a(a,d);if(t(e))d=G(e),e=K(e);else return a}}a.i=2;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=H(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);
default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=c.d;return b}();function Tc(a){var b="function"==n(a);return t(b)?b:a?t(t(null)?null:a.bc)?!0:a.yb?!1:w(Ja,a):w(Ja,a)}function Uc(a,b){this.h=a;this.k=b;this.q=0;this.j=393217}k=Uc.prototype;
k.call=function(){function a(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,Y,ra,I){a=this.h;return T.ub?T.ub(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,Y,ra,I):T.call(null,a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,Y,ra,I)}function b(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,Y,ra){a=this;return a.h.Fa?a.h.Fa(b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,Y,ra):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,Y,ra)}function c(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,Y){a=this;return a.h.Ea?a.h.Ea(b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,
Y):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N,Y)}function d(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N){a=this;return a.h.Da?a.h.Da(b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E,N)}function e(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E){a=this;return a.h.Ca?a.h.Ca(b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B,E)}function f(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B){a=this;return a.h.Ba?a.h.Ba(b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B):a.h.call(null,
b,c,d,e,f,g,h,l,m,p,q,u,s,v,y,B)}function g(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y){a=this;return a.h.Aa?a.h.Aa(b,c,d,e,f,g,h,l,m,p,q,u,s,v,y):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q,u,s,v,y)}function h(a,b,c,d,e,f,g,h,l,m,p,q,u,s,v){a=this;return a.h.za?a.h.za(b,c,d,e,f,g,h,l,m,p,q,u,s,v):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q,u,s,v)}function l(a,b,c,d,e,f,g,h,l,m,p,q,u,s){a=this;return a.h.ya?a.h.ya(b,c,d,e,f,g,h,l,m,p,q,u,s):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q,u,s)}function m(a,b,c,d,e,f,g,h,l,m,p,q,u){a=this;
return a.h.xa?a.h.xa(b,c,d,e,f,g,h,l,m,p,q,u):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q,u)}function p(a,b,c,d,e,f,g,h,l,m,p,q){a=this;return a.h.wa?a.h.wa(b,c,d,e,f,g,h,l,m,p,q):a.h.call(null,b,c,d,e,f,g,h,l,m,p,q)}function q(a,b,c,d,e,f,g,h,l,m,p){a=this;return a.h.va?a.h.va(b,c,d,e,f,g,h,l,m,p):a.h.call(null,b,c,d,e,f,g,h,l,m,p)}function s(a,b,c,d,e,f,g,h,l,m){a=this;return a.h.Ha?a.h.Ha(b,c,d,e,f,g,h,l,m):a.h.call(null,b,c,d,e,f,g,h,l,m)}function u(a,b,c,d,e,f,g,h,l){a=this;return a.h.Ga?a.h.Ga(b,c,
d,e,f,g,h,l):a.h.call(null,b,c,d,e,f,g,h,l)}function v(a,b,c,d,e,f,g,h){a=this;return a.h.ia?a.h.ia(b,c,d,e,f,g,h):a.h.call(null,b,c,d,e,f,g,h)}function y(a,b,c,d,e,f,g){a=this;return a.h.P?a.h.P(b,c,d,e,f,g):a.h.call(null,b,c,d,e,f,g)}function B(a,b,c,d,e,f){a=this;return a.h.r?a.h.r(b,c,d,e,f):a.h.call(null,b,c,d,e,f)}function E(a,b,c,d,e){a=this;return a.h.n?a.h.n(b,c,d,e):a.h.call(null,b,c,d,e)}function N(a,b,c,d){a=this;return a.h.c?a.h.c(b,c,d):a.h.call(null,b,c,d)}function Y(a,b,c){a=this;
return a.h.a?a.h.a(b,c):a.h.call(null,b,c)}function ra(a,b){a=this;return a.h.b?a.h.b(b):a.h.call(null,b)}function Pa(a){a=this;return a.h.l?a.h.l():a.h.call(null)}var I=null,I=function(I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab,Wb,jc,zc,Zc,Gd,De,Wf,dh){switch(arguments.length){case 1:return Pa.call(this,I);case 2:return ra.call(this,I,qa);case 3:return Y.call(this,I,qa,ta);case 4:return N.call(this,I,qa,ta,va);case 5:return E.call(this,I,qa,ta,va,xa);case 6:return B.call(this,I,qa,ta,va,xa,Ca);case 7:return y.call(this,
I,qa,ta,va,xa,Ca,Ga);case 8:return v.call(this,I,qa,ta,va,xa,Ca,Ga,Ka);case 9:return u.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa);case 10:return s.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa);case 11:return q.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya);case 12:return p.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb);case 13:return m.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob);case 14:return l.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab);case 15:return h.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,
ob,Ab,Wb);case 16:return g.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab,Wb,jc);case 17:return f.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab,Wb,jc,zc);case 18:return e.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab,Wb,jc,zc,Zc);case 19:return d.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab,Wb,jc,zc,Zc,Gd);case 20:return c.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab,Wb,jc,zc,Zc,Gd,De);case 21:return b.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab,Wb,jc,zc,Zc,Gd,De,
Wf);case 22:return a.call(this,I,qa,ta,va,xa,Ca,Ga,Ka,Oa,Sa,Ya,gb,ob,Ab,Wb,jc,zc,Zc,Gd,De,Wf,dh)}throw Error("Invalid arity: "+arguments.length);};I.b=Pa;I.a=ra;I.c=Y;I.n=N;I.r=E;I.P=B;I.ia=y;I.Ga=v;I.Ha=u;I.va=s;I.wa=q;I.xa=p;I.ya=m;I.za=l;I.Aa=h;I.Ba=g;I.Ca=f;I.Da=e;I.Ea=d;I.Fa=c;I.hc=b;I.ub=a;return I}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.l=function(){return this.h.l?this.h.l():this.h.call(null)};
k.b=function(a){return this.h.b?this.h.b(a):this.h.call(null,a)};k.a=function(a,b){return this.h.a?this.h.a(a,b):this.h.call(null,a,b)};k.c=function(a,b,c){return this.h.c?this.h.c(a,b,c):this.h.call(null,a,b,c)};k.n=function(a,b,c,d){return this.h.n?this.h.n(a,b,c,d):this.h.call(null,a,b,c,d)};k.r=function(a,b,c,d,e){return this.h.r?this.h.r(a,b,c,d,e):this.h.call(null,a,b,c,d,e)};k.P=function(a,b,c,d,e,f){return this.h.P?this.h.P(a,b,c,d,e,f):this.h.call(null,a,b,c,d,e,f)};
k.ia=function(a,b,c,d,e,f,g){return this.h.ia?this.h.ia(a,b,c,d,e,f,g):this.h.call(null,a,b,c,d,e,f,g)};k.Ga=function(a,b,c,d,e,f,g,h){return this.h.Ga?this.h.Ga(a,b,c,d,e,f,g,h):this.h.call(null,a,b,c,d,e,f,g,h)};k.Ha=function(a,b,c,d,e,f,g,h,l){return this.h.Ha?this.h.Ha(a,b,c,d,e,f,g,h,l):this.h.call(null,a,b,c,d,e,f,g,h,l)};k.va=function(a,b,c,d,e,f,g,h,l,m){return this.h.va?this.h.va(a,b,c,d,e,f,g,h,l,m):this.h.call(null,a,b,c,d,e,f,g,h,l,m)};
k.wa=function(a,b,c,d,e,f,g,h,l,m,p){return this.h.wa?this.h.wa(a,b,c,d,e,f,g,h,l,m,p):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p)};k.xa=function(a,b,c,d,e,f,g,h,l,m,p,q){return this.h.xa?this.h.xa(a,b,c,d,e,f,g,h,l,m,p,q):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q)};k.ya=function(a,b,c,d,e,f,g,h,l,m,p,q,s){return this.h.ya?this.h.ya(a,b,c,d,e,f,g,h,l,m,p,q,s):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q,s)};
k.za=function(a,b,c,d,e,f,g,h,l,m,p,q,s,u){return this.h.za?this.h.za(a,b,c,d,e,f,g,h,l,m,p,q,s,u):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q,s,u)};k.Aa=function(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v){return this.h.Aa?this.h.Aa(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q,s,u,v)};k.Ba=function(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y){return this.h.Ba?this.h.Ba(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y)};
k.Ca=function(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B){return this.h.Ca?this.h.Ca(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B)};k.Da=function(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E){return this.h.Da?this.h.Da(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E)};
k.Ea=function(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N){return this.h.Ea?this.h.Ea(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N)};k.Fa=function(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y){return this.h.Fa?this.h.Fa(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y):this.h.call(null,a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y)};
k.hc=function(a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra){var Pa=this.h;return T.ub?T.ub(Pa,a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra):T.call(null,Pa,a,b,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra)};k.bc=!0;k.F=function(a,b){return new Uc(this.h,b)};k.H=function(){return this.k};function O(a,b){return Tc(a)&&!(a?a.j&262144||a.Bc||(a.j?0:w(tb,a)):w(tb,a))?new Uc(a,b):null==a?null:ub(a,b)}function Vc(a){var b=null!=a;return(b?a?a.j&131072||a.kc||(a.j?0:w(rb,a)):w(rb,a):b)?sb(a):null}
function Wc(a){return null==a?null:lb(a)}
var Xc=function(){function a(a,b){return null==a?null:kb(a,b)}var b=null,c=function(){function a(b,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return c.call(this,b,d,l)}function c(a,d,e){for(;;){if(null==a)return null;a=b.a(a,d);if(t(e))d=G(e),e=K(e);else return a}}a.i=2;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=H(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,
b,e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=c.d;return b}();function Yc(a){return null==a||Aa(D(a))}function $c(a){return null==a?!1:a?a.j&8||a.tc?!0:a.j?!1:w(Qa,a):w(Qa,a)}function ad(a){return null==a?!1:a?a.j&4096||a.zc?!0:a.j?!1:w(jb,a):w(jb,a)}
function bd(a){return a?a.j&512||a.rc?!0:a.j?!1:w(ab,a):w(ab,a)}function cd(a){return a?a.j&16777216||a.yc?!0:a.j?!1:w(Db,a):w(Db,a)}function dd(a){return null==a?!1:a?a.j&1024||a.ic?!0:a.j?!1:w(db,a):w(db,a)}function ed(a){return a?a.j&16384||a.Ac?!0:a.j?!1:w(nb,a):w(nb,a)}function fd(a){return a?a.q&512||a.sc?!0:!1:!1}function gd(a){var b=[];ea(a,function(a,b){return function(a,c){return b.push(c)}}(a,b));return b}function hd(a,b,c,d,e){for(;0!==e;)c[d]=a[b],d+=1,e-=1,b+=1}
function id(a,b,c,d,e){b+=e-1;for(d+=e-1;0!==e;)c[d]=a[b],d-=1,e-=1,b-=1}var jd={};function kd(a){return null==a?!1:a?a.j&64||a.jb?!0:a.j?!1:w(Ua,a):w(Ua,a)}function ld(a){return a?a.j&8388608||a.mc?!0:a.j?!1:w(Bb,a):w(Bb,a)}function md(a){return t(a)?!0:!1}function nd(a,b){return S.c(a,b,jd)===jd?!1:!0}
function od(a,b){if(a===b)return 0;if(null==a)return-1;if(null==b)return 1;if(Ba(a)===Ba(b))return a&&(a.q&2048||a.sb)?a.tb(null,b):ha(a,b);throw Error("compare on non-nil objects of different types");}
var pd=function(){function a(a,b,c,g){for(;;){var h=od(R.a(a,g),R.a(b,g));if(0===h&&g+1<c)g+=1;else return h}}function b(a,b){var f=Q(a),g=Q(b);return f<g?-1:f>g?1:c.n(a,b,f,0)}var c=null,c=function(c,e,f,g){switch(arguments.length){case 2:return b.call(this,c,e);case 4:return a.call(this,c,e,f,g)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.n=a;return c}();
function qd(a){return sc.a(a,od)?od:function(b,c){var d=a.a?a.a(b,c):a.call(null,b,c);return"number"===typeof d?d:t(d)?-1:t(a.a?a.a(c,b):a.call(null,c,b))?1:0}}
var sd=function(){function a(a,b){if(D(b)){var c=rd.b?rd.b(b):rd.call(null,b),g=qd(a);ia(c,g);return D(c)}return J}function b(a){return c.a(od,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),td=function(){function a(a,b,c){return sd.a(function(c,f){return qd(b).call(null,a.b?a.b(c):a.call(null,c),a.b?a.b(f):a.call(null,f))},c)}function b(a,b){return c.c(a,od,
b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),P=function(){function a(a,b,c){for(c=D(c);;)if(c){var g=G(c);b=a.a?a.a(b,g):a.call(null,b,g);if(Ac(b))return qb(b);c=K(c)}else return b}function b(a,b){var c=D(b);if(c){var g=G(c),c=K(c);return A.c?A.c(a,g,c):A.call(null,a,g,c)}return a.l?a.l():a.call(null)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,
c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),A=function(){function a(a,b,c){return c&&(c.j&524288||c.Sb)?c.O(null,a,b):c instanceof Array?Dc.c(c,a,b):"string"===typeof c?Dc.c(c,a,b):w(vb,c)?wb.c(c,a,b):P.c(a,b,c)}function b(a,b){return b&&(b.j&524288||b.Sb)?b.R(null,a):b instanceof Array?Dc.a(b,a):"string"===typeof b?Dc.a(b,a):w(vb,b)?wb.a(b,a):P.a(a,b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,
c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();function ud(a){return a}
var vd=function(){function a(a,b){return function(){function c(b,e){return a.a?a.a(b,e):a.call(null,b,e)}function g(a){return b.b?b.b(a):b.call(null,a)}function h(){return a.l?a.l():a.call(null)}var l=null,l=function(a,b){switch(arguments.length){case 0:return h.call(this);case 1:return g.call(this,a);case 2:return c.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};l.l=h;l.b=g;l.a=c;return l}()}function b(a){return c.a(a,ud)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),wd=function(){function a(a,b,c,g){a=a.b?a.b(b):a.call(null,b);c=A.c(a,c,g);return a.b?a.b(c):a.call(null,c)}function b(a,b,f){return c.n(a,b,b.l?b.l():b.call(null),f)}var c=null,c=function(c,e,f,g){switch(arguments.length){case 3:return b.call(this,c,e,f);case 4:return a.call(this,c,e,f,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.n=a;return c}(),xd=function(){var a=null,b=function(){function b(a,
c,g){var h=null;if(2<arguments.length){for(var h=0,l=Array(arguments.length-2);h<l.length;)l[h]=arguments[h+2],++h;h=new F(l,0)}return d.call(this,a,c,h)}function d(b,c,d){return A.c(a,b+c,d)}b.i=2;b.f=function(a){var b=G(a);a=K(a);var c=G(a);a=H(a);return d(b,c,a)};b.d=d;return b}(),a=function(a,d,e){switch(arguments.length){case 0:return 0;case 1:return a;case 2:return a+d;default:var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+2],++f;f=new F(g,
0)}return b.d(a,d,f)}throw Error("Invalid arity: "+arguments.length);};a.i=2;a.f=b.f;a.l=function(){return 0};a.b=function(a){return a};a.a=function(a,b){return a+b};a.d=b.d;return a}(),yd=function(){var a=null,b=function(){function a(c,f,g){var h=null;if(2<arguments.length){for(var h=0,l=Array(arguments.length-2);h<l.length;)l[h]=arguments[h+2],++h;h=new F(l,0)}return b.call(this,c,f,h)}function b(a,c,d){for(;;)if(a<c)if(K(d))a=c,c=G(d),d=K(d);else return c<G(d);else return!1}a.i=2;a.f=function(a){var c=
G(a);a=K(a);var g=G(a);a=H(a);return b(c,g,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 1:return!0;case 2:return a<d;default:var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+2],++f;f=new F(g,0)}return b.d(a,d,f)}throw Error("Invalid arity: "+arguments.length);};a.i=2;a.f=b.f;a.b=function(){return!0};a.a=function(a,b){return a<b};a.d=b.d;return a}(),zd=function(){var a=null,b=function(){function a(c,f,g){var h=null;if(2<
arguments.length){for(var h=0,l=Array(arguments.length-2);h<l.length;)l[h]=arguments[h+2],++h;h=new F(l,0)}return b.call(this,c,f,h)}function b(a,c,d){for(;;)if(a<=c)if(K(d))a=c,c=G(d),d=K(d);else return c<=G(d);else return!1}a.i=2;a.f=function(a){var c=G(a);a=K(a);var g=G(a);a=H(a);return b(c,g,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 1:return!0;case 2:return a<=d;default:var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+
2],++f;f=new F(g,0)}return b.d(a,d,f)}throw Error("Invalid arity: "+arguments.length);};a.i=2;a.f=b.f;a.b=function(){return!0};a.a=function(a,b){return a<=b};a.d=b.d;return a}(),Ad=function(){var a=null,b=function(){function a(c,f,g){var h=null;if(2<arguments.length){for(var h=0,l=Array(arguments.length-2);h<l.length;)l[h]=arguments[h+2],++h;h=new F(l,0)}return b.call(this,c,f,h)}function b(a,c,d){for(;;)if(a>c)if(K(d))a=c,c=G(d),d=K(d);else return c>G(d);else return!1}a.i=2;a.f=function(a){var c=
G(a);a=K(a);var g=G(a);a=H(a);return b(c,g,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 1:return!0;case 2:return a>d;default:var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+2],++f;f=new F(g,0)}return b.d(a,d,f)}throw Error("Invalid arity: "+arguments.length);};a.i=2;a.f=b.f;a.b=function(){return!0};a.a=function(a,b){return a>b};a.d=b.d;return a}(),Bd=function(){var a=null,b=function(){function a(c,f,g){var h=null;if(2<
arguments.length){for(var h=0,l=Array(arguments.length-2);h<l.length;)l[h]=arguments[h+2],++h;h=new F(l,0)}return b.call(this,c,f,h)}function b(a,c,d){for(;;)if(a>=c)if(K(d))a=c,c=G(d),d=K(d);else return c>=G(d);else return!1}a.i=2;a.f=function(a){var c=G(a);a=K(a);var g=G(a);a=H(a);return b(c,g,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 1:return!0;case 2:return a>=d;default:var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+
2],++f;f=new F(g,0)}return b.d(a,d,f)}throw Error("Invalid arity: "+arguments.length);};a.i=2;a.f=b.f;a.b=function(){return!0};a.a=function(a,b){return a>=b};a.d=b.d;return a}();function Cd(a,b){var c=(a-a%b)/b;return 0<=c?Math.floor.b?Math.floor.b(c):Math.floor.call(null,c):Math.ceil.b?Math.ceil.b(c):Math.ceil.call(null,c)}function Dd(a){a-=a>>1&1431655765;a=(a&858993459)+(a>>2&858993459);return 16843009*(a+(a>>4)&252645135)>>24}
function Ed(a){var b=1;for(a=D(a);;)if(a&&0<b)b-=1,a=K(a);else return a}
var z=function(){function a(a){return null==a?"":da(a)}var b=null,c=function(){function a(b,d){var h=null;if(1<arguments.length){for(var h=0,l=Array(arguments.length-1);h<l.length;)l[h]=arguments[h+1],++h;h=new F(l,0)}return c.call(this,b,h)}function c(a,d){for(var e=new fa(b.b(a)),l=d;;)if(t(l))e=e.append(b.b(G(l))),l=K(l);else return e.toString()}a.i=1;a.f=function(a){var b=G(a);a=H(a);return c(b,a)};a.d=c;return a}(),b=function(b,e){switch(arguments.length){case 0:return"";case 1:return a.call(this,
b);default:var f=null;if(1<arguments.length){for(var f=0,g=Array(arguments.length-1);f<g.length;)g[f]=arguments[f+1],++f;f=new F(g,0)}return c.d(b,f)}throw Error("Invalid arity: "+arguments.length);};b.i=1;b.f=c.f;b.l=function(){return""};b.b=a;b.d=c.d;return b}();function Ic(a,b){var c;if(cd(b))if(Ec(a)&&Ec(b)&&Q(a)!==Q(b))c=!1;else a:{c=D(a);for(var d=D(b);;){if(null==c){c=null==d;break a}if(null!=d&&sc.a(G(c),G(d)))c=K(c),d=K(d);else{c=!1;break a}}c=void 0}else c=null;return md(c)}
function Fd(a,b,c,d,e){this.k=a;this.first=b;this.M=c;this.count=d;this.p=e;this.j=65937646;this.q=8192}k=Fd.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};k.T=function(){return 1===this.count?null:this.M};k.L=function(){return this.count};k.La=function(){return this.first};k.Ma=function(){return Wa(this)};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return ub(J,this.k)};
k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return this.first};k.S=function(){return 1===this.count?J:this.M};k.D=function(){return this};k.F=function(a,b){return new Fd(b,this.first,this.M,this.count,this.p)};k.G=function(a,b){return new Fd(this.k,b,this,this.count+1,null)};Fd.prototype[Ea]=function(){return uc(this)};function Hd(a){this.k=a;this.j=65937614;this.q=8192}k=Hd.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};
k.T=function(){return null};k.L=function(){return 0};k.La=function(){return null};k.Ma=function(){throw Error("Can't pop empty list");};k.B=function(){return 0};k.A=function(a,b){return Ic(this,b)};k.J=function(){return this};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return null};k.S=function(){return J};k.D=function(){return null};k.F=function(a,b){return new Hd(b)};k.G=function(a,b){return new Fd(this.k,b,null,1,null)};var J=new Hd(null);
Hd.prototype[Ea]=function(){return uc(this)};function Id(a){return a?a.j&134217728||a.xc?!0:a.j?!1:w(Fb,a):w(Fb,a)}function Jd(a){return Id(a)?Gb(a):A.c(Nc,J,a)}
var Kd=function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){var b;if(a instanceof F&&0===a.m)b=a.e;else a:{for(b=[];;)if(null!=a)b.push(a.N(null)),a=a.T(null);else break a;b=void 0}a=b.length;for(var e=J;;)if(0<a){var f=a-1,e=e.G(null,b[a-1]);a=f}else return e}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}();
function Ld(a,b,c,d){this.k=a;this.first=b;this.M=c;this.p=d;this.j=65929452;this.q=8192}k=Ld.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};k.T=function(){return null==this.M?null:D(this.M)};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.k)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return this.first};
k.S=function(){return null==this.M?J:this.M};k.D=function(){return this};k.F=function(a,b){return new Ld(b,this.first,this.M,this.p)};k.G=function(a,b){return new Ld(null,b,this,this.p)};Ld.prototype[Ea]=function(){return uc(this)};function M(a,b){var c=null==b;return(c?c:b&&(b.j&64||b.jb))?new Ld(null,a,b,null):new Ld(null,a,D(b),null)}
function Md(a,b){if(a.pa===b.pa)return 0;var c=Aa(a.ba);if(t(c?b.ba:c))return-1;if(t(a.ba)){if(Aa(b.ba))return 1;c=ha(a.ba,b.ba);return 0===c?ha(a.name,b.name):c}return ha(a.name,b.name)}function U(a,b,c,d){this.ba=a;this.name=b;this.pa=c;this.Ya=d;this.j=2153775105;this.q=4096}k=U.prototype;k.v=function(a,b){return Lb(b,[z(":"),z(this.pa)].join(""))};k.B=function(){var a=this.Ya;return null!=a?a:this.Ya=a=oc(this)+2654435769|0};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return S.a(c,this);case 3:return S.c(c,this,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return S.a(c,this)};a.c=function(a,c,d){return S.c(c,this,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return S.a(a,this)};k.a=function(a,b){return S.c(a,this,b)};k.A=function(a,b){return b instanceof U?this.pa===b.pa:!1};
k.toString=function(){return[z(":"),z(this.pa)].join("")};function Nd(a,b){return a===b?!0:a instanceof U&&b instanceof U?a.pa===b.pa:!1}
var Pd=function(){function a(a,b){return new U(a,b,[z(t(a)?[z(a),z("/")].join(""):null),z(b)].join(""),null)}function b(a){if(a instanceof U)return a;if(a instanceof qc){var b;if(a&&(a.q&4096||a.lc))b=a.ba;else throw Error([z("Doesn't support namespace: "),z(a)].join(""));return new U(b,Od.b?Od.b(a):Od.call(null,a),a.ta,null)}return"string"===typeof a?(b=a.split("/"),2===b.length?new U(b[0],b[1],a,null):new U(null,b[0],a,null)):null}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();function V(a,b,c,d){this.k=a;this.cb=b;this.C=c;this.p=d;this.q=0;this.j=32374988}k=V.prototype;k.toString=function(){return ec(this)};function Qd(a){null!=a.cb&&(a.C=a.cb.l?a.cb.l():a.cb.call(null),a.cb=null);return a.C}k.H=function(){return this.k};k.T=function(){Cb(this);return null==this.C?null:K(this.C)};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};
k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.k)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){Cb(this);return null==this.C?null:G(this.C)};k.S=function(){Cb(this);return null!=this.C?H(this.C):J};k.D=function(){Qd(this);if(null==this.C)return null;for(var a=this.C;;)if(a instanceof V)a=Qd(a);else return this.C=a,D(this.C)};k.F=function(a,b){return new V(b,this.cb,this.C,this.p)};k.G=function(a,b){return M(b,this)};
V.prototype[Ea]=function(){return uc(this)};function Rd(a,b){this.Ab=a;this.end=b;this.q=0;this.j=2}Rd.prototype.L=function(){return this.end};Rd.prototype.add=function(a){this.Ab[this.end]=a;return this.end+=1};Rd.prototype.ca=function(){var a=new Sd(this.Ab,0,this.end);this.Ab=null;return a};function Td(a){return new Rd(Array(a),0)}function Sd(a,b,c){this.e=a;this.V=b;this.end=c;this.q=0;this.j=524306}k=Sd.prototype;k.R=function(a,b){return Dc.n(this.e,b,this.e[this.V],this.V+1)};
k.O=function(a,b,c){return Dc.n(this.e,b,c,this.V)};k.Pb=function(){if(this.V===this.end)throw Error("-drop-first of empty chunk");return new Sd(this.e,this.V+1,this.end)};k.Q=function(a,b){return this.e[this.V+b]};k.$=function(a,b,c){return 0<=b&&b<this.end-this.V?this.e[this.V+b]:c};k.L=function(){return this.end-this.V};
var Ud=function(){function a(a,b,c){return new Sd(a,b,c)}function b(a,b){return new Sd(a,b,a.length)}function c(a){return new Sd(a,0,a.length)}var d=null,d=function(d,f,g){switch(arguments.length){case 1:return c.call(this,d);case 2:return b.call(this,d,f);case 3:return a.call(this,d,f,g)}throw Error("Invalid arity: "+arguments.length);};d.b=c;d.a=b;d.c=a;return d}();function Vd(a,b,c,d){this.ca=a;this.ra=b;this.k=c;this.p=d;this.j=31850732;this.q=1536}k=Vd.prototype;k.toString=function(){return ec(this)};
k.H=function(){return this.k};k.T=function(){if(1<Ma(this.ca))return new Vd(Xb(this.ca),this.ra,this.k,null);var a=Cb(this.ra);return null==a?null:a};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.k)};k.N=function(){return C.a(this.ca,0)};k.S=function(){return 1<Ma(this.ca)?new Vd(Xb(this.ca),this.ra,this.k,null):null==this.ra?J:this.ra};k.D=function(){return this};k.Cb=function(){return this.ca};
k.Db=function(){return null==this.ra?J:this.ra};k.F=function(a,b){return new Vd(this.ca,this.ra,b,this.p)};k.G=function(a,b){return M(b,this)};k.Bb=function(){return null==this.ra?null:this.ra};Vd.prototype[Ea]=function(){return uc(this)};function Wd(a,b){return 0===Ma(a)?b:new Vd(a,b,null,null)}function Xd(a,b){a.add(b)}function rd(a){for(var b=[];;)if(D(a))b.push(G(a)),a=K(a);else return b}function Yd(a,b){if(Ec(a))return Q(a);for(var c=a,d=b,e=0;;)if(0<d&&D(c))c=K(c),d-=1,e+=1;else return e}
var $d=function Zd(b){return null==b?null:null==K(b)?D(G(b)):M(G(b),Zd(K(b)))},ae=function(){function a(a,b){return new V(null,function(){var c=D(a);return c?fd(c)?Wd(Yb(c),d.a(Zb(c),b)):M(G(c),d.a(H(c),b)):b},null,null)}function b(a){return new V(null,function(){return a},null,null)}function c(){return new V(null,function(){return null},null,null)}var d=null,e=function(){function a(c,d,e){var f=null;if(2<arguments.length){for(var f=0,q=Array(arguments.length-2);f<q.length;)q[f]=arguments[f+2],++f;
f=new F(q,0)}return b.call(this,c,d,f)}function b(a,c,e){return function q(a,b){return new V(null,function(){var c=D(a);return c?fd(c)?Wd(Yb(c),q(Zb(c),b)):M(G(c),q(H(c),b)):t(b)?q(G(b),K(b)):null},null,null)}(d.a(a,c),e)}a.i=2;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=H(a);return b(c,d,a)};a.d=b;return a}(),d=function(d,g,h){switch(arguments.length){case 0:return c.call(this);case 1:return b.call(this,d);case 2:return a.call(this,d,g);default:var l=null;if(2<arguments.length){for(var l=0,m=
Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return e.d(d,g,l)}throw Error("Invalid arity: "+arguments.length);};d.i=2;d.f=e.f;d.l=c;d.b=b;d.a=a;d.d=e.d;return d}(),be=function(){function a(a,b,c,d){return M(a,M(b,M(c,d)))}function b(a,b,c){return M(a,M(b,c))}var c=null,d=function(){function a(c,d,e,m,p){var q=null;if(4<arguments.length){for(var q=0,s=Array(arguments.length-4);q<s.length;)s[q]=arguments[q+4],++q;q=new F(s,0)}return b.call(this,c,d,e,m,q)}function b(a,
c,d,e,f){return M(a,M(c,M(d,M(e,$d(f)))))}a.i=4;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=K(a);var e=G(a);a=K(a);var p=G(a);a=H(a);return b(c,d,e,p,a)};a.d=b;return a}(),c=function(c,f,g,h,l){switch(arguments.length){case 1:return D(c);case 2:return M(c,f);case 3:return b.call(this,c,f,g);case 4:return a.call(this,c,f,g,h);default:var m=null;if(4<arguments.length){for(var m=0,p=Array(arguments.length-4);m<p.length;)p[m]=arguments[m+4],++m;m=new F(p,0)}return d.d(c,f,g,h,m)}throw Error("Invalid arity: "+
arguments.length);};c.i=4;c.f=d.f;c.b=function(a){return D(a)};c.a=function(a,b){return M(a,b)};c.c=b;c.n=a;c.d=d.d;return c}();function ce(a){return Qb(a)}
var de=function(){function a(){return Ob(Mc)}var b=null,c=function(){function a(c,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return b.call(this,c,d,l)}function b(a,c,d){for(;;)if(a=Pb(a,c),t(d))c=G(d),d=K(d);else return a}a.i=2;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=H(a);return b(c,d,a)};a.d=b;return a}(),b=function(b,e,f){switch(arguments.length){case 0:return a.call(this);case 1:return b;case 2:return Pb(b,
e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.l=a;b.b=function(a){return a};b.a=function(a,b){return Pb(a,b)};b.d=c.d;return b}(),ee=function(){var a=null,b=function(){function a(c,f,g,h){var l=null;if(3<arguments.length){for(var l=0,m=Array(arguments.length-3);l<m.length;)m[l]=arguments[l+3],++l;l=new F(m,0)}return b.call(this,
c,f,g,l)}function b(a,c,d,h){for(;;)if(a=Rb(a,c,d),t(h))c=G(h),d=Lc(h),h=K(K(h));else return a}a.i=3;a.f=function(a){var c=G(a);a=K(a);var g=G(a);a=K(a);var h=G(a);a=H(a);return b(c,g,h,a)};a.d=b;return a}(),a=function(a,d,e,f){switch(arguments.length){case 3:return Rb(a,d,e);default:var g=null;if(3<arguments.length){for(var g=0,h=Array(arguments.length-3);g<h.length;)h[g]=arguments[g+3],++g;g=new F(h,0)}return b.d(a,d,e,g)}throw Error("Invalid arity: "+arguments.length);};a.i=3;a.f=b.f;a.c=function(a,
b,e){return Rb(a,b,e)};a.d=b.d;return a}(),fe=function(){var a=null,b=function(){function a(c,f,g){var h=null;if(2<arguments.length){for(var h=0,l=Array(arguments.length-2);h<l.length;)l[h]=arguments[h+2],++h;h=new F(l,0)}return b.call(this,c,f,h)}function b(a,c,d){for(;;)if(a=Sb(a,c),t(d))c=G(d),d=K(d);else return a}a.i=2;a.f=function(a){var c=G(a);a=K(a);var g=G(a);a=H(a);return b(c,g,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 2:return Sb(a,d);default:var f=null;if(2<
arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+2],++f;f=new F(g,0)}return b.d(a,d,f)}throw Error("Invalid arity: "+arguments.length);};a.i=2;a.f=b.f;a.a=function(a,b){return Sb(a,b)};a.d=b.d;return a}(),ge=function(){var a=null,b=function(){function a(c,f,g){var h=null;if(2<arguments.length){for(var h=0,l=Array(arguments.length-2);h<l.length;)l[h]=arguments[h+2],++h;h=new F(l,0)}return b.call(this,c,f,h)}function b(a,c,d){for(;;)if(a=Vb(a,c),t(d))c=G(d),d=K(d);
else return a}a.i=2;a.f=function(a){var c=G(a);a=K(a);var g=G(a);a=H(a);return b(c,g,a)};a.d=b;return a}(),a=function(a,d,e){switch(arguments.length){case 2:return Vb(a,d);default:var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+2],++f;f=new F(g,0)}return b.d(a,d,f)}throw Error("Invalid arity: "+arguments.length);};a.i=2;a.f=b.f;a.a=function(a,b){return Vb(a,b)};a.d=b.d;return a}();
function he(a,b,c){var d=D(c);if(0===b)return a.l?a.l():a.call(null);c=Va(d);var e=Wa(d);if(1===b)return a.b?a.b(c):a.b?a.b(c):a.call(null,c);var d=Va(e),f=Wa(e);if(2===b)return a.a?a.a(c,d):a.a?a.a(c,d):a.call(null,c,d);var e=Va(f),g=Wa(f);if(3===b)return a.c?a.c(c,d,e):a.c?a.c(c,d,e):a.call(null,c,d,e);var f=Va(g),h=Wa(g);if(4===b)return a.n?a.n(c,d,e,f):a.n?a.n(c,d,e,f):a.call(null,c,d,e,f);var g=Va(h),l=Wa(h);if(5===b)return a.r?a.r(c,d,e,f,g):a.r?a.r(c,d,e,f,g):a.call(null,c,d,e,f,g);var h=Va(l),
m=Wa(l);if(6===b)return a.P?a.P(c,d,e,f,g,h):a.P?a.P(c,d,e,f,g,h):a.call(null,c,d,e,f,g,h);var l=Va(m),p=Wa(m);if(7===b)return a.ia?a.ia(c,d,e,f,g,h,l):a.ia?a.ia(c,d,e,f,g,h,l):a.call(null,c,d,e,f,g,h,l);var m=Va(p),q=Wa(p);if(8===b)return a.Ga?a.Ga(c,d,e,f,g,h,l,m):a.Ga?a.Ga(c,d,e,f,g,h,l,m):a.call(null,c,d,e,f,g,h,l,m);var p=Va(q),s=Wa(q);if(9===b)return a.Ha?a.Ha(c,d,e,f,g,h,l,m,p):a.Ha?a.Ha(c,d,e,f,g,h,l,m,p):a.call(null,c,d,e,f,g,h,l,m,p);var q=Va(s),u=Wa(s);if(10===b)return a.va?a.va(c,d,e,
f,g,h,l,m,p,q):a.va?a.va(c,d,e,f,g,h,l,m,p,q):a.call(null,c,d,e,f,g,h,l,m,p,q);var s=Va(u),v=Wa(u);if(11===b)return a.wa?a.wa(c,d,e,f,g,h,l,m,p,q,s):a.wa?a.wa(c,d,e,f,g,h,l,m,p,q,s):a.call(null,c,d,e,f,g,h,l,m,p,q,s);var u=Va(v),y=Wa(v);if(12===b)return a.xa?a.xa(c,d,e,f,g,h,l,m,p,q,s,u):a.xa?a.xa(c,d,e,f,g,h,l,m,p,q,s,u):a.call(null,c,d,e,f,g,h,l,m,p,q,s,u);var v=Va(y),B=Wa(y);if(13===b)return a.ya?a.ya(c,d,e,f,g,h,l,m,p,q,s,u,v):a.ya?a.ya(c,d,e,f,g,h,l,m,p,q,s,u,v):a.call(null,c,d,e,f,g,h,l,m,p,
q,s,u,v);var y=Va(B),E=Wa(B);if(14===b)return a.za?a.za(c,d,e,f,g,h,l,m,p,q,s,u,v,y):a.za?a.za(c,d,e,f,g,h,l,m,p,q,s,u,v,y):a.call(null,c,d,e,f,g,h,l,m,p,q,s,u,v,y);var B=Va(E),N=Wa(E);if(15===b)return a.Aa?a.Aa(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B):a.Aa?a.Aa(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B):a.call(null,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B);var E=Va(N),Y=Wa(N);if(16===b)return a.Ba?a.Ba(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E):a.Ba?a.Ba(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E):a.call(null,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E);var N=
Va(Y),ra=Wa(Y);if(17===b)return a.Ca?a.Ca(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N):a.Ca?a.Ca(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N):a.call(null,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N);var Y=Va(ra),Pa=Wa(ra);if(18===b)return a.Da?a.Da(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y):a.Da?a.Da(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y):a.call(null,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y);ra=Va(Pa);Pa=Wa(Pa);if(19===b)return a.Ea?a.Ea(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra):a.Ea?a.Ea(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra):a.call(null,
c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra);var I=Va(Pa);Wa(Pa);if(20===b)return a.Fa?a.Fa(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra,I):a.Fa?a.Fa(c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra,I):a.call(null,c,d,e,f,g,h,l,m,p,q,s,u,v,y,B,E,N,Y,ra,I);throw Error("Only up to 20 arguments supported on functions");}
var T=function(){function a(a,b,c,d,e){b=be.n(b,c,d,e);c=a.i;return a.f?(d=Yd(b,c+1),d<=c?he(a,d,b):a.f(b)):a.apply(a,rd(b))}function b(a,b,c,d){b=be.c(b,c,d);c=a.i;return a.f?(d=Yd(b,c+1),d<=c?he(a,d,b):a.f(b)):a.apply(a,rd(b))}function c(a,b,c){b=be.a(b,c);c=a.i;if(a.f){var d=Yd(b,c+1);return d<=c?he(a,d,b):a.f(b)}return a.apply(a,rd(b))}function d(a,b){var c=a.i;if(a.f){var d=Yd(b,c+1);return d<=c?he(a,d,b):a.f(b)}return a.apply(a,rd(b))}var e=null,f=function(){function a(c,d,e,f,g,u){var v=null;
if(5<arguments.length){for(var v=0,y=Array(arguments.length-5);v<y.length;)y[v]=arguments[v+5],++v;v=new F(y,0)}return b.call(this,c,d,e,f,g,v)}function b(a,c,d,e,f,g){c=M(c,M(d,M(e,M(f,$d(g)))));d=a.i;return a.f?(e=Yd(c,d+1),e<=d?he(a,e,c):a.f(c)):a.apply(a,rd(c))}a.i=5;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=K(a);var e=G(a);a=K(a);var f=G(a);a=K(a);var g=G(a);a=H(a);return b(c,d,e,f,g,a)};a.d=b;return a}(),e=function(e,h,l,m,p,q){switch(arguments.length){case 2:return d.call(this,e,h);case 3:return c.call(this,
e,h,l);case 4:return b.call(this,e,h,l,m);case 5:return a.call(this,e,h,l,m,p);default:var s=null;if(5<arguments.length){for(var s=0,u=Array(arguments.length-5);s<u.length;)u[s]=arguments[s+5],++s;s=new F(u,0)}return f.d(e,h,l,m,p,s)}throw Error("Invalid arity: "+arguments.length);};e.i=5;e.f=f.f;e.a=d;e.c=c;e.n=b;e.r=a;e.d=f.d;return e}(),ie=function(){function a(a,b,c,d,e,f){var g=O,v=Vc(a);b=b.r?b.r(v,c,d,e,f):b.call(null,v,c,d,e,f);return g(a,b)}function b(a,b,c,d,e){var f=O,g=Vc(a);b=b.n?b.n(g,
c,d,e):b.call(null,g,c,d,e);return f(a,b)}function c(a,b,c,d){var e=O,f=Vc(a);b=b.c?b.c(f,c,d):b.call(null,f,c,d);return e(a,b)}function d(a,b,c){var d=O,e=Vc(a);b=b.a?b.a(e,c):b.call(null,e,c);return d(a,b)}function e(a,b){var c=O,d;d=Vc(a);d=b.b?b.b(d):b.call(null,d);return c(a,d)}var f=null,g=function(){function a(c,d,e,f,g,h,y){var B=null;if(6<arguments.length){for(var B=0,E=Array(arguments.length-6);B<E.length;)E[B]=arguments[B+6],++B;B=new F(E,0)}return b.call(this,c,d,e,f,g,h,B)}function b(a,
c,d,e,f,g,h){return O(a,T.d(c,Vc(a),d,e,f,Kc([g,h],0)))}a.i=6;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=K(a);var e=G(a);a=K(a);var f=G(a);a=K(a);var g=G(a);a=K(a);var h=G(a);a=H(a);return b(c,d,e,f,g,h,a)};a.d=b;return a}(),f=function(f,l,m,p,q,s,u){switch(arguments.length){case 2:return e.call(this,f,l);case 3:return d.call(this,f,l,m);case 4:return c.call(this,f,l,m,p);case 5:return b.call(this,f,l,m,p,q);case 6:return a.call(this,f,l,m,p,q,s);default:var v=null;if(6<arguments.length){for(var v=
0,y=Array(arguments.length-6);v<y.length;)y[v]=arguments[v+6],++v;v=new F(y,0)}return g.d(f,l,m,p,q,s,v)}throw Error("Invalid arity: "+arguments.length);};f.i=6;f.f=g.f;f.a=e;f.c=d;f.n=c;f.r=b;f.P=a;f.d=g.d;return f}(),je=function(){function a(a,b){return!sc.a(a,b)}var b=null,c=function(){function a(c,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return b.call(this,c,d,l)}function b(a,c,d){return Aa(T.n(sc,a,c,d))}a.i=
2;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=H(a);return b(c,d,a)};a.d=b;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return!1;case 2:return a.call(this,b,e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.b=function(){return!1};b.a=a;b.d=c.d;return b}(),qe=function ke(){"undefined"===typeof ja&&(ja=function(b,c){this.pc=
b;this.oc=c;this.q=0;this.j=393216},ja.prototype.ga=function(){return!1},ja.prototype.next=function(){return Error("No such element")},ja.prototype.H=function(){return this.oc},ja.prototype.F=function(b,c){return new ja(this.pc,c)},ja.Yb=!0,ja.Xb="cljs.core/t12660",ja.nc=function(b){return Lb(b,"cljs.core/t12660")});return new ja(ke,new pa(null,5,[le,54,me,2998,ne,3,oe,2994,pe,"/Users/davidnolen/development/clojure/mori/out-mori-adv/cljs/core.cljs"],null))};function re(a,b){this.C=a;this.m=b}
re.prototype.ga=function(){return this.m<this.C.length};re.prototype.next=function(){var a=this.C.charAt(this.m);this.m+=1;return a};function se(a,b){this.e=a;this.m=b}se.prototype.ga=function(){return this.m<this.e.length};se.prototype.next=function(){var a=this.e[this.m];this.m+=1;return a};var te={},ue={};function ve(a,b){this.eb=a;this.Qa=b}ve.prototype.ga=function(){this.eb===te?(this.eb=ue,this.Qa=D(this.Qa)):this.eb===this.Qa&&(this.Qa=K(this.eb));return null!=this.Qa};
ve.prototype.next=function(){if(Aa(this.ga()))throw Error("No such element");this.eb=this.Qa;return G(this.Qa)};function we(a){if(null==a)return qe();if("string"===typeof a)return new re(a,0);if(a instanceof Array)return new se(a,0);if(a?t(t(null)?null:a.vb)||(a.yb?0:w(bc,a)):w(bc,a))return cc(a);if(ld(a))return new ve(te,a);throw Error([z("Cannot create iterator from "),z(a)].join(""));}function xe(a,b){this.fa=a;this.$b=b}
xe.prototype.step=function(a){for(var b=this;;){if(t(function(){var c=null!=a.X;return c?b.$b.ga():c}()))if(Ac(function(){var c=b.$b.next();return b.fa.a?b.fa.a(a,c):b.fa.call(null,a,c)}()))null!=a.M&&(a.M.X=null);else continue;break}return null==a.X?null:b.fa.b?b.fa.b(a):b.fa.call(null,a)};
function ye(a,b){var c=function(){function a(b,c){b.first=c;b.M=new ze(b.X,null,null,null);b.X=null;return b.M}function b(a){(Ac(a)?qb(a):a).X=null;return a}var c=null,c=function(c,f){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,f)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();return new xe(a.b?a.b(c):a.call(null,c),b)}function Ae(a,b,c){this.fa=a;this.Kb=b;this.ac=c}
Ae.prototype.ga=function(){for(var a=D(this.Kb);;)if(null!=a){var b=G(a);if(Aa(b.ga()))return!1;a=K(a)}else return!0};Ae.prototype.next=function(){for(var a=this.Kb.length,b=0;;)if(b<a)this.ac[b]=this.Kb[b].next(),b+=1;else break;return Jc.a(this.ac,0)};Ae.prototype.step=function(a){for(;;){var b;b=(b=null!=a.X)?this.ga():b;if(t(b))if(Ac(T.a(this.fa,M(a,this.next()))))null!=a.M&&(a.M.X=null);else continue;break}return null==a.X?null:this.fa.b?this.fa.b(a):this.fa.call(null,a)};
var Be=function(){function a(a,b,c){var g=function(){function a(b,c){b.first=c;b.M=new ze(b.X,null,null,null);b.X=null;return b.M}function b(a){a=Ac(a)?qb(a):a;a.X=null;return a}var c=null,c=function(c,d){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,d)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();return new Ae(a.b?a.b(g):a.call(null,g),b,c)}function b(a,b){return c.c(a,b,Array(b.length))}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,
c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();function ze(a,b,c,d){this.X=a;this.first=b;this.M=c;this.k=d;this.q=0;this.j=31719628}k=ze.prototype;k.T=function(){null!=this.X&&Cb(this);return null==this.M?null:Cb(this.M)};k.N=function(){null!=this.X&&Cb(this);return null==this.M?null:this.first};k.S=function(){null!=this.X&&Cb(this);return null==this.M?J:this.M};
k.D=function(){null!=this.X&&this.X.step(this);return null==this.M?null:this};k.B=function(){return wc(this)};k.A=function(a,b){return null!=Cb(this)?Ic(this,b):cd(b)&&null==D(b)};k.J=function(){return J};k.G=function(a,b){return M(b,Cb(this))};k.F=function(a,b){return new ze(this.X,this.first,this.M,b)};ze.prototype[Ea]=function(){return uc(this)};
var Ce=function(){function a(a){return kd(a)?a:(a=D(a))?a:J}var b=null,c=function(){function a(c,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return b.call(this,c,d,l)}function b(a,c,d){d=rd(M(c,d));c=[];d=D(d);for(var e=null,m=0,p=0;;)if(p<m){var q=e.Q(null,p);c.push(we(q));p+=1}else if(d=D(d))e=d,fd(e)?(d=Yb(e),p=Zb(e),e=d,m=Q(d),d=p):(d=G(e),c.push(we(d)),d=K(e),e=null,m=0),p=0;else break;return new ze(Be.c(a,c,
Array(c.length)),null,null,null)}a.i=2;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=H(a);return b(c,d,a)};a.d=b;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return a.call(this,b);case 2:return new ze(ye(b,we(e)),null,null,null);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.b=a;b.a=function(a,b){return new ze(ye(a,
we(b)),null,null,null)};b.d=c.d;return b}();function Ee(a,b){for(;;){if(null==D(b))return!0;var c;c=G(b);c=a.b?a.b(c):a.call(null,c);if(t(c)){c=a;var d=K(b);a=c;b=d}else return!1}}function Fe(a,b){for(;;)if(D(b)){var c;c=G(b);c=a.b?a.b(c):a.call(null,c);if(t(c))return c;c=a;var d=K(b);a=c;b=d}else return null}function Ge(a){if("number"===typeof a&&Aa(isNaN(a))&&Infinity!==a&&parseFloat(a)===parseInt(a,10))return 0===(a&1);throw Error([z("Argument must be an integer: "),z(a)].join(""));}
function He(a){return function(){function b(b,c){return Aa(a.a?a.a(b,c):a.call(null,b,c))}function c(b){return Aa(a.b?a.b(b):a.call(null,b))}function d(){return Aa(a.l?a.l():a.call(null))}var e=null,f=function(){function b(a,d,e){var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+2],++f;f=new F(g,0)}return c.call(this,a,d,f)}function c(b,d,e){return Aa(T.n(a,b,d,e))}b.i=2;b.f=function(a){var b=G(a);a=K(a);var d=G(a);a=H(a);return c(b,d,a)};b.d=c;
return b}(),e=function(a,e,l){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,a);case 2:return b.call(this,a,e);default:var m=null;if(2<arguments.length){for(var m=0,p=Array(arguments.length-2);m<p.length;)p[m]=arguments[m+2],++m;m=new F(p,0)}return f.d(a,e,m)}throw Error("Invalid arity: "+arguments.length);};e.i=2;e.f=f.f;e.l=d;e.b=c;e.a=b;e.d=f.d;return e}()}
var Ie=function(){function a(a,b,c){return function(){function d(h,l,m){h=c.c?c.c(h,l,m):c.call(null,h,l,m);h=b.b?b.b(h):b.call(null,h);return a.b?a.b(h):a.call(null,h)}function l(d,h){var l;l=c.a?c.a(d,h):c.call(null,d,h);l=b.b?b.b(l):b.call(null,l);return a.b?a.b(l):a.call(null,l)}function m(d){d=c.b?c.b(d):c.call(null,d);d=b.b?b.b(d):b.call(null,d);return a.b?a.b(d):a.call(null,d)}function p(){var d;d=c.l?c.l():c.call(null);d=b.b?b.b(d):b.call(null,d);return a.b?a.b(d):a.call(null,d)}var q=null,
s=function(){function d(a,b,c,e){var f=null;if(3<arguments.length){for(var f=0,g=Array(arguments.length-3);f<g.length;)g[f]=arguments[f+3],++f;f=new F(g,0)}return h.call(this,a,b,c,f)}function h(d,l,m,p){d=T.r(c,d,l,m,p);d=b.b?b.b(d):b.call(null,d);return a.b?a.b(d):a.call(null,d)}d.i=3;d.f=function(a){var b=G(a);a=K(a);var c=G(a);a=K(a);var d=G(a);a=H(a);return h(b,c,d,a)};d.d=h;return d}(),q=function(a,b,c,e){switch(arguments.length){case 0:return p.call(this);case 1:return m.call(this,a);case 2:return l.call(this,
a,b);case 3:return d.call(this,a,b,c);default:var f=null;if(3<arguments.length){for(var f=0,g=Array(arguments.length-3);f<g.length;)g[f]=arguments[f+3],++f;f=new F(g,0)}return s.d(a,b,c,f)}throw Error("Invalid arity: "+arguments.length);};q.i=3;q.f=s.f;q.l=p;q.b=m;q.a=l;q.c=d;q.d=s.d;return q}()}function b(a,b){return function(){function c(d,g,h){d=b.c?b.c(d,g,h):b.call(null,d,g,h);return a.b?a.b(d):a.call(null,d)}function d(c,g){var h=b.a?b.a(c,g):b.call(null,c,g);return a.b?a.b(h):a.call(null,h)}
function l(c){c=b.b?b.b(c):b.call(null,c);return a.b?a.b(c):a.call(null,c)}function m(){var c=b.l?b.l():b.call(null);return a.b?a.b(c):a.call(null,c)}var p=null,q=function(){function c(a,b,e,f){var g=null;if(3<arguments.length){for(var g=0,h=Array(arguments.length-3);g<h.length;)h[g]=arguments[g+3],++g;g=new F(h,0)}return d.call(this,a,b,e,g)}function d(c,g,h,l){c=T.r(b,c,g,h,l);return a.b?a.b(c):a.call(null,c)}c.i=3;c.f=function(a){var b=G(a);a=K(a);var c=G(a);a=K(a);var e=G(a);a=H(a);return d(b,
c,e,a)};c.d=d;return c}(),p=function(a,b,e,f){switch(arguments.length){case 0:return m.call(this);case 1:return l.call(this,a);case 2:return d.call(this,a,b);case 3:return c.call(this,a,b,e);default:var p=null;if(3<arguments.length){for(var p=0,E=Array(arguments.length-3);p<E.length;)E[p]=arguments[p+3],++p;p=new F(E,0)}return q.d(a,b,e,p)}throw Error("Invalid arity: "+arguments.length);};p.i=3;p.f=q.f;p.l=m;p.b=l;p.a=d;p.c=c;p.d=q.d;return p}()}var c=null,d=function(){function a(c,d,e,m){var p=null;
if(3<arguments.length){for(var p=0,q=Array(arguments.length-3);p<q.length;)q[p]=arguments[p+3],++p;p=new F(q,0)}return b.call(this,c,d,e,p)}function b(a,c,d,e){return function(a){return function(){function b(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return c.call(this,d)}function c(b){b=T.a(G(a),b);for(var d=K(a);;)if(d)b=G(d).call(null,b),d=K(d);else return b}b.i=0;b.f=function(a){a=D(a);return c(a)};b.d=c;return b}()}(Jd(be.n(a,
c,d,e)))}a.i=3;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=K(a);var e=G(a);a=H(a);return b(c,d,e,a)};a.d=b;return a}(),c=function(c,f,g,h){switch(arguments.length){case 0:return ud;case 1:return c;case 2:return b.call(this,c,f);case 3:return a.call(this,c,f,g);default:var l=null;if(3<arguments.length){for(var l=0,m=Array(arguments.length-3);l<m.length;)m[l]=arguments[l+3],++l;l=new F(m,0)}return d.d(c,f,g,l)}throw Error("Invalid arity: "+arguments.length);};c.i=3;c.f=d.f;c.l=function(){return ud};
c.b=function(a){return a};c.a=b;c.c=a;c.d=d.d;return c}(),Je=function(){function a(a,b,c,d){return function(){function e(m,p,q){return a.P?a.P(b,c,d,m,p,q):a.call(null,b,c,d,m,p,q)}function p(e,m){return a.r?a.r(b,c,d,e,m):a.call(null,b,c,d,e,m)}function q(e){return a.n?a.n(b,c,d,e):a.call(null,b,c,d,e)}function s(){return a.c?a.c(b,c,d):a.call(null,b,c,d)}var u=null,v=function(){function e(a,b,c,d){var f=null;if(3<arguments.length){for(var f=0,g=Array(arguments.length-3);f<g.length;)g[f]=arguments[f+
3],++f;f=new F(g,0)}return m.call(this,a,b,c,f)}function m(e,p,q,s){return T.d(a,b,c,d,e,Kc([p,q,s],0))}e.i=3;e.f=function(a){var b=G(a);a=K(a);var c=G(a);a=K(a);var d=G(a);a=H(a);return m(b,c,d,a)};e.d=m;return e}(),u=function(a,b,c,d){switch(arguments.length){case 0:return s.call(this);case 1:return q.call(this,a);case 2:return p.call(this,a,b);case 3:return e.call(this,a,b,c);default:var f=null;if(3<arguments.length){for(var f=0,g=Array(arguments.length-3);f<g.length;)g[f]=arguments[f+3],++f;f=
new F(g,0)}return v.d(a,b,c,f)}throw Error("Invalid arity: "+arguments.length);};u.i=3;u.f=v.f;u.l=s;u.b=q;u.a=p;u.c=e;u.d=v.d;return u}()}function b(a,b,c){return function(){function d(e,l,m){return a.r?a.r(b,c,e,l,m):a.call(null,b,c,e,l,m)}function e(d,l){return a.n?a.n(b,c,d,l):a.call(null,b,c,d,l)}function p(d){return a.c?a.c(b,c,d):a.call(null,b,c,d)}function q(){return a.a?a.a(b,c):a.call(null,b,c)}var s=null,u=function(){function d(a,b,c,f){var g=null;if(3<arguments.length){for(var g=0,h=Array(arguments.length-
3);g<h.length;)h[g]=arguments[g+3],++g;g=new F(h,0)}return e.call(this,a,b,c,g)}function e(d,l,m,p){return T.d(a,b,c,d,l,Kc([m,p],0))}d.i=3;d.f=function(a){var b=G(a);a=K(a);var c=G(a);a=K(a);var d=G(a);a=H(a);return e(b,c,d,a)};d.d=e;return d}(),s=function(a,b,c,f){switch(arguments.length){case 0:return q.call(this);case 1:return p.call(this,a);case 2:return e.call(this,a,b);case 3:return d.call(this,a,b,c);default:var g=null;if(3<arguments.length){for(var g=0,h=Array(arguments.length-3);g<h.length;)h[g]=
arguments[g+3],++g;g=new F(h,0)}return u.d(a,b,c,g)}throw Error("Invalid arity: "+arguments.length);};s.i=3;s.f=u.f;s.l=q;s.b=p;s.a=e;s.c=d;s.d=u.d;return s}()}function c(a,b){return function(){function c(d,e,h){return a.n?a.n(b,d,e,h):a.call(null,b,d,e,h)}function d(c,e){return a.c?a.c(b,c,e):a.call(null,b,c,e)}function e(c){return a.a?a.a(b,c):a.call(null,b,c)}function p(){return a.b?a.b(b):a.call(null,b)}var q=null,s=function(){function c(a,b,e,f){var g=null;if(3<arguments.length){for(var g=0,
h=Array(arguments.length-3);g<h.length;)h[g]=arguments[g+3],++g;g=new F(h,0)}return d.call(this,a,b,e,g)}function d(c,e,h,l){return T.d(a,b,c,e,h,Kc([l],0))}c.i=3;c.f=function(a){var b=G(a);a=K(a);var c=G(a);a=K(a);var e=G(a);a=H(a);return d(b,c,e,a)};c.d=d;return c}(),q=function(a,b,f,g){switch(arguments.length){case 0:return p.call(this);case 1:return e.call(this,a);case 2:return d.call(this,a,b);case 3:return c.call(this,a,b,f);default:var q=null;if(3<arguments.length){for(var q=0,N=Array(arguments.length-
3);q<N.length;)N[q]=arguments[q+3],++q;q=new F(N,0)}return s.d(a,b,f,q)}throw Error("Invalid arity: "+arguments.length);};q.i=3;q.f=s.f;q.l=p;q.b=e;q.a=d;q.c=c;q.d=s.d;return q}()}var d=null,e=function(){function a(c,d,e,f,q){var s=null;if(4<arguments.length){for(var s=0,u=Array(arguments.length-4);s<u.length;)u[s]=arguments[s+4],++s;s=new F(u,0)}return b.call(this,c,d,e,f,s)}function b(a,c,d,e,f){return function(){function b(a){var c=null;if(0<arguments.length){for(var c=0,d=Array(arguments.length-
0);c<d.length;)d[c]=arguments[c+0],++c;c=new F(d,0)}return g.call(this,c)}function g(b){return T.r(a,c,d,e,ae.a(f,b))}b.i=0;b.f=function(a){a=D(a);return g(a)};b.d=g;return b}()}a.i=4;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=K(a);var e=G(a);a=K(a);var f=G(a);a=H(a);return b(c,d,e,f,a)};a.d=b;return a}(),d=function(d,g,h,l,m){switch(arguments.length){case 1:return d;case 2:return c.call(this,d,g);case 3:return b.call(this,d,g,h);case 4:return a.call(this,d,g,h,l);default:var p=null;if(4<arguments.length){for(var p=
0,q=Array(arguments.length-4);p<q.length;)q[p]=arguments[p+4],++p;p=new F(q,0)}return e.d(d,g,h,l,p)}throw Error("Invalid arity: "+arguments.length);};d.i=4;d.f=e.f;d.b=function(a){return a};d.a=c;d.c=b;d.n=a;d.d=e.d;return d}(),Ke=function(){function a(a,b,c,d){return function(){function l(l,m,p){l=null==l?b:l;m=null==m?c:m;p=null==p?d:p;return a.c?a.c(l,m,p):a.call(null,l,m,p)}function m(d,h){var l=null==d?b:d,m=null==h?c:h;return a.a?a.a(l,m):a.call(null,l,m)}var p=null,q=function(){function l(a,
b,c,d){var e=null;if(3<arguments.length){for(var e=0,f=Array(arguments.length-3);e<f.length;)f[e]=arguments[e+3],++e;e=new F(f,0)}return m.call(this,a,b,c,e)}function m(l,p,q,s){return T.r(a,null==l?b:l,null==p?c:p,null==q?d:q,s)}l.i=3;l.f=function(a){var b=G(a);a=K(a);var c=G(a);a=K(a);var d=G(a);a=H(a);return m(b,c,d,a)};l.d=m;return l}(),p=function(a,b,c,d){switch(arguments.length){case 2:return m.call(this,a,b);case 3:return l.call(this,a,b,c);default:var e=null;if(3<arguments.length){for(var e=
0,f=Array(arguments.length-3);e<f.length;)f[e]=arguments[e+3],++e;e=new F(f,0)}return q.d(a,b,c,e)}throw Error("Invalid arity: "+arguments.length);};p.i=3;p.f=q.f;p.a=m;p.c=l;p.d=q.d;return p}()}function b(a,b,c){return function(){function d(h,l,m){h=null==h?b:h;l=null==l?c:l;return a.c?a.c(h,l,m):a.call(null,h,l,m)}function l(d,h){var l=null==d?b:d,m=null==h?c:h;return a.a?a.a(l,m):a.call(null,l,m)}var m=null,p=function(){function d(a,b,c,e){var f=null;if(3<arguments.length){for(var f=0,g=Array(arguments.length-
3);f<g.length;)g[f]=arguments[f+3],++f;f=new F(g,0)}return h.call(this,a,b,c,f)}function h(d,l,m,p){return T.r(a,null==d?b:d,null==l?c:l,m,p)}d.i=3;d.f=function(a){var b=G(a);a=K(a);var c=G(a);a=K(a);var d=G(a);a=H(a);return h(b,c,d,a)};d.d=h;return d}(),m=function(a,b,c,e){switch(arguments.length){case 2:return l.call(this,a,b);case 3:return d.call(this,a,b,c);default:var f=null;if(3<arguments.length){for(var f=0,g=Array(arguments.length-3);f<g.length;)g[f]=arguments[f+3],++f;f=new F(g,0)}return p.d(a,
b,c,f)}throw Error("Invalid arity: "+arguments.length);};m.i=3;m.f=p.f;m.a=l;m.c=d;m.d=p.d;return m}()}function c(a,b){return function(){function c(d,g,h){d=null==d?b:d;return a.c?a.c(d,g,h):a.call(null,d,g,h)}function d(c,g){var h=null==c?b:c;return a.a?a.a(h,g):a.call(null,h,g)}function l(c){c=null==c?b:c;return a.b?a.b(c):a.call(null,c)}var m=null,p=function(){function c(a,b,e,f){var g=null;if(3<arguments.length){for(var g=0,h=Array(arguments.length-3);g<h.length;)h[g]=arguments[g+3],++g;g=new F(h,
0)}return d.call(this,a,b,e,g)}function d(c,g,h,l){return T.r(a,null==c?b:c,g,h,l)}c.i=3;c.f=function(a){var b=G(a);a=K(a);var c=G(a);a=K(a);var e=G(a);a=H(a);return d(b,c,e,a)};c.d=d;return c}(),m=function(a,b,e,f){switch(arguments.length){case 1:return l.call(this,a);case 2:return d.call(this,a,b);case 3:return c.call(this,a,b,e);default:var m=null;if(3<arguments.length){for(var m=0,B=Array(arguments.length-3);m<B.length;)B[m]=arguments[m+3],++m;m=new F(B,0)}return p.d(a,b,e,m)}throw Error("Invalid arity: "+
arguments.length);};m.i=3;m.f=p.f;m.b=l;m.a=d;m.c=c;m.d=p.d;return m}()}var d=null,d=function(d,f,g,h){switch(arguments.length){case 2:return c.call(this,d,f);case 3:return b.call(this,d,f,g);case 4:return a.call(this,d,f,g,h)}throw Error("Invalid arity: "+arguments.length);};d.a=c;d.c=b;d.n=a;return d}(),Le=function(){function a(a,b){return new V(null,function(){var f=D(b);if(f){if(fd(f)){for(var g=Yb(f),h=Q(g),l=Td(h),m=0;;)if(m<h){var p=function(){var b=C.a(g,m);return a.b?a.b(b):a.call(null,b)}();
null!=p&&l.add(p);m+=1}else break;return Wd(l.ca(),c.a(a,Zb(f)))}h=function(){var b=G(f);return a.b?a.b(b):a.call(null,b)}();return null==h?c.a(a,H(f)):M(h,c.a(a,H(f)))}return null},null,null)}function b(a){return function(b){return function(){function c(f,g){var h=a.b?a.b(g):a.call(null,g);return null==h?f:b.a?b.a(f,h):b.call(null,f,h)}function g(a){return b.b?b.b(a):b.call(null,a)}function h(){return b.l?b.l():b.call(null)}var l=null,l=function(a,b){switch(arguments.length){case 0:return h.call(this);
case 1:return g.call(this,a);case 2:return c.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};l.l=h;l.b=g;l.a=c;return l}()}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();function Me(a){this.state=a;this.q=0;this.j=32768}Me.prototype.Ra=function(){return this.state};Me.prototype.bb=function(a,b){return this.state=b};
var Ne=function(){function a(a,b){return function g(b,c){return new V(null,function(){var e=D(c);if(e){if(fd(e)){for(var p=Yb(e),q=Q(p),s=Td(q),u=0;;)if(u<q){var v=function(){var c=b+u,e=C.a(p,u);return a.a?a.a(c,e):a.call(null,c,e)}();null!=v&&s.add(v);u+=1}else break;return Wd(s.ca(),g(b+q,Zb(e)))}q=function(){var c=G(e);return a.a?a.a(b,c):a.call(null,b,c)}();return null==q?g(b+1,H(e)):M(q,g(b+1,H(e)))}return null},null,null)}(0,b)}function b(a){return function(b){return function(c){return function(){function g(g,
h){var l=c.bb(0,c.Ra(null)+1),l=a.a?a.a(l,h):a.call(null,l,h);return null==l?g:b.a?b.a(g,l):b.call(null,g,l)}function h(a){return b.b?b.b(a):b.call(null,a)}function l(){return b.l?b.l():b.call(null)}var m=null,m=function(a,b){switch(arguments.length){case 0:return l.call(this);case 1:return h.call(this,a);case 2:return g.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};m.l=l;m.b=h;m.a=g;return m}()}(new Me(-1))}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Oe=function(){function a(a,b,c,d){return new V(null,function(){var f=D(b),q=D(c),s=D(d);if(f&&q&&s){var u=M,v;v=G(f);var y=G(q),B=G(s);v=a.c?a.c(v,y,B):a.call(null,v,y,B);f=u(v,e.n(a,H(f),H(q),H(s)))}else f=null;return f},null,null)}function b(a,b,c){return new V(null,function(){var d=D(b),f=D(c);if(d&&f){var q=M,s;s=G(d);var u=G(f);s=a.a?a.a(s,u):a.call(null,s,u);d=q(s,e.c(a,H(d),H(f)))}else d=
null;return d},null,null)}function c(a,b){return new V(null,function(){var c=D(b);if(c){if(fd(c)){for(var d=Yb(c),f=Q(d),q=Td(f),s=0;;)if(s<f)Xd(q,function(){var b=C.a(d,s);return a.b?a.b(b):a.call(null,b)}()),s+=1;else break;return Wd(q.ca(),e.a(a,Zb(c)))}return M(function(){var b=G(c);return a.b?a.b(b):a.call(null,b)}(),e.a(a,H(c)))}return null},null,null)}function d(a){return function(b){return function(){function c(d,e){var f=a.b?a.b(e):a.call(null,e);return b.a?b.a(d,f):b.call(null,d,f)}function d(a){return b.b?
b.b(a):b.call(null,a)}function e(){return b.l?b.l():b.call(null)}var f=null,s=function(){function c(a,b,e){var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+2],++f;f=new F(g,0)}return d.call(this,a,b,f)}function d(c,e,f){e=T.c(a,e,f);return b.a?b.a(c,e):b.call(null,c,e)}c.i=2;c.f=function(a){var b=G(a);a=K(a);var c=G(a);a=H(a);return d(b,c,a)};c.d=d;return c}(),f=function(a,b,f){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,
a);case 2:return c.call(this,a,b);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return s.d(a,b,g)}throw Error("Invalid arity: "+arguments.length);};f.i=2;f.f=s.f;f.l=e;f.b=d;f.a=c;f.d=s.d;return f}()}}var e=null,f=function(){function a(c,d,e,f,g){var u=null;if(4<arguments.length){for(var u=0,v=Array(arguments.length-4);u<v.length;)v[u]=arguments[u+4],++u;u=new F(v,0)}return b.call(this,c,d,e,f,u)}function b(a,c,d,
f,g){var h=function y(a){return new V(null,function(){var b=e.a(D,a);return Ee(ud,b)?M(e.a(G,b),y(e.a(H,b))):null},null,null)};return e.a(function(){return function(b){return T.a(a,b)}}(h),h(Nc.d(g,f,Kc([d,c],0))))}a.i=4;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=K(a);var e=G(a);a=K(a);var f=G(a);a=H(a);return b(c,d,e,f,a)};a.d=b;return a}(),e=function(e,h,l,m,p){switch(arguments.length){case 1:return d.call(this,e);case 2:return c.call(this,e,h);case 3:return b.call(this,e,h,l);case 4:return a.call(this,
e,h,l,m);default:var q=null;if(4<arguments.length){for(var q=0,s=Array(arguments.length-4);q<s.length;)s[q]=arguments[q+4],++q;q=new F(s,0)}return f.d(e,h,l,m,q)}throw Error("Invalid arity: "+arguments.length);};e.i=4;e.f=f.f;e.b=d;e.a=c;e.c=b;e.n=a;e.d=f.d;return e}(),Pe=function(){function a(a,b){return new V(null,function(){if(0<a){var f=D(b);return f?M(G(f),c.a(a-1,H(f))):null}return null},null,null)}function b(a){return function(b){return function(a){return function(){function c(d,g){var h=qb(a),
l=a.bb(0,a.Ra(null)-1),h=0<h?b.a?b.a(d,g):b.call(null,d,g):d;return 0<l?h:Ac(h)?h:new yc(h)}function d(a){return b.b?b.b(a):b.call(null,a)}function l(){return b.l?b.l():b.call(null)}var m=null,m=function(a,b){switch(arguments.length){case 0:return l.call(this);case 1:return d.call(this,a);case 2:return c.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};m.l=l;m.b=d;m.a=c;return m}()}(new Me(a))}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,
c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Qe=function(){function a(a,b){return new V(null,function(c){return function(){return c(a,b)}}(function(a,b){for(;;){var c=D(b);if(0<a&&c){var d=a-1,c=H(c);a=d;b=c}else return c}}),null,null)}function b(a){return function(b){return function(a){return function(){function c(d,g){var h=qb(a);a.bb(0,a.Ra(null)-1);return 0<h?d:b.a?b.a(d,g):b.call(null,d,g)}function d(a){return b.b?b.b(a):b.call(null,a)}function l(){return b.l?
b.l():b.call(null)}var m=null,m=function(a,b){switch(arguments.length){case 0:return l.call(this);case 1:return d.call(this,a);case 2:return c.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};m.l=l;m.b=d;m.a=c;return m}()}(new Me(a))}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Re=function(){function a(a,b){return new V(null,function(c){return function(){return c(a,
b)}}(function(a,b){for(;;){var c=D(b),d;if(d=c)d=G(c),d=a.b?a.b(d):a.call(null,d);if(t(d))d=a,c=H(c),a=d,b=c;else return c}}),null,null)}function b(a){return function(b){return function(c){return function(){function g(g,h){var l=qb(c);if(t(t(l)?a.b?a.b(h):a.call(null,h):l))return g;ac(c,null);return b.a?b.a(g,h):b.call(null,g,h)}function h(a){return b.b?b.b(a):b.call(null,a)}function l(){return b.l?b.l():b.call(null)}var m=null,m=function(a,b){switch(arguments.length){case 0:return l.call(this);case 1:return h.call(this,
a);case 2:return g.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};m.l=l;m.b=h;m.a=g;return m}()}(new Me(!0))}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Se=function(){function a(a,b){return Pe.a(a,c.b(b))}function b(a){return new V(null,function(){return M(a,c.b(a))},null,null)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Te=function(){function a(a,b){return Pe.a(a,c.b(b))}function b(a){return new V(null,function(){return M(a.l?a.l():a.call(null),c.b(a))},null,null)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Ue=function(){function a(a,c){return new V(null,function(){var f=
D(a),g=D(c);return f&&g?M(G(f),M(G(g),b.a(H(f),H(g)))):null},null,null)}var b=null,c=function(){function a(b,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return c.call(this,b,d,l)}function c(a,d,e){return new V(null,function(){var c=Oe.a(D,Nc.d(e,d,Kc([a],0)));return Ee(ud,c)?ae.a(Oe.a(G,c),T.a(b,Oe.a(H,c))):null},null,null)}a.i=2;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=H(a);return c(b,d,a)};a.d=c;return a}(),
b=function(b,e,f){switch(arguments.length){case 2:return a.call(this,b,e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.a=a;b.d=c.d;return b}(),We=function(){function a(a){return Ie.a(Oe.b(a),Ve)}var b=null,c=function(){function a(c,d){var h=null;if(1<arguments.length){for(var h=0,l=Array(arguments.length-1);h<l.length;)l[h]=arguments[h+
1],++h;h=new F(l,0)}return b.call(this,c,h)}function b(a,c){return T.a(ae,T.c(Oe,a,c))}a.i=1;a.f=function(a){var c=G(a);a=H(a);return b(c,a)};a.d=b;return a}(),b=function(b,e){switch(arguments.length){case 1:return a.call(this,b);default:var f=null;if(1<arguments.length){for(var f=0,g=Array(arguments.length-1);f<g.length;)g[f]=arguments[f+1],++f;f=new F(g,0)}return c.d(b,f)}throw Error("Invalid arity: "+arguments.length);};b.i=1;b.f=c.f;b.b=a;b.d=c.d;return b}(),Xe=function(){function a(a,b){return new V(null,
function(){var f=D(b);if(f){if(fd(f)){for(var g=Yb(f),h=Q(g),l=Td(h),m=0;;)if(m<h){var p;p=C.a(g,m);p=a.b?a.b(p):a.call(null,p);t(p)&&(p=C.a(g,m),l.add(p));m+=1}else break;return Wd(l.ca(),c.a(a,Zb(f)))}g=G(f);f=H(f);return t(a.b?a.b(g):a.call(null,g))?M(g,c.a(a,f)):c.a(a,f)}return null},null,null)}function b(a){return function(b){return function(){function c(f,g){return t(a.b?a.b(g):a.call(null,g))?b.a?b.a(f,g):b.call(null,f,g):f}function g(a){return b.b?b.b(a):b.call(null,a)}function h(){return b.l?
b.l():b.call(null)}var l=null,l=function(a,b){switch(arguments.length){case 0:return h.call(this);case 1:return g.call(this,a);case 2:return c.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};l.l=h;l.b=g;l.a=c;return l}()}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),Ye=function(){function a(a,b){return Xe.a(He(a),b)}function b(a){return Xe.b(He(a))}
var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();function Ze(a){var b=$e;return function d(a){return new V(null,function(){return M(a,t(b.b?b.b(a):b.call(null,a))?We.d(d,Kc([D.b?D.b(a):D.call(null,a)],0)):null)},null,null)}(a)}
var af=function(){function a(a,b,c){return a&&(a.q&4||a.dc)?O(ce(wd.n(b,de,Ob(a),c)),Vc(a)):wd.n(b,Nc,a,c)}function b(a,b){return null!=a?a&&(a.q&4||a.dc)?O(ce(A.c(Pb,Ob(a),b)),Vc(a)):A.c(Ra,a,b):A.c(Nc,J,b)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),bf=function(){function a(a,b,c,h){return new V(null,function(){var l=D(h);if(l){var m=Pe.a(a,l);return a===
Q(m)?M(m,d.n(a,b,c,Qe.a(b,l))):Ra(J,Pe.a(a,ae.a(m,c)))}return null},null,null)}function b(a,b,c){return new V(null,function(){var h=D(c);if(h){var l=Pe.a(a,h);return a===Q(l)?M(l,d.c(a,b,Qe.a(b,h))):null}return null},null,null)}function c(a,b){return d.c(a,a,b)}var d=null,d=function(d,f,g,h){switch(arguments.length){case 2:return c.call(this,d,f);case 3:return b.call(this,d,f,g);case 4:return a.call(this,d,f,g,h)}throw Error("Invalid arity: "+arguments.length);};d.a=c;d.c=b;d.n=a;return d}(),cf=function(){function a(a,
b,c){var g=jd;for(b=D(b);;)if(b){var h=a;if(h?h.j&256||h.Rb||(h.j?0:w(Za,h)):w(Za,h)){a=S.c(a,G(b),g);if(g===a)return c;b=K(b)}else return c}else return a}function b(a,b){return c.c(a,b,null)}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}(),df=function(){function a(a,b,c,d,f,q){var s=R.c(b,0,null);return(b=Ed(b))?Rc.c(a,s,e.P(S.a(a,s),b,c,d,f,q)):Rc.c(a,s,
function(){var b=S.a(a,s);return c.n?c.n(b,d,f,q):c.call(null,b,d,f,q)}())}function b(a,b,c,d,f){var q=R.c(b,0,null);return(b=Ed(b))?Rc.c(a,q,e.r(S.a(a,q),b,c,d,f)):Rc.c(a,q,function(){var b=S.a(a,q);return c.c?c.c(b,d,f):c.call(null,b,d,f)}())}function c(a,b,c,d){var f=R.c(b,0,null);return(b=Ed(b))?Rc.c(a,f,e.n(S.a(a,f),b,c,d)):Rc.c(a,f,function(){var b=S.a(a,f);return c.a?c.a(b,d):c.call(null,b,d)}())}function d(a,b,c){var d=R.c(b,0,null);return(b=Ed(b))?Rc.c(a,d,e.c(S.a(a,d),b,c)):Rc.c(a,d,function(){var b=
S.a(a,d);return c.b?c.b(b):c.call(null,b)}())}var e=null,f=function(){function a(c,d,e,f,g,u,v){var y=null;if(6<arguments.length){for(var y=0,B=Array(arguments.length-6);y<B.length;)B[y]=arguments[y+6],++y;y=new F(B,0)}return b.call(this,c,d,e,f,g,u,y)}function b(a,c,d,f,g,h,v){var y=R.c(c,0,null);return(c=Ed(c))?Rc.c(a,y,T.d(e,S.a(a,y),c,d,f,Kc([g,h,v],0))):Rc.c(a,y,T.d(d,S.a(a,y),f,g,h,Kc([v],0)))}a.i=6;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=K(a);var e=G(a);a=K(a);var f=G(a);a=K(a);var g=
G(a);a=K(a);var v=G(a);a=H(a);return b(c,d,e,f,g,v,a)};a.d=b;return a}(),e=function(e,h,l,m,p,q,s){switch(arguments.length){case 3:return d.call(this,e,h,l);case 4:return c.call(this,e,h,l,m);case 5:return b.call(this,e,h,l,m,p);case 6:return a.call(this,e,h,l,m,p,q);default:var u=null;if(6<arguments.length){for(var u=0,v=Array(arguments.length-6);u<v.length;)v[u]=arguments[u+6],++u;u=new F(v,0)}return f.d(e,h,l,m,p,q,u)}throw Error("Invalid arity: "+arguments.length);};e.i=6;e.f=f.f;e.c=d;e.n=c;
e.r=b;e.P=a;e.d=f.d;return e}();function ef(a,b){this.u=a;this.e=b}function ff(a){return new ef(a,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null])}function gf(a){return new ef(a.u,Fa(a.e))}function hf(a){a=a.g;return 32>a?0:a-1>>>5<<5}function jf(a,b,c){for(;;){if(0===b)return c;var d=ff(a);d.e[0]=c;c=d;b-=5}}
var lf=function kf(b,c,d,e){var f=gf(d),g=b.g-1>>>c&31;5===c?f.e[g]=e:(d=d.e[g],b=null!=d?kf(b,c-5,d,e):jf(null,c-5,e),f.e[g]=b);return f};function mf(a,b){throw Error([z("No item "),z(a),z(" in vector of length "),z(b)].join(""));}function nf(a,b){if(b>=hf(a))return a.W;for(var c=a.root,d=a.shift;;)if(0<d)var e=d-5,c=c.e[b>>>d&31],d=e;else return c.e}function of(a,b){return 0<=b&&b<a.g?nf(a,b):mf(b,a.g)}
var qf=function pf(b,c,d,e,f){var g=gf(d);if(0===c)g.e[e&31]=f;else{var h=e>>>c&31;b=pf(b,c-5,d.e[h],e,f);g.e[h]=b}return g},sf=function rf(b,c,d){var e=b.g-2>>>c&31;if(5<c){b=rf(b,c-5,d.e[e]);if(null==b&&0===e)return null;d=gf(d);d.e[e]=b;return d}if(0===e)return null;d=gf(d);d.e[e]=null;return d};function tf(a,b,c,d,e,f){this.m=a;this.zb=b;this.e=c;this.oa=d;this.start=e;this.end=f}tf.prototype.ga=function(){return this.m<this.end};
tf.prototype.next=function(){32===this.m-this.zb&&(this.e=nf(this.oa,this.m),this.zb+=32);var a=this.e[this.m&31];this.m+=1;return a};function W(a,b,c,d,e,f){this.k=a;this.g=b;this.shift=c;this.root=d;this.W=e;this.p=f;this.j=167668511;this.q=8196}k=W.prototype;k.toString=function(){return ec(this)};k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){return"number"===typeof b?C.c(this,b,c):c};
k.gb=function(a,b,c){a=0;for(var d=c;;)if(a<this.g){var e=nf(this,a);c=e.length;a:{for(var f=0;;)if(f<c){var g=f+a,h=e[f],d=b.c?b.c(d,g,h):b.call(null,d,g,h);if(Ac(d)){e=d;break a}f+=1}else{e=d;break a}e=void 0}if(Ac(e))return b=e,L.b?L.b(b):L.call(null,b);a+=c;d=e}else return d};k.Q=function(a,b){return of(this,b)[b&31]};k.$=function(a,b,c){return 0<=b&&b<this.g?nf(this,b)[b&31]:c};
k.Ua=function(a,b,c){if(0<=b&&b<this.g)return hf(this)<=b?(a=Fa(this.W),a[b&31]=c,new W(this.k,this.g,this.shift,this.root,a,null)):new W(this.k,this.g,this.shift,qf(this,this.shift,this.root,b,c),this.W,null);if(b===this.g)return Ra(this,c);throw Error([z("Index "),z(b),z(" out of bounds  [0,"),z(this.g),z("]")].join(""));};k.vb=!0;k.fb=function(){var a=this.g;return new tf(0,0,0<Q(this)?nf(this,0):null,this,0,a)};k.H=function(){return this.k};k.L=function(){return this.g};
k.hb=function(){return C.a(this,0)};k.ib=function(){return C.a(this,1)};k.La=function(){return 0<this.g?C.a(this,this.g-1):null};
k.Ma=function(){if(0===this.g)throw Error("Can't pop empty vector");if(1===this.g)return ub(Mc,this.k);if(1<this.g-hf(this))return new W(this.k,this.g-1,this.shift,this.root,this.W.slice(0,-1),null);var a=nf(this,this.g-2),b=sf(this,this.shift,this.root),b=null==b?uf:b,c=this.g-1;return 5<this.shift&&null==b.e[1]?new W(this.k,c,this.shift-5,b.e[0],a,null):new W(this.k,c,this.shift,b,a,null)};k.ab=function(){return 0<this.g?new Hc(this,this.g-1,null):null};
k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){if(b instanceof W)if(this.g===Q(b))for(var c=cc(this),d=cc(b);;)if(t(c.ga())){var e=c.next(),f=d.next();if(!sc.a(e,f))return!1}else return!0;else return!1;else return Ic(this,b)};k.$a=function(){var a=this;return new vf(a.g,a.shift,function(){var b=a.root;return wf.b?wf.b(b):wf.call(null,b)}(),function(){var b=a.W;return xf.b?xf.b(b):xf.call(null,b)}())};k.J=function(){return O(Mc,this.k)};
k.R=function(a,b){return Cc.a(this,b)};k.O=function(a,b,c){a=0;for(var d=c;;)if(a<this.g){var e=nf(this,a);c=e.length;a:{for(var f=0;;)if(f<c){var g=e[f],d=b.a?b.a(d,g):b.call(null,d,g);if(Ac(d)){e=d;break a}f+=1}else{e=d;break a}e=void 0}if(Ac(e))return b=e,L.b?L.b(b):L.call(null,b);a+=c;d=e}else return d};k.Ka=function(a,b,c){if("number"===typeof b)return pb(this,b,c);throw Error("Vector's key for assoc must be a number.");};
k.D=function(){if(0===this.g)return null;if(32>=this.g)return new F(this.W,0);var a;a:{a=this.root;for(var b=this.shift;;)if(0<b)b-=5,a=a.e[0];else{a=a.e;break a}a=void 0}return yf.n?yf.n(this,a,0,0):yf.call(null,this,a,0,0)};k.F=function(a,b){return new W(b,this.g,this.shift,this.root,this.W,this.p)};
k.G=function(a,b){if(32>this.g-hf(this)){for(var c=this.W.length,d=Array(c+1),e=0;;)if(e<c)d[e]=this.W[e],e+=1;else break;d[c]=b;return new W(this.k,this.g+1,this.shift,this.root,d,null)}c=(d=this.g>>>5>1<<this.shift)?this.shift+5:this.shift;d?(d=ff(null),d.e[0]=this.root,e=jf(null,this.shift,new ef(null,this.W)),d.e[1]=e):d=lf(this,this.shift,this.root,new ef(null,this.W));return new W(this.k,this.g+1,c,d,[b],null)};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.Q(null,c);case 3:return this.$(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.Q(null,c)};a.c=function(a,c,d){return this.$(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.Q(null,a)};k.a=function(a,b){return this.$(null,a,b)};
var uf=new ef(null,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]),Mc=new W(null,0,5,uf,[],0);W.prototype[Ea]=function(){return uc(this)};function zf(a){return Qb(A.c(Pb,Ob(Mc),a))}
var Af=function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){if(a instanceof F&&0===a.m)a:{a=a.e;var b=a.length;if(32>b)a=new W(null,b,5,uf,a,null);else{for(var e=32,f=(new W(null,32,5,uf,a.slice(0,32),null)).$a(null);;)if(e<b)var g=e+1,f=de.a(f,a[e]),e=g;else{a=Qb(f);break a}a=void 0}}else a=zf(a);return a}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}();
function Bf(a,b,c,d,e,f){this.ha=a;this.Ja=b;this.m=c;this.V=d;this.k=e;this.p=f;this.j=32375020;this.q=1536}k=Bf.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};k.T=function(){if(this.V+1<this.Ja.length){var a;a=this.ha;var b=this.Ja,c=this.m,d=this.V+1;a=yf.n?yf.n(a,b,c,d):yf.call(null,a,b,c,d);return null==a?null:a}return $b(this)};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(Mc,this.k)};
k.R=function(a,b){var c=this;return Cc.a(function(){var a=c.ha,b=c.m+c.V,f=Q(c.ha);return Cf.c?Cf.c(a,b,f):Cf.call(null,a,b,f)}(),b)};k.O=function(a,b,c){var d=this;return Cc.c(function(){var a=d.ha,b=d.m+d.V,c=Q(d.ha);return Cf.c?Cf.c(a,b,c):Cf.call(null,a,b,c)}(),b,c)};k.N=function(){return this.Ja[this.V]};k.S=function(){if(this.V+1<this.Ja.length){var a;a=this.ha;var b=this.Ja,c=this.m,d=this.V+1;a=yf.n?yf.n(a,b,c,d):yf.call(null,a,b,c,d);return null==a?J:a}return Zb(this)};k.D=function(){return this};
k.Cb=function(){return Ud.a(this.Ja,this.V)};k.Db=function(){var a=this.m+this.Ja.length;if(a<Ma(this.ha)){var b=this.ha,c=nf(this.ha,a);return yf.n?yf.n(b,c,a,0):yf.call(null,b,c,a,0)}return J};k.F=function(a,b){var c=this.ha,d=this.Ja,e=this.m,f=this.V;return yf.r?yf.r(c,d,e,f,b):yf.call(null,c,d,e,f,b)};k.G=function(a,b){return M(b,this)};k.Bb=function(){var a=this.m+this.Ja.length;if(a<Ma(this.ha)){var b=this.ha,c=nf(this.ha,a);return yf.n?yf.n(b,c,a,0):yf.call(null,b,c,a,0)}return null};
Bf.prototype[Ea]=function(){return uc(this)};var yf=function(){function a(a,b,c,d,l){return new Bf(a,b,c,d,l,null)}function b(a,b,c,d){return new Bf(a,b,c,d,null,null)}function c(a,b,c){return new Bf(a,of(a,b),b,c,null,null)}var d=null,d=function(d,f,g,h,l){switch(arguments.length){case 3:return c.call(this,d,f,g);case 4:return b.call(this,d,f,g,h);case 5:return a.call(this,d,f,g,h,l)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.n=b;d.r=a;return d}();
function Df(a,b,c,d,e){this.k=a;this.oa=b;this.start=c;this.end=d;this.p=e;this.j=166617887;this.q=8192}k=Df.prototype;k.toString=function(){return ec(this)};k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){return"number"===typeof b?C.c(this,b,c):c};k.Q=function(a,b){return 0>b||this.end<=this.start+b?mf(b,this.end-this.start):C.a(this.oa,this.start+b)};k.$=function(a,b,c){return 0>b||this.end<=this.start+b?c:C.c(this.oa,this.start+b,c)};
k.Ua=function(a,b,c){var d=this.start+b;a=this.k;c=Rc.c(this.oa,d,c);b=this.start;var e=this.end,d=d+1,d=e>d?e:d;return Ef.r?Ef.r(a,c,b,d,null):Ef.call(null,a,c,b,d,null)};k.H=function(){return this.k};k.L=function(){return this.end-this.start};k.La=function(){return C.a(this.oa,this.end-1)};k.Ma=function(){if(this.start===this.end)throw Error("Can't pop empty vector");var a=this.k,b=this.oa,c=this.start,d=this.end-1;return Ef.r?Ef.r(a,b,c,d,null):Ef.call(null,a,b,c,d,null)};
k.ab=function(){return this.start!==this.end?new Hc(this,this.end-this.start-1,null):null};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(Mc,this.k)};k.R=function(a,b){return Cc.a(this,b)};k.O=function(a,b,c){return Cc.c(this,b,c)};k.Ka=function(a,b,c){if("number"===typeof b)return pb(this,b,c);throw Error("Subvec's key for assoc must be a number.");};
k.D=function(){var a=this;return function(b){return function d(e){return e===a.end?null:M(C.a(a.oa,e),new V(null,function(){return function(){return d(e+1)}}(b),null,null))}}(this)(a.start)};k.F=function(a,b){var c=this.oa,d=this.start,e=this.end,f=this.p;return Ef.r?Ef.r(b,c,d,e,f):Ef.call(null,b,c,d,e,f)};k.G=function(a,b){var c=this.k,d=pb(this.oa,this.end,b),e=this.start,f=this.end+1;return Ef.r?Ef.r(c,d,e,f,null):Ef.call(null,c,d,e,f,null)};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.Q(null,c);case 3:return this.$(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.Q(null,c)};a.c=function(a,c,d){return this.$(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.Q(null,a)};k.a=function(a,b){return this.$(null,a,b)};Df.prototype[Ea]=function(){return uc(this)};
function Ef(a,b,c,d,e){for(;;)if(b instanceof Df)c=b.start+c,d=b.start+d,b=b.oa;else{var f=Q(b);if(0>c||0>d||c>f||d>f)throw Error("Index out of bounds");return new Df(a,b,c,d,e)}}var Cf=function(){function a(a,b,c){return Ef(null,a,b,c,null)}function b(a,b){return c.c(a,b,Q(a))}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();
function Ff(a,b){return a===b.u?b:new ef(a,Fa(b.e))}function wf(a){return new ef({},Fa(a.e))}function xf(a){var b=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];hd(a,0,b,0,a.length);return b}
var Hf=function Gf(b,c,d,e){d=Ff(b.root.u,d);var f=b.g-1>>>c&31;if(5===c)b=e;else{var g=d.e[f];b=null!=g?Gf(b,c-5,g,e):jf(b.root.u,c-5,e)}d.e[f]=b;return d},Jf=function If(b,c,d){d=Ff(b.root.u,d);var e=b.g-2>>>c&31;if(5<c){b=If(b,c-5,d.e[e]);if(null==b&&0===e)return null;d.e[e]=b;return d}if(0===e)return null;d.e[e]=null;return d};function vf(a,b,c,d){this.g=a;this.shift=b;this.root=c;this.W=d;this.j=275;this.q=88}k=vf.prototype;
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.t(null,c);case 3:return this.s(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.t(null,c)};a.c=function(a,c,d){return this.s(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.t(null,a)};k.a=function(a,b){return this.s(null,a,b)};k.t=function(a,b){return $a.c(this,b,null)};
k.s=function(a,b,c){return"number"===typeof b?C.c(this,b,c):c};k.Q=function(a,b){if(this.root.u)return of(this,b)[b&31];throw Error("nth after persistent!");};k.$=function(a,b,c){return 0<=b&&b<this.g?C.a(this,b):c};k.L=function(){if(this.root.u)return this.g;throw Error("count after persistent!");};
k.Ub=function(a,b,c){var d=this;if(d.root.u){if(0<=b&&b<d.g)return hf(this)<=b?d.W[b&31]=c:(a=function(){return function f(a,h){var l=Ff(d.root.u,h);if(0===a)l.e[b&31]=c;else{var m=b>>>a&31,p=f(a-5,l.e[m]);l.e[m]=p}return l}}(this).call(null,d.shift,d.root),d.root=a),this;if(b===d.g)return Pb(this,c);throw Error([z("Index "),z(b),z(" out of bounds for TransientVector of length"),z(d.g)].join(""));}throw Error("assoc! after persistent!");};
k.Vb=function(){if(this.root.u){if(0===this.g)throw Error("Can't pop empty vector");if(1===this.g)this.g=0;else if(0<(this.g-1&31))this.g-=1;else{var a;a:if(a=this.g-2,a>=hf(this))a=this.W;else{for(var b=this.root,c=b,d=this.shift;;)if(0<d)c=Ff(b.u,c.e[a>>>d&31]),d-=5;else{a=c.e;break a}a=void 0}b=Jf(this,this.shift,this.root);b=null!=b?b:new ef(this.root.u,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,
null,null,null,null]);5<this.shift&&null==b.e[1]?(this.root=Ff(this.root.u,b.e[0]),this.shift-=5):this.root=b;this.g-=1;this.W=a}return this}throw Error("pop! after persistent!");};k.kb=function(a,b,c){if("number"===typeof b)return Tb(this,b,c);throw Error("TransientVector's key for assoc! must be a number.");};
k.Sa=function(a,b){if(this.root.u){if(32>this.g-hf(this))this.W[this.g&31]=b;else{var c=new ef(this.root.u,this.W),d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];d[0]=b;this.W=d;if(this.g>>>5>1<<this.shift){var d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],e=this.shift+
5;d[0]=this.root;d[1]=jf(this.root.u,this.shift,c);this.root=new ef(this.root.u,d);this.shift=e}else this.root=Hf(this,this.shift,this.root,c)}this.g+=1;return this}throw Error("conj! after persistent!");};k.Ta=function(){if(this.root.u){this.root.u=null;var a=this.g-hf(this),b=Array(a);hd(this.W,0,b,0,a);return new W(null,this.g,this.shift,this.root,b,null)}throw Error("persistent! called twice");};function Kf(a,b,c,d){this.k=a;this.ea=b;this.sa=c;this.p=d;this.q=0;this.j=31850572}k=Kf.prototype;
k.toString=function(){return ec(this)};k.H=function(){return this.k};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.k)};k.N=function(){return G(this.ea)};k.S=function(){var a=K(this.ea);return a?new Kf(this.k,a,this.sa,null):null==this.sa?Na(this):new Kf(this.k,this.sa,null,null)};k.D=function(){return this};k.F=function(a,b){return new Kf(b,this.ea,this.sa,this.p)};k.G=function(a,b){return M(b,this)};
Kf.prototype[Ea]=function(){return uc(this)};function Lf(a,b,c,d,e){this.k=a;this.count=b;this.ea=c;this.sa=d;this.p=e;this.j=31858766;this.q=8192}k=Lf.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};k.L=function(){return this.count};k.La=function(){return G(this.ea)};k.Ma=function(){if(t(this.ea)){var a=K(this.ea);return a?new Lf(this.k,this.count-1,a,this.sa,null):new Lf(this.k,this.count-1,D(this.sa),Mc,null)}return this};
k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(Mf,this.k)};k.N=function(){return G(this.ea)};k.S=function(){return H(D(this))};k.D=function(){var a=D(this.sa),b=this.ea;return t(t(b)?b:a)?new Kf(null,this.ea,D(a),null):null};k.F=function(a,b){return new Lf(b,this.count,this.ea,this.sa,this.p)};
k.G=function(a,b){var c;t(this.ea)?(c=this.sa,c=new Lf(this.k,this.count+1,this.ea,Nc.a(t(c)?c:Mc,b),null)):c=new Lf(this.k,this.count+1,Nc.a(this.ea,b),Mc,null);return c};var Mf=new Lf(null,0,null,Mc,0);Lf.prototype[Ea]=function(){return uc(this)};function Nf(){this.q=0;this.j=2097152}Nf.prototype.A=function(){return!1};var Of=new Nf;function Pf(a,b){return md(dd(b)?Q(a)===Q(b)?Ee(ud,Oe.a(function(a){return sc.a(S.c(b,G(a),Of),Lc(a))},a)):null:null)}
function Qf(a,b){var c=a.e;if(b instanceof U)a:{for(var d=c.length,e=b.pa,f=0;;){if(d<=f){c=-1;break a}var g=c[f];if(g instanceof U&&e===g.pa){c=f;break a}f+=2}c=void 0}else if(d="string"==typeof b,t(t(d)?d:"number"===typeof b))a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(b===c[e]){c=e;break a}e+=2}c=void 0}else if(b instanceof qc)a:{d=c.length;e=b.ta;for(f=0;;){if(d<=f){c=-1;break a}g=c[f];if(g instanceof qc&&e===g.ta){c=f;break a}f+=2}c=void 0}else if(null==b)a:{d=c.length;for(e=0;;){if(d<=
e){c=-1;break a}if(null==c[e]){c=e;break a}e+=2}c=void 0}else a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(sc.a(b,c[e])){c=e;break a}e+=2}c=void 0}return c}function Rf(a,b,c){this.e=a;this.m=b;this.Z=c;this.q=0;this.j=32374990}k=Rf.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.Z};k.T=function(){return this.m<this.e.length-2?new Rf(this.e,this.m+2,this.Z):null};k.L=function(){return(this.e.length-this.m)/2};k.B=function(){return wc(this)};
k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.Z)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return new W(null,2,5,uf,[this.e[this.m],this.e[this.m+1]],null)};k.S=function(){return this.m<this.e.length-2?new Rf(this.e,this.m+2,this.Z):J};k.D=function(){return this};k.F=function(a,b){return new Rf(this.e,this.m,b)};k.G=function(a,b){return M(b,this)};Rf.prototype[Ea]=function(){return uc(this)};
function Sf(a,b,c){this.e=a;this.m=b;this.g=c}Sf.prototype.ga=function(){return this.m<this.g};Sf.prototype.next=function(){var a=new W(null,2,5,uf,[this.e[this.m],this.e[this.m+1]],null);this.m+=2;return a};function pa(a,b,c,d){this.k=a;this.g=b;this.e=c;this.p=d;this.j=16647951;this.q=8196}k=pa.prototype;k.toString=function(){return ec(this)};k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){a=Qf(this,b);return-1===a?c:this.e[a+1]};
k.gb=function(a,b,c){a=this.e.length;for(var d=0;;)if(d<a){var e=this.e[d],f=this.e[d+1];c=b.c?b.c(c,e,f):b.call(null,c,e,f);if(Ac(c))return b=c,L.b?L.b(b):L.call(null,b);d+=2}else return c};k.vb=!0;k.fb=function(){return new Sf(this.e,0,2*this.g)};k.H=function(){return this.k};k.L=function(){return this.g};k.B=function(){var a=this.p;return null!=a?a:this.p=a=xc(this)};
k.A=function(a,b){if(b&&(b.j&1024||b.ic)){var c=this.e.length;if(this.g===b.L(null))for(var d=0;;)if(d<c){var e=b.s(null,this.e[d],jd);if(e!==jd)if(sc.a(this.e[d+1],e))d+=2;else return!1;else return!1}else return!0;else return!1}else return Pf(this,b)};k.$a=function(){return new Tf({},this.e.length,Fa(this.e))};k.J=function(){return ub(Uf,this.k)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};
k.wb=function(a,b){if(0<=Qf(this,b)){var c=this.e.length,d=c-2;if(0===d)return Na(this);for(var d=Array(d),e=0,f=0;;){if(e>=c)return new pa(this.k,this.g-1,d,null);sc.a(b,this.e[e])||(d[f]=this.e[e],d[f+1]=this.e[e+1],f+=2);e+=2}}else return this};
k.Ka=function(a,b,c){a=Qf(this,b);if(-1===a){if(this.g<Vf){a=this.e;for(var d=a.length,e=Array(d+2),f=0;;)if(f<d)e[f]=a[f],f+=1;else break;e[d]=b;e[d+1]=c;return new pa(this.k,this.g+1,e,null)}return ub(cb(af.a(Qc,this),b,c),this.k)}if(c===this.e[a+1])return this;b=Fa(this.e);b[a+1]=c;return new pa(this.k,this.g,b,null)};k.rb=function(a,b){return-1!==Qf(this,b)};k.D=function(){var a=this.e;return 0<=a.length-2?new Rf(a,0,null):null};k.F=function(a,b){return new pa(b,this.g,this.e,this.p)};
k.G=function(a,b){if(ed(b))return cb(this,C.a(b,0),C.a(b,1));for(var c=this,d=D(b);;){if(null==d)return c;var e=G(d);if(ed(e))c=cb(c,C.a(e,0),C.a(e,1)),d=K(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.t(null,c);case 3:return this.s(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.t(null,c)};a.c=function(a,c,d){return this.s(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.t(null,a)};k.a=function(a,b){return this.s(null,a,b)};var Uf=new pa(null,0,[],null),Vf=8;pa.prototype[Ea]=function(){return uc(this)};
function Tf(a,b,c){this.Va=a;this.qa=b;this.e=c;this.q=56;this.j=258}k=Tf.prototype;k.Jb=function(a,b){if(t(this.Va)){var c=Qf(this,b);0<=c&&(this.e[c]=this.e[this.qa-2],this.e[c+1]=this.e[this.qa-1],c=this.e,c.pop(),c.pop(),this.qa-=2);return this}throw Error("dissoc! after persistent!");};
k.kb=function(a,b,c){var d=this;if(t(d.Va)){a=Qf(this,b);if(-1===a)return d.qa+2<=2*Vf?(d.qa+=2,d.e.push(b),d.e.push(c),this):ee.c(function(){var a=d.qa,b=d.e;return Xf.a?Xf.a(a,b):Xf.call(null,a,b)}(),b,c);c!==d.e[a+1]&&(d.e[a+1]=c);return this}throw Error("assoc! after persistent!");};
k.Sa=function(a,b){if(t(this.Va)){if(b?b.j&2048||b.jc||(b.j?0:w(fb,b)):w(fb,b))return Rb(this,Yf.b?Yf.b(b):Yf.call(null,b),Zf.b?Zf.b(b):Zf.call(null,b));for(var c=D(b),d=this;;){var e=G(c);if(t(e))var f=e,c=K(c),d=Rb(d,function(){var a=f;return Yf.b?Yf.b(a):Yf.call(null,a)}(),function(){var a=f;return Zf.b?Zf.b(a):Zf.call(null,a)}());else return d}}else throw Error("conj! after persistent!");};
k.Ta=function(){if(t(this.Va))return this.Va=!1,new pa(null,Cd(this.qa,2),this.e,null);throw Error("persistent! called twice");};k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){if(t(this.Va))return a=Qf(this,b),-1===a?c:this.e[a+1];throw Error("lookup after persistent!");};k.L=function(){if(t(this.Va))return Cd(this.qa,2);throw Error("count after persistent!");};function Xf(a,b){for(var c=Ob(Qc),d=0;;)if(d<a)c=ee.c(c,b[d],b[d+1]),d+=2;else return c}function $f(){this.o=!1}
function ag(a,b){return a===b?!0:Nd(a,b)?!0:sc.a(a,b)}var bg=function(){function a(a,b,c,g,h){a=Fa(a);a[b]=c;a[g]=h;return a}function b(a,b,c){a=Fa(a);a[b]=c;return a}var c=null,c=function(c,e,f,g,h){switch(arguments.length){case 3:return b.call(this,c,e,f);case 5:return a.call(this,c,e,f,g,h)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.r=a;return c}();function cg(a,b){var c=Array(a.length-2);hd(a,0,c,0,2*b);hd(a,2*(b+1),c,2*b,c.length-2*b);return c}
var dg=function(){function a(a,b,c,g,h,l){a=a.Na(b);a.e[c]=g;a.e[h]=l;return a}function b(a,b,c,g){a=a.Na(b);a.e[c]=g;return a}var c=null,c=function(c,e,f,g,h,l){switch(arguments.length){case 4:return b.call(this,c,e,f,g);case 6:return a.call(this,c,e,f,g,h,l)}throw Error("Invalid arity: "+arguments.length);};c.n=b;c.P=a;return c}();
function eg(a,b,c){for(var d=a.length,e=0,f=c;;)if(e<d){c=a[e];if(null!=c){var g=a[e+1];c=b.c?b.c(f,c,g):b.call(null,f,c,g)}else c=a[e+1],c=null!=c?c.Xa(b,f):f;if(Ac(c))return a=c,L.b?L.b(a):L.call(null,a);e+=2;f=c}else return f}function fg(a,b,c){this.u=a;this.w=b;this.e=c}k=fg.prototype;k.Na=function(a){if(a===this.u)return this;var b=Dd(this.w),c=Array(0>b?4:2*(b+1));hd(this.e,0,c,0,2*b);return new fg(a,this.w,c)};
k.nb=function(a,b,c,d,e){var f=1<<(c>>>b&31);if(0===(this.w&f))return this;var g=Dd(this.w&f-1),h=this.e[2*g],l=this.e[2*g+1];return null==h?(b=l.nb(a,b+5,c,d,e),b===l?this:null!=b?dg.n(this,a,2*g+1,b):this.w===f?null:gg(this,a,f,g)):ag(d,h)?(e[0]=!0,gg(this,a,f,g)):this};function gg(a,b,c,d){if(a.w===c)return null;a=a.Na(b);b=a.e;var e=b.length;a.w^=c;hd(b,2*(d+1),b,2*d,e-2*(d+1));b[e-2]=null;b[e-1]=null;return a}k.lb=function(){var a=this.e;return hg.b?hg.b(a):hg.call(null,a)};
k.Xa=function(a,b){return eg(this.e,a,b)};k.Oa=function(a,b,c,d){var e=1<<(b>>>a&31);if(0===(this.w&e))return d;var f=Dd(this.w&e-1),e=this.e[2*f],f=this.e[2*f+1];return null==e?f.Oa(a+5,b,c,d):ag(c,e)?f:d};
k.la=function(a,b,c,d,e,f){var g=1<<(c>>>b&31),h=Dd(this.w&g-1);if(0===(this.w&g)){var l=Dd(this.w);if(2*l<this.e.length){var m=this.Na(a),p=m.e;f.o=!0;id(p,2*h,p,2*(h+1),2*(l-h));p[2*h]=d;p[2*h+1]=e;m.w|=g;return m}if(16<=l){g=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];g[c>>>b&31]=ig.la(a,b+5,c,d,e,f);for(m=h=0;;)if(32>h)0!==(this.w>>>h&1)&&(g[h]=null!=this.e[m]?ig.la(a,b+5,nc(this.e[m]),
this.e[m],this.e[m+1],f):this.e[m+1],m+=2),h+=1;else break;return new jg(a,l+1,g)}p=Array(2*(l+4));hd(this.e,0,p,0,2*h);p[2*h]=d;p[2*h+1]=e;hd(this.e,2*h,p,2*(h+1),2*(l-h));f.o=!0;m=this.Na(a);m.e=p;m.w|=g;return m}var q=this.e[2*h],s=this.e[2*h+1];if(null==q)return l=s.la(a,b+5,c,d,e,f),l===s?this:dg.n(this,a,2*h+1,l);if(ag(d,q))return e===s?this:dg.n(this,a,2*h+1,e);f.o=!0;return dg.P(this,a,2*h,null,2*h+1,function(){var f=b+5;return kg.ia?kg.ia(a,f,q,s,c,d,e):kg.call(null,a,f,q,s,c,d,e)}())};
k.ka=function(a,b,c,d,e){var f=1<<(b>>>a&31),g=Dd(this.w&f-1);if(0===(this.w&f)){var h=Dd(this.w);if(16<=h){f=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];f[b>>>a&31]=ig.ka(a+5,b,c,d,e);for(var l=g=0;;)if(32>g)0!==(this.w>>>g&1)&&(f[g]=null!=this.e[l]?ig.ka(a+5,nc(this.e[l]),this.e[l],this.e[l+1],e):this.e[l+1],l+=2),g+=1;else break;return new jg(null,h+1,f)}l=Array(2*(h+1));hd(this.e,
0,l,0,2*g);l[2*g]=c;l[2*g+1]=d;hd(this.e,2*g,l,2*(g+1),2*(h-g));e.o=!0;return new fg(null,this.w|f,l)}var m=this.e[2*g],p=this.e[2*g+1];if(null==m)return h=p.ka(a+5,b,c,d,e),h===p?this:new fg(null,this.w,bg.c(this.e,2*g+1,h));if(ag(c,m))return d===p?this:new fg(null,this.w,bg.c(this.e,2*g+1,d));e.o=!0;return new fg(null,this.w,bg.r(this.e,2*g,null,2*g+1,function(){var e=a+5;return kg.P?kg.P(e,m,p,b,c,d):kg.call(null,e,m,p,b,c,d)}()))};
k.mb=function(a,b,c){var d=1<<(b>>>a&31);if(0===(this.w&d))return this;var e=Dd(this.w&d-1),f=this.e[2*e],g=this.e[2*e+1];return null==f?(a=g.mb(a+5,b,c),a===g?this:null!=a?new fg(null,this.w,bg.c(this.e,2*e+1,a)):this.w===d?null:new fg(null,this.w^d,cg(this.e,e))):ag(c,f)?new fg(null,this.w^d,cg(this.e,e)):this};var ig=new fg(null,0,[]);
function lg(a,b,c){var d=a.e,e=d.length;a=Array(2*(a.g-1));for(var f=0,g=1,h=0;;)if(f<e)f!==c&&null!=d[f]&&(a[g]=d[f],g+=2,h|=1<<f),f+=1;else return new fg(b,h,a)}function jg(a,b,c){this.u=a;this.g=b;this.e=c}k=jg.prototype;k.Na=function(a){return a===this.u?this:new jg(a,this.g,Fa(this.e))};
k.nb=function(a,b,c,d,e){var f=c>>>b&31,g=this.e[f];if(null==g)return this;b=g.nb(a,b+5,c,d,e);if(b===g)return this;if(null==b){if(8>=this.g)return lg(this,a,f);a=dg.n(this,a,f,b);a.g-=1;return a}return dg.n(this,a,f,b)};k.lb=function(){var a=this.e;return mg.b?mg.b(a):mg.call(null,a)};k.Xa=function(a,b){for(var c=this.e.length,d=0,e=b;;)if(d<c){var f=this.e[d];if(null!=f&&(e=f.Xa(a,e),Ac(e)))return c=e,L.b?L.b(c):L.call(null,c);d+=1}else return e};
k.Oa=function(a,b,c,d){var e=this.e[b>>>a&31];return null!=e?e.Oa(a+5,b,c,d):d};k.la=function(a,b,c,d,e,f){var g=c>>>b&31,h=this.e[g];if(null==h)return a=dg.n(this,a,g,ig.la(a,b+5,c,d,e,f)),a.g+=1,a;b=h.la(a,b+5,c,d,e,f);return b===h?this:dg.n(this,a,g,b)};k.ka=function(a,b,c,d,e){var f=b>>>a&31,g=this.e[f];if(null==g)return new jg(null,this.g+1,bg.c(this.e,f,ig.ka(a+5,b,c,d,e)));a=g.ka(a+5,b,c,d,e);return a===g?this:new jg(null,this.g,bg.c(this.e,f,a))};
k.mb=function(a,b,c){var d=b>>>a&31,e=this.e[d];return null!=e?(a=e.mb(a+5,b,c),a===e?this:null==a?8>=this.g?lg(this,null,d):new jg(null,this.g-1,bg.c(this.e,d,a)):new jg(null,this.g,bg.c(this.e,d,a))):this};function ng(a,b,c){b*=2;for(var d=0;;)if(d<b){if(ag(c,a[d]))return d;d+=2}else return-1}function og(a,b,c,d){this.u=a;this.Ia=b;this.g=c;this.e=d}k=og.prototype;k.Na=function(a){if(a===this.u)return this;var b=Array(2*(this.g+1));hd(this.e,0,b,0,2*this.g);return new og(a,this.Ia,this.g,b)};
k.nb=function(a,b,c,d,e){b=ng(this.e,this.g,d);if(-1===b)return this;e[0]=!0;if(1===this.g)return null;a=this.Na(a);e=a.e;e[b]=e[2*this.g-2];e[b+1]=e[2*this.g-1];e[2*this.g-1]=null;e[2*this.g-2]=null;a.g-=1;return a};k.lb=function(){var a=this.e;return hg.b?hg.b(a):hg.call(null,a)};k.Xa=function(a,b){return eg(this.e,a,b)};k.Oa=function(a,b,c,d){a=ng(this.e,this.g,c);return 0>a?d:ag(c,this.e[a])?this.e[a+1]:d};
k.la=function(a,b,c,d,e,f){if(c===this.Ia){b=ng(this.e,this.g,d);if(-1===b){if(this.e.length>2*this.g)return a=dg.P(this,a,2*this.g,d,2*this.g+1,e),f.o=!0,a.g+=1,a;c=this.e.length;b=Array(c+2);hd(this.e,0,b,0,c);b[c]=d;b[c+1]=e;f.o=!0;f=this.g+1;a===this.u?(this.e=b,this.g=f,a=this):a=new og(this.u,this.Ia,f,b);return a}return this.e[b+1]===e?this:dg.n(this,a,b+1,e)}return(new fg(a,1<<(this.Ia>>>b&31),[null,this,null,null])).la(a,b,c,d,e,f)};
k.ka=function(a,b,c,d,e){return b===this.Ia?(a=ng(this.e,this.g,c),-1===a?(a=2*this.g,b=Array(a+2),hd(this.e,0,b,0,a),b[a]=c,b[a+1]=d,e.o=!0,new og(null,this.Ia,this.g+1,b)):sc.a(this.e[a],d)?this:new og(null,this.Ia,this.g,bg.c(this.e,a+1,d))):(new fg(null,1<<(this.Ia>>>a&31),[null,this])).ka(a,b,c,d,e)};k.mb=function(a,b,c){a=ng(this.e,this.g,c);return-1===a?this:1===this.g?null:new og(null,this.Ia,this.g-1,cg(this.e,Cd(a,2)))};
var kg=function(){function a(a,b,c,g,h,l,m){var p=nc(c);if(p===h)return new og(null,p,2,[c,g,l,m]);var q=new $f;return ig.la(a,b,p,c,g,q).la(a,b,h,l,m,q)}function b(a,b,c,g,h,l){var m=nc(b);if(m===g)return new og(null,m,2,[b,c,h,l]);var p=new $f;return ig.ka(a,m,b,c,p).ka(a,g,h,l,p)}var c=null,c=function(c,e,f,g,h,l,m){switch(arguments.length){case 6:return b.call(this,c,e,f,g,h,l);case 7:return a.call(this,c,e,f,g,h,l,m)}throw Error("Invalid arity: "+arguments.length);};c.P=b;c.ia=a;return c}();
function pg(a,b,c,d,e){this.k=a;this.Pa=b;this.m=c;this.C=d;this.p=e;this.q=0;this.j=32374860}k=pg.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.k)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return null==this.C?new W(null,2,5,uf,[this.Pa[this.m],this.Pa[this.m+1]],null):G(this.C)};
k.S=function(){if(null==this.C){var a=this.Pa,b=this.m+2;return hg.c?hg.c(a,b,null):hg.call(null,a,b,null)}var a=this.Pa,b=this.m,c=K(this.C);return hg.c?hg.c(a,b,c):hg.call(null,a,b,c)};k.D=function(){return this};k.F=function(a,b){return new pg(b,this.Pa,this.m,this.C,this.p)};k.G=function(a,b){return M(b,this)};pg.prototype[Ea]=function(){return uc(this)};
var hg=function(){function a(a,b,c){if(null==c)for(c=a.length;;)if(b<c){if(null!=a[b])return new pg(null,a,b,null,null);var g=a[b+1];if(t(g)&&(g=g.lb(),t(g)))return new pg(null,a,b+2,g,null);b+=2}else return null;else return new pg(null,a,b,c,null)}function b(a){return c.c(a,0,null)}var c=null,c=function(c,e,f){switch(arguments.length){case 1:return b.call(this,c);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.c=a;return c}();
function qg(a,b,c,d,e){this.k=a;this.Pa=b;this.m=c;this.C=d;this.p=e;this.q=0;this.j=32374860}k=qg.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.k)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return G(this.C)};
k.S=function(){var a=this.Pa,b=this.m,c=K(this.C);return mg.n?mg.n(null,a,b,c):mg.call(null,null,a,b,c)};k.D=function(){return this};k.F=function(a,b){return new qg(b,this.Pa,this.m,this.C,this.p)};k.G=function(a,b){return M(b,this)};qg.prototype[Ea]=function(){return uc(this)};
var mg=function(){function a(a,b,c,g){if(null==g)for(g=b.length;;)if(c<g){var h=b[c];if(t(h)&&(h=h.lb(),t(h)))return new qg(a,b,c+1,h,null);c+=1}else return null;else return new qg(a,b,c,g,null)}function b(a){return c.n(null,a,0,null)}var c=null,c=function(c,e,f,g){switch(arguments.length){case 1:return b.call(this,c);case 4:return a.call(this,c,e,f,g)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.n=a;return c}();
function rg(a,b,c,d,e,f){this.k=a;this.g=b;this.root=c;this.U=d;this.da=e;this.p=f;this.j=16123663;this.q=8196}k=rg.prototype;k.toString=function(){return ec(this)};k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){return null==b?this.U?this.da:c:null==this.root?c:this.root.Oa(0,nc(b),b,c)};k.gb=function(a,b,c){this.U&&(a=this.da,c=b.c?b.c(c,null,a):b.call(null,c,null,a));return Ac(c)?L.b?L.b(c):L.call(null,c):null!=this.root?this.root.Xa(b,c):c};k.H=function(){return this.k};k.L=function(){return this.g};
k.B=function(){var a=this.p;return null!=a?a:this.p=a=xc(this)};k.A=function(a,b){return Pf(this,b)};k.$a=function(){return new sg({},this.root,this.g,this.U,this.da)};k.J=function(){return ub(Qc,this.k)};k.wb=function(a,b){if(null==b)return this.U?new rg(this.k,this.g-1,this.root,!1,null,null):this;if(null==this.root)return this;var c=this.root.mb(0,nc(b),b);return c===this.root?this:new rg(this.k,this.g-1,c,this.U,this.da,null)};
k.Ka=function(a,b,c){if(null==b)return this.U&&c===this.da?this:new rg(this.k,this.U?this.g:this.g+1,this.root,!0,c,null);a=new $f;b=(null==this.root?ig:this.root).ka(0,nc(b),b,c,a);return b===this.root?this:new rg(this.k,a.o?this.g+1:this.g,b,this.U,this.da,null)};k.rb=function(a,b){return null==b?this.U:null==this.root?!1:this.root.Oa(0,nc(b),b,jd)!==jd};k.D=function(){if(0<this.g){var a=null!=this.root?this.root.lb():null;return this.U?M(new W(null,2,5,uf,[null,this.da],null),a):a}return null};
k.F=function(a,b){return new rg(b,this.g,this.root,this.U,this.da,this.p)};k.G=function(a,b){if(ed(b))return cb(this,C.a(b,0),C.a(b,1));for(var c=this,d=D(b);;){if(null==d)return c;var e=G(d);if(ed(e))c=cb(c,C.a(e,0),C.a(e,1)),d=K(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.t(null,c);case 3:return this.s(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.t(null,c)};a.c=function(a,c,d){return this.s(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.t(null,a)};k.a=function(a,b){return this.s(null,a,b)};var Qc=new rg(null,0,null,!1,null,0);rg.prototype[Ea]=function(){return uc(this)};
function sg(a,b,c,d,e){this.u=a;this.root=b;this.count=c;this.U=d;this.da=e;this.q=56;this.j=258}k=sg.prototype;k.Jb=function(a,b){if(this.u)if(null==b)this.U&&(this.U=!1,this.da=null,this.count-=1);else{if(null!=this.root){var c=new $f,d=this.root.nb(this.u,0,nc(b),b,c);d!==this.root&&(this.root=d);t(c[0])&&(this.count-=1)}}else throw Error("dissoc! after persistent!");return this};k.kb=function(a,b,c){return tg(this,b,c)};k.Sa=function(a,b){return ug(this,b)};
k.Ta=function(){var a;if(this.u)this.u=null,a=new rg(null,this.count,this.root,this.U,this.da,null);else throw Error("persistent! called twice");return a};k.t=function(a,b){return null==b?this.U?this.da:null:null==this.root?null:this.root.Oa(0,nc(b),b)};k.s=function(a,b,c){return null==b?this.U?this.da:c:null==this.root?c:this.root.Oa(0,nc(b),b,c)};k.L=function(){if(this.u)return this.count;throw Error("count after persistent!");};
function ug(a,b){if(a.u){if(b?b.j&2048||b.jc||(b.j?0:w(fb,b)):w(fb,b))return tg(a,Yf.b?Yf.b(b):Yf.call(null,b),Zf.b?Zf.b(b):Zf.call(null,b));for(var c=D(b),d=a;;){var e=G(c);if(t(e))var f=e,c=K(c),d=tg(d,function(){var a=f;return Yf.b?Yf.b(a):Yf.call(null,a)}(),function(){var a=f;return Zf.b?Zf.b(a):Zf.call(null,a)}());else return d}}else throw Error("conj! after persistent");}
function tg(a,b,c){if(a.u){if(null==b)a.da!==c&&(a.da=c),a.U||(a.count+=1,a.U=!0);else{var d=new $f;b=(null==a.root?ig:a.root).la(a.u,0,nc(b),b,c,d);b!==a.root&&(a.root=b);d.o&&(a.count+=1)}return a}throw Error("assoc! after persistent!");}function vg(a,b,c){for(var d=b;;)if(null!=a)b=c?a.left:a.right,d=Nc.a(d,a),a=b;else return d}function wg(a,b,c,d,e){this.k=a;this.stack=b;this.pb=c;this.g=d;this.p=e;this.q=0;this.j=32374862}k=wg.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.k};
k.L=function(){return 0>this.g?Q(K(this))+1:this.g};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.k)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return Wc(this.stack)};k.S=function(){var a=G(this.stack),a=vg(this.pb?a.right:a.left,K(this.stack),this.pb);return null!=a?new wg(null,a,this.pb,this.g-1,null):J};k.D=function(){return this};
k.F=function(a,b){return new wg(b,this.stack,this.pb,this.g,this.p)};k.G=function(a,b){return M(b,this)};wg.prototype[Ea]=function(){return uc(this)};function xg(a,b,c){return new wg(null,vg(a,null,b),b,c,null)}
function yg(a,b,c,d){return c instanceof X?c.left instanceof X?new X(c.key,c.o,c.left.ua(),new Z(a,b,c.right,d,null),null):c.right instanceof X?new X(c.right.key,c.right.o,new Z(c.key,c.o,c.left,c.right.left,null),new Z(a,b,c.right.right,d,null),null):new Z(a,b,c,d,null):new Z(a,b,c,d,null)}
function zg(a,b,c,d){return d instanceof X?d.right instanceof X?new X(d.key,d.o,new Z(a,b,c,d.left,null),d.right.ua(),null):d.left instanceof X?new X(d.left.key,d.left.o,new Z(a,b,c,d.left.left,null),new Z(d.key,d.o,d.left.right,d.right,null),null):new Z(a,b,c,d,null):new Z(a,b,c,d,null)}
function Ag(a,b,c,d){if(c instanceof X)return new X(a,b,c.ua(),d,null);if(d instanceof Z)return zg(a,b,c,d.ob());if(d instanceof X&&d.left instanceof Z)return new X(d.left.key,d.left.o,new Z(a,b,c,d.left.left,null),zg(d.key,d.o,d.left.right,d.right.ob()),null);throw Error("red-black tree invariant violation");}
var Cg=function Bg(b,c,d){d=null!=b.left?Bg(b.left,c,d):d;if(Ac(d))return L.b?L.b(d):L.call(null,d);var e=b.key,f=b.o;d=c.c?c.c(d,e,f):c.call(null,d,e,f);if(Ac(d))return L.b?L.b(d):L.call(null,d);b=null!=b.right?Bg(b.right,c,d):d;return Ac(b)?L.b?L.b(b):L.call(null,b):b};function Z(a,b,c,d,e){this.key=a;this.o=b;this.left=c;this.right=d;this.p=e;this.q=0;this.j=32402207}k=Z.prototype;k.Mb=function(a){return a.Ob(this)};k.ob=function(){return new X(this.key,this.o,this.left,this.right,null)};
k.ua=function(){return this};k.Lb=function(a){return a.Nb(this)};k.replace=function(a,b,c,d){return new Z(a,b,c,d,null)};k.Nb=function(a){return new Z(a.key,a.o,this,a.right,null)};k.Ob=function(a){return new Z(a.key,a.o,a.left,this,null)};k.Xa=function(a,b){return Cg(this,a,b)};k.t=function(a,b){return C.c(this,b,null)};k.s=function(a,b,c){return C.c(this,b,c)};k.Q=function(a,b){return 0===b?this.key:1===b?this.o:null};k.$=function(a,b,c){return 0===b?this.key:1===b?this.o:c};
k.Ua=function(a,b,c){return(new W(null,2,5,uf,[this.key,this.o],null)).Ua(null,b,c)};k.H=function(){return null};k.L=function(){return 2};k.hb=function(){return this.key};k.ib=function(){return this.o};k.La=function(){return this.o};k.Ma=function(){return new W(null,1,5,uf,[this.key],null)};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return Mc};k.R=function(a,b){return Cc.a(this,b)};k.O=function(a,b,c){return Cc.c(this,b,c)};
k.Ka=function(a,b,c){return Rc.c(new W(null,2,5,uf,[this.key,this.o],null),b,c)};k.D=function(){return Ra(Ra(J,this.o),this.key)};k.F=function(a,b){return O(new W(null,2,5,uf,[this.key,this.o],null),b)};k.G=function(a,b){return new W(null,3,5,uf,[this.key,this.o,b],null)};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.t(null,c);case 3:return this.s(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.t(null,c)};a.c=function(a,c,d){return this.s(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.t(null,a)};k.a=function(a,b){return this.s(null,a,b)};Z.prototype[Ea]=function(){return uc(this)};
function X(a,b,c,d,e){this.key=a;this.o=b;this.left=c;this.right=d;this.p=e;this.q=0;this.j=32402207}k=X.prototype;k.Mb=function(a){return new X(this.key,this.o,this.left,a,null)};k.ob=function(){throw Error("red-black tree invariant violation");};k.ua=function(){return new Z(this.key,this.o,this.left,this.right,null)};k.Lb=function(a){return new X(this.key,this.o,a,this.right,null)};k.replace=function(a,b,c,d){return new X(a,b,c,d,null)};
k.Nb=function(a){return this.left instanceof X?new X(this.key,this.o,this.left.ua(),new Z(a.key,a.o,this.right,a.right,null),null):this.right instanceof X?new X(this.right.key,this.right.o,new Z(this.key,this.o,this.left,this.right.left,null),new Z(a.key,a.o,this.right.right,a.right,null),null):new Z(a.key,a.o,this,a.right,null)};
k.Ob=function(a){return this.right instanceof X?new X(this.key,this.o,new Z(a.key,a.o,a.left,this.left,null),this.right.ua(),null):this.left instanceof X?new X(this.left.key,this.left.o,new Z(a.key,a.o,a.left,this.left.left,null),new Z(this.key,this.o,this.left.right,this.right,null),null):new Z(a.key,a.o,a.left,this,null)};k.Xa=function(a,b){return Cg(this,a,b)};k.t=function(a,b){return C.c(this,b,null)};k.s=function(a,b,c){return C.c(this,b,c)};
k.Q=function(a,b){return 0===b?this.key:1===b?this.o:null};k.$=function(a,b,c){return 0===b?this.key:1===b?this.o:c};k.Ua=function(a,b,c){return(new W(null,2,5,uf,[this.key,this.o],null)).Ua(null,b,c)};k.H=function(){return null};k.L=function(){return 2};k.hb=function(){return this.key};k.ib=function(){return this.o};k.La=function(){return this.o};k.Ma=function(){return new W(null,1,5,uf,[this.key],null)};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};
k.A=function(a,b){return Ic(this,b)};k.J=function(){return Mc};k.R=function(a,b){return Cc.a(this,b)};k.O=function(a,b,c){return Cc.c(this,b,c)};k.Ka=function(a,b,c){return Rc.c(new W(null,2,5,uf,[this.key,this.o],null),b,c)};k.D=function(){return Ra(Ra(J,this.o),this.key)};k.F=function(a,b){return O(new W(null,2,5,uf,[this.key,this.o],null),b)};k.G=function(a,b){return new W(null,3,5,uf,[this.key,this.o,b],null)};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.t(null,c);case 3:return this.s(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.t(null,c)};a.c=function(a,c,d){return this.s(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.t(null,a)};k.a=function(a,b){return this.s(null,a,b)};X.prototype[Ea]=function(){return uc(this)};
var Eg=function Dg(b,c,d,e,f){if(null==c)return new X(d,e,null,null,null);var g;g=c.key;g=b.a?b.a(d,g):b.call(null,d,g);if(0===g)return f[0]=c,null;if(0>g)return b=Dg(b,c.left,d,e,f),null!=b?c.Lb(b):null;b=Dg(b,c.right,d,e,f);return null!=b?c.Mb(b):null},Gg=function Fg(b,c){if(null==b)return c;if(null==c)return b;if(b instanceof X){if(c instanceof X){var d=Fg(b.right,c.left);return d instanceof X?new X(d.key,d.o,new X(b.key,b.o,b.left,d.left,null),new X(c.key,c.o,d.right,c.right,null),null):new X(b.key,
b.o,b.left,new X(c.key,c.o,d,c.right,null),null)}return new X(b.key,b.o,b.left,Fg(b.right,c),null)}if(c instanceof X)return new X(c.key,c.o,Fg(b,c.left),c.right,null);d=Fg(b.right,c.left);return d instanceof X?new X(d.key,d.o,new Z(b.key,b.o,b.left,d.left,null),new Z(c.key,c.o,d.right,c.right,null),null):Ag(b.key,b.o,b.left,new Z(c.key,c.o,d,c.right,null))},Ig=function Hg(b,c,d,e){if(null!=c){var f;f=c.key;f=b.a?b.a(d,f):b.call(null,d,f);if(0===f)return e[0]=c,Gg(c.left,c.right);if(0>f)return b=Hg(b,
c.left,d,e),null!=b||null!=e[0]?c.left instanceof Z?Ag(c.key,c.o,b,c.right):new X(c.key,c.o,b,c.right,null):null;b=Hg(b,c.right,d,e);if(null!=b||null!=e[0])if(c.right instanceof Z)if(e=c.key,d=c.o,c=c.left,b instanceof X)c=new X(e,d,c,b.ua(),null);else if(c instanceof Z)c=yg(e,d,c.ob(),b);else if(c instanceof X&&c.right instanceof Z)c=new X(c.right.key,c.right.o,yg(c.key,c.o,c.left.ob(),c.right.left),new Z(e,d,c.right.right,b,null),null);else throw Error("red-black tree invariant violation");else c=
new X(c.key,c.o,c.left,b,null);else c=null;return c}return null},Kg=function Jg(b,c,d,e){var f=c.key,g=b.a?b.a(d,f):b.call(null,d,f);return 0===g?c.replace(f,e,c.left,c.right):0>g?c.replace(f,c.o,Jg(b,c.left,d,e),c.right):c.replace(f,c.o,c.left,Jg(b,c.right,d,e))};function Lg(a,b,c,d,e){this.aa=a;this.na=b;this.g=c;this.k=d;this.p=e;this.j=418776847;this.q=8192}k=Lg.prototype;k.toString=function(){return ec(this)};
function Mg(a,b){for(var c=a.na;;)if(null!=c){var d;d=c.key;d=a.aa.a?a.aa.a(b,d):a.aa.call(null,b,d);if(0===d)return c;c=0>d?c.left:c.right}else return null}k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){a=Mg(this,b);return null!=a?a.o:c};k.gb=function(a,b,c){return null!=this.na?Cg(this.na,b,c):c};k.H=function(){return this.k};k.L=function(){return this.g};k.ab=function(){return 0<this.g?xg(this.na,!1,this.g):null};k.B=function(){var a=this.p;return null!=a?a:this.p=a=xc(this)};
k.A=function(a,b){return Pf(this,b)};k.J=function(){return new Lg(this.aa,null,0,this.k,0)};k.wb=function(a,b){var c=[null],d=Ig(this.aa,this.na,b,c);return null==d?null==R.a(c,0)?this:new Lg(this.aa,null,0,this.k,null):new Lg(this.aa,d.ua(),this.g-1,this.k,null)};k.Ka=function(a,b,c){a=[null];var d=Eg(this.aa,this.na,b,c,a);return null==d?(a=R.a(a,0),sc.a(c,a.o)?this:new Lg(this.aa,Kg(this.aa,this.na,b,c),this.g,this.k,null)):new Lg(this.aa,d.ua(),this.g+1,this.k,null)};
k.rb=function(a,b){return null!=Mg(this,b)};k.D=function(){return 0<this.g?xg(this.na,!0,this.g):null};k.F=function(a,b){return new Lg(this.aa,this.na,this.g,b,this.p)};k.G=function(a,b){if(ed(b))return cb(this,C.a(b,0),C.a(b,1));for(var c=this,d=D(b);;){if(null==d)return c;var e=G(d);if(ed(e))c=cb(c,C.a(e,0),C.a(e,1)),d=K(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.t(null,c);case 3:return this.s(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.t(null,c)};a.c=function(a,c,d){return this.s(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.t(null,a)};k.a=function(a,b){return this.s(null,a,b)};k.Hb=function(a,b){return 0<this.g?xg(this.na,b,this.g):null};
k.Ib=function(a,b,c){if(0<this.g){a=null;for(var d=this.na;;)if(null!=d){var e;e=d.key;e=this.aa.a?this.aa.a(b,e):this.aa.call(null,b,e);if(0===e)return new wg(null,Nc.a(a,d),c,-1,null);t(c)?0>e?(a=Nc.a(a,d),d=d.left):d=d.right:0<e?(a=Nc.a(a,d),d=d.right):d=d.left}else return null==a?null:new wg(null,a,c,-1,null)}else return null};k.Gb=function(a,b){return Yf.b?Yf.b(b):Yf.call(null,b)};k.Fb=function(){return this.aa};var Ng=new Lg(od,null,0,null,0);Lg.prototype[Ea]=function(){return uc(this)};
var Og=function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){a=D(a);for(var b=Ob(Qc);;)if(a){var e=K(K(a)),b=ee.c(b,G(a),Lc(a));a=e}else return Qb(b)}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}(),Pg=function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,
d)}function b(a){a:{a=T.a(Ha,a);for(var b=a.length,e=0,f=Ob(Uf);;)if(e<b)var g=e+2,f=Rb(f,a[e],a[e+1]),e=g;else{a=Qb(f);break a}a=void 0}return a}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}(),Qg=function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){a=D(a);for(var b=Ng;;)if(a){var e=K(K(a)),b=Rc.c(b,G(a),Lc(a));a=e}else return b}a.i=0;a.f=function(a){a=D(a);
return b(a)};a.d=b;return a}(),Rg=function(){function a(a,d){var e=null;if(1<arguments.length){for(var e=0,f=Array(arguments.length-1);e<f.length;)f[e]=arguments[e+1],++e;e=new F(f,0)}return b.call(this,a,e)}function b(a,b){for(var e=D(b),f=new Lg(qd(a),null,0,null,0);;)if(e)var g=K(K(e)),f=Rc.c(f,G(e),Lc(e)),e=g;else return f}a.i=1;a.f=function(a){var d=G(a);a=H(a);return b(d,a)};a.d=b;return a}();function Sg(a,b){this.Y=a;this.Z=b;this.q=0;this.j=32374988}k=Sg.prototype;k.toString=function(){return ec(this)};
k.H=function(){return this.Z};k.T=function(){var a=this.Y,a=(a?a.j&128||a.xb||(a.j?0:w(Xa,a)):w(Xa,a))?this.Y.T(null):K(this.Y);return null==a?null:new Sg(a,this.Z)};k.B=function(){return wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.Z)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return this.Y.N(null).hb(null)};
k.S=function(){var a=this.Y,a=(a?a.j&128||a.xb||(a.j?0:w(Xa,a)):w(Xa,a))?this.Y.T(null):K(this.Y);return null!=a?new Sg(a,this.Z):J};k.D=function(){return this};k.F=function(a,b){return new Sg(this.Y,b)};k.G=function(a,b){return M(b,this)};Sg.prototype[Ea]=function(){return uc(this)};function Tg(a){return(a=D(a))?new Sg(a,null):null}function Yf(a){return hb(a)}function Ug(a,b){this.Y=a;this.Z=b;this.q=0;this.j=32374988}k=Ug.prototype;k.toString=function(){return ec(this)};k.H=function(){return this.Z};
k.T=function(){var a=this.Y,a=(a?a.j&128||a.xb||(a.j?0:w(Xa,a)):w(Xa,a))?this.Y.T(null):K(this.Y);return null==a?null:new Ug(a,this.Z)};k.B=function(){return wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.Z)};k.R=function(a,b){return P.a(b,this)};k.O=function(a,b,c){return P.c(b,c,this)};k.N=function(){return this.Y.N(null).ib(null)};k.S=function(){var a=this.Y,a=(a?a.j&128||a.xb||(a.j?0:w(Xa,a)):w(Xa,a))?this.Y.T(null):K(this.Y);return null!=a?new Ug(a,this.Z):J};
k.D=function(){return this};k.F=function(a,b){return new Ug(this.Y,b)};k.G=function(a,b){return M(b,this)};Ug.prototype[Ea]=function(){return uc(this)};function Vg(a){return(a=D(a))?new Ug(a,null):null}function Zf(a){return ib(a)}
var Wg=function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){return t(Fe(ud,a))?A.a(function(a,b){return Nc.a(t(a)?a:Uf,b)},a):null}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}(),Xg=function(){function a(a,d){var e=null;if(1<arguments.length){for(var e=0,f=Array(arguments.length-1);e<f.length;)f[e]=arguments[e+1],++e;e=new F(f,0)}return b.call(this,a,e)}function b(a,
b){return t(Fe(ud,b))?A.a(function(a){return function(b,c){return A.c(a,t(b)?b:Uf,D(c))}}(function(b,d){var g=G(d),h=Lc(d);return nd(b,g)?Rc.c(b,g,function(){var d=S.a(b,g);return a.a?a.a(d,h):a.call(null,d,h)}()):Rc.c(b,g,h)}),b):null}a.i=1;a.f=function(a){var d=G(a);a=H(a);return b(d,a)};a.d=b;return a}();function Yg(a,b){for(var c=Uf,d=D(b);;)if(d)var e=G(d),f=S.c(a,e,Zg),c=je.a(f,Zg)?Rc.c(c,e,f):c,d=K(d);else return O(c,Vc(a))}
function $g(a,b,c){this.k=a;this.Wa=b;this.p=c;this.j=15077647;this.q=8196}k=$g.prototype;k.toString=function(){return ec(this)};k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){return bb(this.Wa,b)?b:c};k.H=function(){return this.k};k.L=function(){return Ma(this.Wa)};k.B=function(){var a=this.p;return null!=a?a:this.p=a=xc(this)};k.A=function(a,b){return ad(b)&&Q(this)===Q(b)&&Ee(function(a){return function(b){return nd(a,b)}}(this),b)};k.$a=function(){return new ah(Ob(this.Wa))};
k.J=function(){return O(bh,this.k)};k.Eb=function(a,b){return new $g(this.k,eb(this.Wa,b),null)};k.D=function(){return Tg(this.Wa)};k.F=function(a,b){return new $g(b,this.Wa,this.p)};k.G=function(a,b){return new $g(this.k,Rc.c(this.Wa,b,null),null)};
k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.t(null,c);case 3:return this.s(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.t(null,c)};a.c=function(a,c,d){return this.s(null,c,d)};return a}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.t(null,a)};k.a=function(a,b){return this.s(null,a,b)};var bh=new $g(null,Uf,0);$g.prototype[Ea]=function(){return uc(this)};
function ah(a){this.ma=a;this.j=259;this.q=136}k=ah.prototype;k.call=function(){function a(a,b,c){return $a.c(this.ma,b,jd)===jd?c:b}function b(a,b){return $a.c(this.ma,b,jd)===jd?null:b}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+arguments.length);};c.a=b;c.c=a;return c}();k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};
k.b=function(a){return $a.c(this.ma,a,jd)===jd?null:a};k.a=function(a,b){return $a.c(this.ma,a,jd)===jd?b:a};k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){return $a.c(this.ma,b,jd)===jd?c:b};k.L=function(){return Q(this.ma)};k.Tb=function(a,b){this.ma=fe.a(this.ma,b);return this};k.Sa=function(a,b){this.ma=ee.c(this.ma,b,null);return this};k.Ta=function(){return new $g(null,Qb(this.ma),null)};function ch(a,b,c){this.k=a;this.ja=b;this.p=c;this.j=417730831;this.q=8192}k=ch.prototype;
k.toString=function(){return ec(this)};k.t=function(a,b){return $a.c(this,b,null)};k.s=function(a,b,c){a=Mg(this.ja,b);return null!=a?a.key:c};k.H=function(){return this.k};k.L=function(){return Q(this.ja)};k.ab=function(){return 0<Q(this.ja)?Oe.a(Yf,Gb(this.ja)):null};k.B=function(){var a=this.p;return null!=a?a:this.p=a=xc(this)};k.A=function(a,b){return ad(b)&&Q(this)===Q(b)&&Ee(function(a){return function(b){return nd(a,b)}}(this),b)};k.J=function(){return new ch(this.k,Na(this.ja),0)};
k.Eb=function(a,b){return new ch(this.k,Sc.a(this.ja,b),null)};k.D=function(){return Tg(this.ja)};k.F=function(a,b){return new ch(b,this.ja,this.p)};k.G=function(a,b){return new ch(this.k,Rc.c(this.ja,b,null),null)};k.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.t(null,c);case 3:return this.s(null,c,d)}throw Error("Invalid arity: "+arguments.length);};a.a=function(a,c){return this.t(null,c)};a.c=function(a,c,d){return this.s(null,c,d)};return a}();
k.apply=function(a,b){return this.call.apply(this,[this].concat(Fa(b)))};k.b=function(a){return this.t(null,a)};k.a=function(a,b){return this.s(null,a,b)};k.Hb=function(a,b){return Oe.a(Yf,Hb(this.ja,b))};k.Ib=function(a,b,c){return Oe.a(Yf,Ib(this.ja,b,c))};k.Gb=function(a,b){return b};k.Fb=function(){return Kb(this.ja)};var eh=new ch(null,Ng,0);ch.prototype[Ea]=function(){return uc(this)};
function fh(a){a=D(a);if(null==a)return bh;if(a instanceof F&&0===a.m){a=a.e;a:{for(var b=0,c=Ob(bh);;)if(b<a.length)var d=b+1,c=c.Sa(null,a[b]),b=d;else{a=c;break a}a=void 0}return a.Ta(null)}for(d=Ob(bh);;)if(null!=a)b=a.T(null),d=d.Sa(null,a.N(null)),a=b;else return d.Ta(null)}
var gh=function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){return A.c(Ra,eh,a)}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}(),hh=function(){function a(a,d){var e=null;if(1<arguments.length){for(var e=0,f=Array(arguments.length-1);e<f.length;)f[e]=arguments[e+1],++e;e=new F(f,0)}return b.call(this,a,e)}function b(a,b){return A.c(Ra,new ch(null,Rg(a),0),b)}
a.i=1;a.f=function(a){var d=G(a);a=H(a);return b(d,a)};a.d=b;return a}();function Od(a){if(a&&(a.q&4096||a.lc))return a.name;if("string"===typeof a)return a;throw Error([z("Doesn't support name: "),z(a)].join(""));}
var ih=function(){function a(a,b,c){return(a.b?a.b(b):a.call(null,b))>(a.b?a.b(c):a.call(null,c))?b:c}var b=null,c=function(){function a(b,d,h,l){var m=null;if(3<arguments.length){for(var m=0,p=Array(arguments.length-3);m<p.length;)p[m]=arguments[m+3],++m;m=new F(p,0)}return c.call(this,b,d,h,m)}function c(a,d,e,l){return A.c(function(c,d){return b.c(a,c,d)},b.c(a,d,e),l)}a.i=3;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=K(a);var l=G(a);a=H(a);return c(b,d,l,a)};a.d=c;return a}(),b=function(b,
e,f,g){switch(arguments.length){case 2:return e;case 3:return a.call(this,b,e,f);default:var h=null;if(3<arguments.length){for(var h=0,l=Array(arguments.length-3);h<l.length;)l[h]=arguments[h+3],++h;h=new F(l,0)}return c.d(b,e,f,h)}throw Error("Invalid arity: "+arguments.length);};b.i=3;b.f=c.f;b.a=function(a,b){return b};b.c=a;b.d=c.d;return b}();function jh(a){this.e=a}jh.prototype.add=function(a){return this.e.push(a)};jh.prototype.size=function(){return this.e.length};
jh.prototype.clear=function(){return this.e=[]};
var kh=function(){function a(a,b,c){return new V(null,function(){var h=D(c);return h?M(Pe.a(a,h),d.c(a,b,Qe.a(b,h))):null},null,null)}function b(a,b){return d.c(a,a,b)}function c(a){return function(b){return function(c){return function(){function d(h,l){c.add(l);if(a===c.size()){var m=zf(c.e);c.clear();return b.a?b.a(h,m):b.call(null,h,m)}return h}function l(a){if(!t(0===c.e.length)){var d=zf(c.e);c.clear();a=Bc(b.a?b.a(a,d):b.call(null,a,d))}return b.b?b.b(a):b.call(null,a)}function m(){return b.l?
b.l():b.call(null)}var p=null,p=function(a,b){switch(arguments.length){case 0:return m.call(this);case 1:return l.call(this,a);case 2:return d.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};p.l=m;p.b=l;p.a=d;return p}()}(new jh([]))}}var d=null,d=function(d,f,g){switch(arguments.length){case 1:return c.call(this,d);case 2:return b.call(this,d,f);case 3:return a.call(this,d,f,g)}throw Error("Invalid arity: "+arguments.length);};d.b=c;d.a=b;d.c=a;return d}(),lh=function(){function a(a,
b){return new V(null,function(){var f=D(b);if(f){var g;g=G(f);g=a.b?a.b(g):a.call(null,g);f=t(g)?M(G(f),c.a(a,H(f))):null}else f=null;return f},null,null)}function b(a){return function(b){return function(){function c(f,g){return t(a.b?a.b(g):a.call(null,g))?b.a?b.a(f,g):b.call(null,f,g):new yc(f)}function g(a){return b.b?b.b(a):b.call(null,a)}function h(){return b.l?b.l():b.call(null)}var l=null,l=function(a,b){switch(arguments.length){case 0:return h.call(this);case 1:return g.call(this,a);case 2:return c.call(this,
a,b)}throw Error("Invalid arity: "+arguments.length);};l.l=h;l.b=g;l.a=c;return l}()}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();function mh(a,b,c){return function(d){var e=Kb(a);d=Jb(a,d);e=e.a?e.a(d,c):e.call(null,d,c);return b.a?b.a(e,0):b.call(null,e,0)}}
var nh=function(){function a(a,b,c,g,h){var l=Ib(a,c,!0);if(t(l)){var m=R.c(l,0,null);return lh.a(mh(a,g,h),t(mh(a,b,c).call(null,m))?l:K(l))}return null}function b(a,b,c){var g=mh(a,b,c),h;a:{h=[Ad,Bd];var l=h.length;if(l<=Vf)for(var m=0,p=Ob(Uf);;)if(m<l)var q=m+1,p=Rb(p,h[m],null),m=q;else{h=new $g(null,Qb(p),null);break a}else for(m=0,p=Ob(bh);;)if(m<l)q=m+1,p=Pb(p,h[m]),m=q;else{h=Qb(p);break a}h=void 0}return t(h.call(null,b))?(a=Ib(a,c,!0),t(a)?(b=R.c(a,0,null),t(g.b?g.b(b):g.call(null,b))?
a:K(a)):null):lh.a(g,Hb(a,!0))}var c=null,c=function(c,e,f,g,h){switch(arguments.length){case 3:return b.call(this,c,e,f);case 5:return a.call(this,c,e,f,g,h)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.r=a;return c}();function oh(a,b,c){this.m=a;this.end=b;this.step=c}oh.prototype.ga=function(){return 0<this.step?this.m<this.end:this.m>this.end};oh.prototype.next=function(){var a=this.m;this.m+=this.step;return a};
function ph(a,b,c,d,e){this.k=a;this.start=b;this.end=c;this.step=d;this.p=e;this.j=32375006;this.q=8192}k=ph.prototype;k.toString=function(){return ec(this)};k.Q=function(a,b){if(b<Ma(this))return this.start+b*this.step;if(this.start>this.end&&0===this.step)return this.start;throw Error("Index out of bounds");};k.$=function(a,b,c){return b<Ma(this)?this.start+b*this.step:this.start>this.end&&0===this.step?this.start:c};k.vb=!0;k.fb=function(){return new oh(this.start,this.end,this.step)};k.H=function(){return this.k};
k.T=function(){return 0<this.step?this.start+this.step<this.end?new ph(this.k,this.start+this.step,this.end,this.step,null):null:this.start+this.step>this.end?new ph(this.k,this.start+this.step,this.end,this.step,null):null};k.L=function(){if(Aa(Cb(this)))return 0;var a=(this.end-this.start)/this.step;return Math.ceil.b?Math.ceil.b(a):Math.ceil.call(null,a)};k.B=function(){var a=this.p;return null!=a?a:this.p=a=wc(this)};k.A=function(a,b){return Ic(this,b)};k.J=function(){return O(J,this.k)};
k.R=function(a,b){return Cc.a(this,b)};k.O=function(a,b,c){for(a=this.start;;)if(0<this.step?a<this.end:a>this.end){var d=a;c=b.a?b.a(c,d):b.call(null,c,d);if(Ac(c))return b=c,L.b?L.b(b):L.call(null,b);a+=this.step}else return c};k.N=function(){return null==Cb(this)?null:this.start};k.S=function(){return null!=Cb(this)?new ph(this.k,this.start+this.step,this.end,this.step,null):J};k.D=function(){return 0<this.step?this.start<this.end?this:null:this.start>this.end?this:null};
k.F=function(a,b){return new ph(b,this.start,this.end,this.step,this.p)};k.G=function(a,b){return M(b,this)};ph.prototype[Ea]=function(){return uc(this)};
var qh=function(){function a(a,b,c){return new ph(null,a,b,c,null)}function b(a,b){return e.c(a,b,1)}function c(a){return e.c(0,a,1)}function d(){return e.c(0,Number.MAX_VALUE,1)}var e=null,e=function(e,g,h){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,e);case 2:return b.call(this,e,g);case 3:return a.call(this,e,g,h)}throw Error("Invalid arity: "+arguments.length);};e.l=d;e.b=c;e.a=b;e.c=a;return e}(),rh=function(){function a(a,b){return new V(null,function(){var f=
D(b);return f?M(G(f),c.a(a,Qe.a(a,f))):null},null,null)}function b(a){return function(b){return function(c){return function(){function g(g,h){var l=c.bb(0,c.Ra(null)+1),m=Cd(l,a);return 0===l-a*m?b.a?b.a(g,h):b.call(null,g,h):g}function h(a){return b.b?b.b(a):b.call(null,a)}function l(){return b.l?b.l():b.call(null)}var m=null,m=function(a,b){switch(arguments.length){case 0:return l.call(this);case 1:return h.call(this,a);case 2:return g.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);
};m.l=l;m.b=h;m.a=g;return m}()}(new Me(-1))}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),th=function(){function a(a,b){return new V(null,function(){var f=D(b);if(f){var g=G(f),h=a.b?a.b(g):a.call(null,g),g=M(g,lh.a(function(b,c){return function(b){return sc.a(c,a.b?a.b(b):a.call(null,b))}}(g,h,f,f),K(f)));return M(g,c.a(a,D(Qe.a(Q(g),f))))}return null},null,
null)}function b(a){return function(b){return function(c,g){return function(){function h(h,l){var m=L.b?L.b(g):L.call(null,g),p=a.b?a.b(l):a.call(null,l);ac(g,p);if(Nd(m,sh)||sc.a(p,m))return c.add(l),h;m=zf(c.e);c.clear();m=b.a?b.a(h,m):b.call(null,h,m);Ac(m)||c.add(l);return m}function l(a){if(!t(0===c.e.length)){var d=zf(c.e);c.clear();a=Bc(b.a?b.a(a,d):b.call(null,a,d))}return b.b?b.b(a):b.call(null,a)}function m(){return b.l?b.l():b.call(null)}var p=null,p=function(a,b){switch(arguments.length){case 0:return m.call(this);
case 1:return l.call(this,a);case 2:return h.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};p.l=m;p.b=l;p.a=h;return p}()}(new jh([]),new Me(sh))}}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),uh=function(){function a(a,b){for(;;)if(D(b)&&0<a){var c=a-1,g=K(b);a=c;b=g}else return null}function b(a){for(;;)if(D(a))a=K(a);else return null}var c=
null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}(),vh=function(){function a(a,b){uh.a(a,b);return b}function b(a){uh.b(a);return a}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}();
function wh(a,b,c,d,e,f,g){var h=ma;try{ma=null==ma?null:ma-1;if(null!=ma&&0>ma)return Lb(a,"#");Lb(a,c);if(D(g)){var l=G(g);b.c?b.c(l,a,f):b.call(null,l,a,f)}for(var m=K(g),p=za.b(f)-1;;)if(!m||null!=p&&0===p){D(m)&&0===p&&(Lb(a,d),Lb(a,"..."));break}else{Lb(a,d);var q=G(m);c=a;g=f;b.c?b.c(q,c,g):b.call(null,q,c,g);var s=K(m);c=p-1;m=s;p=c}return Lb(a,e)}finally{ma=h}}
var xh=function(){function a(a,d){var e=null;if(1<arguments.length){for(var e=0,f=Array(arguments.length-1);e<f.length;)f[e]=arguments[e+1],++e;e=new F(f,0)}return b.call(this,a,e)}function b(a,b){for(var e=D(b),f=null,g=0,h=0;;)if(h<g){var l=f.Q(null,h);Lb(a,l);h+=1}else if(e=D(e))f=e,fd(f)?(e=Yb(f),g=Zb(f),f=e,l=Q(e),e=g,g=l):(l=G(f),Lb(a,l),e=K(f),f=null,g=0),h=0;else return null}a.i=1;a.f=function(a){var d=G(a);a=H(a);return b(d,a)};a.d=b;return a}(),yh={'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f",
"\n":"\\n","\r":"\\r","\t":"\\t"};function zh(a){return[z('"'),z(a.replace(RegExp('[\\\\"\b\f\n\r\t]',"g"),function(a){return yh[a]})),z('"')].join("")}
var $=function Ah(b,c,d){if(null==b)return Lb(c,"nil");if(void 0===b)return Lb(c,"#\x3cundefined\x3e");t(function(){var c=S.a(d,wa);return t(c)?(c=b?b.j&131072||b.kc?!0:b.j?!1:w(rb,b):w(rb,b))?Vc(b):c:c}())&&(Lb(c,"^"),Ah(Vc(b),c,d),Lb(c," "));if(null==b)return Lb(c,"nil");if(b.Yb)return b.nc(c);if(b&&(b.j&2147483648||b.I))return b.v(null,c,d);if(Ba(b)===Boolean||"number"===typeof b)return Lb(c,""+z(b));if(null!=b&&b.constructor===Object){Lb(c,"#js ");var e=Oe.a(function(c){return new W(null,2,5,
uf,[Pd.b(c),b[c]],null)},gd(b));return Bh.n?Bh.n(e,Ah,c,d):Bh.call(null,e,Ah,c,d)}return b instanceof Array?wh(c,Ah,"#js ["," ","]",d,b):t("string"==typeof b)?t(ua.b(d))?Lb(c,zh(b)):Lb(c,b):Tc(b)?xh.d(c,Kc(["#\x3c",""+z(b),"\x3e"],0)):b instanceof Date?(e=function(b,c){for(var d=""+z(b);;)if(Q(d)<c)d=[z("0"),z(d)].join("");else return d},xh.d(c,Kc(['#inst "',""+z(b.getUTCFullYear()),"-",e(b.getUTCMonth()+1,2),"-",e(b.getUTCDate(),2),"T",e(b.getUTCHours(),2),":",e(b.getUTCMinutes(),2),":",e(b.getUTCSeconds(),
2),".",e(b.getUTCMilliseconds(),3),"-",'00:00"'],0))):b instanceof RegExp?xh.d(c,Kc(['#"',b.source,'"'],0)):(b?b.j&2147483648||b.I||(b.j?0:w(Mb,b)):w(Mb,b))?Nb(b,c,d):xh.d(c,Kc(["#\x3c",""+z(b),"\x3e"],0))},Ch=function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){var b=oa();if(Yc(a))b="";else{var e=z,f=new fa;a:{var g=new dc(f);$(G(a),g,b);a=D(K(a));for(var h=null,l=0,
m=0;;)if(m<l){var p=h.Q(null,m);Lb(g," ");$(p,g,b);m+=1}else if(a=D(a))h=a,fd(h)?(a=Yb(h),l=Zb(h),h=a,p=Q(a),a=l,l=p):(p=G(h),Lb(g," "),$(p,g,b),a=K(h),h=null,l=0),m=0;else break a}b=""+e(f)}return b}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}();function Bh(a,b,c,d){return wh(c,function(a,c,d){var h=hb(a);b.c?b.c(h,c,d):b.call(null,h,c,d);Lb(c," ");a=ib(a);return b.c?b.c(a,c,d):b.call(null,a,c,d)},"{",", ","}",d,D(a))}Me.prototype.I=!0;
Me.prototype.v=function(a,b,c){Lb(b,"#\x3cVolatile: ");$(this.state,b,c);return Lb(b,"\x3e")};F.prototype.I=!0;F.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};V.prototype.I=!0;V.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};wg.prototype.I=!0;wg.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};pg.prototype.I=!0;pg.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Z.prototype.I=!0;
Z.prototype.v=function(a,b,c){return wh(b,$,"["," ","]",c,this)};Rf.prototype.I=!0;Rf.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};ch.prototype.I=!0;ch.prototype.v=function(a,b,c){return wh(b,$,"#{"," ","}",c,this)};Bf.prototype.I=!0;Bf.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Ld.prototype.I=!0;Ld.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Hc.prototype.I=!0;Hc.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};
rg.prototype.I=!0;rg.prototype.v=function(a,b,c){return Bh(this,$,b,c)};qg.prototype.I=!0;qg.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Df.prototype.I=!0;Df.prototype.v=function(a,b,c){return wh(b,$,"["," ","]",c,this)};Lg.prototype.I=!0;Lg.prototype.v=function(a,b,c){return Bh(this,$,b,c)};$g.prototype.I=!0;$g.prototype.v=function(a,b,c){return wh(b,$,"#{"," ","}",c,this)};Vd.prototype.I=!0;Vd.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Ug.prototype.I=!0;
Ug.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};X.prototype.I=!0;X.prototype.v=function(a,b,c){return wh(b,$,"["," ","]",c,this)};W.prototype.I=!0;W.prototype.v=function(a,b,c){return wh(b,$,"["," ","]",c,this)};Kf.prototype.I=!0;Kf.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Hd.prototype.I=!0;Hd.prototype.v=function(a,b){return Lb(b,"()")};ze.prototype.I=!0;ze.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Lf.prototype.I=!0;
Lf.prototype.v=function(a,b,c){return wh(b,$,"#queue ["," ","]",c,D(this))};pa.prototype.I=!0;pa.prototype.v=function(a,b,c){return Bh(this,$,b,c)};ph.prototype.I=!0;ph.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Sg.prototype.I=!0;Sg.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Fd.prototype.I=!0;Fd.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};W.prototype.sb=!0;W.prototype.tb=function(a,b){return pd.a(this,b)};Df.prototype.sb=!0;
Df.prototype.tb=function(a,b){return pd.a(this,b)};U.prototype.sb=!0;U.prototype.tb=function(a,b){return Md(this,b)};qc.prototype.sb=!0;qc.prototype.tb=function(a,b){return pc(this,b)};var Dh=function(){function a(a,d,e){var f=null;if(2<arguments.length){for(var f=0,g=Array(arguments.length-2);f<g.length;)g[f]=arguments[f+2],++f;f=new F(g,0)}return b.call(this,a,d,f)}function b(a,b,e){return a.k=T.c(b,a.k,e)}a.i=2;a.f=function(a){var d=G(a);a=K(a);var e=G(a);a=H(a);return b(d,e,a)};a.d=b;return a}();
function Eh(a){return function(b,c){var d=a.a?a.a(b,c):a.call(null,b,c);return Ac(d)?new yc(d):d}}
function Ve(a){return function(b){return function(){function c(a,c){return A.c(b,a,c)}function d(b){return a.b?a.b(b):a.call(null,b)}function e(){return a.l?a.l():a.call(null)}var f=null,f=function(a,b){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,a);case 2:return c.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);};f.l=e;f.b=d;f.a=c;return f}()}(Eh(a))}
var Fh=function(){function a(a){return Ce.a(c.l(),a)}function b(){return function(a){return function(b){return function(){function c(f,g){var h=L.b?L.b(b):L.call(null,b);ac(b,g);return sc.a(h,g)?f:a.a?a.a(f,g):a.call(null,f,g)}function g(b){return a.b?a.b(b):a.call(null,b)}function h(){return a.l?a.l():a.call(null)}var l=null,l=function(a,b){switch(arguments.length){case 0:return h.call(this);case 1:return g.call(this,a);case 2:return c.call(this,a,b)}throw Error("Invalid arity: "+arguments.length);
};l.l=h;l.b=g;l.a=c;return l}()}(new Me(sh))}}var c=null,c=function(c){switch(arguments.length){case 0:return b.call(this);case 1:return a.call(this,c)}throw Error("Invalid arity: "+arguments.length);};c.l=b;c.b=a;return c}();function Gh(a,b){this.fa=a;this.Zb=b;this.q=0;this.j=2173173760}Gh.prototype.v=function(a,b,c){return wh(b,$,"("," ",")",c,this)};Gh.prototype.O=function(a,b,c){return wd.n(this.fa,b,c,this.Zb)};Gh.prototype.D=function(){return D(Ce.a(this.fa,this.Zb))};Gh.prototype[Ea]=function(){return uc(this)};
var Hh={};function Ih(a){if(a?a.gc:a)return a.gc(a);var b;b=Ih[n(null==a?null:a)];if(!b&&(b=Ih._,!b))throw x("IEncodeJS.-clj-\x3ejs",a);return b.call(null,a)}function Jh(a){return(a?t(t(null)?null:a.fc)||(a.yb?0:w(Hh,a)):w(Hh,a))?Ih(a):"string"===typeof a||"number"===typeof a||a instanceof U||a instanceof qc?Kh.b?Kh.b(a):Kh.call(null,a):Ch.d(Kc([a],0))}
var Kh=function Lh(b){if(null==b)return null;if(b?t(t(null)?null:b.fc)||(b.yb?0:w(Hh,b)):w(Hh,b))return Ih(b);if(b instanceof U)return Od(b);if(b instanceof qc)return""+z(b);if(dd(b)){var c={};b=D(b);for(var d=null,e=0,f=0;;)if(f<e){var g=d.Q(null,f),h=R.c(g,0,null),g=R.c(g,1,null);c[Jh(h)]=Lh(g);f+=1}else if(b=D(b))fd(b)?(e=Yb(b),b=Zb(b),d=e,e=Q(e)):(e=G(b),d=R.c(e,0,null),e=R.c(e,1,null),c[Jh(d)]=Lh(e),b=K(b),d=null,e=0),f=0;else break;return c}if($c(b)){c=[];b=D(Oe.a(Lh,b));d=null;for(f=e=0;;)if(f<
e)h=d.Q(null,f),c.push(h),f+=1;else if(b=D(b))d=b,fd(d)?(b=Yb(d),f=Zb(d),d=b,e=Q(b),b=f):(b=G(d),c.push(b),b=K(d),d=null,e=0),f=0;else break;return c}return b},Mh={};function Nh(a,b){if(a?a.ec:a)return a.ec(a,b);var c;c=Nh[n(null==a?null:a)];if(!c&&(c=Nh._,!c))throw x("IEncodeClojure.-js-\x3eclj",a);return c.call(null,a,b)}
var Ph=function(){function a(a){return b.d(a,Kc([new pa(null,1,[Oh,!1],null)],0))}var b=null,c=function(){function a(c,d){var h=null;if(1<arguments.length){for(var h=0,l=Array(arguments.length-1);h<l.length;)l[h]=arguments[h+1],++h;h=new F(l,0)}return b.call(this,c,h)}function b(a,c){var d=kd(c)?T.a(Og,c):c,e=S.a(d,Oh);return function(a,b,d,e){return function v(f){return(f?t(t(null)?null:f.uc)||(f.yb?0:w(Mh,f)):w(Mh,f))?Nh(f,T.a(Pg,c)):kd(f)?vh.b(Oe.a(v,f)):$c(f)?af.a(Oc(f),Oe.a(v,f)):f instanceof
Array?zf(Oe.a(v,f)):Ba(f)===Object?af.a(Uf,function(){return function(a,b,c,d){return function Pa(e){return new V(null,function(a,b,c,d){return function(){for(;;){var a=D(e);if(a){if(fd(a)){var b=Yb(a),c=Q(b),g=Td(c);return function(){for(var a=0;;)if(a<c){var e=C.a(b,a),h=g,l=uf,m;m=e;m=d.b?d.b(m):d.call(null,m);e=new W(null,2,5,l,[m,v(f[e])],null);h.add(e);a+=1}else return!0}()?Wd(g.ca(),Pa(Zb(a))):Wd(g.ca(),null)}var h=G(a);return M(new W(null,2,5,uf,[function(){var a=h;return d.b?d.b(a):d.call(null,
a)}(),v(f[h])],null),Pa(H(a)))}return null}}}(a,b,c,d),null,null)}}(a,b,d,e)(gd(f))}()):f}}(c,d,e,t(e)?Pd:z)(a)}a.i=1;a.f=function(a){var c=G(a);a=H(a);return b(c,a)};a.d=b;return a}(),b=function(b,e){switch(arguments.length){case 1:return a.call(this,b);default:var f=null;if(1<arguments.length){for(var f=0,g=Array(arguments.length-1);f<g.length;)g[f]=arguments[f+1],++f;f=new F(g,0)}return c.d(b,f)}throw Error("Invalid arity: "+arguments.length);};b.i=1;b.f=c.f;b.b=a;b.d=c.d;return b}();var wa=new U(null,"meta","meta",1499536964),ya=new U(null,"dup","dup",556298533),sh=new U("cljs.core","none","cljs.core/none",926646439),pe=new U(null,"file","file",-1269645878),le=new U(null,"end-column","end-column",1425389514),sa=new U(null,"flush-on-newline","flush-on-newline",-151457939),ne=new U(null,"column","column",2078222095),ua=new U(null,"readably","readably",1129599760),oe=new U(null,"line","line",212345235),za=new U(null,"print-length","print-length",1931866356),me=new U(null,"end-line",
"end-line",1837326455),Oh=new U(null,"keywordize-keys","keywordize-keys",1310784252),Zg=new U("cljs.core","not-found","cljs.core/not-found",-1572889185);function Qh(a,b){var c=T.c(ih,a,b);return M(c,Ye.a(function(a){return function(b){return a===b}}(c),b))}
var Rh=function(){function a(a,b){return Q(a)<Q(b)?A.c(Nc,b,a):A.c(Nc,a,b)}var b=null,c=function(){function a(c,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return b.call(this,c,d,l)}function b(a,c,d){a=Qh(Q,Nc.d(d,c,Kc([a],0)));return A.c(af,G(a),H(a))}a.i=2;a.f=function(a){var c=G(a);a=K(a);var d=G(a);a=H(a);return b(c,d,a)};a.d=b;return a}(),b=function(b,e,f){switch(arguments.length){case 0:return bh;case 1:return b;
case 2:return a.call(this,b,e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.l=function(){return bh};b.b=function(a){return a};b.a=a;b.d=c.d;return b}(),Sh=function(){function a(a,b){for(;;)if(Q(b)<Q(a)){var c=a;a=b;b=c}else return A.c(function(a,b){return function(a,c){return nd(b,c)?a:Xc.a(a,c)}}(a,b),a,a)}var b=null,c=function(){function a(b,
d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return c.call(this,b,d,l)}function c(a,d,e){a=Qh(function(a){return-Q(a)},Nc.d(e,d,Kc([a],0)));return A.c(b,G(a),H(a))}a.i=2;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=H(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-
2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=c.d;return b}(),Th=function(){function a(a,b){return Q(a)<Q(b)?A.c(function(a,c){return nd(b,c)?Xc.a(a,c):a},a,a):A.c(Xc,a,b)}var b=null,c=function(){function a(b,d,h){var l=null;if(2<arguments.length){for(var l=0,m=Array(arguments.length-2);l<m.length;)m[l]=arguments[l+2],++l;l=new F(m,0)}return c.call(this,b,d,l)}function c(a,d,
e){return A.c(b,a,Nc.a(e,d))}a.i=2;a.f=function(a){var b=G(a);a=K(a);var d=G(a);a=H(a);return c(b,d,a)};a.d=c;return a}(),b=function(b,e,f){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;)h[g]=arguments[g+2],++g;g=new F(h,0)}return c.d(b,e,g)}throw Error("Invalid arity: "+arguments.length);};b.i=2;b.f=c.f;b.b=function(a){return a};b.a=a;b.d=c.d;return b}();
function Uh(a,b){return A.c(function(b,d){var e=R.c(d,0,null),f=R.c(d,1,null);return nd(a,e)?Rc.c(b,f,S.a(a,e)):b},T.c(Sc,a,Tg(b)),b)}function Vh(a,b){return A.c(function(a,d){var e=Yg(d,b);return Rc.c(a,e,Nc.a(S.c(a,e,bh),d))},Uf,a)}function Wh(a){return A.c(function(a,c){var d=R.c(c,0,null),e=R.c(c,1,null);return Rc.c(a,e,d)},Uf,a)}
var Xh=function(){function a(a,b,c){a=Q(a)<=Q(b)?new W(null,3,5,uf,[a,b,Wh(c)],null):new W(null,3,5,uf,[b,a,c],null);b=R.c(a,0,null);c=R.c(a,1,null);var g=R.c(a,2,null),h=Vh(b,Vg(g));return A.c(function(a,b,c,d,e){return function(f,g){var h=function(){var a=Uh(Yg(g,Tg(d)),d);return e.b?e.b(a):e.call(null,a)}();return t(h)?A.c(function(){return function(a,b){return Nc.a(a,Wg.d(Kc([b,g],0)))}}(h,a,b,c,d,e),f,h):f}}(a,b,c,g,h),bh,c)}function b(a,b){if(D(a)&&D(b)){var c=Sh.a(fh(Tg(G(a))),fh(Tg(G(b)))),
g=Q(a)<=Q(b)?new W(null,2,5,uf,[a,b],null):new W(null,2,5,uf,[b,a],null),h=R.c(g,0,null),l=R.c(g,1,null),m=Vh(h,c);return A.c(function(a,b,c,d,e){return function(f,g){var h=function(){var b=Yg(g,a);return e.b?e.b(b):e.call(null,b)}();return t(h)?A.c(function(){return function(a,b){return Nc.a(a,Wg.d(Kc([b,g],0)))}}(h,a,b,c,d,e),f,h):f}}(c,g,h,l,m),bh,l)}return bh}var c=null,c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,f)}throw Error("Invalid arity: "+
arguments.length);};c.a=b;c.c=a;return c}();r("mori.apply",T);r("mori.apply.f2",T.a);r("mori.apply.f3",T.c);r("mori.apply.f4",T.n);r("mori.apply.f5",T.r);r("mori.apply.fn",T.K);r("mori.count",Q);r("mori.distinct",function(a){return function c(a,e){return new V(null,function(){return function(a,d){for(;;){var e=a,l=R.c(e,0,null);if(e=D(e))if(nd(d,l))l=H(e),e=d,a=l,d=e;else return M(l,c(H(e),Nc.a(d,l)));else return null}}.call(null,a,e)},null,null)}(a,bh)});r("mori.empty",Oc);r("mori.first",G);r("mori.second",Lc);r("mori.next",K);
r("mori.rest",H);r("mori.seq",D);r("mori.conj",Nc);r("mori.conj.f0",Nc.l);r("mori.conj.f1",Nc.b);r("mori.conj.f2",Nc.a);r("mori.conj.fn",Nc.K);r("mori.cons",M);r("mori.find",function(a,b){return null!=a&&bd(a)&&nd(a,b)?new W(null,2,5,uf,[b,S.a(a,b)],null):null});r("mori.nth",R);r("mori.nth.f2",R.a);r("mori.nth.f3",R.c);r("mori.last",function(a){for(;;){var b=K(a);if(null!=b)a=b;else return G(a)}});r("mori.assoc",Rc);r("mori.assoc.f3",Rc.c);r("mori.assoc.fn",Rc.K);r("mori.dissoc",Sc);
r("mori.dissoc.f1",Sc.b);r("mori.dissoc.f2",Sc.a);r("mori.dissoc.fn",Sc.K);r("mori.getIn",cf);r("mori.getIn.f2",cf.a);r("mori.getIn.f3",cf.c);r("mori.updateIn",df);r("mori.updateIn.f3",df.c);r("mori.updateIn.f4",df.n);r("mori.updateIn.f5",df.r);r("mori.updateIn.f6",df.P);r("mori.updateIn.fn",df.K);r("mori.assocIn",function Yh(b,c,d){var e=R.c(c,0,null);return(c=Ed(c))?Rc.c(b,e,Yh(S.a(b,e),c,d)):Rc.c(b,e,d)});r("mori.fnil",Ke);r("mori.fnil.f2",Ke.a);r("mori.fnil.f3",Ke.c);r("mori.fnil.f4",Ke.n);
r("mori.disj",Xc);r("mori.disj.f1",Xc.b);r("mori.disj.f2",Xc.a);r("mori.disj.fn",Xc.K);r("mori.pop",function(a){return null==a?null:mb(a)});r("mori.peek",Wc);r("mori.hash",nc);r("mori.get",S);r("mori.get.f2",S.a);r("mori.get.f3",S.c);r("mori.hasKey",nd);r("mori.isEmpty",Yc);r("mori.reverse",Jd);r("mori.take",Pe);r("mori.take.f1",Pe.b);r("mori.take.f2",Pe.a);r("mori.drop",Qe);r("mori.drop.f1",Qe.b);r("mori.drop.f2",Qe.a);r("mori.takeNth",rh);r("mori.takeNth.f1",rh.b);r("mori.takeNth.f2",rh.a);
r("mori.partition",bf);r("mori.partition.f2",bf.a);r("mori.partition.f3",bf.c);r("mori.partition.f4",bf.n);r("mori.partitionAll",kh);r("mori.partitionAll.f1",kh.b);r("mori.partitionAll.f2",kh.a);r("mori.partitionAll.f3",kh.c);r("mori.partitionBy",th);r("mori.partitionBy.f1",th.b);r("mori.partitionBy.f2",th.a);r("mori.iterate",function Zh(b,c){return M(c,new V(null,function(){return Zh(b,b.b?b.b(c):b.call(null,c))},null,null))});r("mori.into",af);r("mori.into.f2",af.a);r("mori.into.f3",af.c);
r("mori.merge",Wg);r("mori.mergeWith",Xg);r("mori.subvec",Cf);r("mori.subvec.f2",Cf.a);r("mori.subvec.f3",Cf.c);r("mori.takeWhile",lh);r("mori.takeWhile.f1",lh.b);r("mori.takeWhile.f2",lh.a);r("mori.dropWhile",Re);r("mori.dropWhile.f1",Re.b);r("mori.dropWhile.f2",Re.a);r("mori.groupBy",function(a,b){return ce(A.c(function(b,d){var e=a.b?a.b(d):a.call(null,d);return ee.c(b,e,Nc.a(S.c(b,e,Mc),d))},Ob(Uf),b))});r("mori.interpose",function(a,b){return Qe.a(1,Ue.a(Se.b(a),b))});r("mori.interleave",Ue);
r("mori.interleave.f2",Ue.a);r("mori.interleave.fn",Ue.K);r("mori.concat",ae);r("mori.concat.f0",ae.l);r("mori.concat.f1",ae.b);r("mori.concat.f2",ae.a);r("mori.concat.fn",ae.K);function $e(a){return a instanceof Array||cd(a)}r("mori.flatten",function(a){return Xe.a(function(a){return!$e(a)},H(Ze(a)))});r("mori.lazySeq",function(a){return new V(null,a,null,null)});r("mori.keys",Tg);r("mori.selectKeys",Yg);r("mori.vals",Vg);r("mori.primSeq",Jc);r("mori.primSeq.f1",Jc.b);r("mori.primSeq.f2",Jc.a);
r("mori.map",Oe);r("mori.map.f1",Oe.b);r("mori.map.f2",Oe.a);r("mori.map.f3",Oe.c);r("mori.map.f4",Oe.n);r("mori.map.fn",Oe.K);
r("mori.mapIndexed",function(a,b){return function d(b,f){return new V(null,function(){var g=D(f);if(g){if(fd(g)){for(var h=Yb(g),l=Q(h),m=Td(l),p=0;;)if(p<l)Xd(m,function(){var d=b+p,f=C.a(h,p);return a.a?a.a(d,f):a.call(null,d,f)}()),p+=1;else break;return Wd(m.ca(),d(b+l,Zb(g)))}return M(function(){var d=G(g);return a.a?a.a(b,d):a.call(null,b,d)}(),d(b+1,H(g)))}return null},null,null)}(0,b)});r("mori.mapcat",We);r("mori.mapcat.f1",We.b);r("mori.mapcat.fn",We.K);r("mori.reduce",A);
r("mori.reduce.f2",A.a);r("mori.reduce.f3",A.c);r("mori.reduceKV",function(a,b,c){return null!=c?xb(c,a,b):b});r("mori.keep",Le);r("mori.keep.f1",Le.b);r("mori.keep.f2",Le.a);r("mori.keepIndexed",Ne);r("mori.keepIndexed.f1",Ne.b);r("mori.keepIndexed.f2",Ne.a);r("mori.filter",Xe);r("mori.filter.f1",Xe.b);r("mori.filter.f2",Xe.a);r("mori.remove",Ye);r("mori.remove.f1",Ye.b);r("mori.remove.f2",Ye.a);r("mori.some",Fe);r("mori.every",Ee);r("mori.equals",sc);r("mori.equals.f1",sc.b);
r("mori.equals.f2",sc.a);r("mori.equals.fn",sc.K);r("mori.range",qh);r("mori.range.f0",qh.l);r("mori.range.f1",qh.b);r("mori.range.f2",qh.a);r("mori.range.f3",qh.c);r("mori.repeat",Se);r("mori.repeat.f1",Se.b);r("mori.repeat.f2",Se.a);r("mori.repeatedly",Te);r("mori.repeatedly.f1",Te.b);r("mori.repeatedly.f2",Te.a);r("mori.sort",sd);r("mori.sort.f1",sd.b);r("mori.sort.f2",sd.a);r("mori.sortBy",td);r("mori.sortBy.f2",td.a);r("mori.sortBy.f3",td.c);r("mori.intoArray",Ia);r("mori.intoArray.f1",Ia.b);
r("mori.intoArray.f2",Ia.a);r("mori.subseq",nh);r("mori.subseq.f3",nh.c);r("mori.subseq.f5",nh.r);r("mori.dedupe",Fh);r("mori.dedupe.f0",Fh.l);r("mori.dedupe.f1",Fh.b);r("mori.transduce",wd);r("mori.transduce.f3",wd.c);r("mori.transduce.f4",wd.n);r("mori.eduction",function(a,b){return new Gh(a,b)});r("mori.sequence",Ce);r("mori.sequence.f1",Ce.b);r("mori.sequence.f2",Ce.a);r("mori.sequence.fn",Ce.K);r("mori.completing",vd);r("mori.completing.f1",vd.b);r("mori.completing.f2",vd.a);r("mori.list",Kd);
r("mori.vector",Af);r("mori.hashMap",Pg);r("mori.set",fh);r("mori.sortedSet",gh);r("mori.sortedSetBy",hh);r("mori.sortedMap",Qg);r("mori.sortedMapBy",Rg);r("mori.queue",function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){return af.a?af.a(Mf,a):af.call(null,Mf,a)}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}());r("mori.keyword",Pd);r("mori.keyword.f1",Pd.b);
r("mori.keyword.f2",Pd.a);r("mori.symbol",rc);r("mori.symbol.f1",rc.b);r("mori.symbol.f2",rc.a);r("mori.zipmap",function(a,b){for(var c=Ob(Uf),d=D(a),e=D(b);;)if(d&&e)c=ee.c(c,G(d),G(e)),d=K(d),e=K(e);else return Qb(c)});r("mori.isList",function(a){return a?a.j&33554432||a.wc?!0:a.j?!1:w(Eb,a):w(Eb,a)});r("mori.isSeq",kd);r("mori.isVector",ed);r("mori.isMap",dd);r("mori.isSet",ad);r("mori.isKeyword",function(a){return a instanceof U});r("mori.isSymbol",function(a){return a instanceof qc});
r("mori.isCollection",$c);r("mori.isSequential",cd);r("mori.isAssociative",bd);r("mori.isCounted",Ec);r("mori.isIndexed",Fc);r("mori.isReduceable",function(a){return a?a.j&524288||a.Sb?!0:a.j?!1:w(vb,a):w(vb,a)});r("mori.isSeqable",ld);r("mori.isReversible",Id);r("mori.union",Rh);r("mori.union.f0",Rh.l);r("mori.union.f1",Rh.b);r("mori.union.f2",Rh.a);r("mori.union.fn",Rh.K);r("mori.intersection",Sh);r("mori.intersection.f1",Sh.b);r("mori.intersection.f2",Sh.a);r("mori.intersection.fn",Sh.K);
r("mori.difference",Th);r("mori.difference.f1",Th.b);r("mori.difference.f2",Th.a);r("mori.difference.fn",Th.K);r("mori.join",Xh);r("mori.join.f2",Xh.a);r("mori.join.f3",Xh.c);r("mori.index",Vh);r("mori.project",function(a,b){return fh(Oe.a(function(a){return Yg(a,b)},a))});r("mori.mapInvert",Wh);r("mori.rename",function(a,b){return fh(Oe.a(function(a){return Uh(a,b)},a))});r("mori.renameKeys",Uh);r("mori.isSubset",function(a,b){return Q(a)<=Q(b)&&Ee(function(a){return nd(b,a)},a)});
r("mori.isSuperset",function(a,b){return Q(a)>=Q(b)&&Ee(function(b){return nd(a,b)},b)});r("mori.notEquals",je);r("mori.notEquals.f1",je.b);r("mori.notEquals.f2",je.a);r("mori.notEquals.fn",je.K);r("mori.gt",Ad);r("mori.gt.f1",Ad.b);r("mori.gt.f2",Ad.a);r("mori.gt.fn",Ad.K);r("mori.gte",Bd);r("mori.gte.f1",Bd.b);r("mori.gte.f2",Bd.a);r("mori.gte.fn",Bd.K);r("mori.lt",yd);r("mori.lt.f1",yd.b);r("mori.lt.f2",yd.a);r("mori.lt.fn",yd.K);r("mori.lte",zd);r("mori.lte.f1",zd.b);r("mori.lte.f2",zd.a);
r("mori.lte.fn",zd.K);r("mori.compare",od);r("mori.partial",Je);r("mori.partial.f1",Je.b);r("mori.partial.f2",Je.a);r("mori.partial.f3",Je.c);r("mori.partial.f4",Je.n);r("mori.partial.fn",Je.K);r("mori.comp",Ie);r("mori.comp.f0",Ie.l);r("mori.comp.f1",Ie.b);r("mori.comp.f2",Ie.a);r("mori.comp.f3",Ie.c);r("mori.comp.fn",Ie.K);
r("mori.pipeline",function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){function b(a,c){return c.b?c.b(a):c.call(null,a)}return A.a?A.a(b,a):A.call(null,b,a)}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}());
r("mori.curry",function(){function a(a,d){var e=null;if(1<arguments.length){for(var e=0,f=Array(arguments.length-1);e<f.length;)f[e]=arguments[e+1],++e;e=new F(f,0)}return b.call(this,a,e)}function b(a,b){return function(e){return T.a(a,M.a?M.a(e,b):M.call(null,e,b))}}a.i=1;a.f=function(a){var d=G(a);a=H(a);return b(d,a)};a.d=b;return a}());
r("mori.juxt",function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){return function(){function b(a){var c=null;if(0<arguments.length){for(var c=0,d=Array(arguments.length-0);c<d.length;)d[c]=arguments[c+0],++c;c=new F(d,0)}return e.call(this,c)}function e(b){var d=function(){function d(a){return T.a(a,b)}return Oe.a?Oe.a(d,a):Oe.call(null,d,a)}();return Ia.b?Ia.b(d):Ia.call(null,
d)}b.i=0;b.f=function(a){a=D(a);return e(a)};b.d=e;return b}()}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}());
r("mori.knit",function(){function a(a){var d=null;if(0<arguments.length){for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new F(e,0)}return b.call(this,d)}function b(a){return function(b){var e=function(){function e(a,b){return a.b?a.b(b):a.call(null,b)}return Oe.c?Oe.c(e,a,b):Oe.call(null,e,a,b)}();return Ia.b?Ia.b(e):Ia.call(null,e)}}a.i=0;a.f=function(a){a=D(a);return b(a)};a.d=b;return a}());r("mori.sum",xd);r("mori.sum.f0",xd.l);r("mori.sum.f1",xd.b);
r("mori.sum.f2",xd.a);r("mori.sum.fn",xd.K);r("mori.inc",function(a){return a+1});r("mori.dec",function(a){return a-1});r("mori.isEven",Ge);r("mori.isOdd",function(a){return!Ge(a)});r("mori.each",function(a,b){for(var c=D(a),d=null,e=0,f=0;;)if(f<e){var g=d.Q(null,f);b.b?b.b(g):b.call(null,g);f+=1}else if(c=D(c))fd(c)?(e=Yb(c),c=Zb(c),d=e,e=Q(e)):(d=g=G(c),b.b?b.b(d):b.call(null,d),c=K(c),d=null,e=0),f=0;else return null});r("mori.identity",ud);
r("mori.constantly",function(a){return function(){function b(b){if(0<arguments.length)for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;return a}b.i=0;b.f=function(b){D(b);return a};b.d=function(){return a};return b}()});r("mori.toJs",Kh);
r("mori.toClj",function(){function a(a,b){return Ph.d(a,Kc([Oh,b],0))}function b(a){return Ph.b(a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.b=b;c.a=a;return c}());r("mori.configure",function(a,b){switch(a){case "print-length":return la=b;case "print-level":return ma=b;default:throw Error([z("No matching clause: "),z(a)].join(""));}});r("mori.meta",Vc);r("mori.withMeta",O);
r("mori.varyMeta",ie);r("mori.varyMeta.f2",ie.a);r("mori.varyMeta.f3",ie.c);r("mori.varyMeta.f4",ie.n);r("mori.varyMeta.f5",ie.r);r("mori.varyMeta.f6",ie.P);r("mori.varyMeta.fn",ie.K);r("mori.alterMeta",Dh);r("mori.resetMeta",function(a,b){return a.k=b});V.prototype.inspect=function(){return this.toString()};F.prototype.inspect=function(){return this.toString()};Hc.prototype.inspect=function(){return this.toString()};wg.prototype.inspect=function(){return this.toString()};pg.prototype.inspect=function(){return this.toString()};
qg.prototype.inspect=function(){return this.toString()};Fd.prototype.inspect=function(){return this.toString()};Ld.prototype.inspect=function(){return this.toString()};Hd.prototype.inspect=function(){return this.toString()};W.prototype.inspect=function(){return this.toString()};Vd.prototype.inspect=function(){return this.toString()};Bf.prototype.inspect=function(){return this.toString()};Df.prototype.inspect=function(){return this.toString()};Z.prototype.inspect=function(){return this.toString()};
X.prototype.inspect=function(){return this.toString()};pa.prototype.inspect=function(){return this.toString()};rg.prototype.inspect=function(){return this.toString()};Lg.prototype.inspect=function(){return this.toString()};$g.prototype.inspect=function(){return this.toString()};ch.prototype.inspect=function(){return this.toString()};ph.prototype.inspect=function(){return this.toString()};U.prototype.inspect=function(){return this.toString()};qc.prototype.inspect=function(){return this.toString()};
Lf.prototype.inspect=function(){return this.toString()};Kf.prototype.inspect=function(){return this.toString()};r("mori.mutable.thaw",function(a){return Ob(a)});r("mori.mutable.freeze",ce);r("mori.mutable.conj",de);r("mori.mutable.conj.f0",de.l);r("mori.mutable.conj.f1",de.b);r("mori.mutable.conj.f2",de.a);r("mori.mutable.conj.fn",de.K);r("mori.mutable.assoc",ee);r("mori.mutable.assoc.f3",ee.c);r("mori.mutable.assoc.fn",ee.K);r("mori.mutable.dissoc",fe);r("mori.mutable.dissoc.f2",fe.a);r("mori.mutable.dissoc.fn",fe.K);r("mori.mutable.pop",function(a){return Ub(a)});r("mori.mutable.disj",ge);
r("mori.mutable.disj.f2",ge.a);r("mori.mutable.disj.fn",ge.K);;return this.mori;}.call({});});

},{}],"shim/auxrandom":[function(require,module,exports){
(function() {
  var MersenneTwisterFast;

  MersenneTwisterFast = require('./engine-scala').MersenneTwisterFast;

  module.exports = MersenneTwisterFast();

}).call(this);

},{"./engine-scala":"shim/engine-scala"}],"shim/cloner":[function(require,module,exports){
(function() {
  var JSType, _, cloneFunc;

  _ = require('lodash');

  JSType = require('util/typechecker');

  cloneFunc = function(obj) {
    var basicClone, entryCopyFunc, properties;
    if (JSType(obj).isObject() && !JSType(obj).isFunction()) {
      properties = Object.getOwnPropertyNames(obj);
      entryCopyFunc = function(acc, x) {
        acc[x] = cloneFunc(obj[x]);
        return acc;
      };
      basicClone = new obj.constructor();
      return _(properties).reduce(entryCopyFunc, basicClone);
    } else {
      return obj;
    }
  };

  module.exports = cloneFunc;

}).call(this);

},{"lodash":"lodash","util/typechecker":"util/typechecker"}],"shim/engine-scala":[function(require,module,exports){
(function (global){
(function() {

(function(){'use strict';
function f(a){return function(b){this[a]=b}}function h(a){return function(){return this[a]}}function k(a){return function(){return a}}var m,aa="object"===typeof __ScalaJSEnv&&__ScalaJSEnv?__ScalaJSEnv:{},p="object"===typeof aa.global&&aa.global?aa.global:"object"===typeof global&&global&&global.Object===Object?global:this;aa.global=p;var ba="object"===typeof aa.exportsNamespace&&aa.exportsNamespace?aa.exportsNamespace:p;aa.exportsNamespace=ba;p.Object.freeze(aa);
var ca={semantics:{asInstanceOfs:2,moduleInit:2,strictFloats:!1},assumingES6:!1};p.Object.freeze(ca);p.Object.freeze(ca.semantics);var q=p.Math.imul||function(a,b){var c=a&65535,d=b&65535;return c*d+((a>>>16&65535)*d+c*(b>>>16&65535)<<16>>>0)|0},da=0,ea=p.WeakMap?new p.WeakMap:null;function fa(a){return function(b,c){return!(!b||!b.c||b.c.Ra!==c||b.c.Pa!==a)}}function ga(a){for(var b in a)return b}function ha(a,b){return ia(a,b,0)}
function ia(a,b,c){var d=new a.Fc(b[c]);if(c<b.length-1){a=a.Ua;c+=1;for(var e=d.a,g=0;g<e.length;g++)e[g]=ia(a,b,c)}return d}function ja(a){return void 0===a?"undefined":a.toString()}
function ka(a){switch(typeof a){case "string":return s(la);case "number":var b=a|0;return b===a?b<<24>>24===b&&1/b!==1/-0?s(ma):b<<16>>16===b&&1/b!==1/-0?s(na):s(pa):"number"===typeof a?s(qa):s(ra);case "boolean":return s(sa);case "undefined":return s(ta);default:if(null===a)throw(new t).b();return ua(a)?s(va):a&&a.c?s(a.c):null}}
function wa(a){switch(typeof a){case "string":return xa(u(),a);case "number":return ya(za(),a);case "boolean":return a?1231:1237;case "undefined":return 0;default:return a&&a.c||null===a?a.z():null===ea?42:Aa(a)}}function Ba(a,b,c){return"string"===typeof a?a.substring(b,c):a.Kd(b,c)}function Ca(a){return 2147483647<a?2147483647:-2147483648>a?-2147483648:a|0}
function Da(a,b){for(var c=p.Object.getPrototypeOf,d=p.Object.getOwnPropertyDescriptor,e=c(a);null!==e;){var g=d(e,b);if(void 0!==g)return g;e=c(e)}}function Ea(a,b,c){a=Da(a,c);if(void 0!==a)return c=a.get,void 0!==c?c.call(b):a.value}function Fa(a,b,c,d){a=Da(a,c);if(void 0!==a&&(a=a.set,void 0!==a)){a.call(b,d);return}throw new p.TypeError("super has no setter '"+c+"'.");}
var Aa=null!==ea?function(a){switch(typeof a){case "string":case "number":case "boolean":case "undefined":return wa(a);default:if(null===a)return 0;var b=ea.get(a);void 0===b&&(da=b=da+1|0,ea.set(a,b));return b}}:function(a){if(a&&a.c){var b=a.$idHashCode$0;if(void 0!==b)return b;if(p.Object.isSealed(a))return 42;da=b=da+1|0;return a.$idHashCode$0=b}return null===a?0:wa(a)};function Ga(a){return null===a?v().x:a}this.__ScalaJSExportsNamespace=ba;
function Ha(){this.qb=this.Fc=void 0;this.Pa=this.Ua=this.da=null;this.Ra=0;this.sc=null;this.ib="";this.$=this.gb=this.hb=void 0;this.name="";this.isRawJSType=this.isArrayClass=this.isInterface=this.isPrimitive=!1;this.isInstance=void 0}function Ia(a,b,c){var d=new Ha;d.da={};d.Ua=null;d.sc=a;d.ib=b;d.$=k(!1);d.name=c;d.isPrimitive=!0;d.isInstance=k(!1);return d}
function w(a,b,c,d,e,g,r){var l=new Ha,D=ga(a);g=g||function(a){return!!(a&&a.c&&a.c.da[D])};r=r||function(a,b){return!!(a&&a.c&&a.c.Ra===b&&a.c.Pa.da[D])};l.qb=e;l.da=c;l.ib="L"+b+";";l.$=r;l.name=b;l.isInterface=!1;l.isRawJSType=!!d;l.isInstance=g;return l}
function Ja(a){function b(a){if("number"===typeof a){this.a=Array(a);for(var b=0;b<a;b++)this.a[b]=e}else this.a=a}var c=new Ha,d=a.sc,e="longZero"==d?v().x:d;b.prototype=new x;b.prototype.constructor=b;b.prototype.Dc=function(){return this.a instanceof Array?new b(this.a.slice(0)):new b(new this.a.constructor(this.a))};b.prototype.c=c;var d="["+a.ib,g=a.Pa||a,r=a.Ra+1;c.Fc=b;c.qb=Ka;c.da={d:1};c.Ua=a;c.Pa=g;c.Ra=r;c.sc=null;c.ib=d;c.hb=void 0;c.gb=void 0;c.$=void 0;c.name=d;c.isPrimitive=!1;c.isInterface=
!1;c.isArrayClass=!0;c.isInstance=function(a){return g.$(a,r)};return c}function s(a){if(!a.hb){var b=new La;b.jb=a;a.hb=b}return a.hb}function Ma(a){a.gb||(a.gb=Ja(a));return a.gb}Ha.prototype.getFakeInstance=function(){return this===la?"some string":this===sa?!1:this===ma||this===na||this===pa||this===qa||this===ra?0:this===va?v().x:this===ta?void 0:{c:this}};Ha.prototype.getSuperclass=function(){return this.qb?s(this.qb):null};
Ha.prototype.getComponentType=function(){return this.Ua?s(this.Ua):null};Ha.prototype.newArrayOfThisClass=function(a){for(var b=this,c=0;c<a.length;c++)b=Ma(b);return ha(b,a)};var Na=Ia(!1,"Z","boolean"),Oa=Ia(0,"C","char"),Pa=Ia(0,"B","byte"),Qa=Ia(0,"S","short"),Ra=Ia(0,"I","int"),Sa=Ia("longZero","J","long"),Ta=Ia(0,"F","float"),Ua=Ia(0,"D","double");Na.$=fa(Na);Oa.$=fa(Oa);Pa.$=fa(Pa);Qa.$=fa(Qa);Ra.$=fa(Ra);Sa.$=fa(Sa);Ta.$=fa(Ta);Ua.$=fa(Ua);function Va(){}function x(){}x.prototype=Va.prototype;Va.prototype.b=function(){return this};Va.prototype.m=function(){var a=Wa(ka(this)),b=(+(this.z()>>>0)).toString(16);return a+"@"+b};Va.prototype.z=function(){return Aa(this)};Va.prototype.toString=function(){return this.m()};var Ka=w({d:0},"java.lang.Object",{d:1},void 0,void 0,function(a){return null!==a},function(a,b){var c=a&&a.c;if(c){var d=c.Ra||0;return!(d<b)&&(d>b||!c.Pa.isPrimitive)}return!1});Va.prototype.c=Ka;
function Xa(){this.Hb=null;this.Y=!1}Xa.prototype=new x;Xa.prototype.constructor=Xa;function Ya(a){if(!a.Y){var b=function(a){return void 0===a?y():(new Za).w(a)},c=$a();c.s()?c=y():(c=c.ga(),c=b(c));c.s()?c=y():(c=c.ga(),c=(new Za).w(c.lang));c.s()?c=y():(c=c.ga(),c=b(c));c.s()?c=y():(c=c.ga(),c=(new Za).w(c.StrictMath));c.s()?b=y():(c=c.ga(),b=b(c));a.Hb=b.s()?p.Math:b.ga();a.Y=!0}return a.Hb}Xa.prototype.c=w({se:0},"org.nlogo.web.StrictMath$",{se:1,d:1});var ab=void 0;
function bb(){ab||(ab=(new Xa).b());return ab}function cb(){this.Bc=null;this.Qi=this.ti=this.ui=this.ni=this.oi=this.Ii=this.xi=this.Di=this.Ci=this.Ji=this.Ai=this.Gi=this.zi=this.Fi=this.Bi=this.Hi=this.Ac=this.xc=this.yc=0;this.fj=this.ej=this.dj=this.ij=null;this.Y=0}cb.prototype=new x;cb.prototype.constructor=cb;cb.prototype.c=w({sf:0},"java.lang.Character$",{sf:1,d:1});var db=void 0;function La(){this.jb=null}La.prototype=new x;La.prototype.constructor=La;function Wa(a){return a.jb.name}
La.prototype.m=function(){return(this.jb.isInterface?"interface ":this.jb.isPrimitive?"":"class ")+Wa(this)};La.prototype.c=w({tf:0},"java.lang.Class",{tf:1,d:1});function eb(){this.Bc=null;this.Ac=this.Ei=this.yi=this.yc=this.xc=this.Mi=this.Li=this.Ni=0;this.Vc=null;this.Y=!1}eb.prototype=new x;eb.prototype.constructor=eb;eb.prototype.c=w({vf:0},"java.lang.Double$",{vf:1,d:1});var fb=void 0;function gb(){this.Bc=null;this.fi=this.Ac=this.xc=this.yc=0}gb.prototype=new x;
gb.prototype.constructor=gb;function hb(a){throw(new ib).f(jb(kb(new lb,mb(new z,['For input string: "','"'])),mb(new z,[a])));}
function nb(a){if(null===a||0===((new A).f(a).A.length|0))hb(a);else{var b=45===(65535&(a.charCodeAt(0)|0))||43===(65535&(a.charCodeAt(0)|0))?1:0;if(((new A).f(a).A.length|0)<=b)hb(a);else{for(;;){var c=b,d=(new A).f(a).A;if(c<(d.length|0))db||(db=(new cb).b()),c=65535&(a.charCodeAt(b)|0),0>(48<=c&&57>=c&&10>(-48+c|0)?-48+c|0:65<=c&&90>=c&&0>(-65+c|0)?-55+c|0:97<=c&&122>=c&&0>(-97+c|0)?-87+c|0:65313<=c&&65338>=c&&0>(-65313+c|0)?-65303+c|0:65345<=c&&65370>=c&&0>(-65345+c|0)?-65303+c|0:-1)&&hb(a),b=
1+b|0;else break}b=+p.parseInt(a,10);return b!==b||2147483647<b||-2147483648>b?hb(a):Ca(b)}}}function ob(a){a=a-(1431655765&a>>1)|0;a=(858993459&a)+(858993459&a>>2)|0;return q(16843009,252645135&(a+(a>>4)|0))>>24}function pb(a,b){var c=b,c=c|c>>>1|0,c=c|c>>>2|0,c=c|c>>>4|0,c=c|c>>>8|0;return 32-ob(c|c>>>16|0)|0}function qb(a,b){return ob(-1+(b&(-b|0))|0)}gb.prototype.c=w({Af:0},"java.lang.Integer$",{Af:1,d:1});var rb=void 0;function B(){rb||(rb=(new gb).b());return rb}function sb(){}
sb.prototype=new x;sb.prototype.constructor=sb;function tb(){}tb.prototype=sb.prototype;function ub(){this.Zc=this.df=this.Wc=this.vd=null}ub.prototype=new x;ub.prototype.constructor=ub;ub.prototype.b=function(){vb=this;this.vd=wb(!1);this.Wc=wb(!0);this.df=null;this.Zc=p.performance?p.performance.now?function(){return+p.performance.now()}:p.performance.webkitNow?function(){return+p.performance.webkitNow()}:function(){return+(new p.Date).getTime()}:function(){return+(new p.Date).getTime()};return this};
ub.prototype.c=w({If:0},"java.lang.System$",{If:1,d:1});var vb=void 0;function xb(){vb||(vb=(new ub).b());return vb}function yb(){this.Md=this.Yb=null}yb.prototype=new x;yb.prototype.constructor=yb;function zb(){}zb.prototype=yb.prototype;yb.prototype.b=function(){this.Yb=!1;return this};yb.prototype.ga=function(){this.Yb||(this.Md=this.tc.Gd,this.Yb=!0);return this.Md};function Ab(){}Ab.prototype=new x;Ab.prototype.constructor=Ab;function Bb(){}Bb.prototype=Ab.prototype;function Cb(){}
Cb.prototype=new x;Cb.prototype.constructor=Cb;function Db(){}Db.prototype=Cb.prototype;function Eb(){}Eb.prototype=new x;Eb.prototype.constructor=Eb;Eb.prototype.c=w({lg:0},"scala.math.Ordered$",{lg:1,d:1});var Fb=void 0;function Gb(){this.Ie=this.ke=this.be=this.Fe=this.Ee=this.Ce=this.he=this.ee=this.ce=this.hi=this.gi=this.Ge=this.Ne=this.Te=this.Qd=this.Me=this.Pd=this.Sd=this.Od=this.ye=this.le=this.je=this.fe=this.Je=this.ie=this.Re=this.Vd=null;this.Y=0}Gb.prototype=new x;
Gb.prototype.constructor=Gb;
Gb.prototype.b=function(){Hb=this;this.Vd=(new Ib).b();Jb||(Jb=(new Kb).b());this.Re=Jb;Lb||(Lb=(new Mb).b());this.ie=Lb;Nb||(Nb=(new Ob).b());this.Je=Nb;this.fe=Pb();this.je=Qb();this.le=Rb();this.ye=Sb();Tb||(Tb=(new Ub).b());this.Od=Tb;Vb||(Vb=(new Wb).b());this.Sd=Vb;Xb||(Xb=(new Yb).b());this.Pd=Xb;Zb||(Zb=(new $b).b());this.Me=Zb;ac||(ac=(new bc).b());this.Qd=ac;cc||(cc=(new dc).b());this.Te=cc;ec||(ec=(new fc).b());this.Ne=ec;gc||(gc=(new hc).b());this.Ge=gc;ic||(ic=(new jc).b());this.ce=ic;
kc||(kc=(new lc).b());this.ee=kc;mc||(mc=(new nc).b());this.he=mc;oc||(oc=(new pc).b());this.Ce=oc;Fb||(Fb=(new Eb).b());this.Ee=Fb;qc||(qc=(new rc).b());this.Fe=qc;sc||(sc=(new tc).b());this.be=sc;uc||(uc=(new vc).b());this.ke=uc;wc||(wc=(new xc).b());this.Ie=wc;return this};Gb.prototype.c=w({ng:0},"scala.package$",{ng:1,d:1});var Hb=void 0;function yc(){this.Be=this.Ae=this.Wd=this.De=this.Ud=this.Se=this.Xd=this.ae=this.de=this.pe=this.ge=this.Zd=this.Le=this.Yd=null}yc.prototype=new x;
yc.prototype.constructor=yc;
yc.prototype.b=function(){zc=this;Ac||(Ac=(new Bc).b());this.Yd=Ac;Cc||(Cc=(new Dc).b());this.Le=Cc;Ec||(Ec=(new Fc).b());this.Zd=Ec;Gc||(Gc=(new Hc).b());this.ge=Gc;Ic||(Ic=(new Jc).b());this.pe=Ic;Kc||(Kc=(new Lc).b());this.de=Kc;Mc||(Mc=(new Nc).b());this.ae=Mc;Oc||(Oc=(new Pc).b());this.Xd=Oc;Qc||(Qc=(new Rc).b());this.Se=Qc;Sc||(Sc=(new Tc).b());this.Ud=Sc;Uc||(Uc=(new Vc).b());this.De=Uc;Wc||(Wc=(new Xc).b());this.Wd=Wc;Yc||(Yc=(new Zc).b());this.Ae=Yc;$c||($c=(new ad).b());this.Be=$c;return this};
yc.prototype.c=w({pg:0},"scala.reflect.ClassManifestFactory$",{pg:1,d:1});var zc=void 0;function bd(){}bd.prototype=new x;bd.prototype.constructor=bd;bd.prototype.c=w({qg:0},"scala.reflect.ManifestFactory$",{qg:1,d:1});var cd=void 0;function dd(){this.zc=this.wc=null}dd.prototype=new x;dd.prototype.constructor=dd;dd.prototype.b=function(){ed=this;zc||(zc=(new yc).b());this.wc=zc;cd||(cd=(new bd).b());this.zc=cd;return this};dd.prototype.c=w({Gg:0},"scala.reflect.package$",{Gg:1,d:1});var ed=void 0;
function fd(){ed||(ed=(new dd).b());return ed}function gd(){}gd.prototype=new x;gd.prototype.constructor=gd;gd.prototype.c=w({Hg:0},"scala.sys.package$",{Hg:1,d:1});var hd=void 0;function id(){this.qc=this.Gd=null}id.prototype=new x;id.prototype.constructor=id;id.prototype.m=function(){return"DynamicVariable("+this.qc.ga()+")"};id.prototype.w=function(a){this.Gd=a;a=new jd;if(null===this)throw kd(ld(),null);a.tc=this;md.prototype.b.call(a);this.qc=a;return this};
id.prototype.c=w({Ig:0},"scala.util.DynamicVariable",{Ig:1,d:1});function tc(){}tc.prototype=new x;tc.prototype.constructor=tc;tc.prototype.c=w({Kg:0},"scala.util.Either$",{Kg:1,d:1});var sc=void 0;function nd(){this.ch=null}nd.prototype=new x;nd.prototype.constructor=nd;nd.prototype.b=function(){this.ch=(new od).b();return this};nd.prototype.c=w({Og:0},"scala.util.control.Breaks",{Og:1,d:1});function pd(){}pd.prototype=new x;pd.prototype.constructor=pd;function qd(){}qd.prototype=pd.prototype;
function rd(a,b){var c;c=q(-862048943,b);B();c=c<<15|c>>>-15|0;c=q(461845907,c);c^=a;B();return-430675100+q(5,c<<13|c>>>-13|0)|0}function sd(a){a=q(-2048144789,a^(a>>>16|0));a^=a>>>13|0;a=q(-1028477387,a);return a^=a>>>16|0}function td(a){ud();var b=a.pa();if(0===b)return a=a.ra(),xa(u(),a);for(var c=-889275714,d=0;d<b;)c=rd(c,vd(wd(),a.qa(d))),d=1+d|0;return sd(c^b)}
function xd(a,b,c){var d=(new yd).r(0);c=(new yd).r(c);b.ya(zd(function(a,b,c){return function(a){c.Q=rd(c.Q,vd(wd(),a));b.Q=1+b.Q|0}}(a,d,c)));return sd(c.Q^d.Q)}function Yb(){}Yb.prototype=new x;Yb.prototype.constructor=Yb;Yb.prototype.c=w({Rg:0},"scala.collection.$colon$plus$",{Rg:1,d:1});var Xb=void 0;function Wb(){}Wb.prototype=new x;Wb.prototype.constructor=Wb;Wb.prototype.c=w({Sg:0},"scala.collection.$plus$colon$",{Sg:1,d:1});var Vb=void 0;
function Ad(a,b){for(var c=0,d=a.K();c<d;)b.ea(a.ma(c)),c=1+c|0}function Bd(){this.Tb=null}Bd.prototype=new x;Bd.prototype.constructor=Bd;Bd.prototype.b=function(){Cd=this;this.Tb=(new Dd).b();return this};Bd.prototype.c=w({Xg:0},"scala.collection.Iterator$",{Xg:1,d:1});var Cd=void 0;function Qb(){Cd||(Cd=(new Bd).b());return Cd}function Ed(a){a=Wa(ka(a.Bd()));var b;u();b=a;var c=Fd(46);b=b.lastIndexOf(c)|0;-1!==b&&(a=a.substring(1+b|0));b=Gd(u(),a,36);-1!==b&&(a=a.substring(0,b));return a}
function Hd(a,b,c,d){var e=Id();C(b.L,c);a.ya(zd(function(a,b,c,d){return function(a){if(b.Q)Jd(c,a),b.Q=!1;else return C(c.L,d),Jd(c,a)}}(a,e,b,d)));C(b.L,")");return b}function Kd(a,b,c){var d=(new Ld).b();return Hd(a,d,b,c).L.G}function Md(){}Md.prototype=new x;Md.prototype.constructor=Md;function Nd(){}Nd.prototype=Md.prototype;function Od(){}Od.prototype=new x;Od.prototype.constructor=Od;function Pd(){}Pd.prototype=Od.prototype;function bc(){}bc.prototype=new x;bc.prototype.constructor=bc;
bc.prototype.c=w({th:0},"scala.collection.immutable.Stream$$hash$colon$colon$",{th:1,d:1});var ac=void 0;
function Qd(a,b,c){if(32>c)return a.N().a[31&b];if(1024>c)return a.l().a[31&b>>5].a[31&b];if(32768>c)return a.o().a[31&b>>10].a[31&b>>5].a[31&b];if(1048576>c)return a.u().a[31&b>>15].a[31&b>>10].a[31&b>>5].a[31&b];if(33554432>c)return a.P().a[31&b>>20].a[31&b>>15].a[31&b>>10].a[31&b>>5].a[31&b];if(1073741824>c)return a.xa().a[31&b>>25].a[31&b>>20].a[31&b>>15].a[31&b>>10].a[31&b>>5].a[31&b];throw(new E).b();}
function F(a){if(null===a){Rd||(Rd=(new Sd).b());var b=Rd.xd.qc.ga();Td(b,Ud(u(),"NULL"));Td(b,"\n")}var b=ha(Ma(Ka),[a.a.length]),c=a.a.length;a=a.a;var d=b.a;if(a!==d||0>0+c)for(var e=0;e<c;e++)d[0+e]=a[0+e];else for(e=c-1;0<=e;e--)d[0+e]=a[0+e];return b}function Vd(){this.Ea=!1;this.Yc=this.bf=this.pb=this.Qa=null;this.Mb=!1;this.kd=this.ad=0}Vd.prototype=new x;Vd.prototype.constructor=Vd;
Vd.prototype.b=function(){Wd=this;this.Qa=(this.Ea=!!(p.ArrayBuffer&&p.Int32Array&&p.Float32Array&&p.Float64Array))?new p.ArrayBuffer(8):null;this.pb=this.Ea?new p.Int32Array(this.Qa,0,2):null;this.bf=this.Ea?new p.Float32Array(this.Qa,0,2):null;this.Yc=this.Ea?new p.Float64Array(this.Qa,0,1):null;if(this.Ea)this.pb[0]=16909060,a=1===((new p.Int8Array(this.Qa,0,8))[0]|0);else var a=!0;this.ad=(this.Mb=a)?0:1;this.kd=this.Mb?1:0;return this};
function ya(a,b){var c=b|0;if(c===b&&-Infinity!==1/b)return c;if(a.Ea)a.Yc[0]=b,c=Xd(Yd((new G).r(a.pb[a.ad]|0),32),Zd((new G).k(4194303,1023,0),(new G).r(a.pb[a.kd]|0)));else{if(b!==b)var c=!1,d=2047,e=+p.Math.pow(2,51);else if(Infinity===b||-Infinity===b)c=0>b,d=2047,e=0;else if(0===b)c=-Infinity===1/b,e=d=0;else{var g=(c=0>b)?-b:b;if(g>=+p.Math.pow(2,-1022)){var d=+p.Math.pow(2,52),e=+p.Math.log(g)/0.6931471805599453,e=+p.Math.floor(e)|0,e=1023>e?e:1023,r=g/+p.Math.pow(2,e)*d,g=+p.Math.floor(r),
r=r-g,g=0.5>r?g:0.5<r?1+g:0!==g%2?1+g:g;2<=g/d&&(e=1+e|0,g=1);1023<e?(e=2047,g=0):(e=1023+e|0,g-=d);d=e;e=g}else d=g/+p.Math.pow(2,-1074),e=+p.Math.floor(d),g=d-e,d=0,e=0.5>g?e:0.5<g?1+e:0!==e%2?1+e:e}e=+e;g=e|0;c=Xd(Yd((new G).r((c?-2147483648:0)|(d|0)<<20|e/4294967296|0),32),Zd((new G).k(4194303,1023,0),(new G).r(g)))}return $d(ae(c,be(c,32)))}Vd.prototype.c=w({Qh:0},"scala.scalajs.runtime.Bits$",{Qh:1,d:1});var Wd=void 0;function za(){Wd||(Wd=(new Vd).b());return Wd}
function ce(){this.ki=null;this.Y=!1}ce.prototype=new x;ce.prototype.constructor=ce;function Ud(a,b){return null===b?"null":ja(b)}function Gd(a,b,c){a=Fd(c);return b.indexOf(a)|0}function Fd(a){if(0===(-65536&a)){var b=p.String;return b.fromCharCode.apply(b,[a])}if(0>a||1114111<a)throw(new E).b();a=-65536+a|0;b=p.String;return b.fromCharCode.apply(b,[55296|a>>10,56320|1023&a])}
function xa(a,b){for(var c=0,d=1,e=-1+(b.length|0)|0;0<=e;)c=c+q(65535&(b.charCodeAt(e)|0),d)|0,d=q(31,d),e=-1+e|0;return c}ce.prototype.c=w({Sh:0},"scala.scalajs.runtime.RuntimeString$",{Sh:1,d:1});var de=void 0;function u(){de||(de=(new ce).b());return de}function ee(){this.gj=!1;this.Xe=this.Gc=this.Ye=null;this.Y=!1}ee.prototype=new x;ee.prototype.constructor=ee;
ee.prototype.b=function(){fe=this;for(var a={O:"java_lang_Object",T:"java_lang_String",V:"scala_Unit",Z:"scala_Boolean",C:"scala_Char",B:"scala_Byte",S:"scala_Short",I:"scala_Int",J:"scala_Long",F:"scala_Float",D:"scala_Double"},b=0;22>=b;)2<=b&&(a["T"+b]="scala_Tuple"+b),a["F"+b]="scala_Function"+b,b=1+b|0;this.Ye=a;this.Gc={sjsr_:"scala_scalajs_runtime_",sjs_:"scala_scalajs_",sci_:"scala_collection_immutable_",scm_:"scala_collection_mutable_",scg_:"scala_collection_generic_",sc_:"scala_collection_",
sr_:"scala_runtime_",s_:"scala_",jl_:"java_lang_",ju_:"java_util_"};this.Xe=p.Object.keys(this.Gc);return this};ee.prototype.c=w({Th:0},"scala.scalajs.runtime.StackTrace$",{Th:1,d:1});var fe=void 0;function ge(){fe||(fe=(new ee).b());return fe}function he(){}he.prototype=new x;he.prototype.constructor=he;function kd(a,b){return b&&b.c&&b.c.da.pc?b.Ia:b}function ie(a,b){return b&&b.c&&b.c.da.E?b:(new je).w(b)}he.prototype.c=w({Uh:0},"scala.scalajs.runtime.package$",{Uh:1,d:1});var le=void 0;
function ld(){le||(le=(new he).b());return le}var ta=w({Wh:0},"scala.runtime.BoxedUnit",{Wh:1,d:1},void 0,void 0,function(a){return void 0===a});function me(){}me.prototype=new x;me.prototype.constructor=me;me.prototype.c=w({Xh:0},"scala.runtime.BoxesRunTime$",{Xh:1,d:1});var ne=void 0,oe=w({$h:0},"scala.runtime.Null$",{$h:1,d:1});function pe(){}pe.prototype=new x;pe.prototype.constructor=pe;
function vd(a,b){var c;if(null===b)c=0;else if(b&&b.c&&b.c.da.Aa||"number"===typeof b)if(ne||(ne=(new me).b()),(b|0)===b&&1/b!==1/-0)c=b|0;else if(ua(b))c=$d(Ga(b)),c=qe((new G).r(c),Ga(b))?c:$d(ae(Ga(b),be(Ga(b),32)));else if("number"===typeof b){var d=Ca(+b);c=+b;d===c?c=d:(d=re(v(),+b),c=se(d)===c?$d(ae(d,be(d,32))):ya(za(),+b))}else c=wa(b);else c=wa(b);return c}function te(a){wd();var b=a.Da();return Kd(b,a.ra()+"(",",")}pe.prototype.c=w({ai:0},"scala.runtime.ScalaRunTime$",{ai:1,d:1});
var ue=void 0;function wd(){ue||(ue=(new pe).b());return ue}var sa=w({pf:0},"java.lang.Boolean",{pf:1,d:1,ha:1},void 0,void 0,function(a){return"boolean"===typeof a});function ve(){this.ab=0}ve.prototype=new x;ve.prototype.constructor=ve;ve.prototype.m=function(){return p.String.fromCharCode(this.ab)};function we(a){var b=new ve;b.ab=a;return b}ve.prototype.z=h("ab");ve.prototype.c=w({rf:0},"java.lang.Character",{rf:1,d:1,ha:1});function md(){yb.call(this)}md.prototype=new zb;
md.prototype.constructor=md;function xe(){}xe.prototype=md.prototype;function H(){this.ak=this.Ze=this.Cd=null}H.prototype=new x;H.prototype.constructor=H;function ye(){}m=ye.prototype=H.prototype;m.b=function(){H.prototype.ja.call(this,null,null);return this};m.lb=function(){var a=ge(),b;a:try{b=a.undef()}catch(c){a=ie(ld(),c);if(null!==a){if(a&&a.c&&a.c.da.pc){b=a.Ia;break a}throw kd(ld(),a);}throw c;}this.stackdata=b;return this};m.$c=h("Cd");
m.m=function(){var a=Wa(ka(this)),b=this.$c();return null===b?a:a+": "+b};m.ja=function(a,b){this.Cd=a;this.Ze=b;this.lb();return this};function ze(){this.oj=this.Zj=this.Yj=0;this.cf=!1}ze.prototype=new x;ze.prototype.constructor=ze;function Ae(){}Ae.prototype=ze.prototype;ze.prototype.b=function(){ze.prototype.nb.call(this,Be());return this};ze.prototype.nb=function(a){this.cf=!1;Ce(this,a);return this};
function De(){this.cd=this.yd=null;this.zd=this.Ad=0;this.Ca=this.dd=this.bc=null;this.Ob=this.jd=!1;this.Ue=0}De.prototype=new x;De.prototype.constructor=De;function Ee(a){if(a.Ob){a.jd=!0;a.Ca=a.bc.exec(a.dd);if(null!==a.Ca){var b=a.Ca[0];if(void 0===b)throw(new I).f("undefined.get");if(null===b)throw(new t).b();""===b&&(b=a.bc,b.lastIndex=1+(b.lastIndex|0)|0)}else a.Ob=!1;return null!==a.Ca}return!1}function Fe(a){if(null===a.Ca)throw(new Ge).f("No match available");return a.Ca}
De.prototype.c=w({Mf:0},"java.util.regex.Matcher",{Mf:1,d:1,nj:1});function He(){}He.prototype=new x;He.prototype.constructor=He;He.prototype.c=w({ag:0},"scala.Predef$$anon$3",{ag:1,d:1,Hd:1});function Ib(){}Ib.prototype=new x;Ib.prototype.constructor=Ib;Ib.prototype.m=k("object AnyRef");Ib.prototype.c=w({og:0},"scala.package$$anon$1",{og:1,d:1,wj:1});function Ie(){this.Mh=this.Pf=this.oc=this.dk=this.ck=this.pj=this.bk=this.bj=0}Ie.prototype=new qd;Ie.prototype.constructor=Ie;
Ie.prototype.b=function(){Je=this;this.oc=xa(u(),"Seq");this.Pf=xa(u(),"Map");this.Mh=xa(u(),"Set");return this};function Ke(a){var b=ud();if(a&&a.c&&a.c.da.kh){for(b=b.oc;!a.s();)Le();a=sd(b^0)}else a=xd(b,a,b.oc);return a}Ie.prototype.c=w({Qg:0},"scala.util.hashing.MurmurHash3$",{Qg:1,Cj:1,d:1});var Je=void 0;function ud(){Je||(Je=(new Ie).b());return Je}function Me(){}Me.prototype=new Pd;Me.prototype.constructor=Me;function Ne(){}Ne.prototype=Me.prototype;function Oe(){this.ca=null}
Oe.prototype=new Pd;Oe.prototype.constructor=Oe;function Pe(){}Pe.prototype=Oe.prototype;Oe.prototype.b=function(){this.ca=(new Qe).ob(this);return this};function Re(){this.Ha=null}Re.prototype=new x;Re.prototype.constructor=Re;function Se(){}Se.prototype=Re.prototype;Re.prototype.ob=function(a){if(null===a)throw kd(ld(),null);this.Ha=a;return this};function Te(){}Te.prototype=new Nd;Te.prototype.constructor=Te;function Ue(){}Ue.prototype=Te.prototype;function Ve(){}Ve.prototype=new x;m=Ve.prototype;
m.constructor=Ve;m.b=function(){return this};m.ea=function(){return this};m.m=k("\x3cfunction1\x3e");m.c=w({mh:0},"scala.collection.immutable.List$$anon$1",{mh:1,d:1,ta:1});function We(){}We.prototype=new x;We.prototype.constructor=We;function Xe(){}Xe.prototype=We.prototype;We.prototype.m=k("\x3cfunction1\x3e");function Ye(){this.Q=!1}Ye.prototype=new x;Ye.prototype.constructor=Ye;Ye.prototype.m=function(){return""+this.Q};function Id(){var a=new Ye;a.Q=!0;return a}
Ye.prototype.c=w({Vh:0},"scala.runtime.BooleanRef",{Vh:1,d:1,g:1});function yd(){this.Q=0}yd.prototype=new x;yd.prototype.constructor=yd;yd.prototype.m=function(){return""+this.Q};yd.prototype.r=function(a){this.Q=a;return this};yd.prototype.c=w({Yh:0},"scala.runtime.IntRef",{Yh:1,d:1,g:1});function Ze(){}Ze.prototype=new x;Ze.prototype.constructor=Ze;function $e(){}$e.prototype=Ze.prototype;function af(){this.td=this.sd=this.od=this.ud=this.qd=this.pd=this.rd=0;this.nd=null;this.p=0}
af.prototype=new x;af.prototype.constructor=af;af.prototype.b=function(){bf=this;this.rd=624;this.p|=1;this.pd=397;this.p|=2;this.qd=-1727483681;this.p|=4;this.ud=-2147483648;this.p|=8;this.od=2147483647;this.p|=16;this.sd=-1658038656;this.p|=32;this.td=-272236544;this.p|=64;this.nd="0";this.p|=128;return this};function J(){var a=cf();if(0===(1&a.p))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 141");return a.rd}
function L(){var a=cf();if(0===(32&a.p))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 146");return a.sd}function M(){var a=cf();if(0===(16&a.p))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 145");return a.od}function N(){var a=cf();if(0===(2&a.p))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 142");return a.pd}function df(){var a=cf();if(0===(128&a.p))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 148");return a.nd}
function O(){var a=cf();if(0===(64&a.p))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 147");return a.td}function P(){var a=cf();if(0===(8&a.p))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 144");return a.ud}af.prototype.c=w({re:0},"org.nlogo.web.MersenneTwisterFast$",{re:1,d:1,j:1,g:1});var bf=void 0;function cf(){bf||(bf=(new af).b());return bf}
var ma=w({qf:0},"java.lang.Byte",{qf:1,Aa:1,d:1,ha:1},void 0,void 0,function(a){return a<<24>>24===a&&1/a!==1/-0}),ra=w({uf:0},"java.lang.Double",{uf:1,Aa:1,d:1,ha:1},void 0,void 0,function(a){return"number"===typeof a});function ef(){H.call(this)}ef.prototype=new ye;ef.prototype.constructor=ef;function ff(){}ff.prototype=ef.prototype;ef.prototype.f=function(a){ef.prototype.ja.call(this,a,null);return this};function gf(){H.call(this)}gf.prototype=new ye;gf.prototype.constructor=gf;
function hf(){}hf.prototype=gf.prototype;gf.prototype.f=function(a){gf.prototype.ja.call(this,a,null);return this};
var qa=w({wf:0},"java.lang.Float",{wf:1,Aa:1,d:1,ha:1},void 0,void 0,function(a){return"number"===typeof a}),pa=w({zf:0},"java.lang.Integer",{zf:1,Aa:1,d:1,ha:1},void 0,void 0,function(a){return(a|0)===a&&1/a!==1/-0}),va=w({Df:0},"java.lang.Long",{Df:1,Aa:1,d:1,ha:1},void 0,void 0,function(a){return ua(a)}),na=w({Gf:0},"java.lang.Short",{Gf:1,Aa:1,d:1,ha:1},void 0,void 0,function(a){return a<<16>>16===a&&1/a!==1/-0});function jf(){}jf.prototype=new x;jf.prototype.constructor=jf;
function Be(){kf||(kf=(new jf).b());return Xd(Yd((new G).r(lf()),32),Zd((new G).k(4194303,1023,0),(new G).r(lf())))}function lf(){var a=4294967296*+p.Math.random();return Ca(-2147483648+ +p.Math.floor(a))}jf.prototype.c=w({Lf:0},"java.util.Random$",{Lf:1,d:1,j:1,g:1});var kf=void 0;function mf(){this.vc=this.Ba=null;this.Td=0}mf.prototype=new x;mf.prototype.constructor=mf;mf.prototype.m=h("vc");mf.prototype.c=w({Nf:0},"java.util.regex.Pattern",{Nf:1,d:1,j:1,g:1});
function nf(){this.$i=this.ii=this.Zi=this.mi=this.pi=this.Ki=this.li=this.ji=this.aj=0;this.fd=this.gd=null}nf.prototype=new x;nf.prototype.constructor=nf;nf.prototype.b=function(){of=this;this.gd=new p.RegExp("^\\\\Q(.|\\n|\\r)\\\\E$");this.fd=new p.RegExp("^\\(\\?([idmsuxU]*)(?:-([idmsuxU]*))?\\)");return this};
function pf(a){for(var b="",c=0;c<(a.length|0);){var d=65535&(a.charCodeAt(c)|0);switch(d){case 92:case 46:case 40:case 41:case 91:case 93:case 123:case 125:case 124:case 63:case 42:case 43:case 94:case 36:d="\\"+we(d);break;default:d=we(d)}b=""+b+d;c=1+c|0}return b}
function qf(a){switch(a){case 105:return 2;case 100:return 1;case 109:return 8;case 115:return 32;case 117:return 64;case 120:return 4;case 85:return 256;default:throw hd||(hd=(new gd).b()),kd(ld(),(new Q).f("bad in-pattern flag"));}}nf.prototype.c=w({Of:0},"java.util.regex.Pattern$",{Of:1,d:1,j:1,g:1});var of=void 0;function Sd(){this.ef=this.$e=this.xd=null}Sd.prototype=new Bb;Sd.prototype.constructor=Sd;
Sd.prototype.b=function(){Rd=this;this.xd=(new id).w(xb().vd);this.$e=(new id).w(xb().Wc);this.ef=(new id).w(null);return this};Sd.prototype.c=w({Rf:0},"scala.Console$",{Rf:1,qj:1,d:1,xj:1});var Rd=void 0;function rf(){}rf.prototype=new x;rf.prototype.constructor=rf;function $a(){sf||(sf=(new rf).b());var a=p.java;return null===a?y():(new Za).w(a)}rf.prototype.c=w({Xf:0},"scala.Option$",{Xf:1,d:1,j:1,g:1});var sf=void 0;
function tf(){this.bh=this.Nh=this.Oe=this.ze=this.ue=this.$d=this.Ke=this.ve=null}tf.prototype=new Db;tf.prototype.constructor=tf;tf.prototype.b=function(){uf=this;Hb||(Hb=(new Gb).b());Rb();vf||(vf=(new wf).b());this.ve=vf;xf||(xf=(new yf).b());this.Ke=xf;this.$d=fd().wc;this.ue=fd().zc;zf||(zf=(new Af).b());this.ze=zf;this.Oe=(new He).b();this.Nh=(new Bf).b();this.bh=(new Cf).b();return this};tf.prototype.c=w({Yf:0},"scala.Predef$",{Yf:1,sj:1,d:1,rj:1});var uf=void 0;function Df(){}
Df.prototype=new x;Df.prototype.constructor=Df;Df.prototype.c=w({dg:0},"scala.StringContext$",{dg:1,d:1,j:1,g:1});var Ef=void 0;function lc(){}lc.prototype=new x;lc.prototype.constructor=lc;lc.prototype.c=w({hg:0},"scala.math.Fractional$",{hg:1,d:1,j:1,g:1});var kc=void 0;function nc(){}nc.prototype=new x;nc.prototype.constructor=nc;nc.prototype.c=w({ig:0},"scala.math.Integral$",{ig:1,d:1,j:1,g:1});var mc=void 0;function pc(){}pc.prototype=new x;pc.prototype.constructor=pc;
pc.prototype.c=w({jg:0},"scala.math.Numeric$",{jg:1,d:1,j:1,g:1});var oc=void 0;function jd(){yb.call(this);this.tc=null}jd.prototype=new xe;jd.prototype.constructor=jd;jd.prototype.c=w({Jg:0},"scala.util.DynamicVariable$$anon$1",{Jg:1,kj:1,lj:1,d:1});function vc(){}vc.prototype=new x;vc.prototype.constructor=vc;vc.prototype.m=k("Left");vc.prototype.c=w({Lg:0},"scala.util.Left$",{Lg:1,d:1,j:1,g:1});var uc=void 0;function xc(){}xc.prototype=new x;xc.prototype.constructor=xc;xc.prototype.m=k("Right");
xc.prototype.c=w({Mg:0},"scala.util.Right$",{Mg:1,d:1,j:1,g:1});var wc=void 0;function Ff(){this.uc=!1}Ff.prototype=new x;Ff.prototype.constructor=Ff;Ff.prototype.b=function(){Gf=this;this.uc=!1;return this};Ff.prototype.c=w({Pg:0},"scala.util.control.NoStackTrace$",{Pg:1,d:1,j:1,g:1});var Gf=void 0;function Hf(){this.Ha=null}Hf.prototype=new Se;Hf.prototype.constructor=Hf;Hf.prototype.b=function(){Re.prototype.ob.call(this,Pb());return this};
Hf.prototype.c=w({Ug:0},"scala.collection.IndexedSeq$$anon$1",{Ug:1,fh:1,d:1,Hd:1});function If(){this.ca=null}If.prototype=new Pe;If.prototype.constructor=If;function Jf(){}Jf.prototype=If.prototype;function Qe(){this.Rd=this.Ha=null}Qe.prototype=new Se;Qe.prototype.constructor=Qe;Qe.prototype.ob=function(a){if(null===a)throw kd(ld(),null);this.Rd=a;Re.prototype.ob.call(this,a);return this};Qe.prototype.c=w({eh:0},"scala.collection.generic.GenTraversableFactory$$anon$1",{eh:1,fh:1,d:1,Hd:1});
function Kf(){}Kf.prototype=new Ue;Kf.prototype.constructor=Kf;function Lf(){}Lf.prototype=Kf.prototype;function Ub(){}Ub.prototype=new x;Ub.prototype.constructor=Ub;Ub.prototype.m=k("::");Ub.prototype.c=w({ih:0},"scala.collection.immutable.$colon$colon$",{ih:1,d:1,j:1,g:1});var Tb=void 0;function hc(){this.te=0}hc.prototype=new x;hc.prototype.constructor=hc;hc.prototype.b=function(){gc=this;this.te=512;return this};hc.prototype.c=w({ph:0},"scala.collection.immutable.Range$",{ph:1,d:1,j:1,g:1});
var gc=void 0;function fc(){}fc.prototype=new x;fc.prototype.constructor=fc;fc.prototype.c=w({Kh:0},"scala.collection.mutable.StringBuilder$",{Kh:1,d:1,j:1,g:1});var ec=void 0;function Mf(){this.Xc=null}Mf.prototype=new Xe;Mf.prototype.constructor=Mf;Mf.prototype.ea=function(a){return(0,this.Xc)(a)};function zd(a){var b=new Mf;b.Xc=a;return b}Mf.prototype.c=w({Ph:0},"scala.scalajs.runtime.AnonFunction1",{Ph:1,$j:1,d:1,ta:1});function G(){this.e=this.h=this.i=0}G.prototype=new tb;m=G.prototype;
m.constructor=G;function Xd(a,b){return(new G).k(a.i|b.i,a.h|b.h,a.e|b.e)}function Nf(a){return Of(v().x,a)}m.k=function(a,b,c){this.i=a;this.h=b;this.e=c;return this};
m.m=function(){if(0===this.i&&0===this.h&&0===this.e)return"0";if(qe(this,v().ua))return"-9223372036854775808";if(0!==(524288&this.e))return"-"+R(this).m();var a=v().Cc,b=this,c="";for(;;){var d=b;if(0===d.i&&0===d.h&&0===d.e)return c;d=Pf(b,a);b=d[0];d=""+$d(d[1]);c=(0===b.i&&0===b.h&&0===b.e?"":"000000000".substring(d.length|0))+d+c}};
function Pf(a,b){if(0===b.i&&0===b.h&&0===b.e)throw(new Qf).f("/ by zero");if(0===a.i&&0===a.h&&0===a.e)return[v().x,v().x];if(qe(b,v().ua))return qe(a,v().ua)?[v().Lb,v().x]:[v().x,a];var c=0!==(524288&a.e),d=0!==(524288&b.e),e=qe(a,v().ua),g=0===b.e&&0===b.h&&0!==b.i&&0===(b.i&(-1+b.i|0))?qb(B(),b.i):0===b.e&&0!==b.h&&0===b.i&&0===(b.h&(-1+b.h|0))?22+qb(B(),b.h)|0:0!==b.e&&0===b.h&&0===b.i&&0===(b.e&(-1+b.e|0))?44+qb(B(),b.e)|0:-1;if(0<=g){if(e)return c=Rf(a,g),[d?R(c):c,v().x];var e=0!==(524288&
a.e)?R(a):a,r=Rf(e,g),d=c!==d?R(r):r,e=22>=g?(new G).k(e.i&(-1+(1<<g)|0),0,0):44>=g?(new G).k(e.i,e.h&(-1+(1<<(-22+g|0))|0),0):(new G).k(e.i,e.h,e.e&(-1+(1<<(-44+g|0))|0)),c=c?R(e):e;return[d,c]}g=0!==(524288&b.e)?R(b):b;if(e)var l=v().Kb;else if(l=0!==(524288&a.e)?R(a):a,Of(g,l))return[v().x,a];var D=Sf(g)-Sf(l)|0,n=Yd(g,D),g=D,D=n,n=l,l=v().x;a:{var oa;for(;;){if(0>g)var V=!0;else V=n,V=0===V.i&&0===V.h&&0===V.e;if(V){oa=n;r=l;break a}else V=Tf(n,R(D)),0===(524288&V.e)?(n=-1+g|0,D=Rf(D,1),l=22>
g?(new G).k(l.i|1<<g,l.h,l.e):44>g?(new G).k(l.i,l.h|1<<(-22+g|0),l.e):(new G).k(l.i,l.h,l.e|1<<(-44+g|0)),g=n,n=V):(g=-1+g|0,D=Rf(D,1))}}d=c!==d?R(r):r;c&&e?(c=R(oa),e=v().Lb,c=Tf(c,R(e))):c=c?R(oa):oa;return[d,c]}function Zd(a,b){return(new G).k(a.i&b.i,a.h&b.h,a.e&b.e)}
function be(a,b){var c=63&b;if(22>c){var d=22-c|0;return(new G).k(4194303&(a.i>>c|a.h<<d),4194303&(a.h>>c|a.e<<d),1048575&(a.e>>>c|0))}return 44>c?(d=-22+c|0,(new G).k(4194303&(a.h>>d|a.e<<(44-c|0)),4194303&(a.e>>>d|0),0)):(new G).k(4194303&(a.e>>>(-44+c|0)|0),0,0)}function Of(a,b){return 0===(524288&a.e)?0!==(524288&b.e)||a.e>b.e||a.e===b.e&&a.h>b.h||a.e===b.e&&a.h===b.h&&a.i>b.i:!(0===(524288&b.e)||a.e<b.e||a.e===b.e&&a.h<b.h||a.e===b.e&&a.h===b.h&&a.i<=b.i)}
function Yd(a,b){var c=63&b;if(22>c){var d=22-c|0;return(new G).k(4194303&a.i<<c,4194303&(a.h<<c|a.i>>d),1048575&(a.e<<c|a.h>>d))}return 44>c?(d=-22+c|0,(new G).k(0,4194303&a.i<<d,1048575&(a.h<<d|a.i>>(44-c|0)))):(new G).k(0,0,1048575&a.i<<(-44+c|0))}function $d(a){return a.i|a.h<<22}m.r=function(a){G.prototype.k.call(this,4194303&a,4194303&a>>22,0>a?1048575:0);return this};
function R(a){var b=4194303&(1+~a.i|0),c=4194303&(~a.h+(0===b?1:0)|0);return(new G).k(b,c,1048575&(~a.e+(0===b&&0===c?1:0)|0))}function Tf(a,b){var c=a.i+b.i|0,d=(a.h+b.h|0)+(c>>22)|0;return(new G).k(4194303&c,4194303&d,1048575&((a.e+b.e|0)+(d>>22)|0))}
function Rf(a,b){var c=63&b,d=0!==(524288&a.e),e=d?-1048576|a.e:a.e;if(22>c)return d=22-c|0,(new G).k(4194303&(a.i>>c|a.h<<d),4194303&(a.h>>c|e<<d),1048575&e>>c);if(44>c){var g=-22+c|0;return(new G).k(4194303&(a.h>>g|e<<(44-c|0)),4194303&e>>g,1048575&(d?1048575:0))}return(new G).k(4194303&e>>(-44+c|0),4194303&(d?4194303:0),1048575&(d?1048575:0))}function se(a){return qe(a,v().ua)?-9223372036854775E3:0!==(524288&a.e)?-se(R(a)):a.i+4194304*a.h+17592186044416*a.e}
function Sf(a){return 0!==a.e?-12+pb(B(),a.e)|0:0!==a.h?10+pb(B(),a.h)|0:32+pb(B(),a.i)|0}m.z=function(){return $d(ae(this,be(this,32)))};function ae(a,b){return(new G).k(a.i^b.i,a.h^b.h,a.e^b.e)}function qe(a,b){return a.i===b.i&&a.h===b.h&&a.e===b.e}function ua(a){return!!(a&&a.c&&a.c.da.Jd)}m.c=w({Jd:0},"scala.scalajs.runtime.RuntimeLong",{Jd:1,Aa:1,d:1,ha:1});
function Uf(){this.Xi=this.Wi=this.Vi=this.Ui=this.Ti=this.Si=this.Ri=this.Pi=this.Oi=this.wi=this.vi=this.ei=this.di=this.ci=0;this.Cc=this.Kb=this.ua=this.we=this.Lb=this.x=null}Uf.prototype=new x;Uf.prototype.constructor=Uf;Uf.prototype.b=function(){Vf=this;this.x=(new G).k(0,0,0);this.Lb=(new G).k(1,0,0);this.we=(new G).k(4194303,4194303,1048575);this.ua=(new G).k(0,0,524288);this.Kb=(new G).k(4194303,4194303,524287);this.Cc=(new G).k(1755648,238,0);return this};
function re(a,b){if(b!==b)return a.x;if(-9223372036854775E3>b)return a.ua;if(9223372036854775E3<=b)return a.Kb;if(0>b)return R(re(a,-b));var c=b,d=17592186044416<=c?Ca(c/17592186044416):0,c=c-17592186044416*d,e=4194304<=c?Ca(c/4194304):0;return(new G).k(Ca(c-4194304*e),e,d)}Uf.prototype.c=w({Rh:0},"scala.scalajs.runtime.RuntimeLong$",{Rh:1,d:1,j:1,g:1});var Vf=void 0;function v(){Vf||(Vf=(new Uf).b());return Vf}var Wf=w({Zh:0},"scala.runtime.Nothing$",{Zh:1,E:1,d:1,g:1});
function Xf(){this.wd=null}Xf.prototype=new $e;Xf.prototype.constructor=Xf;function Yf(){}Yf.prototype=Xf.prototype;Xf.prototype.Zb=function(a){this.wd=a;return this};var la=w({Pe:0},"java.lang.String",{Pe:1,d:1,g:1,hd:1,ha:1},void 0,void 0,function(a){return"string"===typeof a});function Zf(){H.call(this)}Zf.prototype=new ff;Zf.prototype.constructor=Zf;Zf.prototype.w=function(a){Zf.prototype.f.call(this,ja(a));return this};Zf.prototype.c=w({of:0},"java.lang.AssertionError",{of:1,jj:1,E:1,d:1,g:1});
function $f(){}$f.prototype=new $e;$f.prototype.constructor=$f;$f.prototype.c=w({Cf:0},"java.lang.JSConsoleBasedPrintStream$DummyOutputStream",{Cf:1,oe:1,d:1,me:1,ne:1});function Q(){H.call(this)}Q.prototype=new hf;Q.prototype.constructor=Q;function S(){}S.prototype=Q.prototype;Q.prototype.b=function(){Q.prototype.ja.call(this,null,null);return this};Q.prototype.f=function(a){Q.prototype.ja.call(this,a,null);return this};Q.prototype.c=w({R:0},"java.lang.RuntimeException",{R:1,aa:1,E:1,d:1,g:1});
function ag(){this.G=null}ag.prototype=new x;m=ag.prototype;m.constructor=ag;m.b=function(){ag.prototype.f.call(this,"");return this};function C(a,b){a.G=""+a.G+(null===b?"null":b);return a}m.Kd=function(a,b){return this.G.substring(a,b)};m.m=h("G");function bg(a,b){null===b?C(a,null):C(a,ja(b))}m.r=function(){ag.prototype.f.call(this,"");return this};function cg(a,b,c,d){return null===b?cg(a,"null",c,d):C(a,ja(Ba(b,c,d)))}m.f=function(a){this.G=a;return this};
m.c=w({Hf:0},"java.lang.StringBuilder",{Hf:1,d:1,hd:1,mf:1,g:1});function dg(){}dg.prototype=new x;dg.prototype.constructor=dg;function eg(){}eg.prototype=dg.prototype;dg.prototype.b=function(){return this};dg.prototype.m=k("\x3cfunction1\x3e");function fg(){}fg.prototype=new x;fg.prototype.constructor=fg;function gg(){}gg.prototype=fg.prototype;fg.prototype.b=function(){return this};fg.prototype.m=k("\x3cfunction1\x3e");function jc(){}jc.prototype=new x;jc.prototype.constructor=jc;
jc.prototype.b=function(){ic=this;return this};jc.prototype.c=w({gg:0},"scala.math.Equiv$",{gg:1,d:1,yj:1,j:1,g:1});var ic=void 0;function rc(){}rc.prototype=new x;rc.prototype.constructor=rc;rc.prototype.b=function(){qc=this;return this};rc.prototype.c=w({mg:0},"scala.math.Ordering$",{mg:1,d:1,zj:1,j:1,g:1});var qc=void 0;function Af(){}Af.prototype=new x;Af.prototype.constructor=Af;Af.prototype.m=k("\x3c?\x3e");Af.prototype.c=w({Fg:0},"scala.reflect.NoManifest$",{Fg:1,d:1,M:1,j:1,g:1});var zf=void 0;
function hg(){}hg.prototype=new x;hg.prototype.constructor=hg;function ig(){}ig.prototype=hg.prototype;hg.prototype.b=function(){return this};hg.prototype.m=function(){return(this.ia()?"non-empty":"empty")+" iterator"};hg.prototype.ya=function(a){for(;this.ia();)a.ea(this.ba())};function jg(){}jg.prototype=new Ne;jg.prototype.constructor=jg;function kg(){}kg.prototype=jg.prototype;function wf(){}wf.prototype=new Lf;wf.prototype.constructor=wf;
wf.prototype.c=w({nh:0},"scala.collection.immutable.Map$",{nh:1,Lj:1,Nj:1,Jj:1,d:1});var vf=void 0;function T(){ze.call(this);this.Id=v().x;this.cb=null;this.ac=0;this.bb=null;this.Jb=0;this.Ib=!1;this.n=0}T.prototype=new Ae;T.prototype.constructor=T;T.prototype.nb=function(a){this.Id=a;ze.prototype.b.call(this);this.cb=null;this.n|=1;this.ac=0;this.n|=2;this.bb=null;this.n|=4;this.Jb=0;this.n|=8;this.Ib=!1;this.n|=16;Ce(this,a);return this};
function U(a){if(0===(2&a.n))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 160");return a.ac}function W(a){if(0===(1&a.n))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 159");return a.cb}function lg(a){if(0===(8&a.n))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 162");return a.Jb}function mg(a){if(0===(16&a.n))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 163");return a.Ib}
function X(a){if(0===(4&a.n))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 161");return a.bb}function ng(a,b){a.Ib=b;a.n|=16}function og(a,b){a.Jb=b;a.n|=8}function Y(a,b){a.ac=b;a.n|=2}
function Ce(a,b){ng(a,!1);og(a,0);var c=ha(Ma(Ra),[J()]);a.cb=c;a.n|=1;c=ha(Ma(Ra),[2]);a.bb=c;a.n|=4;X(a).a[0]=0;var c=X(a).a,d=cf();if(0===(4&d.p))throw(new K).f("Uninitialized field: MersenneTwisterFast.scala: 143");c[1]=d.qd;W(a).a[0]=$d(b);for(Y(a,1);U(a)<J();)W(a).a[U(a)]=q(1812433253,W(a).a[-1+U(a)|0]^(W(a).a[-1+U(a)|0]>>>30|0))+U(a)|0,c=W(a),d=U(a),c.a[d]=c.a[d],Y(a,1+U(a)|0)}
T.prototype.clone=function(){var a=(new T).nb(this.Id),b=W(this).Dc();a.cb=b;a.n|=1;Y(a,U(this));b=X(this).Dc();a.bb=b;a.n|=4;og(a,lg(this));ng(a,mg(this));return a};T.prototype.save=function(){for(var a=(new Ld).f(df()+" "+X(this).a[0]+" "+X(this).a[1]+" "+U(this)+" "+lg(this)+" "+mg(this)),b=0;b<J();){C(a.L," ");var c=W(this).a[b];C(a.L,""+c);b=1+b|0}return a.L.G};
T.prototype.load=function(a){u();if(null===a)throw(new t).b();var b;of||(of=(new nf).b());b=of;var c=b.gd.exec("\\s");if(null!==c){c=c[1];if(void 0===c)throw(new I).f("undefined.get");c=(new Za).w(pg(new qg,pf(c),0))}else c=y();if(c.s())if(c=b.fd.exec("\\s"),null!==c){b=c[0];if(void 0===b)throw(new I).f("undefined.get");b="\\s".substring(b.length|0);var d=c[1];if(void 0===d)var e=0;else{var d=(new A).f(d),g=0,e=d.A.length|0,r=0;a:{var l;for(;;)if(g===e){l=r;break a}else var D=1+g|0,g=d.ma(g),r=r|
0|qf(null===g?0:g.ab),g=D}e=l|0}l=c[2];if(void 0===l)var n=e;else{l=(new A).f(l);d=0;c=l.A.length|0;D=e;a:for(;;)if(d===c){n=D;break a}else e=1+d|0,d=l.ma(d),D=(D|0)&~qf(null===d?0:d.ab),d=e;n|=0}n=(new Za).w(pg(new qg,b,n))}else n=y();else n=c;b=n.s()?pg(new qg,"\\s",0):n.ga();if(null!==b)n=b.db,b=b.eb|0;else throw(new rg).w(b);b|=0;n=new p.RegExp(n,"g"+(0!==(2&b)?"i":"")+(0!==(8&b)?"m":""));l=new mf;l.Ba=n;l.vc="\\s";l.Td=b;n=[];a=ja(a);c=a.length|0;b=new De;b.yd=l;b.cd=a;b.Ad=0;b.zd=c;l=b.yd;c=
new p.RegExp(l.Ba);l=c!==l.Ba?c:new p.RegExp(l.Ba.source,(l.Ba.global?"g":"")+(l.Ba.ignoreCase?"i":"")+(l.Ba.multiline?"m":""));b.bc=l;b.dd=ja(Ba(b.cd,b.Ad,b.zd));b.Ca=null;b.jd=!1;b.Ob=!0;for(l=b.Ue=0;2147483646>(n.length|0)&&Ee(b);){c=Fe(b).index|0;n.push(a.substring(l,c));c=b;l=Fe(c).index|0;c=Fe(c)[0];if(void 0===c)throw(new I).f("undefined.get");l=l+(c.length|0)|0}n.push(a.substring(l));if(0===l&&2===(n.length|0))for(b=mb(new z,[a]),a=b.va.length|0,a=ha(Ma(la),[a]),n=n=0,b=sg(b,b.va.length|0);b.ia();)l=
b.ba(),a.a[n]=l,n=1+n|0;else{for(a=n.length|0;;){if(1<a){b=n[-1+a|0];if(null===b)throw(new t).b();b=""===b}else b=!1;if(b)a=-1+a|0;else break}a=ha(Ma(la),[a]);c=a.a.length;l=b=0;d=n.length|0;c=d<c?d:c;d=a.a.length;for(c=c<d?c:d;b<c;)a.a[l]=n[b],b=1+b|0,l=1+l|0}n=a.a[0];if(n!==df())throw kd(ld(),(new Q).f('identifier mismatch: expected "'+df()+'", got "'+n+'"'));n=X(this);b=(new A).f(a.a[1]);B();n.a[0]=nb(b.A);n=X(this);b=(new A).f(a.a[2]);B();n.a[1]=nb(b.A);n=(new A).f(a.a[3]);B();Y(this,nb(n.A));
n=(new A).f(a.a[4]);fb||(fb=(new eb).b());n=n.A;b=fb;b.Y||b.Y||(b.Vc=new p.RegExp("^[\\x00-\\x20]*[+-]?(NaN|Infinity|(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?)[fFdD]?[\\x00-\\x20]*$"),b.Y=!0);if(b.Vc.test(n))n=+p.parseFloat(n);else throw(new ib).f(jb(kb(new lb,mb(new z,['For input string: "','"'])),mb(new z,[n])));og(this,n);n=a.a[5];if("true"===n)ng(this,!0);else if("false"===n)ng(this,!1);else throw kd(ld(),(new Q).f('expected true or false, got "'+n+'"'));for(n=0;n<J();)b=W(this),l=n,c=(new A).f(a.a[6+
n|0]),B(),b.a[l]=nb(c.A),n=1+n|0;uf||(uf=(new tf).b());if(!(a.a.length<=(6+n|0)))throw(new Zf).w("assertion failed");};T.prototype.setSeed=function(a){Ce(this,(new G).r(a|0))};
T.prototype.nextInt=function(){for(var a=arguments.length|0,b=0,c=[];b<a;)c.push(arguments[b]),b=b+1|0;switch(c.length|0){case 1:a=c[0]|0;if(0>=a)throw(new E).f("n must be positive");if((a&(-a|0))===a){b=0;if(U(this)>=J()){for(var c=0,d=W(this),e=X(this);c<(J()-N()|0);)b=d.a[c]&P()|d.a[1+c|0]&M(),d.a[c]=d.a[c+N()|0]^(b>>>1|0)^e.a[1&b],c=1+c|0;for(;c<(-1+J()|0);)b=d.a[c]&P()|d.a[1+c|0]&M(),d.a[c]=d.a[c+(N()-J()|0)|0]^(b>>>1|0)^e.a[1&b],c=1+c|0;b=d.a[-1+J()|0]&P()|d.a[0]&M();d.a[-1+J()|0]=d.a[-1+N()|
0]^(b>>>1|0)^e.a[1&b];Y(this,0)}var b=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0],b=b^(b>>>11|0),b=b^b<<7&L(),b=b^b<<15&O(),b=b^(b>>>18|0),g=(new G).r(a),e=(new G).r(b>>>1|0),a=8191&g.i,b=g.i>>13|(15&g.h)<<9,c=8191&g.h>>4,d=g.h>>17|(255&g.e)<<5,r=(1048320&g.e)>>8,l=8191&e.i,D=e.i>>13|(15&e.h)<<9,n=8191&e.h>>4,oa=e.h>>17|(255&e.e)<<5,V=(1048320&e.e)>>8,Qg=q(a,l),ke=q(b,l),e=q(c,l),g=q(d,l),r=q(r,l);0!==D&&(ke=ke+q(a,D)|0,e=e+q(b,D)|0,g=g+q(c,D)|0,r=r+q(d,D)|0);0!==n&&(e=e+q(a,n)|0,g=g+q(b,n)|0,r=r+
q(c,n)|0);0!==oa&&(g=g+q(a,oa)|0,r=r+q(b,oa)|0);0!==V&&(r=r+q(a,V)|0);a=(4194303&Qg)+((511&ke)<<13)|0;b=((((Qg>>22)+(ke>>9)|0)+((262143&e)<<4)|0)+((31&g)<<17)|0)+(a>>22)|0;a=$d(Rf((new G).k(4194303&a,4194303&b,1048575&((((e>>18)+(g>>5)|0)+((4095&r)<<8)|0)+(b>>22)|0)),31))}else{c=b=0;do{b=0;if(U(this)>=J()){c=0;d=W(this);for(e=X(this);c<(J()-N()|0);)b=d.a[c]&P()|d.a[1+c|0]&M(),d.a[c]=d.a[c+N()|0]^(b>>>1|0)^e.a[1&b],c=1+c|0;for(;c<(-1+J()|0);)b=d.a[c]&P()|d.a[1+c|0]&M(),d.a[c]=d.a[c+(N()-J()|0)|0]^
(b>>>1|0)^e.a[1&b],c=1+c|0;b=d.a[-1+J()|0]&P()|d.a[0]&M();d.a[-1+J()|0]=d.a[-1+N()|0]^(b>>>1|0)^e.a[1&b];Y(this,0)}b=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];b^=b>>>11|0;b^=b<<7&L();b^=b<<15&O();b^=b>>>18|0;b=b>>>1|0;c=b%a}while(0>((b-c|0)+(-1+a|0)|0));a=c}return a;case 0:a=0;if(U(this)>=J()){b=0;c=W(this);for(d=X(this);b<(J()-N()|0);)a=c.a[b]&P()|c.a[1+b|0]&M(),c.a[b]=c.a[b+N()|0]^(a>>>1|0)^d.a[1&a],b=1+b|0;for(;b<(-1+J()|0);)a=c.a[b]&P()|c.a[1+b|0]&M(),c.a[b]=c.a[b+(N()-J()|0)|0]^(a>>>1|0)^d.a[1&
a],b=1+b|0;a=c.a[-1+J()|0]&P()|c.a[0]&M();c.a[-1+J()|0]=c.a[-1+N()|0]^(a>>>1|0)^d.a[1&a];Y(this,0)}a=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];a^=a>>>11|0;a^=a<<7&L();a^=a<<15&O();return a^(a>>>18|0);default:throw"No matching overload";}};
T.prototype.nextLong=function(a){var b=se;a=re(v(),+a);var c=v().x;if(0===(524288&c.e)?0!==(524288&a.e)||c.e>a.e||c.e===a.e&&c.h>a.h||c.e===a.e&&c.h===a.h&&c.i>=a.i:!(0===(524288&a.e)||c.e<a.e||c.e===a.e&&c.h<a.h||c.e===a.e&&c.h===a.h&&c.i<a.i))throw(new E).f("n must be positive");var c=v().x,d=v().x;do{d=c=0;if(U(this)>=J()){for(var d=0,e=W(this),g=X(this);d<(J()-N()|0);)c=e.a[d]&P()|e.a[1+d|0]&M(),e.a[d]=e.a[d+N()|0]^(c>>>1|0)^g.a[1&c],d=1+d|0;for(;d<(-1+J()|0);)c=e.a[d]&P()|e.a[1+d|0]&M(),e.a[d]=
e.a[d+(N()-J()|0)|0]^(c>>>1|0)^g.a[1&c],d=1+d|0;c=e.a[-1+J()|0]&P()|e.a[0]&M();e.a[-1+J()|0]=e.a[-1+N()|0]^(c>>>1|0)^g.a[1&c];Y(this,0)}c=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];c^=c>>>11|0;c^=c<<7&L();c^=c<<15&O();c^=c>>>18|0;if(U(this)>=J()){for(var e=0,g=W(this),r=X(this);e<(J()-N()|0);)d=g.a[e]&P()|g.a[1+e|0]&M(),g.a[e]=g.a[e+N()|0]^(d>>>1|0)^r.a[1&d],e=1+e|0;for(;e<(-1+J()|0);)d=g.a[e]&P()|g.a[1+e|0]&M(),g.a[e]=g.a[e+(N()-J()|0)|0]^(d>>>1|0)^r.a[1&d],e=1+e|0;d=g.a[-1+J()|0]&P()|g.a[0]&M();
g.a[-1+J()|0]=g.a[-1+N()|0]^(d>>>1|0)^r.a[1&d];Y(this,0)}d=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];d^=d>>>11|0;d^=d<<7&L();d^=d<<15&O();d^=d>>>18|0;c=be(Tf(Yd((new G).r(c),32),(new G).r(d)),1);d=Pf(c,a)[1]}while(Nf(Tf(Tf(c,R(d)),Tf((new G).k(4194303,4194303,1048575),a))));return b(d)};
T.prototype.nextDouble=function(){var a=0,b=0;if(U(this)>=J()){for(var b=0,c=W(this),d=X(this);b<(J()-N()|0);)a=c.a[b]&P()|c.a[1+b|0]&M(),c.a[b]=c.a[b+N()|0]^(a>>>1|0)^d.a[1&a],b=1+b|0;for(;b<(-1+J()|0);)a=c.a[b]&P()|c.a[1+b|0]&M(),c.a[b]=c.a[b+(N()-J()|0)|0]^(a>>>1|0)^d.a[1&a],b=1+b|0;a=c.a[-1+J()|0]&P()|c.a[0]&M();c.a[-1+J()|0]=c.a[-1+N()|0]^(a>>>1|0)^d.a[1&a];Y(this,0)}a=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];a^=a>>>11|0;a^=a<<7&L();a^=a<<15&O();a^=a>>>18|0;if(U(this)>=J()){for(var c=0,d=
W(this),e=X(this);c<(J()-N()|0);)b=d.a[c]&P()|d.a[1+c|0]&M(),d.a[c]=d.a[c+N()|0]^(b>>>1|0)^e.a[1&b],c=1+c|0;for(;c<(-1+J()|0);)b=d.a[c]&P()|d.a[1+c|0]&M(),d.a[c]=d.a[c+(N()-J()|0)|0]^(b>>>1|0)^e.a[1&b],c=1+c|0;b=d.a[-1+J()|0]&P()|d.a[0]&M();d.a[-1+J()|0]=d.a[-1+N()|0]^(b>>>1|0)^e.a[1&b];Y(this,0)}b=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];b^=b>>>11|0;b^=b<<7&L();b^=b<<15&O();b^=b>>>18|0;return se(Tf(Yd((new G).r(a>>>6|0),27),(new G).r(b>>>5|0)))/9007199254740992};
T.prototype.nextGaussian=function(){var a;if(mg(this))ng(this,!1),a=lg(this);else{var b=a=0,c=0;do{var d=b=a=0,c=0;if(U(this)>=J()){b=0;d=W(this);for(c=X(this);b<(J()-N()|0);)a=d.a[b]&P()|d.a[1+b|0]&M(),d.a[b]=d.a[b+N()|0]^(a>>>1|0)^c.a[1&a],b=1+b|0;for(;b<(-1+J()|0);)a=d.a[b]&P()|d.a[1+b|0]&M(),d.a[b]=d.a[b+(N()-J()|0)|0]^(a>>>1|0)^c.a[1&a],b=1+b|0;a=d.a[-1+J()|0]&P()|d.a[0]&M();d.a[-1+J()|0]=d.a[-1+N()|0]^(a>>>1|0)^c.a[1&a];Y(this,0)}a=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];a^=a>>>11|0;a^=
a<<7&L();a^=a<<15&O();a^=a>>>18|0;if(U(this)>=J()){for(var d=0,c=W(this),e=X(this);d<(J()-N()|0);)b=c.a[d]&P()|c.a[1+d|0]&M(),c.a[d]=c.a[d+N()|0]^(b>>>1|0)^e.a[1&b],d=1+d|0;for(;d<(-1+J()|0);)b=c.a[d]&P()|c.a[1+d|0]&M(),c.a[d]=c.a[d+(N()-J()|0)|0]^(b>>>1|0)^e.a[1&b],d=1+d|0;b=c.a[-1+J()|0]&P()|c.a[0]&M();c.a[-1+J()|0]=c.a[-1+N()|0]^(b>>>1|0)^e.a[1&b];Y(this,0)}b=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];b^=b>>>11|0;b^=b<<7&L();b^=b<<15&O();b^=b>>>18|0;if(U(this)>=J()){for(var c=0,e=W(this),g=X(this);c<
(J()-N()|0);)d=e.a[c]&P()|e.a[1+c|0]&M(),e.a[c]=e.a[c+N()|0]^(d>>>1|0)^g.a[1&d],c=1+c|0;for(;c<(-1+J()|0);)d=e.a[c]&P()|e.a[1+c|0]&M(),e.a[c]=e.a[c+(N()-J()|0)|0]^(d>>>1|0)^g.a[1&d],c=1+c|0;d=e.a[-1+J()|0]&P()|e.a[0]&M();e.a[-1+J()|0]=e.a[-1+N()|0]^(d>>>1|0)^g.a[1&d];Y(this,0)}d=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];d^=d>>>11|0;d^=d<<7&L();d^=d<<15&O();d^=d>>>18|0;if(U(this)>=J()){for(var e=0,g=W(this),r=X(this),e=0;e<(J()-N()|0);)c=g.a[e]&P()|g.a[1+e|0]&M(),g.a[e]=g.a[e+N()|0]^(c>>>1|0)^r.a[1&
c],e=1+e|0;for(;e<(-1+J()|0);)c=g.a[e]&P()|g.a[1+e|0]&M(),g.a[e]=g.a[e+(N()-J()|0)|0]^(c>>>1|0)^r.a[1&c],e=1+e|0;c=g.a[-1+J()|0]&P()|g.a[0]&M();g.a[-1+J()|0]=g.a[-1+N()|0]^(c>>>1|0)^r.a[1&c];Y(this,0)}c=W(this).a[Y(this,1+U(this)|0),-1+U(this)|0];c^=c>>>11|0;c^=c<<7&L();c^=c<<15&O();c^=c>>>18|0;a=-1+2*(se(Tf(Yd((new G).r(a>>>6|0),27),(new G).r(b>>>5|0)))/9007199254740992);b=-1+2*(se(Tf(Yd((new G).r(d>>>6|0),27),(new G).r(c>>>5|0)))/9007199254740992);c=a*a+b*b}while(1<=c||0===c);d=bb();e=bb();g=c;
c=-2*+(e.Y?e.Hb:Ya(e)).log(g)/c;d=+(d.Y?d.Hb:Ya(d)).sqrt(c);og(this,b*d);ng(this,!0);a*=d}return a};T.prototype.c=w({qe:0},"org.nlogo.web.MersenneTwisterFast",{qe:1,mj:1,d:1,g:1,Dd:1,id:1});ba.MersenneTwisterFast=function(){for(var a=new T,b=arguments.length|0,c=0,d=[];c<b;)d.push(arguments[c]),c=c+1|0;void 0===d[0]?(cf(),b=xb(),b=re(v(),1E6*+(0,b.Zc)())):b=Ga(d[0]);T.prototype.nb.call(a,b);return a};ba.MersenneTwisterFast.prototype=T.prototype;function Qf(){H.call(this)}Qf.prototype=new S;
Qf.prototype.constructor=Qf;Qf.prototype.c=w({nf:0},"java.lang.ArithmeticException",{nf:1,R:1,aa:1,E:1,d:1,g:1});function E(){H.call(this)}E.prototype=new S;E.prototype.constructor=E;function tg(){}tg.prototype=E.prototype;E.prototype.b=function(){E.prototype.ja.call(this,null,null);return this};E.prototype.f=function(a){E.prototype.ja.call(this,a,null);return this};E.prototype.c=w({$b:0},"java.lang.IllegalArgumentException",{$b:1,R:1,aa:1,E:1,d:1,g:1});function Ge(){H.call(this)}Ge.prototype=new S;
Ge.prototype.constructor=Ge;Ge.prototype.f=function(a){Ge.prototype.ja.call(this,a,null);return this};Ge.prototype.c=w({xf:0},"java.lang.IllegalStateException",{xf:1,R:1,aa:1,E:1,d:1,g:1});function Z(){H.call(this)}Z.prototype=new S;Z.prototype.constructor=Z;Z.prototype.c=w({yf:0},"java.lang.IndexOutOfBoundsException",{yf:1,R:1,aa:1,E:1,d:1,g:1});function t(){H.call(this)}t.prototype=new S;t.prototype.constructor=t;t.prototype.b=function(){t.prototype.f.call(this,null);return this};
t.prototype.c=w({Ef:0},"java.lang.NullPointerException",{Ef:1,R:1,aa:1,E:1,d:1,g:1});function ug(){H.call(this)}ug.prototype=new S;ug.prototype.constructor=ug;ug.prototype.f=function(a){ug.prototype.ja.call(this,a,null);return this};ug.prototype.c=w({Jf:0},"java.lang.UnsupportedOperationException",{Jf:1,R:1,aa:1,E:1,d:1,g:1});function I(){H.call(this)}I.prototype=new S;I.prototype.constructor=I;I.prototype.c=w({Kf:0},"java.util.NoSuchElementException",{Kf:1,R:1,aa:1,E:1,d:1,g:1});
function rg(){H.call(this);this.md=this.Wa=null;this.Nb=!1}rg.prototype=new S;rg.prototype.constructor=rg;rg.prototype.$c=function(){if(!this.Nb&&!this.Nb){var a;if(null===this.Wa)a="null";else try{a=ja(this.Wa)+" ("+("of class "+Wa(ka(this.Wa)))+")"}catch(b){if(null!==ie(ld(),b))a="an instance of class "+Wa(ka(this.Wa));else throw b;}this.md=a;this.Nb=!0}return this.md};rg.prototype.w=function(a){this.Wa=a;Q.prototype.b.call(this);return this};
rg.prototype.c=w({Tf:0},"scala.MatchError",{Tf:1,R:1,aa:1,E:1,d:1,g:1});function vg(){}vg.prototype=new x;vg.prototype.constructor=vg;function wg(){}wg.prototype=vg.prototype;vg.prototype.b=function(){return this};function Bf(){}Bf.prototype=new gg;Bf.prototype.constructor=Bf;Bf.prototype.ea=function(a){return a};Bf.prototype.c=w({Zf:0},"scala.Predef$$anon$1",{Zf:1,uj:1,d:1,ta:1,j:1,g:1});function Cf(){}Cf.prototype=new eg;Cf.prototype.constructor=Cf;Cf.prototype.ea=function(a){return a};
Cf.prototype.c=w({$f:0},"scala.Predef$$anon$2",{$f:1,tj:1,d:1,ta:1,j:1,g:1});function lb(){this.Xa=null}lb.prototype=new x;m=lb.prototype;m.constructor=lb;m.ra=k("StringContext");m.pa=k(1);m.qa=function(a){switch(a){case 0:return this.Xa;default:throw(new Z).f(""+a);}};m.m=function(){return te(this)};function xg(a,b){if(a.Xa.K()!==(1+b.K()|0))throw(new E).f("wrong number of arguments ("+b.K()+") for interpolated string with "+a.Xa.K()+" parts");}
function jb(a,b){var c=function(){return function(a){Ef||(Ef=(new Df).b());a:{var b=a.length|0,c=Gd(u(),a,92);switch(c){case -1:break a;default:var d=(new ag).b();b:{var e=c,c=0;for(;;)if(0<=e){e>c&&cg(d,a,c,e);c=1+e|0;if(c>=b)throw yg(a,e);var g=65535&(a.charCodeAt(c)|0);switch(g){case 98:e=8;break;case 116:e=9;break;case 110:e=10;break;case 102:e=12;break;case 114:e=13;break;case 34:e=34;break;case 39:e=39;break;case 92:e=92;break;default:if(48<=g&&55>=g){g=65535&(a.charCodeAt(c)|0);e=-48+g|0;c=
1+c|0;if(c<b&&48<=(65535&(a.charCodeAt(c)|0))&&55>=(65535&(a.charCodeAt(c)|0))){var r=c,e=-48+(q(8,e)+(65535&(a.charCodeAt(r)|0))|0)|0,c=1+c|0;c<b&&51>=g&&48<=(65535&(a.charCodeAt(c)|0))&&55>=(65535&(a.charCodeAt(c)|0))&&(g=c,e=-48+(q(8,e)+(65535&(a.charCodeAt(g)|0))|0)|0,c=1+c|0)}c=-1+c|0;e&=65535}else throw yg(a,e);}c=1+c|0;C(d,p.String.fromCharCode(e));e=c;u();g=a;r=Fd(92);g=g.indexOf(r,c)|0;c=e;e=g}else{c<b&&cg(d,a,c,b);a=d.G;break b}a=void 0}}}return a}}(a);xg(a,b);for(var d=a.Xa.za(),e=b.za(),
g=d.ba(),g=(new ag).f(c(g));e.ia();){bg(g,e.ba());var r=d.ba();C(g,c(r))}return g.G}function kb(a,b){a.Xa=b;return a}m.z=function(){return td(this)};m.Da=function(){return zg(this)};m.c=w({cg:0},"scala.StringContext",{cg:1,d:1,Ka:1,q:1,j:1,g:1});function od(){H.call(this)}od.prototype=new ye;od.prototype.constructor=od;od.prototype.b=function(){H.prototype.b.call(this);return this};od.prototype.lb=function(){Gf||(Gf=(new Ff).b());return Gf.uc?H.prototype.lb.call(this):this};
od.prototype.c=w({Ng:0},"scala.util.control.BreakControl",{Ng:1,E:1,d:1,g:1,Aj:1,Bj:1});function Mb(){this.ca=null}Mb.prototype=new Pe;Mb.prototype.constructor=Mb;Mb.prototype.c=w({Wg:0},"scala.collection.Iterable$",{Wg:1,La:1,Fa:1,d:1,Ma:1,Ga:1});var Lb=void 0;function Dd(){}Dd.prototype=new ig;Dd.prototype.constructor=Dd;Dd.prototype.ba=function(){throw(new I).f("next on empty iterator");};Dd.prototype.ia=k(!1);
Dd.prototype.c=w({Yg:0},"scala.collection.Iterator$$anon$2",{Yg:1,tb:1,d:1,yb:1,la:1,ka:1});function Ag(){this.Ld=null}Ag.prototype=new ig;Ag.prototype.constructor=Ag;Ag.prototype.ba=function(){if(this.ia())Le();else return Qb().Tb.ba()};Ag.prototype.ia=function(){return!this.Ld.s()};Ag.prototype.c=w({Zg:0},"scala.collection.LinearSeqLike$$anon$1",{Zg:1,tb:1,d:1,yb:1,la:1,ka:1});function Kb(){this.Ve=this.ca=null}Kb.prototype=new Pe;Kb.prototype.constructor=Kb;
Kb.prototype.b=function(){Oe.prototype.b.call(this);Jb=this;this.Ve=(new nd).b();return this};Kb.prototype.c=w({ah:0},"scala.collection.Traversable$",{ah:1,La:1,Fa:1,d:1,Ma:1,Ga:1});var Jb=void 0;function Bg(){}Bg.prototype=new kg;Bg.prototype.constructor=Bg;function Cg(){}Cg.prototype=Bg.prototype;function Dg(){this.Ec=this.Ta=0;this.Nd=null}Dg.prototype=new ig;Dg.prototype.constructor=Dg;Dg.prototype.ba=function(){var a=this.Nd.qa(this.Ta);this.Ta=1+this.Ta|0;return a};
function zg(a){var b=new Dg;b.Nd=a;b.Ta=0;b.Ec=a.pa();return b}Dg.prototype.ia=function(){return this.Ta<this.Ec};Dg.prototype.c=w({bi:0},"scala.runtime.ScalaRunTime$$anon$1",{bi:1,tb:1,d:1,yb:1,la:1,ka:1});function Eg(){this.wd=null;this.jf=!1;this.hj=this.We=null;this.cj=this.af=this.kf=this.lf=!1}Eg.prototype=new Yf;Eg.prototype.constructor=Eg;function Fg(){}Fg.prototype=Eg.prototype;Eg.prototype.gf=function(a,b,c){this.jf=b;this.We=c;Xf.prototype.Zb.call(this,a);this.af=this.kf=this.lf=!1;return this};
Eg.prototype.Zb=function(a){Eg.prototype.gf.call(this,a,!1,null);return this};function qg(){this.eb=this.db=null}qg.prototype=new x;m=qg.prototype;m.constructor=qg;m.ra=k("Tuple2");m.pa=k(2);function pg(a,b,c){a.db=b;a.eb=c;return a}m.qa=function(a){a:switch(a){case 0:a=this.db;break a;case 1:a=this.eb;break a;default:throw(new Z).f(""+a);}return a};m.m=function(){return"("+this.db+","+this.eb+")"};m.z=function(){return td(this)};m.Da=function(){return zg(this)};
m.c=w({Qe:0},"scala.Tuple2",{Qe:1,d:1,vj:1,Ka:1,q:1,j:1,g:1});function ib(){H.call(this)}ib.prototype=new tg;ib.prototype.constructor=ib;ib.prototype.c=w({Ff:0},"java.lang.NumberFormatException",{Ff:1,$b:1,R:1,aa:1,E:1,d:1,g:1});function Gg(){}Gg.prototype=new wg;m=Gg.prototype;m.constructor=Gg;m.ra=k("None");m.pa=k(0);m.s=k(!0);m.ga=function(){throw(new I).f("None.get");};m.qa=function(a){throw(new Z).f(""+a);};m.m=k("None");m.z=k(2433880);m.Da=function(){return zg(this)};
m.c=w({Vf:0},"scala.None$",{Vf:1,Wf:1,d:1,Ka:1,q:1,j:1,g:1});var Hg=void 0;function y(){Hg||(Hg=(new Gg).b());return Hg}function Za(){this.rc=null}Za.prototype=new wg;m=Za.prototype;m.constructor=Za;m.ra=k("Some");m.pa=k(1);m.s=k(!1);m.qa=function(a){switch(a){case 0:return this.rc;default:throw(new Z).f(""+a);}};m.ga=h("rc");m.m=function(){return te(this)};m.w=function(a){this.rc=a;return this};m.z=function(){return td(this)};m.Da=function(){return zg(this)};
m.c=w({bg:0},"scala.Some",{bg:1,Wf:1,d:1,Ka:1,q:1,j:1,g:1});function Ig(){H.call(this);this.ff=0}Ig.prototype=new tg;Ig.prototype.constructor=Ig;
function yg(a,b){var c=new Ig;c.ff=b;var d=kb(new lb,mb(new z,["invalid escape "," index ",' in "','". Use \\\\\\\\ for literal \\\\.']));uf||(uf=(new tf).b());if(!(0<=b&&b<(a.length|0)))throw(new E).f("requirement failed");if(b===(-1+(a.length|0)|0))var e="at terminal";else var e=kb(new lb,mb(new z,["'\\\\","' not one of "," at"])),g=65535&(a.charCodeAt(1+b|0)|0),e=jb(e,mb(new z,[we(g),"[\\b, \\t, \\n, \\f, \\r, \\\\, \\\", \\']"]));E.prototype.f.call(c,jb(d,mb(new z,[e,b,a])));return c}
Ig.prototype.c=w({eg:0},"scala.StringContext$InvalidEscapeException",{eg:1,$b:1,R:1,aa:1,E:1,d:1,g:1});function Jg(){this.ca=null}Jg.prototype=new Jf;Jg.prototype.constructor=Jg;function Kg(){}Kg.prototype=Jg.prototype;function yf(){}yf.prototype=new Cg;yf.prototype.constructor=yf;yf.prototype.c=w({rh:0},"scala.collection.immutable.Set$",{rh:1,Mj:1,Oj:1,Kj:1,Fa:1,d:1,Ga:1});var xf=void 0;
function Lg(){this.Wb=this.oa=this.na=this.Vb=0;this.fb=!1;this.Pb=0;this.Tc=this.Rc=this.Pc=this.Nc=this.Lc=this.Rb=null}Lg.prototype=new ig;m=Lg.prototype;m.constructor=Lg;
m.ba=function(){if(!this.fb)throw(new I).f("reached iterator end");var a=this.Rb.a[this.oa];this.oa=1+this.oa|0;if(this.oa===this.Wb)if((this.na+this.oa|0)<this.Vb){var b=32+this.na|0,c=this.na^b;if(1024>c)this.y(this.l().a[31&b>>5]);else if(32768>c)this.t(this.o().a[31&b>>10]),this.y(this.l().a[0]);else if(1048576>c)this.H(this.u().a[31&b>>15]),this.t(this.o().a[0]),this.y(this.l().a[0]);else if(33554432>c)this.fa(this.P().a[31&b>>20]),this.H(this.u().a[0]),this.t(this.o().a[0]),this.y(this.l().a[0]);
else if(1073741824>c)this.wa(this.xa().a[31&b>>25]),this.fa(this.P().a[0]),this.H(this.u().a[0]),this.t(this.o().a[0]),this.y(this.l().a[0]);else throw(new E).b();this.na=b;b=this.Vb-this.na|0;this.Wb=32>b?b:32;this.oa=0}else this.fb=!1;return a};m.u=h("Pc");m.Ic=h("Pb");m.Sb=f("Tc");m.N=h("Rb");m.P=h("Rc");m.H=f("Nc");m.t=f("Lc");m.ia=h("fb");m.wa=f("Rc");m.l=h("Lc");m.xa=h("Tc");m.Hc=f("Pb");m.o=h("Nc");m.y=f("Rb");m.fa=f("Pc");
m.c=w({zh:0},"scala.collection.immutable.VectorIterator",{zh:1,tb:1,d:1,yb:1,la:1,ka:1,Ah:1});function Mg(){Eg.call(this);this.ed=null;this.Xb=!1;this.Sa=null}Mg.prototype=new Fg;Mg.prototype.constructor=Mg;function wb(a){var b=new Mg;b.ed=a;Eg.prototype.Zb.call(b,(new $f).b());b.Xb=!0;b.Sa="";return b}
function Td(a,b){for(var c=b;""!==c;){var d=c.indexOf("\n")|0;if(0>d)a.Sa=""+a.Sa+c,a.Xb=!1,c="";else{var e=""+a.Sa+c.substring(0,d);p.console&&(a.ed&&p.console.error?p.console.error(e):p.console.log(e));a.Sa="";a.Xb=!0;c=c.substring(1+d|0)}}}Mg.prototype.c=w({Bf:0},"java.lang.JSConsoleBasedPrintStream",{Bf:1,ri:1,qi:1,oe:1,d:1,me:1,ne:1,mf:1});function Ob(){this.ca=null}Ob.prototype=new Kg;Ob.prototype.constructor=Ob;
Ob.prototype.c=w({$g:0},"scala.collection.Seq$",{$g:1,Fb:1,Db:1,La:1,Fa:1,d:1,Ma:1,Ga:1});var Nb=void 0;function Ng(){this.ca=null}Ng.prototype=new Kg;Ng.prototype.constructor=Ng;function Og(){}Og.prototype=Ng.prototype;function K(){H.call(this);this.ld=null}K.prototype=new S;m=K.prototype;m.constructor=K;m.ra=k("UninitializedFieldError");m.pa=k(1);m.qa=function(a){switch(a){case 0:return this.ld;default:throw(new Z).f(""+a);}};m.f=function(a){this.ld=a;Q.prototype.f.call(this,a);return this};
m.z=function(){return td(this)};m.Da=function(){return zg(this)};m.c=w({fg:0},"scala.UninitializedFieldError",{fg:1,R:1,aa:1,E:1,d:1,g:1,Ka:1,q:1,j:1});function Pg(){this.v=null}Pg.prototype=new x;Pg.prototype.constructor=Pg;function Rg(){}Rg.prototype=Pg.prototype;Pg.prototype.m=h("v");Pg.prototype.z=function(){return Aa(this)};function Sg(){this.$a=this.Za=this.Ya=null}Sg.prototype=new x;Sg.prototype.constructor=Sg;function Tg(){}Tg.prototype=Sg.prototype;function Ug(){this.He=this.ca=null}
Ug.prototype=new Og;Ug.prototype.constructor=Ug;Ug.prototype.b=function(){Ng.prototype.b.call(this);Vg=this;this.He=(new Hf).b();return this};Ug.prototype.c=w({Tg:0},"scala.collection.IndexedSeq$",{Tg:1,hh:1,Fb:1,Db:1,La:1,Fa:1,d:1,Ma:1,Ga:1});var Vg=void 0;function Pb(){Vg||(Vg=(new Ug).b());return Vg}function Wg(){this.Ja=this.Ub=0;this.Ha=null}Wg.prototype=new ig;Wg.prototype.constructor=Wg;
Wg.prototype.ba=function(){this.Ja>=this.Ub&&Qb().Tb.ba();var a=this.Ha.ma(this.Ja);this.Ja=1+this.Ja|0;return a};function sg(a,b){var c=new Wg;c.Ub=b;if(null===a)throw kd(ld(),null);c.Ha=a;c.Ja=0;return c}Wg.prototype.ia=function(){return this.Ja<this.Ub};Wg.prototype.c=w({Vg:0},"scala.collection.IndexedSeqLike$Elements",{Vg:1,tb:1,d:1,yb:1,la:1,ka:1,Dj:1,j:1,g:1});function je(){H.call(this);this.Ia=null}je.prototype=new S;m=je.prototype;m.constructor=je;m.ra=k("JavaScriptException");m.pa=k(1);
m.lb=function(){ge();this.stackdata=this.Ia;return this};m.qa=function(a){switch(a){case 0:return this.Ia;default:throw(new Z).f(""+a);}};m.m=function(){return ja(this.Ia)};m.w=function(a){this.Ia=a;Q.prototype.b.call(this);return this};m.z=function(){return td(this)};m.Da=function(){return zg(this)};m.c=w({pc:0},"scala.scalajs.js.JavaScriptException",{pc:1,R:1,aa:1,E:1,d:1,g:1,Ka:1,q:1,j:1});function Pc(){this.v=null}Pc.prototype=new Rg;Pc.prototype.constructor=Pc;
Pc.prototype.b=function(){this.v="Boolean";Oc=this;return this};Pc.prototype.c=w({tg:0},"scala.reflect.ManifestFactory$BooleanManifest$",{tg:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Oc=void 0;function Bc(){this.v=null}Bc.prototype=new Rg;Bc.prototype.constructor=Bc;Bc.prototype.b=function(){this.v="Byte";Ac=this;return this};Bc.prototype.c=w({ug:0},"scala.reflect.ManifestFactory$ByteManifest$",{ug:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Ac=void 0;function Fc(){this.v=null}Fc.prototype=new Rg;
Fc.prototype.constructor=Fc;Fc.prototype.b=function(){this.v="Char";Ec=this;return this};Fc.prototype.c=w({vg:0},"scala.reflect.ManifestFactory$CharManifest$",{vg:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Ec=void 0;function Nc(){this.v=null}Nc.prototype=new Rg;Nc.prototype.constructor=Nc;Nc.prototype.b=function(){this.v="Double";Mc=this;return this};Nc.prototype.c=w({wg:0},"scala.reflect.ManifestFactory$DoubleManifest$",{wg:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Mc=void 0;
function Lc(){this.v=null}Lc.prototype=new Rg;Lc.prototype.constructor=Lc;Lc.prototype.b=function(){this.v="Float";Kc=this;return this};Lc.prototype.c=w({xg:0},"scala.reflect.ManifestFactory$FloatManifest$",{xg:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Kc=void 0;function Hc(){this.v=null}Hc.prototype=new Rg;Hc.prototype.constructor=Hc;Hc.prototype.b=function(){this.v="Int";Gc=this;return this};
Hc.prototype.c=w({yg:0},"scala.reflect.ManifestFactory$IntManifest$",{yg:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Gc=void 0;function Jc(){this.v=null}Jc.prototype=new Rg;Jc.prototype.constructor=Jc;Jc.prototype.b=function(){this.v="Long";Ic=this;return this};Jc.prototype.c=w({zg:0},"scala.reflect.ManifestFactory$LongManifest$",{zg:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Ic=void 0;function $(){Sg.call(this);this.Oa=null}$.prototype=new Tg;$.prototype.constructor=$;function Xg(){}
Xg.prototype=$.prototype;$.prototype.m=h("Oa");$.prototype.z=function(){return Aa(this)};function Dc(){this.v=null}Dc.prototype=new Rg;Dc.prototype.constructor=Dc;Dc.prototype.b=function(){this.v="Short";Cc=this;return this};Dc.prototype.c=w({Dg:0},"scala.reflect.ManifestFactory$ShortManifest$",{Dg:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Cc=void 0;function Rc(){this.v=null}Rc.prototype=new Rg;Rc.prototype.constructor=Rc;Rc.prototype.b=function(){this.v="Unit";Qc=this;return this};
Rc.prototype.c=w({Eg:0},"scala.reflect.ManifestFactory$UnitManifest$",{Eg:1,sa:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Qc=void 0;function Yg(){this.Qf=this.ca=null}Yg.prototype=new Kg;Yg.prototype.constructor=Yg;Yg.prototype.b=function(){Jg.prototype.b.call(this);Zg=this;this.Qf=(new Ve).b();return this};Yg.prototype.c=w({lh:0},"scala.collection.immutable.List$",{lh:1,Fb:1,Db:1,La:1,Fa:1,d:1,Ma:1,Ga:1,j:1,g:1});var Zg=void 0;function Rb(){Zg||(Zg=(new Yg).b());return Zg}
function $b(){this.ca=null}$b.prototype=new Kg;$b.prototype.constructor=$b;$b.prototype.c=w({sh:0},"scala.collection.immutable.Stream$",{sh:1,Fb:1,Db:1,La:1,Fa:1,d:1,Ma:1,Ga:1,j:1,g:1});var Zb=void 0;function Tc(){$.call(this)}Tc.prototype=new Xg;Tc.prototype.constructor=Tc;Tc.prototype.b=function(){this.Oa="Any";var a=y(),b=Sb();this.Ya=a;this.Za=s(Ka);this.$a=b;Sc=this;return this};Tc.prototype.c=w({rg:0},"scala.reflect.ManifestFactory$AnyManifest$",{rg:1,sb:1,rb:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});
var Sc=void 0;function Xc(){$.call(this)}Xc.prototype=new Xg;Xc.prototype.constructor=Xc;Xc.prototype.b=function(){this.Oa="AnyVal";var a=y(),b=Sb();this.Ya=a;this.Za=s(Ka);this.$a=b;Wc=this;return this};Xc.prototype.c=w({sg:0},"scala.reflect.ManifestFactory$AnyValManifest$",{sg:1,sb:1,rb:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Wc=void 0;function Zc(){$.call(this)}Zc.prototype=new Xg;Zc.prototype.constructor=Zc;
Zc.prototype.b=function(){this.Oa="Nothing";var a=y(),b=Sb();this.Ya=a;this.Za=s(Wf);this.$a=b;Yc=this;return this};Zc.prototype.c=w({Ag:0},"scala.reflect.ManifestFactory$NothingManifest$",{Ag:1,sb:1,rb:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Yc=void 0;function ad(){$.call(this)}ad.prototype=new Xg;ad.prototype.constructor=ad;ad.prototype.b=function(){this.Oa="Null";var a=y(),b=Sb();this.Ya=a;this.Za=s(oe);this.$a=b;$c=this;return this};
ad.prototype.c=w({Bg:0},"scala.reflect.ManifestFactory$NullManifest$",{Bg:1,sb:1,rb:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var $c=void 0;function Vc(){$.call(this)}Vc.prototype=new Xg;Vc.prototype.constructor=Vc;Vc.prototype.b=function(){this.Oa="Object";var a=y(),b=Sb();this.Ya=a;this.Za=s(Ka);this.$a=b;Uc=this;return this};Vc.prototype.c=w({Cg:0},"scala.reflect.ManifestFactory$ObjectManifest$",{Cg:1,sb:1,rb:1,d:1,X:1,W:1,U:1,M:1,j:1,g:1,q:1});var Uc=void 0;
function dc(){this.xe=this.ca=null;this.Yi=this.si=0}dc.prototype=new Og;dc.prototype.constructor=dc;dc.prototype.b=function(){Ng.prototype.b.call(this);cc=this;this.xe=(new $g).k(0,0,0);return this};dc.prototype.c=w({yh:0},"scala.collection.immutable.Vector$",{yh:1,hh:1,Fb:1,Db:1,La:1,Fa:1,d:1,Ma:1,Ga:1,j:1,g:1});var cc=void 0;function ah(){}ah.prototype=new x;ah.prototype.constructor=ah;function bh(){}bh.prototype=ah.prototype;ah.prototype.Bd=function(){return this};ah.prototype.Gb=function(){return Ed(this)};
function ch(){}ch.prototype=new bh;ch.prototype.constructor=ch;function dh(){}dh.prototype=ch.prototype;ch.prototype.ya=function(a){for(var b=this.za();b.ia();)a.ea(b.ba())};function A(){this.A=null}A.prototype=new x;m=A.prototype;m.constructor=A;m.ma=function(a){a=65535&(this.A.charCodeAt(a)|0);return we(a)};m.Va=function(a){return this.K()-a|0};m.m=h("A");m.ya=function(a){Ad(this,a)};m.za=function(){return sg(this,this.A.length|0)};m.K=function(){return this.A.length|0};m.Bd=h("A");
m.f=function(a){this.A=a;return this};m.z=function(){var a=this.A;return xa(u(),a)};m.Gb=function(){return Ed(this)};m.c=w({vh:0},"scala.collection.immutable.StringOps",{vh:1,d:1,uh:1,Fd:1,jc:1,Ab:1,xb:1,q:1,Bb:1,Eb:1,Cb:1,la:1,ka:1,wb:1,zb:1,ub:1,vb:1,kg:1,ha:1});function eh(){}eh.prototype=new dh;eh.prototype.constructor=eh;function fh(){}fh.prototype=eh.prototype;eh.prototype.s=function(){return 0===this.Va(0)};eh.prototype.m=function(){var a=this.Gb()+"(";return Kd(this,a,", ")};
function gh(){}gh.prototype=new fh;gh.prototype.constructor=gh;function hh(){}hh.prototype=gh.prototype;function ih(){}ih.prototype=new fh;ih.prototype.constructor=ih;function jh(){}m=jh.prototype=ih.prototype;m.b=function(){return this};m.Va=function(a){if(0>a)a=1;else a:{var b=this,c=0;for(;;){if(c===a){a=b.s()?0:1;break a}if(b.s()){a=-1;break a}c=1+c|0;b=kh()}a=void 0}return a};m.ea=function(a){a|=0;for(var b=this,c=a;!b.s()&&0<c;)b=kh(),c=-1+c|0;if(0>a||b.s())throw(new Z).f(""+a);Le()};
m.ya=function(a){for(var b=this;!b.s();)a.ea(Le()),b=kh()};m.za=function(){var a=new Ag;a.Ld=this;return a};m.K=function(){for(var a=this,b=0;!a.s();)b=1+b|0,a=kh();return b};m.z=function(){return Ke(this)};m.Gb=k("List");function $g(){this.mb=this.kb=this.Na=0;this.Jc=!1;this.Qb=0;this.Uc=this.Sc=this.Qc=this.Oc=this.Mc=this.Kc=null}$g.prototype=new fh;m=$g.prototype;m.constructor=$g;m.u=h("Qc");
m.ma=function(a){var b=a+this.Na|0;if(0<=a&&b<this.kb)a=b;else throw(new Z).f(""+a);return Qd(this,a,a^this.mb)};m.Ic=h("Qb");m.Va=function(a){return this.K()-a|0};m.ea=function(a){return this.ma(a|0)};m.k=function(a,b,c){this.Na=a;this.kb=b;this.mb=c;this.Jc=!1;return this};m.Sb=f("Uc");m.N=h("Kc");m.P=h("Sc");m.H=f("Oc");
m.za=function(){var a=this.Na,b=this.kb,c=new Lg;c.Vb=b;c.na=-32&a;c.oa=31&a;a=b-c.na|0;c.Wb=32>a?a:32;c.fb=(c.na+c.oa|0)<b;b=this.Qb;c.Hc(b);b=-1+b|0;switch(b){case -1:break;case 0:c.y(this.N());break;case 1:c.t(this.l());c.y(this.N());break;case 2:c.H(this.o());c.t(this.l());c.y(this.N());break;case 3:c.fa(this.u());c.H(this.o());c.t(this.l());c.y(this.N());break;case 4:c.wa(this.P());c.fa(this.u());c.H(this.o());c.t(this.l());c.y(this.N());break;case 5:c.Sb(this.xa());c.wa(this.P());c.fa(this.u());
c.H(this.o());c.t(this.l());c.y(this.N());break;default:throw(new rg).w(b);}if(this.Jc)switch(b=this.mb,a=-1+c.Ic()|0,a){case 5:c.Sb(F(c.xa()));c.wa(F(c.P()));c.fa(F(c.u()));c.H(F(c.o()));c.t(F(c.l()));c.xa().a[31&b>>25]=c.P();c.P().a[31&b>>20]=c.u();c.u().a[31&b>>15]=c.o();c.o().a[31&b>>10]=c.l();c.l().a[31&b>>5]=c.N();break;case 4:c.wa(F(c.P()));c.fa(F(c.u()));c.H(F(c.o()));c.t(F(c.l()));c.P().a[31&b>>20]=c.u();c.u().a[31&b>>15]=c.o();c.o().a[31&b>>10]=c.l();c.l().a[31&b>>5]=c.N();break;case 3:c.fa(F(c.u()));
c.H(F(c.o()));c.t(F(c.l()));c.u().a[31&b>>15]=c.o();c.o().a[31&b>>10]=c.l();c.l().a[31&b>>5]=c.N();break;case 2:c.H(F(c.o()));c.t(F(c.l()));c.o().a[31&b>>10]=c.l();c.l().a[31&b>>5]=c.N();break;case 1:c.t(F(c.l()));c.l().a[31&b>>5]=c.N();break;case 0:break;default:throw(new rg).w(a);}if(1<c.Pb&&(b=this.Na,a=this.Na^this.mb,32<=a))if(1024>a)c.y(c.l().a[31&b>>5]);else if(32768>a)c.t(c.o().a[31&b>>10]),c.y(c.l().a[31&b>>5]);else if(1048576>a)c.H(c.u().a[31&b>>15]),c.t(c.o().a[31&b>>10]),c.y(c.l().a[31&
b>>5]);else if(33554432>a)c.fa(c.P().a[31&b>>20]),c.H(c.u().a[31&b>>15]),c.t(c.o().a[31&b>>10]),c.y(c.l().a[31&b>>5]);else if(1073741824>a)c.wa(c.xa().a[31&b>>25]),c.fa(c.P().a[31&b>>20]),c.H(c.u().a[31&b>>15]),c.t(c.o().a[31&b>>10]),c.y(c.l().a[31&b>>5]);else throw(new E).b();return c};m.t=f("Mc");m.wa=f("Sc");m.K=function(){return this.kb-this.Na|0};m.l=h("Mc");m.xa=h("Uc");m.z=function(){return Ke(this)};m.Hc=f("Qb");m.o=h("Oc");m.y=f("Kc");m.fa=f("Qc");
m.c=w({xh:0},"scala.collection.immutable.Vector",{xh:1,ec:1,dc:1,fc:1,d:1,mc:1,Bb:1,Eb:1,Cb:1,la:1,ka:1,wb:1,zb:1,ic:1,nc:1,kc:1,gc:1,ub:1,xb:1,q:1,lc:1,cc:1,ta:1,hc:1,vb:1,Ab:1,Rj:1,qh:1,jh:1,wh:1,Sf:1,Ed:1,jc:1,Ah:1,j:1,g:1,Ej:1});function lh(){}lh.prototype=new jh;m=lh.prototype;m.constructor=lh;m.ra=k("Nil");m.pa=k(0);function kh(){throw(new ug).f("tail of empty list");}m.s=k(!0);m.qa=function(a){throw(new Z).f(""+a);};function Le(){throw(new I).f("head of empty list");}m.Da=function(){return zg(this)};
m.c=w({oh:0},"scala.collection.immutable.Nil$",{oh:1,kh:1,ec:1,dc:1,fc:1,d:1,mc:1,Bb:1,Eb:1,Cb:1,la:1,ka:1,wb:1,zb:1,ic:1,nc:1,kc:1,gc:1,ub:1,xb:1,q:1,lc:1,cc:1,ta:1,hc:1,vb:1,Ab:1,Sj:1,qh:1,jh:1,wh:1,Sf:1,Fj:1,Gj:1,Ka:1,Hj:1,g:1,j:1});var mh=void 0;function Sb(){mh||(mh=(new lh).b());return mh}function nh(){}nh.prototype=new hh;nh.prototype.constructor=nh;function oh(){}oh.prototype=nh.prototype;function Ld(){this.L=null}Ld.prototype=new hh;m=Ld.prototype;m.constructor=Ld;
m.b=function(){Ld.prototype.bd.call(this,16,"");return this};m.ma=function(a){a=65535&(this.L.G.charCodeAt(a)|0);return we(a)};m.Va=function(a){return this.K()-a|0};m.ea=function(a){a=65535&(this.L.G.charCodeAt(a|0)|0);return we(a)};m.s=function(){return 0===this.K()};m.Kd=function(a,b){return this.L.G.substring(a,b)};m.m=function(){return this.L.G};m.ya=function(a){Ad(this,a)};m.za=function(){return sg(this,this.L.G.length|0)};
m.bd=function(a,b){Ld.prototype.hf.call(this,C((new ag).r((b.length|0)+a|0),b));return this};m.K=function(){return this.L.G.length|0};m.hf=function(a){this.L=a;return this};function Jd(a,b){C(a.L,Ud(u(),b));return a}m.f=function(a){Ld.prototype.bd.call(this,16,a);return this};m.z=function(){return Ke(this)};
m.c=w({Jh:0},"scala.collection.mutable.StringBuilder",{Jh:1,Bh:1,ec:1,dc:1,fc:1,d:1,mc:1,Bb:1,Eb:1,Cb:1,la:1,ka:1,wb:1,zb:1,ic:1,nc:1,kc:1,gc:1,ub:1,xb:1,q:1,lc:1,cc:1,ta:1,hc:1,vb:1,Ab:1,Hh:1,Gh:1,Lh:1,Uf:1,Ih:1,Dh:1,Dd:1,id:1,hd:1,Eh:1,Ed:1,jc:1,Fh:1,uh:1,Fd:1,kg:1,ha:1,Ch:1,gh:1,dh:1,j:1,g:1});function z(){this.va=null}z.prototype=new oh;m=z.prototype;m.constructor=z;m.Va=function(a){return this.K()-a|0};m.ma=function(a){return this.va[a]};m.ea=function(a){return this.va[a|0]};
m.s=function(){return 0===this.K()};m.ya=function(a){Ad(this,a)};m.za=function(){return sg(this,this.va.length|0)};m.K=function(){return this.va.length|0};m.z=function(){return Ke(this)};function mb(a,b){a.va=b;return a}m.Gb=k("WrappedArray");
m.c=w({Oh:0},"scala.scalajs.js.WrappedArray",{Oh:1,Tj:1,Bh:1,ec:1,dc:1,fc:1,d:1,mc:1,Bb:1,Eb:1,Cb:1,la:1,ka:1,wb:1,zb:1,ic:1,nc:1,kc:1,gc:1,ub:1,xb:1,q:1,lc:1,cc:1,ta:1,hc:1,vb:1,Ab:1,Hh:1,Gh:1,Lh:1,Uf:1,Ih:1,Dh:1,Dd:1,id:1,Vj:1,Wj:1,gh:1,dh:1,Pj:1,Ij:1,Qj:1,Eh:1,Ed:1,jc:1,Fh:1,Uj:1,Xj:1,Fd:1,Ch:1});
}).call(this);


  module.exports = {
    MersenneTwisterFast: MersenneTwisterFast
  };

}).call(this);
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"shim/random":[function(require,module,exports){
(function() {
  var MersenneTwisterFast;

  MersenneTwisterFast = require('./engine-scala').MersenneTwisterFast;


  /*
  On the JVM, we use Headless' MersenneTwisterFast.
  In the browser, we use a ScalaJS implementation of it.
  We can't the ScalaJS implementation in both environments,
  because MTF relies on bit-shifting, and JVM integers have
  a different number of bits than JS integers, leading to
  different results.
   */

  module.exports = MersenneTwisterFast();

}).call(this);

},{"./engine-scala":"shim/engine-scala"}],"shim/strictmath":[function(require,module,exports){
(function() {
  var Cloner, genEnhancedMath;

  Cloner = require('./cloner');

  genEnhancedMath = function() {
    var obj;
    obj = Cloner(Math);
    obj.toRadians = function(degrees) {
      return degrees * Math.PI / 180;
    };
    obj.toDegrees = function(radians) {
      return radians * 180 / Math.PI;
    };
    obj.PI = function() {
      return Math.PI;
    };
    obj.truncate = function(x) {
      if (x >= 0) {
        return Math.floor(x);
      } else {
        return Math.ceil(x);
      }
    };
    return obj;
  };

  module.exports = typeof StrictMath !== "undefined" && StrictMath !== null ? StrictMath : genEnhancedMath();

}).call(this);

},{"./cloner":"shim/cloner"}],"util/abstractmethoderror":[function(require,module,exports){
(function() {
  module.exports = function(msg) {
    throw new Error("Illegal method call: `" + msg + "` is abstract");
  };

}).call(this);

},{}],"util/brazier/array":[function(require,module,exports){
(function() {
  var arrayOps, isArray;

  isArray = require('./type').isArray;

  arrayOps = {
    all: function(f) {
      return function(arr) {
        var j, len, x;
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          if (!f(x)) {
            return false;
          }
        }
        return true;
      };
    },
    contains: function(x) {
      return function(arr) {
        var item, j, len;
        for (j = 0, len = arr.length; j < len; j++) {
          item = arr[j];
          if (item === x) {
            return true;
          }
        }
        return false;
      };
    },
    countBy: function(f) {
      return function(arr) {
        var acc, j, key, len, ref, value, x;
        acc = {};
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          key = f(x);
          value = (ref = acc[key]) != null ? ref : 0;
          acc[key] = value + 1;
        }
        return acc;
      };
    },
    difference: function(xs) {
      return function(arr) {
        var acc, badBoys, j, len, x;
        acc = [];
        badBoys = arrayOps.unique(xs);
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          if (!arrayOps.contains(x)(badBoys)) {
            acc.push(x);
          }
        }
        return acc;
      };
    },
    exists: function(f) {
      return function(arr) {
        var j, len, x;
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          if (f(x)) {
            return true;
          }
        }
        return false;
      };
    },
    filter: function(f) {
      return function(arr) {
        var j, len, results, x;
        results = [];
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          if (f(x)) {
            results.push(x);
          }
        }
        return results;
      };
    },
    find: function(f) {
      return function(arr) {
        var j, len, x;
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          if (f(x)) {
            return x;
          }
        }
        return void 0;
      };
    },
    findIndex: function(f) {
      return function(arr) {
        var i, j, len, x;
        for (i = j = 0, len = arr.length; j < len; i = ++j) {
          x = arr[i];
          if (f(x)) {
            return i;
          }
        }
        return void 0;
      };
    },
    flatMap: function(f) {
      return function(arr) {
        var arrs, ref, x;
        arrs = (function() {
          var j, len, results;
          results = [];
          for (j = 0, len = arr.length; j < len; j++) {
            x = arr[j];
            results.push(f(x));
          }
          return results;
        })();
        return (ref = []).concat.apply(ref, arrs);
      };
    },
    flattenDeep: function(arr) {
      var acc, j, len, x;
      acc = [];
      for (j = 0, len = arr.length; j < len; j++) {
        x = arr[j];
        if (isArray(x)) {
          acc = acc.concat(arrayOps.flattenDeep(x));
        } else {
          acc.push(x);
        }
      }
      return acc;
    },
    foldl: function(f) {
      return function(acc) {
        return function(arr) {
          var j, len, out, x;
          out = acc;
          for (j = 0, len = arr.length; j < len; j++) {
            x = arr[j];
            out = f(out, x);
          }
          return out;
        };
      };
    },
    forEach: function(f) {
      return function(arr) {
        var j, len, x;
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          f(x);
        }
      };
    },
    head: function(arr) {
      return arr[0];
    },
    headAndTail: function(arr) {
      return [arr[0], arr.slice(1)];
    },
    isEmpty: function(arr) {
      return arr.length === 0;
    },
    last: function(arr) {
      return arr[arr.length - 1];
    },
    length: function(arr) {
      return arr.length;
    },
    map: function(f) {
      return function(arr) {
        var j, len, results, x;
        results = [];
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          results.push(f(x));
        }
        return results;
      };
    },
    maxBy: function(f) {
      return function(arr) {
        var j, len, maxX, maxY, x, y;
        maxX = Number.NEGATIVE_INFINITY;
        maxY = Number.NEGATIVE_INFINITY;
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          y = f(x);
          if (y > maxY) {
            maxX = x;
            maxY = y;
          }
        }
        return maxX;
      };
    },
    sortBy: function(f) {
      return function(arr) {
        return arr.sort(f);
      };
    },
    sortedIndexBy: function(f) {
      return function(arr) {
        return function(x) {
          var i, item, j, len, y;
          y = f(x);
          for (i = j = 0, len = arr.length; j < len; i = ++j) {
            item = arr[i];
            if (y <= f(item)) {
              return i;
            }
          }
          return arr.length;
        };
      };
    },
    tail: function(arr) {
      return arr.slice(1);
    },
    toObject: function(arr) {
      var a, b, j, len, out, ref;
      out = {};
      for (j = 0, len = arr.length; j < len; j++) {
        ref = arr[j], a = ref[0], b = ref[1];
        out[a] = b;
      }
      return out;
    },
    unique: function(arr) {
      var acc, j, len, x;
      acc = [];
      for (j = 0, len = arr.length; j < len; j++) {
        x = arr[j];
        if (!arrayOps.contains(x)(acc)) {
          acc.push(x);
        }
      }
      return acc;
    },
    uniqueBy: function(f) {
      return function(arr) {
        var acc, j, len, seen, x, y;
        acc = [];
        seen = [];
        for (j = 0, len = arr.length; j < len; j++) {
          x = arr[j];
          y = f(x);
          if (!arrayOps.contains(y)(seen)) {
            seen.push(y);
            acc.push(x);
          }
        }
        return acc;
      };
    },
    zip: function(xs) {
      return function(arr) {
        var aux, i, j, len, main, out, ref, y;
        out = [];
        ref = xs.length < arr.length ? [xs, arr] : [arr, xs], main = ref[0], aux = ref[1];
        for (i = j = 0, len = main.length; j < len; i = ++j) {
          y = main[i];
          out.push([y, aux[i]]);
        }
        return out;
      };
    }
  };

  module.exports = arrayOps;

}).call(this);

},{"./type":"util/brazier/type"}],"util/brazier/equals":[function(require,module,exports){
(function() {
  var arrayEquals, booleanEquals, eq, isArray, isBoolean, isNumber, isObject, isString, numberEquals, objectEquals, ref, stringEquals;

  ref = require('./type'), isArray = ref.isArray, isBoolean = ref.isBoolean, isNumber = ref.isNumber, isObject = ref.isObject, isString = ref.isString;

  arrayEquals = function(x) {
    return function(y) {
      var helper;
      helper = function(a, b) {
        var index, item, j, len;
        for (index = j = 0, len = a.length; j < len; index = ++j) {
          item = a[index];
          if (!eq(item, b[index])) {
            return false;
          }
        }
        return true;
      };
      return x.length === y.length && helper(x, y);
    };
  };

  booleanEquals = function(x) {
    return function(y) {
      return x === y;
    };
  };

  eq = function(x) {
    return function(y) {
      return (x === void 0 && y === void 0) || (x === null && y === null) || (isNumber(x) && isNumber(y) && ((isNaN(x) && isNaN(y)) || numberEquals(x, y))) || (isBoolean(x) && isBoolean(y) && booleanEquals(x, y)) || (isString(x) && isString(y) && stringEquals(x, y)) || (isObject(x) && isObject(y) && objectEquals(x, y)) || (isArray(x) && isArray(y) && arrayEquals(x, y));
    };
  };

  numberEquals = function(x) {
    return function(y) {
      return x === y;
    };
  };

  objectEquals = function(x) {
    return function(y) {
      var helper, xKeys;
      xKeys = Object.keys(x);
      helper = function(a, b) {
        var i, j, key, ref1;
        for (i = j = 0, ref1 = xKeys.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
          key = xKeys[i];
          if (!eq(x[key], y[key])) {
            return false;
          }
        }
        return true;
      };
      return xKeys.length === Object.keys(y).length && helper(x, y);
    };
  };

  stringEquals = function(x) {
    return function(y) {
      return x === y;
    };
  };

  arrayEquals = function(x) {
    return function(y) {
      var helper;
      helper = function(a, b) {
        var index, item, j, len;
        for (index = j = 0, len = a.length; j < len; index = ++j) {
          item = a[index];
          if (!eq(item, b[index])) {
            return false;
          }
        }
        return true;
      };
      return x.length === y.length && helper(x, y);
    };
  };

  booleanEquals = function(x) {
    return function(y) {
      return x === y;
    };
  };

  eq = function(x) {
    return function(y) {
      return (x === void 0 && y === void 0) || (x === null && y === null) || (isNumber(x) && isNumber(y) && ((isNaN(x) && isNaN(y)) || numberEquals(x, y))) || (isBoolean(x) && isBoolean(y) && booleanEquals(x, y)) || (isString(x) && isString(y) && stringEquals(x, y)) || (isObject(x) && isObject(y) && objectEquals(x, y)) || (isArray(x) && isArray(y) && arrayEquals(x, y));
    };
  };

  numberEquals = function(x) {
    return function(y) {
      return x === y;
    };
  };

  objectEquals = function(x) {
    return function(y) {
      var helper, xKeys;
      xKeys = Object.keys(x);
      helper = function(a, b) {
        var i, j, key, ref1;
        for (i = j = 0, ref1 = xKeys.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
          key = xKeys[i];
          if (!eq(x[key], y[key])) {
            return false;
          }
        }
        return true;
      };
      return xKeys.length === Object.keys(y).length && helper(x, y);
    };
  };

  stringEquals = function(x) {
    return function(y) {
      return x === y;
    };
  };

  module.exports = {
    arrayEquals: arrayEquals,
    booleanEquals: booleanEquals,
    eq: eq,
    numberEquals: numberEquals,
    objectEquals: objectEquals,
    stringEquals: stringEquals
  };

}).call(this);

},{"./type":"util/brazier/type"}],"util/brazier/function":[function(require,module,exports){
(function() {
  var slice = [].slice;

  module.exports = {
    id: function(x) {
      return x;
    },
    pipeline: function() {
      var functions;
      functions = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return function() {
        var args, f, fs, h, i, len, out;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        h = functions[0], fs = 2 <= functions.length ? slice.call(functions, 1) : [];
        out = h.apply(null, args);
        for (i = 0, len = fs.length; i < len; i++) {
          f = fs[i];
          out = f(out);
        }
        return out;
      };
    },
    plus: function(x, y) {
      return x + y;
    }
  };

}).call(this);

},{}],"util/brazier/number":[function(require,module,exports){
(function() {
  module.exports = {
    rangeTo: function(start, end) {
      var i, results;
      if (start <= end) {
        return (function() {
          results = [];
          for (var i = start; start <= end ? i <= end : i >= end; start <= end ? i++ : i--){ results.push(i); }
          return results;
        }).apply(this);
      } else {
        return [];
      }
    },
    rangeUntil: function(start, end) {
      var i, results;
      if (start < end) {
        return (function() {
          results = [];
          for (var i = start; start <= end ? i < end : i > end; start <= end ? i++ : i--){ results.push(i); }
          return results;
        }).apply(this);
      } else {
        return [];
      }
    }
  };

}).call(this);

},{}],"util/brazier/object":[function(require,module,exports){
(function() {
  module.exports = {
    clone: function(obj) {
      var acc, i, j, key, keys, ref;
      acc = {};
      keys = Object.keys(obj);
      for (i = j = 0, ref = keys.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        key = keys[i];
        acc[key] = obj[key];
      }
      return acc;
    },
    keys: function(obj) {
      return Object.keys(obj);
    },
    pairs: function(obj) {
      var i, j, key, keys, ref, results;
      keys = Object.keys(obj);
      results = [];
      for (i = j = 0, ref = keys.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        key = keys[i];
        results.push([key, obj[key]]);
      }
      return results;
    },
    values: function(obj) {
      var i, j, keys, ref, results;
      keys = Object.keys(obj);
      results = [];
      for (i = j = 0, ref = keys.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        results.push(obj[keys[i]]);
      }
      return results;
    }
  };

}).call(this);

},{}],"util/brazier/type":[function(require,module,exports){
(function() {
  module.exports = {
    isArray: function(x) {
      return Array.isArray(x);
    },
    isBoolean: function(x) {
      return typeof x === "boolean";
    },
    isFunction: function(x) {
      return typeof x === "function";
    },
    isNumber: function(x) {
      return typeof x === "number";
    },
    isObject: function(x) {
      return typeof x === "object";
    },
    isString: function(x) {
      return typeof x === "string";
    }
  };

}).call(this);

},{}],"util/comparator":[function(require,module,exports){
(function() {
  module.exports = {
    NOT_EQUALS: {},
    EQUALS: {
      toInt: 0
    },
    GREATER_THAN: {
      toInt: 1
    },
    LESS_THAN: {
      toInt: -1
    },
    numericCompare: function(x, y) {
      if (x < y) {
        return this.LESS_THAN;
      } else if (x > y) {
        return this.GREATER_THAN;
      } else {
        return this.EQUALS;
      }
    },
    stringCompare: function(x, y) {
      var comparison;
      comparison = x.localeCompare(y);
      if (comparison < 0) {
        return this.LESS_THAN;
      } else if (comparison > 0) {
        return this.GREATER_THAN;
      } else {
        return this.EQUALS;
      }
    }
  };

}).call(this);

},{}],"util/exception":[function(require,module,exports){
(function() {
  var AgentException, DeathInterrupt, HaltInterrupt, NetLogoException, ReportInterrupt, StopInterrupt, TopologyInterrupt, ignoring,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  NetLogoException = (function() {
    function NetLogoException(message) {
      this.message = message;
    }

    return NetLogoException;

  })();

  AgentException = (function(superClass) {
    extend(AgentException, superClass);

    function AgentException() {
      return AgentException.__super__.constructor.apply(this, arguments);
    }

    return AgentException;

  })(NetLogoException);

  DeathInterrupt = (function(superClass) {
    extend(DeathInterrupt, superClass);

    function DeathInterrupt() {
      return DeathInterrupt.__super__.constructor.apply(this, arguments);
    }

    return DeathInterrupt;

  })(NetLogoException);

  ReportInterrupt = (function(superClass) {
    extend(ReportInterrupt, superClass);

    function ReportInterrupt() {
      return ReportInterrupt.__super__.constructor.apply(this, arguments);
    }

    return ReportInterrupt;

  })(NetLogoException);

  StopInterrupt = (function(superClass) {
    extend(StopInterrupt, superClass);

    function StopInterrupt() {
      return StopInterrupt.__super__.constructor.apply(this, arguments);
    }

    return StopInterrupt;

  })(NetLogoException);

  TopologyInterrupt = (function(superClass) {
    extend(TopologyInterrupt, superClass);

    function TopologyInterrupt() {
      return TopologyInterrupt.__super__.constructor.apply(this, arguments);
    }

    return TopologyInterrupt;

  })(NetLogoException);

  HaltInterrupt = (function(superClass) {
    extend(HaltInterrupt, superClass);

    function HaltInterrupt() {
      HaltInterrupt.__super__.constructor.call(this, "model halted by user");
    }

    return HaltInterrupt;

  })(NetLogoException);

  ignoring = function(exceptionType) {
    return function(f) {
      var error, ex;
      try {
        return f();
      } catch (error) {
        ex = error;
        if (!(ex instanceof exceptionType)) {
          throw ex;
        }
      }
    };
  };

  module.exports = {
    AgentException: AgentException,
    DeathInterrupt: DeathInterrupt,
    HaltInterrupt: HaltInterrupt,
    ignoring: ignoring,
    NetLogoException: NetLogoException,
    ReportInterrupt: ReportInterrupt,
    StopInterrupt: StopInterrupt,
    TopologyInterrupt: TopologyInterrupt
  };

}).call(this);

},{}],"util/iterator":[function(require,module,exports){
(function() {
  var Iterator;

  module.exports = Iterator = (function() {
    Iterator.prototype._items = void 0;

    function Iterator(items) {
      this._items = items.slice(0);
    }

    Iterator.prototype.map = function(f) {
      return this._items.map(f);
    };

    Iterator.prototype.forEach = function(f) {
      this._items.forEach(f);
    };

    Iterator.prototype.toArray = function() {
      return this._items;
    };

    return Iterator;

  })();

}).call(this);

},{}],"util/nlmath":[function(require,module,exports){
(function() {
  var Exception, StrictMath,
    slice = [].slice,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  StrictMath = require('../shim/strictmath');

  Exception = require('./exception');

  module.exports = {
    abs: function(n) {
      return StrictMath.abs(n);
    },
    acos: function(radians) {
      return this.validateNumber(StrictMath.toDegrees(StrictMath.acos(radians)));
    },
    asin: function(radians) {
      return this.validateNumber(StrictMath.toDegrees(StrictMath.asin(radians)));
    },
    atan: function(d1, d2) {
      if (d1 === 0 && d2 === 0) {
        throw new Error("Runtime error: atan is undefined when both inputs are zero.");
      } else if (d1 === 0) {
        if (d2 > 0) {
          return 0;
        } else {
          return 180;
        }
      } else if (d2 === 0) {
        if (d1 > 0) {
          return 90;
        } else {
          return 270;
        }
      } else {
        return (StrictMath.toDegrees(StrictMath.atan2(d1, d2)) + 360) % 360;
      }
    },
    ceil: function(n) {
      return StrictMath.ceil(n);
    },
    cos: function(degrees) {
      return StrictMath.cos(StrictMath.toRadians(degrees));
    },
    distance2_2D: function(x, y) {
      return StrictMath.sqrt(x * x + y * y);
    },
    distance4_2D: function(x1, y1, x2, y2) {
      return this.distance2_2D(x1 - x2, y1 - y2);
    },
    exp: function(n) {
      return StrictMath.exp(n);
    },
    floor: function(n) {
      return StrictMath.floor(n);
    },
    ln: function(n) {
      return StrictMath.log(n);
    },
    log: function(num, base) {
      return StrictMath.log(num) / StrictMath.log(base);
    },
    max: function() {
      var xs;
      xs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return Math.max.apply(Math, xs);
    },
    min: function() {
      var xs;
      xs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return Math.min.apply(Math, xs);
    },
    mod: function(a, b) {
      return modulo(a, b);
    },
    normalizeHeading: function(heading) {
      if ((0 <= heading && heading < 360)) {
        return heading;
      } else {
        return ((heading % 360) + 360) % 360;
      }
    },
    precision: function(n, places) {
      var multiplier, result;
      multiplier = StrictMath.pow(10, places);
      result = StrictMath.floor(n * multiplier + .5) / multiplier;
      if (places > 0) {
        return result;
      } else {
        return StrictMath.round(result);
      }
    },
    pow: function(base, exponent) {
      return StrictMath.pow(base, exponent);
    },
    round: function(n) {
      return StrictMath.round(n);
    },
    sin: function(degrees) {
      return StrictMath.sin(StrictMath.toRadians(degrees));
    },
    sqrt: function(n) {
      return StrictMath.sqrt(n);
    },
    squash: function(x) {
      if (StrictMath.abs(x) < 3.2e-15) {
        return 0;
      } else {
        return x;
      }
    },
    subtractHeadings: function(h1, h2) {
      var diff;
      diff = (h1 % 360) - (h2 % 360);
      if ((-180 < diff && diff <= 180)) {
        return diff;
      } else if (diff > 0) {
        return diff - 360;
      } else {
        return diff + 360;
      }
    },
    tan: function(degrees) {
      return StrictMath.tan(StrictMath.toRadians(degrees));
    },
    toInt: function(n) {
      return n | 0;
    },
    validateNumber: function(x) {
      if (!isFinite(x)) {
        throw new Error("math operation produced a non-number");
      } else if (isNaN(x)) {
        throw new Error("math operation produced a number too large for NetLogo");
      } else {
        return x;
      }
    }
  };

}).call(this);

},{"../shim/strictmath":"shim/strictmath","./exception":"util/exception"}],"util/notimplemented":[function(require,module,exports){
(function() {
  module.exports = function(name, defaultValue) {
    if (defaultValue == null) {
      defaultValue = {};
    }
    if ((typeof console !== "undefined" && console !== null) && (console.warn != null)) {
      console.warn("The `" + name + "` primitive has not yet been implemented.");
    }
    return function() {
      return defaultValue;
    };
  };

}).call(this);

},{}],"util/projectionsort":[function(require,module,exports){
(function() {
  var AgentKey, Comparator, NumberKey, OtherKey, StringKey, _, initializeDictionary, stableSort;

  _ = require('lodash');

  Comparator = require('./comparator');

  stableSort = require('./stablesort');

  NumberKey = "number";

  StringKey = "string";

  AgentKey = "agent";

  OtherKey = "other";

  initializeDictionary = function(keys, generator) {
    var f;
    f = function(acc, key) {
      acc[key] = generator(key);
      return acc;
    };
    return _(keys).foldl(f, {});
  };

  module.exports = function(agents) {
    return function(f) {
      var baseAcc, mapBuildFunc, pairs, ref, sortingFunc, typeName, typeNameToPairsMap, typesInMap;
      if (agents.length < 2) {
        return agents;
      } else {
        mapBuildFunc = function(acc, agent) {
          var key, pair, type, value;
          value = agent.projectionBy(f);
          pair = [agent, value];
          type = NLType(value);
          key = type.isNumber() ? NumberKey : type.isString() ? StringKey : type.isAgent() ? AgentKey : OtherKey;
          acc[key].push(pair);
          return acc;
        };
        baseAcc = initializeDictionary([NumberKey, StringKey, AgentKey, OtherKey], function() {
          return [];
        });
        typeNameToPairsMap = _(agents).foldl(mapBuildFunc, baseAcc);
        typesInMap = _(typeNameToPairsMap).omit(_.isEmpty).keys().value();
        ref = (function() {
          switch (typesInMap.join(" ")) {
            case NumberKey:
              return [
                NumberKey, function(arg, arg1) {
                  var n1, n2;
                  arg[0], n1 = arg[1];
                  arg1[0], n2 = arg1[1];
                  return Comparator.numericCompare(n1, n2).toInt;
                }
              ];
            case StringKey:
              return [
                StringKey, function(arg, arg1) {
                  var s1, s2;
                  arg[0], s1 = arg[1];
                  arg1[0], s2 = arg1[1];
                  return Comparator.stringCompare(s1, s2).toInt;
                }
              ];
            case AgentKey:
              return [
                AgentKey, function(arg, arg1) {
                  var a1, a2;
                  arg[0], a1 = arg[1];
                  arg1[0], a2 = arg1[1];
                  return a1.compare(a2).toInt;
                }
              ];
            default:
              throw new Error("SORT-ON works on numbers, strings, or agents of the same type.");
          }
        })(), typeName = ref[0], sortingFunc = ref[1];
        pairs = typeNameToPairsMap[typeName];
        return stableSort(pairs)(sortingFunc).map(function(arg) {
          var x;
          x = arg[0], arg[1];
          return x;
        });
      }
    };
  };

}).call(this);

},{"./comparator":"util/comparator","./stablesort":"util/stablesort","lodash":"lodash"}],"util/rng":[function(require,module,exports){
(function() {
  var AuxRandom, RNG, Random,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Random = require('../shim/random');

  AuxRandom = require('../shim/auxrandom');

  module.exports = RNG = (function() {
    RNG.prototype._currentRNG = void 0;

    function RNG() {
      this.nextDouble = bind(this.nextDouble, this);
      this.nextLong = bind(this.nextLong, this);
      this.nextInt = bind(this.nextInt, this);
      this.nextGaussian = bind(this.nextGaussian, this);
      this._currentRNG = Random;
    }

    RNG.prototype.nextGaussian = function() {
      return this._currentRNG.nextGaussian();
    };

    RNG.prototype.nextInt = function(limit) {
      return this._currentRNG.nextInt(limit);
    };

    RNG.prototype.nextLong = function(limit) {
      return this._currentRNG.nextLong(limit);
    };

    RNG.prototype.nextDouble = function() {
      return this._currentRNG.nextDouble();
    };

    RNG.prototype.setSeed = function(seed) {
      this._currentRNG.setSeed(seed);
    };

    RNG.prototype.withAux = function(f) {
      return this._withAnother(AuxRandom)(f);
    };

    RNG.prototype.withClone = function(f) {
      return this._withAnother(Random.clone())(f);
    };

    RNG.prototype._withAnother = function(rng) {
      return (function(_this) {
        return function(f) {
          var prevRNG, result;
          prevRNG = _this._currentRNG;
          _this._currentRNG = rng;
          result = (function() {
            try {
              return f();
            } finally {
              this._currentRNG = prevRNG;
            }
          }).call(_this);
          return result;
        };
      })(this);
    };

    return RNG;

  })();

}).call(this);

},{"../shim/auxrandom":"shim/auxrandom","../shim/random":"shim/random"}],"util/seq":[function(require,module,exports){
(function() {
  var Iterator, Seq, _;

  _ = require('lodash');

  Iterator = require('./iterator');

  module.exports = Seq = (function() {
    function Seq(_items) {
      this._items = _items;
    }

    Seq.prototype.size = function() {
      return this.toArray().length;
    };

    Seq.prototype.length = function() {
      return this.size();
    };

    Seq.prototype.isEmpty = function() {
      return this.size() === 0;
    };

    Seq.prototype.nonEmpty = function() {
      return this.size() !== 0;
    };

    Seq.prototype.contains = function(item) {
      return _(this.toArray()).contains(item);
    };

    Seq.prototype.exists = function(pred) {
      return _(this.toArray()).some(pred);
    };

    Seq.prototype.every = function(pred) {
      return _(this.toArray()).every(pred);
    };

    Seq.prototype.filter = function(pred) {
      return this._generateFrom(_(this.toArray()).filter(pred).value(), this);
    };

    Seq.prototype.find = function(pred) {
      return _(this.toArray()).find(pred);
    };

    Seq.prototype.forEach = function(f) {
      _(this.toArray()).forEach(f).value();
    };

    Seq.prototype.foldl = function(f, initial) {
      return _(this.toArray()).foldl(f, initial);
    };

    Seq.prototype.iterator = function() {
      return new Iterator(this._items);
    };

    Seq.prototype.toArray = function() {
      return this._items.slice(0);
    };

    Seq.prototype.toString = function() {
      return "Seq(" + (this.toArray().toString()) + ")";
    };

    Seq.prototype._generateFrom = function(newItems) {
      return new Seq(newItems);
    };

    return Seq;

  })();

}).call(this);

},{"./iterator":"util/iterator","lodash":"lodash"}],"util/shufflerator":[function(require,module,exports){
(function() {
  var Iterator, Shufflerator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Iterator = require('./iterator');

  module.exports = Shufflerator = (function(superClass) {
    extend(Shufflerator, superClass);

    Shufflerator.prototype._i = void 0;

    Shufflerator.prototype._nextOne = void 0;

    function Shufflerator(items, _itemIsValid, _nextInt) {
      this._itemIsValid = _itemIsValid;
      this._nextInt = _nextInt;
      Shufflerator.__super__.constructor.call(this, items);
      this._i = 0;
      this._nextOne = null;
      this._fetch();
    }

    Shufflerator.prototype.map = function(f) {
      var acc;
      acc = [];
      this.forEach(function(x) {
        return acc.push(f(x));
      });
      return acc;
    };

    Shufflerator.prototype.forEach = function(f) {
      var next;
      while (this._hasNext()) {
        next = this._next();
        if (this._itemIsValid(next)) {
          f(next);
        }
      }
    };

    Shufflerator.prototype.toArray = function() {
      var acc;
      acc = [];
      this.forEach(function(x) {
        return acc.push(x);
      });
      return acc;
    };

    Shufflerator.prototype._hasNext = function() {
      return this._i <= this._items.length;
    };

    Shufflerator.prototype._next = function() {
      var result;
      result = this._nextOne;
      this._fetch();
      return result;
    };


    /*
      I dislike this.  The fact that the items are prepolled annoys me.  But there are two problems with trying to "fix"
      that. First, fixing it involves changing JVM NetLogo/Headless.  To me, that requires a disproportionate amount of
      effort to do, relative to how likely--that is, not very likely--that this code is to be heavily worked on in the
      future.  The second problem is that it's not apparent to me how to you can make this code substantially cleaner
      without significantly hurting performance.  The very idea of a structure that statefully iterates a collection in
      a random order is difficult to put into clear computational terms.  When it needs to be done _efficiently_, that
      becomes even more of a problem.  As far as I can tell, the only efficient way to do it is like how we're doing it
      (one variable tracking the current index/offset, and an array where consumed items are thrown into the front).
      Whatever.  The whole point is that this code isn't really worth worrying myself over, since it's pretty stable.
      --JAB (7/25/14)
     */

    Shufflerator.prototype._fetch = function() {
      var randNum;
      if (this._hasNext()) {
        if (this._i < this._items.length - 1) {
          randNum = this._i + this._nextInt(this._items.length - this._i);
          this._nextOne = this._items[randNum];
          this._items[randNum] = this._items[this._i];
        } else {
          this._nextOne = this._items[this._i];
        }
        this._i++;
        if (!this._itemIsValid(this._nextOne)) {
          this._fetch();
        }
      } else {
        this._nextOne = null;
      }
    };

    return Shufflerator;

  })(Iterator);

}).call(this);

},{"./iterator":"util/iterator"}],"util/stablesort":[function(require,module,exports){
(function() {
  var _;

  _ = require('lodash');

  module.exports = function(arr) {
    return function(f) {
      var sortFunc;
      sortFunc = function(x, y) {
        var result;
        result = f(x[1], y[1]);
        if (result !== 0) {
          return result;
        } else if (x[0] < y[0]) {
          return -1;
        } else {
          return 1;
        }
      };
      return _(0).range(arr.length).zip(arr).value().sort(sortFunc).map(function(pair) {
        return pair[1];
      });
    };
  };

}).call(this);

},{"lodash":"lodash"}],"util/timer":[function(require,module,exports){
(function() {
  var Timer;

  module.exports = Timer = (function() {
    Timer.prototype._startTime = void 0;

    function Timer() {
      this.reset();
    }

    Timer.prototype.elapsed = function() {
      return (Date.now() - this._startTime) / 1000;
    };

    Timer.prototype.reset = function() {
      this._startTime = Date.now();
    };

    return Timer;

  })();

}).call(this);

},{}],"util/typechecker":[function(require,module,exports){

/*
This class should be favored over Lodash when you want quick typechecking that need not be thorough.
This was made specifically to compensate for the fact that Lodash's typechecking was swapped
into the sorting code and caused a 25% performance hit in BZ Benchmark. --JAB (4/30/14)
 */

(function() {
  var JSType;

  JSType = (function() {
    function JSType(_x) {
      this._x = _x;
    }

    JSType.prototype.isArray = function() {
      return Array.isArray(this._x);
    };

    JSType.prototype.isBoolean = function() {
      return typeof this._x === "boolean";
    };

    JSType.prototype.isFunction = function() {
      return typeof this._x === "function";
    };

    JSType.prototype.isNumber = function() {
      return typeof this._x === "number";
    };

    JSType.prototype.isObject = function() {
      return typeof this._x === "object";
    };

    JSType.prototype.isString = function() {
      return typeof this._x === "string";
    };

    return JSType;

  })();

  module.exports = function(x) {
    return new JSType(x);
  };

}).call(this);

},{}]},{},["bootstrap"]);
