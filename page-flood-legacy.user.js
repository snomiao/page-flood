// ==UserScript==
// @name        Page Flood
// @namespace   snomiao@gmail.com
// @match       http://*/*
// @match       https://*/*
// @grant       none
// @version     1.0.0
// @author      snomiao@gmail.com
// @description Press Shift+Alt+Q to batch open links in the main list in a page.
// ==/UserScript==

main();

function main() {
  globalThis.PageFloodController?.abort();
  const ac = (globalThis.PageFloodController = new AbortController());
  window.addEventListener(
    "keydown",
    async (e) => {
      // e.altKey && getMainListLinks()
      if (e.shiftKey && e.altKey && e.code == "KeyQ") await openLinksInList();
    },
    { signal: ac.signal }
  );
}

function openDeduplicatedUrl(url) {
  const opened = (globalThis.openDeduplicatedUrl_opened ??= new Set());
  return opened.has(url) || (window.open(url, "_blank") && opened.add(url));
}

async function openLinksInList() {
  return await openLinks(getMainListLinks());
}
function $$(...args) {
  return [...document.querySelectorAll(...args)];
}
function maxRect(rects) {
  return {
    left: Math.min(...rects.map((e) => e.left)),
    top: Math.min(...rects.map((e) => e.top)),
    right: Math.max(...rects.map((e) => e.right)),
    bottom: Math.max(...rects.map((e) => e.bottom)),
  };
}
function area({ left, right, top, bottom }) {
  return (right - left) * (bottom - top);
}

function elpath(e, path = "") {
  return !e
    ? path.trim()
    : e.tagName.match(/^h\d$/i)
    ? e.tagName
    : elpath(
        e.parentElement,
        e.tagName +
          [...e.classList]
            .filter((e) => e.match(/^[a-z-]+$/))
            .map((e) => "." + e)
            .join("") +
          " " +
          path
      );
}
// const elpath = function elpath(e){return !e?'': (elpath(e.parentElement) + ' ' + e.tagName).trim('')}
function getDuplicates(list) {
  return new Set(
    Object.entries(Object.groupBy(list, (e) => e)).flatMap(([text, list]) =>
      text && list.length > 1 ? [text] : []
    )
  );
}
function getExcludeFilter(set, fn) {
  return (elem) => !set.has(fn(elem));
}
function removeDuplicateLinks(links) {
  return links.filter(
    getExcludeFilter(
      getDuplicates(links.map((e) => e.textContent)),
      (e) => e.href
    )
  );
}
function getLinkGroups() {
  return Object.groupBy(
    removeDuplicateLinks(
      $$("a").map((e) => (false && (e.style.background = "green"), e))
    ),
    (e) => elpath(e)
  );
}
function peekLog(e) {
  return console.log(e), e;
}
function groupEncolor([path, links]) {
  return (
    ((color) => links.map((a) => false && (a.style.background = color)))(
      "#" +
        Math.random().toString(16).slice(2, 8).padStart(6, "0") +
        Math.floor(256 * 0.995 ** path.length)
          .toString(16)
          .padStart(2, "0")
    ),
    peekLog([path, links])
  );
}

function getLinksLists() {
  const compareFn = (fn) => (a, b) => fn(a) - fn(b);
  return [getLinkGroups()]
    .flatMap(Object.entries)
    .map(groupEncolor)
    .map(([path, list]) => ({
      path,
      list,
      area: area(maxRect(list.map((a) => a.getBoundingClientRect()))),
    }))
    .toSorted(compareFn((e) => -e.area));
}

function getMainListLinks() {
  return getLinksLists()[0].list.map(
    (e) => (false && (e.style.background = "yellow"), e)
  );
}

async function openLinks(links) {
  // max 8 page on 1 origin once batch
  // max 16 page on all origin once batch
  const urlss = Object.values(
    Object.groupBy(links, (url, i) => String(Math.floor(i / 8)))
  );
  for await (const urls of urlss) {
    urls.toReversed().map(openDeduplicatedUrl);
    await new Promise((r) => setTimeout(r, 1e3)); // 1s cd
    await new Promise((r) =>
      document.addEventListener("visibilitychange", r, { once: true })
    ); // wait for page visible
  }
  // await Promise.all(Object.entries(Object.groupBy(links, e => e.origin)).map(async ([origin, links]) => {
  //   const urls = links.map(e => e.href)
  //   const urlss = Object.values(Object.groupBy(urls, (url, i) => String(Math.floor(i / 8))))
  //   for await (const urls of urlss) {
  //     urls.toReversed().map(openUrl)
  //     await new Promise(r => setTimeout(r, 1e3)) // 1s cd
  //     await new Promise(r => document.addEventListener("visibilitychange", r, { once: true })) // wait for page visible
  //   }
  // }))
}

// getMainListLinks()
