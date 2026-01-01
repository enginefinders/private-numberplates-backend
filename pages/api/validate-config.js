// pages/api/validate-config.js
import { normalizePlateConfig } from '../../lib/plateSchema'; // fixed relative path
import { getPrice } from '../../lib/pricing'; // pricing helper

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plate_config } = req.body || {};
    if (!plate_config) {
      return res.status(400).json({ valid: false, error: 'Missing plate_config' });
    }

    // normalize config
    const config = normalizePlateConfig(plate_config);

    // Extract correct keys
    const plateType = config.plate_type;
    const size = config.size || "standard"; // fallback to standard
    const sides = config.sides || "both";   // default both sides

    // calculate pricing
    const pricing = getPrice(plateType, size, sides);

    return res.status(200).json({
      valid: true,
      normalized_config: config,
      pricing_breakdown: pricing.breakdown,
      total: pricing.finalPrice,
    });
  } catch (e) {
    return res
      .status(e.status || 500)
      .json({ valid: false, error: e.message || 'Validation failed' });
  }
}
