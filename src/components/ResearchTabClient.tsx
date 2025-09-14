"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { KeyPressDebug } from "./KeyPressDebug";

// --- Types ---
interface ResearchActivity {
  id: string;
  timestamp: string;
  type: string;
  data: any;
}
interface ResearchSession {
  id: string;
  activities: ResearchActivity[];
}
interface PageVisit {
  url: string;
  title?: string;
  timestamp: string;
  timeSpent: number;
  keyPresses: Array<{
    key: string;
    code: string;
    timestamp: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
  }>;
  interactions: Array<{
    type:
      | "click"
      | "scroll"
      | "input"
      | "navigation"
      | "keydown"
      | "search"
      | "focus"
      | "blur"
      | "keypress"
      | "mousemove";
    timestamp: string;
    details?: any;
  }>;
}

// --- Minimal Tracking Script injected into iframe ---
const TRACKING_SCRIPT = `
<script>
  function notifyPageView() {
    window.parent.postMessage({
      type: 'pageview',
      url: window.location.href,
      title: document.title
    }, '*');
  }

  // Track history navigation
  const pushState = history.pushState;
  const replaceState = history.replaceState;
  history.pushState = function() { pushState.apply(history, arguments); notifyPageView(); };
  history.replaceState = function() { replaceState.apply(history, arguments); notifyPageView(); };
  window.addEventListener('popstate', notifyPageView);

  // Track clicks
  document.addEventListener('click', (e) => {
    window.parent.postMessage({
      type: 'click',
      x: e.clientX,
      y: e.clientY,
      target: e.target?.tagName || 'unknown'
    }, '*');
  }, true);

  // Track keydown
  document.addEventListener('keydown', (e) => {
    window.parent.postMessage({
      type: 'keydown',
      key: e.key,
      code: e.code,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey
    }, '*');
  });

  // Track input
  document.addEventListener('input', (e) => {
    const t = e.target || {};
    window.parent.postMessage({
      type: 'input',
      value: t.value,
      target: t.tagName
    }, '*');
  });

  // Track scroll
  document.addEventListener('scroll', () => {
    window.parent.postMessage({
      type: 'scroll',
      x: window.scrollX,
      y: window.scrollY
    }, '*');
  });

  // Initial page view
  notifyPageView();
</script>
`;

const ResearchTabClient = () => {
  // --- State ---
  const [currentSession, setCurrentSession] = useState<ResearchSession>({
    id: "session_1",
    activities: [],
  });
  const [isMonitoring] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com/webhp?igu=1");
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);

  // --- Refs ---
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sessionStartTime = useRef(new Date());
  const currentPageStart = useRef(new Date());
  const activityBuffer = useRef<ResearchActivity[]>([]);
  const currentPageIndex = useRef(-1);

  // --- Activity Logger ---
  const logActivity = useCallback(
    (activity: Omit<ResearchActivity, "id" | "timestamp">) => {
      if (!currentSession || !isMonitoring) return;
      const newActivity: ResearchActivity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...activity,
      };
      activityBuffer.current.push(newActivity);
      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              activities: [...prev.activities, newActivity],
            }
          : prev
      );
    },
    [currentSession, isMonitoring]
  );

  // --- Page Visit ---
  const handlePageVisit = (url: string, title?: string) => {
    const now = new Date();

    setPageVisits((prev) => {
      const updated = [...prev];
      // update time on last page
      if (currentPageIndex.current >= 0) {
        updated[currentPageIndex.current] = {
          ...updated[currentPageIndex.current],
          timeSpent: now.getTime() - currentPageStart.current.getTime(),
        };
      }
      // new page
      const newVisit: PageVisit = {
        url,
        title,
        timestamp: now.toISOString(),
        timeSpent: 0,
        keyPresses: [],
        interactions: [],
      };
      currentPageIndex.current = updated.length;
      currentPageStart.current = now;
      return [...updated, newVisit];
    });

    setCurrentUrl(url);
    logActivity({ type: "navigation", data: { url, title } });
  };

  // --- Interaction ---
  const handleInteraction = (
    type: PageVisit["interactions"][0]["type"],
    details: any
  ) => {
    const ts = new Date().toISOString();
    setPageVisits((prev) => {
      const updated = [...prev];
      if (currentPageIndex.current >= 0) {
        const visit = { ...updated[currentPageIndex.current] };
        visit.interactions.push({ type, timestamp: ts, details });
        if (type === "keydown") {
          visit.keyPresses.push({
            key: details.key,
            code: details.code,
            timestamp: ts,
            ctrlKey: details.ctrlKey,
            shiftKey: details.shiftKey,
            altKey: details.altKey,
            metaKey: details.metaKey,
          });
        }
        updated[currentPageIndex.current] = visit;
      }
      return updated;
    });
    logActivity({ type, data: details });
  };

  // --- Unified Message Listener ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data?.type) return;

      if (data.type === "pageview") handlePageVisit(data.url, data.title);
      if (data.type === "click") handleInteraction("click", data);
      if (data.type === "keydown") handleInteraction("keydown", data);
      if (data.type === "scroll") handleInteraction("scroll", data);
      if (data.type === "input") handleInteraction("input", data);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // --- Build iframe content ---
  const safeUrl = currentUrl.replace(/'/g, "\\'");
  const safeDisplayUrl = currentUrl.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        ${TRACKING_SCRIPT}
      </head>
      <body>
        <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f5f5f5;">
          <div style="text-align:center;padding:2rem;background:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h2>Loading Content</h2>
            <p>Redirecting to: ${safeDisplayUrl}</p>
          </div>
        </div>
        <script>
          try {
            window.location.href = '${safeUrl}';
          } catch (err) {
            console.error('Error redirecting:', err);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <div className="h-screen bg-white relative overflow-hidden">

      {/* Main Content */}
      <iframe
        ref={iframeRef}
        srcDoc={iframeContent}
        className="absolute inset-0 w-full h-full border-0"
        title="Browser Content"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
      />
      <KeyPressDebug />
    </div>
  );
};

export default ResearchTabClient;
