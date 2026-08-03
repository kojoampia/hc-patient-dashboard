import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { EmergencyDetailComponent } from './emergency-detail.component';

describe('Emergency Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: EmergencyDetailComponent,
              resolve: { emergency: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(EmergencyDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load emergency on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', EmergencyDetailComponent);

      // THEN
      expect(instance.emergency).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
