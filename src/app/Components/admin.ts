import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [RouterModule],
  templateUrl: '../html/admin.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../css/admin.css']
})
export class AdminComponent {
}