import { Component } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  showSearch = false;
  showNewTools = false;
  showSanciones = false;
  showRegistro = false;
  showEstudiantes = false;
  showReporte = false;
  constructor(private modal: NgbModal) {

  }
  showSearchTools() {
    this.resetViews();
    this.showSearch = true;
  }

  showNewTool() {
    this.resetViews();
    this.showNewTools = true;
  }

  showSancion() {
    this.resetViews();
    this.showSanciones = true;
  }

  showRegistroBlibliotecarios() {
    this.resetViews();
    this.showRegistro = true;
  }

  showRegistroEstudiantes() {
    this.resetViews();
    this.showEstudiantes = true;
  }

  showPersonalisado(){
    this.resetViews();
    this.showReporte = true;
  }
  redirectToHome() {
    this.resetViews();
    // Redirigir al apartado de inicio (home)
    window.location.href = '#welcome';
  }

  private resetViews() {
    this.showSearch = false;
    this.showNewTools = false;
    this.showSanciones = false;
    this.showRegistro = false;
    this.showEstudiantes = false;
    this.showReporte = false;
  }

  openModal() {
    const modalRef = this.modal.open(LoginComponent, {
      backdrop: 'static',
      size: 'md',
      centered: true
    });
  }
}
