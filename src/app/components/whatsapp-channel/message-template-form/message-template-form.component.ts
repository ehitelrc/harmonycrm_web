import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageTemplate } from '@app/models/message-template.model';
import { AlertService } from '@app/services/extras/alert.service';
import { LanguageService } from '@app/services/extras/language.service';
import { WhatsAppTemplateService } from '@app/services/whatsapp-template.service';

@Component({
    selector: 'app-message-template-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './message-template-form.component.html',
})
export class MessageTemplateFormComponent implements OnInit {
    @Input() template: MessageTemplate | null = null;
    @Input() preselectedChannelId: number | null = null;
    @Output() success = new EventEmitter<MessageTemplate>();
    @Output() cancel = new EventEmitter<void>();

    form!: FormGroup;
    isEditing = false;
    isSubmitting = false;

    languages = [
        { code: 'es', name: 'Español (es)' },
        { code: 'es_AR', name: 'Español - Argentina (es_AR)' },
        { code: 'es_BO', name: 'Español - Bolivia (es_BO)' },
        { code: 'es_CL', name: 'Español - Chile (es_CL)' },
        { code: 'es_CO', name: 'Español - Colombia (es_CO)' },
        { code: 'es_CR', name: 'Español - Costa Rica (es_CR)' },
        { code: 'es_DO', name: 'Español - Rep. Dominicana (es_DO)' },
        { code: 'es_EC', name: 'Español - Ecuador (es_EC)' },
        { code: 'es_ES', name: 'Español - España (es_ES)' },
        { code: 'es_GT', name: 'Español - Guatemala (es_GT)' },
        { code: 'es_HN', name: 'Español - Honduras (es_HN)' },
        { code: 'es_MX', name: 'Español - México (es_MX)' },
        { code: 'es_NI', name: 'Español - Nicaragua (es_NI)' },
        { code: 'es_PA', name: 'Español - Panamá (es_PA)' },
        { code: 'es_PE', name: 'Español - Perú (es_PE)' },
        { code: 'es_PR', name: 'Español - Puerto Rico (es_PR)' },
        { code: 'es_PY', name: 'Español - Paraguay (es_PY)' },
        { code: 'es_SV', name: 'Español - El Salvador (es_SV)' },
        { code: 'es_UY', name: 'Español - Uruguay (es_UY)' },
        { code: 'es_VE', name: 'Español - Venezuela (es_VE)' },
        { code: 'en', name: 'Inglés (en)' },
        { code: 'en_GB', name: 'Inglés - Reino Unido (en_GB)' },
        { code: 'en_US', name: 'Inglés - EE. UU. (en_US)' },
        { code: 'pt_BR', name: 'Portugués - Brasil (pt_BR)' },
        { code: 'pt_PT', name: 'Portugués - Portugal (pt_PT)' },
        { code: 'fr', name: 'Francés (fr)' },
        { code: 'it', name: 'Italiano (it)' },
        { code: 'de', name: 'Alemán (de)' },
        { code: 'ar', name: 'Árabe (ar)' },
        { code: 'zh_CN', name: 'Chino - China (zh_CN)' },
        { code: 'zh_HK', name: 'Chino - Hong Kong (zh_HK)' },
        { code: 'zh_TW', name: 'Chino - Taiwán (zh_TW)' },
        { code: 'hr', name: 'Croata (hr)' },
        { code: 'cs', name: 'Checo (cs)' },
        { code: 'da', name: 'Danés (da)' },
        { code: 'nl', name: 'Neerlandés (nl)' },
        { code: 'fi', name: 'Finlandés (fi)' },
        { code: 'el', name: 'Griego (el)' },
        { code: 'he', name: 'Hebreo (he)' },
        { code: 'hi', name: 'Hindi (hi)' },
        { code: 'hu', name: 'Húngaro (hu)' },
        { code: 'id', name: 'Indonesio (id)' },
        { code: 'ja', name: 'Japonés (ja)' },
        { code: 'ko', name: 'Coreano (ko)' },
        { code: 'ms', name: 'Malayo (ms)' },
        { code: 'no', name: 'Noruego (no)' },
        { code: 'pl', name: 'Polaco (pl)' },
        { code: 'ro', name: 'Rumano (ro)' },
        { code: 'ru', name: 'Ruso (ru)' },
        { code: 'sv', name: 'Sueco (sv)' },
        { code: 'th', name: 'Tailandés (th)' },
        { code: 'tr', name: 'Turco (tr)' },
        { code: 'uk', name: 'Ucraniano (uk)' },
        { code: 'vi', name: 'Vietnamita (vi)' }
    ];

    categories = [
        { code: 'UTILITY', name: 'Servicio / Utilidad (UTILITY)' },
        { code: 'MARKETING', name: 'Promocional / Marketing (MARKETING)' },
        { code: 'AUTHENTICATION', name: 'Autenticación / OTP (AUTHENTICATION)' }
    ];

    internalCategories = [
        { code: 'whatsapp', name: 'WhatsApp' },
        { code: 'facebook', name: 'Facebook' },
        { code: 'instagram', name: 'Instagram' }
    ];

    constructor(
        private fb: FormBuilder,
        private templateService: WhatsAppTemplateService,
        private alert: AlertService,
        private lang: LanguageService
    ) { }

    get t() { return this.lang.t.bind(this.lang); }

    async ngOnInit(): Promise<void> {
        this.build();
        this.patch();
    }

    private build(): void {
        this.form = this.fb.group({
            channel_id: [this.preselectedChannelId, Validators.required],
            template_name: ['', [Validators.required, Validators.maxLength(200)]],
            language_code: ['', Validators.required],
            description: [''],
            category: ['whatsapp', Validators.required],
            meta_category: ['UTILITY', Validators.required],
            is_active: [true],
            is_conversation_starter: [false],
            body_content: ['', [Validators.required]],
            header_content: [''],
            footer_content: [''],
            buttons_json: [''],
        });
    }

    private patch(): void {
        if (!this.template) return;
        this.isEditing = true;
        this.form.patchValue({
            channel_id: this.template.channel_id,
            template_name: this.template.template_name,
            language_code: this.template.language_code,
            description: this.template.description ?? '',
            category: this.template.category ?? 'whatsapp',
            meta_category: this.template.meta_category ?? 'UTILITY',
            is_active: this.template.is_active,
            is_conversation_starter: this.template.is_conversation_starter,
            body_content: this.template.body_content ?? '',
            header_content: this.template.header_content ?? '',
            footer_content: this.template.footer_content ?? '',
            buttons_json: this.template.buttons_json ?? '',
        });
    }


    async submit(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const buttonsVal = this.form.get('buttons_json')?.value;
        if (buttonsVal && buttonsVal.trim() !== '') {
            try {
                JSON.parse(buttonsVal);
            } catch (e) {
                this.alert.error('El formato de los botones JSON no es válido.');
                return;
            }
        }

        this.isSubmitting = true;
        try {
            const payload: Partial<MessageTemplate> = { ...this.form.value };

            let resp;
            if (this.isEditing && this.template) {
                resp = await this.templateService.updateMessageTemplate(this.template.id, payload);
            } else {
                resp = await this.templateService.createMessageTemplate(payload);
            }

            if (resp.success) {
                // On create resp.data has the new template; on update it may be null
                this.success.emit((resp.data ?? this.template ?? {}) as MessageTemplate);
            } else {
                this.alert.error(resp.message || 'Error al guardar la plantilla');
            }
        } finally {
            this.isSubmitting = false;
        }
    }

    onCancel(): void { this.cancel.emit(); }
}
