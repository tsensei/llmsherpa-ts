import { LayoutPDFReader } from "./FileReader.js";

import { URL } from "url";

interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

type Strategy = "sections" | "chunks" | "html" | "text";

class LLMSherpaFileLoader {
  private url: URL;
  private strategy: string;
  private filePath: string;

  private validStrategies: Strategy[] = ["sections", "chunks", "html", "text"];

  constructor(
    filePath: string,
    newIndentParser: boolean = true,
    applyOcr: boolean = true,
    strategy: Strategy = "chunks",
    llmsherpaApiUrl: string = "http://localhost:5010/api/parseDocument?renderFormat=all"
  ) {
    if (!this.validStrategies.includes(strategy)) {
      throw new Error(
        `Invalid strategy: ${strategy}, must be one of ${this.validStrategies.join(
          ", "
        )}`
      );
    }

    this.url = new URL(llmsherpaApiUrl);
    this.validateLLMSherpaUrl(newIndentParser, applyOcr);

    this.strategy = strategy;
    this.filePath = filePath;
  }

  private validateLLMSherpaUrl(newIndentParser: boolean, applyOcr: boolean) {
    if (
      !this.url.pathname.includes("/api/parseDocument") &&
      !this.url.pathname.includes("/api/document/developer/parseDocument")
    ) {
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

  public async load(): Promise<Document[]> {
    const layoutPDFReader = new LayoutPDFReader(this.url.toString());

    const doc = await layoutPDFReader.readPdf(this.filePath);

    switch (this.strategy) {
      case "sections":
        return doc.sections().map((section: any, _sectionNum: number) => ({
          pageContent: section.toText(),
          metadata: {
            source: this.filePath,
            pageNumber: section.pageIdx,
          },
        }));
      case "chunks":
        return doc.chunks().map((chunk: any, _chunkNum: number) => ({
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
