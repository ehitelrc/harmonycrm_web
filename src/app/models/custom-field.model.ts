export interface CustomField {
  field_id: number;
  field_key: string;
  label: string;
  field_type: 'text' | 'integer' | 'decimal' | 'date' | 'boolean';
  is_required: boolean;
  value: any;
}