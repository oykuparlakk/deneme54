import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { FullCalendarComponent } from "@fullcalendar/angular";
import { CalendarOptions } from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import trLocale from "@fullcalendar/core/locales/tr";
import { ActivitiesService } from "../../activity-group/_services/activities.service";
import { catchError, finalize, tap } from "rxjs/operators";
import { of, Subscription } from "rxjs";
import { FormBuilder } from "@angular/forms";
import { ShiftService } from "../_services/shift.service";
import { TaskService } from "../../activity-group/_services/task.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Activity } from "../../activity-group/_models/activity.model";
import { Task } from "../../activity-group/_models/task.model";
import { Shift } from "../_models/shift.model";
import { AuthenticationService } from "src/app/services/authentication.service";

@Component({
  selector: "app-team-member-shift",
  templateUrl: "./team-member-shift.component.html",
  styleUrls: ["./team-member-shift.component.scss"],
})
export class TeamMemberShiftComponent implements OnInit {
  shift: Shift; //aut service get user'ı alıcaz ve shift serviceden get all shift yapıcaz aldığımız shiftlerin içinden shift to user arrayinde usera eşit olanı shifte eşitliyicez
  @Input() activity: Activity;
  @Output() onEventClick = new EventEmitter<any>();
  private subscriptions: Subscription[] = [];
  loading: boolean = true;
  activities: Activity[];
  tasks: Task[];

  constructor(
    private fb: FormBuilder,
    public shiftService: ShiftService,
    public activitiesService: ActivitiesService,
    public taskService: TaskService,
    public authService: AuthenticationService,
    public modal: NgbActiveModal,
    private cdr: ChangeDetectorRef
  ) {}

  public calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    locale: trLocale,
    timeZone: "local",
    initialView: "dayGridWeek",
    headerToolbar: {
      right: "dayGridWeek,dayGridMonth,dayGridDay",
      left: "prev,next",
      center: "title",
    },
    eventClassNames: ["cursorPointer"],
    eventClick: this.handleActivity.bind(this),

    displayEventTime: false,
  };
  @ViewChild("fullCalendar") calendar: FullCalendarComponent;

  ngOnInit(): void {
    let allShifts = this.shiftService.getAllShifts();
    let enteredUser = this.authService.getUser().ipn;
    allShifts.forEach((circulatedShift) => {
      circulatedShift.shift_to_users.forEach((circulatedUser) => {
        if (circulatedUser == enteredUser) {
          this.shift = circulatedShift;
        }
      });
    });
    this.loadActivities();
  }
  private async loadActivities() {
    this.activitiesService
      .getAllActivities()
      .pipe(
        tap(() => {}),
        catchError((errorMessage) => {
          console.log(errorMessage);
          return of(this.activities);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        this.activities = this.shift.activities;
        this.setCalendar();
      });
  }
  private setCalendar() {
    this.calendar.getApi().removeAllEvents();
    this.activities.forEach((e) => {
      this.calendar.getApi().addEvent({
        id: `${e.id}`,
        title: `${e.name} `,
        start: new Date(e.activity_start_date).toLocaleString("sv"),
        end: new Date(e.activity_end_date).toLocaleString("sv"),
      });
    });
  }

  handleActivity(arg) {
    this.activitiesService
      .getActivityById(arg.event._def.publicId)
      .pipe(
        tap(() => {}),
        catchError((errorMessage) => {
          console.log(errorMessage);
          return of(this.activity);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        this.tasks = res.task;
        this.cdr.detectChanges();
        console.log(this.tasks);
      });
  }
  loadTasks(activityId) {
    const sb = this.taskService
      .getItemById(activityId)
      .pipe(
        catchError((errorMessage) => {
          this.modal.dismiss(errorMessage);
          return of(this.tasks);
        })
      )
      .subscribe((res) => {
        this.tasks = this.activity.tasks;
        console.log(this.tasks);
      });
    this.subscriptions.push(sb);
  }
}
