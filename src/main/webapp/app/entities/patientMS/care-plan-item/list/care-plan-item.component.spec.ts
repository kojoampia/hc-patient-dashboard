import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { CarePlanItemService } from '../service/care-plan-item.service';

import { CarePlanItemComponent } from './care-plan-item.component';

describe('CarePlanItem Management Component', () => {
  let comp: CarePlanItemComponent;
  let fixture: ComponentFixture<CarePlanItemComponent>;
  let service: CarePlanItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([{ path: 'care-plan-item', component: CarePlanItemComponent }]),
        HttpClientTestingModule,
        CarePlanItemComponent,
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
      .overrideTemplate(CarePlanItemComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(CarePlanItemComponent);
    comp = fixture.componentInstance;
    service = TestBed.inject(CarePlanItemService);

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
    expect(comp.carePlanItems?.[0]).toEqual(expect.objectContaining({ id: 'ABC' }));
  });

  describe('trackId', () => {
    it('Should forward to carePlanItemService', () => {
      const entity = { id: 'ABC' };
      jest.spyOn(service, 'getCarePlanItemIdentifier');
      const id = comp.trackId(0, entity);
      expect(service.getCarePlanItemIdentifier).toHaveBeenCalledWith(entity);
      expect(id).toBe(entity.id);
    });
  });
});
