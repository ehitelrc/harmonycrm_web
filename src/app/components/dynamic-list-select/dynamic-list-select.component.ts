import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomListService } from '@app/services/custom-list.service';
import { LanguageService } from '@app/services/extras/language.service';


export interface DynamicListItem {
    list_id: number;
    list_label: string;
    list_name: string;
    values: { id: number, code: string, description: string }[];
    selected_value: number | null;
}

@Component({
    selector: 'app-dynamic-list-select',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dynamic-list-select.component.html'
})
export class DynamicListSelectComponent implements OnInit {
    @Input() entityName!: string;
    @Input() entityId!: number;

    @Output() changed = new EventEmitter<any>();
    
    lists: DynamicListItem[] = [];

    constructor(private listService: CustomListService, private lang: LanguageService,) { }

    ngOnInit() {
        this.loadLists();
    }

    // 👇 Esto habilita {{ t('client.lists') }} en el template
    get t() {
        return this.lang.t.bind(this.lang);
    }


    loadLists() {
        this.listService.getListsForEntity(this.entityName, this.entityId).then(response => {

            console.log(response.data);


            if (response && response.data) {
                this.lists = response.data.map((list: any) => ({
                    list_id: list.list_id,
                    list_label: list.list_label,
                    list_name: list.name,
                    values: list.values,
                    selected_value: list.selected_value || null
                }));
            }
        });

    }

    onValueChange(listId: number, valueId: number | null) {

        console.log("lista ", listId);


        this.changed.emit({
            list_id: listId,
            selected_value: valueId
        });
    }

    
    
}