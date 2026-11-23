// "Back" link at the top of articles. If the visitor came from another page
// on this site, go back in history so they return to where they were
// (including their scroll position). Otherwise follow the link's href,
// which points to the homepage.
document.addEventListener("click", function (event) {
  var link = event.target.closest(".back-link");
  if (
    !link ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  var cameFromThisSite = false;
  try {
    cameFromThisSite =
      document.referrer !== "" &&
      new URL(document.referrer).origin === window.location.origin;
  } catch (error) {
    cameFromThisSite = false;
  }

  if (cameFromThisSite && window.history.length > 1) {
    event.preventDefault();
    window.history.back();
  }
});
