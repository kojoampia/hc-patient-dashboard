import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { RecommendationDetailComponent } from './recommendation-detail.component';

describe('Recommendation Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: RecommendationDetailComponent,
              resolve: { recommendation: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(RecommendationDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load recommendation on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', RecommendationDetailComponent);

      // THEN
      expect(instance.recommendation).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
