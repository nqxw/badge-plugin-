// fakeBadges.js — client-side badge injector for Pyoncord / ShiggyCord / Bunny.
// writes to `flags` (not publicFlags) and `premium` — the fields the RN
// renderer actually reads on this build.

const FAKE_FLAGS =
    (1 << 0)  |  // Discord Staff
    (1 << 1)  |  // Partnered Server Owner
    (1 << 2)  |  // HypeSquad Events
    (1 << 3)  |  // Bug Hunter
    (1 << 9)  |  // Early Supporter
    (1 << 14) |  // Bug Hunter Gold
    (1 << 17) |  // Early Verified Bot Developer
    (1 << 22);   // Active Developer

const FAKE_PREMIUM = 2;   // 0=none, 1=classic, 2=nitro, 3=basic

// STRIP_REAL: clear the account's real flags before OR'ing fakes in, so you
// don't see your actual HypeSquad Balance badge mixed with the fakes.
// set to false if you want to keep your real badges AND add fakes.
const STRIP_REAL = true;

let _originalGetCurrentUser = null;
let _originalGetUser = null;
let _UserStoreProto = null;

function fakeUser(u) {
    if (!u) return u;
    const base = STRIP_REAL ? 0 : (u.flags || 0);
    return Object.assign({}, u, {
        flags:       base | FAKE_FLAGS,
        publicFlags: base | FAKE_FLAGS,   // belt + suspenders — some paths read either
        premium:     FAKE_PREMIUM,
        premiumType: FAKE_PREMIUM,
    });
}

module.exports = {
    name: "FakeBadges",
    description: "Client-side fake badges on your own profile",
    authors: [{ name: "sy" }],

    start() {
        const m = window.vendetta && window.vendetta.metro;
        if (!m) { console.error("[FakeBadges] no vendetta.metro — aborting"); return; }

        const UserStore = m.findByStoreName("UserStore") || m.findByProps("getCurrentUser");
        if (!UserStore) { console.error("[FakeBadges] UserStore not found"); return; }

        _UserStoreProto = Object.getPrototypeOf(UserStore);
        if (!_UserStoreProto) { console.error("[FakeBadges] no prototype on UserStore"); return; }

        // hook getCurrentUser — your own profile
        if (typeof _UserStoreProto.getCurrentUser === "function") {
            _originalGetCurrentUser = _UserStoreProto.getCurrentUser;
            _UserStoreProto.getCurrentUser = function () {
                return fakeUser(_originalGetCurrentUser.apply(this, arguments));
            };
            console.log("[FakeBadges] hooked getCurrentUser");
        }

        // hook getUser — optional, other users' cards
        const ENABLE_FOR_OTHERS = false;
        if (ENABLE_FOR_OTHERS && typeof _UserStoreProto.getUser === "function") {
            _originalGetUser = _UserStoreProto.getUser;
            _UserStoreProto.getUser = function () {
                return fakeUser(_originalGetUser.apply(this, arguments));
            };
            console.log("[FakeBadges] hooked getUser (all users)");
        }

        console.log("[FakeBadges] active — flags=" + FAKE_FLAGS + " premium=" + FAKE_PREMIUM);
    },

    stop() {
        if (_UserStoreProto && _originalGetCurrentUser) {
            _UserStoreProto.getCurrentUser = _originalGetCurrentUser;
        }
        if (_UserStoreProto && _originalGetUser) {
            _UserStoreProto.getUser = _originalGetUser;
        }
        _originalGetCurrentUser = null;
        _originalGetUser = null;
        _UserStoreProto = null;
        console.log("[FakeBadges] unloaded");
    },
};
