import Link from "next/link";
import { headers } from "next/headers";

export default async function NotFound() {
  const headersList = headers();
  const mappedHeaders = Array.from(headersList);

  return (
    <div>
      <h2>Not Found</h2>
      <p>No se pudo encontrar el recurso solicitado</p>
      <ul>
        {mappedHeaders.map((item) => {
          return (
            <li key={item[0]}>
              {item[0]}: {item[1]}
            </li>
          );
        })}
      </ul>
      <p>
        View <Link href="/">Ir al inicio</Link>
      </p>
    </div>
  );
}
