import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CircuitPersonnaliseComponent } from './circuit-personnalise.component';

describe('CircuitPersonnaliseComponent', () => {
  let component: CircuitPersonnaliseComponent;
  let fixture: ComponentFixture<CircuitPersonnaliseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircuitPersonnaliseComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircuitPersonnaliseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
