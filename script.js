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

// On page load, wire up the nutrient selector and populate products
document.addEventListener("DOMContentLoaded", () => {
  const nutrientSelect = document.getElementById("nutrient");
  nutrientSelect.addEventListener("change", updateProducts);
  updateProducts();
});

function updateProducts() {
  const nutrient = document.getElementById("nutrient").value;
  const productSelect = document.getElementById("product");
  const nozzleGroup   = document.getElementById("nozzleGroup");

  // Reset dropdown
  productSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "-- Select Product --";
  defaultOption.disabled    = true;
  defaultOption.selected    = true;
  productSelect.appendChild(defaultOption);

  // Populate new options
  const products = fertilizerData[nutrient] || {};
  Object.keys(products).forEach(name => {
    const option = document.createElement("option");
    option.value       = name;
    option.textContent = name;
    productSelect.appendChild(option);
  });

  // Show/hide nozzle input for UAN products
  productSelect.onchange = () => {
    nozzleGroup.style.display = productSelect.value.includes("UAN")
                                   ? "block"
                                   : "none";
  };
  nozzleGroup.style.display = "none";
}

function calculate() {
  const nutrient  = document.getElementById("nutrient").value;
  const product   = document.getElementById("product").value;
  const pureRate  = parseFloat(document.getElementById("pureRate").value);
  const acres     = parseFloat(document.getElementById("acres").value);
  const resultEl  = document.getElementById("result");

  if (!product || isNaN(pureRate) || pureRate <= 0 ||
      isNaN(acres)   || acres   <= 0) {
    resultEl.textContent = "Please enter valid numbers and select a product.";
    return;
  }

  const percent        = fertilizerData[nutrient][product];
  const productPerAcre = pureRate / percent;
  const totalProduct   = productPerAcre * acres;

  let resultText = `To apply ${pureRate.toFixed(2)} lbs of ${nutrient} per acre using ${product}, you need:<br>`;

  if (product.includes("UAN")) {
    const gpa    = productPerAcre / 11.06;
    const totalG = totalProduct   / 11.06;
    resultText +=
      `• ${gpa.toFixed(2)} gallons/acre<br>` +
      `• ${totalG.toFixed(2)} gallons total for ${acres} acres.`;
  } else {
    resultText +=
      `• ${productPerAcre.toFixed(2)} lbs/acre<br>` +
      `• ${totalProduct.toFixed(2)} lbs total for ${acres} acres.`;
  }

  resultEl.innerHTML = resultText;
}

function generateCatchTable() {
  const nutrient      = document.getElementById("nutrient").value;
  const product       = document.getElementById("product").value;
  const pureRateInput = parseFloat(document.getElementById("pureRate").value);
  const spreaderWidth = parseFloat(document.getElementById("spreaderWidth").value);
  const nozzles       = parseInt(document.getElementById("nozzles").value, 10);
  const table         = document.getElementById("catchTable");

  if (!product ||
      isNaN(pureRateInput) || pureRateInput <= 0 ||
      isNaN(spreaderWidth)  || spreaderWidth  <= 0 ||
     (product.includes("UAN") && (isNaN(nozzles) || nozzles <= 0))
  ) {
    alert("Please enter valid inputs for spreader width, rate, and number of nozzles.");
    return;
  }

  const percent = fertilizerData[nutrient][product];
  const lbsAcre = pureRateInput / percent;

  // Build header
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

  // Build data rows
  for (let speed = 1.0; speed <= 10.0; speed += 0.5) {
    const fpm      = speed * 88;
    const areaMin  = spreaderWidth * fpm;
    const catchLbs = (lbsAcre * areaMin) / 43560;
    const row      = document.createElement("tr");

    if (product.includes("UAN")) {
      const gal   = catchLbs / 11.06;
      const ml    = gal * 3785.41;
      const perNo = ml / nozzles;
      row.innerHTML = `
        <td>${speed}</td>
        <td>${gal.toFixed(2)}</td>
        <td>${ml.toFixed(1)}</td>
        <td>${perNo.toFixed(1)}</td>`;
    } else {
      row.innerHTML = `
        <td>${speed}</td>
        <td>${catchLbs.toFixed(2)}</td>`;
    }

    table.appendChild(row);
  }
}