import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { EmptyStateComponent } from 'app/shared/ui/empty-state/empty-state.component';
import { ICarePlanItem } from 'app/entities/patientMS/care-plan-item/care-plan-item.model';
import { CarePlanItemService } from 'app/entities/patientMS/care-plan-item/service/care-plan-item.service';

import { PortalDataService } from '../data/portal-data.service';

/**
 * The diet and exercise plan, as a tick list the patient works through.
 *
 * Ticking an item writes straight through to the server. The optimistic set is kept locally so
 * the checkbox responds immediately, and is rolled back if the write fails — a tick that silently
 * did not save is worse than one that visibly bounced.
 */
@Component({
  selector: 'hpd-plans',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, IconComponent, EmptyStateComponent],
  templateUrl: './plans.component.html',
})
export default class PlansComponent {
  private readonly data = inject(PortalDataService);
  private readonly carePlanItemService = inject(CarePlanItemService);

  private readonly items = toSignal(this.data.carePlan$, { initialValue: [] });

  /** Local overrides applied on top of the server's answer, keyed by item id. */
  private readonly pending = signal<ReadonlyMap<string, boolean>>(new Map());

  readonly diet = computed(() => this.section('DIET'));
  readonly exercise = computed(() => this.section('EXERCISE'));

  readonly dietDone = computed(() => this.diet().filter(item => item.done).length);
  readonly exerciseDone = computed(() => this.exercise().filter(item => item.done).length);

  readonly dietPercent = computed(() => percent(this.dietDone(), this.diet().length));
  readonly exercisePercent = computed(() => percent(this.exerciseDone(), this.exercise().length));

  toggle(item: ICarePlanItem & { done: boolean }): void {
    const next = !item.done;
    this.setPending(item.id, next);

    this.carePlanItemService.partialUpdate({ id: item.id, completed: next }).subscribe({
      error: () => this.setPending(item.id, item.done),
    });
  }

  private setPending(id: string, value: boolean): void {
    const map = new Map(this.pending());
    map.set(id, value);
    this.pending.set(map);
  }

  /** One plan section, in the order the care team wrote it. */
  private section(planType: 'DIET' | 'EXERCISE'): readonly (ICarePlanItem & { done: boolean })[] {
    const overrides = this.pending();
    return this.items()
      .filter(item => item.planType === planType)
      .map(item => ({ ...item, done: overrides.get(item.id) ?? item.completed ?? false }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
}

function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
