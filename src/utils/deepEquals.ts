export function deepEquals(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true;
  }
  if (isPrimitive(obj1) && isPrimitive(obj2)) {
    return obj1 === obj2;
  }
  let size1 = 0;
  for (let key in obj1) size1++;
  let size2 = 0;
  for (let key in obj2) size2++;
  if (size1 !== size2) {
    return false;
  }
  for (let key in obj1) {
    if (!(key in obj2)) {
      return false;
    }
    if (!deepEquals(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}

function isPrimitive(obj: any) {
  return obj !== Object(obj);
}
