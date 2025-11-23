import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}

  async register(user: User) {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      user.correo,
      user.contrasena
    );

    await setDoc(
      doc(this.firestore, 'users', cred.user?.uid ?? ''),
      {
        uid: cred.user?.uid,
        nombre: user.nombre,
        correo: user.correo,
        creado: new Date()
      }
    );

    // Importante: Firebase autentica automáticamente al crear usuario.
    // Para permitir que el GuestGuard deje pasar a /login, cerramos sesión.
    await signOut(this.auth);

    return cred;
  }

  login(correo: string, contrasena: string) {
    return signInWithEmailAndPassword(this.auth, correo, contrasena);
  }

  logout() {
    return signOut(this.auth);
  }
}
