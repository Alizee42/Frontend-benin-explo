import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CircuitsListComponent } from './circuits-list.component';

describe('CircuitsListComponent', () => {
  let component: CircuitsListComponent;
  let fixture: ComponentFixture<CircuitsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircuitsListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircuitsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
