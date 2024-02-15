import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Account } from 'app/core/auth/account.model';
import SharedModule from 'app/shared/shared.module';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { HttpResponse } from '@angular/common/http';
import { WidgetsModule } from 'app/widgets/widgets.module';

@Component({
  selector: 'jhi-dashboard',
  standalone: true,
  imports: [SharedModule, RouterModule, WidgetsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Input() account!: Account;
  phoneNumber!: string;
  membership!: string;
  private readonly destroy$ = new Subject<void>();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
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
}
