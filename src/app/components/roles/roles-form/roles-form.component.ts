import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRequest } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { LanguageService } from '../../../services/extras/language.service';
import { AlertService } from '../../../services/extras/alert.service';
import { Role } from '@app/models/role.model';
import { RoleService } from '@app/services/role.service';

@Component({
  selector: 'app-roles-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles-form.component.html',
  styleUrls: ['./roles-form.component.css']
})
export class RolesFormComponent implements OnInit, OnChanges {
  @Input() initialData?: Role | null;
  @Input() isOpen = false;
  @Output() success = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  userForm!: FormGroup;
  isEditing = false;
  isSubmitting = false;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private languageService: LanguageService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.userForm) {
      this.isEditing = !!this.initialData;
      this.initializeForm(); // Reinitialize form to handle password validation
      this.loadUserData();
    }

    if (changes['isOpen'] && !changes['isOpen'].currentValue) {
      // Reset form when dialog closes
      this.userForm?.reset();
      this.imagePreview = null;
    }
  }

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
 
  }

  private loadUserData(): void {
    if (!this.initialData) return;

    this.userForm.patchValue({
      id: this.initialData.id,
      description: this.initialData.description,
      name: this.initialData.name,
    });
  }

  // Field validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return this.t(`roles_management.${fieldName}_required`);
      }
    }
    return '';
  }
  

  async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const formData = { ...this.userForm.value };

      let data: any = {
        name: formData.name,
        description: formData.description,
      }


      // Remove empty password for updates
      if (this.isEditing ) {
        data = { ...data, id: formData.id }
      }

      // Remove id for new users
      if (!this.isEditing) {
        delete formData.id;
        formData.auth_provider = 'local';

        data = { ...data}
      }


      let response;
      if (this.isEditing && this.initialData) {
        console.log('Updating user with data:', formData);
        response = await this.roleService.update( data);
      } else {
        response = await this.roleService.create(data);
      }

      if (response.success) {
        this.alertService.success(
          this.t('roles_management.success'),
          this.isEditing ? this.t('roles_management.roles_updated') : this.t('roles_management.roles_created')
        );

        this.close();
        this.success.emit();
      } else {
        throw new Error(response.message || this.t('operation_failed'));
      }
    } catch (error: any) {
      let errorMessage = this.isEditing ?
        this.t('roles_management.failed_update') :
        this.t('roles_management.failed_create');

      // Parse specific error messages
      if (error.message?.includes('email')) {
        errorMessage = this.t('roles_management.email_registered');
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.alertService.error(
        this.t('roles_management.error'),
        errorMessage
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  close(): void {
    this.userForm.reset();
    this.imagePreview = null;
    this.closed.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
