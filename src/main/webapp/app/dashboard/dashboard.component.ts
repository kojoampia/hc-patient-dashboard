import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Account } from 'app/core/auth/account.model';
import SharedModule from 'app/shared/shared.module';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { HttpResponse } from '@angular/common/http';
import { WidgetsModule } from 'app/widgets/widgets.module';
import { CommonModule } from '@angular/common';
import { MetricPanelModule } from './metric-panel/metric-panel.module';
import { StatusModule } from './status-panel/status.module';

@Component({
  selector: 'jhi-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, MetricPanelModule, StatusModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Input() account!: Account;
  phoneNumber!: string;
  membership!: string;
  private readonly destroy$ = new Subject<void>();
  page: string = 'status';
  temp = { id: 1, name: 'temperature', value: 36 };
  pressure = { id: 2, name: 'pressure', value: 140 };
  heart = { id: 3, name: 'heart rate', value: 36 };
  sugar = { id: 4, name: 'sugar', value: 36 };
  emergencies = { id: 1, name: 'emergencies', value: 1 };
  alergies = { id: 2, name: 'alergies', value: 0 };
  service = { id: 3, name: 'services', value: 10 };
  diet = { id: 4, name: 'diet', value: 3 };

  topCards: any[] = [];
  lowCards: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.topCards = [this.temp, this.pressure, this.heart, this.sugar];
    this.lowCards = [this.emergencies, this.alergies, this.service, this.diet];

    this.fetchInformation(this.account.email);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchInformation(email: string): void {
    // phoneNumber = data.phoneNumber
    // membership = data.membership
    this.dashboardService
      .fetchInformationByEmail(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: HttpResponse<any>) => {
          this.phoneNumber = res.body.phoneNumber;
          this.membership = res.body.membership;
        },
      });
  }
  openPage(page: string): void {
    this.page = page;
  }

  openStat(stat: any): void {
    console.log(stat);
  }
}
