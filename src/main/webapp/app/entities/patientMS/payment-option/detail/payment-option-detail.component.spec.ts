import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { PaymentOptionDetailComponent } from './payment-option-detail.component';

describe('PaymentOption Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentOptionDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: PaymentOptionDetailComponent,
              resolve: { paymentOption: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(PaymentOptionDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load paymentOption on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', PaymentOptionDetailComponent);

      // THEN
      expect(instance.paymentOption).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
