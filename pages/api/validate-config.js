// pages/api/validate-config.js
import { normalizePlateConfig } from '../../lib/plateSchema';
import { logAction } from '../../lib/monitoringLogger';

export default async function handler(req, res) {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); 
  }
  if (req.method !== 'POST') {
    const errorResponse = { error: 'Method not allowed' };
    await logAction({
      endpoint: '/api/validate-config',
      actionName: 'Plate Config Validation Rejected (Method Not Allowed)',
      statusCode: 405,
      requestData: req.body,
      responseData: errorResponse,
      error: 'Method not allowed',
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);
    return res.status(405).json(errorResponse);
  }

  try {
    const { plate_config } = req.body || {};
    if (!plate_config) {
      const errorResponse = { valid: false, error: 'Missing plate_config' };
      await logAction({
        endpoint: '/api/validate-config',
        actionName: 'Plate Config Validation Failed (Missing Config)',
        statusCode: 400,
        requestData: req.body,
        responseData: errorResponse,
        error: 'Missing plate_config in request payload',
        durationMs: Date.now() - startTime,
        req,
      }).catch(console.error);
      return res.status(400).json(errorResponse);
    }

    const { pricing_breakdown, total } = plate_config;

    // normalize config
    const config = normalizePlateConfig(plate_config);

    const successResponse = {
      valid: true,
      normalized_config: config,
      pricing_breakdown,
      total,
    };

    await logAction({
      endpoint: '/api/validate-config',
      actionName: `Plate Validated: ${config?.plate_type || 'Standard'} (${config?.text || 'REG'})`,
      statusCode: 200,
      requestData: req.body,
      responseData: successResponse,
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(200).json(successResponse);
  } catch (e) {
    const statusCode = e.status || 500;
    const errorResponse = { valid: false, error: e.message || 'Validation failed' };

    await logAction({
      endpoint: '/api/validate-config',
      actionName: 'Plate Config Validation Exception',
      statusCode,
      requestData: req.body,
      responseData: errorResponse,
      error: e.message || 'Validation failed exception',
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(statusCode).json(errorResponse);
  }
}
