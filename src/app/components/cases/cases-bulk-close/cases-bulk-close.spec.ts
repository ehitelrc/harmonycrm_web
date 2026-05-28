import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasesBulkClose } from './cases-bulk-close';

describe('CasesBulkClose', () => {
  let component: CasesBulkClose;
  let fixture: ComponentFixture<CasesBulkClose>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesBulkClose]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CasesBulkClose);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
