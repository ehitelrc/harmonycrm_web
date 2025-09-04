import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../services/extras/alert.service';
import { LanguageService } from '../../services/extras/language.service';
import { LanguageSwitcherComponent } from '../shared/extras/language-switcher/language-switcher.component';
import { AlertComponent } from '../shared/extras/alert/alert.component';
import { LoginRequest, RegisterRequest } from '../../models/auth.model';
import { User } from '../../models/user.model';
import { Company } from '@app/models/company.model';
import { CompanyService } from '@app/services/company.service';
import { environment } from '@environment';

// Models and interfaces
interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LanguageSwitcherComponent, AlertComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  companies: Company[] = [];

  appVersion = environment.appVersion

  // Form controls

  loginForm!: FormGroup;
  registerForm!: FormGroup;

  // UI state
  activeTab: 'login' | 'register' = 'login';
  showPassword = false;
  showRegisterPassword = false;

  // Loading states
  isLoginLoading = false;
  isRegisterLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private companyService: CompanyService,
    private authService: AuthService,
    private userService: UserService,
    private alertService: AlertService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadCompanies();
  }

  private initializeForms(): void {

    this.loginForm = this.fb.group({
      companyId: [null, [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.registerForm = this.fb.group({

      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  // Tab switching
  setActiveTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
  }

  // Password visibility toggles
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleRegisterPasswordVisibility(): void {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  async loadCompanies(): Promise<void> {
    try {
      const response = await this.companyService.getAllCompanies()
      if (response.success) {
        this.companies = response.data;
      } else {
        this.alertService.error(
          response.message || 'Error al cargar las empresas',
          'Error de carga'
        );
      }
    } catch (error: any) {
      console.error('Error loading companies:', error);
      this.alertService.error(
        error.message || 'Error al cargar las empresas',
        'Error de carga'
      );
    }
  }


  // Form submissions
  async onLogin(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoginLoading = true;

      try {
        const { email, password, companyId } = this.loginForm.value as {
          email: string; password: string; companyId: number;
        };

        const payload: LoginRequest = {
          email,
          password,
          company_id: companyId, // <- mapeo a snake_case para la API
        };

        // Use AuthService for login
        const response = await this.authService.login(payload);

        if (response.success) {
          this.alertService.success(
            this.t('auth.login_success') || 'Inicio de sesión exitoso',
            this.t('auth.welcome_back') || 'Bienvenido'
          );
          // AuthService handles navigation automatically
        } else {
          this.alertService.error(
            response.message || this.t('auth.login_error') || 'Error al iniciar sesión',
            this.t('auth.login_failed') || 'Error de autenticación'
          );
        }

      } catch (error: any) {
        console.error('Login error:', error);
        this.alertService.error(
          error.message || this.t('auth.login_error') || 'Error al iniciar sesión',
          this.t('auth.login_failed') || 'Error de autenticación'
        );
      } finally {
        this.isLoginLoading = false;
      }
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  async onRegister(): Promise<void> {
    if (this.registerForm.valid) {
      this.isRegisterLoading = true;

      try {
        const formData = this.registerForm.value;

        // Map form data to User format for UserService
        const userData: Partial<User> = {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'operator', // Default role
          is_active: true,
          auth_provider: 'local'
        };

        // Use UserService for user creation
        const response = await this.userService.create(userData);

        if (response.success) {
          // Switch to login tab after successful registration
          this.setActiveTab('login');
          // Show success message
          this.alertService.success(
            this.t('auth.registration_success') || 'Usuario creado exitosamente. Por favor inicia sesión.',
            this.t('auth.registration_complete') || 'Registro exitoso'
          );
        } else {
          this.alertService.error(
            response.message || this.t('auth.registration_error') || 'Error al crear la cuenta',
            this.t('auth.registration_failed') || 'Error de registro'
          );
        }

      } catch (error: any) {
        console.error('Registration error:', error);
        this.alertService.error(
          error.message || this.t('auth.registration_error') || 'Error al crear la cuenta',
          this.t('auth.registration_failed') || 'Error de registro'
        );
      } finally {
        this.isRegisterLoading = false;
      }
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  // Helper methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Translation helper
  t(key: string): string {
    return this.languageService.t(key);
  }
}
