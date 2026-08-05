import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';

import { BloodPressureComponent } from './blood-pressure.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('BloodPressureComponent', () => {
  let component: BloodPressureComponent;
  let fixture: ComponentFixture<BloodPressureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [BloodPressureComponent, RouterTestingModule],
    providers: [NgbActiveModal, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
      .overrideTemplate(StatComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(BloodPressureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
