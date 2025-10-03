const slogans = [
  "Latency slayed. Spirits raised.",
  "Keep calm and let Davis\u00AE cook.",
  "We put the fun in fundamental metrics.",
  "Chat heroes by day, dashboard DJs by night.",
  "Observability: because guessing is so last season."
];

const subtitle = document.querySelector(".hero__subtitle");
let index = 0;

function cycleSlogans() {
  if (!subtitle) return;
  subtitle.classList.add("is-fading");
  setTimeout(() => {
    index = (index + 1) % slogans.length;
    subtitle.textContent = slogans[index];
    subtitle.classList.remove("is-fading");
  }, 350);
}

setInterval(cycleSlogans, 5000);

document.addEventListener("DOMContentLoaded", () => {
  setupSmoothScroll();
  initDtrumLab();
});

function setupSmoothScroll() {
  const links = document.querySelectorAll("a[href^='#']:not([href='#'])");
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href").slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      link.blur();
    });
  });
}

function initDtrumLab() {
  const grid = document.querySelector("[data-dtrum-grid]");
  const statusEl = document.querySelector("[data-dtrum-status]");
  const logList = document.querySelector("[data-dtrum-log]");

  if (!grid || !statusEl || !logList) {
    return;
  }

  const categoryMeta = {
    safe: { label: "Safe call", pillClass: "" },
    context: { label: "Needs context", pillClass: "dtrum-pill--context" },
    danger: { label: "Agent toggle", pillClass: "dtrum-pill--danger" }
  };

  const buttons = [];

  function setStatus(text, variant = "waiting") {
    statusEl.textContent = text;
    statusEl.setAttribute("data-variant", variant);
  }

  function log(message, level = "info") {
    const entry = document.createElement("li");
    entry.className = "dtrum-lab__log-item";
    if (level === "error") {
      entry.classList.add("dtrum-lab__log-item--error");
    }
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logList.insertBefore(entry, logList.firstChild);
    while (logList.children.length > 20) {
      logList.removeChild(logList.lastChild);
    }
  }

  function ensureAgent() {
    const agent = window.dtrum;
    if (!agent || typeof agent !== "object") {
      log("Dynatrace agent not ready yet. Please wait for the loader script.", "error");
      return null;
    }
    return agent;
  }

  const state = {
    actionCounter: 0,
    lastActionId: null,
    lastActionName: null,
    xhrActionCounter: 0,
    lastXhrActionId: null,
    xhrCallbackActive: false,
    userInputId: null,
    manualLoad: false,
    loadMarkerCount: 0,
    manualPageDetection: false,
    agentDisabled: false,
    autoActionDetection: true,
    persistentValuesEnabled: true,
    sessionReplayEnabled: true,
    sessionPropertyCounter: 0,
    currentPageId: null,
    listeners: {
      enter: null,
      leave: null,
      pageLeaving: null,
      visitTimeout: null
    },
    preDiffMethod: null,
    listenerLog: log
  };

  const tests = [
    {
      name: "actionName",
      signature: "actionName(actionName: string, actionId?: number)",
      description: "Rename the current manual action. Run enterAction first so there is an active ID to target.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.lastActionId) {
          return {
            skip: true,
            level: "error",
            message: "No manual action in progress. Run enterAction before calling actionName."
          };
        }
        const newName = `CSKO Lab Step ${++ctx.actionCounter}`;
        const result = agent.actionName(newName, ctx.lastActionId);
        ctx.lastActionName = newName;
        return { message: `Renamed action ${ctx.lastActionId} to "${newName}" (result: ${result}).` };
      }
    },
    {
      name: "addActionProperties",
      signature: "addActionProperties(parentActionId: number, javaLong?, date?, shortString?, javaDouble?)",
      description: "Attach sample numeric, date, string, and double properties to the last manual action.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.lastActionId) {
          return {
            skip: true,
            level: "error",
            message: "No action available. Start one with enterAction first."
          };
        }
        const javaLong = { "lab.sequence": ctx.actionCounter };
        const dateMap = { "lab.timestamp": new Date() };
        const shortString = { "lab.context": "api-lab" };
        const javaDouble = { "lab.durationMs": Number((Math.random() * 500).toFixed(2)) };
        agent.addActionProperties(ctx.lastActionId, javaLong, dateMap, shortString, javaDouble);
        return { message: `Attached lab.* properties to action ${ctx.lastActionId}.` };
      }
    },
    {
      name: "addEnterActionListener",
      signature: "addEnterActionListener(listener: ActionEnterListener)",
      description: "Register a listener that logs whenever Dynatrace enters an action.",
      category: "safe",
      run(agent, ctx) {
        if (ctx.listeners.enter) {
          return {
            skip: true,
            level: "info",
            message: "Enter-action listener already attached."
          };
        }
        const listener = function () {
          const args = Array.from(arguments);
          ctx.listenerLog(`enterAction listener fired with args: ${args.map((value) => JSON.stringify(value)).join(", ")}`);
        };
        agent.addEnterActionListener(listener);
        ctx.listeners.enter = listener;
        return { message: "Enter-action listener attached. Watch the call log for callbacks." };
      }
    },
    {
      name: "addLeaveActionListener",
      signature: "addLeaveActionListener(listener: ActionLeaveListener)",
      description: "Logs when manual actions end. Combine with enterAction / leaveAction to see callbacks.",
      category: "safe",
      run(agent, ctx) {
        if (ctx.listeners.leave) {
          return {
            skip: true,
            level: "info",
            message: "Leave-action listener already attached."
          };
        }
        const listener = function () {
          const args = Array.from(arguments);
          ctx.listenerLog(`leaveAction listener fired with args: ${args.map((value) => JSON.stringify(value)).join(", ")}`);
        };
        agent.addLeaveActionListener(listener);
        ctx.listeners.leave = listener;
        return { message: "Leave-action listener attached. Close an action to trigger it." };
      }
    },
    {
      name: "addPageLeavingListener",
      signature: "addPageLeavingListener(listener: PageLeaveListener)",
      description: "Notifies before the page unloads or the user navigates away. Useful for cleanup hooks.",
      category: "safe",
      notes: "The callback fires on real navigation events. Watch the log on refresh or when following a link.",
      run(agent, ctx) {
        if (ctx.listeners.pageLeaving) {
          return {
            skip: true,
            level: "info",
            message: "Page leaving listener already registered."
          };
        }
        const listener = function (targetUrl) {
          ctx.listenerLog(`Page leaving listener triggered. Next URL: ${targetUrl || "unknown"}.`);
        };
        agent.addPageLeavingListener(listener);
        ctx.listeners.pageLeaving = listener;
        return { message: "Registered page leaving listener. Navigate away to fire it." };
      }
    },
    {
      name: "addVisitTimeoutListener",
      signature: "addVisitTimeoutListener(listener: (visitId, newVisitAfterTimeout) => void)",
      description: "Registers a listener that fires when a visit times out because of inactivity.",
      category: "safe",
      notes: "Dynatrace triggers this after the configured visit timeout (default ~30 minutes).",
      run(agent, ctx) {
        if (ctx.listeners.visitTimeout) {
          return {
            skip: true,
            level: "info",
            message: "Visit timeout listener already registered."
          };
        }
        const listener = function (visitId, newVisitAfterTimeout) {
          ctx.listenerLog(`Visit timeout listener fired for ${visitId}. New visit started: ${newVisitAfterTimeout}.`);
        };
        agent.addVisitTimeoutListener(listener);
        ctx.listeners.visitTimeout = listener;
        return { message: "Visit timeout listener attached. It will fire after Dynatrace closes the visit." };
      }
    },
    {
      name: "beginUserInput",
      signature: "beginUserInput(actionName: string)",
      description: "Mark the beginning of a manual user input sequence, storing the returned handle.",
      category: "safe",
      run(agent, ctx) {
        const label = `lab-input-${Date.now()}`;
        const inputId = agent.beginUserInput(label);
        ctx.userInputId = inputId;
        return { message: `beginUserInput started (“${label}”), handle: ${inputId}.` };
      }
    },
    {
      name: "disable",
      signature: "disable()",
      description: "Fully disable the Dynatrace JavaScript agent until enable() is called again.",
      category: "danger",
      notes: "Only use temporarily in the lab—doing this in production will drop all further beacons.",
      run(agent, ctx) {
        agent.disable();
        ctx.agentDisabled = true;
        return { message: "Dynatrace agent disabled. Call enable() to resume instrumentation.", level: "info" };
      }
    },
    {
      name: "disablePersistentValues",
      signature: "disablePersistentValues()",
      description: "Turns off cookies/local storage usage for the remainder of the visit.",
      category: "danger",
      run(agent, ctx) {
        agent.disablePersistentValues();
        ctx.persistentValuesEnabled = false;
        return { message: "Persistent values disabled for this visit." };
      }
    },
    {
      name: "disableSessionReplay",
      signature: "disableSessionReplay()",
      description: "Stop collecting Session Replay data after the current page.",
      category: "danger",
      run(agent, ctx) {
        agent.disableSessionReplay();
        ctx.sessionReplayEnabled = false;
        return { message: "Session Replay disabled for subsequent pages." };
      }
    },
    {
      name: "enable",
      signature: "enable()",
      description: "Re-enable the Dynatrace agent after a disable() call.",
      category: "danger",
      run(agent, ctx) {
        agent.enable();
        ctx.agentDisabled = false;
        return { message: "Dynatrace agent re-enabled.", level: "info" };
      }
    },
    {
      name: "enableManualPageDetection",
      signature: "enableManualPageDetection()",
      description: "Switch to manual load detection. Use the signalOnLoad* helpers afterwards.",
      category: "danger",
      run(agent, ctx) {
        agent.enableManualPageDetection();
        ctx.manualPageDetection = true;
        ctx.manualLoad = true;
        return { message: "Manual page detection enabled. Use signalOnLoadStart/End to bracket loads." };
      }
    },
    {
      name: "enablePersistentValues",
      signature: "enablePersistentValues()",
      description: "Restore cookie/local storage usage after disablePersistentValues().",
      category: "danger",
      run(agent, ctx) {
        agent.enablePersistentValues();
        ctx.persistentValuesEnabled = true;
        return { message: "Persistent values re-enabled." };
      }
    },
    {
      name: "enableSessionReplay",
      signature: "enableSessionReplay()",
      description: "Re-enable Session Replay capture after it was disabled.",
      category: "danger",
      run(agent, ctx) {
        agent.enableSessionReplay();
        ctx.sessionReplayEnabled = true;
        return { message: "Session Replay enabled for upcoming visits." };
      }
    },
    {
      name: "endSession",
      signature: "endSession()",
      description: "Close the current Dynatrace session and start a new one with the next action.",
      category: "danger",
      run(agent, ctx) {
        agent.endSession();
        ctx.lastActionId = null;
        ctx.lastXhrActionId = null;
        ctx.userInputId = null;
        return { message: "Session ended. The next interaction starts a fresh visit." };
      }
    },
    {
      name: "endUserInput",
      signature: "endUserInput(userInputId: number)",
      description: "Close the manual user input started with beginUserInput.",
      category: "context",
      run(agent, ctx) {
        if (typeof ctx.userInputId !== "number") {
          return {
            skip: true,
            level: "error",
            message: "No user input handle stored. Call beginUserInput first."
          };
        }
        agent.endUserInput(ctx.userInputId);
        const handle = ctx.userInputId;
        ctx.userInputId = null;
        return { message: `endUserInput completed for handle ${handle}.` };
      }
    },
    {
      name: "enterAction",
      signature: "enterAction(actionName: string, actionType?, startTime?, sourceUrl?)",
      description: "Start a manual action and store the returned ID for follow-up calls.",
      category: "safe",
      run(agent, ctx) {
        const label = `Lab manual action ${++ctx.actionCounter}`;
        const startTime = typeof agent.now === "function" ? agent.now() : Date.now();
        const actionId = agent.enterAction(label, "manual", startTime, window.location.pathname);
        ctx.lastActionId = actionId;
        ctx.lastActionName = label;
        return { message: `enterAction => id ${actionId} (“${label}”).` };
      }
    },
    {
      name: "enterXhrAction",
      signature: "enterXhrAction(type: string, xmode?: 0|1|3, xhrUrl?: string)",
      description: "Start a manual XHR action for asynchronous work and keep its ID handy.",
      category: "safe",
      run(agent, ctx) {
        const label = `lab.xhr.${++ctx.xhrActionCounter}`;
        const xhrId = agent.enterXhrAction(label, 1, `https://example.com/api/lab/${ctx.xhrActionCounter}`);
        ctx.lastXhrActionId = xhrId;
        return { message: `enterXhrAction => id ${xhrId} (“${label}”).` };
      }
    },
    {
      name: "enterXhrCallback",
      signature: "enterXhrCallback(actionId: number)",
      description: "Relink asynchronous callbacks to the last manual XHR action.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.lastXhrActionId) {
          return {
            skip: true,
            level: "error",
            message: "No XHR action active. Run enterXhrAction first."
          };
        }
        agent.enterXhrCallback(ctx.lastXhrActionId);
        ctx.xhrCallbackActive = true;
        return { message: `enterXhrCallback attached to XHR action ${ctx.lastXhrActionId}.` };
      }
    },
    {
      name: "getAndEvaluateMetaData",
      signature: "getAndEvaluateMetaData() => { expression, failureReason?, id, type, value }",
      description: "Show the current metadata evaluation result computed by Dynatrace.",
      category: "safe",
      run(agent, ctx, logFn) {
        const meta = agent.getAndEvaluateMetaData();
        logFn(`Metadata evaluation: ${JSON.stringify(meta)}`);
        return { message: "Metadata evaluated. Details logged above." };
      }
    },
    {
      name: "identifyUser",
      signature: "identifyUser(value: string)",
      description: "Assign a synthetic user tag to the current session.",
      category: "safe",
      run(agent) {
        const userId = `lab-user-${Math.floor(Math.random() * 100000)}`;
        agent.identifyUser(userId);
        return { message: `identifyUser => ${userId}` };
      }
    },
    {
      name: "incrementOnLoadEndMarkers",
      signature: "incrementOnLoadEndMarkers()",
      description: "Increase the number of expected manual load-end signals.",
      category: "context",
      run(agent, ctx) {
        agent.incrementOnLoadEndMarkers();
        ctx.manualLoad = true;
        ctx.loadMarkerCount += 1;
        return { message: `incrementOnLoadEndMarkers called. Outstanding markers: ${ctx.loadMarkerCount}.` };
      }
    },
    {
      name: "leaveAction",
      signature: "leaveAction(actionId: number, stopTime?, startTime?)",
      description: "Close the most recent manual action started with enterAction.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.lastActionId) {
          return {
            skip: true,
            level: "error",
            message: "No manual action to close. Run enterAction first."
          };
        }
        agent.leaveAction(ctx.lastActionId);
        const closedId = ctx.lastActionId;
        ctx.lastActionId = null;
        ctx.lastActionName = null;
        return { message: `leaveAction closed action ${closedId}.` };
      }
    },
    {
      name: "leaveXhrAction",
      signature: "leaveXhrAction(actionId: number, stopTime?: number)",
      description: "Close the open manual XHR action.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.lastXhrActionId) {
          return {
            skip: true,
            level: "error",
            message: "No manual XHR action to close. Run enterXhrAction first."
          };
        }
        agent.leaveXhrAction(ctx.lastXhrActionId);
        const closed = ctx.lastXhrActionId;
        ctx.lastXhrActionId = null;
        ctx.xhrCallbackActive = false;
        return { message: `leaveXhrAction closed action ${closed}.` };
      }
    },
    {
      name: "leaveXhrCallback",
      signature: "leaveXhrCallback(actionId: number)",
      description: "Signal the end of an asynchronous XHR callback.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.xhrCallbackActive || !ctx.lastXhrActionId) {
          return {
            skip: true,
            level: "error",
            message: "Call enterXhrCallback before ending the callback."
          };
        }
        agent.leaveXhrCallback(ctx.lastXhrActionId);
        ctx.xhrCallbackActive = false;
        return { message: `leaveXhrCallback completed for action ${ctx.lastXhrActionId}.` };
      }
    },
    {
      name: "markAsErrorPage",
      signature: "markAsErrorPage(responseCode: number, message: string)",
      description: "Mark the current page load as failed with a custom status code and message.",
      category: "context",
      run(agent) {
        const success = agent.markAsErrorPage(500, "Manual API lab failure");
        return { message: `markAsErrorPage returned ${success}.` };
      }
    },
    {
      name: "markXHRFailed",
      signature: "markXHRFailed(responseCode: number, message: string, parentActionId?: number)",
      description: "Flag the last manual XHR action as failed.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.lastXhrActionId) {
          return {
            skip: true,
            level: "error",
            message: "No manual XHR action recorded. Run enterXhrAction first."
          };
        }
        const success = agent.markXHRFailed(503, "Lab XHR failure", ctx.lastXhrActionId);
        return { message: `markXHRFailed returned ${success} for action ${ctx.lastXhrActionId}.` };
      }
    },
    {
      name: "now",
      signature: "now() => number",
      description: "Retrieve Dynatrace's millisecond timestamp helper.",
      category: "safe",
      run(agent) {
        const value = typeof agent.now === "function" ? agent.now() : Date.now();
        return { message: `now() => ${value}` };
      }
    },
    {
      name: "registerPreDiffMethod",
      signature: "registerPreDiffMethod(method: (diff: string) => string)",
      description: "Inject a hook that can adjust the DOM diff captured for Session Replay.",
      category: "safe",
      notes: "The callback runs when Session Replay records DOM changes.",
      run(agent, ctx) {
        const hook = function (diff) {
          const preview = diff.length > 120 ? `${diff.slice(0, 120)}...` : diff;
          ctx.listenerLog(`Pre-diff hook invoked. Preview: ${preview}`);
          return diff;
        };
        agent.registerPreDiffMethod(hook);
        ctx.preDiffMethod = hook;
        return { message: "Pre-diff hook registered. Watch for log entries during DOM mutations." };
      }
    },
    {
      name: "removeEnterActionListener",
      signature: "removeEnterActionListener(listener: ActionEnterListener)",
      description: "Detach the listener previously added via addEnterActionListener.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.listeners.enter) {
          return {
            skip: true,
            level: "error",
            message: "No enter-action listener attached yet."
          };
        }
        agent.removeEnterActionListener(ctx.listeners.enter);
        ctx.listeners.enter = null;
        return { message: "Enter-action listener removed." };
      }
    },
    {
      name: "removeLeaveActionListener",
      signature: "removeLeaveActionListener(listener: ActionLeaveListener)",
      description: "Detach the leave-action listener.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.listeners.leave) {
          return {
            skip: true,
            level: "error",
            message: "No leave-action listener attached yet."
          };
        }
        agent.removeLeaveActionListener(ctx.listeners.leave);
        ctx.listeners.leave = null;
        return { message: "Leave-action listener removed." };
      }
    },
    {
      name: "reportCustomError",
      signature: "reportCustomError(key: string, value: string, hint?: string, parentingInfo?: number|boolean)",
      description: "Report a custom key/value pair as an error marker on the current action.",
      category: "safe",
      run(agent, ctx) {
        const key = "LAB_CUSTOM";
        const value = `Manual error ${Date.now()}`;
        agent.reportCustomError(key, value, "Triggered via dtrum lab", ctx.lastActionId ?? false);
        return { message: `reportCustomError sent with key ${key}.` };
      }
    },
    {
      name: "reportError",
      signature: "reportError(error: string | Error, parentActionId?: number)",
      description: "Send an exception to Dynatrace, optionally linking it to the last manual action.",
      category: "safe",
      run(agent, ctx) {
        const error = new Error("Sample error from dtrum API lab");
        agent.reportError(error, ctx.lastActionId ?? undefined);
        return { message: "reportError sent a sample Error object." };
      }
    },
    {
      name: "sendBeacon",
      signature: "sendBeacon(forceSync: boolean, sendPreview: boolean, killUnfinished: boolean)",
      description: "Immediately flush the beacon queue, optionally forcing a synchronous send.",
      category: "danger",
      run(agent) {
        agent.sendBeacon(true, false, false);
        return { message: "Beacon flush requested (forceSync = true)." };
      }
    },
    {
      name: "sendSessionProperties",
      signature: "sendSessionProperties(javaLongOrObject?, date?, string?, javaDouble?)",
      description: "Send sample visit-level properties spanning all supported data types.",
      category: "safe",
      run(agent, ctx) {
        ctx.sessionPropertyCounter += 1;
        const javaLong = { "lab.session.sequence": ctx.sessionPropertyCounter };
        const dateMap = { "lab.session.timestamp": new Date() };
        const stringMap = { "lab.session.stage": "demo" };
        const javaDouble = { "lab.session.score": Number((Math.random() * 100).toFixed(2)) };
        agent.sendSessionProperties(javaLong, dateMap, stringMap, javaDouble);
        return { message: "Session properties sent (lab.session.*)." };
      }
    },
    {
      name: "setAutomaticActionDetection",
      signature: "setAutomaticActionDetection(enabled: boolean)",
      description: "Toggle Dynatrace automatic action detection on the fly.",
      category: "danger",
      run(agent, ctx) {
        ctx.autoActionDetection = !ctx.autoActionDetection;
        agent.setAutomaticActionDetection(ctx.autoActionDetection);
        return { message: `Automatic action detection set to ${ctx.autoActionDetection}.` };
      }
    },
    {
      name: "setLoadEndManually",
      signature: "setLoadEndManually()",
      description: "Declare that you will complete load actions yourself with signalLoadEnd.",
      category: "danger",
      run(agent, ctx) {
        agent.setLoadEndManually();
        ctx.manualLoad = true;
        ctx.loadMarkerCount = 0;
        return { message: "Manual load end activated. Remember to call signalLoadEnd when done." };
      }
    },
    {
      name: "setPage",
      signature: "setPage(newPage: APIPage)",
      description: "Start a new virtual page with metadata for name, URI, and referrer.",
      category: "safe",
      run(agent, ctx) {
        const pageName = `lab/page/${++ctx.actionCounter}`;
        const page = {
          name: pageName,
          uri: `${window.location.origin}${window.location.pathname}?lab=${Date.now()}`,
          referrer: document.referrer || "manual"
        };
        const pageId = agent.setPage(page);
        ctx.currentPageId = pageId;
        return { message: `setPage => ${pageName} (id ${pageId}).` };
      }
    },
    {
      name: "signalLoadEnd",
      signature: "signalLoadEnd()",
      description: "Signal that the page finished loading when using manual load control.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.manualLoad) {
          return {
            skip: true,
            level: "error",
            message: "Enable manual page detection first (setLoadEndManually or enableManualPageDetection)."
          };
        }
        agent.signalLoadEnd();
        ctx.manualLoad = false;
        ctx.loadMarkerCount = 0;
        return { message: "signalLoadEnd fired. Manual load window closed." };
      }
    },
    {
      name: "signalOnLoadEnd",
      signature: "signalOnLoadEnd()",
      description: "Decrement one manual load-end marker. Call incrementOnLoadEndMarkers first.",
      category: "context",
      run(agent, ctx) {
        if (!ctx.manualLoad) {
          return {
            skip: true,
            level: "error",
            message: "Manual load sequencing is not active. Call setLoadEndManually first."
          };
        }
        if (ctx.loadMarkerCount <= 0) {
          return {
            skip: true,
            level: "error",
            message: "No outstanding markers. Use incrementOnLoadEndMarkers before signaling the end."
          };
        }
        agent.signalOnLoadEnd();
        ctx.loadMarkerCount = Math.max(0, ctx.loadMarkerCount - 1);
        return { message: `signalOnLoadEnd fired. Remaining markers: ${ctx.loadMarkerCount}.` };
      }
    },
    {
      name: "signalOnLoadStart",
      signature: "signalOnLoadStart()",
      description: "Mark the beginning of a manual load action window.",
      category: "context",
      run(agent, ctx) {
        agent.signalOnLoadStart();
        ctx.manualLoad = true;
        return { message: "signalOnLoadStart fired. Manual load window opened." };
      }
    }
  ];

  function createCard(test) {
    const card = document.createElement("article");
    card.className = "dtrum-card";
    card.setAttribute("data-test", test.name);

    const header = document.createElement("div");
    header.className = "dtrum-card__header";

    const title = document.createElement("h3");
    title.className = "dtrum-card__title";
    title.textContent = test.name;

    const pill = document.createElement("span");
    const pillClasses = ["dtrum-pill"];
    if (categoryMeta[test.category]?.pillClass) {
      pillClasses.push(categoryMeta[test.category].pillClass);
    }
    pill.className = pillClasses.join(" ");
    pill.textContent = categoryMeta[test.category]?.label || "Call";

    header.appendChild(title);
    header.appendChild(pill);

    const signature = document.createElement("div");
    signature.className = "dtrum-card__signature";
    signature.textContent = test.signature;

    const description = document.createElement("p");
    description.className = "dtrum-card__description";
    description.textContent = test.description;

    const actions = document.createElement("div");
    actions.className = "dtrum-card__actions";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Run sample";
    button.disabled = true;

    const status = document.createElement("div");
    status.className = "dtrum-card__status";
    status.textContent = "Waiting for agent...";

    button.addEventListener("click", () => {
      const agent = ensureAgent();
      if (!agent) {
        status.textContent = "Dynatrace agent not ready yet.";
        status.classList.remove("dtrum-card__status--success");
        status.classList.add("dtrum-card__status--error");
        return;
      }

      try {
        const outcome = test.run(agent, state, log);
        if (outcome && outcome.skip) {
          status.textContent = outcome.message || "Skipped.";
          status.classList.remove("dtrum-card__status--success");
          if (outcome.level === "info") {
            status.classList.remove("dtrum-card__status--error");
          } else {
            status.classList.add("dtrum-card__status--error");
          }
          if (outcome.message) {
            log(outcome.message, outcome.level || "info");
          }
          return;
        }

        const message = (outcome && outcome.message) || `${test.name} executed.`;
        status.textContent = message;
        status.classList.remove("dtrum-card__status--error");
        status.classList.add("dtrum-card__status--success");
        log(message, outcome?.level || "info");
      } catch (error) {
        const detail = error && error.message ? error.message : String(error);
        status.textContent = `Error: ${detail}`;
        status.classList.remove("dtrum-card__status--success");
        status.classList.add("dtrum-card__status--error");
        log(`${test.name} failed: ${detail}`, "error");
      }
    });

    actions.appendChild(button);

    card.appendChild(header);
    card.appendChild(signature);
    card.appendChild(description);
    card.appendChild(actions);
    card.appendChild(status);

    if (test.notes) {
      const notes = document.createElement("p");
      notes.className = "dtrum-card__notes";
      notes.textContent = test.notes;
      card.appendChild(notes);
    }

    buttons.push(button);
    return card;
  }

  tests.forEach((test) => {
    grid.appendChild(createCard(test));
  });

  const readinessCheck = setInterval(() => {
    const agent = window.dtrum;
    if (agent && typeof agent === "object") {
      clearInterval(readinessCheck);
      buttons.forEach((btn) => {
        btn.disabled = false;
      });
      setStatus("Dynatrace agent detected. Lab is ready.", "ready");
      log("Dynatrace agent detected. You can start triggering API calls.");
    }
  }, 500);

  setTimeout(() => {
    if (!window.dtrum) {
      setStatus("Still waiting for the Dynatrace agent... verify the script tag URL.", "error");
    }
  }, 6000);
}
