import type { StorageShape, WebsiteLimiterShape } from "./lib/types";
import { SetStorage } from "./lib/utils";

window.onload = () => {
  console.log("Webapp Limiter -- Alpha Version");
  hostUrl = window.location.host;
  chrome.storage.sync.get("storage", ({ storage: initialStorage }) => {
    Storage = initialStorage;
    LauchProcess();
  });
  /* Storage Change Listener */
  chrome.storage.onChanged.addListener((changes, namescape) => {
    for (let [key, { newValue, oldValue }] of Object.entries(changes))
      if (key === "storage") Storage = newValue;
  });
};

let hostUrl: string;
let Storage: StorageShape = {};
let CurrentApp: WebsiteLimiterShape;

const LauchProcess = () => {
  const ValidSessionTime = (LastSession: number) => {
    const Now = Date.now();
    const tomorrow = new Date(LastSession);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (
      Now >= tomorrow.getTime() ||
      CurrentApp.ElapsedTime !== CurrentApp.MAX_TIME
    )
      return true;
    return false;
  };

  /* SESSION */
  let ResetInterval: number;
  const StartSession = () => {
    CurrentApp = Storage[hostUrl];
    if (!CurrentApp || !CurrentApp?.enable) return;
    if (CurrentApp?.LastSession && !ValidSessionTime(CurrentApp.LastSession))
      return BlockWebSite();

    CurrentApp.LastSession = Date.now();
    if (
      !CurrentApp?.ElapsedTime ||
      CurrentApp.ElapsedTime === CurrentApp.MAX_TIME
    )
      CurrentApp.ElapsedTime = 0;
    SetStorage(Storage);

    ResetInterval = setInterval(() => {
      CurrentApp = Storage[hostUrl];
      if (!CurrentApp || !CurrentApp?.enable) return StopSession();

      CurrentApp.ElapsedTime++;
      if (CurrentApp.ElapsedTime === CurrentApp.MAX_TIME) {
        BlockWebSite();
        StopSession();
      }

      SetStorage(Storage);
    }, 60_000);
  };

  const StopSession = () => {
    clearInterval(ResetInterval);
  };

  const BlockWebSite = () => {
    document.body.innerHTML = `<div style="text-align: center">
            <h1>Time Elapsed! Website locked for today 🔒</h1>
            <h2>❌ Come back tomorrow</h2>
            <h3>This message have been displayed by "Webapp limiter" extension</h3>
      </div>`;
  };

  // Start App
  StartSession();
};

// https://developer.chrome.com/docs/extensions/mv3/messaging/
/* Background

 const ValidSession = (token: string) => ActiveSession.includes(token);
  const ValidSessionTime = (LastSession: number) => {
    const Now = Date.now();
    const tomorrow = new Date(LastSession);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (Now >= tomorrow.getTime()) return true;
    return false;
  };

  chrome.storage.onChanged.addListener((changes, namescape) => {
    for (let [key, { newValue, oldValue }] of Object.entries(changes)) {
      if (key === "storage") {
        Storage = newValue;
        console.log("----------STORAGE CHANGE----------");
        console.log({ key, timestamp: Date.now() });
        console.log({ oldValue });
        console.log({ newValue });
        console.log({ namescape });
        console.log("----------------------------------");
      }
    }
  });

  chrome.runtime.onConnect.addListener((ReceivePort) => {
    console.assert(ReceivePort.name === "FrontBackMsgLine");
    console.log("Front->Back Connected");

    ReceivePort.onMessage.addListener(({ instruction, data }: MessageShape) => {
      console.log({ instruction, data });
      if (instruction === "start_session")
        StartSession(data["hostUrl"], data["SessionToken"]);
      if (instruction === "stop_session") StopSession(data["SessionToken"]);
    });

    const SessionToken = crypto.randomUUID();
    ActiveSession = [...ActiveSession, SessionToken];
    ReceivePort.postMessage({
      instruction: "connected",
      data: { SessionToken },
    } as MessageShape);

    ReceivePort.onDisconnect.addListener(() => {
      StopSession(SessionToken);
    });
  });

  let ActiveSession: string[] = [];
  let ResetInterval: { [Token: string]: number } = {};
  const StartSession = (hostUrl: string, SessionToken: string) => {
    let TimerStart = Date.now();

    CurrentApp = Storage[hostUrl];
    if (!CurrentApp || !CurrentApp?.enable || !ValidSession(SessionToken || ""))
      return;
    if (!ValidSessionTime(CurrentApp?.LastSession)) return;

    CurrentApp.LastSession = Date.now();
    SetStorage(Storage);
    ResetInterval[SessionToken] = setInterval(() => {
      CurrentApp = Storage[hostUrl];
      if (!CurrentApp || !CurrentApp?.enable) return StopSession(SessionToken);
    }, 60_000);

    console.log(ActiveSession);
  };

  const StopSession = (SessionToken: string) => {
    if (!ValidSession(SessionToken || "")) return;
    const IndexToDel = ActiveSession.indexOf(SessionToken);
    ActiveSession.splice(IndexToDel, 1);
    clearInterval(ResetInterval[SessionToken]);
  };
 */

/* content_scripts
let SendToBackPort = chrome.runtime.connect({ name: "FrontBackMsgLine" });
  let SessionToken: string;

  const LoadSession = () => {
    if (!SessionToken) return console.error("No SessionToken");
    SendToBackPort.postMessage({
      instruction: "start_session",
      data: { hostUrl: window.location.host, SessionToken },
    } as MessageShape);
  };
  const HaltSession = () => {
    SendToBackPort.postMessage({ instruction: "stop_session" } as MessageShape);
  };

  SendToBackPort.onMessage.addListener(
    ({ instruction, data }: MessageShape) => {
      console.log({ instruction, data });

      if (instruction === "connected") {
        console.log("Back->Front Connected");
        SessionToken = data?.SessionToken || null;
        LoadSession();
      }
    }
  );
  */
