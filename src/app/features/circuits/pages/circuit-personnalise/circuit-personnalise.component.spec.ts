import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircuitPersonnaliseComponent } from './circuit-personnalise.component';

describe('CircuitPersonnaliseComponent', () => {
  let component: CircuitPersonnaliseComponent;
  let fixture: ComponentFixture<CircuitPersonnaliseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircuitPersonnaliseComponent]
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
