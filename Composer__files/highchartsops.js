(function() {
  var PenBundle, PlotOps,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PenBundle = tortoise_require('engine/plot/pen');

  PlotOps = tortoise_require('engine/plot/plotops');

  window.HighchartsOps = (function(_super) {
    __extends(HighchartsOps, _super);

    HighchartsOps.prototype._chart = void 0;

    HighchartsOps.prototype._penNameToSeriesNum = void 0;

    function HighchartsOps(elemID) {
      var addPoint, registerPen, reset, resetPen, resize, updatePenColor, updatePenMode;
      resize = function(xMin, xMax, yMin, yMax) {
        this._chart.xAxis[0].setExtremes(xMin, xMax);
        this._chart.yAxis[0].setExtremes(yMin, yMax);
      };
      reset = function(plot) {
        this._chart.destroy();
        this._chart = new Highcharts.Chart({
          chart: {
            animation: false,
            renderTo: elemID,
            spacingBottom: 10,
            spacingLeft: 15,
            spacingRight: 15,
            zoomType: "xy"
          },
          credits: {
            enabled: false
          },
          legend: {
            enabled: plot.isLegendEnabled,
            margin: 5
          },
          series: [],
          title: {
            text: plot.name
          },
          tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>'
          },
          xAxis: {
            title: {
              text: plot.xLabel
            }
          },
          yAxis: {
            title: {
              text: plot.yLabel,
              x: -7
            },
            labels: {
              padding: 0,
              x: -15
            }
          },
          plotOptions: {
            series: {
              turboThreshold: 1
            }
          }
        });
        this._penNameToSeriesNum = {};
      };
      registerPen = function(pen) {
        var mode, num;
        num = this._chart.series.length;
        mode = this.modeToString(pen.getDisplayMode());
        this._chart.addSeries({
          color: this.colorToRGBString(pen.getColor()),
          data: [],
          dataLabels: {
            enabled: false
          },
          marker: {
            enabled: mode === 'scatter'
          },
          name: pen.name,
          type: mode
        });
        this._penNameToSeriesNum[pen.name] = num;
      };
      resetPen = (function(_this) {
        return function(pen) {
          return function() {
            var _ref;
            if ((_ref = _this.penToSeries(pen)) != null) {
              _ref.setData([]);
            }
          };
        };
      })(this);
      addPoint = (function(_this) {
        return function(pen) {
          return function(x, y) {
            _this.penToSeries(pen).addPoint([x, y], false);
          };
        };
      })(this);
      updatePenMode = (function(_this) {
        return function(pen) {
          return function(mode) {
            var type, _ref;
            type = _this.modeToString(mode);
            if ((_ref = _this.penToSeries(pen)) != null) {
              _ref.update({
                type: type
              });
            }
          };
        };
      })(this);
      updatePenColor = (function(_this) {
        return function(pen) {
          return function(color) {
            var hcColor, series;
            hcColor = _this.colorToRGBString(color);
            series = _this.penToSeries(pen);
            series.options.color = hcColor;
            series.update(series.options);
          };
        };
      })(this);
      HighchartsOps.__super__.constructor.call(this, resize, reset, registerPen, resetPen, addPoint, updatePenMode, updatePenColor);
      this._chart = Highcharts.chart(elemID, {});
      this._penNameToSeriesNum = {};
    }

    HighchartsOps.prototype.modeToString = function(mode) {
      var Bar, Line, Point, _ref;
      _ref = PenBundle.DisplayMode, Bar = _ref.Bar, Line = _ref.Line, Point = _ref.Point;
      switch (mode) {
        case Bar:
          return 'bar';
        case Line:
          return 'line';
        case Point:
          return 'scatter';
        default:
          return 'line';
      }
    };

    HighchartsOps.prototype.penToSeries = function(pen) {
      return this._chart.series[this._penNameToSeriesNum[pen.name]];
    };

    HighchartsOps.prototype.redraw = function() {
      return this._chart.redraw();
    };

    return HighchartsOps;

  })(PlotOps);

}).call(this);

//# sourceMappingURL=highchartsops.js.map
