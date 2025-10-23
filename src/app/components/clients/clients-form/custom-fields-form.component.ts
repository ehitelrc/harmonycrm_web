import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CustomField } from '@app/models/custom-field.model';

@Component({
  selector: 'app-custom-fields-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-fields-form.component.html',
})
export class CustomFieldsFormComponent implements OnInit {
  @Input() fields: CustomField[] = [];
  @Output() changed = new EventEmitter<any>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    const controls: any = {};
    for (const f of this.fields) controls[f.field_key] = [f.value ?? null];
    this.form = this.fb.group(controls);

    this.form.valueChanges.subscribe(v => this.changed.emit(v));
  }
}