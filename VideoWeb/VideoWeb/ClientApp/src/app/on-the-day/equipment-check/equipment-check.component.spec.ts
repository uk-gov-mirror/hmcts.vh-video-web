import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { EquipmentCheckComponent } from './equipment-check.component';

describe('EquipmentCheckComponent', () => {
  let component: EquipmentCheckComponent;
  let fixture: ComponentFixture<EquipmentCheckComponent>;
  let debugElement: DebugElement;
  let router: Router;
  const conference = new ConferenceTestData().getConferenceDetail();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EquipmentCheckComponent],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule, SharedModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          },
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EquipmentCheckComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    router = TestBed.get(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EquipmentCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to camera-and-microphone', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    component.goToCameraAndMicCheck();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.CameraAndMicrophone, conference.id]);
  });
});
