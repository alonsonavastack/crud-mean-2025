import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { catchError, throwError, map } from 'rxjs';
import { Libro, LibroResponse } from '../interfaces/libro.interface';

@Injectable({
  providedIn: 'root',
})
export class LibroService {
  http = inject(HttpClient);
  base_url = environment.url;

  // URLs de endpoints
  private dataUrl = `${this.base_url}lists`;

  crearLibro(data: Libro) {
    console.log('Creando libro:', data);
    return this.http.post<LibroResponse>(this.dataUrl, data);
  }

  // HTTP Resource para obtener todos los libros
  librosResource = httpResource<LibroResponse>(() => this.dataUrl, {
    defaultValue: { libros: [], success: true },
  });

  // ---- DETALLE (GET) con httpResource ----
  libroDetalleResource = (id: () => string) =>
    httpResource<LibroResponse>(() => {
      const _id = id();
      return _id ? `${this.dataUrl}/${_id}` : undefined;
    });

  actualizarLibro(id: string, data: Partial<Libro>) {
    return this.http.put<LibroResponse>(`${this.dataUrl}/${id}`, data);
  }

  eliminarLibro(id: string) {
    return this.http.delete<LibroResponse>(`${this.dataUrl}/${id}`);
  }

  // Recargar la lista de libros
  refetchLibros() {
    this.librosResource.reload();
  }
}
