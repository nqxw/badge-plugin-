// fakeBadges.js — client-side badge injector for Pyoncord / Bunny / Kettu forks.
// uses onLoad/onUnload (Pyoncord contract), writes `flags` + `premium`.

const FAKE_FLAGS =
    (1 << 0)  |  // Discord Staff
    (1 << 1)  |  // Partnered Server Owner
    (1 << 2)  |  // HypeSquad Events
    (1 << 3)  |  // Bug Hunter
    (1 << 9)  |  // Early Supporter
    (1 << 14) |  // Bug Hunter Gold
    (1 << 17) |  // Early Verified Bot Developer
    (1 << 22);   // Active Developer

const FAKE_PREMIUM = 2;
const STRIP_REAL = true;

let _originalGetCurrentUser = null;
let _originalGetUser = null;
let _UserStoreProto = null;

function fakeUser(u) {
    if (!u) return u;
    const base = STRIP_REAL ? 0 : (u.flags || 0);
    return Object.assign({}, u, {
        flags:       base | FAKE_FLAGS,
        publicFlags: base | FAKE_FLAGS,
        premium:     FAKE_PREMIUM,
        premiumType: FAKE_PREMIUM,
    });
}

module.exports = {
    name: "FakeBadges",
    description: "Client-side fake badges on your own profile",
    authors: [{ name: "sy" }],

    onLoad() {
        console.log("[FakeBadges] onLoad fired");
        const m = window.vendetta && window.vendetta.metro;
        if (!m) { console.error("[FakeBadges] no vendetta.metro"); return; }

        const UserStore = m.findByStoreName("UserStore") || m.findByProps("getCurrentUser");
        if (!UserStore) { console.error("[FakeBadges] UserStore not found"); return; }

        _UserStoreProto = Object.getPrototypeOf(UserStore);
        if (!_UserStoreProto) { console.error("[FakeBadges] no prototype"); return; }

        if (typeof _UserStoreProto.getCurrentUser === "function") {
            _originalGetCurrentUser = _UserStoreProto.getCurrentUser;
            _UserStoreProto.getCurrentUser = function () {
                return fakeUser(_originalGetCurrentUser.apply(this, arguments));
            };
            console.log("[FakeBadges] hooked getCurrentUser");
        }

        const ENABLE_FOR_OTHERS = false;
        if (ENABLE_FOR_OTHERS && typeof _UserStoreProto.getUser === "function") {
            _originalGetUser = _UserStoreProto.getUser;
            _UserStoreProto.getUser = function () {
                return fakeUser(_originalGetUser.apply(this, arguments));
            };
            console.log("[FakeBadges] hooked getUser");
        }

        console.log("[FakeBadges] active — flags=" + FAKE_FLAGS);
    },

    onUnload() {
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
