import { Client } from './client.model';

export interface DuplicatePhoneGroup {
  phone: string;
  count: number;
  clients: Client[];
}