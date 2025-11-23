import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({ providedIn: 'root' })
export class MediaService {
  async takePicture(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      return `data:image/jpeg;base64,${image.base64String}`;
    } catch (e) {
      return null;
    }
  }
}