import type { CategoryNode } from "~/domain/entities/post/taxonomy";
import { setCategoryActive } from "../actions";

interface CategoryTreeProps {
  /** Todo el catálogo, activas e inactivas: esta pantalla existe para ver también lo apagado. */
  nodes: readonly CategoryNode[];
}

function byCatalogOrder(a: CategoryNode, b: CategoryNode): number {
  return a.sortOrder - b.sortOrder || a.key.localeCompare(b.key);
}

function ToggleButton({ node }: { node: CategoryNode }) {
  return (
    <form action={setCategoryActive} className="inline">
      <input type="hidden" name="key" value={node.key} />
      <input type="hidden" name="isActive" value={String(!node.isActive)} />
      <button
        type="submit"
        data-testid={`toggle-${node.key}`}
        className="text-sm underline text-pw-green hover:text-highlight"
      >
        {node.isActive ? "Desactivar" : "Activar"}
      </button>
    </form>
  );
}

function Row({ node, nested }: { node: CategoryNode; nested?: boolean }) {
  return (
    <li
      data-testid={`category-${node.key}`}
      className={`flex flex-wrap items-center gap-3 py-2 border-b border-separator ${
        nested ? "pl-6" : "font-semibold"
      }`}
    >
      <span className="min-w-[10rem]">{node.labels.es ?? node.key}</span>
      <span className="text-sm text-text-support min-w-[8rem]">
        {node.labels.en ?? "—"}
      </span>
      <code className="text-xs text-text-muted">{node.key}</code>

      <span
        data-testid={`state-${node.key}`}
        className={`text-xs px-2 py-0.5 rounded-full ${
          node.isActive
            ? "bg-pw-green/10 text-pw-green"
            : "bg-surface-elevation-2 text-text-support"
        }`}
      >
        {node.isActive ? "activa" : "inactiva"}
      </span>

      <span className="ml-auto">
        <ToggleButton node={node} />
      </span>
    </li>
  );
}

/**
 * El catálogo tal como está, en el orden en que se pinta en el sitio.
 *
 * Se muestran también las inactivas, con su estado: si no se vieran, no habría forma de volver a
 * activarlas desde aquí y haría falta entrar a la base.
 */
export default function CategoryTree({ nodes }: CategoryTreeProps) {
  const roots = nodes
    .filter((node) => node.parentKey === null)
    .sort(byCatalogOrder);

  return (
    <ul className="mb-8">
      {roots.map((root) => (
        <li key={root.key}>
          <ul>
            <Row node={root} />
            {nodes
              .filter((node) => node.parentKey === root.key)
              .sort(byCatalogOrder)
              .map((child) => (
                <Row key={child.key} node={child} nested />
              ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
