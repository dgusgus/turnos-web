// Retrasa una función hasta que pasen `ms` sin nuevas llamadas
// (ej. buscar mientras el usuario escribe, sin una petición por tecla).
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
