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

function updateProducts() {
  const nutrientInput = document.getElementById('nutrient').value;
  const nutrient = nutrientInput === "P" ? "P2O5" : nutrientInput === "K" ? "K2O" : nutrientInput;
  const productSelect = document.getElementById('product');
  const nozzleGroup = document.getElementById('nozzleGroup');
  productSelect.innerHTML = "";

  const defaultOption = document.createElement('option');
  defaultOption.textContent = "-- Select Product --";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  productSelect.appendChild(defaultOption);

  const products = fertilizerData[nutrient];
  if (!products) {
    console.error("No products found for nutrient:", nutrient);
    return;
  }

  Object.keys(products).forEach(product => {
    const option = document.createElement('option');
    option.value = product;
    option.textContent = product;
    productSelect.appendChild(option);
  });

  productSelect.onchange = () => {
    const selectedProduct = productSelect.value;
    nozzleGroup.style.display = selectedProduct.includes("UAN") ? "block" : "none";
  };

  nozzleGroup.style.display = "none";
}

function calculate() {
  let nutrientInput = document.getElementById('nutrient').value;
  const product = document.getElementById('product').value;
  let pureRate = parseFloat(document.getElementById('pureRate').value);
  const acres = parseFloat(document.getElementById('acres').value);
  const resultEl = document.getElementById('result');

  if (isNaN(pureRate) || isNaN(acres) || pureRate <= 0 || acres <= 0 || !product) {
    resultEl.textContent = "Please enter valid numbers for rate and acres.";
    return;
  }

  let convertedRate = pureRate;
  let displayNutrient = nutrientInput;
  let conversionNote = "";

  if (nutrientInput === "P") {
    convertedRate *= 2.29;
    nutrientInput = "P2O5";
    conversionNote = `(Converted to ${convertedRate.toFixed(2)} lbs of P₂O₅)`;
  } else if (nutrientInput === "K") {
    convertedRate *= 1.20;
    nutrientInput = "K2O";
    conversionNote = `(Converted to ${convertedRate.toFixed(2)} lbs of K₂O)`;
  }

  const percent = fertilizerData[nutrientInput][product];
  const productPerAcre = convertedRate / percent;
  const totalProduct = productPerAcre * acres;

  let resultText = `To apply ${pureRate} lbs of elemental ${displayNutrient} per acre using ${product}, you need to apply:<br>`;

  if (product.includes("UAN")) {
    const gallonsPerAcre = productPerAcre / 11.06;
    const totalGallons = totalProduct / 11.06;
    resultText += `• ${gallonsPerAcre.toFixed(2)} gallons/acre<br>• ${totalGallons.toFixed(2)} gallons total for ${acres} acres.`;
  } else {
    resultText += `• ${productPerAcre.toFixed(2)} lbs/acre<br>• ${totalProduct.toFixed(2)} lbs total for ${acres} acres.`;
  }

  // Add conversion note at the bottom only for P and K
  if (conversionNote) {
    resultText += `<br><br>${conversionNote}`;
  }

  resultEl.innerHTML = resultText;
}


function generateCatchTable() {
  let nutrientInput = document.getElementById('nutrient').value;
  const product = document.getElementById('product').value;
  let pureRate = parseFloat(document.getElementById('pureRate').value);
  const spreaderWidth = parseFloat(document.getElementById('spreaderWidth').value);
  const nozzles = parseInt(document.getElementById('nozzles').value);
  const table = document.getElementById('catchTable');

  if (nutrientInput === "P") {
    pureRate *= 2.29;
    nutrientInput = "P2O5";
  } else if (nutrientInput === "K") {
    pureRate *= 1.20;
    nutrientInput = "K2O";
  }

  const percent = fertilizerData[nutrientInput][product];

  if (
    isNaN(spreaderWidth) || spreaderWidth <= 0 ||
    isNaN(pureRate) || pureRate <= 0 ||
    !product || !percent ||
    (product.includes("UAN") && (isNaN(nozzles) || nozzles <= 0))
  ) {
    alert("Please enter valid inputs for spreader width, rate, and number of nozzles.");
    return;
  }

  const lbsPerAcre = pureRate / percent;

  if (product.includes("UAN")) {
    table.innerHTML = `
      <tr>
        <th>Speed (mph)</th>
        <th>Catch (gallons)</th>
        <th>Catch (milliliters)</th>
        <th>Per Nozzle (ml)</th>
      </tr>`;
  } else {
    table.innerHTML = "<tr><th>Speed (mph)</th><th>Catch (lbs in 60 sec)</th></tr>";
  }

  for (let speed = 1.0; speed <= 10.0; speed += 0.5) {
    const feetPerMinute = speed * 88;
    const areaPerMinute = spreaderWidth * feetPerMinute;
    const catchLbs = (lbsPerAcre * areaPerMinute) / 43560;

    const row = document.createElement('tr');

    if (product.includes("UAN")) {
      const gallons = catchLbs / 11.06;
      const milliliters = gallons * 3785.41;
      const perNozzleMl = milliliters / nozzles;

      row.innerHTML = `
        <td>${speed}</td>
        <td>${gallons.toFixed(2)}</td>
        <td>${milliliters.toFixed(1)}</td>
        <td>${perNozzleMl.toFixed(1)}</td>`;
    } else {
      row.innerHTML = `<td>${speed}</td><td>${catchLbs.toFixed(2)}</td>`;
    }

    table.appendChild(row);
  }
}

document.addEventListener("DOMContentLoaded", updateProducts);