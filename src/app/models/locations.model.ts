export interface Country {
  id: number;
  name: string;
  iso_code?: string | null;
  phone_code?: string | null;
  currency_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Province {
  id: number;
  name: string;
  country_id: number;
  country?: Country;
  created_at?: string;
  updated_at?: string;
}

export interface Canton {
  id: number;
  name: string;
  province_id: number;
  province?: Province;
  created_at?: string;
  updated_at?: string;
}

export interface District {
  id: number;
  name: string;
  canton_id: number;
  canton?: Canton;
  latitude?: number | null;
  longitude?: number | null;
  postal_code?: string | null;
  created_at?: string;
  updated_at?: string;
}