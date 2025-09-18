import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ReceivingTask, CreateReceivingTaskRequest } from '@app/models/receiving-task.model';
import { Location } from '@app/models/location.model';
import { User } from '@app/models/user.model';
import { Article } from '@app/models/article.model';
import { ReceivingTaskService } from '@app/services/receiving-task.service';
import { LocationService } from '@app/services/location.service';
import { UserService } from '@app/services/user.service';
import { ArticleService } from '@app/services/article.service';
import { AlertService } from '@app/services/extras/alert.service';
import { LoadingService } from '@app/services/extras/loading.service';
import { LanguageService } from '@app/services/extras/language.service';

@Component({
	selector: 'app-receiving-task-form',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule],
	templateUrl: './receiving-task-form.component.html',
	styleUrls: ['./receiving-task-form.component.css']
})
export class ReceivingTaskFormComponent implements OnInit {
	@Input() task: ReceivingTask | null = null;
	@Output() success = new EventEmitter<void>();
	@Output() cancel = new EventEmitter<void>();

	form: FormGroup;
	locations: Location[] = [];
	users: User[] = [];
	articles: Article[] = [];
	isLoading = false;
	isEditing = false;

	// Combobox state per item
	skuSearchTerms: string[] = [];
	locationSearchTerms: string[] = [];
	showSkuDropdown: boolean[] = [];
	showLocationDropdown: boolean[] = [];
	filteredArticlesPerItem: Article[][] = [];
	filteredLocationsPerItem: Location[][] = [];

	constructor(
		private fb: FormBuilder,
		private receivingTaskService: ReceivingTaskService,
		private locationService: LocationService,
		private userService: UserService,
		private articleService: ArticleService,
		private alertService: AlertService,
		private loadingService: LoadingService,
		private languageService: LanguageService
	) {
		this.form = this.fb.group({
			inbound_number: ['', [Validators.required]],
			assigned_to: [''],
			priority: ['normal', [Validators.required]],
			notes: [''],
			items: this.fb.array([])
		});
	}

	ngOnInit(): void {
		this.loadData();
		this.isEditing = !!this.task;
		if (this.task) {
			this.loadTaskForEdit();
		} else {
			this.addItem();
		}
	}

	get t() {
		return this.languageService.t.bind(this.languageService);
	}

	// Modal helpers
	close(): void {
		this.cancel.emit();
	}

	onCancel(): void {
		this.cancel.emit();
	}

	onBackdropClick(event: Event): void {
		if (event.target === event.currentTarget) {
			this.close();
		}
	}

	async loadData(): Promise<void> {
		try {
			this.isLoading = true;
			
			// Load data in parallel (locations, users, articles)
			const [locationResponse, userResponse, articleResponse] = await Promise.all([
				this.locationService.getAll(),
				this.userService.getAll(),
				this.articleService.getAll()
			]);

			if (locationResponse.success) {
				this.locations = locationResponse.data;
			}

			if (userResponse.success) {
				// Only operators
				this.users = (userResponse.data || []).filter((u: User) => u.role === 'operator');
			}

			if (articleResponse.success) {
				this.articles = articleResponse.data || [];
			}
		} catch (error) {
			this.alertService.error(
				this.t('error_loading_data'),
				this.t('error')
			);
		} finally {
			this.isLoading = false;
		}
	}

	loadTaskForEdit(): void {
		if (!this.task) return;

		this.form.patchValue({
			inbound_number: this.task.inbound_number,
			assigned_to: this.task.assigned_to || '',
			priority: this.task.priority,
			notes: this.task.notes || ''
		});

		// Clear existing items
		while (this.itemsArray.length !== 0) {
			this.itemsArray.removeAt(0);
		}

		// Add existing items
		if (this.task.items && this.task.items.length > 0) {
			this.task.items.forEach((item, i) => {
				this.itemsArray.push(this.fb.group({
					sku: [item.sku, [Validators.required]],
					expected_qty: [item.expected_qty, [Validators.required, Validators.min(1)]],
					location: [item.location, [Validators.required]],
					lot_numbers: [item.lot_numbers?.join(', ') || ''],
					serial_numbers: [item.serial_numbers?.join(', ') || '']
				}));

				// Initialize combobox state for this item
				this.ensureComboboxState(i);
				const article = this.getArticleBySku(item.sku);
				this.skuSearchTerms[i] = article ? `${article.sku} - ${article.name}` : item.sku;
				const loc = this.locations.find(l => l.location_code === item.location);
				this.locationSearchTerms[i] = loc ? `${loc.location_code} - ${loc.description}` : item.location;
			});
		} else {
			this.addItem();
		}
	}

	get itemsArray(): FormArray {
		return this.form.get('items') as FormArray;
	}

	addItem(): void {
		const itemGroup = this.fb.group({
			sku: ['', [Validators.required]],
			expected_qty: [1, [Validators.required, Validators.min(1)]],
			location: ['', [Validators.required]],
			lot_numbers: [''],
			serial_numbers: ['']
		});

		this.itemsArray.push(itemGroup);

		const index = this.itemsArray.length - 1;
		this.ensureComboboxState(index);
	}

	removeItem(index: number): void {
		if (this.itemsArray.length > 1) {
			this.itemsArray.removeAt(index);
			this.skuSearchTerms.splice(index, 1);
			this.locationSearchTerms.splice(index, 1);
			this.showSkuDropdown.splice(index, 1);
			this.showLocationDropdown.splice(index, 1);
			this.filteredArticlesPerItem.splice(index, 1);
			this.filteredLocationsPerItem.splice(index, 1);
		}
	}

	// Removed inventory lookup; SKU selection is based on articles

	async onSubmit(): Promise<void> {
		if (this.form.invalid) {
			this.alertService.error(
				this.t('please_complete_required_fields'),
				this.t('error')
			);
			return;
		}

		try {
			this.loadingService.show();
			
			const formValue = this.form.value;
			const taskData: CreateReceivingTaskRequest = {
				inbound_number: formValue.inbound_number,
				assigned_to: formValue.assigned_to || undefined,
				priority: formValue.priority,
				status: this.task ? this.task.status : 'open',
				notes: formValue.notes || undefined,
				items: formValue.items.map((item: any) => ({
					sku: item.sku,
					expected_qty: item.expected_qty,
					location: item.location,
					lot_numbers: item.lot_numbers ? item.lot_numbers.split(',').map((s: string) => s.trim()).filter((s: string) => s) : undefined,
					serial_numbers: item.serial_numbers ? item.serial_numbers.split(',').map((s: string) => s.trim()).filter((s: string) => s) : undefined
				}))
			};

			if (this.task) {
				// Update existing task
				const response = await this.receivingTaskService.update(this.task.id, taskData);
				if (response.success) {
					this.alertService.success(
						this.t('receiving_task_updated_successfully'),
						this.t('success')
					);
					this.success.emit();
				} else {
					this.alertService.error(
						response.message || this.t('failed_to_update_receiving_task'),
						this.t('error')
					);
				}
			} else {
				// Create new task
				const response = await this.receivingTaskService.create(taskData);
				if (response.success) {
					this.alertService.success(
						this.t('receiving_task_created_successfully'),
						this.t('success')
					);
					this.success.emit();
				} else {
					this.alertService.error(
						response.message || this.t('failed_to_create_receiving_task'),
						this.t('error')
					);
				}
			}
		} catch (error) {
			this.alertService.error(
				this.t('error_saving_task'),
				this.t('error')
			);
		} finally {
			this.loadingService.hide();
		}
	}

	// Combobox helpers per item
	ensureComboboxState(index: number): void {
		if (this.skuSearchTerms[index] === undefined) this.skuSearchTerms[index] = '';
		if (this.locationSearchTerms[index] === undefined) this.locationSearchTerms[index] = '';
		if (this.showSkuDropdown[index] === undefined) this.showSkuDropdown[index] = false;
		if (this.showLocationDropdown[index] === undefined) this.showLocationDropdown[index] = false;
		if (!this.filteredArticlesPerItem[index]) this.filteredArticlesPerItem[index] = [...this.articles];
		if (!this.filteredLocationsPerItem[index]) this.filteredLocationsPerItem[index] = [...this.locations];
	}

	filterArticlesForItem(index: number): void {
		const term = (this.skuSearchTerms[index] || '').toLowerCase();
		if (!term) {
			this.filteredArticlesPerItem[index] = [...this.articles];
			return;
		}
		this.filteredArticlesPerItem[index] = this.articles.filter(a =>
			(a.sku || '').toLowerCase().includes(term) || (a.name || '').toLowerCase().includes(term)
		);
	}

	filterLocationsForItem(index: number): void {
		const term = (this.locationSearchTerms[index] || '').toLowerCase();
		if (!term) {
			this.filteredLocationsPerItem[index] = [...this.locations];
			return;
		}
		this.filteredLocationsPerItem[index] = this.locations.filter(l =>
			(l.location_code || '').toLowerCase().includes(term) || (l.description || '').toLowerCase().includes(term)
		);
	}

	onSkuSelected(index: number, article: Article): void {
		this.itemsArray.at(index).get('sku')?.setValue(article.sku);
		this.skuSearchTerms[index] = `${article.sku} - ${article.name}`;
		this.showSkuDropdown[index] = false;
	}

	onLocationSelected(index: number, location: Location): void {
		this.itemsArray.at(index).get('location')?.setValue(location.location_code);
		this.locationSearchTerms[index] = `${location.location_code} - ${location.description}`;
		this.showLocationDropdown[index] = false;
	}

	closeSkuDropdownLater(index: number): void {
		setTimeout(() => (this.showSkuDropdown[index] = false), 150);
	}

	closeLocationDropdownLater(index: number): void {
		setTimeout(() => (this.showLocationDropdown[index] = false), 150);
	}

	confirmFirstArticleIfAny(index: number): void {
		const list = this.filteredArticlesPerItem[index] || [];
		if (list.length > 0) {
			this.onSkuSelected(index, list[0]);
		}
	}

	confirmFirstLocationIfAny(index: number): void {
		const list = this.filteredLocationsPerItem[index] || [];
		if (list.length > 0) {
			this.onLocationSelected(index, list[0]);
		}
	}

	private getArticleBySku(sku: string): Article | undefined {
		return this.articles.find(a => a.sku === sku);
	}

	shouldShowLotNumbers(index: number): boolean {
		const sku = this.itemsArray.at(index).get('sku')?.value;
		const article = this.getArticleBySku(sku);
		return !!article?.track_by_lot;
	}

	shouldShowSerialNumbers(index: number): boolean {
		const sku = this.itemsArray.at(index).get('sku')?.value;
		const article = this.getArticleBySku(sku);
		return !!article?.track_by_serial;
	}

	getUserDisplayName(userId: number): string {
		const user = this.users.find(u => u.id === userId);
		return user ? user.full_name|| user.email : userId.toString();
	}

	getLocationDisplayName(locationCode: string): string {
		const location = this.locations.find(l => l.location_code === locationCode);
		return location ? `${location.location_code}${location.description ? ` - ${location.description}` : ''}` : locationCode;
	}

	// Field validation helpers
	isFieldInvalid(fieldName: string): boolean {
		const field = this.form.get(fieldName);
		return !!(field && field.invalid && field.touched);
	}

	getFieldError(fieldName: string): string {
		const field = this.form.get(fieldName);
		if (field && field.errors && field.touched) {
			if (field.errors['required']) {
				return this.t(`${fieldName}_required`);
			}
			if (field.errors['min']) {
				return this.t('quantity_min');
			}
		}
		return '';
	}

	isItemFieldInvalid(itemIndex: number, fieldName: string): boolean {
		const itemGroup = this.itemsArray.at(itemIndex);
		const field = itemGroup.get(fieldName);
		return !!(field && field.invalid && field.touched);
	}

	getItemFieldError(itemIndex: number, fieldName: string): string {
		const itemGroup = this.itemsArray.at(itemIndex);
		const field = itemGroup.get(fieldName);
		if (field && field.errors && field.touched) {
			if (field.errors['required']) {
				return this.t(`${fieldName}_required`);
			}
			if (field.errors['min']) {
				return this.t('quantity_min');
			}
		}
		return '';
	}
}
