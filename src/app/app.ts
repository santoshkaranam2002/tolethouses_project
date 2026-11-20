import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toasts } from './core/ui/toast';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, Toasts],
  template: `<router-outlet /><ec-toasts />`
})
export class App {}
