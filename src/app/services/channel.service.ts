import { Injectable } from '@angular/core';
import { returnCompleteURI } from '@app/utils';
import { environment } from '@environment';
import { FetchService } from './extras/fetch.service';
import { ApiResponse } from '@app/models';
import { Channel } from '@app/models/channel.model';

const GATEWAY = '/channels';
export const CHANNEL_URL = returnCompleteURI({
  URI: environment.API.BASE,
  API_Gateway: GATEWAY,
});

@Injectable({ providedIn: 'root' })
export class ChannelService {
  constructor(private fetch: FetchService) {}

  getAll() {
    return this.fetch.get<ApiResponse<Channel[]>>({
      API_Gateway: `${CHANNEL_URL}`,
    });
  }

  getById(id: number) {
    return this.fetch.get<ApiResponse<Channel>>({
      API_Gateway: `${CHANNEL_URL}/${id}`,
    });
  }

  create(data: Partial<Channel>) {
    return this.fetch.post<ApiResponse<Channel>>({
      API_Gateway: `${CHANNEL_URL}`,
      values: data,
    });
  }

  // PUT recibe el objeto completo con id
  update(id: number, data: Partial<Channel>) {
    const payload = { ...data, id };
    return this.fetch.put<ApiResponse<Channel>>({
      API_Gateway: `${CHANNEL_URL}`,
      values: payload,
    });
  }

  delete(id: number) {
    return this.fetch.delete<ApiResponse<void>>({
      API_Gateway: `${CHANNEL_URL}/${id}`,
    });
  }
}