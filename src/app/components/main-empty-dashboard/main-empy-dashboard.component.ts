import { Component } from '@angular/core';
import { MainLayoutComponent } from '../layout/main-layout.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './main-empy-dashboard.component.html',
  standalone: true,
  imports: [
    MainLayoutComponent
  ],
 
})
export class MainEmptyDashboardComponent {
  // Si quieres agregar lógica futura (por ejemplo animaciones, redirecciones, etc.)
  // puedes hacerlo aquí, pero por ahora no necesita nada.
}