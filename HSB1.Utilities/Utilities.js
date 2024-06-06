export default function removeNullProperties(obj) {
    const result = {}; 
  
    for (const key in obj) {
      const value = obj[key];
  
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          const filteredArray = value.map((item) => removeNullProperties(item)).filter((item) => Object.keys(item).length > 0);
  
          if (filteredArray.length > 0) {
            result[key] = filteredArray;
          }
        } else if (typeof value === 'object') {
          const filteredObject = removeNullProperties(value);
  
          if (Object.keys(filteredObject).length > 0) {
            result[key] = filteredObject;
          }
        } else {
          result[key] = value;
        }
      }
    }
  
    return result;
  }