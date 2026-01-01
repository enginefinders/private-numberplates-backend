// lib/pricing.js

// Pricing table (full set: front + back plates)
export const pricingTable = {
  "2D": {
    standard: 24.95,
    short7: 34.95,
    short6: 34.95,
    short5: 34.95,
    short4: 34.95,
    short3: 34.95,
  },
  "3D": {
    standard: 39.95,
    short7: 49.95,
    short6: 49.95,
    short5: 49.95,
    short4: 49.95,
    short3: 49.95,
  },
  "4D_3mm": {
    standard: 39.95,
    short7: 49.95,
    short6: 49.95,
    short5: 49.95,
    short4: 49.95,
    short3: 49.95,
  },
  "4D_5mm": {
    standard: 69.95,
    short7: 79.95,
    short6: 79.95,
    short5: 79.95,
    short4: 79.95,
    short3: 79.95,
  },
  "5D": {
    standard: 69.95,
    short7: 79.95,
    short6: 79.95,
    short5: 79.95,
    short4: 79.95,
    short3: 79.95,
  },
  Ghost: {
    standard: 69.95,
    short7: 79.95,
    short6: 79.95,
    short5: 79.95,
    short4: 79.95,
    short3: 79.95,
  },
};

// Helper: calculate price
export function getPrice(type, size, sides = "both") {
  if (!pricingTable[type]) {
    throw new Error(`Invalid plate type: ${type}`);
  }

  const basePrice = pricingTable[type][size];
  if (!basePrice) {
    throw new Error(`Invalid plate size: ${size} for type ${type}`);
  }

  // Adjust for sides
  let finalPrice = basePrice;
  if (sides === "front" || sides === "back") {
    finalPrice = basePrice / 2;
  }

  return {
    type,
    size,
    sides,
    basePrice,
    finalPrice: parseFloat(finalPrice.toFixed(2)), // rounded
    breakdown: {
      plate: basePrice,
      sides: sides === "both" ? "Included" : "Half (single plate)",
    },
  };
}
