import { Suspense, lazy } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { Status } from './components/Status';
import { Compare } from './pages/Compare';
import { FigureDetail } from './pages/FigureDetail';
import { FigureList } from './pages/FigureList';

// The SHACL form component is large, so it is only downloaded when its page is opened.
const NewFigure = lazy(() => import('./pages/NewFigure'));

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <p className="brand">
            Wooden Figures <abbr title="Knowledge Graph">KG</abbr>
          </p>
          <nav aria-label="Main">
            <NavLink to="/" end>
              Figures
            </NavLink>
            <NavLink to="/compare">Compare models</NavLink>
            <NavLink to="/new">SHACL form</NavLink>
          </nav>
        </div>
      </header>

      <main id="main" className="container" tabIndex={-1}>
        <Suspense fallback={<Status loading />}>
          <Routes>
            <Route path="/" element={<FigureList />} />
            <Route path="/figures/:inventoryNumber" element={<FigureDetail />} />
            <Route path="/compare/:questionId?" element={<Compare />} />
            <Route path="/new" element={<NewFigure />} />
            <Route path="*" element={<h1>Page not found</h1>} />
          </Routes>
        </Suspense>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            <strong>All data is fictional.</strong> The figures, inventory numbers, owners and the museum are
            invented for a portfolio project. Nothing here describes a real museum object.
          </p>
          <p>Relational model: SQLite and TypeORM. Knowledge graph: CIDOC-CRM 7.1.3 in Oxigraph.</p>
        </div>
      </footer>
    </>
  );
}
