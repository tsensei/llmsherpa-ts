import axios from "axios";
import * as fs from "fs";
import { URL } from "url";
import FormData from "form-data";
import { SherpaDocument } from "./LayoutReader.js";
class LayoutPDFReader {
    parserApiUrl;
    constructor(parserApiUrl) {
        this.parserApiUrl = parserApiUrl;
    }
    async downloadPdf(pdfUrl) {
        const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36";
        const response = await axios.get(pdfUrl, {
            responseType: "arraybuffer",
            headers: { "User-Agent": userAgent },
        });
        const url = new URL(pdfUrl);
        const fileName = url.pathname.split("/").pop() ?? "default.pdf";
        return [fileName, response.data];
    }
    async parsePdf(pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile[1], pdfFile[0]);
        const response = await axios.post(this.parserApiUrl, formData, {
            headers: formData.getHeaders(),
        });
        return response.data;
    }
    async readPdf(pathOrUrl, contents) {
        let pdfFile;
        if (contents) {
            const fileName = pathOrUrl.split("/").pop() ?? "default.pdf";
            pdfFile = [fileName, contents];
        }
        else {
            const isUrl = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");
            if (isUrl) {
                pdfFile = await this.downloadPdf(pathOrUrl);
            }
            else {
                const fileData = fs.readFileSync(pathOrUrl);
                const fileName = pathOrUrl.split("/").pop() ?? "default.pdf";
                pdfFile = [fileName, fileData];
            }
        }
        const parsedData = await this.parsePdf(pdfFile);
        return new SherpaDocument(parsedData["return_dict"]["result"]["blocks"]);
    }
}
export { LayoutPDFReader };
//# sourceMappingURL=FileReader.js.map