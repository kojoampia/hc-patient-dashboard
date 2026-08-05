import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { EmergencyService } from '../service/emergency.service';
import { IEmergency } from '../emergency.model';
import { EmergencyFormService } from './emergency-form.service';

import { EmergencyUpdateComponent } from './emergency-update.component';

describe('Emergency Management Update Component', () => {
  let comp: EmergencyUpdateComponent;
  let fixture: ComponentFixture<EmergencyUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let emergencyFormService: EmergencyFormService;
  let emergencyService: EmergencyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [RouterTestingModule.withRoutes([]), EmergencyUpdateComponent],
    providers: [
        FormBuilder,
        {
            provide: ActivatedRoute,
            useValue: {
                params: from([{}]),
            },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
})
      .overrideTemplate(EmergencyUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(EmergencyUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    emergencyFormService = TestBed.inject(EmergencyFormService);
    emergencyService = TestBed.inject(EmergencyService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const emergency: IEmergency = { id: 'CBA' };

      activatedRoute.data = of({ emergency });
      comp.ngOnInit();

      expect(comp.emergency).toEqual(emergency);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IEmergency>>();
      const emergency = { id: 'ABC' };
      jest.spyOn(emergencyFormService, 'getEmergency').mockReturnValue(emergency);
      jest.spyOn(emergencyService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ emergency });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: emergency }));
      saveSubject.complete();

      // THEN
      expect(emergencyFormService.getEmergency).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(emergencyService.update).toHaveBeenCalledWith(expect.objectContaining(emergency));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IEmergency>>();
      const emergency = { id: 'ABC' };
      jest.spyOn(emergencyFormService, 'getEmergency').mockReturnValue({ id: null });
      jest.spyOn(emergencyService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ emergency: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: emergency }));
      saveSubject.complete();

      // THEN
      expect(emergencyFormService.getEmergency).toHaveBeenCalled();
      expect(emergencyService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IEmergency>>();
      const emergency = { id: 'ABC' };
      jest.spyOn(emergencyService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ emergency });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(emergencyService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
