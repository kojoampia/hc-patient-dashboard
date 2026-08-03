import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { CarePlanItemDetailComponent } from './care-plan-item-detail.component';

describe('CarePlanItem Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarePlanItemDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: CarePlanItemDetailComponent,
              resolve: { carePlanItem: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(CarePlanItemDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load carePlanItem on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', CarePlanItemDetailComponent);

      // THEN
      expect(instance.carePlanItem).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
