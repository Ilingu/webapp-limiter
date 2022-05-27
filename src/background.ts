import type { BgCallPayload, BgResShape } from "./lib/types";
import { ConnInstruction } from "./lib/types";

chrome.runtime.onInstalled.addListener(() => {
  LauchBgServer();
});

let ResetInterval: { [token: string]: number } = {};
let Ports: { [token: string]: chrome.runtime.Port } = {};
let SessionToken: string[] = [];

const LauchBgServer = () => {
  /* Content Script Listener */
  chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(HandleNewInstruction); // Incoming Call

    const Token = port.name;
    Ports = { ...Ports, [Token]: port };
    SessionToken = [...SessionToken, Token];

    port.onDisconnect.addListener(() => StopProcess(Token));
  });
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

const HandleNewInstruction = (Instruction: BgCallPayload) => {
  if (
    !Instruction ||
    typeof Instruction?.proof != "string" ||
    typeof Instruction?.do != "number"
  )
    return;
  if (!VerifyProofOfCall(Instruction?.proof || "")) return;

  const { do: instruction, proof: session } = Instruction;
  if (instruction === ConnInstruction.WORK) StartProcess(session);
  if (instruction === ConnInstruction.REST) StopProcess(session);
};

const StartProcess = (Token: string) => {
  const WorkProof = setInterval(() => {
    Ports[Token].postMessage({
      WorkSucceed: true,
      proof: Token,
      resType: ConnInstruction.REPORT,
    } as BgResShape);
  }, 60_000);
  ResetInterval = { ...ResetInterval, [Token]: WorkProof };
};

const StopProcess = (Token: string) => {
  if (!Ports[Token] || !ResetInterval[Token]) return;
  clearInterval(ResetInterval[Token]);

  delete Ports[Token];
  delete ResetInterval[Token];
  const TokenIndex = SessionToken.indexOf(Token);
  if (TokenIndex === -1) return;
  SessionToken.splice(TokenIndex, 1);
};

// HELPERS
const VerifyProofOfCall = (proof: string): boolean => {
  if (SessionToken.includes(proof)) return true;
  return false;
};
