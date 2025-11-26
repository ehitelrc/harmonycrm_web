import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderByDate',
  standalone: true
})
export class OrderByDatePipe implements PipeTransform {
  transform(array: any[], field: string, direction: 'asc'|'desc' = 'asc') {
    if (!array || !field) return array;

    return array.slice().sort((a, b) => {
      const dateA = new Date(a[field]).getTime();
      const dateB = new Date(b[field]).getTime();

      return direction === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    });
  }
}