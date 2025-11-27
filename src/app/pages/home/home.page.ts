import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/service/auth.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/shared/service/toast.service';
import { MediaService } from 'src/app/shared/service/media.service';
import { ActivatedRoute } from '@angular/router';
import { ArSessionService } from 'src/app/shared/service/ar-session.service';
import { SupabaseService, ArTarget } from 'src/app/core/service/supabase.service';

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

  targets: ArTarget[] = [];
  loadingTargets = false;
  selectedTargetConfig: ArTarget | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private media: MediaService,
    private route: ActivatedRoute,
    private arSession: ArSessionService,
    private supabase: SupabaseService
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.currentTargetId = params.get('targetId');
    });

    this.arSession.active$.subscribe(active => {
      this.isArActive = active;
    });

    this.loadTargets();
  }

  async loadTargets() {
    this.loadingTargets = true;
    try {
      this.targets = await this.supabase.listArTargets();
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingTargets = false;
    }
  }

  startAr() {
    document.body.classList.add('dark');
    this.arSession.start();
    this.toast.presentToast('Iniciando modo AR. Apunta al marcador (Hiro por defecto).', 'primary');
  }

  stopAr() {
    document.body.classList.remove('dark');
    this.arSession.stop();
    this.toast.presentToast('Modo AR detenido. Volviendo al inicio.', 'warning');
  }

  selectTarget(t: ArTarget) {
    this.currentTargetId = t.id;
    this.selectedTargetConfig = t;
    this.toast.presentToast(`Target seleccionado: ${t.title ?? t.id}`, 'success');
    this.startAr();
  }

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
