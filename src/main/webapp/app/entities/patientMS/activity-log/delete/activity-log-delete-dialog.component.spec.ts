jest.mock('@ng-bootstrap/ng-bootstrap');

import { ComponentFixture, TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ActivityLogService } from '../service/activity-log.service';

import { ActivityLogDeleteDialogComponent } from './activity-log-delete-dialog.component';

describe('ActivityLog Management Delete Component', () => {
  let comp: ActivityLogDeleteDialogComponent;
  let fixture: ComponentFixture<ActivityLogDeleteDialogComponent>;
  let service: ActivityLogService;
  let mockActiveModal: NgbActiveModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ActivityLogDeleteDialogComponent],
      providers: [NgbActiveModal],
    })
      .overrideTemplate(ActivityLogDeleteDialogComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(ActivityLogDeleteDialogComponent);
    comp = fixture.componentInstance;
    service = TestBed.inject(ActivityLogService);
    mockActiveModal = TestBed.inject(NgbActiveModal);
  });

  describe('confirmDelete', () => {
    it('Should call delete service on confirmDelete', inject(
      [],
      fakeAsync(() => {
        // GIVEN
        jest.spyOn(service, 'delete').mockReturnValue(of(new HttpResponse({ body: {} })));

        // WHEN
        comp.confirmDelete('ABC');
        tick();

        // THEN
        expect(service.delete).toHaveBeenCalledWith('ABC');
        expect(mockActiveModal.close).toHaveBeenCalledWith('deleted');
      }),
    ));

    it('Should not call delete service on clear', () => {
      // GIVEN
      jest.spyOn(service, 'delete');

      // WHEN
      comp.cancel();

      // THEN
      expect(service.delete).not.toHaveBeenCalled();
      expect(mockActiveModal.close).not.toHaveBeenCalled();
      expect(mockActiveModal.dismiss).toHaveBeenCalled();
    });
  });
});
