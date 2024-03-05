import { Dispatch, SetStateAction, useEffect, useState } from "react";

const defaultNamespace = "tts-generation-webui__";

const readLocalStorage = (key: string) => {
  const prefixedKey = defaultNamespace + key;
  const item = localStorage.getItem(prefixedKey);
  return item ? (JSON.parse(item) as any) : undefined;
};

const updateLocalStorage = (key: string, value: any) => {
  const prefixedKey = defaultNamespace + key;
  localStorage.setItem(prefixedKey, JSON.stringify(value));
};

export const updateLocalStorageWithFunction = (key: string, value: any) =>
  updateLocalStorage(
    key,
    value instanceof Function ? value(readLocalStorage(key)) : value
  );

export default function useLocalStorage<T>(
  key: string,
  initialValue: T,
  namespace = defaultNamespace
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
    // const valueToStore = value instanceof Function ? value(storedValue) : value;

    // // update local storage
    // setLocalValue(valueToStore);
    // // Save state
    // setStoredValue(valueToStore);
    setStoredValue(x => {
      const newValue = value instanceof Function ? value(x) : value;
      setLocalValue(newValue);
      return newValue;
    });
  };

  // watch localStorage changes
  // useEffect(() => {
  //   const onStorageChange = (e: StorageEvent) => {
  //     console.log("onStorageChange", e);
  //     if (e.key === prefixedKey) {
  //       setStoredValue(JSON.parse(e.newValue || "null"));
  //     }
  //   };

  //   window.addEventListener("storage", onStorageChange);

  //   return () => {
  //     window.removeEventListener("storage", onStorageChange);
  //   };
  // }, [prefixedKey]);

  // Return the original useState functions
  // return [storedValue, setStoredValue];
  return [storedValue, setValue];
}
