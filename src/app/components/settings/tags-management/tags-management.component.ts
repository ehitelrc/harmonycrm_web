import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@app/components/layout/main-layout.component';
import { TagService } from '../../../services/tag.service';
import { Tag } from '../../../models/tag';
import { TagsListComponent } from './tags-list/tags-list.component';
import { TagFormComponent } from './tags-form/tags-form.component';

@Component({
  selector: 'app-tags-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, TagsListComponent, TagFormComponent],
  templateUrl: './tags-management.component.html'
})
export class TagsManagementComponent implements OnInit {
  tags: Tag[] = [];
  isLoading = false;

  isFormOpen = false;
  selectedTag: Tag | null = null;

  isDeleteOpen = false;
  deletingId: number | null = null;
  isDeleting = false;

  constructor(private tagService: TagService) {}

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.isLoading = true;
    this.tagService.getTags().subscribe({
      next: (data) => {
        this.tags = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading tags', err);
        this.isLoading = false;
      }
    });
  }

  openCreateDialog(): void {
    this.selectedTag = null;
    this.isFormOpen = true;
  }

  openEditDialog(tag: Tag): void {
    this.selectedTag = tag;
    this.isFormOpen = true;
  }

  closeDialog(): void {
    this.isFormOpen = false;
    this.selectedTag = null;
  }

  onSuccess(tag: Tag): void {
    this.closeDialog();
    this.loadTags();
  }

  askDelete(tag: Tag): void {
    this.deletingId = tag.id!;
    this.isDeleteOpen = true;
  }

  cancelDelete(): void {
    this.deletingId = null;
    this.isDeleteOpen = false;
  }

  confirmDelete(): void {
    if (!this.deletingId) return;
    this.isDeleting = true;

    this.tagService.deleteTag(this.deletingId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.cancelDelete();
        this.loadTags();
      },
      error: (err) => {
        console.error('Error deleting tag', err);
        this.isDeleting = false;
        this.cancelDelete();
      }
    });
  }
}

