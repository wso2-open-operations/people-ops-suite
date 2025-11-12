// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

export const isIncludedRole = (a: string[], b: string[]): boolean => {
  return [...getCrossItems(a, b), ...getCrossItems(b, a)].length > 0;
};

function getCrossItems<Role>(a: Role[], b: Role[]): Role[] {
  return a.filter((element) => {
    return b.includes(element);
  });
}

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const fileToByteArray = (file: File): Promise<number[]> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const byteArray = Array.from(new Uint8Array(arrayBuffer));
      resolve(byteArray);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

/**
 * Utility functions for handling byte arrays from backend
 */

/**
 * Convert byte array to Base64 string
 */
export const byteArrayToBase64 = (byteArray: number[]): string => {
  if (!byteArray || byteArray.length === 0) return '';
  
  const binary = byteArray.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return btoa(binary);
};

/**
 * Create a data URL from byte array for image display
 * @param byteArray - The byte array from backend
 * @param mimeType - The image mime type (default: image/jpeg)
 */
export const getImageDataUrl = (
  byteArray: number[] | undefined, 
  mimeType: string = 'image/jpeg'
): string => {
  if (!byteArray || byteArray.length === 0) return '';
  
  const base64 = byteArrayToBase64(byteArray);
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Download a PDF from byte array
 * @param byteArray - The byte array from backend
 * @param fileName - The name for the downloaded file
 */
export const downloadPdfFromByteArray = (
  byteArray: number[], 
  fileName: string = 'document.pdf'
): void => {
  if (!byteArray || byteArray.length === 0) {
    console.error('No PDF data available');
    return;
  }
  
  const uint8Array = new Uint8Array(byteArray);
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Open PDF in new browser tab from byte array
 * @param byteArray - The byte array from backend
 */
export const viewPdfInNewTab = (byteArray: number[] | undefined): void => {
  if (!byteArray || byteArray.length === 0) {
    console.error('No PDF data available');
    return;
  }
  
  const uint8Array = new Uint8Array(byteArray);
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
};

/**
 * Get a blob URL for displaying PDF in iframe
 * Remember to revoke the URL when component unmounts!
 * @param byteArray - The byte array from backend
 */
export const getPdfBlobUrl = (byteArray: number[] | undefined): string => {
  if (!byteArray || byteArray.length === 0) return '';
  
  const uint8Array = new Uint8Array(byteArray);
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  return window.URL.createObjectURL(blob);
};

/**
 * Check if byte array is valid and not empty
 */
export const isValidByteArray = (byteArray: any): byteArray is number[] => {
  return Array.isArray(byteArray) && byteArray.length > 0;
};
