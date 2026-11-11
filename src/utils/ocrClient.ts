import { computeBufferSha256Hex } from '../infrastructure/crypto/sha256';

export interface MultimodalOcrExtractResponse {
  extracted_doc_no: string;
  extracted_doc_title: string;
  extracted_doc_type: string;
  extracted_field: string;
  extracted_issue_date: string;
  extracted_effective_date: string;
  extracted_authority: string;
  extracted_signer: string;
  total_investment_amount: string;
  capital_source: string;
  has_variation_overrun: boolean;
  has_approved_addendum: boolean;
  cited_legal_bases: string[];
  ocr_full_text: string;
  ocr_confidence_note: string;
}

export async function computeFileSha256Short(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hex = await computeBufferSha256Hex(buffer);
  return `sha256:${hex}`;
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Không thể đọc dữ liệu nhị phân của tệp.'));
    reader.readAsDataURL(file);
  });
}

export async function extractDocumentViaGeminiMultimodal(params: {
  file: File;
  stepCode?: string;
  stepName?: string;
  expectedAuthority?: string;
  mode: 'stage_gate_dossier' | 'vbpl_document' | 'contract_redline';
}): Promise<{
  sha256Hash: string;
  ocrResult: MultimodalOcrExtractResponse;
}> {
  const { file, stepCode, stepName, expectedAuthority, mode } = params;
  const sha256Hash = await computeFileSha256Short(file);

  const isTextLike = /\.(txt|md|html?)$/i.test(file.name);
  let rawText = '';
  let base64Data = '';

  if (isTextLike) {
    rawText = await file.text();
    if (/\.html?$/i.test(file.name)) {
      const parsed = new DOMParser().parseFromString(rawText, 'text/html');
      parsed
        .querySelectorAll('script,style,iframe,object,svg')
        .forEach((n) => n.remove());
      parsed.querySelectorAll('br').forEach((n) => n.replaceWith('\n'));
      parsed
        .querySelectorAll('p,div,h1,h2,h3,h4,li,tr,section')
        .forEach((n) => n.append('\n'));
      rawText = parsed.body.textContent || '';
    }
  } else {
    base64Data = await readFileAsBase64(file);
  }

  let mimeType = file.type;
  if (!mimeType) {
    if (/\.pdf$/i.test(file.name)) mimeType = 'application/pdf';
    else if (/\.docx$/i.test(file.name))
      mimeType =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (/\.png$/i.test(file.name)) mimeType = 'image/png';
    else if (/\.jpe?g$/i.test(file.name)) mimeType = 'image/jpeg';
    else if (/\.webp$/i.test(file.name)) mimeType = 'image/webp';
    else mimeType = 'text/plain';
  }

  const response = await fetch('/api/ocr-dossier-extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      mimeType,
      base64Data,
      rawText,
      stepCode,
      stepName,
      expectedAuthority,
      mode,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ocrResult) {
    throw new Error(
      data.error || 'Không thể bóc tách OCR từ tệp đính kèm qua Gemini Multimodal.'
    );
  }

  return {
    sha256Hash,
    ocrResult: data.ocrResult as MultimodalOcrExtractResponse,
  };
}
