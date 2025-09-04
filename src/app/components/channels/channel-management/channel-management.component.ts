import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { LanguageService } from '@app/services';
import { AuthorizationService } from '@app/services/extras/authorization.service';
import { AlertService } from '@app/services/extras/alert.service';
import { ChannelService } from '@app/services/channel.service';
import { Channel } from '@app/models/channel.model';
import { ChannelsListComponent } from '../channel-list/channel-list.component';
import { ChannelFormComponent } from '../channel-form/channel-form.component';

@Component({
  selector: 'app-channel-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, ChannelsListComponent, ChannelFormComponent],
  templateUrl: './channel-management.component.html',
  styleUrls: ['./channel-management.component.css']
})
export class ChannelManagementComponent {
  channels: Channel[] = [];
  isLoading = false;

  isFormOpen = false;
  selected: Channel | null = null;

  isDeleteOpen = false;
  deletingId: number | null = null;
  isDeleting = false;

  constructor(
    private lang: LanguageService,
    private auth: AuthorizationService,
    private alert: AlertService,
    private service: ChannelService
  ) {}

  get t() { return this.lang.t.bind(this.lang); }
  isAdmin(): boolean { return true; /* o this.auth.isAdmin(); */ }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    try {
      this.isLoading = true;
      const r = await this.service.getAll();
      if (r.success && r.data) this.channels = r.data;
      else this.alert.error(this.t('channel.failed_to_load_channels'));
    } catch {
      this.alert.error(this.t('channel.failed_to_load_channels'));
    } finally {
      this.isLoading = false;
    }
  }

  openCreateDialog(): void { this.selected = null; this.isFormOpen = true; }
  openEditDialog(c: Channel): void { this.selected = c; this.isFormOpen = true; }
  closeDialog(): void { this.isFormOpen = false; this.selected = null; }

  async onSuccess(saved: Channel): Promise<void> {
    this.closeDialog();
    await this.load();
    this.alert.success(
      this.selected
        ? `${this.t('channel.updated_successfully')} (#${saved.id})`
        : `${this.t('channel.created_successfully')} (#${saved.id})`
    );
  }

  // delete modal
  askDelete(c: Channel): void {
    if (!this.isAdmin()) return;
    this.deletingId = c.id;
    this.isDeleteOpen = true;
  }
  cancelDelete(): void { this.deletingId = null; this.isDeleteOpen = false; }
  async confirmDelete(): Promise<void> {
    if (!this.deletingId) return;
    this.isDeleting = true;
    try {
      const r = await this.service.delete(this.deletingId);
      if (r.success) {
        this.alert.success(this.t('channel.deleted_successfully'));
        await this.load();
      } else {
        this.alert.error(this.t('channel.failed_to_delete_channel'));
      }
    } catch {
      this.alert.error(this.t('channel.failed_to_delete_channel'));
    } finally {
      this.isDeleting = false;
      this.cancelDelete();
    }
  }

  // hooks
  onEdit(c: Channel) { this.openEditDialog(c); }
  onRemove(c: Channel) { this.askDelete(c); }
  onView(_c: Channel) {}
}