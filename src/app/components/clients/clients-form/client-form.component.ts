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

  countrySelected: Country | null = null;
  provinceSelected: Province | null = null;
  cantonSelected: Canton | null = null;
  districtSelected: District | null = null;

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
    await this.loadLocationHierarchyForEdit();  // <<--- AQUI
    await this.loadCustomFields();

    // 🟢 Si es nuevo registro, seleccionar Nacional por defecto
    if (!this.isEditing) {
      this.idType = 'national';
      this.onIdTypeChange();
      this.form.patchValue({ phone: '506' });
    }
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['client'] && this.form) {
      this.isEditing = !!this.client;
      await this.patch();
      await this.loadLocationHierarchyForEdit();  // <<--- AQUI
      await this.loadCustomFields();
    }
  }

  private build(): void {
    this.form = this.fb.group({
      external_id: ['', [Validators.maxLength(20)]],
      full_name: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      phone: ['', [Validators.maxLength(50)]],
      country_id: [null as Country | null, Validators.required],
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
    // if (this.client.country_id) {
    //   await this.loadProvinces(this.countrySelected?.iso_code || '');
    //   if (this.client.province_id) {
    //     await this.loadCantons(this.countrySelected?.iso_code);
    //     if (this.client.canton_id) {
    //       await this.loadDistricts(this.client.canton_id);
    //     }
    //   }
    // }
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

  private async loadProvinces(iso_code: string) {
    console.log('Cargando provincias para ISO:', iso_code);
    const res = await this.geo.getProvincesByCountry(iso_code);
    this.provinces = res.success ? res.data : [];
  }

  private async loadCantons(country_iso: string, province_code: string) {
    const res = await this.geo.getCantonsByProvince(country_iso, province_code);
    this.cantons = res.success ? res.data : [];
  }

  private async loadDistricts(country_iso: string, canton_code: string) {
    const res = await this.geo.getDistrictsByCanton(country_iso, canton_code);
    this.districts = res.success ? res.data : [];
  }
  async onCountrySelectedChange(country: Country | null) {
    if (!country) {
      this.countrySelected = null;
      this.provinces = [];
      return;
    }

    this.countrySelected = country;
    console.log('País seleccionado:', this.countrySelected);

    await this.loadProvinces(country.iso_code);

    this.form.patchValue({ country_id: this.countrySelected.id, province_id: null, canton_id: null, district_id: null });
    this.cantons = [];
    this.districts = [];
  }

  async onProvinceSelectedChange(province: Province | null) {
    if (!province) {
      this.provinceSelected = null;
      this.cantons = [];
      this.districts = [];
      return;
    }

    this.provinceSelected = province;
    console.log('Provincia seleccionada:', this.provinceSelected);

    await this.loadCantons(this.countrySelected?.iso_code!, province.code);

    // Limpiar dependientes
    this.form.patchValue({
      province_id: province.id,
      canton_id: null,
      district_id: null,
    });
    this.districts = [];
  }

  async onCantonSelectedChange(canton: Canton | null) {
    if (!canton) {
      this.cantonSelected = null;
      this.districts = [];
      return;
    }

    this.cantonSelected = canton;
    console.log('Cantón seleccionado:', this.cantonSelected);

    await this.loadDistricts(this.countrySelected?.iso_code!, this.cantonSelected?.code!);

    // Limpiar dependientes y sincronizar el ID en el formulario
    this.form.patchValue({
      canton_id: canton.id,
      district_id: null,
    });
  }

  async onDistrictSelectedChange(district: District | null) {
    if (!district) {
      this.districtSelected = null;
      return;
    }

    this.districtSelected = district;

    console.log('Distrito seleccionado:', this.districtSelected);

    // Si querés guardar el ID en el formulario:
    this.form.patchValue({
      district_id: district.id
    });
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

  private async loadLocationHierarchyForEdit() {
    if (!this.client) return;

    /** 1) COUNTRY */
    if (this.client.country_id) {
      this.countrySelected = this.countries.find(c => c.id === this.client!.country_id) || null;

      if (this.countrySelected) {
        await this.loadProvinces(this.countrySelected.iso_code);
        this.form.patchValue({ country_id: this.countrySelected.id });
      }
    }

    /** 2) PROVINCE */
    if (this.client.province_id) {
      this.provinceSelected = this.provinces.find(p => p.id === this.client!.province_id) || null;

      if (this.provinceSelected) {
        await this.loadCantons(
          this.countrySelected!.iso_code,
          this.provinceSelected.code
        );
        this.form.patchValue({ province_id: this.provinceSelected.id });
      }
    }

    /** 3) CANTON */
    if (this.client.canton_id) {
      this.cantonSelected = this.cantons.find(c => c.id === this.client!.canton_id) || null;

      if (this.cantonSelected) {
        await this.loadDistricts(
          this.countrySelected!.iso_code,
          this.cantonSelected.code
        );
        this.form.patchValue({ canton_id: this.cantonSelected.id });
      }
    }

    /** 4) DISTRICT */
    if (this.client.district_id) {
      this.districtSelected = this.districts.find(d => d.id === this.client!.district_id) || null;

      if (this.districtSelected) {
        this.form.patchValue({ district_id: this.districtSelected.id });
      }
    }
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