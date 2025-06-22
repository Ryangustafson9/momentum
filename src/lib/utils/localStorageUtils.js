
export const initializeLocalStorageItem = (key, defaultValue) => {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
  }
};

export const isValidUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

export const loadFromLocalStorage = (key) => {
  const item = localStorage.getItem(key);
  try {
    return item ? JSON.parse(item) : null;
  } catch (error) {
    
    return null;
  }
};

export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    
  }
};

export const clearLocalStorage = () => {
  localStorage.clear();
};



