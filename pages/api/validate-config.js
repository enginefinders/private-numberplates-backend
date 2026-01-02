// pages/api/validate-config.js
import { normalizePlateConfig } from '../../lib/plateSchema'; // fixed relative path

export default async function handler(req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plate_config } = req.body || {};
    const {pricing_breakdown, total} = plate_config;
    if (!plate_config) {
      return res.status(400).json({ valid: false, error: 'Missing plate_config' });
    }

    // normalize config
    const config = normalizePlateConfig(plate_config);

    return res.status(200).json({
      valid: true,
      normalized_config: config,
      pricing_breakdown,
      total,
    });
  } catch (e) {
    return res
      .status(e.status || 500)
      .json({ valid: false, error: e.message || 'Validation failed' });
  }
}
