export const USER_ROLE = {
  admin: 'admin', //assigned by super admin/hopper company
  customer: 'customer',
  driver: 'driver',
  dispatcher: 'dispatcher',
  company: 'company',
  hopperCompany: 'hopperCompany', // super admin
} as const;

export const USER_STATUS = {
  active: 'active',
  blocked: 'blocked',
} as const;

export const GENDER = {
  male: 'male',
  female: 'female',
  others: 'others',
} as const;

export const JOB_STATUS = {
  pending: 'pending',
  in_progress: 'in-progress',
  dispatched: 'dispatched',
  en_route: 'en-route',
  working: 'working',
  completed: 'completed',
  cancelled: 'cancelled',
  just: 'just',
  picked_up: 'picked-up',
  dropped_off: 'dropped-off',
} as const;
