import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [CommonModule, RouterModule], // Importez RouterModule pour la navigation
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent {
}