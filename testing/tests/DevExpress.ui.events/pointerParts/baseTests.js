"use strict";

var $ = require("jquery"),
    BaseStrategy = require("events/pointer/base"),
    registerEvent = require("events/core/event_registrator"),
    $eventSpecial = $.event.special;


var TestEventMap = {
    "dxpointerdown": "testdown",
    "dxpointermove": "testmove",
    "dxpointerup": "testup",
    "dxpointercancel": "testcancel"
};


QUnit.module("base events", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();

        $.each(TestEventMap, function(pointerEvent, originalEvents) {
            if($eventSpecial[pointerEvent]) {
                $eventSpecial[pointerEvent].dispose();
            }
            registerEvent(pointerEvent, new BaseStrategy(pointerEvent, originalEvents));
        });
    },

    afterEach: function() {
        this.clock.restore();
    }
});

$.each({
    "dxpointerdown": [0, 1, 1, 1],
    "dxpointermove": [0, 0, 1, 1],
    "dxpointerup": [0, 0, 0, 1]
}, function(eventName, assertions) {
    QUnit.test("'" + eventName + "' event triggers", function(assert) {
        var triggered = 0;

        var $element = $("#element");
        $element.on(eventName, function(e) {
            triggered++;
            assert.strictEqual(e.target, $element[0]);
        });

        assert.equal(triggered, assertions[0]);

        $element.trigger("testdown");
        assert.equal(triggered, assertions[1]);

        $element.trigger("testmove");
        assert.equal(triggered, assertions[2]);

        $element.trigger("testup");
        assert.equal(triggered, assertions[3]);
    });
});

QUnit.test("event trigger order", function(assert) {
    var LOG = [],
        log = function(e) {
            LOG.push(e.type);
        };

    var $element = $("#element");
    $element
        .on("testdown testup", log)
        .on("dxpointerdown dxpointerup", log)
        .on("testdown testup", log);

    $element
        .trigger("testdown")
        .trigger("testup");

    assert.deepEqual(LOG, [
        "testdown",
        "testdown",
        "dxpointerdown",
        "testup",
        "testup",
        "dxpointerup"
    ]);
});

QUnit.test("pointer events should unsubscribe on .off method", function(assert) {
    var $element = $("#element"),
        getEvents = function() {
            return $.map($._data($element.get(0), "events") || [], function(i) { return i; });
        };

    assert.equal(getEvents().length, 0);

    $element
        .on("dxpointerdown dxpointermove dxpointerup", $.noop)
        .off("dxpointerdown dxpointermove dxpointerup");

    assert.equal(getEvents().length, 0);
});

QUnit.test("one pointer event should not unsubscribe another events", function(assert) {
    assert.expect(1);

    var $element = $("#element");

    $element
        .on("dxpointerdown dxpointerup", function(e) {
            assert.equal(e.type, "dxpointerup");
        })
        .off("dxpointerdown");

    $element.trigger("dxpointerdown");
    $element.trigger("dxpointerup");
});

QUnit.test("empty original event should not unsubscribe the whole namespace", function(assert) {
    assert.expect(1);

    var element = document.getElementById("element"),
        $element = $(element);

    $element.on("any.dxPointerEvents", $.noop);
    var events = $.extend({}, $._data(element).events);

    var strategy = new BaseStrategy("other", "");
    strategy.noBubble = true;
    strategy.teardown($element);

    assert.deepEqual($._data(element).events, events, "handlers for '.dxPointerEvents' remain");
});

QUnit.test("event is triggered one time after refresh", function(assert) {
    assert.expect(1);

    var $element = $("#element");

    $element
        .on("dxpointerdown", function(e) {
            assert.ok(true);
        })
        .off("dxpointerdown")
        .on("dxpointerdown", function(e) {
            assert.ok(true);
        });

    $element.trigger("dxpointerdown");
});

QUnit.test("pointer event base strategy should have 'setup' implementation, because jQuery adds a browser event via addEventListener/attachEvent otherwise (T208653)", function(assert) {
    assert.ok($.isFunction((new BaseStrategy("", "")).setup));
});
