import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import SharedModule from 'app/shared/shared.module';

/**
 * The signed-out layout: brand on the left, whatever form the route supplies on the right.
 * Shared by sign-in, registration, activation and password reset so those four never look like
 * they belong to different products.
 */
@Component({
    selector: 'hpd-auth-shell',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterOutlet],
    templateUrl: './auth-shell.component.html',
    styleUrl: './auth-shell.component.scss'
})
export default class AuthShellComponent {}
