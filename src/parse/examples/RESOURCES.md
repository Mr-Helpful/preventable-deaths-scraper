# Resources for PDF parsing

This is intended to keep track of current resources/sources for parsing table from PDFs.

| Purpose | Source | Notes |
|:--------|:-------|:------|
| Spaces are ~.25em | [stackoverflow](https://stackoverflow.com/questions/38359343/calculate-the-width-in-pixel-of-white-space-given-certain-font-size-and-font-fam) | This is an assumption |
| Bounding boxes | [gh issues](https://github.com/mozilla/pdf.js/issues/5643) | Method seems off by a scale factor<br>(which doesn't really matter)<br>Also goes over pdf transforms |
| PDF.js Page API | [PDF.js docs](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html) | These docs are a "draft" and rather incomplete |
| npm PDF.js | [npm package](https://www.npmjs.com/package/pdfjs-dist) | We need to use the "legacy" build |
