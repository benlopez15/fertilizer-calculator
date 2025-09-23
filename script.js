const fertilizerData = {
  N: {
    "Urea (46-0-0)": 0.46,
    "Ammonium Nitrate (34-0-0)": 0.34,
    "UAN (28-0-0)": 0.28,
    "UAN (32-0-0)": 0.32
  },
  P2O5: {
    "DAP (18-46-0)": 0.46,
    "MAP (11-52-0)": 0.52
  },
  K2O: {
    "Potash (0-0-60)": 0.60,
    "Sulfate of Potash (0-0-50)": 0.50
  }
};

// DOM wiring
document.addEventListener("DOMContentLoaded", () => {
  const nutrientSelect = document.getElementById("nutrient");
  const calcBtn = document.getElementById("calcBtn");
  const catchBtn = document.getElementById("catchBtn");

  nutrientSelect.addEventListener("change", () => {
    updateProducts();
    updateSelectedNutrientLabel();
  });

  document.getElementById("product").addEventListener("change", onProductChange);
  calcBtn.addEventListener("click", calculate);
  catchBtn.addEventListener("click", generateCatchTable);

  updateProducts();
  updateSelectedNutrientLabel();
});

function nutrientDisplayName(code) {
  if (code === "N") return "Nitrogen (N)";
  if (code === "P2O5") return "Phosphorus (P₂O₅)";
  if (code === "K2O") return "Potassium (K₂O)";
  return code;
}

// Populate products based on nutrient and include "Custom percentage" option
function updateProducts() {
  const nutrient = document.getElementById("nutrient").value;
  const productSelect = document.getElementById("product");
  const nozzleGroup = document.getElementById("nozzleGroup");
  const customGroup = document.getElementById("customPercentGroup");

  productSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "-- Select Product --";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  productSelect.appendChild(defaultOption);

  const products = fertilizerData[nutrient] || {};
  Object.keys(products).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    productSelect.appendChild(option);
  });

  // Add explicit "Custom percentage" option at the end
  const customOption = document.createElement("option");
  customOption.value = "CUSTOM_PERCENT";
  customOption.textContent = "Custom percentage (enter % below)";
  productSelect.appendChild(customOption);

  nozzleGroup.style.display = "none";
  customGroup.style.display = "none";
  document.getElementById("nutrientPercent").value = ""; // clear percent when changing nutrient
}

function updateSelectedNutrientLabel() {
  const nutrient = document.getElementById("nutrient").value;
  const labelSpan = document.getElementById("selectedNutrientLabel");
  labelSpan.textContent = nutrientDisplayName(nutrient);
}

function onProductChange() {
  const product = document.getElementById("product").value || "";
  const nozzleGroup = document.getElementById("nozzleGroup");
  const customGroup = document.getElementById("customPercentGroup");
  const nutrient = document.getElementById("nutrient").value;
  const pctInput = document.getElementById("nutrientPercent");

  // Show/hide custom percent group
  if (product === "CUSTOM_PERCENT") {
    customGroup.style.display = "flex";
    pctInput.value = "";
    pctInput.focus();
  } else {
    customGroup.style.display = "none";
    // If a real product is selected autofill percent
    if (product && fertilizerData[nutrient] && fertilizerData[nutrient][product]) {
      const pct = fertilizerData[nutrient][product] * 100;
      pctInput.value = pct.toFixed(2);
    } else {
      pctInput.value = "";
    }
  }

  // Show nozzle input for UAN products (only when an actual UAN product selected)
  nozzleGroup.style.display = (product && product.includes && product.includes("UAN")) ? "block" : "none";
}

// Read percent from the single-percentage input or fallback to selected product
function getPercentFromInputs(nutrient) {
  const product = document.getElementById("product").value || "";
  const percentInput = document.getElementById("nutrientPercent").value.trim();

  // If product is CUSTOM_PERCENT, require the numeric input
  if (product === "CUSTOM_PERCENT") {
    if (percentInput === "") return null;
    const p = parseFloat(percentInput);
    if (!isNaN(p) && p > 0) return p / 100;
    return null;
  }

  // If user typed a percent regardless of selection, prefer that value (so they can tweak)
  if (percentInput !== "") {
    const p = parseFloat(percentInput);
    if (!isNaN(p) && p > 0) return p / 100;
    return null;
  }

  // Fallback to lookup from product list
  if (product && fertilizerData[nutrient] && fertilizerData[nutrient][product]) {
    return fertilizerData[nutrient][product];
  }

  return null;
}

function calculate() {
  const nutrient = document.getElementById("nutrient").value;
  const product = document.getElementById("product").value || "";
  const pureRate = parseFloat(document.getElementById("pureRate").value);
  const acres = parseFloat(document.getElementById("acres").value);
  const resultEl = document.getElementById("result");

  if (isNaN(pureRate) || pureRate <= 0 || isNaN(acres) || acres <= 0) {
    resultEl.textContent = "Please enter valid numbers for rate and acres.";
    return;
  }

  const percent = getPercentFromInputs(nutrient);
  if (percent === null || percent === 0) {
    resultEl.textContent = "Please enter a valid nutrient percentage or select a product.";
    return;
  }

  const productPerAcre = pureRate / percent;
  const totalProduct = productPerAcre * acres;

  const label = (product && product !== "CUSTOM_PERCENT") ? product : `${(percent * 100).toFixed(2)}% ${nutrient}`;

  let resultText = `To apply ${pureRate.toFixed(2)} lbs of ${nutrient} per acre using ${label}, you need:\n`;

  if (label.includes("UAN")) {
    const gpa = productPerAcre / 11.06;
    const totalG = totalProduct / 11.06;
    resultText += `• ${gpa.toFixed(2)} gallons/acre\n• ${totalG.toFixed(2)} gallons total for ${acres} acres.`;
  } else {
    resultText += `• ${productPerAcre.toFixed(2)} lbs/acre\n• ${totalProduct.toFixed(2)} lbs total for ${acres} acres.`;
  }

  resultEl.innerHTML = resultText.replace(/\n/g, "<br>");
}

function generateCatchTable() {
  const nutrient = document.getElementById("nutrient").value;
  const product = document.getElementById("product").value || "";
  const percent = getPercentFromInputs(nutrient);
  const pureRateInput = parseFloat(document.getElementById("pureRate").value);
  const spreaderWidth = parseFloat(document.getElementById("spreaderWidth").value);
  const nozzles = parseInt(document.getElementById("nozzles").value, 10);
  const table = document.getElementById("catchTable");

  if (percent === null || percent === 0 ||
      isNaN(pureRateInput) || pureRateInput <= 0 ||
      isNaN(spreaderWidth) || spreaderWidth <= 0 ||
      (product.includes && product.includes("UAN") && (isNaN(nozzles) || nozzles <= 0))
  ) {
    alert("Please enter valid inputs for spreader width, rate, and nutrient percentage or product.");
    return;
  }

  const lbsAcre = pureRateInput / percent;

  if (product.includes("UAN")) {
    table.innerHTML = `
      <tr>
        <th>Speed (mph)</th>
        <th>Catch (gal)</th>
        <th>Catch (ml)</th>
        <th>Per Nozzle (ml)</th>
      </tr>`;
  } else {
    table.innerHTML = `
      <tr>
        <th>Speed (mph)</th>
        <th>Catch (lbs in 60 sec)</th>
      </tr>`;
  }

  for (let speed = 1.0; speed <= 10.0; speed += 0.5) {
    const fpm = speed * 88; // feet per minute per mph
    const areaMin = spreaderWidth * fpm; // ft^2 covered in 1 minute
    const catchLbs = (lbsAcre * areaMin) / 43560; // lbs collected in 60 seconds
    const row = document.createElement("tr");

    if (product.includes("UAN")) {
      const gal = catchLbs / 11.06;
      const ml = gal * 3785.41;
      const perNo = ml / nozzles;
      row.innerHTML = `
        <td>${speed.toFixed(1)}</td>
        <td>${gal.toFixed(2)}</td>
        <td>${ml.toFixed(1)}</td>
        <td>${perNo.toFixed(1)}</td>`;
    } else {
      row.innerHTML = `
        <td>${speed.toFixed(1)}</td>
        <td>${catchLbs.toFixed(2)}</td>`;
    }

    table.appendChild(row);
  }
}