const form = document.getElementById("matchForm");
const result = document.getElementById("result");

let data = null;

async function loadData() {
  const response = await fetch("questions.json");
  data = await response.json();
}

function estimateSize(height, weight, gender) {
  if (gender === "men") {
    if (height < 170 && weight < 65) return "S";
    if (height < 180 && weight < 78) return "M";
    if (height < 188 && weight < 92) return "L";
    return "XL+";
  }

  if (height < 158 && weight < 52) return "XS–S";
  if (height < 168 && weight < 62) return "S–M";
  if (height < 176 && weight < 74) return "M–L";
  return "L+";
}

function isSnowboardType(type) {
  return type.startsWith("snowboard");
}

function fitNote(height, weight, level, gender) {
  const size = estimateSize(height, weight, gender);
  const beginnerNote = level === "beginner"
    ? "For beginners, comfort and warmth matter more than aggressive technical features."
    : "For non-beginners, prioritize mobility, ventilation, and waterproof performance.";

  return `Estimated apparel size range: ${size}. ${beginnerNote} Always confirm the brand size chart before purchasing.`;
}

function boardLengthNote(height, weight, level, snowType) {
  if (isSnowboardType(snowType)) {
    let low = Math.round(height - 22);
    let high = Math.round(height - 14);

    if (level === "beginner") {
      low -= 2;
      high -= 2;
    }

    if (snowType === "snowboardPowder" || snowType === "snowboardAllMountain") {
      high += 4;
    }

    return `Suggested snowboard length direction: around ${low}–${high} cm, depending on stance, weight range, boot size, and board model.`;
  }

  let low = Math.round(height - 15);
  let high = Math.round(height - 5);

  if (level === "beginner") {
    low = Math.round(height - 20);
    high = Math.round(height - 10);
  }

  if (snowType === "powder" || snowType === "allMountain") {
    high += 5;
  }

  return `Suggested ski length direction: around ${low}–${high} cm, depending on model, strength, and comfort.`;
}

function scoreProduct(product, profile) {
  let score = 0;

  if (product.genders.includes(profile.gender)) score += 5;
  if (profile.gender === "unisex" && product.genders.includes("unisex")) score += 5;
  if (product.genders.includes("unisex")) score += 1;

  if (product.levels.includes(profile.level)) score += 4;
  if (product.snowTypes.includes(profile.snowType)) score += 5;
  if (product.colors.includes(profile.color)) score += 3;
  if (product.budgets.includes(profile.budget)) score += 2;

  if (product.snowTypes.includes("all")) score += 1;
  if (product.colors.includes("all")) score += 1;

  return score;
}

function pickBestProducts(profile) {
  const categories = isSnowboardType(profile.snowType)
    ? ["jacket", "pants", "snowboard", "helmet", "goggles", "baseLayer"]
    : ["jacket", "pants", "skis", "helmet", "goggles", "baseLayer"];

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
    gender: document.getElementById("gender").value,
    height: Number(document.getElementById("height").value),
    weight: Number(document.getElementById("weight").value),
    level: document.getElementById("level").value,
    snowType: document.getElementById("snowType").value,
    color: document.getElementById("color").value,
    budget: document.getElementById("budget").value
  };

  const products = pickBestProducts(profile);
  const total = products.reduce((sum, item) => sum + item.priceNumber, 0);
  const style = data.styleGuides[profile.color] || data.styleGuides.black;
  const typeLabel = data.snowTypeLabels[profile.snowType];

  result.classList.remove("empty-state");
  result.innerHTML = `
    <div class="match-header">
      <div>
        <p class="eyebrow">Your Product Match</p>
        <h2>${style.title} ${isSnowboardType(profile.snowType) ? "Snowboard" : "Ski"} Set</h2>
        <p class="result-summary">
          Matched for ${profile.gender} product fit, ${profile.level} level, ${typeLabel}, and a ${style.label} color direction.
        </p>
      </div>
      <div class="price-badge">Estimated set: ${formatMoney(total)}</div>
    </div>

    <div class="fit-note">
      <p class="note-text">${fitNote(profile.height, profile.weight, profile.level, profile.gender)}</p>
      <p class="note-text">${boardLengthNote(profile.height, profile.weight, profile.level, profile.snowType)}</p>
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
