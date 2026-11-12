import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Ẩn header X-Powered-By (REM-P1-01)
  app.disable('x-powered-by');
  app.use(express.json({ limit: '15mb' }));

  // In-memory Rate Limiter cho toàn bộ /api/* (Tối đa 60 requests / phút / IP — REM-P1-01)
  const ipRateMap = new Map<string, { count: number; windowStart: number }>();
  app.use('/api', (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'local';
    const now = Date.now();
    const record = ipRateMap.get(ip);
    if (!record || now - record.windowStart > 60_000) {
      ipRateMap.set(ip, { count: 1, windowStart: now });
      return next();
    }
    record.count += 1;
    if (record.count > 60) {
      return res.status(429).json({
        error: 'Quá giới hạn tần suất gọi API (Rate Limit 60 yêu cầu/phút). Vui lòng thử lại sau.',
      });
    }
    return next();
  });

  const sanitizeServerError = (error: unknown, fallbackMsg: string): string => {
    if (error instanceof Error) {
      console.error('[SERVER_ERROR]:', error.message);
    }
    return fallbackMsg;
  };

  const hasValidDocumentMagicBytes = (base64Str: string): boolean => {
    try {
      const buf = Buffer.from(base64Str.slice(0, 64), 'base64');
      if (buf.length < 4) return false;
      // PDF: %PDF (0x25 0x50 0x44 0x46)
      if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return true;
      // PNG: 0x89 0x50 0x4E 0x47
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
      // JPEG: 0xFF 0xD8 0xFF
      if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
      // WEBP: RIFF....WEBP
      if (
        buf.length >= 12 &&
        buf[0] === 0x52 &&
        buf[1] === 0x49 &&
        buf[2] === 0x46 &&
        buf[3] === 0x46 &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50
      ) {
        return true;
      }
      // DOCX / ZIP: PK\x03\x04 (0x50 0x4B 0x03 0x04)
      if (buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return true;
      return false;
    } catch {
      return false;
    }
  };

  const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const getAiClient = () => {
    const rawKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!rawKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey: rawKey,
    });
  };

  // 1. Endpoint Kiểm toán Pháp chế SSoT (MCP Engine)
  app.post('/api/legal-audit', async (req, res) => {
    try {
      const {
        docNumber,
        docTitle,
        projectStage,
        articleNo,
        articleTitle,
        articleContent,
        crossReferences,
        customQuestion,
      } = req.body || {};

      if (
        typeof docNumber !== 'string' ||
        !docNumber.trim() ||
        typeof articleNo !== 'string' ||
        !articleNo.trim() ||
        typeof articleContent !== 'string' ||
        !articleContent.trim()
      ) {
        return res.status(400).json({
          error:
            'Dữ liệu đầu vào không hợp lệ (HTTP 400): Bắt buộc cung cấp docNumber, articleNo và articleContent.',
        });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Chưa cấu hình dịch vụ phân tích AI trên máy chủ.',
        });
      }

      const xrefText = Array.isArray(crossReferences)
        ? crossReferences
            .map(
              (x: { title?: string; description?: string; relation_type?: string }) =>
                `- [${x.relation_type}] ${x.title}: ${x.description}`
            )
            .join('\n')
        : '';

      const prompt = `Bạn là Trợ lý AI Pháp chế & Kiểm toán (MCP Engine) của Hệ sinh thái Pháp lý ĐẠI SƠN phục vụ Hội đồng Quản trị và Ban Quản lý Dự án (QLDA).
Hãy phân tích ngắn gọn, sắc bén (tối đa 160 từ) rủi ro pháp lý, lưu ý kiểm toán – quyết toán vốn và hồ sơ bắt buộc cần chuẩn bị đối với điều khoản sau:

- Văn bản: ${docNumber} — ${docTitle} (Giai đoạn WBS: ${projectStage})
- Điều khoản: ${articleNo}. ${articleTitle}
- Nội dung: "${articleContent}"
- Các quy định đối soát chéo liên ngành:
${xrefText || 'Không có dẫn chiếu đi kèm'}
${customQuestion ? `\nCâu hỏi cụ thể: "${customQuestion}"` : ''}

Trả lời thành 3 ý gạch đầu dòng rõ ràng:
1. Gợi ý kiểm toán & Hồ sơ bắt buộc
2. Rủi ro xuất toán / Xử phạt cần tránh
3. Hành động khuyến nghị cho Ban QLDA / Chủ đầu tư`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      return res.json({
        analysis: response.text || 'Đã hoàn tất đối soát pháp lý.',
      });
    } catch (error: unknown) {
      return res.status(500).json({
        error: sanitizeServerError(error, 'Lỗi kết nối dịch vụ phân tích pháp chế.'),
      });
    }
  });

  // 2. Endpoint Trợ lý Pháp lý AQUA (Hỏi đáp nhanh điều khoản + Tùy chọn Tra cứu Web)
  app.post('/api/aqua-chat', async (req, res) => {
    try {
      const { question, attachedClause, useWebSearch, corpusContext } = req.body || {};
      if (
        (typeof question !== 'string' || !question.trim()) &&
        (typeof attachedClause !== 'string' || !attachedClause.trim())
      ) {
        return res.status(400).json({
          error:
            'Dữ liệu đầu vào không hợp lệ (HTTP 400): Bắt buộc cung cấp câu hỏi (question) hoặc điều khoản đính kèm (attachedClause).',
        });
      }
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Chưa cấu hình dịch vụ phân tích AI trên máy chủ.',
        });
      }

      const prompt = `Bạn là Trợ lý AQUA thuộc Hệ sinh thái Pháp lý ĐẠI SƠN ("Tri thức pháp luật, dẫn lối tương lai").
Hãy trả lời câu hỏi pháp lý sau dựa trên kho dữ liệu văn bản quy phạm pháp luật đã cung cấp:

Câu hỏi của người dùng: "${question || 'Rà soát quy định pháp lý cho điều khoản này'}"
${attachedClause ? `\nĐiều khoản / Tình huống đính kèm:\n"${attachedClause}"` : ''}
${corpusContext ? `\nDữ liệu văn bản tham chiếu trong hệ thống ĐẠI SƠN:\n${corpusContext}` : ''}

Yêu cầu định dạng câu trả lời rõ ràng, chuyên nghiệp theo đúng cấu trúc của Trợ lý AQUA:
- Mở đầu tóm tắt 1 câu.
- * **Phương thức thực hiện:** ...
- * **Yêu cầu pháp lý bắt buộc:** ...
- * **Quy định cấm/hạn chế & Mức chế tài:** ...
- **Nguồn:** Liệt kê cụ thể Khoản, Điều, Số hiệu văn bản (VD: Khoản 1 Điều 6 NĐ 356/2025/NĐ-CP; Khoản 1 Điều 14 Luật Xây dựng 135/2025/QH15; Điều 43 NĐ 330/2026/NĐ-CP).`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          ...(useWebSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });

      return res.json({
        answer: response.text || 'Trợ lý AQUA đã hoàn tất rà soát điều khoản.',
      });
    } catch (error: unknown) {
      return res.status(500).json({
        error: sanitizeServerError(error, 'Lỗi kết nối Trợ lý AQUA.'),
      });
    }
  });

  // 3. Endpoint Rà soát & Soạn thảo Hợp đồng (Contract Redlining)
  app.post('/api/contract-review', async (req, res) => {
    try {
      const { contractText, contractTitle } = req.body || {};
      if (typeof contractText !== 'string' || contractText.trim().length < 10) {
        return res.status(400).json({
          error:
            'Dữ liệu đầu vào không hợp lệ (HTTP 400): Bắt buộc cung cấp nội dung hợp đồng (contractText tối thiểu 10 ký tự).',
        });
      }
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Chưa cấu hình dịch vụ phân tích AI trên máy chủ.',
        });
      }

      const prompt = `Bạn là Chuyên gia Rà soát Hợp đồng của Hệ sinh thái Pháp lý ĐẠI SƠN.
Hãy rà soát nội dung dự thảo hợp đồng sau đây ("${contractTitle || 'Dự thảo hợp đồng'}") và phát hiện 2 đến 4 điểm rủi ro pháp lý quan trọng nhất (liên quan đến tiến độ thanh toán, nghiệm thu, điều kiện khởi công, bảo vệ dữ liệu cá nhân, giới hạn trách nhiệm, phạt vi phạm):

Nội dung hợp đồng:
"""
${contractText}
"""`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                riskLevel: { type: Type.STRING, description: 'Rất cao, Cao, hoặc Trung bình' },
                clauseLocation: { type: Type.STRING, description: 'VD: Điểm 2 · Điều 4' },
                originalExcerpt: { type: Type.STRING },
                problemAnalysis: { type: Type.STRING },
                legalBasis: { type: Type.STRING },
                editRecommendation: { type: Type.STRING },
                suggestedReplacement: { type: Type.STRING },
              },
              required: [
                'id',
                'riskLevel',
                'clauseLocation',
                'originalExcerpt',
                'problemAnalysis',
                'legalBasis',
                'editRecommendation',
                'suggestedReplacement',
              ],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      return res.json({ issues: parsed });
    } catch (error: unknown) {
      return res.status(500).json({
        error: sanitizeServerError(error, 'Lỗi phân tích hợp đồng.'),
      });
    }
  });

  // 4. Endpoint Multi-Agent Stage-Gate & Risk Audit Engine (AIPM OS x ĐẠI SƠN LEGAL)
  app.post('/api/stage-gate-audit', async (req, res) => {
    try {
      const {
        stepCode,
        gateCode,
        stepName,
        governingBody,
        inspectionBody,
        attachedAuthority,
        hasOverrun,
        hasAddendum,
        blockedByGates,
        legalReferences,
      } = req.body || {};

      if (
        typeof stepCode !== 'string' ||
        !stepCode.trim() ||
        typeof gateCode !== 'string' ||
        !gateCode.trim()
      ) {
        return res.status(400).json({
          error:
            'Dữ liệu đầu vào không hợp lệ (HTTP 400): Bắt buộc cung cấp stepCode và gateCode.',
        });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Chưa cấu hình dịch vụ phân tích AI trên máy chủ.',
        });
      }

      const prompt = `Bạn là Hệ thống 03 Micro-Agent Kiểm toán Tuân thủ Đầu tư Công (AIPM OS x ĐẠI SƠN):
1. GatekeeperAgent (Kiểm soát Gate tiên quyết G0-G16)
2. LegalCrossCheckAgent (Đối chiếu thẩm quyền phê duyệt theo Luật Đầu tư công 58/2024/QH15 & Luật Xây dựng 135/2025/QH15)
3. AuditDeductionAgent (Kiểm soát phát sinh vượt hợp đồng & nguy cơ xuất toán)

Thông tin bước thực hiện đang thẩm định:
- Mã bước: ${stepCode} (Thuộc Gate: ${gateCode})
- Tên bước hồ sơ: ${stepName}
- Cơ quan lập/trình: ${governingBody}
- Cơ quan thẩm định/phê duyệt chuẩn luật định: ${inspectionBody}
- Thẩm quyền trích xuất từ hồ sơ đính kèm: ${attachedAuthority || 'Chưa đính kèm'}
- Các Gate tiên quyết đang bị chặn: ${
        Array.isArray(blockedByGates) && blockedByGates.length > 0
          ? blockedByGates.join(', ')
          : 'Không có (Đã vượt qua)'
      }
- Phát sinh khối lượng ngoài hợp đồng: ${hasOverrun ? 'CÓ' : 'KHÔNG'} | Đã có Phụ lục HĐ & chấp thuận Người QĐĐT: ${
        hasAddendum ? 'CÓ' : 'CHƯA CÓ'
      }
- Căn cứ pháp lý: ${JSON.stringify(legalReferences || [])}

Hãy trả về nhận định tổng hợp ngắn gọn (tối đa 130 từ) gồm 3 dòng rõ ràng cho 3 Micro-Agent (GatekeeperAgent, LegalCrossCheckAgent, AuditDeductionAgent) và kết luận hành động bắt buộc cho Ban QLDA.`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      return res.json({
        executiveSummary:
          response.text ||
          'Đã hoàn tất thẩm định 3 Micro-Agent (Gatekeeper, LegalCrossCheck, AuditDeduction).',
      });
    } catch (error: unknown) {
      return res.status(500).json({
        error: sanitizeServerError(error, 'Lỗi kết nối dịch vụ thẩm định Stage-Gate.'),
      });
    }
  });

  // 5. Endpoint Pipeline OCR Đa phương thức & Bóc tách Hồ sơ PDF/DOCX/Scan Thực tế (Gemini Multimodal Document AI)
  app.post('/api/ocr-dossier-extract', async (req, res) => {
    try {
      const {
        filename = 'Ho_so_dinh_kem.pdf',
        mimeType = 'application/pdf',
        base64Data = '',
        rawText = '',
        stepCode = '',
        stepName = '',
        expectedAuthority = '',
        mode = 'stage_gate_dossier',
      } = req.body || {};

      if (
        (typeof base64Data !== 'string' || !base64Data.trim()) &&
        (typeof rawText !== 'string' || !rawText.trim())
      ) {
        return res.status(400).json({
          error:
            'Dữ liệu đầu vào không hợp lệ (HTTP 400): Bắt buộc cung cấp tệp đính kèm (base64Data) hoặc nội dung văn bản (rawText).',
        });
      }

      if (typeof base64Data === 'string' && base64Data.trim()) {
        if (!hasValidDocumentMagicBytes(base64Data.trim())) {
          return res.status(400).json({
            error:
              'Tệp tải lên không hợp lệ (HTTP 400): Chữ ký byte (Magic Bytes) không khớp định dạng PDF, DOCX, PNG, JPEG hoặc WEBP.',
          });
        }
      }

      let extractedTextFromDocxOrRaw = rawText || '';

      // Nếu là tệp Word (.docx), giải nén và bóc tách toàn văn UTF-8 bằng mammoth trên server
      const isDocx =
        mimeType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        /\.docx$/i.test(filename);

      if (isDocx && base64Data) {
        try {
          const buffer = Buffer.from(base64Data, 'base64');
          const mammothResult = await mammoth.extractRawText({ buffer });
          extractedTextFromDocxOrRaw = mammothResult.value.trim();
        } catch (docxErr) {
          console.error('Lỗi đọc DOCX bằng mammoth:', docxErr);
        }
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Chưa cấu hình dịch vụ OCR AI trên máy chủ.',
        });
      }

      const systemPrompt = `Bạn là Hệ thống Document AI & OCR Đa phương thức chuyên biệt cho Hành chính Nhà nước & Quản lý Dự án Đầu tư Xây dựng Việt Nam (ĐẠI SƠN LEGAL × AIPM OS), tuân thủ Nghị định 30/2020/NĐ-CP về công tác văn thư, Luật Đầu tư công 58/2024/QH15 và Luật Xây dựng 135/2025/QH15.
Nhiệm vụ của bạn là đọc tệp hồ sơ đính kèm (PDF bản quét có dấu đỏ, ảnh chụp văn bản, hoặc nội dung tệp Word .DOCX) của tệp "${filename}" ${
        stepCode
          ? `thuộc bước tuân thủ ${stepCode} (${stepName}) — Cơ quan thẩm định/phê duyệt chuẩn luật định: "${expectedAuthority}"`
          : ''
      } (Chế độ: ${mode}) và bóc tách chính xác toàn bộ siêu dữ liệu hành chính cũng như nội dung điều khoản.`;

      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      const supportedMultimodalMimes = new Set([
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ]);

      const normalizedMime =
        mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;

      if (base64Data && supportedMultimodalMimes.has(normalizedMime)) {
        parts.push({
          inlineData: {
            mimeType: normalizedMime,
            data: base64Data,
          },
        });
      }

      if (extractedTextFromDocxOrRaw) {
        parts.push({
          text: `Nội dung văn bản bóc tách từ tệp "${filename}":\n"""\n${extractedTextFromDocxOrRaw.slice(
            0,
            60000
          )}\n"""`,
        });
      }

      parts.push({
        text: `Hãy trích xuất chính xác các trường JSON theo schema yêu cầu:
1. extracted_doc_no: Số và ký hiệu văn bản chuẩn hành chính (VD: "168/QĐ-UBND", "289/QĐ-BXD", "135/2025/QH15"). Nếu không tìm thấy rõ số hiệu trên văn bản/con dấu, trả về "KHONG_XAC_DINH" — tuyệt đối không suy đoán số hiệu từ tên tệp "${filename}".
2. extracted_doc_title: Tên loại và trích yếu nội dung văn bản (VD: "Quyết định phê duyệt Báo cáo nghiên cứu khả thi dự án...").
3. extracted_doc_type: Phân loại đúng 1 trong các giá trị: "Luật", "Nghị định", "Thông tư", "Quyết định", "Quy chuẩn QCVN", "Bộ luật", "Tài liệu".
4. extracted_field: Phân loại đúng 1 trong các lĩnh vực: "Xây dựng", "Đấu thầu", "Đất đai", "PCCC", "Tài chính", "Dữ liệu cá nhân & An ninh mạng", "Thương mại điện tử", "Doanh nghiệp & Đầu tư", "Kế toán & Kiểm toán", "Thuế & Phí", "Lao động & BHXH", "Thủ tục hành chính".
5. extracted_issue_date: Ngày ban hành định dạng YYYY-MM-DD (VD: "2026-11-08").
6. extracted_effective_date: Ngày có hiệu lực định dạng YYYY-MM-DD.
7. extracted_authority: Cơ quan ban hành hoặc cơ quan ký phê duyệt trên dấu đỏ/tiêu đề (VD: "Bộ Xây dựng", "UBND cấp tỉnh", "Sở Xây dựng", "Người quyết định đầu tư").
8. extracted_signer: Họ tên và chức vụ người ký (VD: "KT. Bộ trưởng - Thứ trưởng Nguyễn Văn A").
9. total_investment_amount: Tổng mức đầu tư, giá trị dự toán hoặc giá trị hợp đồng nếu văn bản có đề cập (VD: "1.450.000.000.000 VNĐ" hoặc "Không đề cập").
10. capital_source: Nguồn vốn dự án nếu có (VD: "Vốn đầu tư công ngân sách Trung ương giai đoạn 2026-2030" hoặc "Không đề cập").
11. has_variation_overrun: true nếu nội dung văn bản/biên bản đề cập đến việc phát sinh khối lượng vượt hợp đồng, điều chỉnh vượt tổng mức đầu tư hoặc vượt dự toán gói thầu; ngược lại false.
12. has_approved_addendum: true nếu văn bản xác nhận đã ký Phụ lục hợp đồng hợp lệ hoặc đã có quyết định phê duyệt điều chỉnh của Người quyết định đầu tư; false nếu chưa có phụ lục/chấp thuận mà đã thi công/nghiệm thu phát sinh.
13. cited_legal_bases: Danh sách các số hiệu văn bản quy phạm pháp luật được viện dẫn trong phần "Căn cứ..." (VD: ["58/2024/QH15", "135/2025/QH15", "22/2023/QH15", "15/2021/NĐ-CP"]). Chỉ liệt kê số hiệu chuẩn gọn.
14. ocr_full_text: Toàn văn nội dung văn bản đã OCR/bóc tách, giữ nguyên cấu trúc dòng "Chương I...", "Điều 1. ...", "Điều 2. ..." để hệ thống tự động phân rã mục lục SSoT hoặc rà soát hợp đồng.
15. ocr_confidence_note: Nhận định chuyên môn ngắn gọn (1-2 câu) về thể thức văn bản theo Nghị định 30/2020/NĐ-CP và đối chiếu thẩm quyền ký ("${expectedAuthority || 'Theo quy định pháp luật'}").`,
      });

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: { parts },
        config: {
          systemInstruction: systemPrompt,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extracted_doc_no: { type: Type.STRING },
              extracted_doc_title: { type: Type.STRING },
              extracted_doc_type: { type: Type.STRING },
              extracted_field: { type: Type.STRING },
              extracted_issue_date: { type: Type.STRING },
              extracted_effective_date: { type: Type.STRING },
              extracted_authority: { type: Type.STRING },
              extracted_signer: { type: Type.STRING },
              total_investment_amount: { type: Type.STRING },
              capital_source: { type: Type.STRING },
              has_variation_overrun: { type: Type.BOOLEAN },
              has_approved_addendum: { type: Type.BOOLEAN },
              cited_legal_bases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              ocr_full_text: { type: Type.STRING },
              ocr_confidence_note: { type: Type.STRING },
            },
            required: [
              'extracted_doc_no',
              'extracted_doc_title',
              'extracted_doc_type',
              'extracted_field',
              'extracted_issue_date',
              'extracted_effective_date',
              'extracted_authority',
              'extracted_signer',
              'total_investment_amount',
              'capital_source',
              'has_variation_overrun',
              'has_approved_addendum',
              'cited_legal_bases',
              'ocr_full_text',
              'ocr_confidence_note',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        ocrResult: {
          ...parsed,
          ocr_full_text:
            parsed.ocr_full_text || extractedTextFromDocxOrRaw || '',
        },
      });
    } catch (error: unknown) {
      return res.status(500).json({
        error: sanitizeServerError(error, 'Lỗi bóc tách OCR Đa phương thức.'),
      });
    }
  });

  // 6. Endpoint Mở rộng & Tải Trọn Vẹn Toàn Văn các Chương/Điều cho Văn bản SSoT
  app.post('/api/expand-full-document', async (req, res) => {
    try {
      const {
        docNumber = '',
        docTitle = '',
        docType = 'Văn bản',
        issuingBody = '',
        field = '',
        existingArticleNos = [],
      } = req.body || {};

      if (typeof docNumber !== 'string' || !docNumber.trim() || typeof docTitle !== 'string' || !docTitle.trim()) {
        return res.status(400).json({
          error:
            'Dữ liệu đầu vào không hợp lệ (HTTP 400): Bắt buộc cung cấp docNumber và docTitle.',
        });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Chưa cấu hình dịch vụ AI trên máy chủ.',
        });
      }

      const prompt = `Bạn là Hệ thống Biên tập Pháp điển hóa Quốc gia thuộc Hệ sinh thái Pháp lý ĐẠI SƠN (ĐẠI SƠN LEGAL SSoT).
Người dùng đang đọc văn bản:
- Loại & Số hiệu: ${docType} số ${docNumber}
- Tên văn bản: "${docTitle}"
- Cơ quan ban hành: ${issuingBody} | Lĩnh vực: ${field}
- Các điều khoản đã có sẵn trong kho: ${
        Array.isArray(existingArticleNos) && existingArticleNos.length > 0
          ? existingArticleNos.join(', ')
          : 'Chưa có'
      }

Hãy biên tập bổ sung đầy đủ hệ thống các Chương và Điều khoản trọng yếu từ Chương I (Quy định chung, Phạm vi điều chỉnh, Giải thích từ ngữ) qua các Chương nội dung chuyên môn đến Chương cuối (Trách nhiệm thi hành, Điều khoản chuyển tiếp, Hiệu lực thi hành — tổng cộng từ 8 đến 12 điều khoản chi tiết, đầy đủ các khoản 1, 2, 3...) để người dùng có thể đọc liền mạch trọn vẹn cấu trúc văn bản hành chính Việt Nam. Không lặp lại các số Điều đã có trong danh sách "${
        Array.isArray(existingArticleNos) ? existingArticleNos.join(', ') : ''
      }".`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                chapter_no: {
                  type: Type.STRING,
                  description: 'VD: Chương I, Chương II, Chương III...',
                },
                chapter_title: {
                  type: Type.STRING,
                  description: 'Tên chương viết hoa chuẩn văn bản pháp luật',
                },
                article_no: {
                  type: Type.STRING,
                  description: 'VD: Điều 1, Điều 2, Điều 3...',
                },
                article_title: {
                  type: Type.STRING,
                  description: 'Tiêu đề điều khoản',
                },
                content: {
                  type: Type.STRING,
                  description:
                    'Nội dung toàn văn chi tiết từng khoản 1, 2, 3 và điểm a, b, c của điều khoản',
                },
              },
              required: [
                'chapter_no',
                'chapter_title',
                'article_no',
                'article_title',
                'content',
              ],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      const taggedDraftArticles = Array.isArray(parsed)
        ? parsed.map((item: Record<string, unknown>) => ({
            ...item,
            is_ai_draft: true,
          }))
        : [];
      return res.json({
        authenticity_tier: 'AI_REFERENCE_ONLY',
        warning:
          'Bản nháp tham khảo do AI tổng hợp — được lưu tại phân vùng cách ly AI_DRAFTS, tuyệt đối không ghi đè kho VERIFIED_SSOT.',
        articles: taggedDraftArticles,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        error: sanitizeServerError(error, 'Lỗi tải mở rộng toàn văn điều khoản.'),
      });
    }
  });

  // 7. Endpoint Prompt Engine AI Đối Soát Chéo Điều - Khoản - Điểm Liên Luật & Cảnh Báo Rủi Ro Xuất Toán
  app.post('/api/cross-law-matrix', async (req, res) => {
    try {
      const {
        docNumber = '',
        docTitle = '',
        field = '',
        projectStage = '',
        articleNo = '',
        articleTitle = '',
        articleContent = '',
        amendedClausesSummary = '',
        relatedCorpusDocs = [],
      } = req.body || {};

      if (
        typeof docNumber !== 'string' ||
        !docNumber.trim() ||
        typeof articleNo !== 'string' ||
        !articleNo.trim()
      ) {
        return res.status(400).json({
          error:
            'Dữ liệu đầu vào không hợp lệ (HTTP 400): Bắt buộc cung cấp docNumber và articleNo.',
        });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Chưa cấu hình dịch vụ phân tích AI trên máy chủ.',
        });
      }

      const corpusListText = Array.isArray(relatedCorpusDocs)
        ? relatedCorpusDocs
            .map(
              (d: { id?: string; doc_number?: string; title?: string; field?: string }) =>
                `- [${d.id}] ${d.doc_number} (${d.field}): ${d.title}`
            )
            .join('\n')
        : '';

      const prompt = `Bạn là Hệ thống Prompt Engine AI Đối Soát Chéo Điều - Khoản - Điểm Liên Luật thuộc Hệ sinh thái Pháp lý ĐẠI SƠN (ĐẠI SƠN LEGAL SSoT × Kiểm toán Đầu tư Xây dựng).
Người dùng đang thẩm định chuyên sâu điều khoản sau tại Cột 3:
- Văn bản gốc đang xem: ${docNumber} — "${docTitle}" (Lĩnh vực: ${field} | Giai đoạn WBS: ${projectStage})
- Điều khoản: ${articleNo}. ${articleTitle}
- Nội dung toàn văn Điều khoản:
"""
${articleContent}
"""
${
  amendedClausesSummary
    ? `- Chú dẫn phả hệ sửa đổi tại chỗ (In-place Diff):\n${amendedClausesSummary}`
    : ''
}

Danh mục các văn bản trụ cột trong kho SSoT để đối chiếu liên luật:
${corpusListText}

Hãy lập MA TRẬN ĐỐI SOÁT CHÉO LIÊN LUẬT (liên kết trực tiếp ${articleNo} của ${docNumber} với các quy định tương ứng tại:
1. Luật Xây dựng 135/2025/QH15 & Nghị định 175/2024/NĐ-CP
2. Luật Đất đai 31/2024/QH15
3. Luật Đấu thầu 22/2023/QH15 (sửa đổi bởi Luật 57/2024/QH15) & Nghị định 24/2024/NĐ-CP
4. Luật Đầu tư công 58/2024/QH15, Luật Kế toán 88/2015/QH13 (sửa đổi bởi 56/2024/QH15, đồng bộ Luật Quản lý thuế 108/2025/QH15) hoặc Nghị định chuyên ngành liên quan).

Đồng thời phân tích rõ CẢNH BÁO RỦI RO XUẤT TOÁN khi Kiểm toán Nhà nước, Thanh tra hoặc Kho bạc Nhà nước hậu kiểm hồ sơ.`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executive_conclusion: {
                type: Type.STRING,
                description:
                  'Nhận định tổng quát (2-3 câu) về vị trí pháp lý và điểm giao thoa liên luật của Điều khoản này.',
              },
              deduction_risk_level: {
                type: Type.STRING,
                description: 'Chỉ nhận 1 trong 3 giá trị: "RẤT CAO", "CAO", hoặc "TRUNG BÌNH"',
              },
              deduction_risk_warning: {
                type: Type.STRING,
                description:
                  'Cảnh báo chi tiết nguy cơ bị xuất toán, từ chối thanh toán vốn đầu tư hoặc xử phạt hành chính nếu áp dụng sai hoặc dùng quy định cũ đã hết hiệu lực.',
              },
              matrix_items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    target_law_domain: {
                      type: Type.STRING,
                      description:
                        'VD: "Luật Xây dựng", "Luật Đất đai", "Luật Đấu thầu", "Luật Đầu tư công & Ngân sách", "Nghị định hướng dẫn"',
                    },
                    target_doc_id: {
                      type: Type.STRING,
                      description: 'ID văn bản trong kho SSoT nếu khớp (VD: doc-lxd-135-2025)',
                    },
                    target_doc_number: {
                      type: Type.STRING,
                      description: 'Số hiệu văn bản đối chiếu (VD: 135/2025/QH15, 31/2024/QH15, 22/2023/QH15)',
                    },
                    target_clause_ref: {
                      type: Type.STRING,
                      description: 'Điều, Khoản, Điểm cụ thể của văn bản đích',
                    },
                    relation_nature: {
                      type: Type.STRING,
                      description:
                        '1 trong 4 nhãn: "ĐỒNG BỘ BẮT BUỘC", "ĐIỀU KIỆN TIÊN QUYẾT", "GIAO THOA THẨM QUYỀN", "RỦI RO XUNG ĐỘT HỒ SƠ"',
                    },
                    cross_analysis: {
                      type: Type.STRING,
                      description:
                        'Phân tích sắc bén mối liên hệ giữa Điều đang xem và quy định tại văn bản đích',
                    },
                    audit_evidence_required: {
                      type: Type.STRING,
                      description:
                        'Hồ sơ, biên bản, chứng từ pháp lý bắt buộc phải khớp nối giữa 2 luật',
                    },
                  },
                  required: [
                    'target_law_domain',
                    'target_doc_number',
                    'target_clause_ref',
                    'relation_nature',
                    'cross_analysis',
                    'audit_evidence_required',
                  ],
                },
              },
              mandatory_checklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  '3 đến 5 đầu việc kiểm tra bắt buộc dành cho Ban QLDA / Kế toán trưởng / Pháp chế trước khi trình ký hoặc giải ngân.',
              },
            },
            required: [
              'executive_conclusion',
              'deduction_risk_level',
              'deduction_risk_warning',
              'matrix_items',
              'mandatory_checklist',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ result: parsed });
    } catch (error: unknown) {
      return res.status(500).json({
        error: sanitizeServerError(error, 'Lỗi phân tích ma trận đối soát chéo liên luật.'),
      });
    }
  });

  // 8. Endpoint Kiểm tra sức khỏe hệ thống & trạng thái kho SSoT (Health Check)
  app.get('/api/health', (_req, res) => {
    return res.json({
      status: 'ok',
      platform: 'ĐẠI SƠN LEGAL — Legal Knowledge & Reasoning Platform',
      architecture: 'Clean Architecture · 4-Gate Verified',
      timestamp: new Date().toISOString(),
    });
  });

  // 9. Endpoint Suy luận Pháp lý 6 Bước IRAC+ (3 Chế độ: JUDICIAL_ANALYSIS | LEGAL_COUNSEL | LEGAL_AUDIT)
  app.post('/api/legal-reasoning', async (req, res) => {
    try {
      const {
        mode = 'LEGAL_AUDIT',
        referenceDate = '2026-08-15',
        milestoneInitiationDate = '',
        caseTitle = '',
        facts = [],
        rulesContext = [],
      } = req.body || {};

      const allowedModes = new Set(['JUDICIAL_ANALYSIS', 'LEGAL_COUNSEL', 'LEGAL_AUDIT']);
      if (
        typeof caseTitle !== 'string' ||
        !caseTitle.trim() ||
        !allowedModes.has(String(mode)) ||
        !Array.isArray(facts) ||
        facts.length === 0
      ) {
        return res.status(400).json({
          error:
            'Dữ liệu đầu vào không hợp lệ (HTTP 400): Bắt buộc cung cấp caseTitle, mode hợp lệ và danh sách sự kiện thực tế (facts).',
        });
      }

      const combinedInputText = `${caseTitle} ${facts.map((f: { description?: string }) => f?.description || '').join(' ')}`;
      const outOfCorpusMatch =
        /bộ luật hàng hải|luật hàng hải|tàu biển|sở hữu trí tuệ|nhãn hiệu|bản quyền tác giả|hôn nhân và gia đình|ly hôn|hàng không dân dụng/i.test(
          combinedInputText
        );
      if (outOfCorpusMatch || (Array.isArray(rulesContext) && rulesContext.length === 0)) {
        return res.json({
          abstained: true,
          conclusion_status: 'ABSTAINED_INSUFFICIENT_SSOT',
          aiReasoning: {
            core_legal_question: `[TỪ CHỐI KẾT LUẬN — ABSTAINED_INSUFFICIENT_SSOT] Hồ sơ "${caseTitle}" thuộc lĩnh vực chưa nạp văn bản chính thống trong kho SSoT hiện tại.`,
            sub_issues: [
              'Kho dữ liệu SSoT chưa có văn bản quy phạm pháp luật chuyên ngành điều chỉnh trực tiếp tình huống này.',
            ],
            normative_elements: [
              'Hệ thống kích hoạt nguyên tắc Epistemic Humility: Không suy diễn quy phạm pháp luật ngoài kho SSoT.',
            ],
            strict_conditions: [
              'Bắt buộc nạp bổ sung văn bản pháp luật chính thống vào kho SSoT trước khi thực hiện suy luận.',
            ],
            counterarguments: [
              'Mọi nhận định suy đoán khi thiếu văn bản gốc trong SSoT đều vi phạm nguyên tắc Zero Hallucination.',
            ],
            rebuttal_or_mitigation_conditions: [
              'Sử dụng chức năng "+ Nạp văn bản" để bổ sung văn bản chuyên ngành vào SSoT.',
            ],
            definitive_conclusion:
              '[ABSTAINED_INSUFFICIENT_SSOT] Từ chối đưa ra kết luận pháp lý do chưa đủ căn cứ văn bản trong kho SSoT.',
            recommended_actions: [
              'Nạp bổ sung văn bản quy phạm pháp luật chuyên ngành có liên quan vào kho SSoT.',
            ],
          },
        });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error:
            'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Hệ thống sử dụng Bộ Suy luận Tất định IRAC+ (Deterministic Baseline) từ kho SSoT.',
        });
      }

      const modeRoleMap: Record<string, string> = {
        JUDICIAL_ANALYSIS:
          'Thẩm phán / Trọng tài viên — Phân tích khách quan, trung lập, đánh giá chứng cứ hai chiều và xác định thời điểm hiệu lực.',
        LEGAL_COUNSEL:
          'Luật sư Tư vấn & Pháp chế Dự án — Bảo vệ quyền lợi hợp pháp, nhận diện rủi ro hợp đồng và thiết kế phương án phòng ngừa.',
        LEGAL_AUDIT:
          'Kiểm toán viên Nhà nước / Thanh tra viên — Đối chiếu điều kiện tiên quyết, kiểm soát thanh quyết toán và cảnh báo rủi ro xuất toán.',
      };

      const prompt = `Bạn là Hệ thống Suy luận Pháp lý IRAC+ của ĐẠI SƠN LEGAL.
Chế độ vận hành: ${mode} (${modeRoleMap[mode] || modeRoleMap.LEGAL_AUDIT})
Ngày mốc sự kiện pháp lý (Point-in-Time Reference Date): ${referenceDate}
Ngày phê duyệt dự án / khởi tạo thủ tục ban đầu: ${milestoneInitiationDate || 'Không khai báo'}
Tên hồ sơ vụ việc: "${caseTitle}"

Danh sách Sự kiện & Chứng cứ thực tế (Facts):
${JSON.stringify(facts, null, 2)}

Danh sách Quy phạm Pháp luật đã được PointInTimeResolver xác định hiệu lực tại ngày ${referenceDate}:
${JSON.stringify(rulesContext, null, 2)}

NGUYÊN TẮC BẤT BIẾN:
1. Chỉ được viện dẫn các số hiệu văn bản và Điều/Khoản có trong danh sách Quy phạm Pháp luật bên trên. Không tự bịa số hiệu văn bản hoặc điều khoản ngoài danh sách.
2. Trả về đúng cấu trúc JSON phục vụ 6 bước IRAC+ (Issue, Interpretation, Application, Counterargument, Conclusion).`;

      const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              core_legal_question: { type: Type.STRING },
              sub_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
              normative_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
              strict_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
              counterarguments: { type: Type.ARRAY, items: { type: Type.STRING } },
              rebuttal_or_mitigation_conditions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              definitive_conclusion: { type: Type.STRING },
              recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'core_legal_question',
              'sub_issues',
              'normative_elements',
              'strict_conditions',
              'counterarguments',
              'rebuttal_or_mitigation_conditions',
              'definitive_conclusion',
              'recommended_actions',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ aiReasoning: parsed });
    } catch (error: unknown) {
      return res.status(500).json({
        error: sanitizeServerError(error, 'Lỗi khi thực thi Suy luận Pháp lý IRAC+.'),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ĐẠI SƠN Legal Ecosystem Server listening on http://localhost:${PORT}`);
  });
}

startServer();
