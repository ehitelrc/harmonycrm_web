import { Injectable } from '@angular/core';
import { ApiResponse } from '@app/models';
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
import { Canton, Country, District, Province } from '@app/models/locations.model';

 
const GATEWAY = '/locations';
export const GEO_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class GeoService {
  constructor(private fetch: FetchService) {}

  // 🌎 Países
  async getCountries(): Promise<ApiResponse<Country[]>> {
    return await this.fetch.get<ApiResponse<Country[]>>({
      API_Gateway: `${GEO_URL}/countries`,
    });
  }

  async getCountryById(id: number): Promise<ApiResponse<Country>> {
    return await this.fetch.get<ApiResponse<Country>>({
      API_Gateway: `${GEO_URL}/countries/${id}`,
    });
  }

  async createCountry(payload: Partial<Country>): Promise<ApiResponse<Country>> {
    return await this.fetch.post<ApiResponse<Country>>({
      API_Gateway: `${GEO_URL}/countries`,
      values: payload,
    });
  }

  async updateCountry(id: number, payload: Partial<Country>): Promise<ApiResponse<Country>> {
    payload.id = id;
    return await this.fetch.put<ApiResponse<Country>>({
      API_Gateway: `${GEO_URL}/countries`,
      values: payload,
    });
  }

  async deleteCountry(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${GEO_URL}/countries/${id}`,
    });
  }

 
  async getProvincesByCountry(countryId: number): Promise<ApiResponse<Province[]>> {
    return await this.fetch.get<ApiResponse<Province[]>>({
      API_Gateway: `${GEO_URL}/provinces/country/${countryId}`,
    });
  }

  async createProvince(payload: Partial<Province>): Promise<ApiResponse<Province>> {
    return await this.fetch.post<ApiResponse<Province>>({
      API_Gateway: `${GEO_URL}/provinces`,
      values: payload,
    });
  }

  async updateProvince(id: number, payload: Partial<Province>): Promise<ApiResponse<Province>> {
    payload.id = id;
    return await this.fetch.put<ApiResponse<Province>>({
      API_Gateway: `${GEO_URL}/provinces`,
      values: payload,
    });
  }

  async deleteProvince(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${GEO_URL}/provinces/${id}`,
    });
  }

  // 🏘 Cantones
  async getCantons(): Promise<ApiResponse<Canton[]>> {
    return await this.fetch.get<ApiResponse<Canton[]>>({
      API_Gateway: `${GEO_URL}/cantons`,
    });
  }

  async getCantonsByProvince(provinceId: number): Promise<ApiResponse<Canton[]>> {
    return await this.fetch.get<ApiResponse<Canton[]>>({
      API_Gateway: `${GEO_URL}/cantons/province/${provinceId}`,
    });
  }

  async createCanton(payload: Partial<Canton>): Promise<ApiResponse<Canton>> {
    return await this.fetch.post<ApiResponse<Canton>>({
      API_Gateway: `${GEO_URL}/cantons`,
      values: payload,
    });
  }

  async updateCanton(id: number, payload: Partial<Canton>): Promise<ApiResponse<Canton>> {
    payload.id = id;
    return await this.fetch.put<ApiResponse<Canton>>({
      API_Gateway: `${GEO_URL}/cantons`,
      values: payload,
    });
  }

  async deleteCanton(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${GEO_URL}/cantons/${id}`,
    });
  }

  // 📍 Distritos
  async getDistricts(): Promise<ApiResponse<District[]>> {
    return await this.fetch.get<ApiResponse<District[]>>({
      API_Gateway: `${GEO_URL}/districts`,
    });
  }

  async getDistrictsByCanton(cantonId: number): Promise<ApiResponse<District[]>> {
    return await this.fetch.get<ApiResponse<District[]>>({
      API_Gateway: `${GEO_URL}/districts/canton/${cantonId}`,
    });
  }

  async createDistrict(payload: Partial<District>): Promise<ApiResponse<District>> {
    return await this.fetch.post<ApiResponse<District>>({
      API_Gateway: `${GEO_URL}/districts`,
      values: payload,
    });
  }

  async updateDistrict(id: number, payload: Partial<District>): Promise<ApiResponse<District>> {
    payload.id = id;
    return await this.fetch.put<ApiResponse<District>>({
      API_Gateway: `${GEO_URL}/districts`,
      values: payload,
    });
  }

  async deleteDistrict(id: number): Promise<ApiResponse<void>> {
    return await this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${GEO_URL}/districts/${id}`,
    });
  }
}