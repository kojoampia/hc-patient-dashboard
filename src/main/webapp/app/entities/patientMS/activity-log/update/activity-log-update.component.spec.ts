import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { ActivityLogService } from '../service/activity-log.service';
import { IActivityLog } from '../activity-log.model';
import { ActivityLogFormService } from './activity-log-form.service';

import { ActivityLogUpdateComponent } from './activity-log-update.component';

describe('ActivityLog Management Update Component', () => {
  let comp: ActivityLogUpdateComponent;
  let fixture: ComponentFixture<ActivityLogUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let activityLogFormService: ActivityLogFormService;
  let activityLogService: ActivityLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([]), ActivityLogUpdateComponent],
      providers: [
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(ActivityLogUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ActivityLogUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    activityLogFormService = TestBed.inject(ActivityLogFormService);
    activityLogService = TestBed.inject(ActivityLogService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const activityLog: IActivityLog = { id: 'CBA' };

      activatedRoute.data = of({ activityLog });
      comp.ngOnInit();

      expect(comp.activityLog).toEqual(activityLog);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IActivityLog>>();
      const activityLog = { id: 'ABC' };
      jest.spyOn(activityLogFormService, 'getActivityLog').mockReturnValue(activityLog);
      jest.spyOn(activityLogService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ activityLog });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: activityLog }));
      saveSubject.complete();

      // THEN
      expect(activityLogFormService.getActivityLog).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(activityLogService.update).toHaveBeenCalledWith(expect.objectContaining(activityLog));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IActivityLog>>();
      const activityLog = { id: 'ABC' };
      jest.spyOn(activityLogFormService, 'getActivityLog').mockReturnValue({ id: null });
      jest.spyOn(activityLogService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ activityLog: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: activityLog }));
      saveSubject.complete();

      // THEN
      expect(activityLogFormService.getActivityLog).toHaveBeenCalled();
      expect(activityLogService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IActivityLog>>();
      const activityLog = { id: 'ABC' };
      jest.spyOn(activityLogService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ activityLog });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(activityLogService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
