// Theme picker: System, Light, or Dark. Dark is the default.
// Loaded in <head> without defer so the theme is applied before first paint,
// then adds a sun/moon button to the footer that opens a popover menu.
(function () {
  var STORAGE_KEY = "theme";
  var CHOICES = ["system", "light", "dark"];
  var LABELS = { system: "System", light: "Light", dark: "Dark" };
  var THEME_COLORS = { light: "#ffffff", dark: "#0a0a0a" };
  var systemQuery = window.matchMedia("(prefers-color-scheme: light)");

  var ICONS = {
    system:
      '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    light:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    dark: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
  };

  function icon(name) {
    return (
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICONS[name] +
      "</svg>"
    );
  }

  function readChoice() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (CHOICES.indexOf(stored) !== -1) return stored;
    } catch (error) {}
    return "dark";
  }

  function resolve(choice) {
    if (choice === "system") return systemQuery.matches ? "light" : "dark";
    return choice;
  }

  function apply(choice) {
    var theme = resolve(choice);
    var root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
    return theme;
  }

  var choice = readChoice();
  apply(choice);

  function buildPicker() {
    // Re-apply now that <meta name="theme-color"> has been parsed.
    apply(choice);
    var container = document.querySelector(".site-footer .footer-container");
    if (!container) return;

    var wrapper = document.createElement("div");
    wrapper.className = "theme-picker";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "theme-button";
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "theme-menu");

    var menu = document.createElement("div");
    menu.id = "theme-menu";
    menu.className = "theme-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Theme");
    menu.hidden = true;

    var items = CHOICES.map(function (value) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "theme-option";
      item.setAttribute("role", "menuitemradio");
      item.setAttribute("tabindex", "-1");
      item.dataset.value = value;
      item.innerHTML =
        icon(value) +
        '<span class="theme-option-label">' +
        LABELS[value] +
        '</span><span class="theme-option-check">' +
        icon("check") +
        "</span>";
      item.addEventListener("click", function () {
        select(value);
        close(true);
      });
      menu.appendChild(item);
      return item;
    });

    function render() {
      var theme = resolve(choice);
      button.innerHTML = icon(theme === "light" ? "light" : "dark");
      button.setAttribute(
        "aria-label",
        "Theme: " +
          LABELS[choice] +
          (choice === "system" ? " (" + LABELS[theme] + ")" : ""),
      );
      items.forEach(function (item) {
        item.setAttribute(
          "aria-checked",
          item.dataset.value === choice ? "true" : "false",
        );
      });
    }

    function select(value) {
      choice = value;
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch (error) {}
      apply(choice);
      render();
    }

    function isOpen() {
      return !menu.hidden;
    }

    function open() {
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
      var current = items[CHOICES.indexOf(choice)];
      current.focus();
      document.addEventListener("pointerdown", onOutside, true);
    }

    function close(returnFocus) {
      if (!isOpen()) return;
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      document.removeEventListener("pointerdown", onOutside, true);
      if (returnFocus) button.focus();
    }

    function onOutside(event) {
      if (!wrapper.contains(event.target)) close(false);
    }

    button.addEventListener("click", function () {
      if (isOpen()) close(true);
      else open();
    });

    button.addEventListener("keydown", function (event) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        open();
      }
    });

    menu.addEventListener("keydown", function (event) {
      var index = items.indexOf(document.activeElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(index + 1) % items.length].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(index - 1 + items.length) % items.length].focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0].focus();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      } else if (event.key === "Tab") {
        close(false);
      }
    });

    systemQuery.addEventListener("change", function () {
      if (choice === "system") {
        apply(choice);
        render();
      }
    });

    // Keep tabs in sync when the theme changes in another tab.
    window.addEventListener("storage", function (event) {
      if (event.key !== STORAGE_KEY) return;
      choice = readChoice();
      apply(choice);
      render();
    });

    wrapper.appendChild(menu);
    wrapper.appendChild(button);
    container.appendChild(wrapper);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPicker);
  } else {
    buildPicker();
  }
})();
