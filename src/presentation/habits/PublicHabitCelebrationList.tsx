import { Heading } from "~/presentation/design_system/typography/Heading";
import type { PublicHabitCelebration } from "~/use_cases/habits/ports/HabitChallengeRepository";
import type { CommunitySectionVariant } from "./communitySectionVariant";
import PublicHabitCelebrationCard from "./PublicHabitCelebrationCard";

export type PublicHabitCelebrationListProps = {
  title: string;
  celebrations: PublicHabitCelebration[];
  viewerSignedIn: boolean;
  reactionAction?: (formData: FormData) => Promise<void>;
  variant?: CommunitySectionVariant;
};

export default function PublicHabitCelebrationList({
  title,
  celebrations,
  viewerSignedIn,
  reactionAction,
  variant = "full",
}: PublicHabitCelebrationListProps): React.ReactNode {
  if (celebrations.length === 0) return null;

  const compact = variant === "compact";

  return (
    <section
      aria-labelledby="community-celebrations-title"
      className="@container"
    >
      <Heading
        level={2}
        size={compact ? "xs" : "md"}
        tone="inherit"
        id="community-celebrations-title"
        className="text-text-strong"
      >
        {title}
      </Heading>
      {/* Cuántas tarjetas por fila lo decide el ancho de la sección, no el de la ventana: la misma
          lista ocupa la página entera en pilares y media columna en el home. `compact` reparte en
          dos en cuanto hay 384 px —es su motivo de existir, dos tarjetas cuadradas en una fila—;
          `full` espera a los 768 px que piden las tarjetas grandes. */}
      <div
        className={`grid ${
          compact ? "mt-3 gap-4 @sm:grid-cols-2" : "mt-6 gap-4 @3xl:grid-cols-2"
        }`}
      >
        {celebrations.map((celebration) => (
          <PublicHabitCelebrationCard
            key={celebration.id}
            celebration={celebration}
            headingLevel={3}
            viewerSignedIn={viewerSignedIn}
            reactionAction={reactionAction}
            variant={variant}
          />
        ))}
      </div>
    </section>
  );
}
