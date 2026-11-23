/*
 * strewn.js — turns <div class="strewn"> groups of <figure><img></figure>
 * into a loosely scattered, draggable, resizable pile with a gallery viewer.
 *
 * Authoring:
 *   <div class="strewn">
 *     <figure><img src="…" alt="…"><figcaption>…</figcaption></figure>
 *   </div>
 * Optional per-figure overrides (fractions of pile width / degrees):
 *   data-left, data-top, data-width, data-rotate, data-caption
 * Optional per-pile override: data-height (pile height as fraction of width)
 */
(function () {
  "use strict";

  var DRAG_THRESHOLD = 4;
  var GROW_MIN = 0.6;
  var GROW_MAX = 2;
  var PAD = 0.02; // breathing room inside the pile, fraction of width

  var scatterQuery = window.matchMedia(
    "(min-width: 700px) and (hover: hover) and (pointer: fine)",
  );
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var piles = [];
  var tooltip = null;
  var viewer = null;

  /* ---------- seeded randomness ---------- */

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // final avalanche so near-identical strings give unrelated seeds
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function between(rand, a, b) {
    return a + (b - a) * rand();
  }

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function num(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : null;
  }

  /* ---------- captions ---------- */

  function captionOf(fig) {
    if (fig.dataset.caption) return fig.dataset.caption;
    var cap = fig.querySelector("figcaption");
    if (cap && cap.textContent.trim())
      return cap.textContent.replace(/\s+/g, " ").trim();
    var img = fig.querySelector("img");
    return img ? img.alt : "";
  }

  function captionHTMLOf(fig) {
    var cap = fig.querySelector("figcaption");
    if (cap && cap.textContent.trim()) return cap.innerHTML;
    var span = document.createElement("span");
    span.textContent = captionOf(fig);
    return span.innerHTML;
  }

  /* ---------- layout ---------- */

  function ratioOf(item) {
    var img = item.img;
    if (img.naturalWidth && img.naturalHeight)
      return img.naturalWidth / img.naturalHeight;
    var w = num(img.getAttribute("width"));
    var h = num(img.getAttribute("height"));
    return w && h ? w / h : 4 / 3;
  }

  function baseWidth(ratio) {
    if (ratio < 0.8) return 0.22; // phone screenshots, portrait
    if (ratio < 1.25) return 0.34; // squarish
    return 0.44; // landscape
  }

  function layout(pile) {
    var items = pile.items;
    var n = items.length;
    var rand = rng(pile.seed);

    items.forEach(function (it) {
      it.ratio = ratioOf(it);
      it.rand = rng(it.seed);
      it.w = baseWidth(it.ratio) * between(it.rand, 0.9, 1.1);
    });

    // Small piles get larger pieces.
    if (n === 2)
      items.forEach(function (it) {
        it.w *= 1.2;
      });

    // Split into rows of roughly equal visual span.
    var overlap = 0.86; // each piece claims ~86% of its width horizontally
    var total = items.reduce(function (s, it) {
      return s + it.w * overlap;
    }, 0);
    var rows = Math.max(1, Math.ceil(total / 1.25));
    var perRow = Math.ceil(n / rows);

    var y = PAD;
    var maxBottom = 0;
    for (var r = 0; r * perRow < n; r++) {
      var row = items.slice(r * perRow, (r + 1) * perRow);
      var span = row.reduce(function (s, it) {
        return s + it.w * overlap;
      }, 0);
      // Shrink if the row would spill past the pile edges.
      var room = 1 - PAD * 2;
      if (span > room) {
        var k = room / span;
        row.forEach(function (it) {
          it.w *= k;
        });
        span = room;
      }
      var widthSum = row.reduce(function (s, it) {
        return s + it.w;
      }, 0);
      var gap = row.length > 1 ? (span - widthSum) / (row.length - 1) : 0;
      var x =
        (1 - span) / 2 + between(rand, -0.03, 0.03) + (r % 2 ? 0.035 : -0.035);
      var rowBottom = y;

      row.forEach(function (it, i) {
        it.h = it.w / it.ratio;
        it.left = x + between(it.rand, -0.012, 0.012);
        it.top =
          y +
          (i % 2 ? between(it.rand, 0.025, 0.06) : between(it.rand, 0, 0.025));
        // Alternate tilt direction (with the odd exception) so neighbours
        // lean against each other rather than all one way.
        var sign = (i + r) % 2 ? 1 : -1;
        if (it.rand() < 0.2) sign = -sign;
        it.rot = sign * between(it.rand, 0.7, 2.8);
        x += it.w + gap;
        rowBottom = Math.max(rowBottom, it.top + it.h);
      });

      // Next row tucks up under this one a little.
      var rowTop = y;
      y = rowTop + (rowBottom - rowTop) * 0.82;
    }

    items.forEach(function (it) {
      var d = it.fig.dataset;
      if (num(d.width) !== null) {
        it.w = num(d.width);
        it.h = it.w / it.ratio;
      }
      if (num(d.left) !== null) it.left = num(d.left);
      if (num(d.top) !== null) it.top = num(d.top);
      if (num(d.rotate) !== null) it.rot = num(d.rotate);
      it.left = clamp(it.left, PAD / 2, 1 - it.w - PAD / 2);
      it.top = Math.max(PAD / 2, it.top);
      maxBottom = Math.max(maxBottom, it.top + it.h);

      var s = it.fig.style;
      s.setProperty("--left", it.left.toFixed(4));
      s.setProperty("--top", it.top.toFixed(4));
      s.setProperty("--width", it.w.toFixed(4));
      s.setProperty("--ratio", it.ratio.toFixed(4));
      s.setProperty("--r", it.rot.toFixed(2) + "deg");
    });

    var height = num(pile.el.dataset.height);
    pile.height = height !== null ? height : maxBottom + PAD * 1.5;
    pile.el.style.setProperty("--height", pile.height.toFixed(4));
  }

  /* ---------- geometry (px) for drag + repulsion ---------- */

  function box(pile, it) {
    var W = pile.el.clientWidth;
    var g = it.grow;
    var cx = (it.left + it.w / 2) * W + it.dx;
    var cy = (it.top + it.h / 2) * W + it.dy;
    return {
      cx: cx,
      cy: cy,
      hw: (it.w * W * g) / 2,
      hh: (it.h * W * g) / 2,
      W: W,
    };
  }

  function applyOffset(it) {
    it.fig.style.setProperty("--dx", it.dx.toFixed(1));
    it.fig.style.setProperty("--dy", it.dy.toFixed(1));
  }

  function applyGrow(it) {
    it.fig.style.setProperty("--grow", it.grow.toFixed(3));
  }

  // clamp, or centre when the range is empty (figure larger than the pile)
  function fit(v, lo, hi) {
    return lo > hi ? (lo + hi) / 2 : clamp(v, lo, hi);
  }

  // Keep a figure (allowing ~10% overhang) inside the pile.
  function containCentre(pile, it) {
    var b = box(pile, it);
    var H = pile.height * b.W;
    var ncx = fit(b.cx, b.hw * 0.9, b.W - b.hw * 0.9);
    var ncy = fit(b.cy, b.hh * 0.9, H - b.hh * 0.9);
    it.dx += ncx - b.cx;
    it.dy += ncy - b.cy;
  }

  // One pass: neighbours that overlap the moved figure more than the
  // pile's natural overlap get pushed away along the centre-to-centre line.
  function repel(pile, moved) {
    var a = box(pile, moved);
    var H = pile.height * a.W;
    pile.items.forEach(function (it) {
      if (it === moved) return;
      var b = box(pile, it);
      var ox = a.hw + b.hw - Math.abs(a.cx - b.cx);
      var oy = a.hh + b.hh - Math.abs(a.cy - b.cy);
      if (ox <= 0 || oy <= 0) return;
      var pen = Math.min(ox, oy);
      var allowed = 0.3 * Math.min(a.hw, a.hh, b.hw, b.hh) * 2;
      if (pen <= allowed) return;
      var vx = b.cx - a.cx;
      var vy = b.cy - a.cy;
      var len = Math.hypot(vx, vy);
      if (len < 1) {
        vx = 1;
        vy = 0;
        len = 1;
      }
      var push = Math.min((pen - allowed) * 0.6, 120);
      var ncx = clamp(
        b.cx + (vx / len) * push,
        b.hw,
        Math.max(b.hw, b.W - b.hw),
      );
      var ncy = clamp(b.cy + (vy / len) * push, b.hh, Math.max(b.hh, H - b.hh));
      it.dx += ncx - b.cx;
      it.dy += ncy - b.cy;
      applyOffset(it);
    });
  }

  function bringToFront(pile, it) {
    pile.z += 1;
    it.fig.style.zIndex = String(pile.z);
  }

  /* ---------- tooltip ---------- */

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement("div");
    tooltip.className = "strewn-tooltip";
    tooltip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function moveTooltip(e) {
    var t = ensureTooltip();
    var x = e.clientX + 14;
    var y = e.clientY + 18;
    var r = t.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - 14;
    t.style.transform =
      "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
  }

  function showTooltip(text, e) {
    if (!text) return;
    var t = ensureTooltip();
    t.textContent = text;
    t.classList.add("is-visible");
    moveTooltip(e);
  }

  function hideTooltip() {
    if (tooltip) tooltip.classList.remove("is-visible");
  }

  /* ---------- viewer ---------- */

  function buildViewer() {
    var d = document.createElement("dialog");
    d.className = "strewn-viewer";
    d.setAttribute("aria-label", "Image viewer");
    d.innerHTML =
      '<div class="strewn-viewer__inner">' +
      '<figure class="strewn-viewer__stage">' +
      '<img class="strewn-viewer__img" alt="">' +
      '<figcaption class="strewn-viewer__caption"><div class="strewn-viewer__text"></div>' +
      '<span class="strewn-viewer__count" aria-live="polite"></span></figcaption>' +
      "</figure>" +
      '<button type="button" class="strewn-viewer__btn strewn-viewer__prev" aria-label="Previous image">&larr;</button>' +
      '<button type="button" class="strewn-viewer__btn strewn-viewer__next" aria-label="Next image">&rarr;</button>' +
      '<button type="button" class="strewn-viewer__btn strewn-viewer__close" aria-label="Close viewer">&times;</button>' +
      "</div>";
    document.body.appendChild(d);

    var v = {
      el: d,
      img: d.querySelector(".strewn-viewer__img"),
      text: d.querySelector(".strewn-viewer__text"),
      count: d.querySelector(".strewn-viewer__count"),
      prev: d.querySelector(".strewn-viewer__prev"),
      next: d.querySelector(".strewn-viewer__next"),
      pile: null,
      index: 0,
      opener: null,
      closing: false,
    };

    v.prev.addEventListener("click", function () {
      step(-1);
    });
    v.next.addEventListener("click", function () {
      step(1);
    });
    d.querySelector(".strewn-viewer__close").addEventListener(
      "click",
      closeViewer,
    );

    // Clicks on empty space (not image, caption, buttons) close.
    d.addEventListener("click", function (e) {
      var t = e.target;
      if (
        t === d ||
        t.classList.contains("strewn-viewer__inner") ||
        t.classList.contains("strewn-viewer__stage")
      ) {
        closeViewer();
      }
    });

    d.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    });

    // Esc: animate out instead of closing instantly.
    d.addEventListener("cancel", function (e) {
      e.preventDefault();
      closeViewer();
    });

    d.addEventListener("close", function () {
      d.classList.remove("is-open");
      v.closing = false;
      document.documentElement.style.overflow = "";
      if (v.opener && document.contains(v.opener))
        v.opener.focus({ preventScroll: true });
    });

    return v;
  }

  function render() {
    var items = viewer.pile.items;
    var it = items[viewer.index];
    viewer.img.src = it.img.currentSrc || it.img.src;
    viewer.img.alt = it.img.alt || "";
    viewer.text.innerHTML = captionHTMLOf(it.fig);
    viewer.count.textContent =
      items.length > 1 ? viewer.index + 1 + " of " + items.length : "";
    viewer.prev.hidden = items.length < 2;
    viewer.next.hidden = items.length < 2;
  }

  function step(delta) {
    var n = viewer.pile.items.length;
    if (n < 2) return;
    viewer.index = (viewer.index + delta + n) % n;
    render();
  }

  function openViewer(pile, it) {
    if (!viewer) viewer = buildViewer();
    if (typeof viewer.el.showModal !== "function") {
      window.open(it.img.currentSrc || it.img.src, "_blank", "noopener");
      return;
    }
    hideTooltip();
    viewer.pile = pile;
    viewer.index = pile.items.indexOf(it);
    viewer.opener = it.fig;
    render();
    viewer.el.showModal();
    document.documentElement.style.overflow = "hidden";
    // Force a style flush so the opacity/scale transition runs from its start state.
    void viewer.el.offsetWidth;
    viewer.el.classList.add("is-open");
  }

  function closeViewer() {
    if (!viewer || !viewer.el.open || viewer.closing) return;
    viewer.closing = true;
    viewer.el.classList.remove("is-open");
    if (reduceMotion.matches) {
      viewer.el.close();
      return;
    }
    setTimeout(function () {
      if (viewer.el.open) viewer.el.close();
    }, 200);
  }

  /* ---------- interaction ---------- */

  function bindFigure(pile, it) {
    var fig = it.fig;
    var drag = null;

    fig.setAttribute("role", "button");
    fig.setAttribute("tabindex", "0");
    fig.setAttribute("aria-haspopup", "dialog");
    var label = it.img.alt || captionOf(fig);
    fig.setAttribute("aria-label", "View " + (label || "image"));
    it.img.setAttribute("draggable", "false");

    var handle = document.createElement("span");
    handle.className = "strewn-handle";
    handle.setAttribute("aria-hidden", "true");
    fig.appendChild(handle);

    fig.addEventListener("click", function (e) {
      if (it.suppressClick) {
        it.suppressClick = false;
        e.preventDefault();
        return;
      }
      openViewer(pile, it);
    });

    fig.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openViewer(pile, it);
        return;
      }
      if (!pile.scattered) return;
      var dist = e.shiftKey ? 40 : 10;
      var moves = {
        ArrowLeft: [-dist, 0],
        ArrowRight: [dist, 0],
        ArrowUp: [0, -dist],
        ArrowDown: [0, dist],
      };
      var m = moves[e.key];
      if (!m) return;
      e.preventDefault();
      it.dx += m[0];
      it.dy += m[1];
      containCentre(pile, it);
      applyOffset(it);
      bringToFront(pile, it);
      repel(pile, it);
    });

    fig.addEventListener("pointerenter", function (e) {
      if (pile.scattered && e.pointerType === "mouse")
        showTooltip(captionOf(fig), e);
    });
    fig.addEventListener("pointerleave", function () {
      if (!drag) hideTooltip();
    });

    fig.addEventListener("pointerdown", function (e) {
      if (!pile.scattered || e.button !== 0) return;
      var resizing = e.target === handle;
      var b = box(pile, it);
      var rect = pile.el.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        dx: it.dx,
        dy: it.dy,
        grow: it.grow,
        resizing: resizing,
        moved: false,
        // distance from figure centre to pointer at start (for resize)
        dist: Math.max(
          8,
          Math.hypot(
            e.clientX - (rect.left + b.cx),
            e.clientY - (rect.top + b.cy),
          ),
        ),
        cx: rect.left + b.cx,
        cy: rect.top + b.cy,
      };
      try {
        fig.setPointerCapture(e.pointerId);
      } catch (err) {
        /* pointer already released */
      }
      if (resizing) {
        e.stopPropagation();
        e.preventDefault();
        fig.classList.add("is-resizing");
        bringToFront(pile, it);
        hideTooltip();
      }
    });

    fig.addEventListener("pointermove", function (e) {
      if (!drag) {
        if (pile.scattered && e.pointerType === "mouse") moveTooltip(e);
        return;
      }
      if (e.pointerId !== drag.id) return;
      var mx = e.clientX - drag.x;
      var my = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(mx, my) < DRAG_THRESHOLD) return;
      if (!drag.moved) {
        drag.moved = true;
        if (!drag.resizing) {
          fig.classList.add("is-dragging");
          bringToFront(pile, it);
          hideTooltip();
        }
      }
      if (drag.resizing) {
        var d = Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy);
        it.grow = clamp(drag.grow * (d / drag.dist), GROW_MIN, GROW_MAX);
        applyGrow(it);
      } else {
        it.dx = drag.dx + mx;
        it.dy = drag.dy + my;
        applyOffset(it);
      }
    });

    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var wasMoved = drag.moved || drag.resizing;
      fig.classList.remove("is-dragging", "is-resizing");
      if (fig.hasPointerCapture(e.pointerId))
        fig.releasePointerCapture(e.pointerId);
      drag = null;
      if (wasMoved) {
        it.suppressClick = true;
        // Reset the flag if no click follows (e.g. pointer released off-figure).
        setTimeout(function () {
          it.suppressClick = false;
        }, 0);
        containCentre(pile, it);
        applyOffset(it);
        repel(pile, it);
        if (e.pointerType === "mouse" && e.type === "pointerup")
          showTooltip(captionOf(fig), e);
      }
    }

    fig.addEventListener("pointerup", end);
    fig.addEventListener("pointercancel", end);
  }

  /* ---------- modes ---------- */

  function setMode(pile) {
    var scatter = scatterQuery.matches;
    pile.scattered = scatter;
    pile.el.classList.toggle("is-scattered", scatter);
    if (scatter) layout(pile);
    if (!scatter) hideTooltip();
  }

  function initPile(el) {
    var figs = Array.prototype.filter.call(el.children, function (c) {
      return c.tagName === "FIGURE" && c.querySelector("img");
    });
    if (!figs.length) return;

    var srcs = figs.map(function (f) {
      return f.querySelector("img").getAttribute("src");
    });
    var pile = {
      el: el,
      items: [],
      seed: hash(srcs.join("|")),
      z: figs.length,
      scattered: false,
      height: 0.5,
    };

    pile.items = figs.map(function (fig, i) {
      var img = fig.querySelector("img");
      img.removeAttribute("loading");
      fig.style.zIndex = String(i + 1);
      return {
        fig: fig,
        img: img,
        seed: hash(pile.seed + ":" + i + ":" + srcs[i]),
        dx: 0,
        dy: 0,
        grow: 1,
        suppressClick: false,
      };
    });

    el.classList.add("is-enhanced");
    pile.items.forEach(function (it) {
      bindFigure(pile, it);
    });

    // Hide until image ratios are known, so the pile doesn't visibly reshuffle.
    var pending = pile.items.filter(function (it) {
      return !(it.img.complete && it.img.naturalWidth);
    });
    if (pending.length) {
      el.classList.add("is-pending");
      var left = pending.length;
      var done = function () {
        left -= 1;
        if (pile.scattered) layout(pile);
        if (left <= 0) el.classList.remove("is-pending");
      };
      pending.forEach(function (it) {
        it.img.addEventListener("load", done, { once: true });
        it.img.addEventListener("error", done, { once: true });
      });
      setTimeout(function () {
        el.classList.remove("is-pending");
      }, 2500);
    }

    setMode(pile);
    piles.push(pile);
  }

  function init() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".strewn"),
      initPile,
    );
    var onChange = function () {
      piles.forEach(setMode);
    };
    if (scatterQuery.addEventListener)
      scatterQuery.addEventListener("change", onChange);
    else if (scatterQuery.addListener) scatterQuery.addListener(onChange);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
