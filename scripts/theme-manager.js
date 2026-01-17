/**
 * Theme Manager
 * Handles Light, Dark, and System theme preferences.
 */

(function () {
  const THEME_KEY = "leroy-theme";
  const html = document.documentElement;

  // 1. Function to apply theme
  function applyTheme(theme) {
    html.classList.remove("light", "dark");
    if (theme === "dark") {
      html.classList.add("dark");
    } else if (theme === "light") {
      html.classList.add("light");
    }
    // If theme is 'system' or null, we do nothing and let CSS media queries handle it.
  }

  // 2. Initial load - Run immediately to prevent FOUC
  const savedTheme = localStorage.getItem(THEME_KEY) || "system";
  applyTheme(savedTheme);

  // 3. Expose manager to global window
  window.ThemeManager = {
    setTheme: function (theme) {
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
      // Update UI if present
      updateToggleUI(theme);
    },
    getTheme: function () {
      return localStorage.getItem(THEME_KEY) || "system";
    },
  };

  // 4. Update UI labels if toggle elements exist
  function updateToggleUI(theme) {
    const buttons = document.querySelectorAll(".theme-toggle-btn");
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
  }

  // 5. Setup UI listeners on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    updateToggleUI(window.ThemeManager.getTheme());

    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.ThemeManager.setTheme(btn.dataset.theme);
      });
    });
  });
})();
