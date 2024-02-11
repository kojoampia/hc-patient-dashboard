import { Component, Input } from "@angular/core";
import { Account } from "app/core/auth/account.model";

@Component({
  selector: "jhi-dashboard",
  standalone: true,
  imports: [],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent {
  @Input() account!: Account;
}
