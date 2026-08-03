import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ActivityLogDetailComponent } from './activity-log-detail.component';

describe('ActivityLog Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityLogDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: ActivityLogDetailComponent,
              resolve: { activityLog: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(ActivityLogDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load activityLog on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', ActivityLogDetailComponent);

      // THEN
      expect(instance.activityLog).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
