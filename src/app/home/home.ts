import { Component, OnInit } from '@angular/core';
import { PersonnageService } from '../personnage/personnageService';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';

@Component({
  standalone: true, 
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [
    RouterModule,
    CommonModule
  ]
})
export class HomeComponent implements OnInit {

  constructor(private personnageService: PersonnageService) { }

  ngOnInit(): void {
  }}