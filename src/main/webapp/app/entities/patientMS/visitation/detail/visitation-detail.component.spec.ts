import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { VisitationDetailComponent } from './visitation-detail.component';

describe('Visitation Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitationDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: VisitationDetailComponent,
              resolve: { visitation: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(VisitationDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load visitation on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', VisitationDetailComponent);

      // THEN
      expect(instance.visitation).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
