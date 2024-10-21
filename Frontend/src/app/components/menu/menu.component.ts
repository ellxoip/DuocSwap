import { Component, HostListener } from '@angular/core';
import { SidebarService } from '../menu/Options/Services/sidebar.services';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  isSidebarHidden = false;
  showSearch = false;
  showNewTools = false;
  showSanciones = false;
  showRegistro = false;
  isDropdownVisible = false;
  showEstudiantes = false;
  showReporte = false;
  isFooterVisible = false;
  showNoticias = true; // Inicialmente mostramos las noticias
  showDevolucionDeTools = false; // Asegúrate de que esta propiedad esté definida
  noticiasItems: any[] = [];
   
  constructor(private sidebarService: SidebarService, private http: HttpClient, private router: Router) {
    this.sidebarService.sidebarHidden$.subscribe(hidden => this.isSidebarHidden = hidden);
    this.cargarNoticias();
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
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

  showPersonalisado() {
    this.resetViews();
    this.showReporte = true;
  }

  showNoticiasSection() {
    this.resetViews();
    this.showNoticias = true;
  }

  mostrarDevolucionDeMaterials() {
    this.resetViews();
    this.showDevolucionDeTools = true; // Cambia a true para mostrar el componente
}

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  closeDropdown() {
    this.isDropdownVisible = false;
  }

  logout() {
    localStorage.removeItem('token'); // Elimina el token de localStorage
    this.router.navigate(['/home']); // Redirige a la página de inicio de sesión
  }

  private resetViews() {
    this.showSearch = false;
    this.showNewTools = false;
    this.showSanciones = false;
    this.showRegistro = false;
    this.showEstudiantes = false;
    this.showReporte = false;
    this.showNoticias = false;
    this.showDevolucionDeTools = false; // Resetea la propiedad de devolución de Tools
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const windowHeight = 'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(body.clientHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    const windowBottom = windowHeight + window.pageYOffset;
    this.isFooterVisible = windowBottom >= docHeight;
  }

  private cargarNoticias() {
    // Simulando una llamada a API con datos de ejemplo
    this.noticiasItems = [
      {
        titulo: "Nuestra colección de Material Educativo",
        contenido: "DuocSwap ha incorporado una amplia variedad de materiales educativos para facilitar el aprendizaje y el intercambio entre estudiantes. Desde libros de texto hasta equipos de laboratorio, todo está disponible para el intercambio en nuestra plataforma.",
        imagen: "https://st2.depositphotos.com/3827765/5416/v/950/depositphotos_54166089-stock-illustration-set-of-16-school-thing.jpg"
      },
      {
        titulo: "Nuestro sistema de intercambio",
        contenido: "Recuerde que contamos con un programa de orientación para los estudiantes sobre el uso adecuado de la plataforma DuocSwap, enfocado en mejorar la experiencia de intercambio y la seguridad en las transacciones.",
        imagen: "https://www.uc.cl/site/assets/files/21753/estudiantes_uso_ia.700x532.jpg"
      },
      {
        titulo: "Acceso y disponibilidad",
        contenido: "Los materiales educativos están disponibles para intercambio en cualquier momento a través de la plataforma DuocSwap. Nuestro objetivo es asegurar que todos los estudiantes cuenten con los recursos necesarios para su aprendizaje de manera eficiente y colaborativa.",
        imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWiCOLtXcov0STz6tz5sjDm-ZVp1ZIpDjuKQ&s"
      }
    ];
  }
}