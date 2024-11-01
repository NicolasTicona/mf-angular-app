import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { CardComponent } from './components/card/card.component';
import { CommonModule } from '@angular/common';
import { DummySupportComponent } from './components/dummy-support/dummy-support.component';
import { FilterFormComponent } from './components/filter-form/filter-form.component';
@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HeaderComponent,
    CardComponent,
    DummySupportComponent,
    FilterFormComponent
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
