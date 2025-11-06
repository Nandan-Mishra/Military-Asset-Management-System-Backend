const logger = require('../utils/logger');

// Extracts and logs detailed transaction information from API responses
const logTransactionDetails = (req, user, responseData) => {
  const endpoint = req.path.toLowerCase();
  const body = req.body || {};
  
  let response = null;
  try {
    if (responseData && typeof responseData === 'string') {
      response = JSON.parse(responseData);
    } else if (responseData) {
      response = responseData;
    }
  } catch (e) {
  }
  
  // Helper to extract readable names from populated MongoDB documents
  const getName = (field, responseField) => {
    if (response && response.data && response.data[responseField]) {
      const obj = response.data[responseField];
      return obj.name || obj.fullName || obj.username || obj._id || field;
    }
    return field || 'N/A';
  };
  
  // Removes sensitive data from request body before logging
  const sanitizeBody = (b) => {
    const sanitized = { ...b };
    if (sanitized.password) sanitized.password = '***HIDDEN***';
    if (sanitized.token) sanitized.token = '***HIDDEN***';
    return sanitized;
  };
  
  let transactionLog = '';
  
  if (endpoint.includes('/purchases') && req.method === 'POST') {
    const assetName = getName(body.asset, 'asset');
    const baseName = getName(body.base, 'base');
    const quantity = body.quantity || (response?.data?.quantity) || 'N/A';
    const unitPrice = body.unitPrice || (response?.data?.unitPrice) || 'N/A';
    const totalAmount = response?.data?.totalAmount || (body.unitPrice && body.quantity ? body.unitPrice * body.quantity : 'N/A');
    const equipmentType = body.equipmentType || (response?.data?.equipmentType) || 'N/A';
    const vendor = body.vendor || (response?.data?.vendor) || '';
    
    transactionLog = `Purchase: ${assetName} x${quantity} at ₹${typeof unitPrice === 'number' ? unitPrice.toLocaleString('en-IN') : unitPrice} each (Total: ₹${typeof totalAmount === 'number' ? totalAmount.toLocaleString('en-IN') : totalAmount}) for ${baseName}${vendor ? ` from ${vendor}` : ''}`;
  }
  
  if (endpoint.includes('/transfers')) {
    if (req.method === 'POST') {
      const assetName = getName(body.asset, 'asset');
      const fromBaseName = getName(body.fromBase, 'fromBase');
      const toBaseName = getName(body.toBase, 'toBase');
      const quantity = body.quantity || (response?.data?.quantity) || 'N/A';
      transactionLog = `Transfer: ${quantity} x ${assetName} from ${fromBaseName} to ${toBaseName}`;
    } else if (endpoint.includes('/approve')) {
      const transferData = response?.data;
      const assetName = transferData?.asset?.name || 'N/A';
      const quantity = transferData?.quantity || 'N/A';
      const fromBase = transferData?.fromBase?.name || 'N/A';
      const toBase = transferData?.toBase?.name || 'N/A';
      transactionLog = `Transfer Approved: ${quantity} x ${assetName} from ${fromBase} to ${toBase}`;
    } else if (endpoint.includes('/complete')) {
      const transferData = response?.data;
      const assetName = transferData?.asset?.name || 'N/A';
      const quantity = transferData?.quantity || 'N/A';
      const fromBase = transferData?.fromBase?.name || 'N/A';
      const toBase = transferData?.toBase?.name || 'N/A';
      transactionLog = `Transfer Completed: ${quantity} x ${assetName} from ${fromBase} to ${toBase}`;
    }
  }
  
  if (endpoint.includes('/assignments') && req.method === 'POST') {
    const assetName = getName(body.asset, 'asset');
    const baseName = getName(body.base, 'base');
    const quantity = body.quantity || (response?.data?.quantity) || 'N/A';
    const assignedTo = body.assignedTo || (response?.data?.assignedTo) || 'N/A';
    transactionLog = `Assignment: ${quantity} x ${assetName} assigned to ${assignedTo} at ${baseName}`;
  }
  
  if (endpoint.includes('/assignments') && endpoint.includes('/return')) {
    const assignmentData = response?.data;
    const assetName = assignmentData?.asset?.name || 'N/A';
    const quantity = assignmentData?.quantity || 'N/A';
    const assignedTo = assignmentData?.assignedTo || 'N/A';
    const baseName = assignmentData?.base?.name || 'N/A';
    transactionLog = `Assignment Returned: ${quantity} x ${assetName} returned from ${assignedTo} at ${baseName}`;
  }
  
  if (endpoint.includes('/expenditures') && req.method === 'POST') {
    const assetName = getName(body.asset, 'asset');
    const baseName = getName(body.base, 'base');
    const quantity = body.quantity || (response?.data?.quantity) || 'N/A';
    const reason = body.reason || (response?.data?.reason) || 'N/A';
    transactionLog = `Expenditure: ${quantity} x ${assetName} expended at ${baseName} - Reason: ${reason}`;
  }
  
  if (endpoint.includes('/bases')) {
    if (req.method === 'POST') {
      transactionLog = `Base Created: ${body.name || 'N/A'} (${body.code || 'N/A'}) at ${body.location || 'N/A'}`;
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      const updates = sanitizeBody(body);
      const updateFields = Object.keys(updates).join(', ');
      transactionLog = `Base Updated: ${updateFields}`;
    } else if (req.method === 'DELETE') {
      transactionLog = `Base Deleted`;
    }
  }
  
  if (transactionLog) {
    logger.log(`  └─ ${transactionLog}`);
  }
};

// Middleware to log API calls with meaningful messages and transaction details
const apiLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Maps API endpoints and methods to human-readable action descriptions
  const getAPIMessage = (method, path) => {
    const endpoint = path.toLowerCase();
    
    if (endpoint.includes('/user/auth') || endpoint.includes('/auth')) {
      if (method === 'POST') {
        return 'Login or Register';
      }
      return 'Authentication';
    }
    
    if (endpoint.includes('/dashboard')) {
      return 'View Dashboard';
    }
    
    if (endpoint.includes('/purchases')) {
      if (method === 'GET') return 'View Purchases';
      if (method === 'POST') return 'Create Purchase';
      if (method === 'PUT' || method === 'PATCH') return 'Update Purchase';
      if (method === 'DELETE') return 'Delete Purchase';
      return 'Purchase Operation';
    }
    
    if (endpoint.includes('/transfers')) {
      if (method === 'GET') return 'View Transfers';
      if (method === 'POST') return 'Create Transfer';
      if (endpoint.includes('/approve')) return 'Approve Transfer';
      if (endpoint.includes('/complete')) return 'Complete Transfer';
      return 'Transfer Operation';
    }
    
    if (endpoint.includes('/assignments')) {
      if (method === 'GET') return 'View Assignments';
      if (method === 'POST') return 'Create Assignment';
      if (endpoint.includes('/return')) return 'Return Assignment';
      return 'Assignment Operation';
    }
    
    if (endpoint.includes('/expenditures')) {
      if (method === 'GET') return 'View Expenditures';
      if (method === 'POST') return 'Record Expenditure';
      return 'Expenditure Operation';
    }
    
    if (endpoint.includes('/bases')) {
      if (method === 'GET') return 'View Bases';
      if (method === 'POST') return 'Create Base';
      if (method === 'PUT' || method === 'PATCH') return 'Update Base';
      if (method === 'DELETE') return 'Delete Base';
      return 'Base Operation';
    }
    
    if (endpoint.includes('/assets')) {
      if (method === 'GET') return 'View Assets';
      return 'Asset Operation';
    }
    
    return 'API Request';
  };
  
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const user = req.user 
      ? `${req.user.fullName || req.user.username || req.user.email}`
      : 'Anonymous';
    const userRole = req.user ? `(${req.user.role.replace('_', ' ')})` : '';
    
    const apiMessage = getAPIMessage(req.method, req.path);
    const statusMessage = statusCode >= 400 ? 'Failed' : 'Success';
    
    logger.log(`${apiMessage} by ${user} ${userRole} - ${statusMessage}`);
    
    if (statusCode >= 200 && statusCode < 300 && req.method !== 'GET') {
      logTransactionDetails(req, user, data);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = apiLogger;

