import { Rootbeer } from '../types/Rootbeer';
import { apiGet } from './apiClient';

interface PagedRootbeerResponse {
  rootbeers: Rootbeer[];
  totalCount: number;
}

export async function getRootbeers(
  pageSize: number,
  pageNum: number,
  selectedContainers: string[]
): Promise<PagedRootbeerResponse> {
  const searchParams = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNum: pageNum.toString(),
  });

  selectedContainers.forEach((container) => {
    searchParams.append('containers', container);
  });

  return apiGet<PagedRootbeerResponse>(`/api/rootbeers?${searchParams}`);
}

export async function getContainerTypes(): Promise<string[]> {
  return apiGet<string[]>('/api/rootbeers/containers');
}
