"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { Link } from "~/i18n/navigation";
import type { ActionState } from "~/infra/types/Actions";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import PostMediaField from "~/presentation/media/PostMediaField/PostMediaField";

export type PracticeEvidenceActionState = ActionState & {
  message?: string | null;
};

export default function PracticeEvidenceForm({
  practice,
  pillarLabel,
  action,
}: {
  practice: PracticeCard;
  pillarLabel: string;
  action: (
    state: PracticeEvidenceActionState,
    data: FormData,
  ) => Promise<PracticeEvidenceActionState>;
}): React.ReactNode {
  const t = useTranslations("practicesIndex");
  const tCommon = useTranslations("common");
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean | null>(null);
  const [state, formAction, isPending] = useActionState(action, {
    errors: {},
    success: false,
    id: null,
    slug: null,
    message: null,
  });

  return (
    <details
      data-testid="practice-evidence"
      className="mt-4 rounded-control border border-separator bg-surface/80 p-3"
    >
      <summary className="focus-ring cursor-pointer rounded-chip text-caption font-semibold text-text-strong">
        {t("evidenceOpen")}
      </summary>

      <ValidatedForm
        action={formAction}
        showRequiredLegend={false}
        aria-label={t("evidenceFormLabel", { practice: practice.title })}
        className="mt-3"
        data-testid="practice-evidence-form"
      >
        <input type="hidden" name="practiceKey" value={practice.key} />
        <div className="rounded-control bg-surface-elevation-1 p-3">
          <p className="text-caption font-semibold text-text-strong">
            {practice.title}
          </p>
          <p className="text-caption text-text-muted">{pillarLabel}</p>
          <p className="mt-2 text-caption text-body">{practice.summary}</p>
        </div>

        {state.errors?.errorMessage ? (
          <Alert tone="error" label={tCommon("alertError")} className="mt-3">
            {state.errors.errorMessage}
          </Alert>
        ) : null}

        {state.success && state.slug ? (
          <Alert tone="success" label={tCommon("alertSaved")} className="mt-3">
            {state.message ?? t("evidencePublished")}{" "}
            <Link
              href={{ pathname: "/[slug]", params: { slug: state.slug } }}
              data-testid="practice-evidence-link"
              className="font-semibold underline"
            >
              {t("evidenceViewPost")}
            </Link>
          </Alert>
        ) : null}

        <PostMediaField
          name="media"
          label={t("evidenceMediaLabel")}
          addMoreLabel={t("evidenceMediaAddMore")}
          error={state.errors?.media}
          onLoadingChange={setIsLoadingMedia}
          className="mt-3"
        />

        <TextArea
          name="note"
          label={t("evidenceNoteLabel")}
          hint={t("evidenceNoteHint")}
          rows={3}
          maxLength={280}
          error={state.errors?.content}
          containerClassName="mt-0"
        />

        <Button
          type="submit"
          color="green"
          size="sm"
          isLoading={isPending || isLoadingMedia === true}
          disabled={isPending || isLoadingMedia === true}
          loadingLabel={t("evidenceSubmitting")}
          className="mt-3"
          data-testid="practice-evidence-submit"
        >
          {t("evidenceSubmit")}
        </Button>
      </ValidatedForm>
    </details>
  );
}
