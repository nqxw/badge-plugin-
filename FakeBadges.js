// fakeBadges.js — client-side badge injector for Pyoncord / Bunny / Kettu forks.
// finds the real UserStore by matching on getUsers + getCurrentUser (both),
// which only the store has — the connection helper also has getCurrentUser
// but not getUsers.

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

function findRealUserStore(m) {
    // try the tightest matcher first — getUsers + getCurrentUser only
    // exists on the real store, never on the connection helper.
    let candidate = null;
    if (m.findByProps) {
        candidate = m.findByProps("getUsers", "getCurrentUser");
    }
    // fall back to store name
    if (!candidate && m.findByStoreName) {
        candidate = m.findByStoreName("UserStore");
    }
    // fall back to the wide matcher — last resort
    if (!candidate && m.findByProps) {
        candidate = m.findByProps("getCurrentUser");
    }
    return candidate;
}

module.exports = {
    name: "FakeBadges",
    description: "Client-side fake badges on your own profile",
    authors: [{ name: "sy" }],

    onLoad() {
        console.log("[FakeBadges] onLoad fired");
        const m = window.vendetta && window.vendetta.metro;
        if (!m) { console.error("[FakeBadges] no vendetta.metro"); return; }

        const UserStore = findRealUserStore(m);
        if (!UserStore) { console.error("[FakeBadges] UserStore not found"); return; }

        // prove which holder we got — should have getUsers AND getCurrentUser
        console.log("[FakeBadges] UserStore has getUsers=" +
            (typeof UserStore.getUsers === "function") +
            " getCurrentUser=" + (typeof UserStore.getCurrentUser === "function"));

        _UserStoreProto = Object.getPrototypeOf(UserStore);
        if (!_UserStoreProto) { console.error("[FakeBadges] no prototype"); return; }

        // instance method?
        if (typeof UserStore.getCurrentUser === "function") {
            _originalGetCurrentUser = UserStore.getCurrentUser;
            UserStore.getCurrentUser = function () {
                return fakeUser(_originalGetCurrentUser.apply(this, arguments));
            };
            console.log("[FakeBadges] hooked instance getCurrentUser");
        }
        // prototype method?
        else if (typeof _UserStoreProto.getCurrentUser === "function") {
            _originalGetCurrentUser = _UserStoreProto.getCurrentUser;
            _UserStoreProto.getCurrentUser = function () {
                return fakeUser(_originalGetCurrentUser.apply(this, arguments));
            };
            console.log("[FakeBadges] hooked prototype getCurrentUser");
        } else {
            console.error("[FakeBadges] getCurrentUser nowhere — aborting");
            return;
        }

        // optional: hook getUser for other users too
        const ENABLE_FOR_OTHERS = false;
        if (ENABLE_FOR_OTHERS) {
            const getter = UserStore.getUser || _UserStoreProto.getUser;
            if (typeof getter === "function") {
                _originalGetUser = getter;
                if (UserStore.getUser) {
                    UserStore.getUser = function () {
                        return fakeUser(_originalGetUser.apply(this, arguments));
                    };
                } else {
                    _UserStoreProto.getUser = function () {
                        return fakeUser(_originalGetUser.apply(this, arguments));
                    };
                }
                console.log("[FakeBadges] hooked getUser");
            }
        }

        console.log("[FakeBadges] active — flags=" + FAKE_FLAGS + " premium=" + FAKE_PREMIUM);
    },

    onUnload() {
        try {
            const m = window.vendetta.metro;
            const UserStore = findRealUserStore(m);
            if (UserStore && typeof UserStore.getCurrentUser === "function" && _originalGetCurrentUser) {
                UserStore.getCurrentUser = _originalGetCurrentUser;
            }
            if (_UserStoreProto && _originalGetCurrentUser) {
                _UserStoreProto.getCurrentUser = _originalGetCurrentUser;
            }
        } catch (e) {}
        _originalGetCurrentUser = null;
        _originalGetUser = null;
        _UserStoreProto = null;
        console.log("[FakeBadges] unloaded");
    },
};
