import { Canton, Country, District, Province } from "./locations.model";

export interface Client {
  id: number;
  external_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  country_id?: number | null;
  province_id?: number | null;
  canton_id?: number | null;
  district_id?: number | null;
  address_detail?: string | null;
  postal_code?: string | null;
  country?: Country;
  province?: Province;
  canton?: Canton;
  district?: District;
  created_at?: string;
  updated_at?: string;
  is_citizen?: boolean | null;
}