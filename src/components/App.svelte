<script lang="ts">
  import type { StorageShape, WebsiteLimiterShape } from "../lib/types";
  import {
    EmptyStorage,
    ExecuteScript,
    FormatMinToHourMin,
    SetStorage,
  } from "../lib/utils";
  import { onMount } from "svelte";
  // CSS
  import "../styles/app.css";

  export let storage: StorageShape = {};

  let CurrentApp: WebsiteLimiterShape;
  let hostUrl: string = "";

  onMount(async () => {
    await QueryHostUrl();
    if (!EmptyStorage(storage)) {
      CurrentApp = storage[hostUrl]; // Set App
      // Change Listener
      chrome.storage.onChanged.addListener((changes) => {
        for (let [key, { newValue: newStorage }] of Object.entries(changes)) {
          if (key === "storage") {
            storage = newStorage;
            CurrentApp = storage[hostUrl];
          }
        }
      });
    }
  });

  const QueryHostUrl = async () => {
    const [hostRes] = await ExecuteScript(() => {
      return window.location.host;
    });
    hostUrl = hostRes.result;
  };

  let Hours: number, Mins: number;
  const SaveTime = () => {
    if (isNaN(Hours) || isNaN(Mins) || Hours < 0 || Mins < 0 || Mins > 60)
      return;

    const MAX_TIME = Hours * 60 + Mins;
    const WebappLimiter: WebsiteLimiterShape = {
      url: hostUrl,
      enable: true,
      MAX_TIME,
      ElapsedTime: CurrentApp?.ElapsedTime || undefined,
      LastSession: CurrentApp?.LastSession || undefined,
    };

    const NewStorage = { ...storage, [hostUrl]: WebappLimiter };
    SetStorage(NewStorage);
    CurrentApp = WebappLimiter;
  };

  const ToggleTimerState = () => {
    if (EmptyStorage(storage)) return;
    const CopyStorage = { ...storage };
    CopyStorage[hostUrl].enable = !CopyStorage[hostUrl].enable;
    SetStorage(CopyStorage);
  };

  const RemoveTimer = () => {
    if (EmptyStorage(storage)) return;
    const CopyStorage = { ...storage };
    delete CopyStorage[hostUrl];
    SetStorage(CopyStorage);
  };
</script>

<template>
  <img src="/icons/icon-128.png" alt="Icon" />
  <h3 id="appTitle">Webapp limiter ⏱️</h3>
  <div id="websiteInfo">
    <header>
      <h1>{hostUrl}</h1>
      <h2
        id="TimerStatus"
        on:click={ToggleTimerState}
        title={`Click to ${!CurrentApp?.enable ? "Enable" : "Disable"}`}
      >
        Timer is {#if CurrentApp && CurrentApp.enable}
          <span class="green">Enabled</span>
        {:else}
          <span class="red">Disabled</span>
        {/if}
      </h2>
      <div id="valueInfo">
        {#if CurrentApp && CurrentApp.enable}
          <h3 style="font-size: 16px;">
            Timer: <span class="special bold"
              >{FormatMinToHourMin(CurrentApp.MAX_TIME)}</span
            >
          </h3>
          <h3 style="font-size: 16px;">
            Elapsed Time: <span class="special bold"
              >{FormatMinToHourMin(CurrentApp?.ElapsedTime || 0)}</span
            >
          </h3>
          <h3 style="font-size: 16px;">
            Remaining Time: <span class="special bold"
              >{FormatMinToHourMin(
                CurrentApp.MAX_TIME - (CurrentApp?.ElapsedTime || 0)
              )}
            </span>
          </h3>
          <h3 style="font-size: 16px;">
            Last Session: <span class="special bold"
              >{CurrentApp?.LastSession
                ? new Date(CurrentApp.LastSession).toLocaleDateString()
                : undefined}
            </span>
          </h3>
        {/if}
      </div>
    </header>
    <section>
      <h2>Set a Timer:</h2>
      <form on:submit|preventDefault={SaveTime}>
        <input type="number" placeholder="Hours" required bind:value={Hours} />
        <input
          type="number"
          placeholder="Min"
          required
          max={60}
          bind:value={Mins}
        />
        <button type="submit" class="btn">Set ⏱️</button>
      </form>
    </section>
    <button on:click={RemoveTimer} class="btn">Reset Timer</button>
  </div>
</template>
