import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChannelIntegration, ChannelIntegrationDTO } from '@app/models/channel-integration.model';
import { ChannelService } from '@app/services/channel.service';
import { AlertService } from '@app/services/extras/alert.service';
import { AuthService, LanguageService } from '@app/services';
import { Company } from '@app/models/company.model';
import { CompanyService } from '@app/services/company.service';
import { User as UserAuthModel } from '../../../models/auth.model';
import { CompanyUser } from '@app/models/companies_user_view';
import { Department } from '@app/models/department.model';
import { DepartmentService } from '@app/services/department.service';

@Component({
  selector: 'app-channel-integration-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-integration-form.component.html',
  styleUrls: ['./channel-integration-form.component.css']
})
export class ChannelIntegrationFormComponent {
  @Input() integration: ChannelIntegrationDTO | null = null;
  @Input() companyId!: number;
  @Input() channelId!: number;

  @Output() success = new EventEmitter<ChannelIntegrationDTO>();
  @Output() cancel = new EventEmitter<void>();

  model: Partial<ChannelIntegrationDTO> = {
    webhook_url: '',
    access_token: '',
    app_identifier: '',
    is_active: true
  };

  isSubmitting = false;


  departments: Department[] = [];
  loggedUser: UserAuthModel | null = null;
  isLoadingDepartments = false;

  selectedCompany: number | null = null;


  selectedDepartmentId: number | null = null;

  constructor(
    private authService: AuthService,
    private departmentService: DepartmentService,
    private service: ChannelService,
    private alert: AlertService,
    private lang: LanguageService
  ) { }

  get t() {
    return this.lang.t.bind(this.lang);
  }

ngOnInit(): void {
  this.loggedUser = this.authService.getCurrentUser();

  this.loadDepartments().then(() => {
    if (this.integration) {
      this.model = { ...this.integration };
      this.selectedDepartmentId = this.integration.department_id ?? null;
      console.log('Departamento seleccionado:', this.selectedDepartmentId);
    }
  });
}

  //Load departments for selection
  private async loadDepartments(): Promise<void> {
    try {
      this.isLoadingDepartments = true;
      const res = await this.departmentService.getByCompany(this.companyId);
      const data = (res as { data?: unknown })?.data;
      const list: Department[] = Array.isArray(data) ? data as Department[] : [];

      this.departments = list;

    } catch {
      this.alert.error('Error cargando departamentos');
      this.departments = [];

    } finally {
      this.isLoadingDepartments = false;
    }
  }


  async submit(): Promise<void> {
    this.isSubmitting = true;
    try {
      const payload = {
        ...this.model,
        company_id: this.companyId,
        channel_id: this.channelId,
        department_id: this.selectedDepartmentId
      };

      let res;
      if (this.integration) {
        res = await this.service.UpdateIntegration(this.integration.channel_integration_id, payload);
      } else {
        res = await this.service.CreateIntegration(payload);
      }

      if (res.success && res.data) {
        this.alert.success(this.t('integration.saved_successfully'));
        this.success.emit(res.data);
      } else {
        this.alert.error(this.t('integration.save_failed'));
      }
    } catch (e) {
      this.alert.error(this.t('integration.save_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  // Se llama cuando se selecciona la compañía desde <app-company-select>
  onCompanySelected(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCompany = value ? +value : null;

  }

  onCancel() {
    this.cancel.emit();
  }

  async onDepartmentSelected(): Promise<void> {
    if (!this.selectedDepartmentId) return;
    try {

    } catch (err) {
      console.error('Error loading agents by department', err);
    }
  }


}