/**
 * Applies a random font glitch effect (using stylistic set ss01) to all H1, H2, and H3 elements on the page.
 */
document.addEventListener("DOMContentLoaded", () => {
  const headings = document.querySelectorAll("h1, h2, h3");

  headings.forEach((heading) => {
    const text = heading.innerText;
    heading.innerText = "";

    // Split text into spans
    const spans = [];
    for (let char of text) {
      const span = document.createElement("span");
      span.innerText = char;
      span.style.transition = "all 0.1s ease"; // slight transition
      heading.appendChild(span);
      spans.push(span);
    }

    setInterval(() => {
      // Safety cleanup: ensure everything is normal before starting new glitches
      spans.forEach((span) => (span.style.fontFeatureSettings = "normal"));

      // Pick 1-3 random characters to glitch
      const numGlitches = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numGlitches; i++) {
        const randomIndex = Math.floor(Math.random() * spans.length);
        const span = spans[randomIndex];

        // Glitch on
        span.style.fontFeatureSettings = '"ss01"';

        // Glitch off after random delay (1000-2000ms)
        setTimeout(() => {
          span.style.fontFeatureSettings = "normal";
        }, Math.random() * 1000 + 1000);
      }
    }, 1000); // Trigger glitch bursts every 1 second
  });
});
