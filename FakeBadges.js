(function (h, B, y, f, e, E, V, C) {
  "use strict";

  // ── badge set — hash → CDN asset ──
  const CDN = "https://cdn.discordapp.com/badge-icons/";
  const BADGES = [
    { key: "staff",      setting: "showStaff",      hash: "5e74e9b61934fc1f67c65515d1f7e60d", label: "Discord Staff" },
    { key: "partner",    setting: "showPartner",    hash: "3f9748e53446a137a052f3454e2de41e", label: "Partnered Server Owner" },
    { key: "hsevents",   setting: "showHSEvents",   hash: "bf01d1073931f921909045f3a39fd264", label: "HypeSquad Events" },
    { key: "bughunter",  setting: "showBugHunter",  hash: "2717692c7dca7289b35297368a940dd0", label: "Bug Hunter" },
    { key: "bravery",    setting: "showBravery",    hash: "8a88d63823d8a71cd5e390baa45efa02", label: "HypeSquad Bravery" },
    { key: "brilliance", setting: "showBrilliance", hash: "011940fd013da3f7fb926e4a1cd2e618", label: "HypeSquad Brilliance" },
    { key: "balance",    setting: "showBalance",    hash: "3aa41de486fa12454c3761e8e223442e", label: "HypeSquad Balance" },
    { key: "early",      setting: "showEarly",      hash: "7060786766c9c840eb3019e725d2b358", label: "Early Supporter" },
    { key: "buggold",    setting: "showBugGold",    hash: "848f79194d4be5ff5f81505cbd0ce1e6", label: "Bug Hunter Gold" },
    { key: "evbot",      setting: "showEVBot",      hash: "6df5892e0f35b051f8b61eace34f4967", label: "Early Verified Bot Developer" },
    { key: "modalumni",  setting: "showModAlumni",  hash: "fee1624003e2fee35cb398e125dc479b", label: "Moderator Programs Alumni" },
    { key: "actdev",     setting: "showActDev",     hash: "6bdc42827a38498929a4920da12695d9", label: "Active Developer" },
  ];

  const registry = {};                              // id → {id, source, label}
  const R = window.bunny.api.react.jsx;
  const useBadges = B.findByName("useBadges", false);
  let patchReturn;

  const { ScrollView } = f.General;
  const { FormRow, FormSection, FormSwitchRow } = f.Forms;

  function Settings() {
    E.useProxy(e.storage);
    const set = (k, v) => { e.storage[k] = v; };
    return React.createElement(ScrollView, null,
      React.createElement(FormSection, { title: "Fake Badges" },
        ...BADGES.map(b =>
          React.createElement(FormSwitchRow, {
            key: b.key,
            label: b.label,
            value: !!e.storage[b.setting],
            onValueChange: v => set(b.setting, v),
          })
        )
      ),
      React.createElement(FormSection, { title: "Scope" },
        React.createElement(FormSwitchRow, {
          label: "Only on my own profile",
          value: e.storage.onlyMe !== false,
          onValueChange: v => set("onlyMe", v),
        })
      )
    );
  }

  var k = {
    onLoad: function () {
      // defaults
      e.storage.onlyMe ??= true;
      for (const b of BADGES) e.storage[b.setting] ??= true;

      // JSX injectors — give each fake id its icon + tooltip
      R.onJsxCreate("ProfileBadge", function (_, a) {
        if (a.props.id?.startsWith("fbd-")) {
          const s = registry[a.props.id];
          if (s) {
            a.props.source = s.source;
            a.props.label = s.label;
            a.props.id = s.id;
          }
        }
      });
      R.onJsxCreate("RenderBadge", function (_, a) {
        if (a.props.id?.startsWith("fbd-")) {
          const s = registry[a.props.id];
          if (s) Object.assign(a.props, s);
        }
      });

      // hook useBadges — append fake entries to the array it returns
      patchReturn = y.after("default", useBadges, function ([props], badges) {
        if (!props || !badges) return;
        const userId = props.userId;
        if (!userId) return;

        if (e.storage.onlyMe !== false) {
          let me = null;
          try {
            const US = B.findByProps("getUsers", "getCurrentUser");
            me = US && US.getCurrentUser();
          } catch (err) { return; }
          if (!me || me.id !== userId) return;
        }

        BADGES.forEach(function (b, i) {
          if (!e.storage[b.setting]) return;
          const id = "fbd-" + b.key + "-" + i;
          registry[id] = {
            id: id,
            source: { uri: CDN + b.hash + ".png" },
            label: b.label,
            userId: userId,
          };
          badges.push({ id: id, description: b.label, icon: "dummy" });
        });
      });
    },

    onUnload: function () {
      try { patchReturn?.(); } catch (e) {}
    },

    settings: Settings,
  };

  return h.default = k,
         Object.defineProperty(h, "__esModule", { value: !0 }),
         h;
})({}, vendetta.metro, vendetta.patcher, vendetta.ui.components,
     vendetta.plugin, vendetta.storage, vendetta.ui.assets,
     vendetta.metro.common);
