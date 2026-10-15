"use client";

import { useRef } from "react";
import type { EventSummary } from "./EventItem";
import { NewEventForm } from "./NewEventForm";

/** Przycisk „Nowa rozgrywka” otwierający formularz w oknie modalnym (Esc lub „Anuluj” zamyka). */
export function NewEventDialog({ events }: { events: EventSummary[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" className="primary" onClick={open}>+ Nowa rozgrywka</button>
      <dialog ref={dialogRef} className="ad-dialog" aria-label="Nowa rozgrywka">
        <NewEventForm events={events} onCancel={close} />
      </dialog>
    </>
  );
}
