import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';

import { EmergencyComponent } from './emergency.component';

describe('EmergencyComponent', () => {
  let component: EmergencyComponent;
  let fixture: ComponentFixture<EmergencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Opened as a modal, so NgbActiveModal has to be provided; the embedded Stat list brings the HTTP and router
      // dependencies. StatComponent's template is blanked out because this is a test of the wrapper — the list has
      // its own spec.
      imports: [EmergencyComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [NgbActiveModal],
    })
      .overrideTemplate(StatComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(EmergencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
