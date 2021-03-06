"use strict";

var $ = require("jquery"),
    devices = require("../../core/devices"),
    inkRipple = require("../widget/utils.ink_ripple"),
    registerComponent = require("../../core/component_registrator"),
    Editor = require("../editor/editor"),
    eventUtils = require("../../events/utils"),
    themes = require("../themes"),
    clickEvent = require("../../events/click");

var RADIO_BUTTON_CLASS = "dx-radiobutton",
    RADIO_BUTTON_ICON_CLASS = "dx-radiobutton-icon",
    RADIO_BUTTON_ICON_DOT_CLASS = "dx-radiobutton-icon-dot",
    RADIO_BUTTON_CHECKED_CLASS = "dx-radiobutton-checked";

/**
* @name dxRadioButton
* @publicName dxRadioButton
* @inherits CollectionWidget
* @hidden
*/
var RadioButton = Editor.inherit({

    _supportedKeys: function() {
        var click = function(e) {
            e.preventDefault();
            this._clickAction({ jQueryEvent: e });
        };
        return $.extend(this.callBase(), {
            space: click
        });
    },

    _getDefaultOptions: function() {
        return $.extend(this.callBase(), {
            hoverStateEnabled: true,
            activeStateEnabled: true,
            value: false,
            useInkRipple: false
        });
    },

    _defaultOptionsRules: function() {
        return this.callBase().concat([
            {
                device: function() {
                    return devices.real().deviceType === "desktop" && !devices.isSimulator();
                },
                options: {
                    focusStateEnabled: true
                }
            },
            {
                device: function() {
                    return /android5/.test(themes.current());
                },
                options: {
                    useInkRipple: true
                }
            }
        ]);
    },

    _init: function() {
        this.callBase();

        this.element().addClass(RADIO_BUTTON_CLASS);
    },

    _render: function() {
        this.callBase();

        this._renderIcon();
        this.option("useInkRipple") && this._renderInkRipple();
        this._renderCheckedState(this.option("value"));
        this._renderClick();
        this.setAria("role", "radio");
    },

    _renderInkRipple: function() {
        this._inkRipple = inkRipple.render({
            waveSizeCoefficient: 3.3,
            useHoldAnimation: false,
            wavesNumber: 2,
            isCentered: true
        });
    },

    _renderInkWave: function(element, jQueryEvent, doRender, waveIndex) {
        if(!this._inkRipple) {
            return;
        }

        var config = {
            element: element,
            jQueryEvent: jQueryEvent,
            wave: waveIndex
        };

        if(doRender) {
            this._inkRipple.showWave(config);
        } else {
            this._inkRipple.hideWave(config);
        }
    },

    _updateFocusState: function(e, value) {
        this.callBase.apply(this, arguments);
        this._renderInkWave(this._$icon, e, value, 0);
    },

    _toggleActiveState: function($element, value, e) {
        this.callBase.apply(this, arguments);
        this._renderInkWave(this._$icon, e, value, 1);
    },

    _renderIcon: function() {
        this._$icon = $("<div>").addClass(RADIO_BUTTON_ICON_CLASS);

        $("<div>").addClass(RADIO_BUTTON_ICON_DOT_CLASS).appendTo(this._$icon);
        this.element().append(this._$icon);
    },

    _renderCheckedState: function(checked) {
        this.element().toggleClass(RADIO_BUTTON_CHECKED_CLASS, checked);
        this.setAria("checked", checked);
    },

    _renderClick: function() {
        var eventName = eventUtils.addNamespace(clickEvent.name, this.NAME);

        this._clickAction = this._createAction($.proxy(function(args) {
            this._clickHandler(args.jQueryEvent);
        }, this));

        this.element()
            .off(eventName)
            .on(eventName, $.proxy(function(e) {
                this._clickAction({ jQueryEvent: e });
            }, this));
    },

    _clickHandler: function(e) {
        this._saveValueChangeEvent(e);
        this.option("value", true);
    },

    _optionChanged: function(args) {
        switch(args.name) {
            case "useInkRipple":
                this._invalidate();
                break;
            case "value":
                this._renderCheckedState(args.value);
                this.callBase(args);
                break;
            default:
                this.callBase(args);
        }
    }
});

registerComponent("dxRadioButton", RadioButton);

module.exports = RadioButton;
