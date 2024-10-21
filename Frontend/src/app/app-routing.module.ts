
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/home/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { MenuComponent } from './components/menu/menu.component';
import { MaterialModule } from './material/material.module';
import { PersonalisadoComponent } from './components/menu/Options/ReportePersonalisado/personalisados.component';
import { AuthGuard } from './auth.guard';
import { ErrorComponent } from './components/home/error/error.component';
import { RegistroUsuariosComponent } from './components/menu/Options/RegistroUsuarios/usuarios.component';
import { SearchToolsComponent } from './components/menu/Options/search-tools/SearchTools.component';
import { NewToolsComponent } from './components/menu/Options/NewTools/NewTools.component';
import { EditToolsComponent } from './components/menu/Options/EditTools/EditTools.component';
import { SancionesComponent } from './components/menu/Options/sanciones/sanciones.component';
import { RegistroEstudianteComponent } from './components/menu/Options/Estudiantes/estudiantes.component';



const routes: Routes = [
  {
    path : '',
    redirectTo : 'home',
    pathMatch : 'full'
  },
  { path: 'menu', component: MenuComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent}, 
  { path: 'error', component: ErrorComponent },
  {path:'login',component:LoginComponent,canActivate: [AuthGuard]},
  {path: 'search', component: SearchToolsComponent, canActivate: [AuthGuard] },
  {path: 'NewTool', component: NewToolsComponent, canActivate: [AuthGuard] },
  { path: 'new-tool', component: NewToolsComponent, canActivate: [AuthGuard]  },
  {path: 'EditTool', component:EditToolsComponent, canActivate: [AuthGuard] },
  {path: 'sanciones', component: SancionesComponent, canActivate: [AuthGuard] },
  {path: 'registro', component: RegistroUsuariosComponent, canActivate: [AuthGuard] },
  {path: 'estudiante', component: RegistroEstudianteComponent, canActivate: [AuthGuard] },
  {path: 'personalizado', component: PersonalisadoComponent, canActivate: [AuthGuard] }

];

@NgModule({
  imports: [RouterModule.forRoot(routes),
            MaterialModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }