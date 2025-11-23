import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService, ArConfig } from 'src/app/core/service/supabase.service';

@Component({
  selector: 'app-ar-view',
  templateUrl: './ar-view.component.html',
  styleUrls: ['./ar-view.component.scss'],
  standalone: false
})
export class ArViewComponent implements OnInit, OnChanges {
  @Input() targetId?: string | null;
  @Input() config?: ArConfig | null;

  loading = false;
  iframeSrc?: SafeResourceUrl;

  constructor(private supabase: SupabaseService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.resolveAndBuild();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['targetId'] || changes['config']) {
      this.resolveAndBuild();
    }
  }

  private async resolveAndBuild() {
    this.loading = true;
    try {
      let cfg: ArConfig | null = this.config ?? null;
      if (!cfg && this.targetId) {
        cfg = await this.supabase.getArConfig(this.targetId);
      }
      // Fallback: usa preset "hiro" si no hay configuración
      if (!cfg) {
        cfg = {
          mode: 'marker',
          src: '/assets/icon/favicon.png',
          markerPreset: 'hiro',
          width: 3,
          height: 3
        };
      }
      const url = this.buildUrl(cfg);
      this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } finally {
      this.loading = false;
    }
  }

  private buildUrl(cfg: ArConfig): string {
    const params = new URLSearchParams({
      mode: cfg.mode,
      src: cfg.src,
      markerPreset: cfg.markerPreset ?? 'hiro',
      width: String(cfg.width ?? 3),
      height: String(cfg.height ?? 4),
    });
    if (cfg.patternUrl) params.set('patternUrl', cfg.patternUrl);
    return `/assets/ar/ar-view.html?${params.toString()}`;
  }
}
