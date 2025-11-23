import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/service/auth.service';
import { Router } from '@angular/router';
import { User } from 'src/app/core/interfaces/user.interface';
import { ToastService } from 'src/app/shared/service/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage {

  user: User = {
    nombre: '',
    correo: '',
    contrasena: ''
  };

  constructor(
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  async register() {
    try {
      await this.authService.register(this.user);
      this.toast.presentToast('Usuario registrado con éxito', 'success');
      this.router.navigate(['/login']);
    } catch (err: any) {
      this.toast.presentToast(err.message, 'danger');
    }
  }

  goLogin() {
    this.router.navigate(['/login']);
  }
}
