import { useState } from 'react';

interface ModalState {
  message: string;
  onConfirm: () => Promise<void>;
}

export function useConfirmModal() {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [confirming, setConfirming] = useState(false);

  function openModal(state: ModalState) {
    setModal(state);
  }

  function closeModal() {
    setModal(null);
  }

  async function runConfirm() {
    if (!modal) return;
    setConfirming(true);
    try {
      await modal.onConfirm();
    } finally {
      setConfirming(false);
      setModal(null);
    }
  }

  return { modal, openModal, closeModal, runConfirm, confirming };
}
