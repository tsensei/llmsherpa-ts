import { LayoutPDFReader } from "./FileReader.js";
import { URL } from "url";
class LLMSherpaFileLoader {
    url;
    strategy;
    filePath;
    validStrategies = ["sections", "chunks", "html", "text"];
    constructor(filePath, newIndentParser = true, applyOcr = true, strategy = "chunks", llmsherpaApiUrl = "http://localhost:5010/api/parseDocument?renderFormat=all") {
        if (!this.validStrategies.includes(strategy)) {
            throw new Error(`Invalid strategy: ${strategy}, must be one of ${this.validStrategies.join(", ")}`);
        }
        this.url = new URL(llmsherpaApiUrl);
        this.validateLLMSherpaUrl(newIndentParser, applyOcr);
        this.strategy = strategy;
        this.filePath = filePath;
    }
    validateLLMSherpaUrl(newIndentParser, applyOcr) {
        if (!this.url.pathname.includes("/api/parseDocument") &&
            !this.url.pathname.includes("/api/document/developer/parseDocument")) {
            throw new Error(`Invalid LLMSherpa URL: ${this.url.toString()}`);
        }
        this.url.searchParams.set("renderFormat", "all");
        if (newIndentParser) {
            this.url.searchParams.set("useNewIndentParser", "true");
        }
        if (applyOcr) {
            this.url.searchParams.set("applyOcr", "yes");
        }
    }
    async load() {
        const layoutPDFReader = new LayoutPDFReader(this.url.toString());
        const doc = await layoutPDFReader.readPdf(this.filePath);
        switch (this.strategy) {
            case "sections":
                return doc.sections().map((section, _sectionNum) => ({
                    pageContent: section.toText(),
                    metadata: {
                        source: this.filePath,
                        pageNumber: section.pageIdx,
                    },
                }));
            case "chunks":
                return doc.chunks().map((chunk, _chunkNum) => ({
                    pageContent: chunk.toContextText(),
                    metadata: {
                        source: this.filePath,
                        pageNumber: chunk.pageIdx,
                    },
                }));
            case "html":
                return [
                    {
                        pageContent: doc.toHtml(),
                        metadata: {
                            source: this.filePath,
                        },
                    },
                ];
            case "text":
                return [
                    {
                        pageContent: doc.toText(),
                        metadata: {
                            source: this.filePath,
                        },
                    },
                ];
            default:
                throw new Error("Unsupported strategy");
        }
    }
}
export { LLMSherpaFileLoader };
//# sourceMappingURL=LLMSherpaFileLoader.js.map