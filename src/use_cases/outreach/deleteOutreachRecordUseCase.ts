/** Lo que se puede borrar de la difusión: un texto, un grupo o un pie. */
export interface DeletableOutreachRecords {
  delete(id: string): Promise<boolean>;
}

export type DeleteOutreachRecordResult =
  | { status: "deleted" }
  | { status: "not-found" };

/**
 * Borra un texto, un grupo o un pie. Lo que se va con cada uno lo decide la base —las cascadas de
 * las migraciones `0060` a `0062`—, y la pantalla lo dice antes de confirmar: aquí solo se borra.
 * Quién puede hacerlo lo decide `src/app/` con `isAdmin`.
 *
 * Es uno solo para los tres porque la regla es la misma; separarlos sería copiar tres veces estas
 * líneas para que difieran en el nombre.
 */
export default class DeleteOutreachRecordUseCase {
  constructor(private readonly records: DeletableOutreachRecords) {}

  async execute(id: string): Promise<DeleteOutreachRecordResult> {
    return (await this.records.delete(id))
      ? { status: "deleted" }
      : { status: "not-found" };
  }
}
