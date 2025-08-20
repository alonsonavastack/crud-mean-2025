import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LibroService } from '../../services/libro.service';
import { Libro } from '../../interfaces/libro.interface';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-libro',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './libro.component.html',
})
export class LibroComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private libroService = inject(LibroService);

  // Signals para el ID y estado
  libroId = signal<string>('');
  editando = signal(false);
  guardando = signal(false);
  eliminando = signal(false);
  errorEdicion = signal<string | null>(null);

  libroEditado = signal<Libro>({
    titulo: '',
    autor: '',
    apublicacion: '',
    editorial: '',
    categoria: '',
    sede: ''
  });

  // HTTP Resource para el libro específico
  libroResource = this.libroService.libroDetalleResource(() => this.libroId());

  // Computed signals para el estado del httpResource
  libro = computed(() => {
    const response = this.libroResource.value();
    return response?.libro || null;
  });

  isLoadingLibro = computed(() => {
    return this.libroResource.isLoading();
  });


  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.libroId.set(id);
    }
  }

  iniciarEdicion() {
    if (this.libro()) {
      this.libroEditado.set({ ...this.libro()! });
      this.errorEdicion.set(null); // Limpiar error anterior
      this.editando.set(true);
    }
  }

  guardarCambios() {
    if (this.guardando() || !this.libro()) return;

    this.guardando.set(true);
    this.errorEdicion.set(null); // Limpiar error anterior

    this.libroService.actualizarLibro(this.libro()!._id!, this.libroEditado()).subscribe({
      next: (response: any) => {
        if (response.ok && response.libro) {
          this.libroResource.reload(); // Recarga los datos del libro actual
          this.editando.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar libro:', err);
        if (err.error && err.error.msg) {
          this.errorEdicion.set(err.error.msg);
        } else {
          this.errorEdicion.set('Ocurrió un error inesperado al actualizar.');
        }
        this.guardando.set(false);
      },
      complete: () => {
        this.guardando.set(false);
      }
    });
  }

  cancelarEdicion() {
    this.editando.set(false);
    this.errorEdicion.set(null); // Limpiar error al cancelar
    if (this.libro()) {
      this.libroEditado.set({ ...this.libro()! });
    }
  }

  eliminarLibro() {
    if (this.eliminando() || !this.libro()) return;

    const titulo = this.libro()!.titulo;

    Swal.fire({
      title: '¿Estás realmente seguro?',
      html: `Esta acción es irreversible. El libro <strong>"${titulo}"</strong> será eliminado permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '¡Sí, estoy seguro!',
      cancelButtonText: 'No, cancelar',
      confirmButtonColor: '#e53e3e', // Tailwind red-600
      cancelButtonColor: '#718096',  // Tailwind gray-500
      background: '#2d3748', // Tailwind gray-800
      color: '#f6e05e' // Tailwind yellow-400
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminando.set(true);
        this.libroService.eliminarLibro(this.libro()!._id!).subscribe({
          next: (response: any) => {
            if (response.ok) {
              // ¡Solución! Forzamos la recarga de la lista de libros en el servicio.
              this.libroService.refetchLibros();

              Swal.fire({
                title: '¡Eliminado!',
                text: response.msg || `El libro "${titulo}" ha sido eliminado.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#2d3748',
                color: '#f6e05e'
              }).then(() => {
                this.router.navigate(['/lists']);
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar libro:', error);
            Swal.fire('Error', 'No se pudo eliminar el libro.', 'error');
            this.eliminando.set(false); // Limpiar en caso de error
          },
          complete: () => {
            // No es necesario aquí porque la navegación ya ocurre
          }
        });
      }
    });
  }

  volver() {
    this.router.navigate(['/lists']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
