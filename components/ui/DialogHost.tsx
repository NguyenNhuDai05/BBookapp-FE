import React, { useSyncExternalStore } from 'react';
import { Keyboard } from 'react-native';
import { AppModal, type ModalAction } from './AppModal';
import { AppAlert, dialogStore, type DialogButton } from './dialogStore';

export function DialogHost() {
  const request = useSyncExternalStore(dialogStore.subscribe, dialogStore.getSnapshot, dialogStore.getSnapshot);
  if (!request) return null;
  const dismiss = () => { dialogStore.dismiss(request.id); };
  const action = (button: DialogButton): ModalAction => ({ label: button.text || 'Đã hiểu', destructive: button.style === 'destructive',
    onPress: async () => { await button.onPress?.(); dismiss(); } });
  const cancel = request.buttons.find(button => button.style === 'cancel');
  const remaining = request.buttons.filter(button => button !== cancel);
  const primary = remaining[remaining.length - 1];
  const close = () => {
    if (!request.cancelable) return;
    dismiss();
    // Back/backdrop invokes only the cancel action; never accept a destructive action.
    void Promise.resolve().then(() => cancel?.onPress?.()).then(() => request.onDismiss?.()).catch(AppAlert.error);
  };
  return <AppModal key={request.id} visible title={request.title} description={request.message} variant={request.variant}
    onShow={() => Keyboard.dismiss()} primaryAction={primary ? action(primary) : undefined} secondaryAction={cancel ? action(cancel) : undefined}
    additionalActions={remaining.slice(0, -1).map(action)} onClose={close} dismissOnBackdrop={request.variant === 'info' || request.variant === 'success'} priority={100}
    onActionError={error => { dismiss(); AppAlert.error(error); }} />;
}
