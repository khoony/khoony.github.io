(function() {
  window.RactiveButton = RactiveWidget.extend({
    data: function() {
      return {
        errorClass: void 0,
        ticksStarted: void 0
      };
    },
    oninit: function() {
      return this.on('activateButton', function(event, run) {
        return run();
      });
    },
    isolated: true,
    template: "{{# widget.forever }}\n  {{>foreverButton}}\n{{ else }}\n  {{>standardButton}}\n{{/}}\n<div id=\"{{id}}-context-menu\" class=\"netlogo-widget-editor-menu-items\">\n  <ul class=\"context-menu-list\">\n    <li class=\"context-menu-item\" on-click=\"deleteWidget:{{id}},{{id + '-context-menu'}},{{widget.id}}\">Delete</li>\n  </ul>\n</div>",
    partials: {
      standardButton: "<button id=\"{{id}}\"\n        on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n        class=\"netlogo-widget netlogo-button netlogo-command {{# !ticksStarted && widget.disableUntilTicksStart }}netlogo-disabled{{/}} {{errorClass}}\"\n        type=\"button\"\n        style=\"{{dims}}\"\n        on-click=\"activateButton:{{widget.run}}\"\n        disabled={{ !ticksStarted && widget.disableUntilTicksStart }}>\n  {{>buttonContext}}\n  <span class=\"netlogo-label\">{{widget.display || widget.source}}</span>\n  {{# widget.actionKey }}\n  <span class=\"netlogo-action-key {{# widget.hasFocus }}netlogo-focus{{/}}\">\n    {{widget.actionKey}}\n  </span>\n  {{/}}\n</button>",
      foreverButton: "<label id=\"{{id}}\"\n       on-contextmenu=\"showContextMenu:{{id + '-context-menu'}}\"\n       class=\"netlogo-widget netlogo-button netlogo-forever-button {{#widget.running}}netlogo-active{{/}} netlogo-command {{# !ticksStarted && widget.disableUntilTicksStart }}netlogo-disabled{{/}} {{errorClass}}\"\n       style=\"{{dims}}\">\n  {{>buttonContext}}\n  <input type=\"checkbox\" checked={{ widget.running }} {{# !ticksStarted && widget.disableUntilTicksStart }}disabled{{/}}/>\n  <span class=\"netlogo-label\">{{widget.display || widget.source}}</span>\n  {{# widget.actionKey }}\n  <span class=\"netlogo-action-key {{# widget.hasFocus }}netlogo-focus{{/}}\">\n    {{widget.actionKey}}\n  </span>\n  {{/}}\n  <div class=\"netlogo-forever-icon\"></div>\n</label>",
      buttonContext: "<div class=\"netlogo-button-agent-context\">\n{{#if buttonType === \"TURTLE\" }}\n  T\n{{elseif buttonType === \"PATCH\" }}\n  P\n{{elseif buttonType === \"LINK\" }}\n  L\n{{/if}}\n</div>"
    }
  });

}).call(this);

//# sourceMappingURL=button.js.map
