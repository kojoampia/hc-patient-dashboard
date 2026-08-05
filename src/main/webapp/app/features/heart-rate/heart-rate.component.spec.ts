import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';

import { HeartRateComponent } from './heart-rate.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('HeartRateComponent', () => {
  let component: HeartRateComponent;
  let fixture: ComponentFixture<HeartRateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [HeartRateComponent, RouterTestingModule],
    providers: [NgbActiveModal, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
      .overrideTemplate(StatComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(HeartRateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
