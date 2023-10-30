import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function useLocalStorage<T>(
  key: string,
  initialValue: T,
  namespace = "tts-generation-webui__",
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState(initialValue);
  // We will use this flag to trigger the reading from localStorage
  const [firstLoadDone, setFirstLoadDone] = useState(false);

  const prefixedKey = namespace + key;

  // Use an effect hook in order to prevent SSR inconsistencies and errors.
  // This will update the state with the value from the local storage after
  // the first initial value is applied.
  useEffect(() => {
    const fromLocal = () => {
      if (typeof window === "undefined") {
        return initialValue;
      }
      try {
        const item = window.localStorage.getItem(prefixedKey);
        return item ? (JSON.parse(item) as T) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    };

    // Set  the value from localStorage
    setStoredValue(fromLocal);
    // First load is done
    setFirstLoadDone(true);
  }, [initialValue, prefixedKey]);

  function setLocalValue(value: T) {
    if (!firstLoadDone) {
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(prefixedKey, JSON.stringify(value));
      }
    } catch (error) {
      console.log(error);
    }
  }

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    // Allow value to be a function so we have the same API as useState
    const valueToStore = value instanceof Function ? value(storedValue) : value;

    // update local storage
    setLocalValue(valueToStore);
    // Save state
    setStoredValue(valueToStore);
  };

  // Return the original useState functions
  // return [storedValue, setStoredValue];
  return [storedValue, setValue];
}
