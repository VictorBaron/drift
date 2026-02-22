import { useCallback, useEffect, useRef, useState } from 'react';

export function useFocusTimer() {
  const [focusActive, setFocusActive] = useState(false);
  const [focusMinutesLeft, setFocusMinutesLeft] = useState(0);
  const [digestMinutesLeft, setDigestMinutesLeft] = useState(12);

  const focusActiveRef = useRef(false);
  const focusMinutesLeftRef = useRef(0);
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function syncFocusActive(val: boolean) {
    focusActiveRef.current = val;
    setFocusActive(val);
  }

  function syncFocusMinutesLeft(val: number) {
    focusMinutesLeftRef.current = val;
    setFocusMinutesLeft(val);
  }

  function startFocusInterval() {
    if (focusIntervalRef.current !== null) clearInterval(focusIntervalRef.current);
    focusIntervalRef.current = setInterval(() => {
      const next = Math.max(0, focusMinutesLeftRef.current - 1);
      syncFocusMinutesLeft(next);
      if (next === 0) {
        syncFocusActive(false);
        clearInterval(focusIntervalRef.current!);
        focusIntervalRef.current = null;
      }
    }, 60000);
  }

  useEffect(() => {
    const id = setInterval(() => {
      setDigestMinutesLeft((prev) => Math.max(0, prev - 1));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const startFocus = useCallback((minutes: number) => {
    syncFocusActive(true);
    syncFocusMinutesLeft(minutes);
    startFocusInterval();
    window.shouldertap?.setFocus(minutes);
  }, []);

  const toggleFocus = useCallback(() => {
    if (focusActiveRef.current) {
      if (focusIntervalRef.current !== null) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
      syncFocusActive(false);
    } else if (focusMinutesLeftRef.current > 0) {
      syncFocusActive(true);
      startFocusInterval();
    }
  }, []);

  return { focusActive, focusMinutesLeft, digestMinutesLeft, startFocus, toggleFocus };
}
