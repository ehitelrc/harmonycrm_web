import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Item, ItemType } from '@app/models/item.model';
import { ItemService } from '@app/services/item.service';
import { LanguageService } from '@app/services/extras/language.service';
import { AlertService } from '@app/services/extras/alert.service';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.css']
})
export class ItemFormComponent implements OnInit, OnChanges {
  @Input() companyId!: number | null;       
  @Input() item: Item | null = null;
  @Output() success = new EventEmitter<Item>(); // emite objeto con id
  @Output() cancel = new EventEmitter<void>();


  form!: FormGroup;
  isEditing = false;
  isSubmitting = false;

  types: ItemType[] = ['product', 'service'];

  constructor(
    private fb: FormBuilder,
    private service: ItemService,
    private lang: LanguageService,
    private alert: AlertService
  ) {}

  get t() { return this.lang.t.bind(this.lang); }

  ngOnInit(): void { this.build(); this.patch(); }
  ngOnChanges(ch: SimpleChanges): void {
    if (ch['item'] && this.form) { this.isEditing = !!this.item; this.patch(); }
  }

  private build(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      type: ['product', [Validators.required]],
      description: [''],
    });
  }

  private patch(): void {
    if (!this.item) { this.isEditing = false; this.form.reset({ type: 'product' }); return; }
    this.isEditing = true;
    this.form.patchValue({
      name: this.item.name || '',
      type: this.item.type || 'product',
      description: this.item.description || '',
    });
  }

  isInvalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  async submit(): Promise<void> {
    if (!this.companyId) { this.alert.error(this.t('item.company_required')); return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSubmitting = true;
    try {
      let resp;
      const payload = { ...this.form.value, company_id: this.companyId };

      if (this.isEditing && this.item) resp = await this.service.update(this.item.id, payload);
      else resp = await this.service.create(payload);

      if (resp.success && resp.data) {
        this.success.emit(resp.data); // => contiene id
      } else {
        this.alert.error(resp.message || this.t('item.operation_failed'));
      }
    } catch (e) {
      console.error(e);
      this.alert.error(this.t('item.operation_failed'));
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void { this.cancel.emit(); }
}