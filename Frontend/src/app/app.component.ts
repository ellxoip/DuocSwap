// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Prestador';
  isSidebarHidden = true;
  showSearch = false;
  showNewTools = false;
  showEmailConfirm = false;
  showSanciones = false;

  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
  }

  showSearchTools() {
    this.resetViews();
    this.showSearch = true;
  }

  showNewTool() {
    this.resetViews();
    this.showNewTools = true;
  }

  showEmailConfirmation() {
    this.resetViews();
    this.showEmailConfirm = true;
  }

  showSancion() {
    this.resetViews();
    this.showSanciones = true;
  }

  resetViews() {
    this.showSearch = false;
    this.showNewTools = false;
    this.showEmailConfirm = false;
    this.showSanciones = false;
  }
}