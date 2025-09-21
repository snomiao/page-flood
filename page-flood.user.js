// ==UserScript==
// @name        Page Flood
// @namespace   snomiao@gmail.com
// @match       http://*/*
// @match       https://*/*
// @grant       none
// @version     2.0.0
// @author      snomiao@gmail.com
// @description Press Shift+Alt+Q to batch open links in the main list in a page. Handy when you want to quick explore all google search results or visit all details pages in a list page.
// ==/UserScript==

// - get all links
// - get features for each link
// - group similar links
// - get score for groups
// - sort groups by score
// - pick the best group
// - open links in the best group


main();

function main() {
  globalThis.PageFloodController?.abort();
  const ac = (globalThis.PageFloodController = new AbortController());
  window.addEventListener(
    "keydown",
    async (e) => {
      if (e.shiftKey && e.altKey && e.code == "KeyQ") await openLinksInList();
    },
    { signal: ac.signal }
  );
}
async function openLinksInList() {
  console.log(getMainListLinks());
  return await openLinks(getMainListLinks());
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

function openDeduplicatedUrl(url) {
  const opened = (globalThis.openDeduplicatedUrl_opened ??= new Set());
  return opened.has(url) || (window.open(url, "_blank") && opened.add(url));
}
console.log(getMainListLinks())
function getMainListLinks() {
  return [{ sel: "a" }]
    .map((e) => ({ ...e, list: [...document.querySelectorAll(e.sel)] }))
    .map((e) => ({
      ...e,
      vec: e.list.map((el) => [
        elementDepth(el),
        el.parentElement?.getBoundingClientRect().width,
        el.parentElement?.getBoundingClientRect().height,
      ]),
    }))
    .map((e) => ({ ...e, nor: normalize(e.vec) }))
    .map((e) => ({ ...e, grp: groupByCosineSimilarity(e.nor, 0.99) }))
    .map((e) => ({ ...e, grp: e.grp.map((g) => g.map((i) => e.list[i])) }))
    .map((e) => ({
      ...e,
      grpWithArea: e.grp
        .map((g) => ({
          links: g,
          area: area(maxRect(g.map((el) => el.getBoundingClientRect()))),
          areaSum: g
            .map((el) => area(el.getBoundingClientRect()))
            .reduce((a, b) => a + b, 0),
        }))
        .map((g) => ({ ...g, score: Math.log(g.area * g.areaSum) }))
        .toSorted(compareBy((g) => -g.score)),
    }))
    .map((e) => (console.log(e.grpWithArea), { ...e }))
    .map((e) => ({
      ...e,
      _: e.grpWithArea
        .slice(0, 1)
        .map((grp, i, a) =>
          grp.links.map((el) =>
            flashColor(el, getOklch(i / a.length), 500 + (a.length - i) * 500)
          )
        ),
    }))
    .map((e) =>
      e.grpWithArea
        .at(0)
        .links.map(a=>a.href)
    )
    .at(0);
}

function getOklch(t) {
  const l = 0.9 - 0.5 * t;
  const c = 0.2 + 0.3 * t;
  const h = 360 * t;
  return `oklch(${l} ${c} ${h})`;
}
function flashColor(el, color, duration = 1000) {
  const original = el.style.backgroundColor;
  el.style.backgroundColor = color;
  return {
    el,
    id: setTimeout(() => {
      el.style.backgroundColor = original;
    }, duration),
  };
}
function compareBy(fn) {
  return (a, b) => fn(a) - fn(b);
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
function elementDepth(e) {
  return !e ? 0 : 1 + elementDepth(e.parentElement);
}
function normalize(arr) {
  const maxs = arr.reduce(
    (a, b) => a.map((e, i) => Math.max(e, b[i])),
    Array(arr[0].length).fill(-Infinity)
  );
  return arr.map((e) => e.map((v, i) => v / maxs[i]));
}
function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}
function magnitude(a) {
  return Math.sqrt(dot(a, a));
}
function cosineSimilarity(a, b) {
  return dot(a, b) / (magnitude(a) * magnitude(b));
}
function groupByCosineSimilarity(arr, threshold = 0.99) {
  const groups = [];
  const visited = new Set();
  arr.forEach((vec, i) => {
    if (visited.has(i)) return;
    const group = [i];
    visited.add(i);
    for (let j = i + 1; j < arr.length; j++) {
      if (cosineSimilarity(vec, arr[j]) > threshold) {
        group.push(j);
        visited.add(j);
      }
    }
    groups.push(group);
  });
  return groups;
}
