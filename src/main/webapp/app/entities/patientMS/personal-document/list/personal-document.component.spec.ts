import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { PersonalDocumentService } from '../service/personal-document.service';

import { PersonalDocumentComponent } from './personal-document.component';

describe('PersonalDocument Management Component', () => {
  let comp: PersonalDocumentComponent;
  let fixture: ComponentFixture<PersonalDocumentComponent>;
  let service: PersonalDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([{ path: 'personal-document', component: PersonalDocumentComponent }]),
        HttpClientTestingModule,
        PersonalDocumentComponent,
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
      .overrideTemplate(PersonalDocumentComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PersonalDocumentComponent);
    comp = fixture.componentInstance;
    service = TestBed.inject(PersonalDocumentService);

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
    expect(comp.personalDocuments?.[0]).toEqual(expect.objectContaining({ id: 'ABC' }));
  });

  describe('trackId', () => {
    it('Should forward to personalDocumentService', () => {
      const entity = { id: 'ABC' };
      jest.spyOn(service, 'getPersonalDocumentIdentifier');
      const id = comp.trackId(0, entity);
      expect(service.getPersonalDocumentIdentifier).toHaveBeenCalledWith(entity);
      expect(id).toBe(entity.id);
    });
  });
});
