import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ProfessionalDetailComponent } from './professional-detail.component';

describe('Professional Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: ProfessionalDetailComponent,
              resolve: { professional: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(ProfessionalDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load professional on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', ProfessionalDetailComponent);

      // THEN
      expect(instance.professional).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
