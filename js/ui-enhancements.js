// UI Enhancements for Helora Redesign

document.addEventListener('DOMContentLoaded', () => {
    initDynamicQuotes();
});

function initDynamicQuotes() {
    const quotes = [
        "Your health is our highest priority.",
        "Care that connects, technology that heals.",
        "Empowering healthcare through innovation.",
        "Every life matters. Every second counts.",
        "Healing hands, advanced minds.",
        "Bridging the gap between care and cure.",
        "Bringing world-class healthcare to your fingertips."
    ];

    const quoteElement = document.getElementById('dynamic-quote');
    if (!quoteElement) return;

    let currentIndex = 0;

    // Set initial quote
    // Select an initial random quote to avoid always starting with the same one
    currentIndex = Math.floor(Math.random() * quotes.length);
    quoteElement.textContent = quotes[currentIndex];
    quoteElement.style.opacity = 1;

    setInterval(() => {
        // Fade out
        quoteElement.style.opacity = 0;

        setTimeout(() => {
            // Change quote
            currentIndex = (currentIndex + 1) % quotes.length;
            quoteElement.textContent = quotes[currentIndex];
            // Fade in
            quoteElement.style.opacity = 1;
        }, 500); // Wait for fade out to complete
    }, 5000); // Rotate every 5 seconds
}

