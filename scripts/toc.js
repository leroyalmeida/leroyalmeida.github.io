/**
 * Table of contents for case-study pages.
 * Builds a quiet list of the article's h2s, fixed in the left gutter
 * (shown at >=1100px via styles/toc.css), and highlights the section
 * currently being read.
 */
(function () {
  "use strict";

  var MIN_HEADINGS = 3;
  var ACTIVE_OFFSET = 0.3; // fraction of viewport height

  function slugify(text) {
    return (
      text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/[\s-]+/g, "-") || "section"
    );
  }

  function uniqueId(base) {
    var id = base;
    var n = 2;
    while (document.getElementById(id)) {
      id = base + "-" + n++;
    }
    return id;
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function init() {
    var container =
      document.querySelector(".container#main-content") ||
      document.querySelector(".container");
    if (!container || document.querySelector("nav.toc")) return;

    var headings = Array.prototype.slice.call(container.querySelectorAll("h2"));
    if (headings.length < MIN_HEADINGS) return;

    var nav = document.createElement("nav");
    nav.className = "toc";
    nav.setAttribute("aria-label", "On this page");

    var list = document.createElement("ol");
    list.className = "toc__list";

    var links = headings.map(function (h) {
      if (!h.id) h.id = uniqueId(slugify(h.textContent));
      h.classList.add("toc-target");

      var li = document.createElement("li");
      li.className = "toc__item";

      var a = document.createElement("a");
      a.className = "toc__link";
      a.href = "#" + h.id;
      a.textContent = h.textContent.replace(/\s+/g, " ").trim();
      a.addEventListener("click", function (e) {
        // Let modified clicks (new tab etc.) behave normally
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;
        e.preventDefault();
        h.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
        if (history.replaceState) {
          history.replaceState(null, "", "#" + h.id);
        }
        // Move focus for keyboard / screen reader users without re-scrolling
        if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
        h.focus({ preventScroll: true });
        setActive(headings.indexOf(h));
        lockUntilSettled();
      });

      li.appendChild(a);
      list.appendChild(li);
      return a;
    });

    nav.appendChild(list);
    container.parentNode.insertBefore(nav, container);

    var activeIndex = -1;
    var locked = false;
    var lockTimer = null;

    function setActive(i) {
      if (i === activeIndex) return;
      if (activeIndex > -1) links[activeIndex].removeAttribute("aria-current");
      activeIndex = i;
      if (i > -1) links[i].setAttribute("aria-current", "true");
    }

    // While a smooth scroll is in flight, keep the clicked item active so
    // the highlight doesn't flicker through intermediate sections.
    function lockUntilSettled() {
      locked = true;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(function () {
        locked = false;
        update();
      }, 150);
    }

    function computeActive() {
      var doc = document.documentElement;
      var atBottom =
        window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
      if (atBottom) return headings.length - 1;

      var threshold = window.innerHeight * ACTIVE_OFFSET;
      var idx = -1;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top <= threshold) idx = i;
        else break;
      }
      return idx;
    }

    function update() {
      ticking = false;
      if (locked) return;
      setActive(computeActive());
    }

    var ticking = false;
    function onScroll() {
      if (locked) {
        lockUntilSettled(); // extend lock until scrolling stops
        return;
      }
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("load", update);
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
