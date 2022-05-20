chrome.runtime.onInstalled.addListener(() => {
  LauchBgServer();
});

const LauchBgServer = () => {
  /* Storage Change Listener */
  chrome.storage.onChanged.addListener((changes, namescape) => {
    for (let [key, { newValue, oldValue }] of Object.entries(changes)) {
      if (key === "storage") {
        console.log("----------STORAGE CHANGE----------");
        console.log({ key, timestamp: Date.now() });
        console.log({ oldValue });
        console.log({ newValue });
        console.log({ namescape });
        console.log("----------------------------------");
      }
    }
  });
};
