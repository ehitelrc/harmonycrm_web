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
            category: [''],
            is_active: [true],
            is_conversation_starter: [false],
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
            category: this.template.category ?? 'UTILITY',
            is_active: this.template.is_active,
            is_conversation_starter: this.template.is_conversation_starter,
        });
    }


    async submit(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
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

            if (resp.success && resp.data) {
                this.success.emit(resp.data);
            } else {
                this.alert.error(resp.message || 'Error al guardar la plantilla');
            }
        } finally {
            this.isSubmitting = false;
        }
    }

    onCancel(): void { this.cancel.emit(); }
}
