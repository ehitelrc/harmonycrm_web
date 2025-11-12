
/* ============================================
 * 🇨🇷 COUNTRY
 * ============================================ */
export interface Country {
  id: number;
  name: string;
  iso_code: string;
  phone_code?: string;
  currency_code?: string;
  provinces?: Province[];
  created_at?: string;
  updated_at?: string;
}

/* ============================================
 * 🏞️ PROVINCE
 * ============================================ */
export interface Province {
  id: number;
  country_code: string;
  code: string;
  name: string;
  province_number: number;
  cantons?: Canton[];
  created_at?: string;
  updated_at?: string;
}

/* ============================================
 * 🏘️ CANTON
 * ============================================ */
export interface Canton {
  id: number;
  country_code: string;
  province_code: string;
  code: string;
  name: string;
  canton_number: number;
  districts?: District[];
  created_at?: string;
  updated_at?: string;
}

/* ============================================
 * 🏡 DISTRICT
 * ============================================ */
export interface District {
  id: number;
  country_code: string;
  canton_code: string;
  code: string;
  name: string;
  latitude?: number;
  longitude?: number;
  postal_code?: string;
  created_at?: string;
  updated_at?: string;
}