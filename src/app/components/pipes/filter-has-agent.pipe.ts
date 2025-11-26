import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterHasAgent',
  standalone: true
})
export class FilterHasAgentPipe implements PipeTransform {
  transform(list: any[]) {
    if (!list) return [];
    return list.filter(item => item.agent_id !== null && item.agent_id !== undefined);
  }
}