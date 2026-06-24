export interface Channel {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  meta_waba_id?: string;
}