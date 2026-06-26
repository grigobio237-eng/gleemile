// 전역 모달 상태 관리
class ModalState {
  private static instance: ModalState;
  private openModals: Set<string> = new Set();

  static getInstance(): ModalState {
    if (!ModalState.instance) {
      ModalState.instance = new ModalState();
    }
    return ModalState.instance;
  }

  isModalOpen(modalId: string): boolean {
    return this.openModals.has(modalId);
  }

  openModal(modalId: string): boolean {
    if (this.openModals.has(modalId)) {
      return false; // 이미 열려있음
    }
    this.openModals.add(modalId);
    return true;
  }

  closeModal(modalId: string): void {
    this.openModals.delete(modalId);
  }

  closeAllModals(): void {
    this.openModals.clear();
  }
}

export const modalState = ModalState.getInstance();
export const MEMBERSHIP_MODAL_ID = 'membership-info-modal';









