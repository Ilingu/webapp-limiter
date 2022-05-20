import App from "./components/App.svelte";
import type { StorageShape } from "./lib/types";

const LauchApp = () => {
  chrome.storage.sync.get("storage", (storage: StorageShape) => {
    new App({
      target: document.querySelector("#root"),
      props: storage,
    });
  });
};

document.addEventListener("DOMContentLoaded", LauchApp);
