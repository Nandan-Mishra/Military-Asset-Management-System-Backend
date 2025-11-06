// User Roles
const ROLES = {
  ADMIN: 'admin',
  BASE_COMMANDER: 'base_commander',
  LOGISTICS_OFFICER: 'logistics_officer'
};

// Equipment Types
const EQUIPMENT_TYPES = {
  WEAPON: 'weapon',
  VEHICLE: 'vehicle',
  AMMUNITION: 'ammunition',
  EQUIPMENT: 'equipment'
};

// Asset Status
const ASSET_STATUS = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  EXPENDED: 'expended',
  TRANSFER_PENDING: 'transfer_pending'
};

module.exports = {
  ROLES,
  EQUIPMENT_TYPES,
  ASSET_STATUS
};

