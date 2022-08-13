import type { StorageShape } from "./types";

export const ExecuteScript = async (funcToExec: () => void) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  return chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: funcToExec,
  });
};

export const SetStorage = async (NewStorage: StorageShape) => {
  await chrome.storage.sync.set({ storage: NewStorage });
  console.log("[LOG] [Webapp Limiter] STORAGE SET! ", { NewStorage });
};

export const FormatMinToHourMin = (timeToFormat: number) => {
  if (!timeToFormat) return "0 min";
  return `${Math.floor(timeToFormat / 60)} H ${timeToFormat % 60} min`;
};

export const EmptyStorage = (storage: object) => {
  if (storage && Object.keys(storage).length > 0) return false;
  return true;
};

interface IdleArgs {
  idleTimeout: number;
  onIdle: () => void;
  onActive: () => void;
}

export const IsIdle = ({ idleTimeout, onIdle, onActive }: IdleArgs) => {
  let timeoutTimer = setTimeout(onIdle, idleTimeout);
  const RetryTimeout = () => {
    onActive();
    timeoutTimer && clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(onIdle, idleTimeout);
  };

  document.addEventListener("mousemove", RetryTimeout);
  document.addEventListener("keydown", RetryTimeout);
  document.addEventListener("mousedown", RetryTimeout);
  document.addEventListener("touchstart", RetryTimeout);
};
