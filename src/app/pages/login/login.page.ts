import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/service/auth.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/shared/service/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {

  correo: string = '';
  contrasena: string = '';

  constructor(
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  async login() {
    try {
      await this.authService.login(this.correo, this.contrasena);
      this.toast.presentToast('Inicio de sesión exitoso', 'success');
      this.router.navigate(['/home']);
    } catch (err: any) {
      this.toast.presentToast(err.message, 'danger');
    }
  }

  goRegister() {
    this.router.navigate(['/register']);
  }
}
