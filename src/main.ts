import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/Components/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
