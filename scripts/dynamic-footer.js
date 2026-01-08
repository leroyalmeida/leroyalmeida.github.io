/**
 * Updates the copyright year in the footer dynamically.
 * Looks for an element with id="copyright-year" and sets its text to "2018-YYYY"
 */
document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('copyright-year');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.textContent = `2018-${currentYear}`;
    }
});
