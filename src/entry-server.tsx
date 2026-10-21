import { renderToString } from 'react-dom/server';
import { Suspense } from 'react';
import { StaticRouter } from 'react-router-dom';
import { PublicRoutes } from './components/layout/PublicRoutes';

export function render(path: string) {
  return renderToString(<StaticRouter location={path}><Suspense fallback={null}><PublicRoutes /></Suspense></StaticRouter>);
}
