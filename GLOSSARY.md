# 📖 **Dynatrace DEM Glossary (55+ Terms)**

A comprehensive glossary of Digital Experience Monitoring (DEM) terms for Dynatrace CSKO26 Bengaluru.

## 📋 Table of Contents

- [Core Concepts](#core-concepts)
- [Applications & Sessions](#applications--sessions)
- [Errors](#errors)
- [User Data Enrichment](#user-data-enrichment)
- [Performance Metrics](#performance-metrics) 
- [Tools & Traces](#tools--traces)
- [Instrumentation](#instrumentation)
- [Synthetic Monitoring Components](#synthetic-monitoring-components)
- [Troubleshooting & Analysis](#troubleshooting--analysis)
- [Mobile DEM](#mobile-dem)
- [Advanced DEM](#advanced-dem)
- [Additional/Refined Terms](#additionalrefined-terms)

---

## Core Concepts

**Digital Experience Monitoring (DEM)**  
An umbrella category in Dynatrace that includes **Real User Monitoring (RUM)**, **Synthetic Monitoring**, and **Session Replay**. DEM measures how end users actually experience your applications — both real and simulated.

**RUM (Real User Monitoring)**  
Passive monitoring of **real users interacting** with web and mobile apps. It tracks load times, errors, user actions, geographies, devices, and Core Web Vitals to show how users perceive performance.

**Synthetic Monitoring**  
Active monitoring that uses **robotic scripts (synthetic monitors)** to simulate user behavior from chosen locations. It tests availability and performance proactively even when no real users are online.

---

## Applications & Sessions

**Application (RUM context)**  
A logical container in Dynatrace representing a monitored web or mobile application. Configures domains, injection, properties, and rules for user actions.

**User Session**  
A continuous sequence of user actions from a single user. Begins with the first captured action, ends with inactivity, or after a timeout (default ~35 min).

**User Action**  
A single measurable interaction within a session. Examples: page load, button click, or API request.

**Load Action**  
A user action representing a full page load or navigation. Includes DOM load, resource timings, and Core Web Vitals.

**XHR Action (AJAX/FETCH Action)**  
A user action triggered by background requests (XHR or Fetch API). Tracks asynchronous communication without full reloads.

**Custom Action**  
A user action defined manually (via JS API or configuration). Useful when interactions don't trigger network calls (e.g., opening a modal).

**Conversion Goals**  
Business KPIs defined in Dynatrace (e.g., checkout complete, login success). Measured across sessions and funnels.

---

## Errors

**Errors (in DEM)**  
Any user-visible failure detected in the frontend: failed requests, JS runtime errors, custom-defined errors.

**Request Error**  
API/XHR call that returns HTTP 4xx/5xx or fails due to timeout/network issues.

**JavaScript Errors**  
Browser-side runtime errors (e.g., `TypeError: undefined is not a function`).

**Custom Errors**  
Application-defined errors captured via RUM JS API, e.g., form validation errors.

**Mobile Application Crashes**  
Sudden termination of a mobile app captured by the Dynatrace mobile agent SDK. Includes stack traces and device metadata.

---

## User Data Enrichment

**User Action Properties**  
Custom metadata added to user actions (e.g., product ID, cart value).

**User Session Properties**  
Metadata tied to entire sessions (e.g., account type, region, subscription tier).

**User Tagging**  
Mapping session/user to real identities (e.g., username, email) instead of anonymous IDs.

---

## Performance Metrics

**W3C Timings**  
Browser-provided metrics for page lifecycle events (DNS lookup, TCP handshake, first byte, DOM load, etc.).

**Core Web Vitals**  
Standard Google metrics for user experience:

- **LCP (Largest Contentful Paint)** → load speed
- **FID (First Input Delay)** → responsiveness
- **CLS (Cumulative Layout Shift)** → visual stability

**Apdex (Application Performance Index)**  
A user satisfaction metric based on response times vs. defined thresholds.

**Milestone Metrics**  
Timestamps during page load or XHR execution: navigation start, DOM interactive, first byte, etc.

---

## Tools & Traces

**HAR File (HTTP Archive)**  
A browser-exported file containing request/response data for a page load. Used for troubleshooting load times.

**Fiddler Trace**  
Network capture file from Fiddler (HTTP debugging proxy). Helps analyze backend vs. frontend issues.

**PWAs (Progressive Web Apps)**  
Web applications with native-like behavior (offline, installable). Require special handling for RUM injection.

**Session Replay**  
Visual replay of real user sessions, including clicks, scrolls, and DOM changes. Helps troubleshoot UX issues.

---

## Instrumentation

**JS Injection**  
Automatic insertion of the RUM JS agent into HTML responses (via OneAgent) to capture frontend activity.

**JS Tag (Manual Injection)**  
A snippet added manually to `<head>` of pages when auto-injection isn't possible (e.g., CDN-hosted apps).

**Synthetic Tags**  
Metadata labels added to synthetic monitors for grouping and filtering.

---

## Synthetic Monitoring Components

**VU Controller (Virtual User Controller)**  
Orchestrates execution of synthetic test scripts (browser or HTTP monitors).

**VU Player (Virtual User Player)**  
Executes browser-based synthetic scripts step by step (like a robot simulating a real user).

**Browser Monitors**  
Synthetic monitors that launch a real browser to simulate user journeys (multi-step navigations, form fills).

**HTTP Monitors (API Monitors)**  
Lightweight monitors that send HTTP(S) requests to check API availability, latency, and response codes.

**Network Monitors**  
Synthetic probes that measure network performance, routing delays, packet loss, and availability from specific locations.

---

## Troubleshooting & Analysis

**RUM Overload Protection**  
Mechanism that limits max user actions per minute during spikes to prevent system overload.

**Session Splitting**  
Automatic breaking of sessions exceeding 200 actions into multiple sessions.

**Beacon**  
A data packet sent by the RUM JS agent to Dynatrace cluster containing user action/session info.

**CDN Monitoring**  
Special handling to track performance when pages are served via Content Delivery Networks.

**CORS Issues**  
When frontend beacon or XHR fails due to cross-origin restrictions.

**CSP (Content Security Policy)**  
Browser security headers that may block RUM JS agent unless configured.

---

## Mobile DEM

**Mobile RUM SDK**  
Dynatrace SDK for iOS/Android apps that captures crashes, user actions, and network calls.

**Mobile Custom Events**  
Developer-defined actions in mobile apps (e.g., "Transfer Money" button press).

**App Version Tracking**  
Ability to segment performance by app version/build.

**Device Context**  
Metadata about OS, device model, orientation, connectivity (Wi-Fi/4G).

---

## Advanced DEM

**Business Events (BizEvents)**  
Stream of business KPIs captured in DEM context (purchases, failures, cart abandonments).

**Synthetic Locations**  
Global points-of-presence where Dynatrace synthetic tests run.

**Geo Heatmaps**  
Visualization of performance by geographic regions.

**User Flow Visualization**  
Session Flow chart showing how users navigate between actions.

**Error Rate Metrics**  
Aggregated percentage of failed actions vs. total actions.

**Bounce Rate**  
Sessions where users perform only a single action before leaving.

**First Party vs Third Party Resources**  
Classification of monitored content — owned by you vs. loaded from external services.

**JS API (`dtrum`)**  
Dynatrace-provided API for custom instrumentation (enter/leave action, report errors, add properties).

**Sampling**  
Limiting the number of sessions captured to manage license and performance impact.

**Session Timeout**  
Configurable limit for inactivity duration before a session is considered closed (default 35 min).

**Synthetic Recorder (Dynatrace Recorder)**  
A Chrome extension for recording multi-step synthetic tests.

---

## Additional/Refined Terms

**Instrumentation (Enhanced Definition)**  
The act of embedding or enabling telemetry code (JS agent, SDK, hooks) into applications so that monitoring data can be collected. Without proper instrumentation, RUM or traces don't capture. Dynatrace may use OneAgent, JS injection, or SDKs.

**New RUM Experience / Grail Storage**  
Dynatrace's newer ingestion path for RUM where data is stored in **Grail** rather than "classic" storage. It provides more flexibility, unified data model, newer APIs, and scalability.

**View (Mobile / New RUM)**  
In mobile / new RUM, a "view" is analogous to a screen or window presented to the user. It helps contextualize transitions between views/screens, measure view load times, and associate errors/crashes to specific views.

**ANR (Application Not Responding)**  
A specific mobile error state where the app's main thread is blocked/responding slowly causing the OS to warn or kill the app. In the new RUM experience, Dynatrace can automatically capture ANR errors (Android 11+).

**Native Crash Reporting (Mobile)**  
Crashes originating from native code (e.g. C/C++ in Android NDK) are captured if the app restarts within a window (e.g. 10 minutes). This supplements standard crash and exception capture.

**IdentifyUser / User Identification API**  
A function provided by Dynatrace (via RUM JS or mobile SDK) that lets you map anonymous user sessions to a known user ID (e.g. "user123"). That way, you can tie multiple sessions/devices to the same user.

**Business Events (Biz Events) - Enhanced**  
Events representing business-level actions (e.g. purchase, signup) captured in Dynatrace. These are distinct from purely technical events; they help bridge business metrics with observability.

**OpenTelemetry / OTLP / Propagators**  
OpenTelemetry (often abbreviated OTel) is a standard framework for instrumentation across metrics, traces, and logs. OTLP is the protocol used to send such data. In Dynatrace, you can ingest OpenTelemetry data.

**Semantic Dictionary / Global Fields**  
Dynatrace's internal standardized field names (e.g. `timestamp`, common dimension names) used across logs, events, spans, metrics, etc. It ensures consistency in how data is referred to and correlated.

**Trace / Distributed Trace**  
A trace is a recorded path of a request through multiple services—each step is a *span*. In a distributed microservices architecture, a single user-facing request may spawn multiple downstream service calls, and dynatrace stitches that into a distributed trace.

**Davis Event / Problem / Root Cause (Davis AI)**  
Dynatrace's AI engine, **Davis**, raises events/problems when anomalies are detected (errors, slowdowns). These events are categorized (severity, type). Participants often confuse "event" with "user action error" — but Davis events are platform-level.

**Configuration API (RUM / Dynatrace API)**  
APIs to programmatically control RUM settings (beacon domains, application detection rules, etc.). Useful for automating deployments and managing environments.

**Allowed Beacon Domains**  
A RUM configuration that restricts which domains can receive beacon traffic from front ends. If your beacon domain doesn't match this whitelist, data won't reach Dynatrace. Part of configuration API.

**Content Security Policy (CSP) / Traceparent header / Beacon blocking**  
Security policies or missing HTTP headers (like `traceparent`) or firewall rules can block RUM beacon traffic. When enabling new RUM, you must ensure headers like `traceparent` are allowed.

**Maximum User Action Duration / Clipping**  
Dynatrace enforces limits on how long a user action is kept open. For example, web user actions are capped (if too long, they'll close or get clipped). The documentation shows web max durations.

---

## References

This glossary contains enhanced definitions and additional terms compiled from official Dynatrace documentation and best practices for Digital Experience Monitoring workshops and training sessions.

**Last updated:** October 2025
