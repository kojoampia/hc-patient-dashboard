import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { ITask, NewTask } from '../task.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ITask for edit and NewTaskFormGroupInput for create.
 */
type TaskFormGroupInput = ITask | PartialWithRequiredKeyOf<NewTask>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends ITask | NewTask> = Omit<T, 'scheduledAt'> & {
  scheduledAt?: string | null;
};

type TaskFormRawValue = FormValueOf<ITask>;

type NewTaskFormRawValue = FormValueOf<NewTask>;

type TaskFormDefaults = Pick<NewTask, 'id' | 'scheduledAt'>;

type TaskFormGroupContent = {
  id: FormControl<TaskFormRawValue['id'] | NewTask['id']>;
  name: FormControl<TaskFormRawValue['name']>;
  description: FormControl<TaskFormRawValue['description']>;
  schedule: FormControl<TaskFormRawValue['schedule']>;
  scheduledAt: FormControl<TaskFormRawValue['scheduledAt']>;
  duration: FormControl<TaskFormRawValue['duration']>;
  status: FormControl<TaskFormRawValue['status']>;
  location: FormControl<TaskFormRawValue['location']>;
  caseId: FormControl<TaskFormRawValue['caseId']>;
  attendantId: FormControl<TaskFormRawValue['attendantId']>;
  teamId: FormControl<TaskFormRawValue['teamId']>;
  patientId: FormControl<TaskFormRawValue['patientId']>;
  attendant: FormControl<TaskFormRawValue['attendant']>;
  createdDate: FormControl<TaskFormRawValue['createdDate']>;
  modifiedDate: FormControl<TaskFormRawValue['modifiedDate']>;
  createdBy: FormControl<TaskFormRawValue['createdBy']>;
  modifiedBy: FormControl<TaskFormRawValue['modifiedBy']>;
};

export type TaskFormGroup = FormGroup<TaskFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class TaskFormService {
  createTaskFormGroup(task: TaskFormGroupInput = { id: null }): TaskFormGroup {
    const taskRawValue = this.convertTaskToTaskRawValue({
      ...this.getFormDefaults(),
      ...task,
    });
    return new FormGroup<TaskFormGroupContent>({
      id: new FormControl(
        { value: taskRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      name: new FormControl(taskRawValue.name),
      description: new FormControl(taskRawValue.description),
      schedule: new FormControl(taskRawValue.schedule),
      scheduledAt: new FormControl(taskRawValue.scheduledAt),
      duration: new FormControl(taskRawValue.duration),
      status: new FormControl(taskRawValue.status),
      location: new FormControl(taskRawValue.location),
      caseId: new FormControl(taskRawValue.caseId),
      attendantId: new FormControl(taskRawValue.attendantId),
      teamId: new FormControl(taskRawValue.teamId),
      patientId: new FormControl(taskRawValue.patientId),
      attendant: new FormControl(taskRawValue.attendant),
      createdDate: new FormControl(taskRawValue.createdDate),
      modifiedDate: new FormControl(taskRawValue.modifiedDate),
      createdBy: new FormControl(taskRawValue.createdBy),
      modifiedBy: new FormControl(taskRawValue.modifiedBy),
    });
  }

  getTask(form: TaskFormGroup): ITask | NewTask {
    return this.convertTaskRawValueToTask(form.getRawValue() as TaskFormRawValue | NewTaskFormRawValue);
  }

  resetForm(form: TaskFormGroup, task: TaskFormGroupInput): void {
    const taskRawValue = this.convertTaskToTaskRawValue({ ...this.getFormDefaults(), ...task });
    form.reset(
      {
        ...taskRawValue,
        id: { value: taskRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): TaskFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      scheduledAt: currentTime,
    };
  }

  private convertTaskRawValueToTask(rawTask: TaskFormRawValue | NewTaskFormRawValue): ITask | NewTask {
    return {
      ...rawTask,
      scheduledAt: dayjs(rawTask.scheduledAt, DATE_TIME_FORMAT),
    };
  }

  private convertTaskToTaskRawValue(
    task: ITask | (Partial<NewTask> & TaskFormDefaults),
  ): TaskFormRawValue | PartialWithRequiredKeyOf<NewTaskFormRawValue> {
    return {
      ...task,
      scheduledAt: task.scheduledAt ? task.scheduledAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
