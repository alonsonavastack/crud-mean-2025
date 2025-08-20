import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { LibroService } from '../../services/libro.service';
import { Libro, LibroResponse } from '../../interfaces/libro.interface';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lista.component.html',
})
export class ListaComponent {
  private router = inject(Router);
  libroService = inject(LibroService);

  // Signals para el estado de la UI
  mostrarFormulario = signal(false);
  guardando = signal(false);
  eliminando = signal<string | null>(null);
  errorCreacion = signal<string | null>(null);

  // Objeto para el formulario, es más simple que una signal para [(ngModel)]
  nuevoLibro: Libro = {
    titulo: '',
    autor: '',
    apublicacion: '',
    editorial: '',
    categoria: '',
    sede: '',
    // Estas propiedades ahora forman parte del objeto del formulario,
    // aunque no se muestren ni se envíen con un valor real.
    _id: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };

  // Computed signals para el estado del httpResource
  libros = computed(() => {
    const response = this.libroService.librosResource.value();
    // El backend devuelve { ok: true, libros: [...] }
    return response?.libros || [];
  });

  isLoadingLibros = computed(() => {
    return this.libroService.librosResource.isLoading();
  });

  hasErrorLibros = computed(() => {
    return !!this.libroService.librosResource.error();
  });

  guardarLibro() {
    if (this.guardando()) return;

    this.guardando.set(true);
    this.errorCreacion.set(null); // Limpiamos el error anterior

    this.libroService.crearLibro(this.nuevoLibro).subscribe({
      next: (response: any) => {
        if (response.ok) { // Estandarizar a 'ok' según el backend
          this.cancelarFormulario();
          this.libroService.refetchLibros();
        }
      },
      error: (err: HttpErrorResponse) => {
        // El backend ya envía un mensaje de error claro.
        if (err.error && err.error.msg) {
          this.errorCreacion.set(err.error.msg);
        } else {
          // Error genérico por si el backend no responde como se espera
          this.errorCreacion.set('Ocurrió un error inesperado al guardar el libro.');
          console.error('Error al crear libro:', err);
        }
        this.guardando.set(false);
      },
      complete: () => {
        this.guardando.set(false);
      }
    });
  }

  cancelarFormulario() {
    this.mostrarFormulario.set(false);
    this.errorCreacion.set(null);
    // Reseteamos el objeto del formulario
    this.nuevoLibro = {
      titulo: '',
      autor: '',
      apublicacion: '',
      editorial: '',
      categoria: '',
      sede: '',
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
  }

  verDetalle(id: string) {
    this.router.navigate(['/lists', id]);
  }

  eliminarLibro(id: string) {
    if (this.eliminando()) return;

    const libroAEliminar = this.libros().find(l => l._id === id);
    const titulo = libroAEliminar ? `<strong>"${libroAEliminar.titulo}"</strong>` : 'este libro';

    Swal.fire({
      title: '¿Estás seguro?',
      html: `Esta acción no se puede revertir. Se eliminará ${titulo}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '¡Sí, elimínalo!',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e', // Tailwind red-600
      cancelButtonColor: '#718096',  // Tailwind gray-500
      background: '#2d3748', // Tailwind gray-800
      color: '#f6e05e' // Tailwind yellow-400
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminando.set(id);
        this.libroService.eliminarLibro(id).subscribe({
          next: (response: any) => {
            if (response.ok) {
              this.libroService.refetchLibros();
              Swal.fire({
                title: '¡Eliminado!',
                text: response.msg || 'El libro ha sido eliminado.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#2d3748',
                color: '#f6e05e'
              });
            } else {
              Swal.fire('Error', response.msg || 'No se pudo eliminar el libro.', 'error');
            }
          },
          error: (error) => {
            console.error('Error al eliminar libro:', error);
            Swal.fire('Error', 'Ocurrió un error al intentar eliminar el libro.', 'error');
            this.eliminando.set(null);
          },
          complete: () => {
            this.eliminando.set(null);
          }
        });
      }
    });
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
