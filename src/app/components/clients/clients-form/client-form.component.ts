import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client } from '@app/models/client.model';
import { ClientService } from '@app/services/client.service';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';
import { Canton, Country, District, Province } from '@app/models/locations.model';
import { GeoService } from '@app/services/geo.service';
import { CustomField } from '@app/models/custom-field.model';
import { CustomFieldsFormComponent } from './custom-fields-form.component';


@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomFieldsFormComponent, FormsModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css'],
})
export class ClientFormComponent implements OnInit, OnChanges {
  @Input() client: Client | null = null;
  @Input() phoneNumber: string | null = null; // para prellenar el teléfono al crear
  @Output() success = new EventEmitter<Client>();
  @Output() cancel = new EventEmitter<void>();
  @Output() click = new EventEmitter<void>();

  idType: 'national' | 'other' = 'national';

  form!: FormGroup;
  isEditing = false;
  isSubmitting = false;

  countries: Country[] = [];
  provinces: Province[] = [];
  cantons: Canton[] = [];
  districts: District[] = [];

  customFields: CustomField[] = [];
  customValues: any = {};

  activeTab: 'general' | 'location' | 'other' | 'custom' = 'general';

  constructor(
    private geo: GeoService,
    private fb: FormBuilder,
    private clientService: ClientService,
    private lang: LanguageService,
    private alert: AlertService
  ) { }

  get t() {
    return this.lang.t.bind(this.lang);
  }

  async ngOnInit() {
    this.build();
    await this.loadCountries();
    await this.patch();
    await this.loadCustomFields();

    // 🟢 Si es nuevo registro, seleccionar Nacional por defecto
    if (!this.isEditing) {
      this.idType = 'national';
      this.onIdTypeChange();
    }
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['client'] && this.form) {
      this.isEditing = !!this.client;
      await this.patch();
      await this.loadCustomFields();
    }
  }
 
  private build(): void {
    this.form = this.fb.group({
      external_id: ['', [Validators.maxLength(20)]],
      full_name: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      phone: ['', [Validators.maxLength(50)]],
      country_id: [null, Validators.required],
      province_id: [null],
      canton_id: [null],
      district_id: [null],
      address_detail: [''],
      postal_code: [''],
      is_citizen: [false],
    });
  }
 
  private async patch(): Promise<void> {
  if (!this.client) {
    this.isEditing = false;
    this.form.reset();
    if (this.phoneNumber) {
      this.form.patchValue({ phone: this.phoneNumber });
    }

    // 🟢 Nuevo cliente → nacional por defecto
    this.idType = 'national';
    // ⚡ Esperar cambio en ngModel y aplicar validadores
    setTimeout(() => this.onIdTypeChange());
    return;
  }

  this.isEditing = true;

  this.form.patchValue({
    external_id: this.client.external_id || '',
    full_name: this.client.full_name || '',
    email: this.client.email || '',
    phone: this.client.phone || '',
    country_id: this.client.country_id || null,
    province_id: this.client.province_id || null,
    canton_id: this.client.canton_id || null,
    district_id: this.client.district_id || null,
    address_detail: this.client.address_detail || '',
    postal_code: this.client.postal_code || '',
    is_citizen: this.client.is_citizen ?? null,
  });

  // 🧠 Determinar tipo de ID según is_citizen o formato
  const rawId = (this.client.external_id || '').replace(/\D/g, '');

  if (this.client.is_citizen === true || rawId.length === 9) {
    this.idType = 'national';
    if (rawId.length === 9) {
      const formatted = `${rawId.slice(0, 1)} ${rawId.slice(1, 5)} ${rawId.slice(5, 9)}`;
      this.form.patchValue({ external_id: formatted });
    }
  } else {
    this.idType = 'other';
  }

  // ⚡ Forzar refresco de validadores tras aplicar el ngModel
  setTimeout(() => this.onIdTypeChange());

  // 🌍 Cargar ubicaciones
  if (this.client.country_id) {
    await this.loadProvinces(this.client.country_id);
    if (this.client.province_id) {
      await this.loadCantons(this.client.province_id);
      if (this.client.canton_id) {
        await this.loadDistricts(this.client.canton_id);
      }
    }
  }
}

  
  isInvalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.form.value,
      custom_fields: this.customValues, // 🔥 incluye dinámicos
      is_citizen: this.idType === 'national' ? true : false,
    };

    this.isSubmitting = true;
    try {
      let resp;
      if (this.isEditing && this.client) {
        resp = await this.clientService.update(this.client.id, payload);
      } else {
        resp = await this.clientService.create(payload);
      }

      if (resp.success && resp.data) {
        this.success.emit(resp.data);
      } else {
        this.alert.error(resp.message || this.t('client.operation_failed'));
      }
    } catch (e) {
      console.error(e);
      this.alert.error(this.t('client.operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // 🌍 Carga de ubicaciones
  private async loadCountries() {
    const res = await this.geo.getCountries();
    if (res.success) this.countries = res.data;
  }

  private async loadProvinces(countryId: number) {
    const res = await this.geo.getProvincesByCountry(countryId);
    this.provinces = res.success ? res.data : [];
  }

  private async loadCantons(provinceId: number) {
    const res = await this.geo.getCantonsByProvince(provinceId);
    this.cantons = res.success ? res.data : [];
  }

  private async loadDistricts(cantonId: number) {
    const res = await this.geo.getDistrictsByCanton(cantonId);
    this.districts = res.success ? res.data : [];
  }

  async onCountryChange() {
    const countryId = this.form.get('country_id')?.value;
    if (!countryId) return;
    await this.loadProvinces(countryId);
    this.form.patchValue({ province_id: null, canton_id: null, district_id: null });
    this.cantons = [];
    this.districts = [];
  }

  async onProvinceChange() {
    const provinceId = this.form.get('province_id')?.value;
    if (!provinceId) return;
    await this.loadCantons(provinceId);
    this.form.patchValue({ canton_id: null, district_id: null });
    this.districts = [];
  }

  async onCantonChange() {
    const cantonId = this.form.get('canton_id')?.value;
    if (!cantonId) return;
    await this.loadDistricts(cantonId);
    this.form.patchValue({ district_id: null });
  }

  // 🧩 Llama al endpoint del backend ya existente
  private async loadCustomFields() {
    try {
      const entityId = this.client?.id || 0;
      const res = await this.clientService.getCustomFields(entityId);
      if (res.success && Array.isArray(res.data)) {
        this.customFields = res.data;
      } else {
        this.customFields = [];
      }
    } catch (err) {
      console.error('Error cargando campos personalizados:', err);
      this.customFields = [];
    }
  }

onIdTypeChange() {
  const idControl = this.form.get('external_id');
  if (!idControl) return;

  idControl.clearValidators();

  if (this.idType === 'national') {
    idControl.setValidators([
      Validators.pattern(/^\d{1}\s\d{4}\s\d{4}$/),
    ]);
  }

  idControl.updateValueAndValidity();
}

onExternalIdInput(event: Event) {
  const input = event.target as HTMLInputElement;
  let value = input.value;

  if (this.idType === 'national') {
    value = value.replace(/\D/g, '');
    if (value.length > 9) value = value.slice(0, 9);

    if (value.length > 1 && value.length <= 5) {
      value = `${value.slice(0, 1)} ${value.slice(1)}`;
    } else if (value.length > 5) {
      value = `${value.slice(0, 1)} ${value.slice(1, 5)} ${value.slice(5, 9)}`;
    }
  }

  input.value = value.trim();
  this.form.get('external_id')?.setValue(value.trim());
  this.form.get('external_id')?.updateValueAndValidity({ emitEvent: false });
}
}