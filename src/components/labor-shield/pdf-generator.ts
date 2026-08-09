"use client";

/**
 * PDF 생성 유틸리티 - 클라이언트 사이드 전용
 * 서버 번들에 포함되지 않도록 별도 파일로 분리
 */

/**
 * 지정된 HTML 요소를 캡처하여 PDF Blob으로 변환
 * @param element HTML 요소 (ref.current)
 * @returns PDF Blob
 */
export async function generateContractPdfBlob(element: HTMLElement): Promise<Blob> {
  const html2canvas = (await import('html2canvas')).default;
  // 해상도를 높여 선명하게 캡처 (scale: 2)
  const canvas = await html2canvas(element, { 
    scale: 2, 
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });
  
  const imgData = canvas.toDataURL('image/png');
  
  const jsPDF = (await import('jspdf')).default;
  // A4 기준 mm (210 x 297)
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
  return pdf.output('blob');
}
