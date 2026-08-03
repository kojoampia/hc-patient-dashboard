import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IStat, NewStat } from '../stat.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IStat for edit and NewStatFormGroupInput for create.
 */
type StatFormGroupInput = IStat | PartialWithRequiredKeyOf<NewStat>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IStat | NewStat> = Omit<T, 'recordedAt'> & {
  recordedAt?: string | null;
};

type StatFormRawValue = FormValueOf<IStat>;

type NewStatFormRawValue = FormValueOf<NewStat>;

type StatFormDefaults = Pick<NewStat, 'id' | 'recordedAt'>;

type StatFormGroupContent = {
  id: FormControl<StatFormRawValue['id'] | NewStat['id']>;
  patientId: FormControl<StatFormRawValue['patientId']>;
  type: FormControl<StatFormRawValue['type']>;
  name: FormControl<StatFormRawValue['name']>;
  description: FormControl<StatFormRawValue['description']>;
  value: FormControl<StatFormRawValue['value']>;
  secondaryValue: FormControl<StatFormRawValue['secondaryValue']>;
  unit: FormControl<StatFormRawValue['unit']>;
  referenceLow: FormControl<StatFormRawValue['referenceLow']>;
  referenceHigh: FormControl<StatFormRawValue['referenceHigh']>;
  flag: FormControl<StatFormRawValue['flag']>;
  note: FormControl<StatFormRawValue['note']>;
  recordedAt: FormControl<StatFormRawValue['recordedAt']>;
  createdDate: FormControl<StatFormRawValue['createdDate']>;
  createdBy: FormControl<StatFormRawValue['createdBy']>;
};

export type StatFormGroup = FormGroup<StatFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class StatFormService {
  createStatFormGroup(stat: StatFormGroupInput = { id: null }): StatFormGroup {
    const statRawValue = this.convertStatToStatRawValue({
      ...this.getFormDefaults(),
      ...stat,
    });
    return new FormGroup<StatFormGroupContent>({
      id: new FormControl(
        { value: statRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      patientId: new FormControl(statRawValue.patientId),
      type: new FormControl(statRawValue.type),
      name: new FormControl(statRawValue.name),
      description: new FormControl(statRawValue.description),
      value: new FormControl(statRawValue.value),
      secondaryValue: new FormControl(statRawValue.secondaryValue),
      unit: new FormControl(statRawValue.unit),
      referenceLow: new FormControl(statRawValue.referenceLow),
      referenceHigh: new FormControl(statRawValue.referenceHigh),
      flag: new FormControl(statRawValue.flag),
      note: new FormControl(statRawValue.note),
      recordedAt: new FormControl(statRawValue.recordedAt),
      createdDate: new FormControl(statRawValue.createdDate),
      createdBy: new FormControl(statRawValue.createdBy),
    });
  }

  getStat(form: StatFormGroup): IStat | NewStat {
    return this.convertStatRawValueToStat(form.getRawValue() as StatFormRawValue | NewStatFormRawValue);
  }

  resetForm(form: StatFormGroup, stat: StatFormGroupInput): void {
    const statRawValue = this.convertStatToStatRawValue({ ...this.getFormDefaults(), ...stat });
    form.reset(
      {
        ...statRawValue,
        id: { value: statRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): StatFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      recordedAt: currentTime,
    };
  }

  private convertStatRawValueToStat(rawStat: StatFormRawValue | NewStatFormRawValue): IStat | NewStat {
    return {
      ...rawStat,
      recordedAt: dayjs(rawStat.recordedAt, DATE_TIME_FORMAT),
    };
  }

  private convertStatToStatRawValue(
    stat: IStat | (Partial<NewStat> & StatFormDefaults),
  ): StatFormRawValue | PartialWithRequiredKeyOf<NewStatFormRawValue> {
    return {
      ...stat,
      recordedAt: stat.recordedAt ? stat.recordedAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
