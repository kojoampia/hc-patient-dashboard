import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AllergyDetailComponent } from './allergy-detail.component';

describe('Allergy Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllergyDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: AllergyDetailComponent,
              resolve: { allergy: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(AllergyDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load allergy on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', AllergyDetailComponent);

      // THEN
      expect(instance.allergy).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
