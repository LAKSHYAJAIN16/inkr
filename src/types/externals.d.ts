declare module 'html2pdf.js' {
  const html2pdf: any;
  export default html2pdf;
}

declare module 'html-docx-js/dist/html-docx' {
  const htmlDocx: {
    asBlob: (html: string, options?: any) => Blob;
  };
  export default htmlDocx;
}
