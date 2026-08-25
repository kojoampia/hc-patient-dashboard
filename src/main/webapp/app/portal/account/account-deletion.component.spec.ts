import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ActingAsService } from 'app/core/auth/acting-as.service';

import AccountDeletionComponent from './account-deletion.component';
import { DeletionRequest, DeletionRequestService } from '../data/deletion-request.service';

const PENDING: DeletionRequest = {
  id: 'req-1',
  patientId: 'ama-patient',
  status: 'PENDING',
  requestedAt: '2026-08-25T10:00:00Z',
  dueAt: '2026-09-08T10:00:00Z',
};

describe('AccountDeletionComponent', () => {
  let component: AccountDeletionComponent;
  let fixture: ComponentFixture<AccountDeletionComponent>;
  let mine: jest.Mock;
  let raise: jest.Mock;
  let cancel: jest.Mock;
  let actingForSomeoneElse: jest.Mock;

  const build = (): void => {
    fixture = TestBed.createComponent(AccountDeletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    mine = jest.fn().mockReturnValue(of(null));
    raise = jest.fn().mockReturnValue(of(PENDING));
    cancel = jest.fn().mockReturnValue(of({ ...PENDING, status: 'CANCELLED' }));
    actingForSomeoneElse = jest.fn().mockReturnValue(false);

    TestBed.configureTestingModule({
      imports: [AccountDeletionComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DeletionRequestService, useValue: { mine, raise, cancel } },
        { provide: ActingAsService, useValue: { actingForSomeoneElse } },
      ],
    });
  });

  it('asks for nothing on the first action', () => {
    build();

    component.startConfirm();

    // Revealing the consequences must not BE the consent — the whole point of the two-step confirm.
    expect(raise).not.toHaveBeenCalled();
    expect(component.confirming()).toBe(true);
  });

  it('records the request only on the second, differently worded action', () => {
    build();
    component.startConfirm();
    component.reason.set('moving abroad');

    component.confirm();

    expect(raise).toHaveBeenCalledWith('moving abroad');
    expect(component.pending()).toEqual(PENDING);
    expect(component.confirming()).toBe(false);
  });

  it('lets the patient back out without asking for anything', () => {
    build();
    component.startConfirm();

    component.abandon();

    expect(component.confirming()).toBe(false);
    expect(raise).not.toHaveBeenCalled();
  });

  it('shows a request that is already running', () => {
    mine.mockReturnValue(of(PENDING));

    build();

    expect(component.pending()).toEqual(PENDING);
  });

  it('withdraws a pending request and returns to the offer', () => {
    mine.mockReturnValue(of(PENDING));
    build();

    component.cancelRequest();

    expect(cancel).toHaveBeenCalledWith('req-1');
    expect(component.pending()).toBeNull();
  });

  it('reports a failed raise without pretending it worked', () => {
    // The dangerous failure is the opposite: showing "scheduled for deletion" when the request
    // never reached the server, so the patient stops expecting anything to happen.
    raise.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    build();
    component.startConfirm();

    component.confirm();

    expect(component.actionError()).toBe('patientPortal.deleteAccount.error.raise');
    expect(component.pending()).toBeNull();
  });

  it('keeps showing the request as pending when the withdrawal fails', () => {
    // If the cancel did not land, the deletion IS still coming. Clearing it locally would be the
    // more comfortable lie.
    mine.mockReturnValue(of(PENDING));
    cancel.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    build();

    component.cancelRequest();

    expect(component.actionError()).toBe('patientPortal.deleteAccount.error.cancel');
    expect(component.pending()).toEqual(PENDING);
  });

  it('distinguishes a failed check from having no request', () => {
    mine.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    build();

    expect(component.isFailed()).toBe(true);
    expect(component.pending()).toBeNull();
  });

  it('offers nothing while acting for another patient', () => {
    actingForSomeoneElse.mockReturnValue(true);

    build();

    expect(component.actingForSomeoneElse()).toBe(true);
  });
});
