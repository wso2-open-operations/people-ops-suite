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

export const getImageDataUrl = (
  byteArray: number[] | undefined, 
  mimeType: string = 'image/jpeg'
): string => {
  if (!byteArray || byteArray.length === 0) return '';
  
  const binary = byteArray.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
};

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

export const isValidByteArray = (byteArray: any): byteArray is number[] => {
  return Array.isArray(byteArray) && byteArray.length > 0;
};
