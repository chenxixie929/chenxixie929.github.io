const form = document.getElementById("matchForm");
const result = document.getElementById("result");

let data = null;

async function loadData() {
  const response = await fetch("questions.json");
  data = await response.json();
}

function estimateSize(height, weight) {
  const bmi = weight / Math.pow(height / 100, 2);

  if (height < 158 && weight < 52) return "XS–S";
  if (height < 168 && weight < 62) return "S–M";
  if (height < 176 && weight < 74) return "M–L";
  return "L+";

}

function fitNote(height, weight, level) {
  const size = estimateSize(height, weight);
  const beginnerNote = level === "beginner"
    ? "For beginners, comfort and warmth matter more than aggressive technical features."
    : "For non-beginners, prioritize mobility, ventilation, and waterproof performance.";

  return `Estimated apparel size range: ${size}. ${beginnerNote} Always confirm the brand size chart before purchasing.`;
}

function skiLengthNote(height, level, skiType) {
  let low = Math.round(height - 15);
  let high = Math.round(height - 5);

  if (level === "beginner") {
    low = Math.round(height - 20);
    high = Math.round(height - 10);
  }

  if (skiType === "powder" || skiType === "allMountain") {
    high += 5;
  }

  return `Suggested ski length direction: around ${low}–${high} cm, depending on model, strength, and comfort.`;
}

function scoreProduct(product, profile) {
  let score = 0;

  if (product.levels.includes(profile.level)) score += 4;
  if (product.skiTypes.includes(profile.skiType)) score += 4;
  if (product.colors.includes(profile.color)) score += 3;
  if (product.budgets.includes(profile.budget)) score += 2;

  if (product.levels.includes("all")) score += 1;
  if (product.skiTypes.includes("all")) score += 1;
  if (product.colors.includes("all")) score += 1;

  return score;
}

function pickBestProducts(profile) {
  const categories = ["jacket", "pants", "skis", "helmet", "goggles", "baseLayer"];

  return categories.map(category => {
    const candidates = data.products.filter(item => item.category === category);
    return candidates
      .map(item => ({ ...item, score: scoreProduct(item, profile) }))
      .sort((a, b) => b.score - a.score || a.priceNumber - b.priceNumber)[0];
  });
}

function formatMoney(value) {
  return `$${value.toLocaleString()}`;
}

function renderProductCard(product) {
  return `
    <article class="product-card">
      <span class="product-category">${product.categoryLabel}</span>
      <h3>${product.name}</h3>
      <div class="product-meta">
        <span class="product-pill">${product.brand}</span>
        <span class="product-pill">${product.price}</span>
        <span class="product-pill">${product.bestFor}</span>
      </div>
      <p class="product-reason">${product.reason}</p>
      <a class="shop-button" href="${product.link}" target="_blank" rel="noopener noreferrer">Shop Now</a>
    </article>
  `;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const profile = {
    height: Number(document.getElementById("height").value),
    weight: Number(document.getElementById("weight").value),
    level: document.getElementById("level").value,
    skiType: document.getElementById("skiType").value,
    color: document.getElementById("color").value,
    budget: document.getElementById("budget").value
  };

  const products = pickBestProducts(profile);
  const total = products.reduce((sum, item) => sum + item.priceNumber, 0);
  const style = data.styleGuides[profile.color] || data.styleGuides.black;

  result.classList.remove("empty-state");
  result.innerHTML = `
    <div class="match-header">
      <div>
        <p class="eyebrow">Your Product Match</p>
        <h2>${style.title} Ski Set</h2>
        <p class="result-summary">
          Matched for ${profile.level} level, ${data.skiTypeLabels[profile.skiType]}, and a ${style.label} color direction.
        </p>
      </div>
      <div class="price-badge">Estimated set: ${formatMoney(total)}</div>
    </div>

    <div class="fit-note">
      <p class="note-text">${fitNote(profile.height, profile.weight, profile.level)}</p>
      <p class="note-text">${skiLengthNote(profile.height, profile.level, profile.skiType)}</p>
      <p class="note-text">${style.tip}</p>
    </div>

    <div class="product-grid">
      ${products.map(renderProductCard).join("")}
    </div>

    <p class="disclaimer">
      Note: prices, sizes, colors, and availability can change. Please verify details on the retailer page before buying.
    </p>
  `;

  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

loadData();
