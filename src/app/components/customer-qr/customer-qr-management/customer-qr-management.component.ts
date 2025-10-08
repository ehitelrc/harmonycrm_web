import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as CryptoJS from 'crypto-js';

import { AuthService, LanguageService } from '@app/services';
import { AlertService } from '@app/services/extras/alert.service';
import { CompanyService } from '@app/services/company.service';
import { CampaignService } from '@app/services/campaign.service';
import { User as UserAuthModel } from '@app/models/auth.model';

import { CompanyUser } from '@app/models/companies_user_view';
import { CampaignWithFunnel } from '@app/models/campaign-with-funnel.model';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { DepartmentService } from '@app/services/department.service';
import { Department } from '@app/models/department.model';

@Component({
  selector: 'app-customer-qr-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MainLayoutComponent
  ],
  templateUrl: './customer-qr-management.component.html',
  styleUrls: ['./customer-qr-management.component.css']
})
export class CustomerQRManagementComponent implements OnInit {
  companies: CompanyUser[] = [];
  campaigns: CampaignWithFunnel[] = [];

  loggedUser: UserAuthModel | null = null;

  selectedCompany: number | null = null;
  selectedCampaign: CampaignWithFunnel | null = null;

  phoneNumber = '';
  waLink = '';
  qrImageSrc = '';
  generated = false;

  loadingCompanies = false;
  loadingCampaigns = false;
  filtersExpanded = true;

  departments: Department[] = [];
  selectedDepartment: number | null = null;

  // Clave secreta — puedes moverla a environment.ts
  private encryptionKey = 'HarmonySecretKey123!';

  constructor(
    private authService: AuthService,
    private languageService: LanguageService,
    private alertService: AlertService,
    private companyService: CompanyService,
    private campaignService: CampaignService,
    private departmentService: DepartmentService
  ) { }

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  async ngOnInit(): Promise<void> {
    this.loggedUser = this.authService.getCurrentUser();
    await this.loadCompanies();
  }

  private async loadCompanies() {
    try {
      this.loadingCompanies = true;
      if (!this.loggedUser) return;
      const res = await this.companyService.getCompaniesByUserId(this.loggedUser.user_id);
      this.companies = res?.data?.map((c: any) => ({
        company_id: c.company_id,
        company_name: c.company_name
      })) ?? [];
    } catch (err) {
      console.error('Error loading companies', err);
      this.alertService.error('No se pudieron cargar las compañías.');
    } finally {
      this.loadingCompanies = false;
    }
  }

  async loadDepartments() {
    try {
      if (!this.selectedCompany) return;
      const res = await this.departmentService.getByCompany(this.selectedCompany);
      this.departments = res?.data ?? [];
    } catch (err) {
      console.error('Error loading departments', err);
      this.alertService.error('No se pudieron cargar los departamentos.');
    }
  }

  async onDepartmentSelected() {
    console.log('Departamento seleccionado:', this.selectedDepartment);
  }

  async onCompanySelected() {
    try {
      this.selectedCampaign = null;
      this.campaigns = [];
      this.generated = false;
      if (!this.selectedCompany) return;

      this.loadingCampaigns = true;
      const res = await this.campaignService.getByCompany(this.selectedCompany);
      this.campaigns = res?.data ?? [];

      await this.loadDepartments();

    } catch (err) {
      console.error('Error loading campaigns', err);
      this.alertService.error('No se pudieron cargar las campañas.');
    } finally {
      this.loadingCampaigns = false;
    }
  }

  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  /** 🔒 Cifra un texto con AES */
  private encryptData(data: string): string {
    const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    return encodeURIComponent(encrypted); // para URL seguro
  }

  /** 🔓 Desencriptar (referencia futura, backend o test) */
  private decryptData(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedText), this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  generateQR() {
  if (!this.selectedCompany || !this.selectedCampaign || !this.phoneNumber) {
    this.alertService.error('Faltan datos obligatorios.');
    return;
  }

  const cleanPhone = this.phoneNumber.replace(/\D/g, '');
  const rawPayload = `${this.selectedCompany}|${this.selectedCampaign.campaign_id}|${this.loggedUser?.user_id}|${this.selectedDepartment}`;
  const encryptedPayload = this.encryptData(rawPayload);

  // 🚀 Convertir directamente a base64 legible por backend
  const base64Encoded = btoa(encryptedPayload);

  // Prefijo más claro
  const msg = `ccc||--FCH--||ccc${rawPayload}`;

  // WhatsApp link
  const encodedMsg = encodeURIComponent(msg);
  this.waLink = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  this.qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(this.waLink)}`;
  this.generated = true;

  console.log('🔹 Payload original:', rawPayload);
  console.log('🔹 Cifrado:', encryptedPayload);
  console.log('🔹 En base64:', base64Encoded);
}

  copyLink() {
    if (!this.waLink) return;
    navigator.clipboard.writeText(this.waLink)
      .then(() => this.alertService.success('Enlace copiado al portapapeles'))
      .catch(() => this.alertService.error('No se pudo copiar el enlace'));
  }
}