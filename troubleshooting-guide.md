# 🔧 **Comprehensive Troubleshooting Guide for Dynatrace DEM**

A complete guide for diagnosing and resolving Digital Experience Monitoring issues in Dynatrace.

## 📋 Table of Contents

- [1. RUM Data Collection Issues](#1-rum-data-collection-issues)
  - [1.1 RUM script injected, but no data visible in Dynatrace](#11-rum-script-injected-but-no-data-visible-in-dynatrace)
  - [1.2 Data reported in DevTools, but not visible in Dynatrace UI](#12-data-reported-in-devtools-but-not-visible-in-dynatrace-ui)
  - [1.3 User sessions missing for certain users](#13-user-sessions-missing-for-certain-users)
- [2. Mobile Monitoring Challenges](#2-mobile-monitoring-challenges)
  - [2.1 Cordova / Hybrid app session splitting](#21-cordova--hybrid-app-session-splitting)
  - [2.2 Mobile SDK crashes / ANRs not reported](#22-mobile-sdk-crashes--anrs-not-reported)
- [3. Instrumentation & Compatibility](#3-instrumentation--compatibility)
  - [3.1 Injection types (auto, manual, tag manager)](#31-injection-types-auto-manual-tag-manager)
  - [3.2 Unsupported technologies / frameworks](#32-unsupported-technologies--frameworks)
- [4. Data Completeness & Correlation](#4-data-completeness--correlation)
  - [4.1 Missing actions (esp. custom APIs)](#41-missing-actions-esp-custom-apis)
  - [4.2 Front-end to back-end correlation failures](#42-front-end-to-back-end-correlation-failures)
- [5. Quality & Metrics](#5-quality--metrics)
  - [5.1 Low Apdex despite "everything looks fine"](#51-low-apdex-despite-everything-looks-fine)
- [6. Synthetic Monitoring](#6-synthetic-monitoring)
  - [6.1 Synthetic browser monitor works locally, fails when deployed](#61-synthetic-browser-monitor-works-locally-fails-when-deployed)
  - [6.2 HTTP/API monitors failing randomly](#62-httpapi-monitors-failing-randomly)
- [7. General Troubleshooting Checklist](#7-general-troubleshooting-checklist)
- [Summary](#-summary)

---

## **1. RUM Data Collection Issues**

### **1.1 RUM script injected, but no data visible in Dynatrace**

* **Symptoms:** Script present in HTML (`ruxitagentjs` or via tag manager), but no sessions appear.
* **Root Causes:**

  * Beacon requests blocked (firewall, proxy, CSP headers).
  * Application domain not mapped in Dynatrace Application detection rules.
  * Auto-injection disabled for process group.
* **Troubleshooting:**

  * **Browser DevTools → Network tab**: Look for `rb_data` or `rum` beacon calls. If missing → injection failed.
  * **Validate script order**: RUM script must load early (in `<head>`) before other scripts.
  * **Check CSP headers**: Ensure `*.dynatrace.com` or AG domain is whitelisted in `script-src` and `connect-src`.
  * **Check Tenant URL**: Beacon must point to correct cluster URL (`/rb_bf`, `/rb_data`).

---

### **1.2 Data reported in DevTools, but not visible in Dynatrace UI**

* **Symptoms:** Beacons visible in browser, Dynatrace UI empty.
* **Root Causes:**

  * Wrong environment ID (script from different tenant).
  * Application ID mismatch in config.
  * RUM disabled for that application.
  * Session sampling set to 0%.
* **Troubleshooting:**

  * Inspect beacon payload → check `app=<id>` and `srvid`.
  * Cross-verify Application ID in **Dynatrace console**.
  * Validate *Application Settings → Capturing* (sampling % > 0).

---

### **1.3 User sessions missing for certain users**

* **Symptoms:** Specific users report issues, but no sessions captured.
* **Root Causes:**

  * **IP filters** exclude internal traffic.
  * **Privacy opt-out** or DNT header.
  * **Session split** due to high actions (>200 actions/session).
* **Troubleshooting:**

  * Check **Application settings → Session & user action settings** → Exclusion filters.
  * Search logs for “session split” events.
  * If only HNI/VIP sessions → consider enabling **Selective RUM (via tagging + capture rules)**.

---

---

## **2. Mobile Monitoring Challenges**

### **2.1 Cordova / Hybrid app session splitting**

* **Symptoms:** One logical session appears as multiple smaller sessions.
* **Root Causes:**

  * WebView doesn’t share correlation context.
  * Dynatrace SDK not bridging JS → native boundary.
* **Troubleshooting:**

  * Upgrade Dynatrace Cordova plugin to latest version.
  * Ensure WebView instrumentation enabled in config.
  * Manually propagate correlation header (`x-dynatrace`) in hybrid HTTP calls.

---

### **2.2 Mobile SDK crashes / ANRs not reported**

* **Symptoms:** Crash visible on device, missing in Dynatrace.
* **Root Causes:**

  * SDK not initialized early (before `onCreate` in Android, `AppDelegate` in iOS).
  * Native crash reporting not enabled (NDK/iOS symbolication missing).
* **Troubleshooting:**

  * Validate SDK init order.
  * Check **Crash reports tab** in Dynatrace → enable **NDK/ANR capture**.
  * Run test crash → confirm ingestion.

---

---

## **3. Instrumentation & Compatibility**

### **3.1 Injection types (auto, manual, tag manager)**

* **Troubleshooting Path:**

  * **Auto-injection (OneAgent):**

    * Ensure OneAgent installed on web server → check Process group settings → `Enable RUM injection`.
    * For CDN-hosted static content → auto-injection won’t work → switch to manual.
  * **Manual snippet:**

    * Copy snippet from Application settings.
    * Place in `<head>` above all scripts.
  * **Tag Manager (e.g., GTM):**

    * Load Dynatrace script synchronously, not async.
    * Ensure no duplicate injection.

---

### **3.2 Unsupported technologies / frameworks**

* **Examples:** Electron, React Native WebView, Angular wrappers, custom fetch libraries.
* **Symptoms:** User actions/API calls not showing.
* **Troubleshooting:**

  * Use **`dtrum` JS API**:

    ```js
    var action = dtrum.enterAction("Validate Card API");
    fetch('/api/payment/validateCard').finally(() => dtrum.leaveAction(action));
    ```
  * For React Native/Electron → use Dynatrace SDK + OpenTelemetry bridge.
  * Use **custom properties** to enrich sessions when default capture is insufficient.

---

---

## **4. Data Completeness & Correlation**

### **4.1 Missing actions (esp. custom APIs)**

* **Troubleshooting:**

  * Check if XHR/fetch capturing is enabled → *Application settings → Advanced setup*.
  * For Axios/GraphQL → wrap with `dtrum.enterAction()`.
  * Verify beacon size limit → >150KB payloads may drop.

---

### **4.2 Front-end to back-end correlation failures**

* **Symptoms:** RUM shows action, backend traces missing.
* **Root Causes:**

  * Correlation headers stripped by proxy/CDN (e.g., `x-dynatrace`, `traceparent`).
  * Backend not monitored (no OneAgent / no OTLP ingestion).
* **Troubleshooting:**

  * Browser DevTools → Inspect request headers → check `x-dynatrace` / `traceparent`.
  * If missing in server logs → proxy is stripping → whitelist headers.
  * Ensure backend services monitored by OneAgent or connected via **OpenTelemetry ingestion**.

---

---

## **5. Quality & Metrics**

### **5.1 Low Apdex despite “everything looks fine”**

* **Troubleshooting:**

  * Verify **Apdex thresholds** (default: Satisfied ≤ 3s, Tolerating ≤ 12s). Adjust per SLA.
  * Check for **outlier sessions** dragging score down (one 120s action can skew).
  * Validate if background/technical actions are included → exclude non-business actions from Apdex calc.
  * Align Apdex with **Core Web Vitals (LCP, FID, CLS)** for UX realism.

---

---

## **6. Synthetic Monitoring**

### **6.1 Synthetic browser monitor works locally, fails when deployed**

* **Troubleshooting:**

  * Check if target URL is publicly reachable from Dynatrace synthetic locations.
  * Verify login credentials and tokens are correctly parameterized (don’t hardcode).
  * Add **dynamic wait conditions** (`Wait for element visible`) instead of static sleeps.
  * Whitelist Dynatrace synthetic agent IPs in firewalls.
  * Re-record if app selectors (DOM) changed post-deployment.

---

### **6.2 HTTP/API monitors failing randomly**

* **Troubleshooting:**

  * Validate response code expectations.
  * Check if API needs auth token → use **credential vault** in Dynatrace.
  * Confirm SSL certificate trust chain → add custom CA if needed.
  * Check proxy/geo routing from synthetic location.

---

---

## **7. General Troubleshooting Checklist**

1. **Check Injection** → Is script present? Is it in `<head>`? Auto vs. manual?
2. **Check Beacon** → Are beacon calls (`rb_data`) visible? Reaching cluster? Correct env ID?
3. **Check Filters** → Any IP/user-agent/domain exclusions applied?
4. **Check Correlation** → Are headers (`x-dynatrace`, `traceparent`) intact?
5. **Check Backend** → Is OneAgent/OTLP present to stitch traces?
6. **Check Sampling** → Any aggressive sampling dropping sessions?
7. **Check Security** → CSP, firewalls, proxies blocking injection/beacons?
8. **Check Thresholds** → Apdex and Core Web Vitals aligned with business SLAs?
9. **Check SDKs** → For mobile/hybrid apps, SDKs initialized early and updated?
10. **Check Synthetic** → Public accessibility, credentials, waits, whitelisting.

---

# ✅ **Summary**

This guide covers **end-to-end troubleshooting for DEM**:

* **RUM injection & beacon issues**
* **Session gaps & sampling**
* **Mobile SDK & hybrid app quirks**
* **Action capture & correlation**
* **Apdex & quality anomalies**
* **Synthetic browser/API monitor pitfalls**

