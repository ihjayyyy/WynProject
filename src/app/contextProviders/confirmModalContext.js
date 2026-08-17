"use client";

import React, { createContext, useState, useContext, useCallback } from "react";
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';

export const ConfirmModalContext = createContext({});

export const useConfirmModal = () => {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error('useConfirmModal must be used within a ConfirmModalProvider');
  }
  return context;
};

export const ConfirmModalProvider = ({ children }) => {
  const [isConfirmOpen, setConfirmModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setmessage] = useState('');
  const [confirmText, setconfirmText] = useState('');
  const [variant, setVariant] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Original low-level API — kept for backward compatibility with any
  // existing call sites. Positional signature:
  //   show(title, message, confirmText, variant, action)
  // NOTE: confirmText MUST be a plain string — it is rendered directly
  // as a React child inside ConfirmModal's confirm button. Passing an
  // options object here (a common copy/paste mistake with the
  // confirmAndRun(title, message, action, options) pattern used in some
  // forms) will throw React error #31 ("objects are not valid as a
  // React child"). We defensively coerce below, but callers should not
  // rely on that — pass a real string.
  const show = useCallback((title, message, confirmText, variant, action) => {
    setTitle(title);
    setmessage(message);

    // Defensive guard: if a non-string sneaks in (e.g. someone
    // accidentally passed an options object like { successMsg } in
    // this slot), fall back to a safe default instead of crashing.
    setconfirmText(typeof confirmText === 'string' ? confirmText : 'Confirm');

    setVariant(variant);

    // Defensive guard against the "action returns a function instead of
    // running it" mistake (e.g. `() => () => doThing()` instead of
    // `() => doThing()`). We store the action as-is; handleConfirmAction
    // unwraps at most one extra layer below.
    setConfirmAction(() => action);
    setConfirmModal(true);
  }, []);

  // Higher-level convenience API matching the same call shape used by
  // the local confirmAndRun() helpers found in individual forms:
  //   showAction(title, message, action, options?)
  // where options = { confirmText, variant, successMsg, errorMsg,
  // onSuccess, onError }.
  //
  // This exists so new code has one clear, hard-to-misuse signature
  // instead of juggling two different positional orders across the
  // codebase. `action` may be sync or async and may optionally return
  // a result object like `{ error }` — if it does, onError/errorMsg
  // fires on `res.error`, otherwise onSuccess/successMsg fires.
  const showAction = useCallback((title, message, action, options = {}) => {
    const {
      confirmText: optConfirmText = 'Confirm',
      variant: optVariant = 'primary',
    } = options;

    show(title, message, optConfirmText, optVariant, async () => {
      const res = await action();
      if (res && res.error) {
        options.onError && options.onError(res);
      } else {
        options.onSuccess && options.onSuccess(res);
      }
      return res;
    });
  }, [show]);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) {
      reset();
      return;
    }
    // Unwrap at most one extra layer in case a caller passed a
    // double-wrapped function like `() => () => doThing()` instead of
    // `() => doThing()`.
    const result = confirmAction();
    if (typeof result === 'function') {
      await result();
    } else {
      await result;
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmAction]);

  const reset = () => {
    setTitle('');
    setmessage('');
    setconfirmText('');
    setVariant('');
    setConfirmAction(null);
    setConfirmModal(false);
  };

  return (
    <ConfirmModalContext.Provider value={{ show, showAction, reset }}>
      {children}
      <ConfirmModal
        open={isConfirmOpen}
        title={title}
        message={message}
        confirmText={confirmText}
        confirmVariant={variant}
        onConfirm={() => {
          handleConfirmAction();
        }}
        onCancel={() => {
          reset();
        }}
      />
    </ConfirmModalContext.Provider>
  );
};