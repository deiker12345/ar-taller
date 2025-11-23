import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ArSessionService {
  private activeSubject = new BehaviorSubject<boolean>(false);
  active$: Observable<boolean> = this.activeSubject.asObservable();

  start() {
    this.activeSubject.next(true);
  }

  stop() {
    this.activeSubject.next(false);
  }

  get isActive(): boolean {
    return this.activeSubject.value;
  }
}