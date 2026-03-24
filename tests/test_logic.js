var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var { overlaps, getLevel, getSpawnRate, getBaseSpeed, clampX, pickType } = require("../app/static/logic");

// ---- Collision detection ----

describe("overlaps", function () {
    it("returns true when rectangles overlap", function () {
        var a = { x: 0, y: 0, w: 10, h: 10 };
        var b = { x: 5, y: 5, w: 10, h: 10 };
        assert.equal(overlaps(a, b), true);
    });

    it("returns false when rectangles are apart", function () {
        var a = { x: 0, y: 0, w: 10, h: 10 };
        var b = { x: 20, y: 20, w: 10, h: 10 };
        assert.equal(overlaps(a, b), false);
    });

    it("returns false when edges touch exactly", function () {
        var a = { x: 0, y: 0, w: 10, h: 10 };
        var b = { x: 10, y: 0, w: 10, h: 10 };
        assert.equal(overlaps(a, b), false);
    });

    it("detects a rectangle inside another", function () {
        var outer = { x: 0, y: 0, w: 50, h: 50 };
        var inner = { x: 10, y: 10, w: 5, h: 5 };
        assert.equal(overlaps(outer, inner), true);
    });

    it("works when only horizontal ranges overlap", function () {
        var a = { x: 0, y: 0, w: 10, h: 10 };
        var b = { x: 5, y: 20, w: 10, h: 10 };
        assert.equal(overlaps(a, b), false);
    });
});

// ---- Level progression ----

describe("getLevel", function () {
    it("starts at level 1 with zero score", function () {
        assert.equal(getLevel(0), 1);
    });

    it("stays at level 1 below 500", function () {
        assert.equal(getLevel(499), 1);
    });

    it("reaches level 2 at 500", function () {
        assert.equal(getLevel(500), 2);
    });

    it("keeps scaling", function () {
        assert.equal(getLevel(1500), 4);
        assert.equal(getLevel(3000), 7);
    });
});

// ---- Spawn rate ----

describe("getSpawnRate", function () {
    it("returns 51 at level 1", function () {
        assert.equal(getSpawnRate(1), 51);
    });

    it("gets faster at higher levels", function () {
        assert.ok(getSpawnRate(5) < getSpawnRate(1));
    });

    it("never drops below 22", function () {
        assert.equal(getSpawnRate(100), 22);
        assert.equal(getSpawnRate(9), 22);
    });
});

// ---- Base speed ----

describe("getBaseSpeed", function () {
    it("returns 2.4 at level 1", function () {
        assert.equal(getBaseSpeed(1), 2.4);
    });

    it("increases with level", function () {
        assert.ok(getBaseSpeed(3) > getBaseSpeed(1));
    });
});

// ---- Player clamping ----

describe("clampX", function () {
    it("clamps negative positions to 0", function () {
        assert.equal(clampX(-15, 60, 480), 0);
    });

    it("clamps past the right edge", function () {
        assert.equal(clampX(450, 60, 480), 420);
    });

    it("leaves valid positions unchanged", function () {
        assert.equal(clampX(200, 60, 480), 200);
    });

    it("handles position exactly at left edge", function () {
        assert.equal(clampX(0, 60, 480), 0);
    });

    it("handles position exactly at right edge", function () {
        assert.equal(clampX(420, 60, 480), 420);
    });
});

// ---- Item type selection ----

describe("pickType", function () {
    var types = [
        { type: "a", weight: 50 },
        { type: "b", weight: 30 },
        { type: "c", weight: 20 }
    ];

    it("picks the first item at roll 0", function () {
        assert.equal(pickType(types, 0).type, "a");
    });

    it("picks the last item near roll 1", function () {
        assert.equal(pickType(types, 0.99).type, "c");
    });

    it("respects weight boundaries", function () {
        // roll 0.5 → r = 50 → exactly exhausts a's weight → returns a
        assert.equal(pickType(types, 0.5).type, "a");
        // roll 0.51 → r = 51 → into b's range
        assert.equal(pickType(types, 0.51).type, "b");
    });

    it("handles single-item lists", function () {
        var solo = [{ type: "only", weight: 10 }];
        assert.equal(pickType(solo, 0.5).type, "only");
    });
});
