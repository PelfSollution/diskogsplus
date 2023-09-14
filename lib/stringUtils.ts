// utils/stringUtils.ts

function cleanString(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

function convertToLowercase(input: string): string {
    return input.toLowerCase();
}

export function removeAllSubstringsInParenthesis(input: string): string {
    return input.replace(/\(.*?\)/g, '').trim();
  }
  

 function removeSpecialCharacters(input: string): string {
  return input.replace(/[^\w\s]/gi, '');
}

export function sanitizeFileName(input: string): string {
  // Reemplaza espacios con guiones bajos y elimina caracteres no alfanuméricos excepto guiones bajos y puntos.
  return input.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
}


  
function removeStopWords(input: string, stopWords: string[]): string {
    const words = input.split(' ');
    return words.filter(word => !stopWords.includes(word)).join(' ');
  }
  
  
  function removeDiacritics(input: string): string {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  
  
  export function cleanInput(input: string, stopWords: string[] = []): string {
    let cleanedInput = cleanString(input);
    cleanedInput = removeAllSubstringsInParenthesis(cleanedInput);
    cleanedInput = removeSpecialCharacters(cleanedInput);
    cleanedInput = removeStopWords(cleanedInput, stopWords);
    cleanedInput = removeDiacritics(cleanedInput);
    return cleanedInput.toLowerCase();
  }
  