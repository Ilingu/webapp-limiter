import type { BgCallPayload, BgResShape } from "./lib/types";
import { ConnInstruction } from "./lib/types";

chrome.runtime.onInstalled.addListener(() => {
  LauchBgServer();
});

type TokenIdShape = { [token: string]: number };
let ResetInterval: TokenIdShape = {},
  TokenToId: TokenIdShape = {};
let SessionToken: string[] = [];

const LauchBgServer = () => {
  /* Content Script Listener */
  chrome.runtime.onMessage.addListener((req, sender) => {
    const Token = req?.proof;
    if (!Token || typeof Token != "string") return;
    if (!VerifyProofOfCall(Token || "")) {
      SessionToken = [...SessionToken, Token];
      TokenToId[Token] = sender.tab.id;
    }

    HandleNewInstruction(req);
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
  if (!Token) return;
  const WorkProof = setInterval(() => {
    console.log(TokenToId, SessionToken);
    SendResponse(TokenToId[Token], {
      WorkSucceed: true,
      proof: Token,
      resType: ConnInstruction.REPORT,
    } as BgResShape);
  }, 1000); // 60_000
  ResetInterval = { ...ResetInterval, [Token]: WorkProof };
};

const StopProcess = (Token: string) => {
  if (!TokenToId[Token] || !ResetInterval[Token]) return;
  clearInterval(ResetInterval[Token]);

  delete TokenToId[Token];
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

const SendResponse = (tabId: number, payload: BgResShape) => {
  chrome.tabs.sendMessage(tabId, payload);
};
