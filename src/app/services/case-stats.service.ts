import { Injectable } from '@angular/core';
 
import { FetchService } from './extras/fetch.service';
import { environment } from '@environment';
import { returnCompleteURI } from '@app/utils';
 
import { VwCaseItemsDetail } from '@app/models/vw-case-items-detail.model';
import { ApiResponse } from '@app/models';
import { CaseItem, CaseItemRequest } from '@app/models/case-item.model';
import { CaseStatsResponse } from '@app/models/case-stats.model';

@Injectable({ providedIn: 'root' })
export class CaseStatsService {

  constructor(private fetch: FetchService) {}

  getStats(companyId: number, departmentId: number) {
    return this.fetch.get<ApiResponse<CaseStatsResponse>>({
      API_Gateway: `/api/messages/v2/entry/stats/company/${companyId}/department/${departmentId}`
    });
  }
}