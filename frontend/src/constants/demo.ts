export const DEMO_VERSION = 'v3.0.0-liquid-gloss';

export const DEMO_HOUSEHOLD_NAME = 'Mario Family';

// These emails MUST match DataInitializer.java seeded users exactly
export const DEMO_USERS = [
  {
    userId: 1,
    fullName: 'Mario',
    email: 'demo@manaKhata.app',
    role: 'HOUSEHEAD',
    isHousehead: true,
    walletBalance: 45000,
  },
  {
    userId: 2,
    fullName: 'Ria',
    email: 'ria@manaKhata.app',
    role: 'PARENT',
    isHousehead: false,
    walletBalance: 15000,
  },
  {
    userId: 3,
    fullName: 'Max',
    email: 'max@manaKhata.app',
    role: 'ADULT_CHILD',
    isHousehead: false,
    walletBalance: 8000,
  },
  {
    userId: 4,
    fullName: 'Lucy',
    email: 'lucy@manaKhata.app',
    role: 'STUDENT',
    isHousehead: false,
    walletBalance: 3000,
  },
  {
    userId: 5,
    fullName: 'Jack',
    email: 'jack@manaKhata.app',
    role: 'STUDENT',
    isHousehead: false,
    walletBalance: 3000,
  },
];

export const MASKED_PHONE_PREFIX = '+91 98XXXXXX0';
