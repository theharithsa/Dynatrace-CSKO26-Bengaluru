# Dynatrace DEM End-to-End Troubleshooting Guide

A field-ready runbook for Web Real User Monitoring (RUM), Mobile RUM, Session Replay, and Synthetic Monitoring.

## Table of Contents

- [Quick Triage (Use This First)](#quick-triage-use-this-first)
- [Web RUM Troubleshooting](#web-rum-troubleshooting)
  - [2.1 RUM Injected but No Data](#21-rum-injected-but-no-data)
  - [2.2 Data Arrives but Is Not Visible/Complete](#22-data-arrives-but-is-not-visiblecomplete)
  - [2.3 Sessions Missing, Split, or Unidentified](#23-sessions-missing-split-or-unidentified)
  - [2.4 CSP, CORS, Beacon, and Cookies](#24-csp-cors-beacon-and-cookies)
  - [2.5 Manual Customisation and dtrum API](#25-manual-customisation-and-dtrum-api)
- [Session Replay (Web)](#session-replay-web)
- [Mobile RUM (Android, iOS, Hybrid)](#mobile-rum-android-ios-hybrid)
  - [4.1 Android](#41-android)
  - [4.2 iOS](#42-ios)
  - [4.3 Hybrid (Native + WebView)](#43-hybrid-native--webview)
- [Front-end & Back-end Correlation](#front-end--back-end-correlation)
- [Quality Signals (Apdex, UX Outliers)](#quality-signals-apdex-ux-outliers)
- [Synthetic Monitoring](#synthetic-monitoring)
  - [7.1 Monitors Failing](#71-monitors-failing)
  - [7.2 Monitors Not Running](#72-monitors-not-running)
- [Reference Snippets & Checklists](#reference-snippets--checklists)
- [Source Index](#source-index)

---

## Quick Triage (Use This First)

1. **Run the application Health Check** (Web > App > More (...) > *Health check*). Confirms RUM status, injection diagnostics, JavaScript version distribution, and configuration issues (RUM disabled, opt-in/DNT enabled, DEM unit exhaustion). [[HC]]
2. **Identify the injection method.** Auto-injection (OneAgent) versus manual or agentless instrumentation determines where the snippet loads from, the default beacon endpoint, and the CSP/CORS rules you must allow. [[AUTO]]
3. **Trace the beacon path.** In DevTools > Network, filter for `rb_` or `dtrum`. Check status codes, endpoint host, and cross-origin behaviour. If cross-origin, configure a beacon-origin allowlist (CORS) in Dynatrace. [[BEACON]] [[CORS]]
4. **Verify the RUM JavaScript track and browser coverage.** Pin to the correct track. Newer tracks drop legacy Internet Explorer support; align with your compatibility needs. [[VERSIONS]]

---

## Web RUM Troubleshooting

### 2.1 RUM Injected but No Data

**Symptoms:** Snippet present or OneAgent reports injection, but no user actions or sessions ingest.

**Root causes and fixes**

- **RUM disabled, DEM quota exhausted, opt-in or DNT blocking.** Use Health Check to re-enable RUM, increase quota, or adjust privacy controls. [[HC]]
- **Beacon blocked (CSP, CORS, proxy).** See [Section 2.4](#24-csp-cors-beacon-and-cookies) for allowlist examples. [[CSP]] [[CORS]]
- **Injection not executing.** Review automatic-injection rules and ensure HTML is valid for OneAgent to insert scripts. [[AUTO]]

**Verification checklist**

- Re-run Health Check.
- In DevTools, ensure beacons return 2xx or 3xx responses.
- Confirm sessions accumulate on the application overview.

### 2.2 Data Arrives but Is Not Visible/Complete

**Symptoms:** Intermittent gaps, certain geographies or users missing, dashboards empty.

**Checks**

- Dashboard filters and timeframes, privacy settings (opt-in/DNT) removing sessions. [[HC]]
- RUM JavaScript track pinned to a build that excludes specific browsers; switch to a compatible track. [[VERSIONS]]
- Review Health Check for discard reasons (privacy, opt-out, instrumentation errors). [[HC]]

### 2.3 Sessions Missing, Split, or Unidentified

- Dynatrace uses first-party cookies (`dtCookie`, `dtPC`, `rxVisitor`) for session and user correlation. Validate policies do not block or purge them. [[COOKIES]]
- Understand user-identification strategy; confirm persistent identifiers are not reset by privacy choices or cookie-clearing processes.

### 2.4 CSP, CORS, Beacon, and Cookies

**Content Security Policy (CSP)**

- Allow the monitoring script source (OneAgent served = `'self'`; Dynatrace CDN = `https://js-cdn.dynatracelabs.com`).
- Add the beacon endpoint host to `connect-src`.
- Provide Subresource Integrity hashes if your policy requires it. [[CSP]]

**CORS and beacon allowlist**

- For cross-origin beacons, configure the *Beacon origin allowlist* (Settings > Web & mobile monitoring > Web > Advanced setup). [[CORS]]

**Cookie policies**

- Ensure load balancers, CDNs, and reverse proxies do not strip Dynatrace cookies, especially on SPA routes and subdomains.

### 2.5 Manual Customisation and dtrum API

- Use `dtrum` API calls to control action names, load-duration brackets, or attach metadata when automatic detection is insufficient. [[DTRUM]]
- Document custom actions so future migrations keep these hooks intact.

---

## Session Replay (Web)

- Check prerequisite toggles: Session Replay enabled, privacy level permits recording, and the replay JavaScript is the correct version.
- Scope Session Replay to key user journeys (for example checkout, sign-up) and exclude sensitive DOM elements with masking rules.
- Confirm storage (SaaS or Managed) has sufficient retention for replay tiles.

---

## Mobile RUM (Android, iOS, Hybrid)

### 4.1 Android

- Add the Gradle plugin or agent according to the instrumentation type (automatic versus manual). [[ANDROID]]
- Validate split APKs or modules include the agent and that push channels are compatible.
- Confirm network beacon endpoints are not blocked by device-level firewalls or VPN profiles.

### 4.2 iOS

- Integrate via Swift Package Manager or CocoaPods; ensure build settings (Bitcode, App Clips) align with Dynatrace guidance. [[IOS]]
- Enable WKWebView support if hybrid content exists.
- Use the agent log to confirm startup events and user sessions are created.

### 4.3 Hybrid (Native + WebView)

- Ensure cookies and visitor IDs are shared between native and web content (see checklist C). [[HYBRID]]
- Inject the JavaScript bridge and enable hybrid mode in the configuration.

---

## Front-end & Back-end Correlation

- Map user actions to server-side PurePaths via header propagation (`x-dynatrace`).
- For third-party beacons or external services, enable Distributed Tracing integration to retain context.
- Verify that backend services are monitored and not excluded from topology detection.

---

## Quality Signals (Apdex, UX Outliers)

- Review Apdex thresholds per application; adjust tolerating and frustrating thresholds to avoid false alerts.
- Use custom action naming and properties so related actions are grouped consistently for Apdex scoring. [[CSP]]
- Use *User sessions > Anomalies* to identify outlier users, devices, and geo segments quickly.

---

## Synthetic Monitoring

### 7.1 Monitors Failing

- Configure outage handling (global versus location-specific), retry rules, excluded HTTP codes, and performance thresholds immediately after creation. [[SYNTH]]
- Use *Synthetic details > Analyze executions* for waterfall charts and screenshots.
- Align alerting profiles and maintenance windows with SLAs to minimise noise.

### 7.2 Monitors Not Running

- Check suppression reasons: maintenance windows, private-location capacity, missing browser capabilities.
- Review monitor status messages and align location and device profiles with test requirements.

---

## Reference Snippets & Checklists

### A. Minimal CSP Allowances for Web RUM

```http
# Example - extend your existing policy
Content-Security-Policy:
  script-src 'self' https://js-cdn.dynatracelabs.com 'unsafe-inline';
  connect-src 'self' https://<your-beacon-host>;
```

- Use `'self'` when RUM code is injected by OneAgent.
- Include the CDN host (`https://js-cdn.dynatracelabs.com`) when using the Dynatrace-served snippet.
- Add your beacon host to `connect-src`. Configure the beacon-origin allowlist for cross-origin beacons. [[CSP]] [[CORS]]

### B. Beacon Endpoint Choices (Web)

- **Default:** OneAgent-hosted endpoints (`/rb_`).
- **Alternatives:** Re-prefix beacons or send directly to Dynatrace SaaS or ActiveGate; adjust CORS accordingly. [[BEACON]]

### C. Android Hybrid Session Merge (Example)

```groovy
dynatrace {
  configurations {
    releaseConfig {
      hybridWebView {
        enabled true
        httpsDomains '.yourdomain.com', '.sub.yourdomain.com'
      }
    }
  }
}
```

Ensures IDs align so native and web traffic merges into a single hybrid session. [[HYBRID]]

### D. Control SPA Load End via `dtrum`

- Use `dtrum.signalOnLoadStart()` / `signalOnLoadEnd()` with `setLoadEndManually()` to align SPA action durations with actual interactivity. [[DTRUM]]

---

## Source Index

- Health Check and diagnostics: [[HC]]
- Auto-injection rules, snippets, and cache-control: [[AUTO]]
- Beacon routing and SaaS/ActiveGate options: [[BEACON]]
- Beacon origin allowlist (CORS): [[CORS]]
- RUM customisation and CSP guidance: [[CSP]]
- RUM JavaScript tracks and browser coverage: [[VERSIONS]]
- RUM cookies: [[COOKIES]]
- `dtrum` JavaScript API: [[DTRUM]]
- Android instrumentation: [[ANDROID]]
- iOS instrumentation: [[IOS]]
- Hybrid WebView configuration: [[HYBRID]]
- Synthetic configuration, analysis, and alerting: [[SYNTH]]

---

[HC]: https://docs.dynatrace.com/docs/observe/digital-experience/web-applications/troubleshoot/health-check
[AUTO]: https://docs.dynatrace.com/docs/observe/digital-experience/web-applications/setup-and-configuration
[BEACON]: https://docs.dynatrace.com/docs/observe/digital-experience/web-applications/traffic-management
[CORS]: https://docs.dynatrace.com/docs/observe/digital-experience/web-applications/setup-and-configuration/cors-settings
[CSP]: https://docs.dynatrace.com/docs/observe/digital-experience/web-applications/setup-and-configuration/content-security-policy
[VERSIONS]: https://docs.dynatrace.com/docs/observe/digital-experience/web-applications/setup-and-configuration/javascript-versions
[COOKIES]: https://community.dynatrace.com/t5/Real-User-Monitoring/Dynatrace-Cookies-and-User-Session-Correlation/ba-p/168080
[DTRUM]: https://www.dynatrace.com/support/doc/javascriptapi/doc/interfaces/dtrum-types.DtrumApi.html
[ANDROID]: https://docs.dynatrace.com/docs/extend-dynatrace/mobile-monitoring/android/instrumentation
[IOS]: https://docs.dynatrace.com/docs/extend-dynatrace/mobile-monitoring/ios/instrumentation
[HYBRID]: https://docs.dynatrace.com/docs/extend-dynatrace/mobile-monitoring/android/hybrid-support
[SYNTH]: https://docs.dynatrace.com/docs/observe/digital-experience/synthetic-monitoring
