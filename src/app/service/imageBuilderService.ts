import { Injectable } from '@angular/core';
import { IP_ADDRESS } from '../constante';

@Injectable({
  providedIn: 'root'
})
export class ImageBuilderService {
  private readonly baseUrl = "http://" + IP_ADDRESS;

  constructor() { }

  /**
   * Construit l'URL complète d'une image
   * @param folder Le sous-dossier (ex: 'avatars', 'products')
   * @param fileName Le nom du fichier (ex: 'photo-1')
   * @param extension L'extension (par défaut 'jpg')
   */
  generateImageUrl(url_fin: string): string {
    return `${this.baseUrl}${url_fin}`;
  }
}