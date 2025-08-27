import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Solicitud } from '../../interfaces/libro.interfaces';
import { Solicitudes } from '../../services/solicitudes';
import { Auth } from '../../services/auth';
import { Header } from '../header/header';

type Estado = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada' | 'entregada';
type Filtro = 'todas' | Estado;

@Component({
  selector: 'app-mis-solicitudes',
  imports: [Header],
  templateUrl: './mis-solicitudes.html',
  styleUrl: './mis-solicitudes.css',
})
export class MisSolicitudes {

  solicitudService = inject(Solicitudes);
  authService = inject(Auth);
  router = inject(Router);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // datos
  solicitudes = signal<Solicitud[]>([]);
  filtro = signal<Filtro>('todas');

  // derivado
  filtradas = computed(() => {
    const f = this.filtro();
    const data = this.solicitudes() ?? [];
    if (f === 'todas') return data;
    return data.filter((s) => s.estado === f);
  });

  ngOnInit(): void {
    // Si no hay token, manda a login y regresa acá
    if (!this.authService.isAuth()) {
      this.router.navigate(['/login'], { queryParams: { redirect: '/mis-solicitudes' } });
      return;
    }
    this.cargar();
  }

  cargar() {
    this.isLoading.set(true);
    this.error.set(null);
    this.solicitudService.misSolicitudes().subscribe({
      next: (resp) => {
        this.solicitudes.set(resp.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus solicitudes');
        this.isLoading.set(false);
      },
    });
  }

  setFiltro(f: Filtro) {
    this.filtro.set(f);
  }

  badgeClass(estado: Estado) {
    const common =
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1';
    switch (estado) {
      case 'pendiente':
        return `${common} bg-yellow-900/40 text-yellow-200 ring-yellow-500/30`;
      case 'aprobada':
        return `${common} bg-blue-900/40 text-blue-200 ring-blue-500/30`;
      case 'entregada':
        return `${common} bg-emerald-900/40 text-emerald-200 ring-emerald-500/30`;
      case 'rechazada':
        return `${common} bg-red-900/40 text-red-200 ring-red-500/30`;
      case 'cancelada':
        return `${common} bg-slate-900/40 text-slate-200 ring-slate-500/30`;
    }
  }

  libroId(s: Solicitud) {
    const anyLibro: any = s.libro;
    return typeof anyLibro === 'string' ? anyLibro : anyLibro?._id;
  }

  format(d?: string) {
    return d ? new Date(d).toLocaleString() : '';
  }

  verLibro(s: Solicitud) {
    const id = this.libroId(s);
    if (id) this.router.navigate(['/libros', id]);
  }

  refrescar() {
    this.cargar();
  }

  // … dentro de MisSolicitudesComponent

libroTitulo(s: Solicitud): string {
  const lb: any = s.libro;
  return lb && typeof lb === 'object' ? (lb.titulo ?? '—') : '—';
}

libroAutor(s: Solicitud): string {
  const lb: any = s.libro;
  return lb && typeof lb === 'object' ? (lb.autor ?? '—') : '—';
}

navegar() {
  this.router.navigate(['/lists']);
}

}
