import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Account } from 'app/core/auth/account.model';
import SharedModule from 'app/shared/shared.module';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { HttpResponse } from '@angular/common/http';
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
  temp = { id: 1, name: 'temperature', value: 36, route: 'temperature' };
  pressure = { id: 2, name: 'pressure', value: 140, route: 'pressure' };
  heart = { id: 3, name: 'heart rate', value: 36, route: 'heatrate' };
  sugar = { id: 4, name: 'sugar', value: 36, route: 'sugar' };
  emergencies = { id: 1, name: 'emergencies', value: 1, route: 'emergencies' };
  alergies = { id: 2, name: 'allergies', value: 0, route: 'allergies' };
  service = { id: 3, name: 'services', value: 10, route: 'services' };
  diet = { id: 4, name: 'diet', value: 3, route: 'diet' };

  topCards: any[] = [];
  lowCards: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.topCards = [this.temp, this.pressure, this.heart, this.sugar];
    this.lowCards = [this.emergencies, this.alergies, this.service, this.diet];

    this.fetchProfileInformation(this.account.email);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchProfileInformation(email: string): void {
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

  metricSelected(stat: any): void {
    switch (stat.route) {
      case 'temperature':
        // open temperature modal
        console.log('temperature');
        break;
      case 'pressure':
        // open pressure modal
        console.log('pressure');
        break;
      case 'heartrate':
        // open heart-rate modal
        console.log('heart-rate');
        break;
      case 'sugar':
        // open sugar modal
        console.log('sugar');
        break;
      case 'emergencies':
        // open emergencies modal
        console.log('emergencies');
        break;
      case 'allergies':
        // open allergies modal
        console.log('allergies');
        break;
      case 'services':
        // open services modal
        console.log('services');
        break;
      case 'diet':
        // open diet modal
        console.log('diet');
        break;
    }
  }
}
