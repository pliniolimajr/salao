import { ReactNode, useEffect, useRef } from 'react';

interface ModalSurfaceProps {
  children: ReactNode;
  label: string;
  onClose: () => void;
}

/** Native modal semantics provide focus containment and an inert background. */
export function ModalSurface({ children, label, onClose }: ModalSurfaceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected && trigger.getClientRects().length) trigger.focus({ preventScroll: true });
      else {
        const menu = document.querySelector<HTMLElement>('.pt-menu');
        if (menu?.getClientRects().length) menu.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="studio-modal" aria-label={label}
      onCancel={event => { event.preventDefault(); closeRef.current(); }}>
      {children}
    </dialog>
  );
}
