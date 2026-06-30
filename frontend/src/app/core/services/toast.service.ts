import { Injectable, inject, signal } from "@angular/core";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ToastHostComponent } from "../../shared/components/toast/toast-host.component";
import { ToastItem, ToastKind } from "../../shared/models/toast.model";

const TOAST_PRIORITIES: Record<ToastKind, number> = {
  error: 3,
  success: 2,
  info: 1,
};

const MAX_VISIBLE_TOASTS = 3;

interface ToastQueueItem extends ToastItem {
  priority: number;
  sequence: number;
  durationMs: number;
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private readonly overlay = inject(Overlay);
  private overlayRef?: OverlayRef;
  private nextId = 1;
  private nextSequence = 1;
  private readonly queue: ToastQueueItem[] = [];
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly toasts = signal<ToastItem[]>([]);

  success(title: string, message: string, durationMs = 3200) {
    return this.show("success", title, message, durationMs);
  }

  info(title: string, message: string, durationMs = 3000) {
    return this.show("info", title, message, durationMs);
  }

  error(title: string, message: string, durationMs = 5000) {
    return this.show("error", title, message, durationMs);
  }

  dismiss(id: number) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);

    const activeItems = this.toasts();
    const nextVisible = activeItems.filter((item) => item.id !== id);
    if (nextVisible.length !== activeItems.length) {
      this.toasts.set(nextVisible);
      this.flushQueue();
      return;
    }

    const pendingIndex = this.queue.findIndex((item) => item.id === id);
    if (pendingIndex >= 0) {
      this.queue.splice(pendingIndex, 1);
    }
  }

  clear() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.queue.length = 0;
    this.toasts.set([]);
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  private show(
    kind: ToastKind,
    title: string,
    message: string,
    durationMs: number,
  ) {
    this.ensureOverlay();
    const id = this.nextId++;
    this.queue.push({
      id,
      kind,
      title,
      message,
      priority: TOAST_PRIORITIES[kind],
      sequence: this.nextSequence++,
      durationMs,
    });
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.sequence !== b.sequence) return a.sequence - b.sequence;
      return a.id - b.id;
    });
    this.flushQueue();

    return id;
  }

  private flushQueue() {
    const visibleCount = this.toasts().length;
    const availableSlots = Math.max(0, MAX_VISIBLE_TOASTS - visibleCount);
    if (!availableSlots || this.queue.length === 0) return;

    const nextVisible = this.queue.splice(0, availableSlots).map((item) => {
      const {
        priority: _priority,
        sequence: _sequence,
        durationMs,
        ...toast
      } = item;
      const timer = setTimeout(() => this.dismiss(toast.id), durationMs);
      this.timers.set(toast.id, timer);
      return toast;
    });

    this.toasts.update((items) => [...items, ...nextVisible]);
  }

  private ensureOverlay() {
    if (this.overlayRef) return;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .global()
        .bottom("1rem")
        .right("1rem"),
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      hasBackdrop: false,
      panelClass: "app-toast-overlay",
      disposeOnNavigation: true,
    });

    this.overlayRef.attach(new ComponentPortal(ToastHostComponent));
  }
}
