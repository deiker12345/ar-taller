import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return authState(this.auth).pipe(
      take(1),
      map((user) => {
        if (user) {
          return true;
        }
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}