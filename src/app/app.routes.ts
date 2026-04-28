import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.page').then(m => m.HomePage),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.page').then(m => m.CategoriesPage),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./pages/stats/stats.page').then(m => m.StatsPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
