self.AelluxPWAConfig = {
  name: "browser-fixture", version: self.fixtureVersion || "1", offline: "./offline.html",
  cache: { precache: ["./offline.html"], navigation: "network-first", assets: "cache-first", paths: ["./assets/"] }
};
const networkFetch = self.fetch.bind(self);
let fixtureOffline = false;
self.fetch = (...args) => fixtureOffline ? Promise.reject(new TypeError("Fixture network unavailable")) : networkFetch(...args);
self.addEventListener("message", event => {
  if (event.data?.type === "FIXTURE_OFFLINE") {
    fixtureOffline = event.data.value;
    event.ports[0].postMessage("ready");
  }
});
importScripts("/dist/aellux.pwa.sw.js");
