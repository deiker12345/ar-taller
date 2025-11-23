import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/service/auth.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/shared/service/toast.service';
import { MediaService } from 'src/app/shared/service/media.service';
import { ActivatedRoute } from '@angular/router';
import { ArSessionService } from 'src/app/shared/service/ar-session.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone : false
})
export class HomePage implements OnInit {
  currentTargetId: string | null = null;
  previewImage?: string | null;
  isArActive = false;
  arInstruction = 'Apunta la cámara al marcador para ver el modelo. Mueve el dispositivo lentamente para iniciar la detección.';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private media: MediaService,
    private route: ActivatedRoute,
    private arSession: ArSessionService
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.currentTargetId = params.get('targetId');
    });

    this.arSession.active$.subscribe(active => {
      this.isArActive = active;
    });
  }

  // Flujo AR profesional
  startAr() {
    this.arSession.start();
    this.toast.presentToast('Iniciando modo AR. Apunta al marcador (Hiro por defecto).', 'primary');
  }

  stopAr() {
    this.arSession.stop();
    this.toast.presentToast('Modo AR detenido. Volviendo al inicio.', 'warning');
  }

  // Cámara nativa (opcional para pruebas de captura)
  async openCamera() {
    const img = await this.media.takePicture();
    if (img) {
      this.previewImage = img;
      this.toast.presentToast('Imagen capturada correctamente.', 'success');
    } else {
      this.toast.presentToast('No se pudo capturar la imagen.', 'danger');
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.toast.presentToast('Sesión cerrada', 'success');
      this.router.navigate(['/login']);
    } catch (err: any) {
      this.toast.presentToast(err.message, 'danger');
    }
  }
}
