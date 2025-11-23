import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ArViewComponent } from './components/ar-view/ar-view.component';

const MODULE = [  CommonModule, FormsModule, IonicModule,]
const COMPONENTS = [ArViewComponent]



@NgModule({
  declarations: [...COMPONENTS],
  imports: [...MODULE],
  exports: [...MODULE, ...COMPONENTS]
})
export class SharedModule { }
