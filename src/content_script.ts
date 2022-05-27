import type {
  StorageShape,
  WebsiteLimiterShape,
  BgCallPayload,
  BgResShape,
} from "./lib/types";
import { ConnInstruction } from "./lib/types";
import { SetStorage } from "./lib/utils";

window.onload = () => {
  console.log(
    "%cWebapp Limiter ⏱️ (BETA.2)",
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
  hostUrl = window.location.host;
  chrome.storage.sync.get("storage", ({ storage: initialStorage }) => {
    Storage = initialStorage;
    LaunchProcess();
  });
  /* Storage Change Listener */
  chrome.storage.onChanged.addListener((changes) => {
    for (let [key, { newValue }] of Object.entries(changes))
      if (key === "storage") Storage = newValue;
  });
};

let hostUrl: string;
let Storage: StorageShape = {};
let CurrentApp: WebsiteLimiterShape;

let ProcessPort: chrome.runtime.Port;
let SessionToken: string;

/* SESSION */
const LaunchProcess = () => {
  // Init
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

  /* Connection */
  if (!ProcessPort) MakeConn(); // Init Conn
  StartProcess();
  ProcessPort.onMessage.addListener(ListenWorker); // Listener

  // On Quit
  window.addEventListener("beforeunload", StopProcess);
};

const ListenWorker = (workerRes: BgResShape) => {
  if (!workerRes.WorkSucceed) return;
  if (workerRes.proof != SessionToken) return;

  // Handle Res
  if (workerRes.resType === ConnInstruction.REPORT) IncrementSessionTime();
};

const IncrementSessionTime = () => {
  CurrentApp = Storage[hostUrl];
  if (!CurrentApp || !CurrentApp?.enable) return StopProcess();
  CurrentApp.ElapsedTime++;
  if (CurrentApp.ElapsedTime === CurrentApp.MAX_TIME) {
    BlockWebSite();
    StopProcess();
  }
  SetStorage(Storage);

  console.log("[LOG] [Webapp Limiter] SET! ", { CurrentApp });
};

const StartProcess = () => {
  const StartPayload: BgCallPayload = {
    do: ConnInstruction.WORK,
    proof: SessionToken,
  };
  ProcessPort.postMessage(StartPayload);
};

const StopProcess = () => {
  if (!ProcessPort || !SessionToken) return;

  const StopPayload: BgCallPayload = {
    do: ConnInstruction.REST,
    proof: SessionToken,
  };
  ProcessPort.postMessage(StopPayload);
  ProcessPort.disconnect();

  ProcessPort = null;
  SessionToken = null;
};

/* HELPERS */
const MakeConn = () => {
  SessionToken = crypto.randomUUID();
  ProcessPort = chrome.runtime.connect({ name: SessionToken });
};

const BlockWebSite = () => {
  document.body.innerHTML = `<div style="text-align: center">
            <h1>Time Elapsed! Website locked for today 🔒</h1>
            <h2>❌ Come back tomorrow</h2>
            <h3>This message have been displayed by "Webapp limiter" extension</h3>
      </div>`;
};

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

// https://developer.chrome.com/docs/extensions/mv3/messaging/
