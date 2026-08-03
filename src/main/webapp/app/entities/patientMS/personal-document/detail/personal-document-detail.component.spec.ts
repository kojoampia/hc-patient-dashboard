import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { PersonalDocumentDetailComponent } from './personal-document-detail.component';

describe('PersonalDocument Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalDocumentDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: PersonalDocumentDetailComponent,
              resolve: { personalDocument: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(PersonalDocumentDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load personalDocument on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', PersonalDocumentDetailComponent);

      // THEN
      expect(instance.personalDocument).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
