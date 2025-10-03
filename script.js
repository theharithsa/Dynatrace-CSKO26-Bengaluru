const slogans = [
  "Latency slayed. Spirits raised.",
  "Keep calm and let Davis® cook.",
  "We put the fun in fundamental metrics.",
  "Chat heroes by day, dashboard DJs by night.",
  "Observability: because guessing is so last season."
];

const subtitle = document.querySelector(".hero__subtitle");
let index = 0;

function cycleSlogans() {
  if (!subtitle) return;
  subtitle.classList.add("is-fading");
  setTimeout(() => {
    index = (index + 1) % slogans.length;
    subtitle.textContent = slogans[index];
    subtitle.classList.remove("is-fading");
  }, 350);
}

setInterval(cycleSlogans, 5000);
