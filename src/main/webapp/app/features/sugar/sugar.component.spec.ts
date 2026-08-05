import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';

import { SugarComponent } from './sugar.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SugarComponent', () => {
  let component: SugarComponent;
  let fixture: ComponentFixture<SugarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SugarComponent, RouterTestingModule],
    providers: [NgbActiveModal, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
      .overrideTemplate(StatComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(SugarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
