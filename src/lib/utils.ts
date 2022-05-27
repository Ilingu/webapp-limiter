import type { StorageShape } from "./types";

export const ExecuteScript = async (funcToExec: () => void) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  return chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: funcToExec,
  });
};

export const SetStorage = (NewStorage: StorageShape) => {
  chrome.storage.sync.set({ storage: NewStorage });
};

export const FormatMinToHourMin = (timeToFormat: number) => {
  if (!timeToFormat) return "0 min";
  return `${Math.floor(timeToFormat / 60)} H ${timeToFormat % 60} min`;
};

export const EmptyStorage = (storage: object) => {
  if (storage && Object.keys(storage).length > 0) return false;
  return true;
};
