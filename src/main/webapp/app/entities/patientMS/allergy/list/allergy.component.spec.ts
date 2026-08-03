import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AllergyService } from '../service/allergy.service';

import { AllergyComponent } from './allergy.component';

describe('Allergy Management Component', () => {
  let comp: AllergyComponent;
  let fixture: ComponentFixture<AllergyComponent>;
  let service: AllergyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([{ path: 'allergy', component: AllergyComponent }]),
        HttpClientTestingModule,
        AllergyComponent,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({
              defaultSort: 'id,asc',
            }),
            queryParamMap: of(
              jest.requireActual('@angular/router').convertToParamMap({
                page: '1',
                size: '1',
                sort: 'id,desc',
              }),
            ),
            snapshot: { queryParams: {} },
          },
        },
      ],
    })
      .overrideTemplate(AllergyComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(AllergyComponent);
    comp = fixture.componentInstance;
    service = TestBed.inject(AllergyService);

    const headers = new HttpHeaders();
    jest.spyOn(service, 'query').mockReturnValue(
      of(
        new HttpResponse({
          body: [{ id: 'ABC' }],
          headers,
        }),
      ),
    );
  });

  it('Should call load all on init', () => {
    // WHEN
    comp.ngOnInit();

    // THEN
    expect(service.query).toHaveBeenCalled();
    expect(comp.allergies?.[0]).toEqual(expect.objectContaining({ id: 'ABC' }));
  });

  describe('trackId', () => {
    it('Should forward to allergyService', () => {
      const entity = { id: 'ABC' };
      jest.spyOn(service, 'getAllergyIdentifier');
      const id = comp.trackId(0, entity);
      expect(service.getAllergyIdentifier).toHaveBeenCalledWith(entity);
      expect(id).toBe(entity.id);
    });
  });
});
