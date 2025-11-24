import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircuitDetailComponent } from './circuit-detail.component';

describe('CircuitDetailComponent', () => {
  let component: CircuitDetailComponent;
  let fixture: ComponentFixture<CircuitDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircuitDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircuitDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
