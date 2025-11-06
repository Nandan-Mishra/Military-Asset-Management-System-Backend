const AuditLog = require('../models/AuditLog');

const auditLogger = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    setImmediate(async () => {
      try {
        if (req.user) {
          await AuditLog.create({
            userId: req.user._id,
            action: getActionFromMethod(req.method),
            resource: req.path.split('/')[1] || 'unknown',
            resourceId: req.params.id || null,
            method: req.method,
            endpoint: req.originalUrl,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            requestBody: req.method !== 'GET' ? sanitizeRequestBody(req.body) : null,
            responseStatus: res.statusCode,
            errorMessage: res.statusCode >= 400 ? data : null,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error logging audit:', error);
      }
    });

    return originalSend.call(this, data);
  };

  next();
};

const getActionFromMethod = (method) => {
  const methodMap = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };
  return methodMap[method] || 'READ';
};

const sanitizeRequestBody = (body) => {
  const sanitized = { ...body };
  if (sanitized.password) delete sanitized.password;
  if (sanitized.token) delete sanitized.token;
  return sanitized;
};

module.exports = { auditLogger };

