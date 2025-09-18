import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRequest } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { LanguageService } from '../../../services/extras/language.service';
import { AlertService } from '../../../services/extras/alert.service';
import { AgentUser } from '@app/models/agent_user.models';
import { AgentUserService } from '@app/services/agent-user.service';

@Component({
  selector: 'app-agent-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agent-user-form.component.html',
  styleUrls: ['./agent-user-form.component.css']
})
export class AgentUserFormComponent implements OnInit {
   @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  users: AgentUser[] = [];
  isLoading = false;
  isSubmitting = false;

  constructor(
    private agentUserService: AgentUserService,
    private alertService: AlertService,
    private languageService: LanguageService
  ) {}

  get t() {
    return this.languageService.t.bind(this.languageService);
  }

  async ngOnInit(): Promise<void> {
    if (this.isOpen) {
      await this.loadNonAgents();
    }
  }

  async loadNonAgents(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.agentUserService.getAllNonAgents();
      if (response.success) {
        this.users = response.data;
      } else {
        this.alertService.error(this.t('agent_user_management.error'), response.message);
      }
    } catch (error: any) {
      this.alertService.error(this.t('agent_user_management.error'), error.message || 'Error al cargar usuarios');
    } finally {
      this.isLoading = false;
    }
  }

  async convertToAgent(user: AgentUser): Promise<void> {
    this.isSubmitting = true;
    try {
      const response = await this.agentUserService.create(user.id);
      if (response.success) {
        this.alertService.success(
          this.t('agent_user_management.success'),
          this.t('agent_user_management.user_converted')
        );
        this.success.emit(); // notificar éxito al padre
        this.close();
      } else {
        this.alertService.error(this.t('agent_user_management.error'), response.message);
      }
    } catch (error: any) {
      this.alertService.error(this.t('agent_user_management.error'), error.message || 'Error al convertir en agente');
    } finally {
      this.isSubmitting = false;
    }
  }

  close(): void {
    this.users = [];
    this.closed.emit();
  }
}
