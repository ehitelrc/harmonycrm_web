import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CompanyService } from '@app/services/company.service';

export interface Company {
    company_id: number;
    company_name: string;
}

@Component({
    selector: 'app-company-select',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './company-select.component.html'
})
export class CompanySelectComponent implements OnInit {
    @Input() userId!: number;                // Id del usuario para consultar sus compañías
    @Input() selectedCompanyId?: number;     // Para seleccionar una por defecto
    @Output() companyChange = new EventEmitter<number>();

    companies: Company[] = [];
    loading = false;

    constructor(
        private companyService: CompanyService
    ) { }

    ngOnInit() {
        if (this.userId) {
            this.loadCompanies();
        }
    }

    loadCompanies() {
        this.loading = true;

        this.companyService.getCompaniesByUserId(this.userId).then(response => {
            if (response && response.data) {
                this.companies = response.data.map(company => ({
                    company_id: company.company_id,
                    company_name: company.company_name
                }));
            }

            console.log('Loaded companies:', this.companies);
            
            this.loading = false;
        }).catch(error => {
            console.error('Error loading companies:', error);
            this.loading = false;
        });
    }

    onSelect(value: string) {
        this.companyChange.emit(Number(value));
    }
}