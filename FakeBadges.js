// fakeBadges.js — Vendetta-compatible badge injector for Pyoncord / ShiggyCord / Bunny
// hooks UserStore.prototype.getCurrentUser to return a clone with fake publicFlags
// and premiumType. every render path that draws your badges routes through this.

const FAKE_FLAGS =
    (1 << 0)  |  // Discord Staff
    (1 << 1)  |  // Partnered Server Owner
    (1 << 2)  |  // HypeSquad Events
    (1 << 3)  |  // Bug Hunter
    (1 << 9)  |  // Early Supporter
    (1 << 14) |  // Bug Hunter Gold
    (1 << 17) |  // Early Verified Bot Developer
    (1 << 22);   // Active Developer

const FAKE_PREMIUM_TYPE = 2;   // 0=none, 1=classic, 2=nitro, 3=basic

let _originalGetCurrentUser = null;
let _originalGetUser = null;
let _UserStoreProto = null;

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

        // ── hook getCurrentUser (your own profile) ──
        if (typeof _UserStoreProto.getCurrentUser === "function") {
            _originalGetCurrentUser = _UserStoreProto.getCurrentUser;
            _UserStoreProto.getCurrentUser = function () {
                const u = _originalGetCurrentUser.apply(this, arguments);
                if (!u) return u;
                return Object.assign({}, u, {
                    publicFlags: (u.publicFlags || 0) | FAKE_FLAGS,
                    premiumType: FAKE_PREMIUM_TYPE,
                });
            };
            console.log("[FakeBadges] hooked getCurrentUser");
        } else {
            console.warn("[FakeBadges] getCurrentUser not on prototype");
        }

        // ── hook getUser (other users' cards — optional, keeps your own identity sane) ──
        // leave this disabled by default so it only fakes on YOUR profile.
        // flip ENABLE_FOR_OTHERS to true if you want badges on every user card.
        const ENABLE_FOR_OTHERS = false;
        if (ENABLE_FOR_OTHERS && typeof _UserStoreProto.getUser === "function") {
            _originalGetUser = _UserStoreProto.getUser;
            _UserStoreProto.getUser = function (userId) {
                const u = _originalGetUser.apply(this, arguments);
                if (!u) return u;
                return Object.assign({}, u, {
                    publicFlags: (u.publicFlags || 0) | FAKE_FLAGS,
                    premiumType: FAKE_PREMIUM_TYPE,
                });
            };
            console.log("[FakeBadges] hooked getUser (all users)");
        }

        console.log("[FakeBadges] active — open your profile to see badges");
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