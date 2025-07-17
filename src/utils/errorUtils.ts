export function handleError(error: unknown, context: string, userMessage?: string) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`Error in ${context}:`, err);
  if (userMessage) alert(userMessage); // Reemplazar por notificación en el futuro
  return err;
} 