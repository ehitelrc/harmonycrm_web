import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentValidations } from './payment-validations';

describe('PaymentValidations', () => {
  let component: PaymentValidations;
  let fixture: ComponentFixture<PaymentValidations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentValidations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentValidations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
