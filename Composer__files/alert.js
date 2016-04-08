(function() {
  window.NLWAlerter = (function() {
    function NLWAlerter(alertFrame, isStandalone) {
      this.isStandalone = isStandalone;
      this.alertWindow = $(alertFrame);
      this.alertContainer = $(alertFrame).find("#alert-dialog").get(0);
    }

    NLWAlerter.prototype.display = function(title, dismissable, content) {
      this.alertWindow.find("#alert-title").text(title);
      this.alertWindow.find("#alert-message").html(content);
      if (this.isStandalone) {
        $(".standalone-text").show();
      }
      if (!dismissable) {
        this.alertWindow.find("#alert-dismiss-container").hide();
      } else {
        this.alertWindow.find("#alert-dismiss-container").show();
      }
      return this.alertWindow.show();
    };

    NLWAlerter.prototype.displayError = function(content, dismissable, title) {
      if (dismissable == null) {
        dismissable = true;
      }
      if (title == null) {
        title = "Error";
      }
      return this.display(title, dismissable, content);
    };

    NLWAlerter.prototype.hide = function() {
      return this.alertWindow.hide();
    };

    return NLWAlerter;

  })();

}).call(this);

//# sourceMappingURL=alert.js.map
