import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';

import { AllergyComponent } from './allergy.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AllergyComponent', () => {
  let component: AllergyComponent;
  let fixture: ComponentFixture<AllergyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AllergyComponent, RouterTestingModule],
    providers: [NgbActiveModal, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
      .overrideTemplate(StatComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(AllergyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
