"use client";

import { useTranslations } from "next-intl";
import { MdArrowDownward, MdArrowUpward, MdClose } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextField } from "~/presentation/design_system/forms/TextField";

/** Un producto en el formulario: el título para reconocerlo y lo que se escribirá en la lista. */
export interface OutreachFormItem {
  postId: string;
  title: string;
  label: string;
  emoji: string;
}

interface OutreachItemRowProps {
  item: OutreachFormItem;
  isFirst: boolean;
  isLast: boolean;
  error?: string;
  onChange: (
    changes: Partial<Pick<OutreachFormItem, "label" | "emoji">>,
  ) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}

export default function OutreachItemRow({
  item,
  isFirst,
  isLast,
  error,
  onChange,
  onMove,
  onRemove,
}: OutreachItemRowProps) {
  const t = useTranslations("outreach");
  const name = item.label || item.title;

  return (
    <li
      data-testid="outreach-item"
      data-post-id={item.postId}
      className="rounded-card border border-separator p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-medium">{item.title}</p>
        <div className="flex gap-1">
          <Button
            size="sm"
            iconOnly
            aria-label={t("moveUp", { label: name })}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            <MdArrowUpward aria-hidden />
          </Button>
          <Button
            size="sm"
            iconOnly
            aria-label={t("moveDown", { label: name })}
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            <MdArrowDownward aria-hidden />
          </Button>
          <Button
            size="sm"
            iconOnly
            aria-label={t("removeProduct", { label: name })}
            onClick={onRemove}
          >
            <MdClose aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <TextField
          required
          label={t("itemLabel")}
          value={item.label}
          error={error}
          onChange={(event) => onChange({ label: event.target.value })}
          containerClassName="min-w-48 flex-1"
        />
        {/* Un emoji puede ocupar varias unidades de código (🧀, 👩‍🌾): 16 da margen sin dejar
            escribir una frase en el hueco de un dibujo. */}
        <TextField
          label={t("itemEmoji")}
          value={item.emoji}
          maxLength={16}
          onChange={(event) => onChange({ emoji: event.target.value })}
          containerClassName="w-28"
        />
      </div>
    </li>
  );
}
