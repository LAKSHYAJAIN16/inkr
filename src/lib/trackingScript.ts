// This file contains the tracking script that will be injected into the iframe

export const TRACKING_SCRIPT = `
// Track navigation
const pushState = history.pushState;
const replaceState = history.replaceState;

function notifyPageView() {
  window.parent.postMessage({
    type: 'pageview',
    url: window.location.href,
    title: document.title
  }, '*');
}

// Override history methods to track navigation
history.pushState = function() {
  pushState.apply(history, arguments);
  notifyPageView();    
};

history.replaceState = function() {
  replaceState.apply(history, arguments);
  notifyPageView();
};

// Track back/forward navigation
window.addEventListener('popstate', notifyPageView);

// Track clicks
document.addEventListener('click', (e) => {
  const target = e.target;
  window.parent.postMessage({
    type: 'click',
    x: e.clientX,
    y: e.clientY,
    target: target?.tagName || 'unknown',
    button: e.button,
    clickCount: e.detail
  }, '*');
}, true);

// Track scroll
document.addEventListener('scroll', (e) => {
  window.parent.postMessage({
    type: 'scroll',
    x: window.scrollX,
    y: window.scrollY
  }, '*');
}, { passive: true });

// Track form inputs
document.addEventListener('input', (e) => {
  const target = e.target;
  window.parent.postMessage({
    type: 'input',
    value: target.value,
    target: target.tagName
  }, '*');
});

// Initial page load
notifyPageView();
`;
