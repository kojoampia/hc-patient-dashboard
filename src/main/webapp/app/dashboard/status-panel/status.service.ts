import { Injectable } from '@angular/core';
import { IChartItem } from './chart-item-model';

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  constructor() {}

  /* ----- Create Mock Data ----- */
  createMockData(): IChartItem[] {
    const chartItems: IChartItem[] = [];
    chartItems.push({ name: 'Grooming', label: 'Grooming', createdDate: '2024-01-01', value: 2 });
    chartItems.push({ name: 'Cooking', label: 'Cooking', createdDate: '2024-01-01', value: 2 });
    chartItems.push({ name: 'Cleaning', label: 'Cleaning', createdDate: '2024-01-01', value: 2 });
    chartItems.push({ name: 'Washing', label: 'Washing', createdDate: '2024-01-01', value: 1 });
    chartItems.push({ name: 'Grocery', label: 'Grocery', createdDate: '2024-01-01', value: 1 });
    chartItems.push({ name: 'Dining', label: 'Dining', createdDate: '2024-01-01', value: 2 });

    chartItems.push({ name: 'Grooming', label: 'Grooming', createdDate: '2024-01-02', value: 2 });
    chartItems.push({ name: 'Cooking', label: 'Cooking', createdDate: '2024-01-02', value: 1 });
    chartItems.push({ name: 'Cleaning', label: 'Cleaning', createdDate: '2024-01-02', value: 1 });
    chartItems.push({ name: 'Washing', label: 'Washing', createdDate: '2024-01-02', value: 0 });
    chartItems.push({ name: 'Grocery', label: 'Grocery', createdDate: '2024-01-02', value: 0 });
    chartItems.push({ name: 'Dining', label: 'Dining', createdDate: '2024-01-02', value: 3 });

    chartItems.push({ name: 'Grooming', label: 'Grooming', createdDate: '2024-01-03', value: 2 });
    chartItems.push({ name: 'Cooking', label: 'Cooking', createdDate: '2024-01-03', value: 2 });
    chartItems.push({ name: 'Cleaning', label: 'Grooming', createdDate: '2024-01-03', value: 2 });
    chartItems.push({ name: 'Washing', label: 'Washing', createdDate: '2024-01-03', value: 1 });
    chartItems.push({ name: 'Grocery', label: 'Grocery', createdDate: '2024-01-03', value: 1 });
    chartItems.push({ name: 'Dining', label: 'Dining', createdDate: '2024-01-03', value: 2 });

    chartItems.push({ name: 'Grooming', label: 'Grooming', createdDate: '2024-01-04', value: 2 });
    chartItems.push({ name: 'Cooking', label: 'Cooking', createdDate: '2024-01-04', value: 2 });
    chartItems.push({ name: 'Cleaning', label: 'Cleaning', createdDate: '2024-01-04', value: 2 });
    chartItems.push({ name: 'Washing', label: 'Washing', createdDate: '2024-01-04', value: 1 });
    chartItems.push({ name: 'Grocery', label: 'Grocery', createdDate: '2024-01-04', value: 1 });
    chartItems.push({ name: 'Dining', label: 'Dining', createdDate: '2024-01-04', value: 2 });

    chartItems.push({ name: 'Grooming', label: 'Grooming', createdDate: '2024-01-05', value: 2 });
    chartItems.push({ name: 'Cooking', label: 'Cooking', createdDate: '2024-01-05', value: 2 });
    chartItems.push({ name: 'Cleaning', label: 'Cleaning', createdDate: '2024-01-05', value: 2 });
    chartItems.push({ name: 'Washing', label: 'Washing', createdDate: '2024-01-05', value: 1 });
    chartItems.push({ name: 'Grocery', label: 'Grocery', createdDate: '2024-01-05', value: 1 });
    chartItems.push({ name: 'Dining', label: 'Dining', createdDate: '2024-01-05', value: 2 });

    chartItems.push({ name: 'Grooming', label: 'Grooming', createdDate: '2024-01-06', value: 2 });
    chartItems.push({ name: 'Cooking', label: 'Cooking', createdDate: '2024-01-06', value: 2 });
    chartItems.push({ name: 'Cleaning', label: 'Cleaning', createdDate: '2024-01-06', value: 2 });
    chartItems.push({ name: 'Washing', label: 'Washing', createdDate: '2024-01-06', value: 1 });
    chartItems.push({ name: 'Grocery', label: 'Grocery', createdDate: '2024-01-06', value: 1 });
    chartItems.push({ name: 'Dining', label: 'Dining', createdDate: '2024-01-06', value: 2 });

    chartItems.push({ name: 'Grooming', label: 'Grooming', createdDate: '2024-01-07', value: 2 });
    chartItems.push({ name: 'Cooking', label: 'Cooking', createdDate: '2024-01-07', value: 2 });
    chartItems.push({ name: 'Cleaning', label: 'Cleaning', createdDate: '2024-01-07', value: 2 });
    chartItems.push({ name: 'Washing', label: 'Washing', createdDate: '2024-01-07', value: 1 });
    chartItems.push({ name: 'Grocery', label: 'Grocery', createdDate: '2024-01-07', value: 1 });
    chartItems.push({ name: 'Dining', label: 'Dining', createdDate: '2024-01-07', value: 2 });

    return chartItems;
  }
}
