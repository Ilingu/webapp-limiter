import type { StorageShape, WebsiteLimiterShape } from "./lib/types";
import { IsIdle, SetStorage } from "./lib/utils";

const LogExtension = () => {
  console.log(
    "%cWebapp Limiter ⏱️ (BETA.3.2)",
    `
			text-transform: uppercase;
			background: #000;
			color: #FFF;
			font-weight: bold;
			font-size: 1.70rem;
			padding: 5px 20px;
			text-shadow: -1px -1px 0 rgba(251, 1, 252, 0.5),
									1px 1px 0 rgba(4, 251, 246, 0.5);`
  );
};

window.onload = () => {
  LogExtension();

  hostUrl = window.location.host;
  chrome.storage.sync.get("storage", ({ storage: initialStorage }) => {
    Storage = initialStorage;
    LauchProcess();
    if (!CurrentApp || !CurrentApp?.enable) return;
    /* Is User Idle Listener */
    IsIdle({
      idleTimeout: 60_000,
      onActive: () => {
        isIdle = false;
        if (!CurrentApp || !CurrentApp?.enable) return;
        if (!ResetInterval) LauchProcess();
      },
      onIdle: () => {
        isIdle = true;
        StopSession();
      },
    });
  });

  /* Storage Change Listener */
  chrome.storage.onChanged.addListener((changes) => {
    for (let [key, { newValue }] of Object.entries(changes))
      if (key === "storage") Storage = newValue;
    if (!ResetInterval && !isIdle) LauchProcess();
  });
};

let hostUrl: string;
let Storage: StorageShape = {};
let CurrentApp: WebsiteLimiterShape;
let ResetInterval: number;
let isIdle = false;

/* SESSION */
const LauchProcess = () => {
  console.log("[LOG] [Webapp Limiter] Launching App...");
  // Init
  CurrentApp = Storage[hostUrl];
  if (!CurrentApp || !CurrentApp?.enable || isIdle) return;
  // Check Block Page
  if (
    CurrentApp?.LastSession &&
    !IsSessionExpired(CurrentApp.LastSession) &&
    CurrentApp.ElapsedTime >= CurrentApp.MAX_TIME
  )
    return BlockWebSite();

  if (CurrentApp?.LastSession && IsSessionExpired(CurrentApp.LastSession))
    CurrentApp.ElapsedTime = 0;
  CurrentApp.LastSession = Date.now();

  SetStorage(Storage);
  ResetInterval = setInterval(IncrementSessionTime, 60_000); // start 1min timer loop

  // On Quit
  window.addEventListener("beforeunload", StopSession);
};

const IncrementSessionTime = () => {
  CurrentApp = Storage[hostUrl];
  if (!CurrentApp || !CurrentApp?.enable || isIdle) return StopSession();

  CurrentApp.ElapsedTime++;
  if (CurrentApp.ElapsedTime === CurrentApp.MAX_TIME) {
    BlockWebSite();
    StopSession();
  }

  SetStorage(Storage);
  console.log("[LOG] [Webapp Limiter] SET!", { CurrentApp });
};

const StopSession = () => {
  console.log("[LOG] [Webapp Limiter] Session Stopped!");
  clearInterval(ResetInterval);
  ResetInterval = null;
};

const BlockWebSite = () => {
  console.log("[LOG] [Webapp Limiter] Blocking Website");
  document.body.innerHTML = `<div style="text-align: center">
            <h1>Time Elapsed! Website locked for today 🔒</h1>
            <h2>❌ Come back tomorrow</h2>
            <h3>This message have been displayed by "Webapp limiter" extension</h3>
      </div>`;
};

// HELPERS
const IsSessionExpired = (LastSession: number): boolean => {
  const tomorrow = new Date(LastSession);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return Date.now() >= tomorrow.getTime();
};
