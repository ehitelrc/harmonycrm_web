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
import { DynamicListItem, DynamicListSelectComponent } from '@app/components/dynamic-list-select/dynamic-list-select.component';
import { CustomListService } from '@app/services/custom-list.service';   // ⭐ NUEVO
import { CustomFieldService } from '@app/services/custom-field.service';


export interface ClientCustomFieldDTO {
  entity_id: number;
  entity_name: string;
  field_key: string;
  value: any;
}

interface CustomValueItem {
  field_key: string;
  field_value: any;
}


@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomFieldsFormComponent, FormsModule, DynamicListSelectComponent],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css'],
})
export class ClientFormComponent implements OnInit, OnChanges {

  @Input() client: Client | null = null;
  @Input() phoneNumber: string | null = null;
  @Output() success = new EventEmitter<Client>();
  @Output() cancel = new EventEmitter<void>();

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
  customValues: CustomValueItem[] = [];

  maintenanceModal: { list_id: number; list_name: string } | null = null;



  activeTab: 'general' | 'location' | 'other' = 'general';

  // ⭐ NUEVO: aquí se guardan los valores seleccionados de listas dinámicas
  dynamicListValues: { list_id: number; selected_value: number | null }[] = [];

  constructor(
    private geo: GeoService,
    private fb: FormBuilder,
    private clientService: ClientService,
    private customListService: CustomListService,      // ⭐ NUEVO
    private customFieldService: CustomFieldService,
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
    await this.loadLocationHierarchyForEdit();
    await this.loadCustomFields();

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
      await this.loadLocationHierarchyForEdit();
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
      this.idType = 'national';
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

    const rawId = (this.client.external_id || '').replace(/\D/g, '');
    this.idType = (this.client.is_citizen === true || rawId.length === 9) ? 'national' : 'other';

    setTimeout(() => this.onIdTypeChange());
  }


  isInvalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  // ============================================
  // ⭐ SUBMIT MODIFICADO PARA GUARDAR LISTAS
  // ============================================
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.form.value,
      custom_fields: this.customValues,
      is_citizen: this.idType === 'national'
    };

    console.log("Datos a guardar ", payload);


    this.isSubmitting = true;

    try {
      let resp;

      // Crear o actualizar cliente
      if (this.isEditing && this.client) {
        resp = await this.clientService.update(this.client.id, payload);
      } else {
        resp = await this.clientService.create(payload);
      }

      if (!resp.success || !resp.data) {
        this.alert.error(resp.message || this.t('client.operation_failed'));
        return;
      }

      const clientId = resp.data.id;

      // Custom field values
      if (this.customValues.length > 0) {

        // let  customFieldPayloads: ClientCustomFieldDTO[] = this.customFields.map(field => ({
        //   entity_id: clientId,
        //   entity_name: 'clients',
        //   field_key: field.field_key,
        //   value: this.customValues[field.field_key] || null
        // }));

        const customFieldPayloads = this.customFields.map(f => {
          const v = this.customValues.find(x => x.field_key === f.field_key);
          return {
            entity_id: clientId,
            entity_name: 'clients',
            field_key: f.field_key,
            field_value: v?.field_value ?? null
          };
        });


        this.customFieldService.SaveCustomFieldsValues(customFieldPayloads);



      }

      // ⭐ NUEVO: Guardar listas dinámicas
      if (this.dynamicListValues.length > 0) {
        await this.saveCustomLists(clientId);
      }

      this.success.emit(resp.data);

    } catch (e) {
      console.error(e);
      this.alert.error(this.t('client.operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  // ⭐ NUEVO: Método para grabar las listas dinámicas
  private async saveCustomLists(clientId: number) {
    const operations = this.dynamicListValues.map(item =>
      this.customListService.saveEntityValue({
        entity_name: 'clients',
        entity_id: clientId,
        list_id: item.list_id,
        value_id: item.selected_value
      })
    );
    await Promise.all(operations);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private async loadCountries() {
    const res = await this.geo.getCountries();
    if (res.success) this.countries = res.data;
  }

  private async loadProvinces(iso_code: string) {
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
    await this.loadCantons(this.countrySelected?.iso_code!, province.code);

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
    await this.loadDistricts(this.countrySelected?.iso_code!, this.cantonSelected?.code!);

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

    this.form.patchValue({
      district_id: district.id
    });
  }

  private async loadCustomFields() {
    try {
      const entityId = this.client?.id || 0;
      const res = await this.clientService.getCustomFields(entityId);
      this.customFields = res.success ? res.data : [];
    } catch {
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

    if (this.client.country_id) {
      this.countrySelected = this.countries.find(c => c.id === this.client!.country_id) || null;

      if (this.countrySelected) {
        await this.loadProvinces(this.countrySelected.iso_code);
        this.form.patchValue({ country_id: this.countrySelected.id });
      }
    }

    if (this.client.province_id) {
      this.provinceSelected = this.provinces.find(p => p.id === this.client!.province_id) || null;

      if (this.provinceSelected) {
        await this.loadCantons(this.countrySelected!.iso_code, this.provinceSelected.code);
        this.form.patchValue({ province_id: this.provinceSelected.id });
      }
    }

    if (this.client.canton_id) {
      this.cantonSelected = this.cantons.find(c => c.id === this.client!.canton_id) || null;

      if (this.cantonSelected) {
        await this.loadDistricts(this.countrySelected!.iso_code, this.cantonSelected.code);
        this.form.patchValue({ canton_id: this.cantonSelected.id });
      }
    }

    if (this.client.district_id) {
      this.districtSelected = this.districts.find(d => d.id === this.client!.district_id) || null;

      if (this.districtSelected) {
        this.form.patchValue({ district_id: this.districtSelected.id });
      }
    }
  }

  // ============================================
  // ⭐ NUEVO: capturar los cambios de listas DINÁMICAMENTE
  // ============================================
  onListChange(event: { list_id: number; selected_value: number | null }) {
    const existing = this.dynamicListValues.find(x => x.list_id === event.list_id);

    if (existing) {
      existing.selected_value = event.selected_value;
    } else {
      this.dynamicListValues.push(event);
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



  closeMaintenanceModal() {
    this.maintenanceModal = null;
  }



}